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
a2a/
├── agent-client/          # TypeScript client for agent interactions
├── agents/               # Python-based agents
│   ├── buildings_management.py
│   ├── finance.py
│   ├── it.py
│   └── main.py
└── frontend/             # Next.js frontend with Copilotkit integration
    └── src/
        ├── app/
        └── components/
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- UV (Python package manager)

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up Python agents:**

   ```bash
   cd agents
   uv install
   ```

3. **Start the frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

4. **Run the agents:**
   ```bash
   cd agents
   uv run python main.py
   ```

## 🤖 Agent Capabilities

This project includes specialized agents for:

- **Buildings Management**: Facility operations and maintenance
- **Finance**: Financial analysis and reporting
- **IT**: Technical support and system management

Each agent can communicate with others through the A2A protocol, search the web via Exa, and provide observability through Weave.

## 🏆 Hackathon Prizes Targeting

- **Best use of protocols**: Showcasing A2A and multi-protocol integration
- **Best use of Weave**: Comprehensive agent tracing and observability
- **Best use of Google tools**: Leveraging Google Cloud's A2A framework
- **Best use of Exa**: Intelligent web search for agent decision-making

## 📚 Documentation

For detailed implementation guides and API documentation, check the individual component READMEs:

- [Frontend README](./frontend/README.md)
- [Agents README](./agents/README.md)

## 🔧 Development

This project demonstrates modern agent development patterns:

- **Multi-protocol integration**: Combining A2A, Exa, Weave, and Copilotkit
- **Observability-first**: Built-in tracing and monitoring
- **Modular architecture**: Separate agents for different domains
- **Modern UI**: Next.js frontend with AI copilot capabilities

---

_Built with ❤️ for WeaveHacks 2024_
a
