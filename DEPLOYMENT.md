# Production deployment (Vercel + Render)

## Why you saw `localhost:4002` errors

The frontend calls your **Express API** using `NEXT_PUBLIC_API_URL`.  
If that variable is **missing** when the Next.js app is **built**, the client bundle falls back to `http://localhost:4002` in development only — in production, an empty/missing URL means the browser cannot reach your API (or misconfigured URLs cause the same symptom).

**Fix:** set `NEXT_PUBLIC_API_URL` to your **public Render URL** and **redeploy** the frontend.

---

## 1. Render (backend: `server/`)

1. Deploy the Node service (root: `server/`, start: `node index.js` or `npm start`).
2. Set environment variables on Render:
   - `MONGODB_URI` — MongoDB Atlas connection string  
   - `MONGODB_DB` — database name (e.g. `careerbuilder`)  
   - `JWT_SECRET` — long random string  
   - `PORT` — Render sets this automatically; your app uses `process.env.PORT`  
   - **CORS:** `ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com`  
     (comma-separated; include preview URLs if needed)

3. Confirm the API is up: open `https://<your-service>.onrender.com/api/health` in a browser.

---

## 2. Vercel (frontend: Next.js)

1. Project **Settings → Environment Variables** (Production **and** Preview if you use previews):

   | Name | Example value |
   |------|----------------|
   | `NEXT_PUBLIC_API_URL` | `https://your-service.onrender.com` |

   - No trailing slash.
   - Use **HTTPS** Render URL.

2. **Redeploy** after adding/changing env vars (Build must see the variable so it is inlined into the client bundle).

3. Optional (server actions): set `API_URL` to the same value as `NEXT_PUBLIC_API_URL` if you want an explicit server-only copy.

---

## 3. PDF / certificate generation on Render

Resume PDF and certificate endpoints use **headless Chromium** via Puppeteer.

**What this repo does**

- **Render** sets `RENDER=true`. The server then uses **`@sparticuz/chromium` + `puppeteer-core`**, which is the usual way to run PDF generation on cloud hosts (the default Puppeteer Chrome bundle often fails there).
- **Local dev** keeps using full `puppeteer` + downloaded Chrome (via `postinstall`).

**If PDFs still fail**

1. Check **Render logs** for OOM or Chromium errors — upgrade to a plan with more **RAM** (PDF + Chromium is heavy).
2. Optionally set **`USE_SPARTICUZ_CHROMIUM=1`** if you deploy somewhere that behaves like Render but does not set `RENDER`.
3. Advanced: set **`PUPPETEER_EXECUTABLE_PATH`** to a Chrome/Chromium binary you control (e.g. custom Docker image).

The frontend may still show “Puppeteer / Render” if the **request never reaches** the API — fix **`NEXT_PUBLIC_API_URL`** on Vercel first, then retry PDF from the deployed site.

---

## 4. Quick verification

- [ ] `GET https://<render>/api/health` returns JSON  
- [ ] Vercel has `NEXT_PUBLIC_API_URL=https://<render>`  
- [ ] New deployment after setting env  
- [ ] `ALLOWED_ORIGINS` includes your exact Vercel URL  

If anything still fails, open the browser **Network** tab: requests should go to your Render host, not `localhost`.
