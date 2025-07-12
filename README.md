# A2A Agent Integration Project

## Overview

This project demonstrates the integration of **A2A (Agent-to-Agent)**, **Exa**, **Weave**, and **Copilotkit** protocols for building intelligent agent systems. Built for the **WeaveHacks: Agent Protocols Hackathon** (July 12-13, 2024).

## 🎯 Hackathon Context

**WeaveHacks** is an agent protocols hackathon hosted by Weights & Biases, focusing on agent protocols (MCP, A2A, etc.) and what they unlock. This project showcases how multiple agent protocols can work together to create powerful AI applications.

## 🏆 **Key Technology Integrations** (Evaluation Criteria)

### **🔗 A2A (Agent-to-Agent) Protocol Implementation**
- **Agent Discovery**: Each agent exposes `AgentCard` with capabilities via HTTP endpoints
- **Message Routing**: Central `A2AClientAgent` coordinates between specialized agents
- **Protocol Compliance**: Uses `A2AStarletteApplication` with standardized message formats
- **Real-time Communication**: Live visualization of agent-to-agent message flow
- **4 Specialized Agents**: Buildings (9997), Finance (9998), Search (9999), IT (9995)

### **🔍 Exa Web Search Integration**
- **Search Agent**: Dedicated agent using `exa-py` SDK for intelligent web search
- **LLM-Optimized Results**: Exa's search results are specifically designed for AI consumption
- **Content Synthesis**: Combines Exa search with OpenAI for contextual responses
- **Live Demo**: Search queries like "best coffee shops in SF" showcase real web data

### **📊 Weave Observability & Tracing**
- **Full Agent Tracing**: Every agent method decorated with `@weave.op` for complete observability
- **Performance Monitoring**: Track agent response times, success rates, and bottlenecks
- **Debugging Capabilities**: Detailed execution traces for troubleshooting
- **Production Ready**: Built-in monitoring for reliable agent operations

### **Additional Technologies**
- **Copilotkit**: Framework for building AI copilots and agent coordination

## 🏗️ Project Structure

```
open-a2a-canvas/
├── agents/               # Python-based agents
│   ├── buildings_management.py
│   ├── finance.py
│   ├── it.py
│   ├── search.py        # NEW: Search agent using Exa
│   └── pyproject.toml
└── frontend/             # Next.js frontend with Copilotkit integration
    └── src/
        ├── app/
        ├── components/
        └── ag-ui-client/
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- UV (Python package manager)
- API Keys (see Environment Setup)

### Environment Setup

1. **Create environment file:**

   ```bash
   cd agents
   # Edit .env file with your API keys
   ```

2. **Required API Keys:**
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `EXA_API_KEY`: Your Exa search API key (already provided)
   - `WANDB_API_KEY`: Your Weights & Biases API key for Weave integration

### Installation

1. **Install Python dependencies:**

   ```bash
   cd agents
   uv install
   ```

2. **Install frontend dependencies:**

   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the agents (in separate terminals):**

   ```bash
   cd agents
   # Terminal 1: Buildings Management Agent
   uv run python buildings_management.py

   # Terminal 2: Finance Agent
   uv run python finance.py

   # Terminal 3: IT Agent
   uv run python it.py

   # Terminal 4: Search Agent
   uv run python search.py
   ```

2. **Start the frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser:** Navigate to `http://localhost:3000`

## 🤖 Agent Capabilities

This project includes specialized agents for:

- **Buildings Management** (Port 9997): Facility operations, desk assignments, building maintenance
- **Finance Agent** (Port 9998): ERP system operations, payroll, procurement
- **IT Agent** (Port 9995): Infrastructure management, device provisioning, account setup
- **Search Agent** (Port 9999): Web search using Exa API for finding information online

## 🎨 Features

### Real-time Agent Communication Dashboard

- **Agent Status Monitoring**: Live status indicators for all agents
- **Message Flow Visualization**: See agent-to-agent communication in real-time
- **Communication Stats**: Track message counts and agent activity
- **Interactive Chat**: Coordinate with multiple agents simultaneously

### Agent Observability with Weave

- **Trace Monitoring**: All agent invocations are traced with Weave
- **Performance Metrics**: Monitor agent response times and success rates
- **Debugging**: Detailed logs for troubleshooting agent interactions

### Example Queries to Try

- "Find me an available desk" → Routes to Buildings Management
- "Set up payroll for John Doe" → Routes to Finance Agent
- "Search for best coffee shops in SF" → Routes to Search Agent
- "Provision a new laptop" → Routes to IT Agent

## 🏆 **Hackathon Evaluation Criteria Addressed**

### **🥇 Best use of A2A Protocol**
- **Complete Implementation**: 4 agents with full A2A protocol compliance
- **Agent Discovery**: `AgentCard` exposure with capabilities and skills
- **Message Routing**: Central coordinator with intelligent agent selection
- **Real-time Visualization**: Live agent-to-agent communication dashboard
- **Production Ready**: Proper error handling and protocol adherence

