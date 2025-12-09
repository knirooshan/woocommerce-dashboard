# WooCommerce Dashboard - Deployment Guide

## Table of Contents

1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Building for Production](#building-for-production)
4. [Deployment to cPanel](#deployment-to-cpanel)
5. [Deployment to DirectAdmin](#deployment-to-directadmin)
6. [Post-Deployment Setup](#post-deployment-setup)
7. [Troubleshooting](#troubleshooting)

---

## Pre-deployment Checklist

### System Requirements

- **Server**: Node.js 18+ (check with hosting provider)
- **Database**: MongoDB Atlas account (free tier available)
- **Domain**: Your domain with SSL certificate
- **Email**: SMTP credentials (optional, for sending invoices)

### Before You Deploy

- [ ] MongoDB Atlas cluster created and connection string ready
- [ ] WooCommerce store API credentials ready
- [ ] Domain/subdomain configured
- [ ] SSL certificate installed
- [ ] Node.js available on hosting

---

## Environment Configuration

### 1. Update API URL (Client)

Edit `client/src/config/api.js`:

```javascript
// Replace localhost with your production domain
export const API_URL = "https://yourdomain.com/api";
```

### 2. Configure Environment Variables (Server)

Create `.env` file in `server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/woocommerce-dashboard?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your_very_long_random_secret_key_here_min_32_chars

# WooCommerce API
WOO_CONSUMER_KEY=ck_your_consumer_key_here
WOO_CONSUMER_SECRET=cs_your_consumer_secret_here
WOO_URL=https://your-woocommerce-store.com

# Email Configuration (Optional - for sending invoices)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Important Notes:**

- Replace ALL placeholder values with your actual credentials
- Never commit `.env` file to git
- For Gmail, use App Password (not regular password)
- JWT_SECRET should be at least 32 characters long

---

## Building for Production

### 1. Build Client (React)

```bash
cd client
npm install
npm run build
```

This creates a `client/dist` folder with optimized production files.

### 2. Prepare Server

```bash
cd server
npm install --production
```

---

## Deployment to cPanel

### Method 1: Using cPanel File Manager (Recommended for beginners)

#### Step 1: Upload Files

1. **Login to cPanel**
2. **Open File Manager**
3. Navigate to your domain's root (usually `public_html/yourdomain.com`)

4. **Upload Backend:**

   - Create folder: `api`
   - Upload entire `server/` contents to `api/` folder
   - Upload your `.env` file to `api/` folder

5. **Upload Frontend:**
   - Upload all files from `client/dist/` to your domain root
   - Make sure `index.html` is in the root

**Final Structure:**

```
public_html/yourdomain.com/
├── api/                    # Backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── index.js
│   ├── package.json
│   └── .env
├── assets/                 # Frontend (from dist)
├── index.html
└── vite.svg
```

#### Step 2: Setup Node.js Application

1. **In cPanel, find "Setup Node.js App"**
2. Click **"Create Application"**

3. **Configure:**

   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Application root**: `api` (or full path like `/home/username/public_html/yourdomain.com/api`)
   - **Application URL**: `yourdomain.com/api`
   - **Application startup file**: `index.js`
   - **Environment variables**: Add from `.env` file (one by one)

4. Click **"Create"**

5. **Install Dependencies:**

   - After creation, cPanel shows a command to enter in terminal
   - Click **"Run NPM Install"** button, or use Terminal:

   ```bash
   source /home/username/nodevenv/yourdomain.com/api/18/bin/activate
   cd /home/username/public_html/yourdomain.com/api
   npm install
   ```

6. **Restart Application** using the "Restart" button

#### Step 3: Configure .htaccess

Create/Edit `.htaccess` in domain root:

```apache
# Enable RewriteEngine
RewriteEngine On

# API Proxy (redirect /api to Node.js app)
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ https://127.0.0.1:5000/api/$1 [P,L]

# Frontend SPA routing (React Router)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api
RewriteRule . /index.html [L]
```

#### Step 4: Configure CORS (if needed)

If API and frontend are on different subdomains, update `server/index.js`:

```javascript
app.use(
  cors({
    origin: ["https://yourdomain.com", "https://www.yourdomain.com"],
    credentials: true,
  })
);
```

---

### Method 2: Using Git Deployment (Advanced)

1. **Setup Git in cPanel:**

   - Navigate to "Git Version Control"
   - Clone your repository

2. **Create deployment script** (`.cpanel.yml`):

```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/username/public_html/yourdomain.com
    - cd $DEPLOYPATH/api
    - npm install --production
    - cd $DEPLOYPATH
    - cp -r client/dist/* .
```

3. **Push to trigger deployment:**

```bash
git push origin main
```

---

## Deployment to DirectAdmin

### Step 1: Upload Files via FTP/SFTP

1. **Connect via FTP** (FileZilla, WinSCP, etc.)

   - Host: yourdomain.com
   - Username: your_username
   - Password: your_password
   - Port: 21 (FTP) or 22 (SFTP)

2. **Navigate to domain folder** (usually `/domains/yourdomain.com/public_html`)

3. **Upload:**
   - Backend → `api/` folder
   - Frontend (dist) → root folder

### Step 2: Setup Node.js Application

**DirectAdmin typically requires custom setup:**

1. **Login to DirectAdmin**
2. **Navigate to "Custom HTTPD Configurations"** or **"Terminal"**

3. **Install Node.js** (if not available):

```bash
# Check if Node.js is installed
node --version

# If not, contact hosting provider
```

4. **Create Node.js startup script** (`api/start.sh`):

```bash
#!/bin/bash
cd /home/username/domains/yourdomain.com/public_html/api
node index.js
```

5. **Make executable:**

```bash
chmod +x start.sh
```

### Step 3: Setup Process Manager

**Option A: Using PM2 (Recommended)**

```bash
# Install PM2 globally
npm install -g pm2

# Start application
cd /home/username/domains/yourdomain.com/public_html/api
pm2 start index.js --name woocommerce-dashboard

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Option B: Using systemd service**

Create `/etc/systemd/system/woocommerce-dashboard.service`:

```ini
[Unit]
Description=WooCommerce Dashboard
After=network.target

[Service]
Type=simple
User=username
WorkingDirectory=/home/username/domains/yourdomain.com/public_html/api
ExecStart=/usr/bin/node index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
systemctl enable woocommerce-dashboard
systemctl start woocommerce-dashboard
```

### Step 4: Configure Apache/Nginx Reverse Proxy

**For Apache** (`.htaccess` in public_html):

```apache
RewriteEngine On

# API Proxy
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ https://127.0.0.1:5000/api/$1 [P,L]

# SPA Routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api
RewriteRule . /index.html [L]
```

**For Nginx** (`/etc/nginx/sites-available/yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /home/username/domains/yourdomain.com/public_html;
    index index.html;

    # API Proxy
    location /api {
        proxy_pass https://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Restart Nginx:

```bash
systemctl restart nginx
```

---

## Post-Deployment Setup

### 1. First-Time Access

1. **Navigate to your domain**: `https://yourdomain.com`
2. **First-time setup screen** should appear
3. **Create admin account:**
   - Full Name
   - Email
   - Password (min 6 characters)
   - Confirm Password

### 2. Configure System Settings

1. **Login with admin credentials**
2. **Go to Settings** (`/settings`)
3. **Configure:**
   - **Company Information**:
     - Company Name
     - Address, Phone, Email
   - **Currency Settings**:
     - Currency Symbol (e.g., $, €, ₹)
     - Currency Position (before/after)
   - **WooCommerce API**:
     - Consumer Key
     - Consumer Secret
     - Store URL
   - **SMTP Settings** (optional):
     - Email Host
     - Port
     - Username
     - Password

### 3. Initial Data Sync

1. **Sync Products**: Go to Products → Click "Sync from WooCommerce"
2. **Sync Orders**: Go to Orders → Click "Sync from WooCommerce"
3. **Add Customers**: Import or add manually

### 4. Create Additional Users (Optional)

1. **Go to Users** (admin only)
2. **Add Manager/Staff accounts**
3. **Set roles and permissions**

---

## Troubleshooting

### Issue 1: "API Connection Failed"

**Symptoms**: Frontend can't connect to backend

**Solutions:**

1. Check `.htaccess` proxy rules are correct
2. Verify Node.js app is running: `pm2 status` or check cPanel
3. Check API_URL in `client/src/config/api.js` matches your domain
4. Check CORS settings in `server/index.js`
5. Test API directly: `curl https://yourdomain.com/api`

### Issue 2: "Cannot connect to MongoDB"

**Symptoms**: Server crashes with MongoDB connection error

**Solutions:**

1. Verify MongoDB Atlas allows connections from hosting IP
2. Check MONGO_URI in `.env` is correct
3. MongoDB Atlas → Network Access → Add hosting server IP
4. Ensure database user has correct permissions

### Issue 3: "404 on page refresh"

**Symptoms**: React routes work initially but 404 on refresh

**Solutions:**

1. Check `.htaccess` has SPA routing rules
2. Ensure `index.html` is in domain root
3. Clear browser cache

### Issue 4: "Node.js app not starting"

**Symptoms**: Application won't start in cPanel/DirectAdmin

**Solutions:**

1. Check `package.json` has correct start script
2. Verify all dependencies installed: `npm install`
3. Check `.env` file exists and is readable
4. Review error logs in cPanel/DirectAdmin
5. Test locally: `node index.js`

### Issue 5: "Permission Denied"

**Symptoms**: Cannot write files, upload images

**Solutions:**

1. Check folder permissions: `chmod 755 api`
2. Check file ownership: `chown username:username api -R`
3. Ensure uploads directory is writable

### Issue 6: "WooCommerce Sync Failed"

**Symptoms**: Cannot sync products/orders

**Solutions:**

1. Verify WooCommerce API credentials
2. Check WooCommerce → Settings → Advanced → REST API
3. Ensure API has read permissions
4. Test API with Postman/curl
5. Check WooCommerce store is accessible (not in maintenance mode)

### Issue 7: "Email Sending Failed"

**Symptoms**: Invoices won't send via email

**Solutions:**

1. Check SMTP credentials in Settings
2. For Gmail: Use App Password, enable 2FA
3. Check port 587/465 is not blocked by hosting
4. Test with different email provider
5. Check email logs in dashboard

---

## Monitoring & Maintenance

### Regular Tasks

1. **Backup Database**: Export MongoDB regularly
2. **Update Dependencies**: Check for security updates monthly
3. **Monitor Logs**: Review error logs weekly
4. **Test Backups**: Ensure backup restoration works
5. **SSL Certificate**: Renew before expiry

### Performance Optimization

1. **Enable Compression** (in .htaccess):

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
```

2. **Browser Caching** (in .htaccess):

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

3. **Database Indexing**: Ensure proper indexes in MongoDB
4. **CDN**: Consider CloudFlare for static assets

---

## Security Checklist

- [ ] SSL certificate installed and forced (HTTPS)
- [ ] Strong JWT_SECRET (32+ characters)
- [ ] MongoDB IP whitelist configured
- [ ] Admin password is strong (12+ characters)
- [ ] CORS configured for specific domains only
- [ ] Rate limiting enabled (if high traffic expected)
- [ ] Regular security updates applied
- [ ] Backup strategy in place
- [ ] `.env` file not publicly accessible
- [ ] Error messages don't expose sensitive info

---

## Support & Resources

### Useful Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# View application logs (PM2)
pm2 logs woocommerce-dashboard

# Restart application (PM2)
pm2 restart woocommerce-dashboard

# Check application status
pm2 status

# View running processes
ps aux | grep node

# Check port usage
netstat -tulpn | grep 5000
```

### Log Files Locations

- **cPanel**: `/home/username/public_html/yourdomain.com/api/logs`
- **DirectAdmin**: `/var/log/directadmin/`
- **PM2**: `~/.pm2/logs/`
- **MongoDB Atlas**: Cloud Manager → Logs

---

## Quick Reference

### Production URLs

- **Frontend**: `https://yourdomain.com`
- **API**: `https://yourdomain.com/api`
- **API Health**: `https://yourdomain.com/api` (should show "WooCommerce Dashboard API is running")

### Important Files

- **API Configuration**: `server/.env`
- **Frontend API URL**: `client/src/config/api.js`
- **Database Config**: `server/config/db.js`
- **Server Entry**: `server/index.js`
- **Frontend Entry**: `client/src/main.jsx`

### Default Credentials

- **Admin**: Created during first-time setup
- **Database**: MongoDB Atlas (cloud hosted)
- **WooCommerce**: Uses API keys (read-only recommended)

---

## Version Information

- **Node.js**: 18+ required
- **MongoDB**: 6.0+
- **React**: 19.x
- **Express**: 5.x

---

**Last Updated**: November 2025

**Need Help?** Check logs, verify environment variables, and ensure all services are running.
