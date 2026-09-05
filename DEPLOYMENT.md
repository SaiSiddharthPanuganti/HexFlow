# HexFlow deployment

## Render backend

1. In Render, choose **New > Blueprint** and select this GitHub repository.
2. Render will use `render.yaml` and create `hexflow-api`.
3. Set `GEMINI_API_KEY` in the service environment variables.
4. Copy the deployed service URL and verify `/api/health`.

## Vercel frontend

1. In Vercel, choose **Add New > Project** and import the same repository.
2. Set **Root Directory** to `frontend`. The frontend-local `vercel.json` runs `npm ci`, builds the app, and serves `dist`.
3. Add the environment variable `VITE_API_URL` with the Render service URL, for example `https://hexflow-api.onrender.com`.
4. Deploy the project.
5. Copy the Vercel URL into Render as `FRONTEND_URL`, then redeploy the Render service.

`backend/.env` is for local development only. Never add the Gemini key to Vercel or commit it to Git.
