# Automated Deployment: GitHub → Ubuntu VPS (A–Z)

This document explains how to automatically deploy the `main` branch of this repository to an Ubuntu VPS using GitHub Actions + SSH. It includes required VPS setup, example remote `deploy.sh`, a `systemd` service example, and a sample GitHub Actions workflow you can copy/paste.

**Assumptions**
- VPS: Ubuntu 20.04+ with `sudo` access.
- Repo: production branch is `main`.
- App layout (in this repository): `server/` (Node server) and `client/` (Vite React client).
- We'll use an SSH deploy key stored in GitHub Secrets and a `deploy` user on the VPS.

---

## High-level Flow

- Push to `main` → GitHub Actions triggers → Actions connects to VPS over SSH → runs remote `deploy.sh` which pulls latest code, installs deps, builds client, copies build assets, and restarts the service.

---

## A — Prepare the VPS (one-time)

1. Update the system and install essentials:

```bash
sudo apt update; sudo apt upgrade -y
sudo apt install -y git curl build-essential ufw
```

2. Install Node.js (NodeSource example for Node 18):

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

3. (Optional) Install `pm2` globally if you prefer it over `systemd`:

```bash
sudo npm install -g pm2
```

4. Deploy user

- If you already have a `deploy` user with `sudo` access (you mentioned you do), skip creating one. Just ensure the account has SSH key access (next section) and the correct repo location/permissions on the VPS.

- If you need to create a `deploy` user, run:

```bash
sudo adduser --disabled-password --gecos "" deploy
# optionally add to sudo group
sudo usermod -aG sudo deploy
```

- Note: You do not need to remove the deploy user's password or make the account passwordless. Using SSH key authentication (configured below) is sufficient for automated deployments. If you later want to harden SSH, you can disable password authentication after you confirm key-based login works (see next step).

5. Prepare firewall (example using `ufw`):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # if using nginx to serve client
sudo ufw enable
sudo ufw status
```

6. After confirming SSH key auth works, consider hardening `/etc/ssh/sshd_config` (optional):

```
# Recommended to improve security after key auth works
PasswordAuthentication no
PermitRootLogin no
```

If you prefer to keep password-based login for other accounts, you may skip disabling `PasswordAuthentication`. Only disable it after you confirm SSH key login works for the `deploy` user to avoid locking yourself out.

Then reload SSH:

```bash
sudo systemctl reload sshd
```

---

## B — Create SSH deploy key (locally)

On your development machine (PowerShell example):

```powershell
ssh-keygen -t ed25519 -C "deploy@your-vps" -f $env:USERPROFILE\.ssh\woocommerce_deploy -N ""
```

- Private key: `~/.ssh/woocommerce_deploy`
- Public key: `~/.ssh/woocommerce_deploy.pub`

Add the public key to the `deploy` user's `authorized_keys` on the VPS:

```bash
# as root or using sudo to place the key into deploy's account
sudo mkdir -p /home/deploy/.ssh
sudo tee -a /home/deploy/.ssh/authorized_keys < /path/to/woocommerce_deploy.pub
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## C — Add private key & host data to GitHub Secrets

In your GitHub repo: `Settings → Secrets → Actions` add:

- `SSH_PRIVATE_KEY` → contents of the private key (`~/.ssh/woocommerce_deploy`).
- `VPS_HOST` → VPS IP or domain, e.g. `198.51.100.2`.
- `VPS_USER` → `deploy`.
- `VPS_PORT` → optional (default `22`).
- `KNOWN_HOSTS` → optional: output of `ssh-keyscan -p 22 your.vps.example.com` to skip interactive host verification.

---

## D — Remote `deploy.sh` (recommended to keep in repo at `server/deploy.sh`)

Create `server/deploy.sh` (executable) with the following example. Adjust paths and service name as needed.

```bash
#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="$HOME/woocommerce-dashboard"
BRANCH="main"
LOGFILE="/tmp/deploy-$(date +%Y%m%d%H%M%S).log"

echo "=== Deploy started at $(date) ===" | tee -a "$LOGFILE"

cd "$REPO_DIR"

# Ensure we have the latest from origin
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# Server deps
cd server
npm ci --loglevel=warn
cd ..

# Client build (if present)
if [ -d client ]; then
  cd client
  npm ci --loglevel=warn
  npm run build
  # Example: copy built client into server public folder
  rm -rf ../server/public
  mkdir -p ../server/public
  cp -r dist/* ../server/public/
  cd ..
fi

# Restart service (systemd example)
sudo systemctl restart woocommerce-dashboard.service

echo "=== Deploy finished at $(date) ===" | tee -a "$LOGFILE"

```

Make the script executable (on VPS):

```bash
chmod +x server/deploy.sh
```

