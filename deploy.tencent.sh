#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-http}"

if [[ ! -f "backend/.env.production" ]]; then
  echo "Missing backend/.env.production"
  echo "Copy backend/.env.tencent.example to backend/.env.production first."
  exit 1
fi

mkdir -p nginx/logs backend/data

if [[ "${MODE}" == "https" ]]; then
  if [[ ! -f "nginx/ssl/fullchain.pem" || ! -f "nginx/ssl/privkey.pem" ]]; then
    echo "Missing nginx/ssl/fullchain.pem or nginx/ssl/privkey.pem"
    exit 1
  fi
  docker compose -f docker-compose.tencent.https.yml up -d --build
  echo "Tencent HTTPS deployment started."
  echo "Check: https://your-domain.com/health"
  exit 0
fi

docker compose -f docker-compose.tencent.yml up -d --build
echo "Tencent HTTP deployment started."
echo "Check: http://your-domain.com/health"
