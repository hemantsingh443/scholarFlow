"""
Planner Node

The Planner is a "Senior Research Director" that breaks down
the user's research query into 3-5 searchable sub-questions.
"""

import json
import logging
from typing import Dict, Any

from app.agents.state import ResearchState
from app.llm.client import completion

logger = logging.getLogger(__name__)


PLANNER_SYSTEM_PROMPT = """You are a Senior Research Director at a leading academic research institution.

Your role is to break down complex research questions into specific, searchable sub-questions
that can be answered by querying academic papers on ArXiv.

Guidelines:
1. Create 3-5 distinct, focused questions
2. Order them logically (foundational concepts first, advanced topics later)
3. Make each question specific enough to get relevant search results
4. Cover different aspects of the research topic
5. Do NOT answer the questions - just list them

IMPORTANT: Respond ONLY with a valid JSON array of strings. No other text."""


PLANNER_USER_PROMPT = """Break down this research goal into 3-5 searchable academic questions:

Research Goal: {query}

Respond with a JSON array of questions:"""


def plan_research(state: ResearchState) -> Dict[str, Any]:
    """
    Generate a research plan from the user's query.
    
    This node uses the "smart" model (MiMo-V2-Flash) for complex
    reasoning and planning tasks.
    
    Args:
        state: Current research state
        
    Returns:
        State updates with the generated plan
    """
    query = state["original_query"]
    logger.info(f"Planning research for: {query}")
    
    prompt = PLANNER_USER_PROMPT.format(query=query)
    
    try:
        response = completion(
            prompt=prompt,
            model_type="smart",  # Use MiMo-V2-Flash for planning
            system_prompt=PLANNER_SYSTEM_PROMPT
        )
        
        # Parse the JSON response
        # Handle potential markdown code blocks
        cleaned_response = response.strip()
        if cleaned_response.startswith("```"):
            # Remove markdown code blocks
            lines = cleaned_response.split("\n")
            cleaned_response = "\n".join(
                line for line in lines 
                if not line.startswith("```")
            )
        
        plan = json.loads(cleaned_response)
        
        # Validate the plan
        if not isinstance(plan, list):
            raise ValueError("Plan must be a list")
        
        if len(plan) < 1:
            raise ValueError("Plan must have at least one question")
        
        # Ensure all items are strings
        plan = [str(item) for item in plan]
        
        logger.info(f"Generated plan with {len(plan)} questions")
        
        return {
            "plan": plan,
            "current_task_index": 0,
            "status": "researching",
            "logs": [f"Created research plan with {len(plan)} questions:\n" + 
                    "\n".join(f"  {i+1}. {q}" for i, q in enumerate(plan))]
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse planner response as JSON: {e}")
        logger.error(f"Response was: {response}")
        
        # Fallback: use the original query as a single question
        return {
            "plan": [query],
            "current_task_index": 0,
            "status": "researching",
            "logs": [f"Could not parse plan, using original query: {query}"]
        }
        
    except Exception as e:
        logger.error(f"Planner error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "logs": [f"Planning failed: {str(e)}"]
        }
