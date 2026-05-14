# Cyber Case Deployment Guide

This project is ready for browser-based deployment with:

- frontend on Vercel
- backend on Render
- Tencent Hunyuan API in the FastAPI backend
- SQLite-based NPC memory

## Local Development

Copy the shared environment template to the repo root:

```powershell
Copy-Item .env.example .env
```

Install and run the frontend:

```powershell
npm install
npm run dev
```

Install and run the backend:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Local defaults:

- frontend: `http://127.0.0.1:5173`
- backend: `http://127.0.0.1:8000`
- frontend API source: `VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:8000`

## Deployment Files

- `vercel.json`: SPA refresh fallback for Vercel
- `render.yaml`: Render web service blueprint
- `.env.example`: shared frontend/backend environment template
- `backend/requirements.txt`: Python dependencies for Render

## Production Environment Variables

Set these in Vercel:

```dotenv
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

Set these in Render:

```dotenv
HUNYUAN_API_KEY=your_hunyuan_api_key
FRONTEND_URL=https://your-project.vercel.app
ALLOWED_ORIGINS=https://your-project.vercel.app
SQLITE_DB_PATH=/opt/render/project/src/backend/data/npc_memory.sqlite3
LLM_TIMEOUT_SECONDS=45
NPC_MEMORY_TURNS=12
```

If you attach a Render persistent disk, point `SQLITE_DB_PATH` at that mount path instead, for example:

```dotenv
SQLITE_DB_PATH=/var/data/npc_memory.sqlite3
```

## GitHub Upload Steps

1. Initialize git if needed:

```powershell
git init
git branch -M main
git add .
git commit -m "Prepare Vercel and Render deployment"
```

2. Create an empty GitHub repository.
3. Link the remote and push:

```powershell
git remote add origin https://github.com/<your-account>/<your-repo>.git
git push -u origin main
```

## Vercel Deployment Steps

1. Open Vercel and import the GitHub repository.
2. Let Vercel detect the project as Vite.
3. Confirm:
   - build command: `npm run build`
   - output directory: `dist`
4. Add environment variable:
   - `VITE_API_BASE_URL=https://your-render-service.onrender.com`
5. Deploy.
6. After deployment, Vercel will generate a public `https://<project>.vercel.app` link.

`vercel.json` already handles SPA refresh routing, so deep-link refreshes will return `index.html` instead of a 404.

## Render Deployment Steps

1. Open Render and create a new Web Service from the same GitHub repository.
2. Choose `render.yaml` during setup, or configure manually with the same values:
   - root directory: `backend`
   - build command: `pip install -r requirements.txt`
   - start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables:
   - `HUNYUAN_API_KEY`
   - `FRONTEND_URL=https://your-project.vercel.app`
   - `ALLOWED_ORIGINS=https://your-project.vercel.app`
   - `SQLITE_DB_PATH=/opt/render/project/src/backend/data/npc_memory.sqlite3`
4. Deploy.
5. After deployment, Render will generate a public `https://<service>.onrender.com` API link.

## Recommended Deployment Order

1. Deploy Render first and copy the generated `onrender.com` URL.
2. Put that URL into Vercel as `VITE_API_BASE_URL`.
3. Deploy Vercel and copy the generated `vercel.app` URL.
4. Put that Vercel URL into Render as `FRONTEND_URL` and `ALLOWED_ORIGINS`.
5. Trigger one more Render deploy so CORS uses the final frontend domain.

## Common Issues

### Frontend shows network error

- Check whether `VITE_API_BASE_URL` points to the correct Render URL.
- Make sure the Render service is live and the `/chat` endpoint is reachable.

### Browser reports CORS error

- Confirm `ALLOWED_ORIGINS` contains the exact Vercel domain, including `https://`.
- If you changed the Vercel domain, redeploy Render after updating the env vars.

### Vercel refresh returns 404

- Confirm `vercel.json` exists in the repo root.
- Redeploy after the file is committed.

### Render starts but chat fails

- Confirm `HUNYUAN_API_KEY` is set correctly.
- Check the Render logs for upstream Tencent Hunyuan errors or timeouts.

### SQLite memory resets after redeploy

- This is expected on Render's default ephemeral filesystem.
- To keep NPC memory across restarts, attach a Render persistent disk and update `SQLITE_DB_PATH` to that mount path.

## Final Deployment Checklist

- Vercel public frontend URL is accessible in a browser
- Render public backend URL responds successfully
- `VITE_API_BASE_URL` points to Render
- `ALLOWED_ORIGINS` includes the Vercel URL
- `HUNYUAN_API_KEY` is configured on Render
- NPC chat works online without local startup
