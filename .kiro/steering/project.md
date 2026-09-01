# Project Steering: Agentic AI with Strands + AgentCore

## What We're Building
An agentic AI solution using the Strands Agents SDK and Amazon Bedrock AgentCore CLI.
Keep all implementations minimal and focused on demonstrating the concept clearly.

## AWS Configuration
- **Region**: always `us-west-2` for all AWS operations and SDK calls
- **CLI**: always include `--no-cli-pager` in every `aws` CLI command

## Documentation First
Before writing any code involving AWS services, AgentCore, or Strands:
1. Use the `aws-documentation` MCP tool to look up current AWS service docs
2. Use the `bedrock-agentcore` MCP tool for AgentCore-specific APIs and CLI usage
3. Use the `strands-agents` MCP tool for Strands SDK patterns and tool decoration

Never rely on prior training knowledge for these APIs — always fetch current docs first.

## AgentCore CLI Rules
- Always run `agentcore validate` after editing agentcore.json
- In agentcore.json, runtime envVars must be arrays: `[{ "name": "KEY", "value": "VALUE" }]`
- Never write `${VARIABLE}` placeholders into agentcore.json — the CLI does not expand them, so the literal text ends up in the deployed policy and causes AccessDenied errors at invoke time. Resolve the real value first and write it literally.
- The correct agentcore.json schema requires `"version": 1`, `"runtimes"` (not `"agents"`), `"memories"` (not `"memory"`), and a `"$schema"` key.


- Use type hints on all function signatures and variable declarations where useful
- Add short explanatory comments for non-obvious logic (one line is enough)
- Keep files small and single-purpose; avoid over-engineering

## Strands Agent Tools
- Always use the `@tool` decorator from the Strands SDK to define agent tools
- Keep tool functions focused on a single responsibility
- Include a clear docstring on every `@tool` function — Strands uses it as the tool description

## Code Philosophy
- Minimal over complete: write only what's needed to demonstrate the concept
- No boilerplate for its own sake
- Prefer clarity over cleverness
