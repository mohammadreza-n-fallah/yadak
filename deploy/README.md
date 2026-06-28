# Deploying the osh shop to an Ubuntu VPS

Repo: https://github.com/mohammadreza-n-fallah/osh.git

Architecture (all on one server):

```
                 ┌────────────── Nginx (port 80/443) ──────────────┐
Browser ──────►  │  /api,/admin → Django   /static,/media → files  │
                 │  everything else → Next.js                       │
                 └────────┬───────────────────────────┬────────────┘
                          │                            │
                 Gunicorn (127.0.0.1:8000)    next start (127.0.0.1:3000)
                          │
                   PostgreSQL
```

Replace `__USER__` with your Linux username and `example.com` with your domain everywhere.
The project lives at `/home/__USER__/osh`.

---

## 1. First-time server setup

```bash
# System packages
sudo apt update
sudo apt install -y python3-venv python3-pip postgresql nginx git curl
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL database + user
sudo -u postgres psql <<'SQL'
CREATE DATABASE yadakstorage_shop;
CREATE USER yadakstorage WITH PASSWORD 'change-me';
GRANT ALL PRIVILEGES ON DATABASE yadakstorage_shop TO yadakstorage;
ALTER DATABASE yadakstorage_shop OWNER TO yadakstorage;
SQL

# Get the code
cd ~
git clone https://github.com/mohammadreza-n-fallah/osh.git
cd osh
```

> The database name/user above are just defaults; match them to `DB_NAME` / `DB_USER`
> in `backend/.env` (next step). Keep them or rename to `osh` — your choice.

## 2. Backend

```bash
cd ~/osh/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
nano .env            # fill in SECRET_KEY, domain, DB password, Zarinpal id...

set -a; source .env; set +a
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
deactivate
```

## 3. Frontend

```bash
cd ~/osh/nextjs-frontend
cp .env.production.example .env.production
nano .env.production   # set NEXT_PUBLIC_API_URL=https://example.com
npm ci
npm run build
```

## 4. Run both as services

```bash
cd ~/osh
sudo cp deploy/osh-gunicorn.service /etc/systemd/system/
sudo cp deploy/osh-next.service     /etc/systemd/system/
sudo sed -i "s/__USER__/$USER/g" /etc/systemd/system/osh-*.service
sudo systemctl daemon-reload
sudo systemctl enable --now osh-gunicorn osh-next
```

Let your user restart services without a password prompt (needed by deploy.sh):

```bash
echo "$USER ALL=(ALL) NOPASSWD: /bin/systemctl restart osh-gunicorn, /bin/systemctl restart osh-next" \
  | sudo tee /etc/sudoers.d/osh-deploy
```

## 5. Nginx + HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/osh
sudo sed -i "s/__USER__/$USER/g; s/example.com/yourdomain.com/g" /etc/nginx/sites-available/osh
sudo ln -s /etc/nginx/sites-available/osh /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Free HTTPS certificate
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Your shop is now live at `https://yourdomain.com`.

---

## 6. Day-to-day: pushing updates

On your laptop:

```bash
git add -A
git commit -m "Describe your change"
git push origin main
```

On the server:

```bash
cd ~/osh
./deploy.sh
```

That single command pulls the new code, installs any new deps, runs DB
migrations, rebuilds the frontend, and restarts both services.

> Tip: you can run it without logging in manually:
> `ssh __USER__@yourdomain.com 'cd ~/osh && ./deploy.sh'`

### When do I need a rebuild vs. just a restart?
- **Backend (Python) change** → migrate + restart gunicorn. `deploy.sh` does it.
- **Frontend (Next.js) change** → `npm run build` is required (Next is compiled).
  `deploy.sh` does it.
- **Changed a `NEXT_PUBLIC_*` value** → must rebuild the frontend (they're baked
  in at build time), which `deploy.sh` also handles.
