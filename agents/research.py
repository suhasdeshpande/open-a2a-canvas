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
    weave.init('a2a-research-agent')
    print("✅ Weave initialized for research agent")
    weave_op = weave.op
except Exception as e:
    print(f"⚠️  Weave initialization failed: {e}")
    print("Agent will run without Weave tracing")
    # Create a no-op decorator when weave is not available
    def weave_op(func):
        return func

class ResearchAgent:
    """Research Agent for destination and travel information."""

    @weave_op
    async def invoke(self, message: Message) -> str:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a comprehensive travel research specialist who provides detailed information about destinations worldwide. You help travelers understand their destination's weather patterns, cultural norms, local customs, seasonal considerations, popular activities, safety information, transportation options, currency, language, and practical travel tips. Consider factors like the time of year, local holidays, cultural sensitivity, and regional variations. Provide actionable insights that help travelers prepare for their specific destination and travel dates. Focus on practical information that impacts packing and travel preparation decisions."},
                {"role": "user", "content": message.parts[0].root.text}
            ]
        )
        return response.choices[0].message.content

skill = AgentSkill(
    id='research_agent',
    name='Destination Research Specialist',
    description='Provides comprehensive destination research including weather, culture, activities, and travel tips',
    tags=['research', 'destination', 'weather', 'culture', 'activities'],
    examples=[
        'Research Tokyo weather and cultural norms for December travel',
        'What should I know about traveling to Morocco in summer?',
        'Cultural considerations and activities for a trip to Iceland'
    ],
)

public_agent_card = AgentCard(
    name='Research Agent',
    description='Expert destination researcher providing weather, cultural insights, activities, and practical travel information',
    url='http://localhost:9996/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=True,
)


class ResearchAgentExecutor(AgentExecutor):
    """Research Agent Implementation."""

    def __init__(self):
        self.agent = ResearchAgent()

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
        agent_executor=ResearchAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    uvicorn.run(server.build(), host='0.0.0.0', port=9996)

if __name__ == '__main__':
    main()