# Quick Deployment Checklist

## 🚀 Quick Start

### Server (Render) - Deploy First

1. **Create Render Web Service**
   - Connect GitHub repo
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`

2. **Set Environment Variables in Render:**
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_secret_key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ARKESEL_API_KEY=your_arkesel_key
   ```

3. **Copy Render URL** (e.g., `https://church-management-api.onrender.com`)

### Client (Vercel) - Deploy Second

1. **Create Vercel Project**
   - Import GitHub repo
   - Root Directory: `client`
   - Framework: Vite (auto-detected)

2. **Set Environment Variable in Vercel:**
   ```
   VITE_API_BASE_URL=https://your-render-app.onrender.com/api
   ```
   ⚠️ **Important:** Include `/api` at the end!

3. **Update Render CORS**
   - Go back to Render
   - Update `FRONTEND_URL` with your Vercel URL

## ✅ Verification

1. Test server: `https://your-render-app.onrender.com/health`
2. Test client: Visit Vercel URL and try logging in
3. Check browser console for any errors

## 📝 Notes

- Add `favicon.ico` to `client/public/` before deploying
- See `DEPLOYMENT.md` for detailed instructions
- Both platforms auto-deploy on git push

