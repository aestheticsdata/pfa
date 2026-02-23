# PFA Deployment – Required Configuration

## Dev vs Prod Differences

| | Dev | Prod |
|---|---|---|
| Front | localhost:3000 | Static (nginx) |
| API | `NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST` (e.g. pfa.1991computer.com) | `/api` (same origin, nginx proxy) |
| Cookie | Cross-origin, CORS | Same-origin |

## Nginx – Critical Configuration for Session Cookie

The `pfa.sid` (httpOnly) cookie must be set correctly. For this, nginx **must** forward these headers to the Nest backend:

```nginx
location /api {
  proxy_pass http://127.0.0.1:6100;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

- **`X-Forwarded-Proto`**: required for the `Secure` cookie to be accepted over HTTPS
- **`Host`**: ensures the cookie is set for the correct domain

## Nest Environment Variables (nest-api/.env)

| Variable | Description |
|----------|-------------|
| `FRONTEND_URL` | Front URL (e.g. `https://pfa.1991computer.com`) – used for CORS |
| `COOKIE_SECURE` | If the site is **HTTP** (no SSL), set `COOKIE_SECURE=false` so the cookie can be set |
| `SESSION_SECRET` | Secret for signing the session |

## If It Works in Dev but Not in Prod

1. **Check the cookie in DevTools**: Network tab → POST `/api/users` (login) request → Response Headers → is `Set-Cookie` present?
2. **If no Set-Cookie**: issue on Nest or proxy side (missing headers)
3. **If Set-Cookie present but cookie not stored**: likely `Secure` on an HTTP site → add `COOKIE_SECURE=false` in `.env`
4. **If cookie stored but requests return 401**: `withCredentials` must be `true` (already configured in `useRequestHelper.js`)
