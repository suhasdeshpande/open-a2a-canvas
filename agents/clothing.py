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
    weave.init('a2a-clothing-agent')
    print("✅ Weave initialized for clothing agent")
    weave_op = weave.op
except Exception as e:
    print(f"⚠️  Weave initialization failed: {e}")
    print("Agent will run without Weave tracing")
    # Create a no-op decorator when weave is not available
    def weave_op(func):
        return func

class ClothingAgent:
    """Clothing Agent for travel packing recommendations."""

    @weave_op
    async def invoke(self, message: Message) -> str:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional clothing and fashion consultant specializing in travel packing. You help travelers choose the right clothing for their destination, weather conditions, duration, and activities. Consider factors like climate, local dress codes, activities planned, laundry availability, and packing space. Provide specific clothing recommendations with quantities (e.g., '3 t-shirts, 2 pairs of jeans'). Consider versatile pieces that can be mixed and matched. Always consider the destination's weather, cultural norms, and the traveler's planned activities."},
                {"role": "user", "content": message.parts[0].root.text}
            ]
        )
        return response.choices[0].message.content

skill = AgentSkill(
    id='clothing_agent',
    name='Travel Clothing Consultant',
    description='Provides clothing recommendations for travel based on destination, weather, and activities',
    tags=['clothing', 'fashion', 'travel', 'packing'],
    examples=[
        'What clothes should I pack for 5 days in Tokyo in winter?',
        'Clothing recommendations for a beach vacation in Thailand',
        'Business attire for a work trip to London'
    ],
)

public_agent_card = AgentCard(
    name='Clothing Agent',
    description='Expert travel clothing consultant that recommends appropriate attire based on destination, weather, duration, and planned activities',
    url='http://localhost:9998/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=True,
)


class ClothingAgentExecutor(AgentExecutor):
    """Clothing Agent Implementation."""

    def __init__(self):
        self.agent = ClothingAgent()

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
        agent_executor=ClothingAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    uvicorn.run(server.build(), host='0.0.0.0', port=9998)

if __name__ == '__main__':
    main()