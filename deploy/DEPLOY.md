# Deploying to the college server (Docker + nginx)

Target: `tryhackme.codingclubrvce.com` on `220.158.157.163` (user `rvce`).
App runs in Docker (app + Postgres), bound to `127.0.0.1:3000`; **nginx** on the
host terminates TLS and reverse-proxies to it.

> DNS note: the domain isn't pointed at the server yet, so we start with a
> **self-signed** cert (browser warning). Once an A record for
> `tryhackme.codingclubrvce.com → 220.158.157.163` exists, swap in a real
> Let's Encrypt cert with one `certbot` command (last section).

---

## 0. Prerequisites on the server
Need: `git`, `docker`, `docker compose` plugin, `nginx`, `openssl`. Install any
missing (Debian/Ubuntu):

```bash
sudo apt-get update
sudo apt-get install -y git nginx openssl
# Docker (if absent):
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # re-login for this to take effect
```

## 1. Get the code
```bash
sudo mkdir -p /opt && sudo chown $USER /opt
cd /opt
git clone https://github.com/VivaanHooda/tryhackme-codingclub.git
cd tryhackme-codingclub
```

## 2. Configure environment
```bash
cp deploy/.env.production.example .env
# Fill in secrets:
sed -i "s|REPLACE_WITH_openssl_rand_base64_32|$(openssl rand -base64 32)|" .env
nano .env   # set ADMIN_PASSWORD and POSTGRES_PASSWORD to strong values
```
Key values: `AUTH_URL=https://tryhackme.codingclubrvce.com`,
`APP_PORT=127.0.0.1:3000` (loopback only), strong `ADMIN_PASSWORD` +
`POSTGRES_PASSWORD`.

## 3. Build & start the app
```bash
docker compose up --build -d
docker compose ps
docker compose logs -f app      # watch: migrate deploy → "Ready"
```
Verify it answers locally:
```bash
curl -I http://127.0.0.1:3000     # expect HTTP/1.1 200
```

## 4. TLS cert (self-signed for now)
```bash
sudo mkdir -p /etc/ssl/tryhackme /var/www/certbot
sudo openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout /etc/ssl/tryhackme/privkey.pem \
  -out    /etc/ssl/tryhackme/fullchain.pem \
  -subj "/CN=tryhackme.codingclubrvce.com"
```

## 5. nginx reverse proxy
```bash
sudo cp deploy/nginx/tryhackme.codingclubrvce.com.conf \
        /etc/nginx/sites-available/tryhackme.codingclubrvce.com.conf
sudo ln -sf /etc/nginx/sites-available/tryhackme.codingclubrvce.com.conf \
            /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Firewall (if ufw is active)
```bash
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
```

## 7. Smoke test
- From a browser, add a hosts entry (until DNS is live):
  `220.158.157.163  tryhackme.codingclubrvce.com` in your local `/etc/hosts`,
  then open `https://tryhackme.codingclubrvce.com` (accept the self-signed warning).
- Or on the server: `curl -kI https://tryhackme.codingclubrvce.com -H 'Host: tryhackme.codingclubrvce.com'`
- Sign in as the admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) → `/admin`.

---

## Later: real Let's Encrypt cert (after DNS points here)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tryhackme.codingclubrvce.com
# certbot rewrites the ssl_certificate lines and sets up auto-renewal.
```

## Updating after a code change
```bash
cd /opt/tryhackme-codingclub
git pull
docker compose up --build -d        # rebuilds, runs new migrations, restarts
```

## Handy ops
```bash
docker compose logs -f app          # app logs
docker compose restart app          # restart just the app
docker compose down                 # stop (keeps DB + uploads volumes)
docker compose exec db psql -U ctf ctf   # DB shell
```
