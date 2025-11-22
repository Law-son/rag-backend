# Deployment Guide

This guide covers deploying the Church Record Management System with the client on Vercel and the server on Render.

## Architecture

- **Client (Frontend)**: Deployed on Vercel
- **Server (Backend API)**: Deployed on Render

## Prerequisites

1. GitHub account with the repository
2. Vercel account
3. Render account
4. MongoDB Atlas account (or your MongoDB instance)
5. Arkesel SMS API key

## Server Deployment (Render)

### Step 1: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `church-management-api` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `server`

### Step 2: Environment Variables

Add the following environment variables in Render dashboard:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-vercel-app.vercel.app
ARKESEL_API_KEY=your_arkesel_api_key
```

**Important Notes:**
- Replace `your_mongodb_connection_string` with your MongoDB Atlas connection string
- Generate a strong `JWT_SECRET` (use a random string generator)
- Set `FRONTEND_URL` to your Vercel deployment URL (you'll update this after deploying the client)
- Add your Arkesel SMS API key

### Step 3: Get Server URL

After deployment, Render will provide a URL like:
`https://church-management-api.onrender.com`

Copy this URL - you'll need it for the client configuration.

## Client Deployment (Vercel)

### Step 1: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

### Step 2: Environment Variables

Add the following environment variable in Vercel:

```env
VITE_API_BASE_URL=https://your-render-app.onrender.com/api
```

**Important:**
- Replace `your-render-app.onrender.com` with your actual Render service URL
- The `/api` suffix is important - don't forget it!

### Step 3: Deploy

Click "Deploy" and wait for the build to complete.

### Step 4: Update Server CORS

After getting your Vercel URL, update the `FRONTEND_URL` environment variable in Render to include your Vercel URL:

```env
FRONTEND_URL=https://your-vercel-app.vercel.app
```

If you need to support multiple URLs (e.g., preview deployments), you can use comma-separated values:

```env
FRONTEND_URL=https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

## Pre-Deployment Notes

### Favicon
The application is configured to use `/favicon.ico`. Add your favicon file to `client/public/favicon.ico` before deploying. The HTML is already configured to use it.

## Post-Deployment Checklist

- [ ] Server is running and accessible at Render URL
- [ ] Client is deployed and accessible at Vercel URL
- [ ] Health check endpoint works: `https://your-render-app.onrender.com/health`
- [ ] Client can connect to server API
- [ ] Login functionality works
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] MongoDB connection is working
- [ ] SMS service is configured with Arkesel API key
- [ ] Favicon is added to `client/public/favicon.ico`

## Testing the Deployment

1. **Test Server Health:**
   ```bash
   curl https://your-render-app.onrender.com/health
   ```

2. **Test API Endpoint:**
   ```bash
   curl https://your-render-app.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"yourpassword"}'
   ```

3. **Test Client:**
   - Visit your Vercel URL
   - Try logging in with admin credentials
   - Test various features

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Check that the URL doesn't have a trailing slash
3. Ensure `credentials: true` is set (already configured)

### API Connection Issues

If the client can't connect to the API:
1. Verify `VITE_API_BASE_URL` in Vercel is correct
2. Check that the server URL includes `/api` at the end
3. Check browser console for specific error messages
4. Verify the server is running on Render

### Build Failures

**Client Build:**
- Ensure all dependencies are in `package.json`
- Check that TypeScript compilation passes locally
- Review Vercel build logs for specific errors

**Server Build:**
- Verify Node.js version (requires >=18.0.0)
- Check that all environment variables are set
- Review Render build logs

### MongoDB Connection Issues

1. Verify MongoDB Atlas allows connections from Render's IP (0.0.0.0/0 for all)
2. Check connection string format
3. Ensure database user has proper permissions

## Environment Variables Reference

### Client (.env in Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.onrender.com/api` |

### Server (.env in Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `FRONTEND_URL` | Client URL for CORS | `https://app.vercel.app` |
| `ARKESEL_API_KEY` | Arkesel SMS API key | `your-api-key` |

## Continuous Deployment

Both Vercel and Render support automatic deployments:
- **Vercel**: Automatically deploys on push to main branch
- **Render**: Automatically deploys on push to main branch (if configured)

For preview deployments:
- Vercel creates preview deployments for pull requests
- Update `FRONTEND_URL` in Render to include preview URLs if needed

## Security Notes

1. Never commit `.env` files to Git
2. Use strong, randomly generated secrets for `JWT_SECRET`
3. Keep your MongoDB connection string secure
4. Regularly rotate API keys
5. Monitor Render and Vercel logs for suspicious activity

## Support

For issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → View Function Logs
3. Review browser console for client-side errors
4. Check server health endpoint for API status