Notes:
- If you prefer not to commit `deploy.sh`, place it on the VPS at `/home/deploy/deploy.sh` and adjust the GitHub Actions command to call that path.
- Ensure `.env` or necessary environment files exist on the VPS and have correct permissions.

---

## E — `systemd` service example

Create `/etc/systemd/system/woocommerce-dashboard.service`:

```
[Unit]
Description=WooCommerce Dashboard Node App
After=network.target

[Service]
User=deploy
WorkingDirectory=/home/deploy/woocommerce-dashboard/server
Environment=NODE_ENV=production
# If you store env vars in a file: EnvironmentFile=/home/deploy/woocommerce-dashboard/server/.env
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

Commands to enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable woocommerce-dashboard.service
sudo systemctl start woocommerce-dashboard.service
sudo journalctl -u woocommerce-dashboard.service -f
```

If you use `pm2`, use `pm2 start` and `pm2 startup` instead.

---

## F — GitHub Actions workflow (example)

Create `.github/workflows/deploy.yml` with this minimal example (modify to your needs):

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Prepare SSH key
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add VPS to known_hosts
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.KNOWN_HOSTS }}" > ~/.ssh/known_hosts
          chmod 600 ~/.ssh/known_hosts

      - name: Run remote deploy script via SSH
        env:
          VPS_USER: ${{ secrets.VPS_USER }}
          VPS_HOST: ${{ secrets.VPS_HOST }}
          VPS_PORT: ${{ secrets.VPS_PORT }}
        run: |
          ssh -o StrictHostKeyChecking=yes -p ${VPS_PORT:-22} ${VPS_USER}@${VPS_HOST} 'bash -lc "cd ~/woocommerce-dashboard && ./server/deploy.sh"'
```

Notes:
- The workflow uses `webfactory/ssh-agent` to load the private key. Alternatively use `appleboy/ssh-action` for running commands remotely.
- If you want to build on Actions and copy artifacts, build `client` on the runner, then `scp`/`rsync` to the VPS and restart the service.

---

## G — How to test

1. Make a small harmless change and push to `main`.
2. In GitHub repo → Actions, watch the `Deploy to VPS` run.
3. SSH into VPS and check the deploy logs (script writes logs to `/tmp/deploy-*.log` in the example):

```bash
ls -t /tmp/deploy-*.log | head -n1
sudo journalctl -u woocommerce-dashboard.service -n 200 --no-pager
```

4. Validate the app URL in a browser.

---

## H — Rollback

Quick rollback example on the VPS:

```bash
cd ~/woocommerce-dashboard
git log --oneline -n 5
git reset --hard <previous-commit-hash>
sudo systemctl restart woocommerce-dashboard.service
```

Better: tag releases and deploy by tag to make rollbacks simpler.

---

## I — Security & hardening checklist

- Keep `SSH_PRIVATE_KEY` only in GitHub Secrets.
- Set `PasswordAuthentication no` after confirming key auth.
- Run `ufw` and only open necessary ports.
- Install `fail2ban`.
- Use `unattended-upgrades` or scheduled updates for OS patches.
- Backup DB and critical `.env` files regularly. Keep backups off-site.

---

## J — Optional: Build on GitHub Actions and copy artifacts

- Build `client` in the Actions runner and push only the `dist/` output to the VPS via `scp` or `rsync`.
- This avoids installing the full build toolchain on the VPS.

Example steps (high level):
- `actions/checkout`
- `actions/setup-node`
- `npm ci` + `npm run build` (client)
- `appleboy/scp-action` to copy files
- SSH restart service

---

## K — Troubleshooting tips

- SSH fails from Actions: check `authorized_keys`, `KNOWN_HOSTS`, and GitHub Secret values.
- Service fails: `sudo systemctl status woocommerce-dashboard.service` and `sudo journalctl -u woocommerce-dashboard.service -n 200`.
- Client issues: verify built assets were copied into `server/public` (or your nginx root) and that `client/dist` exists after build.

---

## L — Useful commands (copy/paste)

```bash
# On VPS: basic setup
sudo apt update; sudo apt upgrade -y
sudo apt install -y git curl build-essential ufw
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone repo as deploy user (example)
sudo -i -u deploy bash -c 'git clone https://github.com/<your-org>/woocommerce-dashboard.git ~/woocommerce-dashboard'

# Check service logs
sudo journalctl -u woocommerce-dashboard.service -n 200 --no-pager

# Trigger manual deploy (SSH into VPS)
cd ~/woocommerce-dashboard && ./server/deploy.sh
```

---

If you want, I can:

- (A) Add the `server/deploy.sh` and `.github/workflows/deploy.yml` files to the repo (I can create commits/patches for you).
- (B) Create the exact `systemd` unit and place instructions to enable it.
- (C) Walk you through adding secrets to GitHub and verifying the first Action run.

Choose which follow-up you want and I'll implement it.
