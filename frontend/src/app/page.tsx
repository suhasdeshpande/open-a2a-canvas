"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  CopilotKit,
  useCoAgent,
  useCoAgentStateRender,
  useCopilotAdditionalInstructions,
  useCopilotAction,
} from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import React, { useState, useCallback } from "react";

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
  packingState?: PackingState;
}

interface ContextFile {
  name: string;
  content: string;
  type: string;
}

interface PackingItem {
  id: string;
  name: string;
  category: string;
  priority: "essential" | "recommended" | "optional";
  packed: boolean;
  weight: number;
  icon: string;
}

interface PackingState {
  items: PackingItem[];
  categories: Record<
    string,
    { packed: number; total: number; priority: string }
  >;
  progress: number;
  totalPacked: number;
  totalItems: number;
  totalWeight: number;
}

// Agent Network Component
interface AgentNetworkProps {
  messages: A2AMessage[];
}

const AgentNetwork: React.FC<AgentNetworkProps> = ({ messages }) => {
  const [showAll, setShowAll] = useState(false);

  if (!messages || messages.length === 0) {
    return null;
  }

  const messagesToShow = showAll ? messages : messages.slice(-3);

  // Agent color schemes
  const agentColors = {
    Agent: {
      bg: "from-gray-500 to-gray-600",
      text: "text-gray-700",
      badge: "bg-gray-100 text-gray-700",
    },
    "Personal Belongings Agent": {
      bg: "from-purple-500 to-purple-600",
      text: "text-purple-700",
      badge: "bg-purple-100 text-purple-700",
    },
    "Clothing Agent": {
      bg: "from-blue-500 to-blue-600",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-700",
    },
    "Search Agent": {
      bg: "from-green-500 to-green-600",
      text: "text-green-700",
      badge: "bg-green-100 text-green-700",
    },
    "Research Agent": {
      bg: "from-orange-500 to-orange-600",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-700",
    },
    "Documents Agent": {
      bg: "from-red-500 to-red-600",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
    },
    "Packing Agent": {
      bg: "from-indigo-500 to-indigo-600",
      text: "text-indigo-700",
      badge: "bg-indigo-100 text-indigo-700",
    },
  };

  // Generate TLDR for messages
  const generateTLDR = (message: string, agentName: string) => {
    const lowerMessage = message.toLowerCase();

    // Travel-specific TLDR patterns
    if (
      lowerMessage.includes("weather") ||
      lowerMessage.includes("temperature")
    ) {
      return "🌤️ Weather advice and seasonal clothing tips";
    }
    if (
      lowerMessage.includes("electronics") ||
      lowerMessage.includes("charger") ||
      lowerMessage.includes("device")
    ) {
      return "📱 Electronics and charging essentials";
    }
    if (
      lowerMessage.includes("clothing") ||
      lowerMessage.includes("outfit") ||
      lowerMessage.includes("wear")
    ) {
      return "👕 Clothing and outfit recommendations";
    }
    if (
      lowerMessage.includes("document") ||
      lowerMessage.includes("passport") ||
      lowerMessage.includes("visa")
    ) {
      return "📄 Travel documents and requirements";
    }
    if (
      lowerMessage.includes("packing") ||
      lowerMessage.includes("pack") ||
      lowerMessage.includes("luggage")
    ) {
      return "🎒 Packing strategy and organization";
    }
    if (
      lowerMessage.includes("tokyo") ||
      lowerMessage.includes("japan") ||
      lowerMessage.includes("destination")
    ) {
      return "🏙️ Destination insights and local tips";
    }
    if (
      lowerMessage.includes("toiletries") ||
      lowerMessage.includes("medication") ||
      lowerMessage.includes("personal")
    ) {
      return "🧴 Personal care and health items";
    }
    if (
      lowerMessage.includes("culture") ||
      lowerMessage.includes("etiquette") ||
      lowerMessage.includes("customs")
    ) {
      return "🎌 Cultural norms and etiquette advice";
    }
    if (
      lowerMessage.includes("activity") ||
      lowerMessage.includes("sightseeing") ||
      lowerMessage.includes("attraction")
    ) {
      return "🎯 Activities and sightseeing recommendations";
    }

    // Fallback TLDR based on agent type
    if (agentName.includes("Personal Belongings"))
      return "🎒 Personal items recommendations";
    if (agentName.includes("Clothing")) return "👔 Clothing suggestions";
    if (agentName.includes("Documents")) return "📋 Document checklist";
    if (agentName.includes("Research")) return "🔍 Destination research";
    if (agentName.includes("Packing")) return "📦 Packing coordination";

    return "💬 Travel planning assistance";
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              Agent Network
            </h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {messages.length} messages
            </span>
          </div>
          {messages.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              {showAll ? "Show Less" : "View All"}
            </button>
          )}
        </div>

        {/* Messages - Simplified View */}
        <div className="space-y-2">
          {messagesToShow.map((message, idx) => {
            const agentColor =
              agentColors[message.name as keyof typeof agentColors] ||
              agentColors["Agent"];
            const tldr = generateTLDR(message.message, message.name);

            return (
              <div
                key={idx}
                className="group hover:bg-white/60 rounded-lg p-3 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  {/* Agent Avatar */}
                  <div
                    className={`w-8 h-8 bg-gradient-to-br ${agentColor.bg} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                  >
                    {message.name.charAt(0)}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-medium ${agentColor.text}`}
                      >
                        {message.name}
                      </span>
                      <span className="text-gray-400 text-xs">→</span>
                      <span className="text-sm text-gray-600">
                        {message.to}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">
                        {message.timestamp
                          ? new Date(message.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "now"}
                      </span>
                    </div>

                    {/* TLDR instead of full message */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 ${agentColor.badge} text-xs font-medium rounded-full`}
                      >
                        TLDR
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {tldr}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {!showAll && messages.length > 3 && (
          <div className="mt-3 pt-3 border-t border-blue-100">
            <div className="text-center">
              <button
                onClick={() => setShowAll(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Show {messages.length - 3} more messages
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AgentCanvas = () => {
  const { state, setState } = useCoAgent<A2AState>({ name: "theDirtyDogs" });
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([
    {
      name: "trip-overview.md",
      content:
        "# Trip Overview\n\nDestination: Not specified\nDuration: Not specified\nPurpose: Not specified",
      type: "overview",
    },
  ]);
  const [packingState, setPackingState] = useState<PackingState>({
    items: [],
    categories: {},
    progress: 0,
    totalPacked: 0,
    totalItems: 0,
    totalWeight: 0,
  });

  // Initialize default items if none exist
  React.useEffect(() => {
    if (!state?.packingState?.items || state.packingState.items.length === 0) {
      const defaultItems: PackingItem[] = [
        {
          id: "passport",
          name: "Passport",
          category: "essentials",
          priority: "essential",
          packed: false,
          weight: 20,
          icon: "📘",
        },
        {
          id: "clothes",
          name: "Clothes",
          category: "clothing",
          priority: "essential",
          packed: false,
          weight: 15,
          icon: "👕",
        },
        {
          id: "sunscreen",
          name: "Sunscreen",
          category: "toiletries",
          priority: "recommended",
          packed: false,
          weight: 5,
          icon: "🧴",
        },
        {
          id: "camera",
          name: "Camera",
          category: "electronics",
          priority: "optional",
          packed: false,
          weight: 8,
          icon: "📷",
        },
        {
          id: "chargers",
          name: "Chargers",
          category: "electronics",
          priority: "recommended",
          packed: false,
          weight: 10,
          icon: "🔌",
        },
        {
          id: "medications",
          name: "Medications",
          category: "essentials",
          priority: "essential",
          packed: false,
          weight: 15,
          icon: "💊",
        },
      ];

      const totalWeight = defaultItems.reduce(
        (sum, item) => sum + item.weight,
        0
      );

      const initialPackingState: PackingState = {
        items: defaultItems,
        categories: {},
        progress: 0,
        totalPacked: 0,
        totalWeight: totalWeight,
        totalItems: defaultItems.length,
      };

      setState({
        ...state,
        packingState: initialPackingState,
      });
    }
  }, [state, setState]);

  // Add action to check packing status - this allows the chat to query packing state
  useCopilotAction({
    name: "checkPackingStatus",
    description: "Check the current packing progress and status of all items",
    parameters: [],
    handler: async () => {
      const currentState = state?.packingState;
      if (currentState?.items) {
        const packed = currentState.items
          .filter((item) => item.packed)
          .map((item) => item.name);
        const unpacked = currentState.items
          .filter((item) => !item.packed)
          .map((item) => item.name);
        return `Packing Status: ${currentState.progress}% complete\nPacked: ${
          packed.join(", ") || "None"
        }\nStill to pack: ${unpacked.join(", ") || "All done!"}`;
      }
      return "Checking packing status with the packing agent...";
    },
  });

  // Add action to mark items as packed/unpacked from chat
  useCopilotAction({
    name: "markItemPacked",
    description: "Mark a specific item as packed or unpacked",
    parameters: [
      {
        name: "itemName",
        type: "string",
        description: "Name of the item to mark as packed/unpacked",
        required: true,
      },
      {
        name: "packed",
        type: "boolean",
        description:
          "Whether to mark the item as packed (true) or unpacked (false)",
        required: true,
      },
    ],
    handler: async ({ itemName, packed }) => {
      console.log(`markItemPacked called: ${itemName} -> ${packed}`);

      const currentState = state?.packingState;
      if (currentState?.items) {
        // Find item by name (fuzzy matching)
        const item = currentState.items.find(
          (item) =>
            item.name.toLowerCase() === itemName.toLowerCase() ||
            item.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(item.name.toLowerCase())
        );

        if (item) {
          // Update the item
          const updatedItems = currentState.items.map((i) =>
            i.id === item.id ? { ...i, packed } : i
          );

          const totalPackedWeight = updatedItems
            .filter((i) => i.packed)
            .reduce((sum, i) => sum + (i.weight || 1), 0);
          const totalWeight = updatedItems.reduce(
            (sum, i) => sum + (i.weight || 1),
            0
          );
          const progress = Math.round((totalPackedWeight / totalWeight) * 100);

          const newPackingState = {
            ...currentState,
            items: updatedItems,
            totalPacked: updatedItems.filter((i) => i.packed).length,
            totalWeight: totalWeight,
            progress,
          };

          setState({
            ...state,
            packingState: newPackingState,
          });

          console.log(
            `Updated state: ${item.name} is now ${
              packed ? "packed" : "unpacked"
            }`
          );

          return `✅ ${item.name} ${
            packed ? "packed" : "unpacked"
          }! ${progress}%`;
        } else {
          const availableItems = currentState.items
            .map((i) => i.name)
            .join(", ");
          return `❌ Could not find "${itemName}". Available items: ${availableItems}`;
        }
      }

      return `Marked ${itemName} as ${
        packed ? "packed" : "unpacked"
      }. The packing agent will update the status.`;
    },
  });

  // Combine all context files into instructions
  const contextInstructions = contextFiles
    .map((file) => `## ${file.name}\n\n${file.content}`)
    .join("\n\n---\n\n");

  useCopilotAdditionalInstructions({
    instructions: `
# Personal Travel Context

${contextInstructions}

Use this personal context to provide highly personalized travel packing recommendations. Reference specific details from the user's context when making suggestions.

# Packing Agent Integration

IMPORTANT: When users mention packing items or ask you to mark items as packed/unpacked, you MUST use the markItemPacked action. Look for phrases like:
- "Mark [item] as packed"
- "I packed my [item]" 
- "[item] is packed"
- "Pack [item]"
- "I finished packing [item]"

For ANY packing-related request, use the markItemPacked action with:
- itemName: the name of the item (e.g., "passport", "clothes", "camera")
- packed: true for packing, false for unpacking

Examples:
- User says "Mark passport as packed" → Call markItemPacked(itemName="passport", packed=true)
- User says "I packed my clothes" → Call markItemPacked(itemName="clothes", packed=true)
- User says "Unpack the camera" → Call markItemPacked(itemName="camera", packed=false)

# Response Style
CRITICAL: Keep all responses EXTREMELY SHORT. Maximum 2-3 sentences. No long lists, no detailed guides, no comprehensive explanations. Be concise and direct.

Examples of good responses:
- "Pack light layers for Tokyo's fall weather. Don't forget a compact umbrella for rain."
- "Essential: passport, phone, charger. Weather-appropriate clothes for 15-22°C."
- "Tokyo tips: Carry cash, remove shoes indoors, bow when greeting."

You can also:
- Check their current packing progress with checkPackingStatus
- Get recommendations based on their context
- Coordinate with other travel specialists

Always acknowledge when you've marked an item as packed and encourage the user to continue packing.
    `,
  });

  const addContextFile = useCallback(
    (name: string, content: string, type: string) => {
      setContextFiles((prev) => [...prev, { name, content, type }]);
    },
    []
  );

  const updateContextFile = useCallback((index: number, content: string) => {
    setContextFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, content } : file))
    );
  }, []);

  const removeContextFile = useCallback((index: number) => {
    setContextFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Render agent communication state
  useCoAgentStateRender<A2AState>({
    name: "theDirtyDogs",
    render: ({ state }) => {
      return <AgentNetwork messages={state?.a2aMessages || []} />;
    },
  });

  // Add debugging to track state changes
  React.useEffect(() => {
    if (state?.packingState) {
      console.log("🎒 Packing state updated:", {
        totalPacked: state.packingState.totalPacked,
        totalItems: state.packingState.totalItems,
        progress: state.packingState.progress,
        items: state.packingState.items
          ?.map((i) => `${i.name}: ${i.packed ? "✅" : "❌"}`)
          .join(", "),
      });
    }
  }, [state?.packingState]);

  return (
    <div className="h-screen bg-white">
      <ResizablePanelGroup direction="horizontal">
        {/* Left panel - Context Engineering */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <ContextEngineering
            contextFiles={contextFiles}
            onAddFile={addContextFile}
            onUpdateFile={updateContextFile}
            onRemoveFile={removeContextFile}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle panel - Smart Packing Assistant State */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <PackingDashboard
            packingState={packingState}
            onUpdatePacking={setPackingState}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel - Chat */}
        <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
          <div className="relative h-full flex flex-col">
            <div className="flex-1 p-4 overflow-hidden">
              <div className="h-full flex flex-col">
                <CopilotChat
                  instructions={
                    "You are the ultimate travel packing coordinator working with specialized travel agents. Help users pack perfectly for any trip by coordinating with expert agents for clothing, personal belongings, documents, research, and packing strategy. Use the provided personal context to make highly personalized recommendations."
                  }
                  labels={{
                    title: "🧳 Travel Packing Assistant",
                    initial:
                      "Hi! I'm your travel packing coordinator. I work with expert agents to help you pack perfectly for any trip!\n\n🌍 Add your travel context files on the left, then try saying:\n\"I am traveling to Tokyo for 7 days. I need to pack for the trip.\"\n\n✈️ Or ask about:\n• Clothing for specific destinations\n• Required travel documents\n• Personal items and electronics\n• Destination research and tips\n\nI'll coordinate with my specialist agents to give you comprehensive packing advice!",
                  }}
                  className="h-full rounded-lg shadow-lg [&_.copilotKitMessages]:overflow-y-auto [&_.copilotKitMessages]:max-h-full [&_.copilotKitMessagesContainer]:flex [&_.copilotKitMessagesContainer]:flex-col [&_.copilotKitMessagesContainer]:h-full"
                />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

interface ContextEngineeringProps {
  contextFiles: ContextFile[];
  onAddFile: (name: string, content: string, type: string) => void;
  onUpdateFile: (index: number, content: string) => void;
  onRemoveFile: (index: number) => void;
}

const ContextEngineering: React.FC<ContextEngineeringProps> = ({
  contextFiles,
  onAddFile,
  onUpdateFile,
  onRemoveFile,
}) => {
  const [newFileName, setNewFileName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onAddFile(file.name, content, "uploaded");
      };
      reader.readAsText(file);
    }
  };

  const addNewFile = () => {
    if (newFileName.trim()) {
      const fileName = newFileName.endsWith(".md")
        ? newFileName
        : `${newFileName}.md`;
      onAddFile(
        fileName,
        `# ${newFileName}\n\nAdd your content here...`,
        "manual"
      );
      setNewFileName("");
      setShowAddForm(false);
    }
  };

  const contextFileTypes = [
    { name: "trip-overview.md", icon: "🌍", color: "blue" },
    { name: "traveler-preferences.md", icon: "👤", color: "green" },
    { name: "destination-info.md", icon: "📍", color: "purple" },
    { name: "budget-constraints.md", icon: "💰", color: "orange" },
    { name: "travel-documents.md", icon: "📄", color: "pink" },
    { name: "emergency-contacts.md", icon: "🚨", color: "yellow" },
  ];

  return (
    <div className="h-full flex flex-col p-4 bg-gray-50">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">
          CONTEXT ENGINEERING
        </h2>
        <p className="text-xs text-gray-600">
          Load your personal travel context
        </p>
      </div>

      <div className="mb-4">
        <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
          CONTEXT FILES
        </h3>

        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-3 p-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            + New Context
          </button>
        ) : (
          <div className="mb-3 p-3 bg-white rounded-lg border">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File name (e.g., trip-overview)"
              className="w-full px-2 py-1 border rounded text-sm mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={addNewFile}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <input
          type="file"
          accept=".md"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="block w-full mb-3 p-2 border-2 border-dashed border-gray-300 rounded-lg text-center text-xs text-gray-500 hover:border-gray-400 cursor-pointer"
        >
          Or upload .md file
        </label>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {contextFiles.map((file, index) => {
          const fileType = contextFileTypes.find(
            (type) => file.name === type.name
          );
          const icon = fileType?.icon || "📝";
          const colorClass =
            fileType?.color === "blue"
              ? "bg-blue-100 border-blue-200"
              : fileType?.color === "green"
              ? "bg-green-100 border-green-200"
              : fileType?.color === "purple"
              ? "bg-purple-100 border-purple-200"
              : fileType?.color === "orange"
              ? "bg-orange-100 border-orange-200"
              : fileType?.color === "pink"
              ? "bg-pink-100 border-pink-200"
              : fileType?.color === "yellow"
              ? "bg-yellow-100 border-yellow-200"
              : "bg-gray-100 border-gray-200";

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${colorClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs font-medium text-gray-700">
                    {file.name}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setEditingIndex(editingIndex === index ? null : index)
                    }
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {editingIndex === index ? "×" : "✏️"}
                  </button>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {editingIndex === index ? (
                <textarea
                  value={file.content}
                  onChange={(e) => onUpdateFile(index, e.target.value)}
                  className="w-full h-32 text-xs p-2 border rounded resize-none"
                  placeholder="Enter markdown content..."
                />
              ) : (
                <div className="text-xs text-gray-600 line-clamp-3">
                  {file.content.substring(0, 100)}...
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface PackingDashboardProps {
  packingState: PackingState;
  onUpdatePacking: (state: PackingState) => void;
}

const PackingDashboard: React.FC<PackingDashboardProps> = ({
  packingState,
  onUpdatePacking,
}) => {
  const { state, setState } = useCoAgent<A2AState>({ name: "theDirtyDogs" });
  const [testProgress, setTestProgress] = React.useState(0);

  // Use the main agent state for real-time updates with fallback
  const currentPackingState = state?.packingState || {
    items: [],
    categories: {},
    totalPacked: 0,
    totalItems: 0,
    progress: 0,
    totalWeight: 0,
  };

  // Add Copilot action for updating packing state
  useCopilotAction({
    name: "updatePackingState",
    description:
      "Update the packing state by marking items as packed or unpacked",
    parameters: [
      {
        name: "itemName",
        type: "string",
        description: "The name of the item to update",
        required: true,
      },
      {
        name: "packed",
        type: "boolean",
        description: "Whether the item is packed (true) or unpacked (false)",
        required: true,
      },
    ],
    handler: async ({ itemName, packed }) => {
      // Update local state immediately for UI responsiveness
      const currentState = state?.packingState;
      if (currentState?.items) {
        const updatedItems = currentState.items.map((item) =>
          item.name.toLowerCase() === itemName.toLowerCase()
            ? { ...item, packed }
            : item
        );

        const totalPacked = updatedItems.filter((item) => item.packed).length;
        const progress =
          updatedItems.length > 0
            ? Math.round((totalPacked / updatedItems.length) * 100)
            : 0;

        const newPackingState = {
          ...currentState,
          items: updatedItems,
          totalPacked,
          progress,
        };

        setState({
          ...state,
          packingState: newPackingState,
        });
      }

      return `Updated ${itemName} as ${packed ? "packed" : "unpacked"}`;
    },
  });

  // Fallback progress calculation if state isn't updating
  const fallbackProgress = React.useMemo(() => {
    if (currentPackingState.totalItems === 0) return testProgress;
    if (currentPackingState.progress) return currentPackingState.progress;

    // Calculate weighted progress
    const items = currentPackingState.items || [];
    const totalPackedWeight = items
      .filter((i) => i.packed)
      .reduce((sum, i) => sum + (i.weight || 1), 0);
    const totalWeight = items.reduce((sum, i) => sum + (i.weight || 1), 0);
    return totalWeight > 0
      ? Math.round((totalPackedWeight / totalWeight) * 100)
      : 0;
  }, [currentPackingState, testProgress]);

  // Use actual progress or fallback
  const displayProgress = currentPackingState.progress || fallbackProgress;

  // Test function to simulate packing progress
  const simulatePackingProgress = () => {
    setTestProgress((prev) => Math.min(prev + 25, 100));
  };

  // Auto-reset test progress after reaching 100%
  React.useEffect(() => {
    if (testProgress >= 100) {
      const timer = setTimeout(() => setTestProgress(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [testProgress]);

  // Handle checkbox toggle
  const handleItemToggle = async (itemId: string) => {
    const item = currentPackingState.items.find((i) => i.id === itemId);
    if (!item) return;

    const newPackedState = !item.packed;

    // Update local state immediately with weighted calculation
    const updatedItems = currentPackingState.items.map((i) =>
      i.id === itemId ? { ...i, packed: newPackedState } : i
    );

    const totalPackedWeight = updatedItems
      .filter((i) => i.packed)
      .reduce((sum, i) => sum + (i.weight || 1), 0);
    const totalWeight = updatedItems.reduce(
      (sum, i) => sum + (i.weight || 1),
      0
    );
    const progress = Math.round((totalPackedWeight / totalWeight) * 100);

    const newPackingState = {
      ...currentPackingState,
      items: updatedItems,
      totalPacked: updatedItems.filter((i) => i.packed).length,
      totalWeight: totalWeight,
      progress,
    };

    setState({
      ...state,
      packingState: newPackingState,
    });

    // Also update via action to sync with agents
    try {
      // This will call the updatePackingState action above
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Failed to sync with agents:", error);
    }
  };

  // Listen for agent state updates
  React.useEffect(() => {
    // Watch for state changes from agent messages
    if (state?.a2aMessages) {
      const lastMessage = state.a2aMessages[state.a2aMessages.length - 1];
      if (
        lastMessage &&
        lastMessage.message.includes("update_packing_state:")
      ) {
        // Force a re-render when agent updates state
        console.log("Agent updated packing state:", lastMessage.message);
      }
    }
  }, [state?.a2aMessages]);

  // Use items from shared state, fallback to empty array
  const displayItems = currentPackingState.items || [];

  return (
    <div className="h-full flex flex-col p-6 bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Your Travel Backpack
        </h2>
        <p className="text-gray-600">
          {currentPackingState.totalPacked} of{" "}
          {currentPackingState.totalItems || displayItems.length} items packed
        </p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Visual Packing */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-6">
            Visual Packing
          </h3>

          <BackpackFill fillLevel={displayProgress} />

          {/* Test Button (development only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 space-y-2">
              <button
                onClick={simulatePackingProgress}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Test Pack +25% 🎒
              </button>
              <div className="text-xs text-gray-500 text-center">
                Debug: {displayProgress}% | Test: {testProgress}%
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Packed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Pending</span>
            </div>
          </div>
        </div>

        {/* Right Column - Travel Essentials Checklist */}
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-700 mb-6">
            Travel Essentials
          </h3>

          <div className="space-y-4 flex-1">
            {/* Group items by category */}
            {Object.entries(
              displayItems.reduce((groups, item) => {
                if (!groups[item.category]) {
                  groups[item.category] = [];
                }
                groups[item.category].push(item);
                return groups;
              }, {} as Record<string, typeof displayItems>)
            ).map(([category, items]) => {
              const packedCount = items.filter((item) => item.packed).length;
              const totalCount = items.length;
              const categoryProgress = Math.round(
                (packedCount / totalCount) * 100
              );

              // Category styling
              const categoryConfig = {
                essentials: {
                  color: "red",
                  bgColor: "bg-red-50",
                  textColor: "text-red-700",
                  borderColor: "border-red-200",
                  icon: "🎯",
                },
                clothing: {
                  color: "blue",
                  bgColor: "bg-blue-50",
                  textColor: "text-blue-700",
                  borderColor: "border-blue-200",
                  icon: "👕",
                },
                toiletries: {
                  color: "green",
                  bgColor: "bg-green-50",
                  textColor: "text-green-700",
                  borderColor: "border-green-200",
                  icon: "🧴",
                },
                electronics: {
                  color: "purple",
                  bgColor: "bg-purple-50",
                  textColor: "text-purple-700",
                  borderColor: "border-purple-200",
                  icon: "📱",
                },
              };

              const config = categoryConfig[
                category as keyof typeof categoryConfig
              ] || {
                color: "gray",
                bgColor: "bg-gray-50",
                textColor: "text-gray-700",
                borderColor: "border-gray-200",
                icon: "📦",
              };

              return (
                <div
                  key={category}
                  className={`rounded-lg border-2 ${config.borderColor} ${config.bgColor} overflow-hidden`}
                >
                  {/* Category Header */}
                  <div className="p-3 border-b border-gray-200 bg-white/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <h4
                          className={`font-semibold ${config.textColor} capitalize`}
                        >
                          {category}
                        </h4>
                        <span
                          className={`text-sm ${config.textColor} opacity-75`}
                        >
                          ({packedCount}/{totalCount})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-12 h-2 bg-gray-200 rounded-full overflow-hidden`}
                        >
                          <div
                            className={`h-full transition-all duration-300 ${
                              config.color === "red"
                                ? "bg-red-500"
                                : config.color === "blue"
                                ? "bg-blue-500"
                                : config.color === "green"
                                ? "bg-green-500"
                                : config.color === "purple"
                                ? "bg-purple-500"
                                : "bg-gray-500"
                            }`}
                            style={{ width: `${categoryProgress}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs ${config.textColor} font-medium`}
                        >
                          {categoryProgress}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category Items */}
                  <div className="p-3 space-y-2">
                    {items.map((item) => {
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-all"
                        >
                          {/* Item Info */}
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={item.packed}
                              onChange={() => handleItemToggle(item.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-lg">{item.icon || "📦"}</span>
                            <span
                              className={`font-medium ${
                                item.packed
                                  ? "line-through text-gray-500"
                                  : "text-gray-800"
                              } transition-all`}
                            >
                              {item.name}
                            </span>
                          </div>

                          {/* Priority & Status */}
                          <div className="flex items-center gap-2">
                            {item.priority === "essential" && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                high
                              </span>
                            )}
                            {item.priority === "recommended" && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                                med
                              </span>
                            )}
                            {item.priority === "optional" && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                low
                              </span>
                            )}
                            {item.packed ? (
                              <span className="text-green-600 text-lg">✓</span>
                            ) : (
                              <span className="text-gray-300 text-lg">○</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Overall Progress */}
            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span className="font-medium">Overall Progress</span>
                <span className="font-bold">{displayProgress}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${displayProgress}%` }}
                >
                  {displayProgress > 10 && (
                    <span className="text-white text-xs font-bold">
                      {displayProgress}%
                    </span>
                  )}
                </div>
              </div>
              {displayProgress === 100 && (
                <div className="mt-2 text-center">
                  <span className="text-green-600 font-medium text-sm">
                    🎉 Ready to travel!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Beautiful BackpackFill Component
interface BackpackFillProps {
  fillLevel: number; // 0 to 100
}

const BackpackFill: React.FC<BackpackFillProps> = ({ fillLevel }) => {
  // Clamp fillLevel between 0 and 100
  const clampedFillLevel = Math.max(0, Math.min(100, fillLevel));

  // Determine fill color based on level
  const getFillColor = (level: number) => {
    if (level >= 90) return "bg-red-500";
    if (level >= 70) return "bg-yellow-500";
    if (level >= 40) return "bg-blue-500";
    return "bg-green-500";
  };

  const fillColor = getFillColor(clampedFillLevel);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Backpack Container */}
      <div className="relative">
        {/* Main Backpack Body */}
        <div className="relative w-40 h-48 md:w-48 md:h-56">
          {/* Backpack Outline */}
          <div className="absolute inset-0 bg-gray-800 rounded-2xl border-4 border-gray-900 shadow-xl">
            {/* Fill Container - clips the fill to backpack shape */}
            <div className="absolute inset-2 rounded-xl overflow-hidden bg-gray-100">
              {/* Animated Fill */}
              <div
                className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out`}
                style={{
                  height: `${clampedFillLevel}%`,
                  background: `linear-gradient(to top, ${
                    clampedFillLevel >= 90
                      ? "#dc2626, #ef4444"
                      : clampedFillLevel >= 70
                      ? "#eab308, #fbbf24"
                      : clampedFillLevel >= 40
                      ? "#2563eb, #3b82f6"
                      : "#059669, #10b981"
                  })`,
                }}
              />

              {/* Fill Level Indicator Lines */}
              <div className="absolute inset-0 pointer-events-none">
                {[25, 50, 75].map((level) => (
                  <div
                    key={level}
                    className="absolute left-0 right-0 h-px bg-gray-300 opacity-30"
                    style={{ bottom: `${level}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Backpack Flap */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 md:w-28 h-10 md:h-12 bg-gray-800 rounded-t-xl border-4 border-gray-900 shadow-md">
            {/* Flap Detail */}
            <div className="absolute inset-2 bg-gray-700 rounded-t-lg"></div>
            {/* Buckle */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-gray-600 rounded-sm"></div>
          </div>

          {/* Side Straps */}
          <div className="absolute -left-2 top-4 bottom-4 w-3 bg-gray-700 rounded-full shadow-md"></div>
          <div className="absolute -right-2 top-4 bottom-4 w-3 bg-gray-700 rounded-full shadow-md"></div>

          {/* Front Pocket */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-12 bg-gray-700 rounded-lg border-2 border-gray-900"></div>

          {/* Zipper */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-px h-8 bg-gray-600"></div>
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-600 rounded-full"></div>
        </div>

        {/* Percentage Label */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border-2 border-gray-200">
          <span className="text-lg font-bold text-gray-800">
            {Math.round(clampedFillLevel)}% full
          </span>
        </div>
      </div>

      {/* Status Text */}
      <div className="mt-12 text-center">
        <p className="text-xl font-medium text-gray-700">
          {clampedFillLevel === 0 && "Empty backpack"}
          {clampedFillLevel > 0 && clampedFillLevel < 25 && "Getting started"}
          {clampedFillLevel >= 25 && clampedFillLevel < 50 && "Quarter full"}
          {clampedFillLevel >= 50 && clampedFillLevel < 75 && "Half full"}
          {clampedFillLevel >= 75 && clampedFillLevel < 90 && "Almost full"}
          {clampedFillLevel >= 90 && clampedFillLevel < 100 && "Nearly packed"}
          {clampedFillLevel === 100 && "Completely full!"}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {clampedFillLevel < 50
            ? "Keep packing your essentials"
            : clampedFillLevel < 80
            ? "You're making great progress"
            : "Almost ready for your trip!"}
        </p>
      </div>
    </div>
  );
};

interface AgentStatusCardProps {
  name: string;
  port: string;
  description: string;
  status: "active" | "inactive" | "busy";
  lastActivity: string;
  compact?: boolean;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({
  name,
  port,
  description,
  status,
  lastActivity,
  compact = false,
}) => {
  const statusDots = {
    active: "bg-green-400",
    inactive: "bg-gray-300",
    busy: "bg-amber-400",
  };

  if (compact) {
    return (
      <div className="p-2 bg-gray-50 rounded border">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${statusDots[status]} ${
              status === "active" ? "animate-pulse" : ""
            }`}
          ></div>
          <h3 className="font-medium text-xs text-gray-900">{name}</h3>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    );
  }

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
