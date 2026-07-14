# Vercel Deployment Guide for PermisGo Backend

## Prerequisites
- Node.js 18+ installed locally
- Vercel account (free at vercel.com)
- Vercel CLI installed (`npm install -g vercel`)
- MongoDB Atlas instance with connection string

## Local Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory with all required variables (see `.env.example`)

3. **Test locally:**
```bash
npm run dev
```

## Deployment Steps

### 1. Connect to Vercel (First Time Only)
```bash
vercel login
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

Or for preview deployment:
```bash
vercel
```

### 3. Set Environment Variables in Vercel Dashboard

Go to your Vercel project dashboard → Settings → Environment Variables

Add all required variables:
- `NODE_ENV` = production
- `MONGO_URI` = your MongoDB connection string
- `JWT_SECRET` = strong random secret
- `JWT_EXPIRES_IN` = 7d
- `CLIENT_URL` = your frontend URL
- `ADMIN_CLIENT_URL` = your admin frontend URL
- `ADMIN_URL` = your admin URL
- `SMTP_HOST` = email server
- `SMTP_PORT` = email port
- `SMTP_USER` = email username
- `SMTP_PASS` = email password
- `MAIL_FROM` = sender email
- `API_RATE_LIMIT` = 500

### 4. Redeploy After Adding Environment Variables
```bash
vercel --prod
```

## Configuration Files Added

### `vercel.json`
- Specifies Node.js runtime
- Configures build and route handling
- Routes all traffic to server.js

### `.vercelignore`
- Excludes unnecessary files from deployment
- Reduces bundle size

### Updated `server.js`
- Now exports app for serverless environment
- Only listens to port locally (when VERCEL env var is not set)
- Fully compatible with Vercel's Node.js runtime

## Important Notes

1. **File Uploads**: Vercel has ephemeral storage. Use cloud storage (AWS S3, Azure Blob, Cloudinary) for file uploads instead of local filesystem.

2. **CORS**: Update `CLIENT_URL` and `ADMIN_CLIENT_URL` in environment variables to match your production domains.

3. **Database**: Ensure MongoDB Atlas allows connections from Vercel's IP ranges. Update IP whitelist in Atlas dashboard.

4. **Cold Starts**: First request after idle time may be slower due to cold starts.

5. **Logs**: View deployment logs in Vercel dashboard or via CLI:
```bash
vercel logs --prod
```

## Troubleshooting

**Build Fails:**
- Check `vercel logs --prod`
- Ensure all dependencies are listed in package.json
- Verify Node.js version compatibility

**Runtime Errors:**
- Check environment variables are set
- Verify MongoDB connection string
- Check CORS origins configuration

**File Upload Issues:**
- Files on Vercel are temporary
- Implement cloud storage for persistence

## Rollback Previous Deployment
```bash
vercel rollback
```

## Environment-Specific URLs

- **Production**: https://your-domain.vercel.app
- **Preview**: https://your-domain-[branch].vercel.app
- **Local**: http://localhost:5000
