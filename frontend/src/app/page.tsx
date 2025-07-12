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
}

const AgentCanvas = () => {
  const { state } = useCoAgent<A2AState>({ name: "theDirtyDogs" });
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

  // Initialize with sample items that match PackingItem interface
  const defaultItems: PackingItem[] = [
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
    {
      id: "books",
      name: "Books",
      category: "extras",
      priority: "optional",
      packed: false,
    },
    {
      id: "snacks",
      name: "Snacks",
      category: "extras",
      priority: "optional",
      packed: false,
    },
    {
      id: "games",
      name: "Games",
      category: "extras",
      priority: "optional",
      packed: false,
    },
  ];

  const defaultCategories = {
    essentials: { packed: 0, total: 3, priority: "high" },
    clothing: { packed: 0, total: 3, priority: "high" },
    toiletries: { packed: 0, total: 3, priority: "medium" },
    electronics: { packed: 0, total: 3, priority: "medium" },
    extras: { packed: 0, total: 3, priority: "low" },
  };

  const currentPackingState = state?.packingState || {
    items: defaultItems,
    categories: defaultCategories,
    totalPacked: 0,
    totalItems: defaultItems.length,
    progress: 0,
  };

  const toggleItem = (itemId: string) => {
    const updatedItems = currentPackingState.items.map((item) =>
      item.id === itemId ? { ...item, packed: !item.packed } : item
    );

    // Recalculate categories
    const updatedCategories = Object.keys(defaultCategories).reduce(
      (acc, categoryKey) => {
        const categoryItems = updatedItems.filter(
          (item) => item.category === categoryKey
        );
        const packedCount = categoryItems.filter((item) => item.packed).length;

        acc[categoryKey] = {
          packed: packedCount,
          total: categoryItems.length,
          priority:
            defaultCategories[categoryKey as keyof typeof defaultCategories]
              .priority,
        };
        return acc;
      },
      {} as Record<string, { packed: number; total: number; priority: string }>
    );

    const totalPacked = updatedItems.filter((item) => item.packed).length;
    const totalItems = updatedItems.length;
    const progress =
      totalItems > 0 ? Math.round((totalPacked / totalItems) * 100) : 0;

    const newPackingState: PackingState = {
      items: updatedItems,
      categories: updatedCategories,
      totalPacked,
      totalItems,
      progress,
    };

    setState({
      ...state,
      packingState: newPackingState,
    });
  };

  const categoryOrder = [
    "essentials",
    "clothing",
    "toiletries",
    "electronics",
    "extras",
  ];
  const categoryLabels = {
    essentials: "Essentials",
    clothing: "Clothing",
    toiletries: "Toiletries",
    electronics: "Electronics",
    extras: "Extras",
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Travel Workspace
        </h2>
        <p className="text-sm text-gray-600">4/6 agents active</p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-800 mb-3">
          Smart Packing Assistant
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-gray-600">
            {currentPackingState.totalPacked}/{currentPackingState.totalItems}{" "}
            items packed
          </span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${currentPackingState.progress}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium text-gray-800">
            {currentPackingState.progress}%
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {categoryOrder.map((categoryKey) => {
          const categoryData =
            currentPackingState.categories[
              categoryKey as keyof typeof currentPackingState.categories
            ];
          const categoryItems = currentPackingState.items.filter(
            (item) => item.category === categoryKey
          );

          return (
            <div key={categoryKey} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {categoryLabels[categoryKey as keyof typeof categoryLabels]} (
                  {categoryData.packed}/{categoryData.total})
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    categoryData.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : categoryData.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {categoryData.priority}
                </span>
              </div>

              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.packed}
                        onChange={() => toggleItem(item.id)}
                        className="w-4 h-4 text-teal-600"
                      />
                      <span
                        className={`text-sm ${
                          item.packed
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.packed
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.packed ? "✓" : "○"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Agent Dashboard */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3 text-sm">
            Agent Dashboard
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <AgentStatusCard
              name="Packing"
              port="9994"
              description="Smart packing..."
              status="active"
              lastActivity="Available"
              compact={true}
            />
            <AgentStatusCard
              name="Documents"
              port="9995"
              description="Travel docs"
              status="active"
              lastActivity="Available"
              compact={true}
            />
            <AgentStatusCard
              name="Research"
              port="9996"
              description="Destination info"
              status="active"
              lastActivity="Available"
              compact={true}
            />
            <AgentStatusCard
              name="Belongings"
              port="9997"
              description="Personal items"
              status="active"
              lastActivity="Available"
              compact={true}
            />
          </div>
        </div>

        {/* Communication Stats */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">6</div>
              <div className="text-xs text-gray-500">Components</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">6</div>
              <div className="text-xs text-gray-500">Agents</div>
            </div>
          </div>
        </div>
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
