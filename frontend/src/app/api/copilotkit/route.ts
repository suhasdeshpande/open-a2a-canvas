import { A2AClientAgent } from "@/ag-ui-client";
import { createOpenAI } from "@ai-sdk/openai";
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client (uses OPENAI_API_KEY env var by default)
const openai = new OpenAI();

// Create the service adapter with the OpenAI client
// @ts-ignore - Type compatibility between OpenAI v4 and CopilotKit
const serviceAdapter = new OpenAIAdapter({ openai });

// Create OpenAI provider for A2A agents
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure A2A agents
const theDirtyDogs = new A2AClientAgent({
  agentUrls: [
    "http://localhost:9997", // Buildings Management
    "http://localhost:9998", // Finance
    "http://localhost:9999", // Search Agent
    "http://localhost:9995", // IT
  ],
  instructions: `You are coordinating with specialized agents:
    - Buildings Management: Facility operations, desk assignments, building maintenance
    - Finance: ERP system operations, payroll, procurement
    - IT: Infrastructure management, device provisioning, account setup
    - Search Agent: Web search using Exa for finding information online
    
    Route requests to the appropriate agents based on the user's needs.`,
  model: openaiProvider("gpt-4o"),
});

const runtime = new CopilotRuntime({
  agents: {
    theDirtyDogs,
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: req.nextUrl.pathname,
  });

  return handleRequest(req);
};
