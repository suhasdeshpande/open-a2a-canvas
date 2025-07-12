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

    @weave_op
    async def invoke(self, message: Message) -> str:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are the world's best packing coordinator and travel preparation specialist. You synthesize information from clothing experts, personal belongings specialists, documentation experts, destination researchers, and search results to create the ultimate packing strategy. You provide comprehensive, organized packing lists with categories (clothing, electronics, documents, toiletries, etc.), packing tips, weight distribution advice, and strategic recommendations. Consider factors like luggage restrictions, climate variations, trip duration, activities planned, and space optimization. Create prioritized lists with 'essential', 'recommended', and 'optional' items. Provide packing order suggestions and travel day tips. Your goal is to ensure travelers are perfectly prepared without overpacking."},
                {"role": "user", "content": message.parts[0].root.text}
            ]
        )
        return response.choices[0].message.content

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