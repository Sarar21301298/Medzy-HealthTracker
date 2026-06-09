# Render.com Deployment Guide

## **Prerequisites**
- GitHub account with your code pushed
- Render.com account (free tier available)

---

## **Step 1: Prepare Your Repository**

1. Make sure all files are in the monorepo structure:
   ```
   my-app/
   ├── client/
   ├── server/
   ├── package.json
   ├── .env (never push to Git!)
   ├── .env.example
   ├── render.yaml
   └── .gitignore
   ```

2. Update `.gitignore` (already done) to exclude `.env`

3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Prepare monorepo for Render deployment"
   git push origin main
   ```

---

## **Step 2: Deploy to Render.com**

### **Option A: Using render.yaml (Recommended)**

1. Go to [render.com/dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` automatically
5. Click **"Deploy"**

### **Option B: Manual Setup**

1. Go to [render.com/dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Select your GitHub repository
4. Configure:
   - **Name**: `medzy-app`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Node Version**: `18.17.0`

---

## **Step 3: Add Environment Variables**

On Render dashboard:

1. Go to your service → **"Environment"**
2. Add each variable from `.env.example`:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Your JWT secret (generate new one!) |
| `FRONTEND_URL` | `https://your-service.onrender.com` |
| `BACKEND_URL` | `https://your-service.onrender.com` |
| `SSLCOMMERZ_STORE_ID` | Your SSLCommerz store ID |
| `SSLCOMMERZ_STORE_PASSWORD` | Your SSLCommerz password |
| `EMAIL_USER` | Your Gmail |
| `EMAIL_PASS` | Your Gmail app password |
| `EMAIL_FROM` | Your Gmail |
| `GEMINI_API_KEY` | Your Gemini API key |

3. Click **"Save Changes"**

---

## **Step 4: Monitor Deployment**

1. Click on your service
2. Go to **"Logs"** tab to watch build progress
3. Once deployed, you'll see: `Server running on port 10000`

---

## **Step 5: Test Your App**

- Frontend: `https://your-service.onrender.com`
- API: `https://your-service.onrender.com/api`
- Health: `https://your-service.onrender.com/api/health`

All relative API calls like `/api/auth/login` will work automatically!

---

## **Troubleshooting**

### Build fails
- Check build logs in Render dashboard
- Ensure `npm run build` works locally first
- Verify all dependencies are in package.json

### Can't connect to MongoDB
- Check MongoDB connection string in `.env`
- Ensure MongoDB Atlas allows your IP (Render's dynamic IP)
- Solution: In MongoDB Atlas → Network Access → Allow 0.0.0.0/0

### Static files not loading (404 errors)
- Ensure client build is in `client/dist/`
- Check that the catch-all route is in server.js
- Verify `npm run build --workspace=client` completes successfully

### Relative API calls not working
- All API calls start with `/api` ✅ (correct)
- No hardcoded `http://localhost:5000` ✅ (correct)
- Static files are being served from same domain ✅

---

## **Next Steps**

### Performance Optimization
- Enable caching in Render
- Use CDN for static assets (optional)
- Monitor memory usage

### Security
- Generate new `JWT_SECRET` for production
- Use strong passwords for all services
- Enable HTTPS (automatic on Render)

### Scaling
- Upgrade from Free to Paid tier if needed
- Monitor bandwidth and rebuild frequency

---

## **Common Environment Variable Mistakes**

❌ **Wrong:**
```javascript
const api = "https://my-service.onrender.com/api"; // Hardcoded
```

✅ **Right:**
```javascript
const api = "/api"; // Relative (works everywhere)
```

---

## **Questions?**

Check:
- Render docs: https://render.com/docs
- GitHub issues in your repo
- Render support: https://support.render.com
