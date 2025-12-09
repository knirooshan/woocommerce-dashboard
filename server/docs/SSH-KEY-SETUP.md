# SSH key setup for GitHub Actions / VPS deploy

A → Z CI/CD guide: GitHub Actions → Ubuntu 24 VPS (Nginx, Node 24, PM2)

This document contains a complete step-by-step guide (commands + explanations) to set up CI/CD that deploys the repository to an Ubuntu 24 VPS using GitHub Actions and SSH. Follow the sections in order on either your local machine (Windows/WSL) or the VPS as noted.

Overview

- Create a dedicated `deploy` user on the VPS and prepare the server (Node.js v24, PM2, Nginx).
- Create a deploy script on the VPS that pulls `main`, installs deps, builds the client, and restarts PM2.
- Create a CI SSH keypair (private key stored as `VPS_SSH_KEY` secret) and add the public key to `/home/deploy/.ssh/authorized_keys`.
- Add repository secrets in GitHub and create a workflow that SSHes to the VPS and runs the deploy script on push to `main`.

Important: run the VPS commands as a privileged user (root or via an account with sudo). Replace `dashboard.ceyloncanecrafts.lk` and paths with your actual domain and app path.

1. Prepare the VPS: create `deploy` user, directories, and SSH

Commands (run on the VPS as root):

```bash
# Create deploy user (no password login) and add to sudo
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy

# Optional: allow deploy to run a limited set of commands without password
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl, /usr/bin/npm, /usr/bin/pm2, /usr/bin/git, /bin/chown" > /etc/sudoers.d/deploy_nopasswd
chmod 440 /etc/sudoers.d/deploy_nopasswd

# Create app directory and set ownership
mkdir -p /var/www/dashboard.ceyloncanecrafts.lk
chown -R deploy:deploy /var/www/dashboard.ceyloncanecrafts.lk

# Ensure OpenSSH is installed and running
apt update && apt install -y openssh-server
systemctl enable --now ssh
systemctl status ssh --no-pager

# Basic firewall setup (optional but recommended)
apt install -y ufw
ufw allow OpenSSH
ufw enable
ufw status verbose
```

Explanation: `deploy` is the user GitHub Actions will SSH into. The sudoers entry is optional — it limits passwordless sudo to common deploy commands.

2. Install runtime and system services

Commands (run on the VPS):

```bash
# Install Node 24.x (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs git build-essential
node -v && npm -v

# Install PM2 globally
npm install -g pm2
pm2 -v

# Install Nginx and Certbot
apt install -y nginx
systemctl enable --now nginx
nginx -t
apt install -y certbot python3-certbot-nginx
```

Explanation: Node runs your server; PM2 manages processes; Nginx reverse-proxies and Certbot handles TLS.

3. Clone the repository and prepare the app (run as `deploy`)

Commands (switch to deploy or use sudo -u deploy):

```bash
sudo -i -u deploy bash
cd /var/www
git clone https://github.com/knirooshan/woocommerce-dashboard.git dashboard.ceyloncanecrafts.lk
cd dashboard.ceyloncanecrafts.lk

# Create production environment file (example)
cat > .env.production <<'EOF'
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://localhost:27017/woocommerce_dashboard
EOF

# Install server dependencies and build client
cd server
npm install --production
cd ../client
npm install
npm run build

# Start the app with PM2 (adjust entrypoint if different)
cd /var/www/dashboard.ceyloncanecrafts.lk
pm2 start server/index.js --name woocommerce-dashboard --update-env
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
```

Explanation: clone the repo into the web root, create environment variables, install dependencies, build the client, and start the server under PM2.

4. Create the deploy script on the VPS

Create `/var/www/dashboard.ceyloncanecrafts.lk/server/scripts/deploy.sh` with these contents:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /var/www/dashboard.ceyloncanecrafts.lk

# Ensure deploy owns files
sudo chown -R deploy:deploy /var/www/dashboard.ceyloncanecrafts.lk || true

# Fetch and reset to main
git fetch --all
git reset --hard origin/main

# Install server dependencies
cd server
npm ci --production

# Build client
cd ../client
npm ci
npm run build

# Restart pm2 process (or start if missing)
cd /var/www/dashboard.ceyloncanecrafts.lk
pm2 restart woocommerce-dashboard || pm2 start server/index.js --name woocommerce-dashboard --update-env
pm2 save

echo "deploy finished"
```

Make it executable:

```bash
sudo chmod +x /var/www/dashboard.ceyloncanecrafts.lk/server/scripts/deploy.sh
```

Explanation: This script pulls the latest code, installs deps, builds the client, and restarts the PM2 process.

5. Create a CI SSH keypair (on your local machine or WSL) and add the public key to the VPS

Commands (Windows PowerShell or WSL — pick one):

PowerShell (example):

```powershell
# Generate CI keypair (no passphrase for CI simplicity)
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\ci_deploy_key -C "github-actions@woocommerce-dashboard" -N ""

