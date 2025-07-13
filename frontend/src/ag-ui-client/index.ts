import {
  AbstractAgent,
  AgentConfig,
  BaseEvent,
  EventType,
  RunAgentInput,
  RunErrorEvent,
  StateSnapshotEvent,
  TextMessageChunkEvent,
  ToolCallChunkEvent,
  ToolCallResultEvent,
} from "@ag-ui/client";
import {
  A2AClient,
  SendMessageResponse,
  SendMessageSuccessResponse,
} from "@a2a-js/sdk";
import { Observable } from "rxjs";
import { LanguageModel, processDataStream, streamText, tool } from "ai";
import {
  convertMessagesToVercelAISDKMessages,
  convertToolToVercelAISDKTools,
  createSystemPrompt,
} from "./utils";
import { z } from "zod";
import { randomUUID } from "crypto";

export interface A2AAgentConfig extends AgentConfig {
  agentUrls: string[];
  instructions?: string;
  model: LanguageModel;
}

export class A2AClientAgent extends AbstractAgent {
  agentClients: A2AClient[];
  instructions?: string;
  model: LanguageModel;

  constructor(config: A2AAgentConfig) {
    super(config);
    this.instructions = config.instructions;
    this.agentClients = config.agentUrls.map((url) => new A2AClient(url));
    this.model = config.model;
  }

