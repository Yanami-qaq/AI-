from openai import AsyncOpenAI
from app.core.config import settings

# DeepSeek API 兼容 OpenAI 接口格式
_client: AsyncOpenAI | None = None


def get_llm_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL,
        )
    return _client


async def chat_completion(messages: list[dict], temperature: float = 0.7, max_tokens: int = 2000) -> str:
    client = get_llm_client()
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content
