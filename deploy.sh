#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# One-command deploy for the osh shop.
# Run it ON THE SERVER, from the project root, after you've pushed
# code from your laptop:   ./deploy.sh
#
# It: pulls latest code → updates deps → migrates DB → rebuilds the
# frontend → restarts both services.
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="${1:-main}"

echo "==> [1/6] Pulling latest code ($BRANCH)"
cd "$APP_DIR"
git pull origin "$BRANCH"

echo "==> [2/6] Backend: install deps"
cd "$APP_DIR/backend"
source venv/bin/activate
pip install -r requirements.txt

# Load production env so manage.py uses Postgres + real settings
set -a
# shellcheck disable=SC1091
source "$APP_DIR/backend/.env"
set +a

echo "==> [3/6] Backend: migrate + collectstatic"
python manage.py migrate --noinput
python manage.py collectstatic --noinput
deactivate

echo "==> [4/6] Frontend: install deps + build"
cd "$APP_DIR/nextjs-frontend"
npm ci
npm run build

echo "==> [5/6] Restart services"
sudo systemctl restart ys-gunicorn
sudo systemctl restart ys-next

echo "==> [6/6] Done. Live at your domain."
