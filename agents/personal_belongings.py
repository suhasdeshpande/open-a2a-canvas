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

# Initialize Weave
weave.init('a2a-personal-belongings-agent')

class PersonalBelongingsAgent:
    """Personal Belongings Agent for travel packing recommendations."""

    @weave.op
    async def invoke(self, message: Message) -> str:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a personal belongings and electronics specialist for travel packing. You help travelers pack essential personal items including electronics (laptop, phone, chargers, adapters), toiletries, medications, accessories, and other personal necessities. Consider factors like destination power outlets, travel duration, airline restrictions, security requirements, and local availability of items. Provide specific recommendations with quantities and important reminders (e.g., 'universal power adapter for European outlets', 'prescription medications in original containers'). Focus on practical essentials and convenience items that make travel smoother."},
                {"role": "user", "content": message.parts[0].root.text}
            ]
        )
        return response.choices[0].message.content

skill = AgentSkill(
    id='personal_belongings_agent',
    name='Personal Belongings Specialist',
    description='Recommends personal items, electronics, toiletries, and accessories for travel',
    tags=['personal', 'electronics', 'toiletries', 'accessories', 'travel'],
    examples=[
        'What electronics should I pack for a business trip to Japan?',
        'Personal items checklist for a 10-day European vacation',
        'Toiletries and medications for international travel'
    ],
)

public_agent_card = AgentCard(
    name='Personal Belongings Agent',
    description='Specialist in personal items, electronics, toiletries, and travel accessories to ensure you have everything you need',
    url='http://localhost:9997/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=True,
)


class PersonalBelongingsAgentExecutor(AgentExecutor):
    """Personal Belongings Agent Implementation."""

    def __init__(self):
        self.agent = PersonalBelongingsAgent()

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
        agent_executor=PersonalBelongingsAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    uvicorn.run(server.build(), host='0.0.0.0', port=9997)

if __name__ == '__main__':
    main()