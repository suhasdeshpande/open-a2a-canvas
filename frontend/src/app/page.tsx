import { CopilotChat } from "@copilotkit/react-ui";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function Home() {
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        {/* Left panel - Chat */}
        <ResizablePanel defaultSize={40} minSize={25} maxSize={75}>
          <div className="relative h-full chat-container">
            <CopilotChat
              instructions={
                "You are assisting the user as best as you can. Answer in the best way possible given the data you have."
              }
              labels={{
                title: "Your Assistant",
                initial: "Hi! 👋 How can I assist you today?",
              }}
              className="h-full"
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel - Canvas */}
        <ResizablePanel defaultSize={60} minSize={25} maxSize={75}>
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 bg-gray-50">
              <div className="h-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                Canvas
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
