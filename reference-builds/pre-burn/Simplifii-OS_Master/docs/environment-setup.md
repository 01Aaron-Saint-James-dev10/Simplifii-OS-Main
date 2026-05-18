# Environment Setup

## Required Environment Variables

Copy `.env.example` to `.env.local` before running the app locally:

```bash
cp .env.example .env.local
```

Then fill in the real values for each variable.

| Variable | Service | Required | Description |
|---|---|---|---|
| `REACT_APP_SUPABASE_URL` | Supabase | Yes | Project URL from the Supabase dashboard (Settings > API) |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase | Yes | Public anon key from the Supabase dashboard (Settings > API) |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth | Yes | OAuth 2.0 Client ID from console.cloud.google.com |
| `REACT_APP_OLLAMA_URL` | Ollama | No | Local LLM endpoint. Defaults to `http://localhost:11434` if omitted |

## Local Development

```bash
npm install
npm start
```

## Production (Vercel)

Production environment variables are set in the Vercel dashboard under Project Settings > Environment Variables. They are never committed to the repository.

`.env`, `.env.local`, and all `.env*.local` files are gitignored.
