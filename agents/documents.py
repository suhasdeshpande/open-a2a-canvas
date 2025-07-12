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
weave.init('a2a-documents-agent')

class DocumentsAgent:
    """Documents Agent for travel documentation requirements."""

    @weave.op
    async def invoke(self, message: Message) -> str:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a travel documentation specialist who helps travelers prepare all necessary documents for their trips. You provide guidance on passports, visas, travel insurance, vaccination certificates, driver's licenses, travel permits, and other required documentation. Consider factors like destination country requirements, travel duration, purpose of visit, traveler's nationality, and current international travel regulations. Provide specific guidance on document validity periods, application processes, and important deadlines. Always emphasize checking official government sources for the most current requirements."},
                {"role": "user", "content": message.parts[0].root.text}
            ]
        )
        return response.choices[0].message.content

skill = AgentSkill(
    id='documents_agent',
    name='Travel Documentation Specialist',
    description='Provides guidance on passports, visas, travel insurance, and other required travel documents',
    tags=['documents', 'passport', 'visa', 'insurance', 'travel'],
    examples=[
        'What documents do I need to travel from US to Japan?',
        'Visa requirements for European travel',
        'Travel insurance and health documentation for Africa'
    ],
)

public_agent_card = AgentCard(
    name='Documents Agent',
    description='Expert in travel documentation requirements including passports, visas, insurance, and permits for international travel',
    url='http://localhost:9995/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=True,
)


class DocumentsAgentExecutor(AgentExecutor):
    """Documents Agent Implementation."""

    def __init__(self):
        self.agent = DocumentsAgent()

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
        agent_executor=DocumentsAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    uvicorn.run(server.build(), host='0.0.0.0', port=9995)

if __name__ == '__main__':
    main()