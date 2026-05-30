# Cyber Case

This project is now prepared for a Tencent Cloud same-domain deployment:

- frontend and backend can run inside the same Tencent Cloud server stack
- public browsers use the same domain for both the page and the API
- frontend calls `/api`, and Nginx forwards `/api` to FastAPI
- `APP_MODE=demo` can keep the site online without consuming paid AI credits

## Recommended Deployment

Use the Tencent Cloud deployment guide:

- [DEPLOY_TENCENT.md](C:/Users/wanghuixin/Documents/New project 2/DEPLOY_TENCENT.md)

Tencent-specific deployment files added for this repo:

- `docker-compose.tencent.yml`
- `docker-compose.tencent.https.yml`
- `nginx/nginx.tencent.http.conf`
- `nginx/nginx.tencent.https.conf`
- `backend/.env.tencent.example`
- `deploy.tencent.sh`

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
- frontend API source: local private-network hosts use `:8000`, public deployments use same-origin `/api`

## AI Reply Modes

Backend mode is controlled by `APP_MODE`:

- `APP_MODE=demo`
  - no online model call
  - no Hunyuan credit usage
  - suitable for demos and contest submission
- `APP_MODE=development`
  - enables online AI replies
  - requires `HUNYUAN_API_KEY`

## Legacy Files

Older `Vercel` / `Render` deployment files are still kept in the repo for reference, but they are no longer the recommended path for stable access in mainland China mobile networks.
