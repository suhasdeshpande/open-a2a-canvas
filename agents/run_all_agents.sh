#!/bin/bash

# A2A Travel Packing Agents - Start All Script
echo "🧳 Starting all travel packing agents..."

# Kill any existing processes on these ports first
echo "Cleaning up existing processes..."
lsof -ti:9994,9995,9996,9997,9998,9999 | xargs kill -9 2>/dev/null || true

# Start all agents in background
echo "Starting agents..."

echo "  🎒 Personal Belongings Agent (Port 9997)..."
uv run python personal_belongings.py &
PERSONAL_PID=$!

echo "  👕 Clothing Agent (Port 9998)..."
uv run python clothing.py &
CLOTHING_PID=$!

echo "  🔍 Search Agent (Port 9999)..."
uv run python search.py &
SEARCH_PID=$!

echo "  📄 Documents Agent (Port 9995)..."
uv run python documents.py &
DOCUMENTS_PID=$!

echo "  🗺️  Research Agent (Port 9996)..."
uv run python research.py &
RESEARCH_PID=$!

echo "  📦 Packing Agent (Port 9994)..."
uv run python packing.py &
PACKING_PID=$!

# Wait a moment for startup
sleep 3

echo ""
echo "✅ All agents started successfully!"
echo ""
echo "Agent Status:"
echo "  Personal Belongings: http://localhost:9997 (PID: $PERSONAL_PID)"
echo "  Clothing:           http://localhost:9998 (PID: $CLOTHING_PID)"
echo "  Search:             http://localhost:9999 (PID: $SEARCH_PID)"
echo "  Documents:          http://localhost:9995 (PID: $DOCUMENTS_PID)"
echo "  Research:           http://localhost:9996 (PID: $RESEARCH_PID)"
echo "  Packing:            http://localhost:9994 (PID: $PACKING_PID)"
echo ""
echo "🌍 Frontend: http://localhost:3000"
echo ""
echo "To stop all agents, run: ./stop_all_agents.sh"
echo "Press Ctrl+C to stop this script (agents will continue running)"

# Wait for user input
wait 