from typing import Any
from collections import OrderedDict
from strands import Agent
from botocore.config import Config
import asyncio
from strands.agent.conversation_manager.null_conversation_manager import NullConversationManager
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from model.load import load_model

# Wasel tools
from tools import (
    confirm_pothole,
    file_pothole_report,
    get_nearby_reports,
    calculate_priority,
    notify_construction,
)

app = BedrockAgentCoreApp()
log = app.logger

SYSTEM_PROMPT = """You are Wasel (واصل), an AI road safety assistant for Saudi Arabia.
Your job is to detect, confirm, and report potholes and road damage so they get fixed fast.

When a user shares a photo or reports a pothole:
1. Call confirm_pothole to verify it is real road damage.
2. If confirmed, call get_nearby_reports to find cluster reports within 1 km.
3. Call calculate_priority using the severity and nearby count.
4. Call file_pothole_report to save the report with GPS and photo.
5. Call notify_construction to alert the repair team.
6. Tell the user their report ID, priority level, and expected fix timeline.

Always reply in the same language the user writes in (Arabic or English).
Be concise, action-oriented, and reassuring.

أنت واصل، مساعد سلامة الطرق الذكي للمملكة العربية السعودية.
"""

tools = [
    confirm_pothole,
    file_pothole_report,
    get_nearby_reports,
    calculate_priority,
    notify_construction,
]

_INLINE_FUNCTION_NAMES = set()

def _make_conversation_manager():
    return NullConversationManager()

def agent_factory():
    cache = OrderedDict()
    def get_or_create_agent(session_id):
        if session_id in cache:
            cache.move_to_end(session_id)
            return cache[session_id]
        if len(cache) >= 128:
            cache.popitem(last=False)
        cache[session_id] = Agent(
            model=load_model(),
            system_prompt=SYSTEM_PROMPT,
            tools=tools,
            conversation_manager=_make_conversation_manager(),
        )
        return cache[session_id]
    return get_or_create_agent
get_or_create_agent = agent_factory()


def strip_trailing_tool_use(messages: Any) -> list[dict]:
    if not isinstance(messages, list):
        raise ValueError("messages must be a list")
    messages = list(messages)
    while messages:
        last = messages[-1]
        if not isinstance(last, dict):
            raise ValueError("each message must be an object")
        original_content = last.get("content", [])
        if not isinstance(original_content, list) or not all(isinstance(block, dict) for block in original_content):
            raise ValueError("each message content value must be a list of content blocks")
        content = [block for block in original_content if "toolUse" not in block]
        if len(content) == len(original_content):
            break
        if content:
            messages[-1] = {**last, "content": content}
            break
        messages.pop()
    return messages


def _extract_prompt(payload: dict):
    if not isinstance(payload, dict):
        raise ValueError("payload must be a JSON object")
    if "messages" in payload:
        return strip_trailing_tool_use(payload["messages"])
    if "tool_results" in payload:
        tool_results = payload["tool_results"]
        if not isinstance(tool_results, list) or not all(
            isinstance(tr, dict) and isinstance(tr.get("toolUseId"), str)
            for tr in tool_results
        ):
            raise ValueError("tool_results must contain objects with a toolUseId string")
        return [{"role": "user", "content": [{"toolResult": {
            "toolUseId": tr["toolUseId"],
            "status": tr.get("status", "success"),
            "content": tr.get("content", []),
        }} for tr in tool_results]}]
    prompt = payload.get("prompt", "")
    if not isinstance(prompt, str):
        raise ValueError("prompt must be a string")
    return prompt


@app.entrypoint
async def invoke(payload, context):
    log.info("Wasel agent invoked")
    session_id = getattr(context, "session_id", "default-session")
    agent = get_or_create_agent(session_id)
    prompt = _extract_prompt(payload)
    async for event in agent.stream_async(prompt):
        if not isinstance(event, dict) or "event" not in event:
            continue
        cbs = event["event"].get("contentBlockStart")
        if cbs is not None and not cbs.get("start"):
            continue
        yield event


if __name__ == "__main__":
    app.run()