  protected run(input: RunAgentInput): Observable<BaseEvent> {
    const state: any = {
      a2aMessages: [],
      packingState: {
        items: [
          {
            id: "passport",
            name: "Passport",
            category: "essentials",
            priority: "essential",
            packed: false,
          },
          {
            id: "phone",
            name: "Phone",
            category: "essentials",
            priority: "essential",
            packed: false,
          },
          {
            id: "wallet",
            name: "Wallet",
            category: "essentials",
            priority: "essential",
            packed: false,
          },
          {
            id: "tshirts",
            name: "T-Shirts",
            category: "clothing",
            priority: "essential",
            packed: false,
          },
          {
            id: "pants",
            name: "Pants",
            category: "clothing",
            priority: "essential",
            packed: false,
          },
          {
            id: "underwear",
            name: "Underwear",
            category: "clothing",
            priority: "essential",
            packed: false,
          },
          {
            id: "toothbrush",
            name: "Toothbrush",
            category: "toiletries",
            priority: "recommended",
            packed: false,
          },
          {
            id: "shampoo",
            name: "Shampoo",
            category: "toiletries",
            priority: "recommended",
            packed: false,
          },
          {
            id: "deodorant",
            name: "Deodorant",
            category: "toiletries",
            priority: "recommended",
            packed: false,
          },
          {
            id: "charger",
            name: "Charger",
            category: "electronics",
            priority: "essential",
            packed: false,
          },
          {
            id: "camera",
            name: "Camera",
            category: "electronics",
            priority: "recommended",
            packed: false,
          },
          {
            id: "headphones",
            name: "Headphones",
            category: "electronics",
            priority: "optional",
            packed: false,
          },
        ],
        categories: {},
        progress: 0,
        totalPacked: 0,
        totalItems: 12,
      },
    };

    // Helper function to update packing state
    const updatePackingState = (response: string) => {
      // Parse packing state updates from agent responses
      try {
        let stateUpdated = false;

        // Look for explicit state update commands
        if (response.includes("update_packing_state:")) {
          const lines = response.split("\n");
          for (const line of lines) {
            if (line.includes("update_packing_state:")) {
              const parts = line.split(":")[1]?.trim().split(" ");
              if (parts && parts.length >= 2) {
                const action = parts[0]; // "packed" or "unpacked"
                const itemName = parts.slice(1).join(" ");

                // Update item in state
                const item = state.packingState.items.find(
                  (item: any) =>
                    item.name.toLowerCase() === itemName.toLowerCase()
                );
                if (item) {
                  item.packed = action === "packed";
                  stateUpdated = true;
                }
              }
            }
          }
        }

        // Also look for natural language packing updates
        const packingPatterns = [
          /mark\s+(.+?)\s+as\s+packed/gi,
          /(.+?)\s+is\s+now\s+packed/gi,
          /packed\s+(.+?)(?:\s|$|\.)/gi,
          /✓\s*packed[:\s]+(.+?)(?:\s|$|\.)/gi,
        ];

        for (const pattern of packingPatterns) {
          const matches = [...response.matchAll(pattern)];
          for (const match of matches) {
            const itemName = match[1]?.trim();
            if (itemName) {
              const item = state.packingState.items.find(
                (item: any) =>
                  item.name.toLowerCase().includes(itemName.toLowerCase()) ||
                  itemName.toLowerCase().includes(item.name.toLowerCase())
              );
              if (item && !item.packed) {
                item.packed = true;
                stateUpdated = true;
                console.log(
                  `Auto-packed item: ${item.name} (from: ${itemName})`
                );
              }
            }
          }
        }

        if (stateUpdated) {
          // Recalculate totals
          state.packingState.totalPacked = state.packingState.items.filter(
            (item: any) => item.packed
          ).length;
          state.packingState.progress = Math.round(
            (state.packingState.totalPacked / state.packingState.totalItems) *
              100
          );

          console.log(
            `Packing state updated: ${state.packingState.totalPacked}/${state.packingState.totalItems} (${state.packingState.progress}%)`
          );
          return true;
        }
      } catch (error) {
        console.error("Error updating packing state:", error);
      }
      return false;
    };

    return new Observable<BaseEvent>((observer) => {
      const run = async () => {
        try {
          observer.next({
            type: EventType.RUN_STARTED,
            threadId: input.threadId,
            runId: input.runId,
          } as any);

          observer.next({
            type: EventType.STATE_SNAPSHOT,
            snapshot: state,
          } as StateSnapshotEvent);

          const agentCards = await Promise.all(
            this.agentClients.map((client) => client.getAgentCard())
          );

          const agents = Object.fromEntries(
            agentCards.map((card, index) => [
              card.name,
              { client: this.agentClients[index], card },
            ])
          );

          const systemPrompt = createSystemPrompt(
            agentCards,
            this.instructions
          );

          const messages = convertMessagesToVercelAISDKMessages(input.messages);
          if (messages.length && messages[0].role === "system") {
            // remove the first message if it is a system message
            messages.shift();
          }

          messages.unshift({
            role: "system",
            content: systemPrompt,
          });

          const updatePackingStateTool = tool({
            description:
              "Updates the packing state by marking items as packed or unpacked",
            parameters: z.object({
              itemName: z.string().describe("The name of the item to update"),
              packed: z
                .boolean()
                .describe(
                  "Whether the item is packed (true) or unpacked (false)"
                ),
            }),
            async execute({ itemName, packed }) {
              // Update item in state
              const item = state.packingState.items.find(
                (item: any) =>
                  item.name.toLowerCase() === itemName.toLowerCase()
              );
              if (item) {
                item.packed = packed;

                // Recalculate totals
                state.packingState.totalPacked =
                  state.packingState.items.filter(
                    (item: any) => item.packed
                  ).length;
                state.packingState.progress = Math.round(
                  (state.packingState.totalPacked /
                    state.packingState.totalItems) *
                    100
                );

                // Emit state update
                observer.next({
                  type: EventType.STATE_SNAPSHOT,
                  snapshot: state,
                } as StateSnapshotEvent);

                // Also send to packing agent
                const packingAgent = agents["Packing Agent"];
                if (packingAgent) {
                  const message = `update_packing_state: ${
                    packed ? "packed" : "unpacked"
                  } ${itemName}`;
                  await packingAgent.client.sendMessage({
                    message: {
                      kind: "message",
                      messageId: Date.now().toString(),
                      role: "agent",
                      parts: [{ text: message, kind: "text" }],
                    },
                  });
                }

                return `Marked ${itemName} as ${
                  packed ? "packed" : "unpacked"
                }`;
              }
              return `Item "${itemName}" not found`;
            },
          });

          const sendMessageTool = tool({
            description:
              "Sends a task to the agent named `agentName`, including the full conversation context and goal.",
            parameters: z.object({
              agentName: z
                .string()
                .describe("The name of the agent to send the task to."),
              task: z
                .string()
                .describe(
                  "The comprehensive conversation-context summary and goal " +
                    "to be achieved regarding the user inquiry."
                ),
            }),
            async execute({ agentName, task }) {
              state.a2aMessages.push({
                name: "Agent",
                to: agentName,
                message: task,
              });
              observer.next({
                type: EventType.STATE_SNAPSHOT,
                snapshot: state,
              } as StateSnapshotEvent);

              if (!Object.keys(agents).includes(agentName)) {
                return `Agent "${agentName}" not found.`;
              }
              const { client } = agents[agentName];
              const sendResponse: SendMessageResponse =
                await client.sendMessage({
                  message: {
                    kind: "message",
                    messageId: Date.now().toString(),
                    role: "agent",
                    parts: [{ text: task, kind: "text" }],
                  },
                });

              if ("error" in sendResponse) {
                console.error(sendResponse.error);
                return `Error sending message to agent "${agentName}": ${sendResponse.error.message}`;
              }
              const result = (sendResponse as SendMessageSuccessResponse)
                .result;

              if (
                result.kind === "message" &&
                result.parts.length > 0 &&
                result.parts[0].kind === "text"
              ) {
                const responseText = result.parts[0].text;

                state.a2aMessages.push({
                  name: agentName,
                  to: "Agent",
                  message: responseText,
                });

                // Update packing state if this is from the packing agent
                if (
                  agentName === "Packing Agent" ||
                  responseText.includes("update_packing_state:")
                ) {
                  const stateUpdated = updatePackingState(responseText);
                  if (stateUpdated) {
                    console.log("Packing state updated:", state.packingState);
                  }
                }

                observer.next({
                  type: EventType.STATE_SNAPSHOT,
                  snapshot: state,
                } as StateSnapshotEvent);
              }

              return "The agent responded: " + JSON.stringify(result);
            },
          });

          const response = streamText({
            model: this.model,
            messages,
            tools: {
              ...convertToolToVercelAISDKTools(input.tools),
              sendMessage: sendMessageTool,
              updatePackingState: updatePackingStateTool,
            },
            maxSteps: 10,
            toolCallStreaming: true,
          });

          let messageId = randomUUID();

          await processDataStream({
            stream: response.toDataStreamResponse().body!,
            onTextPart: (text) => {
              const event: TextMessageChunkEvent = {
                type: EventType.TEXT_MESSAGE_CHUNK,
                role: "assistant",
                messageId,
                delta: text,
              };
              observer.next(event);
            },
            onFinishMessagePart(streamPart) {
              // reset the messageId
              messageId = randomUUID();
            },
            onToolCallStreamingStartPart(streamPart) {
              const event: ToolCallChunkEvent = {
                type: EventType.TOOL_CALL_CHUNK,
                toolCallId: streamPart.toolCallId,
                parentMessageId: messageId,
                toolCallName: streamPart.toolName,
              };
              observer.next(event);
            },
            onToolCallDeltaPart(streamPart) {
              const event: ToolCallChunkEvent = {
                type: EventType.TOOL_CALL_CHUNK,
                toolCallId: streamPart.toolCallId,
                delta: streamPart.argsTextDelta,
                parentMessageId: messageId,
              };
              observer.next(event);
            },

            // onToolCallPart(streamPart) {
            //   const event: ToolCallChunkEvent = {
            //     type: EventType.TOOL_CALL_CHUNK,
            //     toolCallId: streamPart.toolCallId,
            //     delta: JSON.stringify(streamPart.args),
            //     toolCallName: streamPart.toolName,
            //     parentMessageId: messageId,
            //   };
            //   console.log("[EVENT]", event);
            //   observer.next(event);
            // },
            onToolResultPart(streamPart) {
              const event: ToolCallResultEvent = {
                messageId: randomUUID(),
                type: EventType.TOOL_CALL_RESULT,
                toolCallId: streamPart.toolCallId,
                content:
                  typeof streamPart.result === "string"
                    ? streamPart.result
                    : JSON.stringify(streamPart.result),
              };
              observer.next(event);
            },
          });

          observer.next({
            type: EventType.RUN_FINISHED,
            threadId: input.threadId,
            runId: input.runId,
          } as any);

          observer.complete();
        } catch (error) {
          observer.next({
            type: EventType.RUN_ERROR,
            threadId: input.threadId,
            runId: input.runId,
            message: error instanceof Error ? error.message : "Unknown error",
          } as RunErrorEvent);
          observer.error(error);
        }
      };

      run();
    });
  }
}