# Copy the public key to the VPS (upload then append)
scp -P 22 $env:USERPROFILE\.ssh\ci_deploy_key.pub deploy@dashboard.ceyloncanecrafts.lk:/tmp/ci_deploy_key.pub
ssh -p 22 deploy@dashboard.ceyloncanecrafts.lk "mkdir -p ~/.ssh && cat /tmp/ci_deploy_key.pub >> ~/.ssh/authorized_keys && rm /tmp/ci_deploy_key.pub"
```

Fix permissions on the VPS (run as root or with sudo):

```bash
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Explanation: The private key (`ci_deploy_key`) stays on GitHub (as a secret); the public key is added to the VPS so that any client with the private key can authenticate as `deploy`.

6. Add GitHub repository secrets

Required secrets:

- `VPS_HOST` = your VPS host (e.g., `dashboard.ceyloncanecrafts.lk`)
- `VPS_USER` = `deploy`
- `VPS_SSH_PORT` = `22` (or custom port)
- `VPS_SSH_KEY` = contents of the private key file `ci_deploy_key` (the full multi-line file)

Via GitHub web UI: Repository → Settings → Secrets and variables → Actions → New repository secret. Paste the full private key into `VPS_SSH_KEY`.

Using `gh` CLI (optional):

```bash
# Example (on your local machine with gh authenticated)
cat ~/.ssh/ci_deploy_key | gh secret set VPS_SSH_KEY --repo knirooshan/woocommerce-dashboard
gh secret set VPS_HOST --body "dashboard.ceyloncanecrafts.lk" --repo knirooshan/woocommerce-dashboard
gh secret set VPS_USER --body "deploy" --repo knirooshan/woocommerce-dashboard
gh secret set VPS_SSH_PORT --body "22" --repo knirooshan/woocommerce-dashboard
```

7. Add or verify GitHub Actions workflow

Create `.github/workflows/deploy.yml` in the repo with this minimal workflow (adjust as needed):

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup SSH key
        env:
          SSH_KEY: ${{ secrets.VPS_SSH_KEY }}
        run: |
          echo "$SSH_KEY" > /tmp/deploy_key
          chmod 600 /tmp/deploy_key

      - name: Run remote deploy
        run: |
          ssh -i /tmp/deploy_key -o StrictHostKeyChecking=no -p ${{ secrets.VPS_SSH_PORT }} ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} 'bash -s' < server/scripts/deploy.sh
```

Explanation: On push to `main`, Actions writes the private key into `/tmp/deploy_key` and uses it to SSH to the VPS and run the deploy script.

8. Test the pipeline

- Push a small change to `main` to trigger the workflow.
- Inspect the Actions run: ensure the key is created and that the SSH step connects.
- Common failures and fixes:
  - "Permission denied (publickey)": public key not present in `authorized_keys`, wrong user, or wrong private key in the secret.
  - "Connection timed out": firewall or wrong host/port.
  - `npm` or `pm2` errors: verify Node and PM2 installed, check `pm2 logs`.

Useful debug commands on the VPS:

```bash
# View authorized_keys
sudo cat /home/deploy/.ssh/authorized_keys

# Check PM2 logs
pm2 logs woocommerce-dashboard --lines 200

# Run deploy script manually as deploy
sudo -i -u deploy /var/www/dashboard.ceyloncanecrafts.lk/server/scripts/deploy.sh
```

9. Healthchecks and rollback

- Quick healthcheck:

```bash
curl -I https://127.0.0.1:3000
curl -I https://dashboard.ceyloncanecrafts.lk
```

- To rollback to a previous commit:

```bash
cd /var/www/dashboard.ceyloncanecrafts.lk
git reflog
git reset --hard <previous-sha>
cd server && npm ci --production
cd client && npm ci && npm run build
pm2 restart woocommerce-dashboard
```

10. Security notes

- Use a dedicated CI key and rotate it if compromised.
- Limit `deploy` sudo rights in `/etc/sudoers.d/` to only required commands.
- Store other secrets (DB passwords, API keys) in GitHub Secrets and reference them in your deploy script or environment management.

Checklist

- [ ] Create `deploy` user and directories on VPS
- [ ] Install Node 24, PM2, Nginx, git, certbot
- [ ] Clone repo and configure `.env`
- [ ] Create `server/scripts/deploy.sh` and make executable
- [ ] Generate CI SSH key, add pubkey to `/home/deploy/.ssh/authorized_keys`
- [ ] Add `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`, `VPS_SSH_PORT` as GitHub secrets
- [ ] Ensure `.github/workflows/deploy.yml` exists and triggers on `main`
- [ ] Push to main and verify Actions and deploy

If you want, I can:

- (A) commit a ready-to-use `deploy.sh` and `.github/workflows/deploy.yml` into the repository (I can adapt the paths and process name), or
- (B) produce a hardened `deploy.sh` that logs to `/var/log/deploy.log`, captures errors, and sends simple status output, or
- (C) walk you through the commands interactively and check each step live.

Pick A / B / C and I will proceed.
