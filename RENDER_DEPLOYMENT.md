# Render Deployment Guide

## Prerequisites
- GitHub account with this repository pushed
- Render account (free tier available at https://render.com)
- Environment variables ready

## Deployment Steps

### 1. Connect to Render
1. Go to [render.com](https://render.com) and sign up if you haven't already
2. Click "New +" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Connect your GitHub account and select the `CaseTrendsKenya` repository

### 2. Configure the Service
- **Name**: `case-trends-kenya` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Frankfurt for EU, Singapore for Asia)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Start Command**: `npm run server`

### 3. Add Environment Variables
In the "Environment" section, add:

```
NODE_ENV=production
EMAIL_USER=info@casetrendskenya.co.ke
EMAIL_FROM=info@casetrendskenya.co.ke
EMAIL_PASS=your-gmail-app-password
ADMIN_NOTIFICATION_EMAIL=admin@casetrendskenya.co.ke
VITE_ADMIN_NOTIFICATION_EMAIL=admin@casetrendskenya.co.ke
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=your-service-key
```

**Note**: For Gmail / Google Workspace, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

### 4. Deploy
- Click "Create Web Service"
- Render will automatically build and deploy
- Monitor the build log to ensure everything succeeds
- Your app will be available at `https://case-trends-kenya.onrender.com` (or similar)

## Important Notes

### Auto-deployment
Every time you push to the `main` branch on GitHub, Render will automatically rebuild and redeploy your app.

### Supabase Integration
Make sure your Supabase project allows connections from your Render domain. Add to allowed hosts:
- `case-trends-kenya.onrender.com` (or your custom domain)

### Database Migrations
If you need to run Supabase migrations, do this before deploying or manually via Supabase CLI.

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- Limited to 750 hours per month
- For production, upgrade to Starter ($7/month)

## Troubleshooting

**Build fails with missing dependencies**
- Check `package.json` has all required packages
- Ensure `package-lock.json` is committed to git

**Environment variables not found**
- Double-check variable names match exactly
- Restart the service after adding variables

**Supabase connection errors**
- Verify credentials in environment variables
- Check Supabase project is active
- Add Render domain to allowed hosts in Supabase

**Email not sending**
- Verify Gmail App Password is correct
- Check email address format
- Review Gmail account 2FA settings

## Custom Domain
To use a custom domain:
1. Go to service settings
2. Add custom domain
3. Update DNS records with Render's nameservers
4. SSL certificate auto-generated within 24 hours

---

For more help, visit [Render Documentation](https://render.com/docs)
