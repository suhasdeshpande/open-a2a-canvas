"use client";
import React, { useEffect, useState } from "react";
import "@copilotkit/react-ui/styles.css";
import {
  CopilotKit,
  useCoAgent,
  useCoAgentStateRender,
  useCopilotChat,
} from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function Home() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      showDevConsole={true}
      agent="theDirtyDogs"
    >
      <AgentCanvas />
    </CopilotKit>
  );
}

interface A2AMessage {
  name: string;
  to: string;
  message: string;
  timestamp?: number;
}

interface A2AState {
  a2aMessages: A2AMessage[];
}

const AgentCanvas = () => {
  const [background, setBackground] = useState<string>(
    "--copilot-kit-background-color"
  );
  const { state } = useCoAgent<A2AState>({ name: "theDirtyDogs" });
  const { isLoading, visibleMessages } = useCopilotChat();

  // Render agent communication state
  useCoAgentStateRender<A2AState>({
    name: "theDirtyDogs",
    render: ({ state }) => {
      if (!state?.a2aMessages || state.a2aMessages.length === 0) {
        return null;
      }

      return (
        <div className="w-full max-w-4xl mx-auto mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium mb-3 text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Agent Communication
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {state.a2aMessages.map((message, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 rounded border-l-2 border-l-gray-300"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-white border text-gray-600">
                        {message.name}
                      </span>
                      <span className="text-gray-400 text-xs">→</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-white border text-gray-600">
                        {message.to}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {message.timestamp
                        ? new Date(message.timestamp).toLocaleTimeString()
                        : "Now"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {message.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    },
  });

  return (
    <div className="h-screen bg-white">
      <ResizablePanelGroup direction="horizontal">
        {/* Left panel - Chat */}
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <div className="relative h-full flex flex-col">
            <div className="flex-1 p-4">
              <CopilotChat
                instructions={
                  "You are the ultimate travel packing coordinator working with specialized travel agents. Help users pack perfectly for any trip by coordinating with expert agents for clothing, personal belongings, documents, research, and packing strategy."
                }
                labels={{
                  title: "🧳 Travel Packing Assistant",
                  initial:
                    "Hi! I'm your travel packing coordinator. I work with expert agents to help you pack perfectly for any trip!\n\n🌍 Try saying:\n\"I am traveling to Tokyo for 7 days. I need to pack for the trip.\"\n\n✈️ Or ask about:\n• Clothing for specific destinations\n• Required travel documents\n• Personal items and electronics\n• Destination research and tips\n\nI'll coordinate with my specialist agents to give you comprehensive packing advice!",
                }}
                className="h-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel - Agent Status Dashboard */}
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex flex-col h-full p-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Agents
              </h2>
              <p className="text-gray-500 text-xs">
                6 specialists ready to help with travel packing
              </p>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto">
              {/* Agent Status Cards */}
              <div className="space-y-2">
                <AgentStatusCard
                  name="Personal Belongings"
                  port="9997"
                  description="Electronics, toiletries, accessories"
                  status="active"
                  lastActivity="Available"
                />
                <AgentStatusCard
                  name="Clothing Agent"
                  port="9998"
                  description="Weather-appropriate clothing recommendations"
                  status="active"
                  lastActivity="Available"
                />
                <AgentStatusCard
                  name="Search Agent"
                  port="9999"
                  description="Web search using Exa API"
                  status="active"
                  lastActivity="Available"
                />
                <AgentStatusCard
                  name="Documents Agent"
                  port="9995"
                  description="Visas, passports, travel insurance"
                  status="active"
                  lastActivity="Available"
                />
                <AgentStatusCard
                  name="Research Agent"
                  port="9996"
                  description="Destination research and cultural tips"
                  status="active"
                  lastActivity="Available"
                />
                <AgentStatusCard
                  name="Packing Agent"
                  port="9994"
                  description="Master packing coordinator"
                  status="active"
                  lastActivity="Available"
                />
              </div>

              {/* Communication Stats */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {state?.a2aMessages?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">6</div>
                    <div className="text-xs text-gray-500">Agents</div>
                  </div>
                </div>
              </div>

              {/* Example Queries */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3 text-sm">
                  Try These Queries
                </h3>
                <div className="space-y-1.5">
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                    "I am traveling to Tokyo for 7 days..."
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                    "What clothes for Thailand in summer?"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                    "Documents needed for European travel?"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                    "Electronics for business trip to London"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

interface AgentStatusCardProps {
  name: string;
  port: string;
  description: string;
  status: "active" | "inactive" | "busy";
  lastActivity: string;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({
  name,
  port,
  description,
  status,
  lastActivity,
}) => {
  const statusDots = {
    active: "bg-green-400",
    inactive: "bg-gray-300",
    busy: "bg-amber-400",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full ${statusDots[status]} ${
            status === "active" ? "animate-pulse" : ""
          }`}
        ></div>
        <div>
          <h3 className="font-medium text-sm text-gray-900">{name}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <span className="text-xs font-mono text-gray-400">:{port}</span>
    </div>
  );
};
