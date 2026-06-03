# Vercel deployment & authentication checklist

Use this after deploying to [Vercel](https://vercel.com). Production app: https://aasa-med-chem-olive.vercel.app/

## 1. Environment variables (Project → Settings → Environment Variables)

Set these for **Production** (and Preview if you test preview URLs):

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | Neon connection string with `?sslmode=require` |
| `AUTH_SECRET` | Same value as `NEXTAUTH_SECRET` (32+ char random string) |
| `NEXTAUTH_SECRET` | Same as `AUTH_SECRET` |
| `AUTH_URL` | `https://aasa-med-chem-olive.vercel.app` (no trailing slash) |
| `NEXTAUTH_URL` | Same as `AUTH_URL` |

`AUTH_*` names are preferred for NextAuth.js v5; keeping both avoids inference issues.

After changing secrets or URLs, **redeploy** the project.

## 2. Production database (most common login failure)

Connecting to Neon does **not** create users. Seed the **same** database your Vercel app uses:

```bash
# From your machine, with production DATABASE_URL in .env (temporarily) or inline:
npm run db:push
npm run db:seed
```

Or run SQL in Neon console and confirm:

```sql
SELECT email, role FROM users;
```

Expected seed accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@aasa.com` | `admin123` |
| Seller | `seller@aasa.com` | `seller123` |
| Buyer | `buyer@aasa.com` | `buyer123` |

If this query returns no rows, login will always fail or bounce to the landing page.

## 3. Proxy & RBAC

Route protection runs in `src/proxy.ts` (Next.js 16 proxy convention — do **not** add a separate `middleware.ts` that re-exports config). It:

- Redirects logged-in users from `/` and `/login` to role dashboards
- Blocks `/admin`, `/seller`, `/buyer` for wrong roles or guests

Layouts also call `auth()` server-side as a second check.

## 4. What was fixed for “login → landing page”

1. **Proxy was misconfigured** — Next.js 16 uses `src/proxy.ts` with a named `proxy` export (not a re-exported `middleware.ts`).
2. **Login sent users to `/`** — now redirects to `/admin/dashboard`, `/seller/dashboard`, or `/buyer/dashboard` based on role.
3. **`secureCookie` in production** — JWT cookie is read correctly on Vercel HTTPS.
4. **`trustHost: true`** — Auth.js trusts the Vercel host header.

## 5. Debugging on Vercel

1. **Functions → Logs** — look for DB errors, `MissingSecret`, or `CredentialsSignin`.
2. **Browser DevTools → Application → Cookies** — after login you should see `authjs.session-token` (or `__Secure-authjs.session-token` on HTTPS).
3. **Network** — `POST /api/auth/callback/credentials` should return 200, not 401/500.

## 6. Local run (quick reference)

```bash
npm install
cp .env.example .env   # fill DATABASE_URL, AUTH_SECRET, AUTH_URL=http://localhost:3000
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000/login and sign in with seed credentials above.
