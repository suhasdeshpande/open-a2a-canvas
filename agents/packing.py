import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
)
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.utils import new_agent_text_message
from a2a.types import (
    Message
)
import openai
import weave

# Initialize Weave (optional)
try:
    weave.init('a2a-packing-agent')
    print("✅ Weave initialized for packing agent")
    weave_op = weave.op
except Exception as e:
    print(f"⚠️  Weave initialization failed: {e}")
    print("Agent will run without Weave tracing")
    # Create a no-op decorator when weave is not available
    def weave_op(func):
        return func

class PackingAgent:
    """Master Packing Agent that coordinates and synthesizes all packing recommendations."""

    def __init__(self):
        self.packing_state = {
            "items": {},
            "categories": {
                "essentials": {"packed": 0, "total": 0, "priority": "high"},
                "clothing": {"packed": 0, "total": 0, "priority": "high"},
                "toiletries": {"packed": 0, "total": 0, "priority": "medium"},
                "electronics": {"packed": 0, "total": 0, "priority": "medium"},
                "documents": {"packed": 0, "total": 0, "priority": "high"},
                "extras": {"packed": 0, "total": 0, "priority": "low"}
            },
            "progress": 0
        }

    @weave_op
    async def invoke(self, message: Message) -> str:
        user_message = message.parts[0].root.text

        # Check if this is a packing state update request
        if "update_packing_state" in user_message.lower() or "mark_packed" in user_message.lower():
            return self._handle_packing_update(user_message)

        # Generate packing recommendations
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": """You are the world's best packing coordinator and travel preparation specialist. You synthesize information from clothing experts, personal belongings specialists, documentation experts, destination researchers, and search results to create the ultimate packing strategy.

You provide comprehensive, organized packing lists with categories (clothing, electronics, documents, toiletries, etc.), packing tips, weight distribution advice, and strategic recommendations. Consider factors like luggage restrictions, climate variations, trip duration, activities planned, and space optimization.

Create prioritized lists with 'essential', 'recommended', and 'optional' items. Provide packing order suggestions and travel day tips. Your goal is to ensure travelers are perfectly prepared without overpacking.

When providing recommendations, structure them clearly by category:
- **Essentials** (passport, phone, wallet, etc.)
- **Clothing** (weather-appropriate attire)
- **Toiletries** (personal care items)
- **Electronics** (chargers, devices, adapters)
- **Documents** (tickets, insurance, visas)
- **Extras** (entertainment, comfort items)

For each item, indicate the priority level (essential/recommended/optional) and quantity needed."""},
                {"role": "user", "content": user_message}
            ]
        )

        # Parse the response to extract items and update state
        recommendations = response.choices[0].message.content
        self._extract_items_from_recommendations(recommendations)

        return recommendations

    def _handle_packing_update(self, message: str) -> str:
        """Handle requests to update packing state"""
        # This would parse commands like "mark passport as packed"
        # For now, return current state
        total_items = sum(cat["total"] for cat in self.packing_state["categories"].values())
        packed_items = sum(cat["packed"] for cat in self.packing_state["categories"].values())
        progress = int((packed_items / total_items * 100)) if total_items > 0 else 0

        return f"""Packing Progress Update:

**Current Status:** {packed_items}/{total_items} items packed ({progress}%)

**By Category:**
- Essentials: {self.packing_state['categories']['essentials']['packed']}/{self.packing_state['categories']['essentials']['total']}
- Clothing: {self.packing_state['categories']['clothing']['packed']}/{self.packing_state['categories']['clothing']['total']}
- Toiletries: {self.packing_state['categories']['toiletries']['packed']}/{self.packing_state['categories']['toiletries']['total']}
- Electronics: {self.packing_state['categories']['electronics']['packed']}/{self.packing_state['categories']['electronics']['total']}
- Documents: {self.packing_state['categories']['documents']['packed']}/{self.packing_state['categories']['documents']['total']}
- Extras: {self.packing_state['categories']['extras']['packed']}/{self.packing_state['categories']['extras']['total']}

Ready to help you pack more efficiently!"""

    def _extract_items_from_recommendations(self, recommendations: str):
        """Extract and categorize items from recommendations text"""
        # Simple parsing - in a real implementation this would be more sophisticated
        lines = recommendations.lower().split('\n')
        current_category = None

        for line in lines:
            line = line.strip()
            if 'essential' in line:
                current_category = 'essentials'
            elif 'clothing' in line:
                current_category = 'clothing'
            elif 'toiletries' in line or 'personal care' in line:
                current_category = 'toiletries'
            elif 'electronics' in line or 'device' in line:
                current_category = 'electronics'
            elif 'document' in line:
                current_category = 'documents'
            elif 'extra' in line or 'entertainment' in line:
                current_category = 'extras'
            elif line.startswith('-') or line.startswith('*') and current_category:
                # Found an item, increment total for category
                self.packing_state["categories"][current_category]["total"] += 1

skill = AgentSkill(
    id='packing_agent',
    name='Master Packing Coordinator',
    description='Synthesizes all specialist recommendations into comprehensive, organized packing strategies',
    tags=['packing', 'coordination', 'strategy', 'luggage', 'travel'],
    examples=[
        'Create a complete packing list for 2 weeks in Europe',
        'Optimize packing strategy for carry-on only business trip',
        'Comprehensive packing plan for family vacation to Thailand'
    ],
)

public_agent_card = AgentCard(
    name='Packing Agent',
    description='Master packing coordinator who creates comprehensive, organized packing strategies by synthesizing expert recommendations',
    url='http://localhost:9994/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=True,
)


class PackingAgentExecutor(AgentExecutor):
    """Packing Agent Implementation."""

    def __init__(self):
        self.agent = PackingAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        result = await self.agent.invoke(context.message)
        await event_queue.enqueue_event(new_agent_text_message(result))

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> None:
        raise Exception('cancel not supported')

    def get_packing_state(self):
        """Get current packing state for frontend"""
        return self.agent.packing_state


def main():
    request_handler = DefaultRequestHandler(
        agent_executor=PackingAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    uvicorn.run(server.build(), host='0.0.0.0', port=9994)

if __name__ == '__main__':
    main()