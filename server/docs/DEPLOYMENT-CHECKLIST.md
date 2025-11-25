# Quick Deployment Checklist

## Before Deployment

### 1. Update API URL
- [ ] Edit `client/src/config/api.js`
- [ ] Change `http://localhost:5000/api` to `https://yourdomain.com/api`

### 2. Build Application
- [ ] Run `npm run build` in client folder
- [ ] Run `npm install --production` in server folder
- [ ] Or use provided `build.sh` / `build.bat` scripts

### 3. Prepare Environment Variables
- [ ] Copy `server/.env.production` to `server/.env`
- [ ] Update MongoDB URI
- [ ] Set strong JWT_SECRET (32+ chars)
- [ ] Add WooCommerce API credentials
- [ ] Configure SMTP (optional)

## Upload Files

### cPanel File Manager
- [ ] Upload `client/dist/*` to domain root (e.g., `public_html/yourdomain.com/`)
- [ ] Upload `server/*` to `api/` folder
- [ ] Upload `server/.env` file
- [ ] Copy `client/.htaccess.production` to domain root as `.htaccess`

### FTP/SFTP
- [ ] Connect to server
- [ ] Upload frontend (dist) to public_html
- [ ] Upload backend (server) to api folder
- [ ] Set file permissions (755 for folders, 644 for files)

## Configure Server

### cPanel
- [ ] Open "Setup Node.js App"
- [ ] Create new application:
  - Node.js version: 18+
  - App root: `api`
  - App URL: `yourdomain.com/api`
  - Startup file: `index.js`
- [ ] Add environment variables from .env
- [ ] Run NPM Install
- [ ] Start/Restart application

### DirectAdmin
- [ ] Install PM2: `npm install -g pm2`
- [ ] Start app: `pm2 start api/index.js --name woocommerce-dashboard`
- [ ] Save process: `pm2 save`
- [ ] Setup startup: `pm2 startup`
- [ ] Configure reverse proxy in Apache/Nginx

## Database Setup

### MongoDB Atlas
- [ ] Create cluster (free tier available)
- [ ] Create database user
- [ ] Whitelist hosting server IP
- [ ] Get connection string
- [ ] Add to .env file

## Post-Deployment

### First Access
- [ ] Visit `https://yourdomain.com`
- [ ] Complete first-time setup
- [ ] Create admin account

### Configure Settings
- [ ] Login to dashboard
- [ ] Go to Settings
- [ ] Enter company information
- [ ] Add WooCommerce API credentials
- [ ] Test WooCommerce connection
- [ ] Configure email settings (optional)

### Initial Data
- [ ] Sync products from WooCommerce
- [ ] Sync orders from WooCommerce
- [ ] Add/import customers

### Security
- [ ] Force HTTPS (SSL)
- [ ] Verify .env is not publicly accessible
- [ ] Test MongoDB connection security
- [ ] Enable firewall rules
- [ ] Configure backups

## Testing

### Functionality Tests
- [ ] Login/Logout
- [ ] Create quotation
- [ ] Create invoice
- [ ] Generate PDF
- [ ] Send email (if configured)
- [ ] WooCommerce sync
- [ ] POS functionality
- [ ] User management (admin only)
- [ ] Reports and dashboard

### Browser Tests
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile responsive

### Performance
- [ ] Page load speed
- [ ] API response times
- [ ] PDF generation speed

## Monitoring

### Regular Checks
- [ ] Application running (PM2/cPanel)
- [ ] Database connection active
- [ ] SSL certificate valid
- [ ] Disk space sufficient
- [ ] Error logs clean

### Maintenance
- [ ] Weekly: Check logs
- [ ] Monthly: Update dependencies
- [ ] Monthly: Database backup
- [ ] Quarterly: Security audit

## Rollback Plan

If deployment fails:
1. Restore previous backup
2. Check error logs
3. Verify environment variables
4. Test locally first
5. Contact hosting support if needed

## Support Resources

- **Documentation**: DEPLOYMENT.md (full guide)
- **Logs**: Check application logs for errors
- **MongoDB**: Check Atlas dashboard
- **Hosting**: Contact cPanel/DirectAdmin support
- **Node.js**: Verify version compatibility

---

## Quick Commands

```bash
# Check Node.js version
node --version

# Build client
cd client && npm run build

# Install server deps
cd server && npm install --production

# Check PM2 status
pm2 status

# View logs
pm2 logs woocommerce-dashboard

# Restart app
pm2 restart woocommerce-dashboard
```

---

**Estimated Deployment Time**: 30-60 minutes (first time)

**Prerequisites**: Domain, MongoDB Atlas account, WooCommerce store with API access
