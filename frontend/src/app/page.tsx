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
        <div className="w-full max-w-4xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              Agent Communication
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {state.a2aMessages.map((message, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    message.name === "Agent"
                      ? "bg-blue-50 border-l-blue-500"
                      : "bg-green-50 border-l-green-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          message.name === "Agent"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {message.name}
                      </span>
                      <span className="text-gray-400 text-sm">→</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {message.to}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {message.timestamp
                        ? new Date(message.timestamp).toLocaleTimeString()
                        : "Now"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
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
    <div className="h-screen bg-gray-50">
      <ResizablePanelGroup direction="horizontal">
        {/* Left panel - Chat */}
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <div className="relative h-full flex flex-col">
            <div className="flex-1 p-4">
              <CopilotChat
                instructions={
                  "You are coordinating with specialized agents including Buildings Management, Finance, IT, and Search agents. Route requests to the appropriate agents and show their communication."
                }
                labels={{
                  title: "🤖 Agent Coordinator",
                  initial:
                    "Hi! I coordinate with specialized agents. Try asking me to:\n\n• Find available desks\n• Set up payroll for a new employee\n• Search for information online\n• Provision new IT equipment\n\nI'll show you how the agents communicate!",
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
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Agent Status Dashboard
              </h2>
              <p className="text-gray-600 text-sm">
                Monitor real-time communication between specialized agents
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              {/* Agent Status Cards */}
              <div className="grid grid-cols-1 gap-4">
                <AgentStatusCard
                  name="Buildings Management"
                  port="9997"
                  description="Facility operations, desk assignments"
                  status="active"
                  lastActivity="Available"
                />
                <AgentStatusCard
                  name="Finance Agent"
                  port="9998"
                  description="ERP system, payroll, procurement"
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
                  name="IT Agent"
                  port="9995"
                  description="Infrastructure, device provisioning"
                  status="active"
                  lastActivity="Available"
                />
              </div>

              {/* Communication Stats */}
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Communication Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {state?.a2aMessages?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">4</div>
                    <div className="text-sm text-gray-600">Active Agents</div>
                  </div>
                </div>
              </div>

              {/* Example Queries */}
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Try These Queries
                </h3>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    "Find me an available desk"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    "Set up payroll for John Doe"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    "Search for best coffee shops in SF"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    "Provision a new laptop"
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
  const statusColors = {
    active: "bg-green-100 text-green-800 border-green-200",
    inactive: "bg-gray-100 text-gray-800 border-gray-200",
    busy: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const statusDots = {
    active: "bg-green-500",
    inactive: "bg-gray-400",
    busy: "bg-yellow-500",
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 ${statusColors[status]} transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${statusDots[status]} ${
              status === "active" ? "animate-pulse" : ""
            }`}
          ></div>
          <h3 className="font-semibold text-sm">{name}</h3>
        </div>
        <span className="text-xs font-mono">:{port}</span>
      </div>
      <p className="text-xs text-gray-600 mb-2">{description}</p>
      <div className="text-xs">
        <span className="font-medium">Status:</span> {lastActivity}
      </div>
    </div>
  );
};
