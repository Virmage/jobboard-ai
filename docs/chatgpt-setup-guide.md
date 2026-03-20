# Setting Up JobBoard AI as a ChatGPT Custom GPT

A step-by-step guide to creating the JobBoard AI GPT in the ChatGPT builder.

## Prerequisites

- A ChatGPT Plus, Team, or Enterprise account (custom GPTs require a paid plan)
- The API is live at `https://jobboard-ai-rllv.vercel.app`

## Steps

1. Go to **https://chatgpt.com/gpts/editor**
2. Click **"Create a GPT"**
3. Switch to the **"Configure"** tab (skip the conversational builder — manual config is faster and more precise)
4. Fill in the fields:

| Field           | Value |
|-----------------|-------|
| **Name**        | JobBoard AI |
| **Description** | Search AI & tech jobs in real-time. Find positions, explore roles, and get apply links — powered by 400+ career page scanners. |

5. In the **Instructions** box, paste the full instructions from [`chatgpt-gpt-instructions.md`](./chatgpt-gpt-instructions.md) (everything below the `---` line)
6. Scroll down to **Actions** and click **"Create new action"**
7. Click **"Import from URL"** and paste:
   ```
   https://jobboard-ai-rllv.vercel.app/api/openapi.json
   ```
8. The schema will auto-populate with the available endpoints (searchJobs, suggestRoles, getJobById, listIndustries)
9. For **Authentication**, select **"None"** — the API allows anonymous access with rate limiting
10. Click **"Save"** and choose your visibility:
    - **Public** — listed in the GPT Store (requires a privacy policy URL)
    - **Anyone with the link** — shareable but unlisted
    - **Only me** — private use only

## Optional Configuration

- **Conversation starters** — add these for a good first impression:
  - "Find me remote AI engineer jobs"
  - "What roles exist in fintech?"
  - "I build ML pipelines — what should I search for?"
  - "Show me the freshest data science listings"
- **Profile picture** — upload a logo or icon that represents JobBoard AI

## Testing

After saving, open the GPT and try these queries:

| Query | What it tests |
|-------|---------------|
| "Find me remote AI engineer jobs" | Basic searchJobs call with filters |
| "I build ML models for healthcare, what roles should I look at?" | suggestRoles followed by search |
| "Show me jobs in fintech" | Industry-based browsing |
| "Tell me more about #2" | getJobById for detail retrieval |
| "What industries are available?" | listIndustries exploration |

## Privacy Policy URL

Required if you publish the GPT publicly in the GPT Store:

```
https://jobboard-ai-rllv.vercel.app/privacy
```

Add this under **Settings > Additional Settings > Privacy Policy URL** in the GPT editor.

## Updating the GPT

If the API schema changes (new endpoints, updated parameters), revisit the Actions section and re-import from the same URL. The OpenAPI spec is always up to date at the live URL.
