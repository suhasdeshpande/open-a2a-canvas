# A2A Agent Integration Project

## Overview

This project demonstrates the integration of **A2A (Agent-to-Agent)**, **Exa**, **Weave**, and **Copilotkit** protocols for building intelligent agent systems. Built for the **WeaveHacks: Agent Protocols Hackathon** (July 12-13, 2024).

## 🎯 Hackathon Context

**WeaveHacks** is an agent protocols hackathon hosted by Weights & Biases, focusing on agent protocols (MCP, A2A, etc.) and what they unlock. This project showcases how multiple agent protocols can work together to create powerful AI applications.

### Key Technologies

- **A2A (Agent-to-Agent)**: Google Cloud's agent development kit for building and connecting agents
- **Exa**: Web search API built specifically for LLMs and AI products
- **Weave**: Weights & Biases' LLM tracing and observability platform
- **Copilotkit**: Framework for building AI copilots

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

## 🏆 Hackathon Prizes Targeting

- **Best use of protocols**: Showcasing A2A and multi-protocol integration
- **Best use of Weave**: Comprehensive agent tracing and observability
- **Best use of Google tools**: Leveraging Google Cloud's A2A framework
- **Best use of Exa**: Intelligent web search for agent decision-making

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

---

_Built with ❤️ for WeaveHacks 2024_
