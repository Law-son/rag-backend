# Production URLs

This document contains the production URLs for the Church Record Management System.

## 🌐 Production URLs

### Client (Frontend)
- **URL:** https://allnations.vercel.app
- **Platform:** Vercel
- **Environment Variable:** `VITE_API_BASE_URL` should be set to `https://allnations.onrender.com/api`

### Server (Backend API)
- **URL:** https://allnations.onrender.com
- **Platform:** Render
- **Health Check:** https://allnations.onrender.com/health
- **API Base:** https://allnations.onrender.com/api
- **Environment Variable:** `FRONTEND_URL` should be set to `https://allnations.vercel.app`

## 🔧 Environment Variables

### Vercel (Client)
```env
VITE_API_BASE_URL=https://allnations.onrender.com/api
```

### Render (Server)
```env
NODE_ENV=production
FRONTEND_URL=https://allnations.vercel.app
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ARKESEL_API_KEY=your_arkesel_api_key
```

## ✅ Quick Health Checks

```bash
# Server health check
curl https://allnations.onrender.com/health

# Expected response:
# {"status":"success","message":"Church Management System API is running","timestamp":"..."}
```

## 📝 Notes

- Both platforms support automatic deployments on git push
- CORS is configured to allow requests from `https://allnations.vercel.app`
- All API requests from the client should go to `https://allnations.onrender.com/api`

