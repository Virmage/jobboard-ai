# jobboard-ai-mcp

MCP server for JobBoard AI — search AI/tech jobs from Claude Desktop.

## Quick Start

```bash
npx jobboard-ai-mcp
```

## Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jobboard-ai": {
      "command": "npx",
      "args": ["-y", "jobboard-ai-mcp"]
    }
  }
}
```

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## Available Tools

| Tool | Description |
|------|-------------|
| `search_jobs` | Search job listings with filters for industry, market, remote status, and role type |
| `get_job_details` | Get full details for a specific job listing |
| `suggest_roles` | Describe what you do and discover matching role titles |
| `get_market_stats` | Get job market statistics by industry and region |
| `subscribe_alerts` | Set up email notifications for new matching jobs |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JOBBOARD_API_URL` | `https://jobboard-ai-rllv.vercel.app` | API base URL |

## Requirements

- Node.js 18+

## Links

- Website: https://jobboard-ai-rllv.vercel.app
