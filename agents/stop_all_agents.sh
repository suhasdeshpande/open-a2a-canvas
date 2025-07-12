#!/bin/bash

# A2A Travel Packing Agents - Stop All Script
echo "🛑 Stopping all travel packing agents..."

# Kill processes on agent ports
echo "Terminating agents on ports 9994-9999..."
lsof -ti:9994,9995,9996,9997,9998,9999 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 1

# Check if any are still running
REMAINING=$(lsof -ti:9994,9995,9996,9997,9998,9999 2>/dev/null | wc -l)

if [ "$REMAINING" -eq 0 ]; then
    echo "✅ All agents stopped successfully!"
else
    echo "⚠️  Some processes may still be running. You may need to kill them manually."
    echo "Running processes on agent ports:"
    lsof -i:9994,9995,9996,9997,9998,9999 2>/dev/null || echo "None found"
fi

echo ""
echo "All travel packing agents have been stopped." 