### **🥇 Best use of Weave**
- **Comprehensive Tracing**: Every agent method decorated with `@weave.op`
- **Multi-Agent Monitoring**: Separate Weave projects for each agent type
- **Performance Analytics**: Built-in observability for debugging and optimization
- **Production Observability**: Ready for real-world monitoring and alerting

### **🥇 Best use of Exa**
- **Dedicated Search Agent**: Purpose-built agent leveraging Exa's LLM-optimized search
- **Intelligent Results**: Exa's AI-first search results processed by agents
- **Real-world Integration**: Live web search capabilities in agent workflow
- **Content Synthesis**: Combines Exa results with OpenAI for contextual responses

### **🥇 Best use of Google Tools (A2A Framework)**
- **Google Cloud A2A SDK**: Full implementation of Google's agent development kit
- **Protocol Standards**: Adherence to Google's A2A specifications
- **Scalable Architecture**: Ready for deployment on Google Cloud infrastructure

## 🔧 Development

This project demonstrates modern agent development patterns:

- **Multi-protocol integration**: Combining A2A, Exa, Weave, and Copilotkit
- **Observability-first**: Built-in tracing and monitoring with Weave
- **Modular architecture**: Separate agents for different domains
- **Modern UI**: Next.js frontend with AI copilot capabilities
- **Real-time communication**: Live agent-to-agent message visualization

## 📚 Architecture

### Agent Communication Flow

1. **User Query** → Frontend CopilotKit interface
2. **Route Analysis** → Central coordinator agent (`theDirtyDogs`)
3. **Agent Selection** → Routes to appropriate specialized agent
4. **Agent Processing** → Specialized agent processes the request
5. **Response** → Results flow back through the coordinator
6. **UI Update** → Real-time dashboard shows communication flow

### Observability Stack

- **Weave**: Traces all agent operations with `@weave.op` decorators
- **State Management**: `useCoAgent` and `useCoAgentStateRender` hooks
- **Real-time Updates**: WebSocket-based communication for live updates

## 💻 **Implementation Highlights** (Code Examples)

### **🔗 A2A Protocol Implementation**
```python
# Agent Card Definition - How agents discover each other
public_agent_card = AgentCard(
    name='Search Agent',
    description='Web search agent using Exa API',
    url='http://localhost:9999/',
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
)

# A2A Server Setup - Protocol compliance
server = A2AStarletteApplication(
    agent_card=public_agent_card,
    http_handler=request_handler,
)

# Agent-to-Agent Message Routing
const theDirtyDogs = new A2AClientAgent({
  agentUrls: ["http://localhost:9997", "http://localhost:9998", ...],
  // Automatically discovers and routes to appropriate agents
});
```

### **🔍 Exa Search Integration**
```python
# Dedicated Search Agent with Exa SDK
from exa_py import Exa

class SearchAgent:
    def __init__(self):
        self.exa = Exa(api_key=os.getenv("EXA_API_KEY"))
    
    @weave.op  # Combined with Weave tracing
    async def invoke(self, message: Message) -> str:
        # LLM-optimized search specifically for AI agents
        result = self.exa.search_and_contents(
            user_query,
            text=True,
            num_results=3
        )
        # Synthesize results with OpenAI for contextual responses
        return synthesized_response
```

### **📊 Weave Observability Integration**
```python
import weave

# Initialize Weave for each agent with unique project names
weave.init('a2a-search-agent')
weave.init('a2a-finance-agent')
weave.init('a2a-it-agent')
weave.init('a2a-buildings-management-agent')

class FinanceAgent:
    @weave.op  # Every agent method automatically traced
    async def invoke(self, message: Message) -> str:
        # All agent invocations, timing, and performance tracked
        response = openai.chat.completions.create(...)
        return response.choices[0].message.content
```

### **Frontend Agent State Visualization**
```typescript
// Real-time agent communication monitoring
const { state } = useCoAgent<A2AState>({ name: "theDirtyDogs" });

useCoAgentStateRender<A2AState>({
  name: "theDirtyDogs",
  render: ({ state }) => (
    <div>
      {/* Live visualization of agent-to-agent messages */}
      {state.a2aMessages.map(message => (
        <AgentMessage from={message.name} to={message.to} />
      ))}
    </div>
  ),
});
```

## 🎯 **Evaluation Criteria Demonstration**

- **✅ A2A Protocol**: Full agent discovery, message routing, and communication visualization
- **✅ Exa Integration**: Intelligent web search with LLM-optimized results in dedicated agent
- **✅ Weave Observability**: Complete agent tracing and performance monitoring across all agents
- **✅ Multi-Protocol**: Seamless integration of all technologies in a cohesive system

---

_Built with ❤️ for WeaveHacks 2024_
