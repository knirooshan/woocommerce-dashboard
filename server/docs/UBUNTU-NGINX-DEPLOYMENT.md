# WooCommerce Dashboard - Ubuntu 24 + Nginx Production Deployment Guide

Complete step-by-step guide to deploy the WooCommerce Dashboard application on Ubuntu 24.04 LTS with Nginx from scratch.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Server Setup](#server-setup)
4. [Install Required Software](#install-required-software)
5. [Database Setup](#database-setup)
6. [Application Deployment](#application-deployment)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL Certificate Setup](#ssl-certificate-setup)
9. [Process Management](#process-management)
10. [Security Hardening](#security-hardening)
11. [Monitoring & Maintenance](#monitoring--maintenance)
12. [Troubleshooting](#troubleshooting)

---

## Overview

**Architecture:**

- **OS**: Ubuntu 24.04 LTS
- **Web Server**: Nginx (reverse proxy)
- **Runtime**: Node.js 24.x LTS
- **Database**: MongoDB 7.x (local installation)
- **Process Manager**: PM2
- **SSL**: Let's Encrypt (Certbot)

**Application Structure:**

```
/var/www/dashboard.ceyloncanecrafts.lk/
├── client/          # React frontend (built static files)
├── server/          # Node.js backend API
└── logs/            # Application logs
```

---

## Prerequisites

### What You Need Before Starting

- [ ] Ubuntu 24.04 VPS with root/sudo access
- [ ] Domain name pointed to your VPS IP address
- [ ] Minimum 2GB RAM, 2 CPU cores, 20GB storage
- [ ] SSH access to the server
- [ ] WooCommerce store with API credentials
- [ ] MongoDB Atlas connection string OR plan to install local MongoDB

### Domain DNS Configuration

Point your domain to your VPS IP:

```
Type: A Record
Name: dashboard
Value: YOUR_VPS_IP_ADDRESS
TTL: 300 (or default)

# The full domain will be: dashboard.ceyloncanecrafts.lk
```

Wait 5-30 minutes for DNS propagation.

---

## Server Setup

### Step 1: Connect to Your VPS

```bash
# From your local machine
ssh root@YOUR_VPS_IP

# Or if using a non-root user
ssh username@YOUR_VPS_IP
```

### Step 2: Update System

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Reboot if kernel was updated
sudo reboot
```

Reconnect after reboot:

```bash
ssh root@YOUR_VPS_IP
```

### Step 3: Create a Non-Root User (Recommended)

```bash
# Create new user
sudo adduser deploy

# Add to sudo group
sudo usermod -aG sudo deploy

# Switch to new user
su - deploy

# Or logout and SSH as new user
# ssh deploy@YOUR_VPS_IP
```

For the rest of this guide, we'll use the `deploy` user. If you're using root, you can skip `sudo` in commands.

### Step 4: Configure Firewall

```bash
# Install UFW (if not already installed)
sudo apt install ufw -y

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

Expected output:

```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
Nginx Full (v6)            ALLOW       Anywhere (v6)
```

---

## Install Required Software

### Step 5: Install Node.js 24.x LTS

```bash
# Install Node.js from NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -

# Install Node.js
sudo apt install nodejs -y

# Verify installation
node --version    # Should show v24.x.x (e.g., v24.11.1)
npm --version     # Should show v10.x.x or higher
```

### Step 6: Install Build Tools

```bash
# Required for native Node.js modules (like Sharp)
sudo apt install build-essential -y

# Install git
sudo apt install git -y
```

### Step 7: Install Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test - visit https://YOUR_VPS_IP in browser
# You should see "Welcome to nginx!" page
```

### Step 8: Install MongoDB 7.x

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
# NOTE: Ubuntu 24.04 (noble) doesn't have official MongoDB repository yet
# We use Ubuntu 22.04 (jammy) repository which is fully compatible
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list (IMPORTANT!)
sudo apt update

# Install MongoDB
sudo apt install mongodb-org -y

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Test MongoDB connection
mongosh --eval "db.version()"
```

**Note:** You'll create the admin user (wd_admin) and application user in the next step.

**⚠️ IMPORTANT: Verify MongoDB is Running Before Proceeding**

Before creating users, ensure MongoDB service is active:

```bash
# Check MongoDB service status
sudo systemctl status mongod

# If not running, start it
sudo systemctl start mongod

# Enable to start on boot
sudo systemctl enable mongod

# Verify it's listening on port 27017
sudo ss -tulpn | grep 27017

# Test connection without auth (before users are created)
mongosh --eval "db.version()"
```

If you see `Active: active (running)`, proceed to Step 9. If not, see troubleshooting below.

**⚠️ Troubleshooting: MongoDB Installation Errors**

If you encounter any errors during MongoDB installation, follow these steps:

**Error: "Unable to locate package mongodb-org" or "404 Not Found" or "does not have a Release file"**

These errors occur because:

- MongoDB doesn't have an official repository for Ubuntu 24.04 (noble) yet
- The repository wasn't added correctly
- Network connectivity issues

**Solution:**

```bash
# Step 1: Clean up any previous attempts
sudo rm -f /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo rm -f /usr/share/keyrings/mongodb-server-7.0.gpg

# Step 2: Install required packages
sudo apt install gnupg curl -y

# Step 3: Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Step 4: Verify the key was created
ls -l /usr/share/keyrings/mongodb-server-7.0.gpg
# Should show the file exists

# Step 5: Add MongoDB repository (using jammy - Ubuntu 22.04)
# This is fully compatible with Ubuntu 24.04
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Step 6: Verify repository was added
cat /etc/apt/sources.list.d/mongodb-org-7.0.list
# Should display: deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse

# Step 7: Update package list (CRITICAL!)
sudo apt update

# Step 8: Verify MongoDB packages are available
apt-cache search mongodb-org | grep mongodb-org
# Should show mongodb-org packages

# Step 9: Install MongoDB
sudo apt install mongodb-org -y

# Step 10: Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Step 11: Verify installation
sudo systemctl status mongod
mongosh --eval "db.version()"
```

### Step 9: Secure MongoDB

```bash
# Connect to MongoDB shell
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "wd_admin",
  pwd: "STRONG_PASSWORD_HERE",  # Change this!
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

# Exit MongoDB shell
exit
```

Enable authentication:

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf
```

Find and modify the security section:

```yaml
security:
  authorization: enabled
```

Restart MongoDB:

```bash
sudo systemctl restart mongod
```

Create application database and user:

```bash
# Connect with admin user
mongosh -u wd_admin -p --authenticationDatabase admin

# Create application database
use woocommerce_dashboard

# Create application user
db.createUser({
  user: "wd_admin",
  pwd: "ANOTHER_STRONG_PASSWORD",  # Change this!
  roles: [ { role: "readWrite", db: "woocommerce_dashboard" } ]
})

# Exit
exit
```

Your MongoDB connection string will be:

```
mongodb://wd_admin:ANOTHER_STRONG_PASSWORD@localhost:27017/woocommerce_dashboard
```

### Step 10: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## Application Deployment

### Step 11: Create Application Directory

```bash
# Create web root directory
sudo mkdir -p /var/www/dashboard.ceyloncanecrafts.lk

# Change ownership to deploy user
sudo chown -R deploy:deploy /var/www/dashboard.ceyloncanecrafts.lk

# Navigate to directory
cd /var/www/dashboard.ceyloncanecrafts.lk
```

### Step 12: Upload Application Files

**Option A: Using Git (Recommended)**

```bash
# If your code is on GitHub/GitLab
cd /var/www/dashboard.ceyloncanecrafts.lk

# Clone repository
git clone https://github.com/knirooshan/woocommerce-dashboard.git .

# Or if already cloned, pull latest changes
git pull origin main
```

**Option B: Using SCP/SFTP**

From your local machine:

```bash
# Upload from local machine
scp -r /path/to/woocommerce-dashboard/* deploy@YOUR_VPS_IP:/var/www/dashboard.ceyloncanecrafts.lk/

# Or use FileZilla/WinSCP for GUI-based upload
```

### Step 13: Install Server Dependencies

```bash
cd /var/www/dashboard.ceyloncanecrafts.lk/server

# Install production dependencies
npm install --production

# Or if you need dev dependencies for building
npm install
```

### Step 14: Build Client Application

```bash
cd /var/www/dashboard.ceyloncanecrafts.lk/client

# Install dependencies
npm install

# Update API URL for production
nano src/config/api.js
```

Update the API URL:

```javascript
// Use your actual domain
export const API_URL = "https://dashboard.ceyloncanecrafts.lk/api";
```

Build the application:

```bash
# Build for production
npm run build

# This creates /var/www/dashboard.ceyloncanecrafts.lk/client/dist folder
```

### Step 15: Configure Environment Variables

```bash
cd /var/www/dashboard.ceyloncanecrafts.lk/server

# Create .env file
nano .env
```

Add the following configuration (replace with your actual values):

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration (Local)
MONGO_URI=mongodb://wd_admin:ANOTHER_STRONG_PASSWORD@localhost:27017/woocommerce_dashboard

# Or use MongoDB Atlas if preferred
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/woocommerce_dashboard?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your_very_long_random_secret_key_minimum_32_characters_long

# WooCommerce API Credentials
WOO_CONSUMER_KEY=ck_your_woocommerce_consumer_key_here
WOO_CONSUMER_SECRET=cs_your_woocommerce_consumer_secret_here
WOO_URL=https://your-woocommerce-store.com

# Email Configuration (Optional - for sending invoices)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
```

Save and exit (Ctrl+X, Y, Enter).

**Generate a secure JWT secret:**

```bash
# Generate random 64-character string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Secure the .env file:

```bash
chmod 600 .env
```

### Step 16: Create Uploads Directory

```bash
# Create uploads directory
mkdir -p /var/www/dashboard.ceyloncanecrafts.lk/server/uploads

# Set proper permissions
chmod 755 /var/www/dashboard.ceyloncanecrafts.lk/server/uploads
```

### Step 17: Test Application Locally

```bash
cd /var/www/dashboard.ceyloncanecrafts.lk/server

# Test if app starts without errors
node index.js
```

You should see:

```
Server running on port 5000
MongoDB Connected: localhost
```

Press Ctrl+C to stop.

---

## Nginx Configuration

### Step 18: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/dashboard.ceyloncanecrafts.lk
```

Add the following configuration:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Upstream for Node.js backend
upstream nodejs_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP Server (will redirect to HTTPS after SSL setup)
server {
    listen 80;
    listen [::]:80;
    server_name dashboard.ceyloncanecrafts.lk;

   # Prevent search engines from indexing this site
   add_header X-Robots-Tag "noindex, nofollow, noarchive" always;

    # For Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/dashboard.ceyloncanecrafts.lk/client/dist;
    }

    # Redirect all other traffic to HTTPS (comment out until SSL is configured)
    # location / {
    #     return 301 https://$server_name$request_uri;
    # }

    # Root directory for static files
    root /var/www/dashboard.ceyloncanecrafts.lk/client/dist;
    index index.html;

    # Logging
    access_log /var/log/nginx/dashboard.ceyloncanecrafts.lk.access.log;
    error_log /var/log/nginx/dashboard.ceyloncanecrafts.lk.error.log;

    # API Proxy to Node.js backend
    location /api {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        # Proxy settings
        proxy_pass https://nodejs_backend;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Disable cache for API
        proxy_cache_bypass $http_upgrade;

        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Uploads directory
    location /uploads {
        alias /var/www/dashboard.ceyloncanecrafts.lk/server/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend - React SPA routing
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

### Step 19: Enable Nginx Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/dashboard.ceyloncanecrafts.lk /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### Step 20: Verify Nginx Configuration

```bash
# Check Nginx status
sudo systemctl status nginx

# View Nginx error log if issues
sudo tail -f /var/log/nginx/error.log
```

---

## SSL Certificate Setup

### Step 21: Install Certbot

```bash
# Install Certbot for Nginx
sudo apt install certbot python3-certbot-nginx -y
```

### Step 22: Obtain SSL Certificate

```bash
# Get certificate for your domain
sudo certbot --nginx -d dashboard.ceyloncanecrafts.lk

# Follow the prompts:
# 1. Enter email address
# 2. Agree to terms of service (Y)
# 3. Share email with EFF (optional, Y or N)
# 4. Certbot will automatically configure Nginx
```

Certbot will:

- Obtain SSL certificate from Let's Encrypt
- Automatically configure Nginx with HTTPS
- Set up HTTP to HTTPS redirect
- Configure SSL settings

### Step 23: Verify SSL Configuration

```bash
# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Visit https://dashboard.ceyloncanecrafts.lk in browser
# You should see a secure padlock icon
```

### Step 24: Set Up Auto-Renewal

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Certbot automatically adds renewal cron job
# Check if renewal timer is active
sudo systemctl status certbot.timer

# View scheduled renewals
sudo certbot certificates
```

SSL certificates auto-renew every 60 days.

---

## Process Management

### Step 25: Configure PM2 for Application

```bash
cd /var/www/dashboard.ceyloncanecrafts.lk/server

# Start application with PM2
pm2 start index.js --name woocommerce-dashboard

# Check status
pm2 status

# View logs
pm2 logs woocommerce-dashboard

# To stop logs, press Ctrl+C
```

### Step 26: Configure PM2 Startup Script

```bash
# Generate startup script
pm2 startup systemd

# Copy and run the command that PM2 outputs (it will look like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy

# Save current PM2 process list
pm2 save

# Test by rebooting server
sudo reboot
```

After reboot, reconnect and verify:

```bash
# Check if app is running
pm2 status

# Should show woocommerce-dashboard as online
```

### Step 27: PM2 Monitoring Setup

```bash
# View real-time logs
pm2 logs

# Monitor resources
pm2 monit

# View detailed info
pm2 info woocommerce-dashboard

# Restart app (useful after code updates)
pm2 restart woocommerce-dashboard

# Reload app (zero-downtime restart)
pm2 reload woocommerce-dashboard
```

### Step 28: Configure Log Rotation

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

---

## Security Hardening

### Step 29: Configure SSH Security

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

Update these settings:

```
# Disable root login
PermitRootLogin no

# Use SSH keys only (optional but recommended)
PasswordAuthentication no

# Change default port (optional)
Port 2222  # Or any non-standard port
```

Save and restart SSH:

```bash
sudo systemctl restart sshd
```

**Important:** If you change the SSH port, update firewall:

```bash
sudo ufw allow 2222/tcp
sudo ufw delete allow OpenSSH
```

### Step 30: Install Fail2Ban

```bash
# Install Fail2Ban to prevent brute force attacks
sudo apt install fail2ban -y

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
```

Find and update:

```ini
[sshd]
enabled = true
maxretry = 3
findtime = 10m
bantime = 1h

[nginx-http-auth]
enabled = true
```

Start Fail2Ban:

```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### Step 31: Set Up Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades

# Select "Yes" when prompted
```

### Step 32: Secure MongoDB

```bash
# MongoDB should only listen on localhost
sudo nano /etc/mongod.conf
```

Verify this setting:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1
```

Restart MongoDB:

```bash
sudo systemctl restart mongod
```

### Step 33: Set Proper File Permissions

```bash
# Application files
sudo chown -R deploy:deploy /var/www/dashboard.ceyloncanecrafts.lk
sudo find /var/www/dashboard.ceyloncanecrafts.lk -type d -exec chmod 755 {} \;
sudo find /var/www/dashboard.ceyloncanecrafts.lk -type f -exec chmod 644 {} \;

# Make .env file private
chmod 600 /var/www/dashboard.ceyloncanecrafts.lk/server/.env

# Uploads directory (writable)
chmod 755 /var/www/dashboard.ceyloncanecrafts.lk/server/uploads
```

---

## Monitoring & Maintenance

### Step 34: Set Up Monitoring Tools

**Install htop (resource monitoring):**

```bash
sudo apt install htop -y

# Run htop
htop
```

**Monitor disk usage:**

```bash
# Check disk space
df -h

# Check directory sizes
du -sh /var/www/dashboard.ceyloncanecrafts.lk/*
```

**Monitor logs:**

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/dashboard.ceyloncanecrafts.lk.access.log

# Nginx error logs
sudo tail -f /var/log/nginx/dashboard.ceyloncanecrafts.lk.error.log

# PM2 logs
pm2 logs woocommerce-dashboard

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# System logs
sudo journalctl -xe
```

### Step 35: Create Backup Script

```bash
# Create backup directory
mkdir -p /home/deploy/backups

# Create backup script
nano /home/deploy/backup.sh
```

Add the following:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/dashboard.ceyloncanecrafts.lk"
DB_NAME="woocommerce_dashboard"
DB_ADMIN_USER="wd_admin"
DB_ADMIN_PASS="STRONG_PASSWORD_HERE"

# Create backup directory for today
mkdir -p "$BACKUP_DIR/$DATE"

# Backup MongoDB
echo "Backing up MongoDB..."
mongodump --db=$DB_NAME --username=$DB_ADMIN_USER --password=$DB_ADMIN_PASS --authenticationDatabase=admin --out="$BACKUP_DIR/$DATE/mongodb"

# Backup uploads directory
echo "Backing up uploads..."
tar -czf "$BACKUP_DIR/$DATE/uploads.tar.gz" "$APP_DIR/server/uploads"

# Backup .env file
echo "Backing up configuration..."
cp "$APP_DIR/server/.env" "$BACKUP_DIR/$DATE/env.backup"

# Remove backups older than 7 days
find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR/$DATE"
```

Make executable and test:

```bash
chmod +x /home/deploy/backup.sh

# Test backup
./backup.sh
```

### Step 36: Schedule Automated Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/deploy/backup.sh >> /home/deploy/backups/backup.log 2>&1
```

### Step 37: Set Up Email Alerts (Optional)

```bash
# Install mailutils
sudo apt install mailutils -y

# Configure alerts in backup script
# Add at end of backup.sh:
# echo "Backup completed successfully" | mail -s "Backup Report" your@email.com
```

---

## Post-Deployment Setup

### Step 38: Access Your Application

1. **Open your browser** and navigate to `https://dashboard.ceyloncanecrafts.lk`

2. **First-time setup screen** should appear

3. **Create admin account:**

   - Full Name
   - Email Address
   - Password (minimum 6 characters)
   - Confirm Password

4. **Login** with your credentials

### Step 39: Configure Application Settings

1. **Navigate to Settings** (`/settings`)

2. **Configure Company Information:**

   - Company Name
   - Address
   - Phone
   - Email

3. **Set Currency Settings:**

   - Currency Symbol (e.g., $, €, £)
   - Currency Position (before/after amount)

4. **Add WooCommerce API Credentials:**

   - Consumer Key
   - Consumer Secret
   - Store URL

5. **Configure Email Settings** (optional):

   - SMTP Host
   - SMTP Port
   - Username
   - Password

6. **Save all settings**

### Step 40: Sync Initial Data

1. **Sync Products:**

   - Navigate to Products page
   - Click "Sync from WooCommerce"
   - Wait for sync to complete

2. **Sync Orders:**

   - Navigate to Orders page
   - Click "Sync from WooCommerce"

3. **Add Customers:**
   - Import from WooCommerce or add manually

### Step 41: Test All Features

- [ ] Create a test quotation
- [ ] Generate a test invoice
- [ ] Test POS functionality
- [ ] Generate and download PDF
- [ ] Send test email invoice
- [ ] Add an expense
- [ ] View reports and charts
- [ ] Upload media files

---

## Troubleshooting

### Issue 0: MongoDB Connection Refused (ECONNREFUSED 127.0.0.1:27017)

**Symptoms:**

- `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`
- Can't connect to MongoDB with `mongosh`

**This means MongoDB service is not running.**

**Solution:**

```bash
# Step 1: Check MongoDB service status
sudo systemctl status mongod

# Step 2: If it shows "inactive (dead)" or "failed", check logs
sudo journalctl -u mongod -n 50

# Step 3: Try to start MongoDB
sudo systemctl start mongod

# Step 4: Check status again
sudo systemctl status mongod

# Step 5: If it fails to start, check MongoDB logs for specific errors
sudo tail -50 /var/log/mongodb/mongod.log
```

**Common Causes and Fixes:**

**A) MongoDB data directory permission issues:**

```bash
# Fix ownership
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /tmp/mongodb-27017.sock

# Fix permissions
sudo chmod 755 /var/lib/mongodb

# Try starting again
sudo systemctl start mongod
```

**B) MongoDB data directory doesn't exist:**

```bash
# Create data directory
sudo mkdir -p /var/lib/mongodb

# Set ownership
sudo chown -R mongodb:mongodb /var/lib/mongodb

# Start MongoDB
sudo systemctl start mongod
```

**C) Port 27017 already in use:**

```bash
# Check what's using the port
sudo lsof -i :27017

# If another process is using it, kill it
sudo kill -9 <PID>

# Start MongoDB
sudo systemctl start mongod
```

**D) Configuration file syntax error:**

```bash
# Check MongoDB logs for YAML parsing errors
sudo journalctl -u mongod -n 20

# If you see "Error parsing YAML config file", edit the config
sudo nano /etc/mongod.conf

# Common YAML errors:
# - Missing space after colon (should be "key: value" not "key:value")
# - Wrong indentation (use spaces, not tabs)
# - Incorrect nesting

# Example of correct syntax:
# security:
#   authorization: enabled
# (Note: TWO spaces for indentation, ONE space after colon)

# To fix, you can regenerate the default config:
sudo cp /etc/mongod.conf /etc/mongod.conf.backup
sudo nano /etc/mongod.conf

# Ensure these sections have proper formatting:
# storage:
#   dbPath: /var/lib/mongodb
# net:
#   port: 27017
#   bindIp: 127.0.0.1
# security:
#   authorization: enabled

# After fixing, restart MongoDB
sudo systemctl restart mongod
sudo systemctl status mongod
```

**E) Complete reinstall if nothing works:**

```bash
# Stop MongoDB
sudo systemctl stop mongod

# Remove MongoDB
sudo apt remove mongodb-org -y
sudo apt purge mongodb-org* -y

# Remove data directory (CAUTION: This deletes all data)
sudo rm -rf /var/lib/mongodb
sudo rm -rf /var/log/mongodb

# Reinstall MongoDB (follow Step 8 again)
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install mongodb-org -y

# Start and enable
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
mongosh --eval "db.version()"
```

**After MongoDB is running, proceed to create users in Step 9.**

### Issue 1: Application Won't Start

**Check PM2 logs:**

```bash
pm2 logs woocommerce-dashboard --lines 100
```

**Common causes:**

- Missing environment variables in .env
- MongoDB connection failed
- Port 5000 already in use
- Missing npm dependencies

**Solutions:**

```bash
# Check if port is in use
sudo lsof -i :5000

# Reinstall dependencies
cd /var/www/dashboard.ceyloncanecrafts.lk/server
npm install

# Test MongoDB connection
mongosh -u wd_admin -p --authenticationDatabase woocommerce_dashboard

# Check environment variables
cat /var/www/dashboard.ceyloncanecrafts.lk/server/.env
```

### Issue 4: Nginx 502 Bad Gateway

**Symptoms:** Browser shows "502 Bad Gateway"

**Causes:**

- Node.js app is not running
- Firewall blocking internal connection
- Nginx can't connect to port 5000

**Solutions:**

```bash
# Check if Node.js app is running
pm2 status

# Restart app
pm2 restart woocommerce-dashboard

# Check Nginx error logs
sudo tail -f /var/log/nginx/dashboard.ceyloncanecrafts.lk.error.log

# Test if app responds locally
curl https://localhost:5000/api

# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Issue 5: MongoDB Authentication Failed

**Error in logs:** "MongoServerError: Authentication failed"

**Solutions:**

```bash
# Verify MongoDB is running
sudo systemctl status mongod

# Test connection with correct credentials
mongosh -u wd_admin -p --authenticationDatabase woocommerce_dashboard

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod

# Verify MONGO_URI in .env file
cat /var/www/dashboard.ceyloncanecrafts.lk/server/.env | grep MONGO_URI
```

### Issue 6: SSL Certificate Issues

**Symptoms:** Browser shows "Not Secure" or certificate error

**Solutions:**

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test Nginx configuration
sudo nginx -t

# Check SSL configuration in Nginx
sudo nano /etc/nginx/sites-available/dashboard.ceyloncanecrafts.lk

# Reload Nginx
sudo systemctl reload nginx
```

### Issue 7: Can't Upload Files

**Error:** "Permission denied" or upload fails

**Solutions:**

```bash
# Check uploads directory exists
ls -la /var/www/dashboard.ceyloncanecrafts.lk/server/uploads

# Set correct permissions
sudo chown -R deploy:deploy /var/www/dashboard.ceyloncanecrafts.lk/server/uploads
chmod 755 /var/www/dashboard.ceyloncanecrafts.lk/server/uploads

# Check Nginx configuration for /uploads location
sudo nano /etc/nginx/sites-available/dashboard.ceyloncanecrafts.lk
```

### Issue 8: API Requests Failing

**Symptoms:** Frontend can't connect to backend

**Solutions:**

```bash
# Verify API URL in client
cat /var/www/dashboard.ceyloncanecrafts.lk/client/dist/assets/*.js | grep -o "https://[^\"]*"

# Test API directly
curl https://dashboard.ceyloncanecrafts.lk/api

# Check CORS settings in server/index.js
# Should allow your domain

# Check browser console for errors
# Verify network requests in browser DevTools
```

### Issue 9: High Memory Usage

**Monitor memory:**

```bash
# Check memory usage
free -h

# Check process memory
htop

# View PM2 memory usage
pm2 monit
```

**Solutions:**

```bash
# Restart application
pm2 restart woocommerce-dashboard

# Limit PM2 memory
pm2 start index.js --name woocommerce-dashboard --max-memory-restart 500M

# Check for memory leaks in application logs
pm2 logs woocommerce-dashboard --lines 500
```

---

## Updating Application

### Deploy New Version

```bash
# Navigate to app directory
cd /var/www/dashboard.ceyloncanecrafts.lk

# Pull latest code (if using Git)
git pull origin main

# Update server dependencies
cd server
npm install --production

# Update and rebuild client
cd ../client
npm install
npm run build

# Restart application with zero downtime
pm2 reload woocommerce-dashboard

# Or restart (with brief downtime)
pm2 restart woocommerce-dashboard

# Verify application is running
pm2 status
```

### Database Migrations (if needed)

```bash
# Connect to MongoDB
mongosh -u wd_admin -p --authenticationDatabase woocommerce_dashboard

# Run any necessary migration scripts
use woocommerce_dashboard
# ... run your migration commands
```

---

## Useful Commands Reference

### System Management

```bash
# Check system resources
htop
df -h
free -h

# Reboot server
sudo reboot

# Check system logs
sudo journalctl -xe
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload (no downtime)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/dashboard.ceyloncanecrafts.lk.access.log
sudo tail -f /var/log/nginx/dashboard.ceyloncanecrafts.lk.error.log
```

### PM2 Commands

```bash
# List applications
pm2 list

# View logs
pm2 logs woocommerce-dashboard

# Monitor resources
pm2 monit

# Restart
pm2 restart woocommerce-dashboard

# Reload (zero downtime)
pm2 reload woocommerce-dashboard

# Stop
pm2 stop woocommerce-dashboard

# Delete from PM2
pm2 delete woocommerce-dashboard
```

### MongoDB Commands

```bash
# Check status
sudo systemctl status mongod

# Restart
sudo systemctl restart mongod

# View logs
sudo tail -f /var/log/mongodb/mongod.log

# Connect to database
mongosh -u wd_admin -p --authenticationDatabase woocommerce_dashboard

# Backup database
mongodump --db=woocommerce_dashboard --username=wd_admin --password=PASSWORD --authenticationDatabase=admin --out=/home/deploy/backup

# Restore database
mongorestore --db=woocommerce_dashboard --username=wd_admin --password=PASSWORD --authenticationDatabase=admin /home/deploy/backup/woocommerce_dashboard
```

### Firewall Commands

```bash
# Check status
sudo ufw status

# Allow port
sudo ufw allow 80/tcp

# Delete rule
sudo ufw delete allow 80/tcp

# Disable firewall
sudo ufw disable

# Enable firewall
sudo ufw enable
```

---

## Performance Optimization

### Enable Nginx Caching

```bash
sudo nano /etc/nginx/sites-available/dashboard.ceyloncanecrafts.lk
```

Add before server block:

```nginx
# Cache zone definition
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m use_temp_path=off;
```

Add in location /api block:

```nginx
# Enable caching for specific API routes
proxy_cache api_cache;
proxy_cache_valid 200 5m;
proxy_cache_use_stale error timeout http_500 http_502 http_503;
```

### Optimize MongoDB

```bash
# Connect to MongoDB
mongosh -u wd_admin -p --authenticationDatabase woocommerce_dashboard

# Create indexes for better performance
use woocommerce_dashboard

# Example indexes (adjust based on your queries)
db.products.createIndex({ "name": 1 })
db.customers.createIndex({ "email": 1 })
db.invoices.createIndex({ "createdAt": -1 })
db.orders.createIndex({ "orderDate": -1 })
```

### Configure Swap Space (if needed)

```bash
# Check existing swap
sudo swapon --show

# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Security Best Practices

1. **Keep System Updated**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Regular Backups**

   - Daily automated backups
   - Test restore process monthly
   - Store backups off-site

3. **Monitor Logs**

   - Review logs weekly
   - Set up alerts for errors
   - Monitor failed login attempts

4. **Strong Passwords**

   - Use complex passwords
   - Change default passwords
   - Use different passwords for different services

5. **Limit Access**

   - Use SSH keys instead of passwords
   - Disable root login
   - Use non-standard SSH port

6. **Keep Dependencies Updated**

   ```bash
   cd /var/www/dashboard.ceyloncanecrafts.lk/server
   npm outdated
   npm update
   ```

7. **Monitor SSL Certificate Expiry**
   ```bash
   sudo certbot certificates
   ```

---

## Support & Resources

### Log File Locations

- **Nginx Access:** `/var/log/nginx/dashboard.ceyloncanecrafts.lk.access.log`
- **Nginx Error:** `/var/log/nginx/dashboard.ceyloncanecrafts.lk.error.log`
- **PM2 Logs:** `~/.pm2/logs/`
- **MongoDB:** `/var/log/mongodb/mongod.log`
- **System:** `/var/log/syslog`

### Configuration File Locations

- **Nginx:** `/etc/nginx/sites-available/dashboard.ceyloncanecrafts.lk`
- **MongoDB:** `/etc/mongod.conf`
- **Application:** `/var/www/dashboard.ceyloncanecrafts.lk/server/.env`
- **PM2:** `~/.pm2/`

### Quick Health Check

```bash
# Run this to check if everything is working
sudo systemctl status nginx
sudo systemctl status mongod
pm2 status
sudo ufw status
df -h
free -h
```

---

## Conclusion

Your WooCommerce Dashboard application is now deployed on Ubuntu 24 with Nginx!

### What You've Accomplished

✅ Configured Ubuntu 24 server from scratch  
✅ Installed Node.js, Nginx, MongoDB, and PM2  
✅ Deployed both frontend and backend applications  
✅ Configured Nginx as reverse proxy  
✅ Set up SSL certificate with Let's Encrypt  
✅ Implemented process management with PM2  
✅ Secured the server with firewall and Fail2Ban  
✅ Set up monitoring and backups

### Next Steps

1. **Test thoroughly** - Try all features
2. **Set up monitoring** - Use services like UptimeRobot
3. **Regular maintenance** - Weekly checks and updates
4. **User training** - Train staff on the system
5. **Documentation** - Keep deployment notes updated

### Need Help?

- Check the Troubleshooting section above
- Review logs for error messages
- Test each component individually
- Contact your hosting provider for server issues

---

**Document Version:** 1.2  
**Last Updated:** November 25, 2025  
**Tested On:** Ubuntu 24.04 LTS  
**Domain:** dashboard.ceyloncanecrafts.lk  
**Node.js Version:** v24.11.1  
**MongoDB:** Using jammy (Ubuntu 22.04) repository for Ubuntu 24.04 compatibility

**Deployment Checklist:**

- [ ] VPS provisioned with Ubuntu 24.04
- [ ] Domain DNS configured
- [ ] SSH access verified
- [ ] Firewall configured
- [ ] Node.js installed
- [ ] Nginx installed
- [ ] MongoDB installed and secured
- [ ] Application files uploaded
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Client built and deployed
- [ ] PM2 configured with startup script
- [ ] Nginx configured with reverse proxy
- [ ] SSL certificate obtained
- [ ] Backups scheduled
- [ ] Application tested
- [ ] Monitoring set up

**Good luck with your deployment! 🚀**
