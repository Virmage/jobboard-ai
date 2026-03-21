# agentjobs-mcp

MCP server for AgentJobs — search 14,000+ jobs from Claude Desktop. No database setup required; connects to the AgentJobs REST API.

## Quick Start

```bash
npx agentjobs-mcp
```

## Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentjobs": {
      "command": "npx",
      "args": ["-y", "agentjobs-mcp"]
    }
  }
}
```

Config file location:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

After editing, restart Claude Desktop for the changes to take effect.

## Available Tools

| Tool | Description |
|------|-------------|
| `search_jobs` | Search job listings with filters for query, industry, role, region, and remote status |
| `get_job_details` | Get full details for a specific job by ID |
| `list_industries` | List all available industries with job counts |
| `list_roles` | List all role taxonomies with related titles and job counts |
| `get_market_overview` | Summary stats: total jobs, breakdowns by industry, region, and source |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENTJOBS_API_URL` | `https://agentjobs.vercel.app` | Override the API base URL |

## Example Prompts

Once configured in Claude Desktop, try:

- "Find me remote machine learning jobs"
- "What industries have the most jobs right now?"
- "Show me details for job [id]"
- "What roles are available in the crypto industry?"
- "Give me an overview of the job market"

## Development

```bash
npm install
npm run build
node dist/index.js
```

## Requirements

- Node.js 18+

## License

MIT
