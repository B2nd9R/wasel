"""
agent.py — Wasel Strands Agent with AgentCore Memory.
Handles the full pipeline: vision confirmation → report → priority → alert.
"""

import os
import uuid
import time

import requests
from botocore.config import Config
from strands import Agent
from strands.models import BedrockModel
from bedrock_agentcore.memory.integrations.strands.config import AgentCoreMemoryConfig
from bedrock_agentcore.memory.integrations.strands.session_manager import (
    AgentCoreMemorySessionManager,
)

import config
from tools import (
    confirm_pothole,
    file_pothole_report,
    get_nearby_reports,
    calculate_priority,
    notify_construction,
)

SYSTEM_PROMPT = """You are Wasel (واصل), an AI road safety assistant for Saudi Arabia.
Your job is to detect, confirm, and report potholes and road damage so they get fixed fast.

When a user shares a photo or location:
1. Call confirm_pothole to verify it is real road damage using vision AI.
2. If confirmed, call get_nearby_reports to find other reports within 1 km.
3. Call calculate_priority using the severity and nearby count.
4. Call file_pothole_report to save the report with GPS coordinates and photo.
5. Call notify_construction to alert the repair team with location and priority.
6. Tell the user their report ID, the priority level, and the expected fix timeline.

Always respond in the same language the user writes in.
If they write in Arabic, reply fully in Arabic.
If they write in English, reply in English.
If a report is not confirmed as real damage, politely explain what you saw instead.

Be concise, action-oriented, and reassuring. The user is reporting a safety hazard.

أنت واصل، مساعد سلامة الطرق الذكي للمملكة العربية السعودية.
مهمتك اكتشاف الحفر وأضرار الطريق وتأكيدها والإبلاغ عنها حتى يتم إصلاحها بسرعة.
"""

# Memory ID injected at runtime by AgentCore (or set manually for local testing)
MEMORY_ID: str = os.environ.get("AGENTCORE_MEMORY_ID", "")

# Gateway config (optional — only used when deployed behind AgentCore Gateway)
GATEWAY_URL: str             = os.environ.get("GATEWAY_URL", "")
GATEWAY_CLIENT_ID: str       = os.environ.get("GATEWAY_CLIENT_ID", "")
GATEWAY_CLIENT_SECRET: str   = os.environ.get("GATEWAY_CLIENT_SECRET", "")
GATEWAY_TOKEN_ENDPOINT: str  = os.environ.get("GATEWAY_TOKEN_ENDPOINT", "")
GATEWAY_SCOPE: str           = os.environ.get("GATEWAY_SCOPE", "")

# JWT token cache for Gateway auth
_token_cache: dict = {"token": "", "expires_at": 0.0}


def _get_gateway_token() -> str:
    """Fetch a client_credentials JWT, caching it until 60s before expiry."""
    if time.time() < _token_cache["expires_at"] - 60:
        return _token_cache["token"]
    resp = requests.post(
        GATEWAY_TOKEN_ENDPOINT,
        data={
            "grant_type":    "client_credentials",
            "client_id":     GATEWAY_CLIENT_ID,
            "client_secret": GATEWAY_CLIENT_SECRET,
            "scope":         GATEWAY_SCOPE,
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    _token_cache["token"]      = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
    return _token_cache["token"]


def make_agent(session_id: str, actor_id: str = "user") -> Agent:
    """Build a Wasel agent instance for a specific user session."""
    # Raise read timeout — vision + multi-tool pipelines can take 60-90s
    boto_config = Config(read_timeout=120, connect_timeout=15)
    model = BedrockModel(
        model_id=config.MODEL_ID,
        region_name=config.REGION,
        boto_client_config=boto_config,
    )

    tools = [
        confirm_pothole,
        file_pothole_report,
        get_nearby_reports,
        calculate_priority,
        notify_construction,
    ]

    # Wire memory if AGENTCORE_MEMORY_ID is available
    session_manager = None
    if MEMORY_ID:
        memory_config = AgentCoreMemoryConfig(
            memory_id=MEMORY_ID,
            session_id=session_id,
            actor_id=actor_id,
        )
        session_manager = AgentCoreMemorySessionManager(
            agentcore_memory_config=memory_config,
            region_name=config.REGION,
        )

    kwargs = dict(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=tools,
    )
    if session_manager:
        kwargs["session_manager"] = session_manager

    return Agent(**kwargs)


def make_agent_for_request(
    session_id: str,
    actor_id: str,
    user_message: str,
) -> str:
    """Entry point called by the web UI for each message.
    Returns the agent's response as a string.
    """
    agent = make_agent(session_id=session_id, actor_id=actor_id)
    if MEMORY_ID and hasattr(agent, "session_manager") and agent.session_manager:
        with agent.session_manager:
            response = agent(user_message)
    else:
        response = agent(user_message)
    return str(response)


def main() -> None:
    """Local REPL for quick testing without the web UI."""
    session_id = str(uuid.uuid4())
    agent = make_agent(session_id=session_id, actor_id="user")
    print(f"Wasel | واصل  — session {session_id}\nType 'quit' to exit.\n")

    ctx = agent.session_manager if MEMORY_ID and hasattr(agent, "session_manager") else None
    with (ctx if ctx else _nullctx()):
        while True:
            text = input("You: ").strip()
            if text.lower() in {"quit", "exit", "q"}:
                break
            if text:
                print(f"\nWasel: {agent(text)}\n")


class _nullctx:
    """No-op context manager used when memory is not configured."""
    def __enter__(self): return self
    def __exit__(self, *_): pass


if __name__ == "__main__":
    main()
