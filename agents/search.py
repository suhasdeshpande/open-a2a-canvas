import uvicorn
import os
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
from exa_py import Exa
import weave

# Initialize Weave (optional)
try:
    weave.init('a2a-search-agent')
    print("✅ Weave initialized for search agent")
    weave_op = weave.op
except Exception as e:
    print(f"⚠️  Weave initialization failed: {e}")
    print("Agent will run without Weave tracing")
    # Create a no-op decorator when weave is not available
    def weave_op(func):
        return func

class SearchAgent:
    """Search Agent using Exa."""

    def __init__(self):
        exa_api_key = os.getenv("EXA_API_KEY")
        if not exa_api_key:
            raise ValueError("EXA_API_KEY environment variable is required")
        self.exa = Exa(api_key=exa_api_key)

    @weave_op
    async def invoke(self, message: Message) -> str:
        user_query = message.parts[0].root.text

        try:
            # Search using Exa
            result = self.exa.search_and_contents(
                user_query,
                text=True,
                num_results=3
            )

            # Format the results
            search_results = []
            for i, item in enumerate(result.results, 1):
                search_results.append(f"{i}. {item.title}\n{item.url}\n{item.text[:200]}...")

            formatted_results = "\n\n".join(search_results)

            # Use OpenAI to synthesize the search results
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a search agent. Based on the search results provided, give a helpful and concise answer to the user's query. Include relevant information from the search results."},
                    {"role": "user", "content": f"Query: {user_query}\n\nSearch Results:\n{formatted_results}"}
                ]
            )

            return response.choices[0].message.content

        except Exception as e:
            return f"Sorry, I encountered an error while searching: {str(e)}"

skill = AgentSkill(
    id='search_agent',
    name='Web Search Agent',
    description='Searches the web using Exa and provides relevant information',
    tags=['search', 'web', 'exa'],
    examples=[
        'Search for best spot to eat burritos in SF',
        'Find information about recent AI developments',
        'Look up the latest news about climate change'
    ],
)

public_agent_card = AgentCard(
    name='Search Agent',
    description='A web search agent that uses Exa to find and summarize information from the web',
    url='http://localhost:9999/',
    version='1.0.0',
    defaultInputModes=['text'],
    defaultOutputModes=['text'],
    capabilities=AgentCapabilities(streaming=True),
    skills=[skill],
    supportsAuthenticatedExtendedCard=True,
)


class SearchAgentExecutor(AgentExecutor):
    """Search Agent Implementation."""

    def __init__(self):
        self.agent = SearchAgent()

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
        agent_executor=SearchAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
        extended_agent_card=public_agent_card,
    )

    uvicorn.run(server.build(), host='0.0.0.0', port=9999)

if __name__ == '__main__':
    main()
