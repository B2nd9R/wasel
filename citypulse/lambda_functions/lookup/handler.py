"""
handler.py — AgentCore Gateway Lambda target for CityPulse item lookup.
Exposes one tool: lookup_item(item_id) — returns a short description for the id.
"""

import json
from typing import Any

# Sample data — replace with real DynamoDB lookups for production
ITEMS: dict[str, str] = {
    "pothole":     "A road surface defect requiring repair by the Streets department.",
    "graffiti":    "Unauthorized markings on public property, handled by Sanitation.",
    "streetlight": "A non-functioning streetlight reported to the Utilities department.",
    "flooding":    "Water accumulation on streets or sidewalks, escalated to Public Works.",
    "noise":       "Noise complaint routed to the Code Enforcement department.",
}


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Entry point for AgentCore Gateway tool invocations.

    The Gateway sends the tool name in event['bedrockAgentCoreToolName']
    and the tool arguments directly in the event body.
    """
    # Strip the target-name prefix the Gateway adds (e.g. "lookup_lookup_item" -> "lookup_item")
    raw_tool_name: str = event.get("bedrockAgentCoreToolName", "")
    tool_name: str = raw_tool_name.split("_", 1)[-1] if "_" in raw_tool_name else raw_tool_name

    if tool_name == "lookup_item":
        item_id: str = event.get("item_id", "").lower().strip()
        description: str = ITEMS.get(item_id, f"No description found for item '{item_id}'.")
        return {"item_id": item_id, "description": description}

    # Unknown tool — return an error the Gateway can surface to the agent
    return {"error": f"Unknown tool: {tool_name}"}
