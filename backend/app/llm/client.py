"""
OpenRouter Client Wrapper

Provides a unified interface to OpenRouter API with support for:
- Free open-source models (MiMo-V2-Flash, Devstral-2512)
- Model type switching (smart vs fast)
- Streaming responses
"""

from openai import OpenAI
from typing import Generator, Union
import logging

from app.config import llm_config

logger = logging.getLogger(__name__)


def get_llm_client() -> OpenAI:
    """Create an OpenAI client configured for OpenRouter."""
    if not llm_config.API_KEY:
        raise ValueError(
            "OPENROUTER_API_KEY not set. Please set it in your .env file."
        )
    
    return OpenAI(
        base_url=llm_config.BASE_URL,
        api_key=llm_config.API_KEY
    )


def completion(
    prompt: str,
    model_type: str = "fast",
    system_prompt: str = None,
    stream: bool = False
) -> Union[str, Generator]:
    """
    Get a completion from OpenRouter.
    
    Args:
        prompt: The user prompt to send
        model_type: "smart" for planning/synthesis, "fast" for summarization
        system_prompt: Optional system prompt for the conversation
        stream: If True, returns a generator for streaming responses
        
    Returns:
        The completion text, or a generator if streaming
    """
    client = get_llm_client()
    
    # Select model based on type
    if model_type == "smart":
        model = llm_config.SMART_MODEL
    else:
        model = llm_config.FAST_MODEL
    
    logger.info(f"Calling OpenRouter with model: {model}")
    
    # Build messages
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=stream,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "ScholarFlow"
            }
        )
        
        if stream:
            return _stream_response(response)
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"OpenRouter API error: {e}")
        raise


def _stream_response(response) -> Generator[str, None, None]:
    """Generator that yields chunks from streaming response."""
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def acompletion(
    prompt: str,
    model_type: str = "fast",
    system_prompt: str = None
) -> str:
    """
    Async version of completion for use in FastAPI endpoints.
    
    Note: The openai library handles async internally, but we wrap it
    for consistency with our async agent architecture.
    """
    # For now, we use the sync version
    # The openai library's async support can be added if needed
    return completion(prompt, model_type, system_prompt, stream=False)
