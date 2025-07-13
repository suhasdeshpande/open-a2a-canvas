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
        # Initialize with default items matching frontend structure
        self.default_items = [
            {"id": "passport", "name": "Passport", "category": "essentials", "priority": "essential", "packed": False},
            {"id": "phone", "name": "Phone", "category": "essentials", "priority": "essential", "packed": False},
            {"id": "wallet", "name": "Wallet", "category": "essentials", "priority": "essential", "packed": False},
            {"id": "tshirts", "name": "T-Shirts", "category": "clothing", "priority": "essential", "packed": False},
            {"id": "pants", "name": "Pants", "category": "clothing", "priority": "essential", "packed": False},
            {"id": "underwear", "name": "Underwear", "category": "clothing", "priority": "essential", "packed": False},
            {"id": "toothbrush", "name": "Toothbrush", "category": "toiletries", "priority": "recommended", "packed": False},
            {"id": "shampoo", "name": "Shampoo", "category": "toiletries", "priority": "recommended", "packed": False},
            {"id": "deodorant", "name": "Deodorant", "category": "toiletries", "priority": "recommended", "packed": False},
            {"id": "charger", "name": "Charger", "category": "electronics", "priority": "essential", "packed": False},
            {"id": "camera", "name": "Camera", "category": "electronics", "priority": "recommended", "packed": False},
            {"id": "headphones", "name": "Headphones", "category": "electronics", "priority": "optional", "packed": False},
        ]

        self.packing_state = {
            "items": self.default_items.copy(),
            "categories": self._calculate_categories(self.default_items),
            "progress": 0,
            "totalPacked": 0,
            "totalItems": len(self.default_items)
        }

    def _calculate_categories(self, items):
        """Calculate category statistics from items list"""
        categories = {}
        for item in items:
            category = item["category"]
            if category not in categories:
                categories[category] = {"packed": 0, "total": 0, "priority": "medium"}

            categories[category]["total"] += 1
            if item["packed"]:
                categories[category]["packed"] += 1

        return categories

    @weave_op
    async def invoke(self, message: Message) -> str:
        user_message = message.parts[0].root.text

        # Check if this is a packing state update request
        if "update_packing_state" in user_message.lower() or "mark_packed" in user_message.lower():
            return self._handle_packing_update(user_message)

        # Check if user is asking about packing status
        if any(keyword in user_message.lower() for keyword in ["packing", "packed", "items", "progress", "status"]):
            return self._get_packing_status()

        # Generate packing recommendations and initialize state if needed
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"""You are the world's best packing coordinator and travel preparation specialist. You help travelers pack efficiently and comprehensively.

Current packing state:
- Total items: {self.packing_state['totalItems']}
- Packed items: {self.packing_state['totalPacked']}
- Progress: {self.packing_state['progress']}%

When providing packing advice:
1. Reference the current packing state above
2. Suggest specific items to pack next based on their priority
3. Provide practical packing tips and strategies
4. Help users organize and prioritize their packing

You can mark items as packed by saying "Mark [item name] as packed" in your response.
You can check current status by asking about packing progress.

Structure your responses to be helpful and actionable. Focus on practical advice for the user's specific travel needs."""},
                {"role": "user", "content": user_message}
            ]
        )

        recommendations = response.choices[0].message.content

        # Parse response for any packing commands
        if "mark" in recommendations.lower() and "packed" in recommendations.lower():
            self._parse_recommendations_for_updates(recommendations)

        return recommendations

    def _handle_packing_update(self, message: str) -> str:
        """Handle requests to update packing state"""
        # Parse update commands like "update_packing_state: packed Passport"
        if "packed" in message.lower() or "unpacked" in message.lower():
            parts = message.split()
            if len(parts) >= 3:
                action = parts[1]  # "packed" or "unpacked"
                item_name = " ".join(parts[2:])  # rest is item name

                # Find and update the item in our state
                was_updated = self._update_item_status(item_name, action == "packed")

                if was_updated:
                    status = self._get_packing_status()
                    # Add explicit state update command for frontend parsing
                    return f"update_packing_state: {action} {item_name}\n\n{status}"

        return self._get_packing_status()

    def _update_item_status(self, item_name: str, packed: bool):
        """Update the packed status of an item"""
        item_name_lower = item_name.lower()
        item_updated = False

        # Find the item by name (fuzzy matching)
        for item in self.packing_state["items"]:
            item_dict_name = item["name"].lower()
            if (item_dict_name == item_name_lower or
                item_name_lower in item_dict_name or
                item_dict_name in item_name_lower):

                old_status = item["packed"]
                item["packed"] = packed
                if old_status != packed:
                    item_updated = True
                    print(f"✅ Updated {item['name']}: {old_status} -> {packed}")
                break

        if item_updated:
            # Recalculate totals
            self.packing_state["totalPacked"] = sum(1 for item in self.packing_state["items"] if item["packed"])
            self.packing_state["progress"] = int((self.packing_state["totalPacked"] / self.packing_state["totalItems"] * 100)) if self.packing_state["totalItems"] > 0 else 0
            self.packing_state["categories"] = self._calculate_categories(self.packing_state["items"])

        return item_updated

    def _get_packing_status(self) -> str:
        """Return current packing status"""
        packed_items = [item["name"] for item in self.packing_state["items"] if item["packed"]]
        unpacked_items = [item["name"] for item in self.packing_state["items"] if not item["packed"]]

        status = f"""📦 **Packing Progress: {self.packing_state['progress']}%**

✅ **Packed ({self.packing_state['totalPacked']} items):**
{', '.join(packed_items) if packed_items else 'None yet'}

⚪ **Still to Pack ({len(unpacked_items)} items):**
{', '.join(unpacked_items) if unpacked_items else 'All packed!'}

💡 **Tip:** {self._get_packing_tip()}

Ready to help you pack more items! Just say "Mark [item name] as packed" when you're done with an item."""

        return status

    def _get_packing_tip(self) -> str:
        """Get a relevant packing tip based on current progress"""
        progress = self.packing_state['progress']
        if progress == 0:
            return "Start with essentials like passport, phone, and wallet!"
        elif progress < 50:
            return "Focus on clothing and toiletries next - pack heaviest items first."
        elif progress < 80:
            return "Don't forget electronics and their chargers!"
        else:
            return "Almost done! Double-check your essentials and documents."

    def _parse_recommendations_for_updates(self, recommendations: str):
        """Parse recommendations text for packing update commands"""
        lines = recommendations.lower().split('\n')
        for line in lines:
            if 'mark' in line and 'packed' in line:
                # Extract item name between "mark" and "packed"
                try:
                    start = line.find('mark') + 4
                    end = line.find('packed')
                    if start < end:
                        item_name = line[start:end].strip()
                        self._update_item_status(item_name, True)
                except:
                    continue

    def get_state_for_frontend(self):
        """Get state in format expected by frontend"""
        return self.packing_state

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