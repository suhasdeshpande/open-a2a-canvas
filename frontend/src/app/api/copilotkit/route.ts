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
    "http://localhost:9997", // Personal Belongings Agent
    "http://localhost:9998", // Clothing Agent
    "http://localhost:9999", // Search Agent
    "http://localhost:9995", // Documents Agent
    "http://localhost:9996", // Research Agent
    "http://localhost:9994", // Packing Agent
  ],
  instructions: `You are the ultimate travel packing coordinator, working with specialized agents to help travelers pack perfectly for any trip. When a user asks "I am traveling to [destination] for [duration] days. I need to pack for the trip.", coordinate with these expert agents:

    - Search Agent: Find current information about destination, weather, and travel restrictions
    - Research Agent: Provide destination research, weather patterns, cultural norms, and activities
    - Clothing Agent: Recommend appropriate clothing based on destination, weather, and activities
    - Personal Belongings Agent: Suggest electronics, toiletries, medications, and personal accessories
    - Documents Agent: Advise on required travel documents, visas, insurance, and permits
    - Packing Agent: Synthesize all recommendations into organized, comprehensive packing strategies
    
    Always gather information from multiple relevant agents to provide complete travel packing assistance. Consider factors like destination climate, cultural requirements, trip duration, planned activities, and luggage restrictions.`,
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
