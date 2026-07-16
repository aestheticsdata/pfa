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

## Deploy changelog

Each successful deploy appends an entry (newest first) to a per-app text log listing the commits that
ship in that version, with their Linear ticket numbers:

| App | URL | File on server |
|-----|-----|----------------|
| Front | `https://pfa.1991computer.com/deploys-front.txt` | `/var/www/pfa/deploy-logs/deploys-front.txt` |
| API | `https://pfa.1991computer.com/deploys-api.txt` | `/var/www/pfa/deploy-logs/deploys-api.txt` |

Both URLs are protected by HTTP Basic Auth. The logs live at a stable path outside the release
directories, so they survive the atomic release switch. Only the commits added **since that app's
previous deploy** are recorded (tracked via `/var/www/pfa/deploy-logs/.last-<app>` marker files).

### One-time server setup

```bash
# 1. Create the Basic Auth credentials (needs apache2-utils)
htpasswd -bc /var/www/pfa/deploy-logs/.htpasswd <user> <password>
```

```nginx
# 2. Add to the nginx server block (same file that proxies /api).
#    Exact-match locations, so they take priority over the Next proxy and expose ONLY these two files.
location = /deploys-front.txt {
  alias /var/www/pfa/deploy-logs/deploys-front.txt;
  default_type text/plain; charset utf-8;
  add_header X-Robots-Tag "noindex, nofollow" always;
  add_header Cache-Control "no-store" always;
  auth_basic "PFA deploys";
  auth_basic_user_file /var/www/pfa/deploy-logs/.htpasswd;
}
location = /deploys-api.txt {
  alias /var/www/pfa/deploy-logs/deploys-api.txt;
  default_type text/plain; charset utf-8;
  add_header X-Robots-Tag "noindex, nofollow" always;
  add_header Cache-Control "no-store" always;
  auth_basic "PFA deploys";
  auth_basic_user_file /var/www/pfa/deploy-logs/.htpasswd;
}
```

```bash
# 3. Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

### First run

- **Front**: automatic — the current live commit is read from the newest `public_html/releases/` folder,
  so the first entry already shows the correct delta.
- **API**: the API deploy leaves no hash on the server, so the first run seeds the marker and prints a
  labeled *last 10 commits* baseline. To make even that first entry a precise delta, pass the currently
  deployed commit once: `PFA_SINCE=<hash> ./nest-api/deploy-api.sh`.

Every deploy after the first is fully automatic for both apps.
