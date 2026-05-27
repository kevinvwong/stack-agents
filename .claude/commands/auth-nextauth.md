---
name: auth:nextauth
description: Audits a NextAuth.js (Auth.js v4/v5) configuration for security vulnerabilities. Covers session strategy, CSRF protection, provider configuration, callback security, JWT vs database sessions, role-based access control, and middleware protection.
---

# /auth:nextauth [scope]

Audit a NextAuth.js (Auth.js v4/v5) configuration for security vulnerabilities and hardening gaps.

## Usage

```
/auth:nextauth                      # full audit of all NextAuth configuration
/auth:nextauth --providers          # focus on OAuth provider configuration
/auth:nextauth --session            # session and JWT strategy security
/auth:nextauth --callbacks          # callback security (jwt, session, signIn, redirect)
/auth:nextauth [scope]              # describe a specific area to focus on
```

Examples:
```
/auth:nextauth
/auth:nextauth --providers
/auth:nextauth --session
/auth:nextauth --callbacks
/auth:nextauth "we just added Google OAuth"
/auth:nextauth "review our RBAC implementation"
```

## Execution

```
[AGENT: nextauth-auditor] [COMMAND: audit]
```

The agent audits the NextAuth configuration against the following checklist:

**Session Strategy**
- Session strategy (`jwt` vs `database`) is appropriate for the use case — `database` sessions are revocable but require a DB adapter; `jwt` sessions are stateless but cannot be invalidated without a blocklist
- `NEXTAUTH_SECRET` is present and meets minimum entropy (32+ random bytes)
- `NEXTAUTH_URL` is set correctly in all environments (misconfiguration causes redirect failures)
- Session `maxAge` is appropriate — not excessively long (>30 days for sensitive apps is a risk)
- Session data does not include sensitive information that should live only on the server

**CSRF Protection**
- CSRF token validation is not disabled (do not pass `csrf: false` without a specific reason)
- `trustHost` is not set to `true` in production unless behind a trusted proxy with a correct `HOST` header
- Callback URLs are validated against an `allowedOrigins` or `redirectProxy` pattern

**Provider Configuration**
- OAuth provider client secrets are in environment variables, never hardcoded
- Provider `clientId` and `clientSecret` are correctly mapped per environment (dev vs prod)
- Email provider: `sendVerificationRequest` uses a transactional email service — not `nodemailer` with a personal account in production
- Credentials provider: passwords are hashed with bcrypt (cost ≥ 12) or Argon2 — not MD5, SHA-1, or unsalted
- Credentials provider: failed login attempts are rate-limited

**Callback Security**
- `jwt` callback: custom claims added to the JWT token are validated before use — not trusted blindly in `session` callback
- `session` callback: only the minimum required data is exposed on the session object
- `signIn` callback: account linking is restricted — cannot link a credentials account to an OAuth account with the same email without verification
- `redirect` callback: validates the `url` parameter against a known-safe list — no open redirect
- `authorized` callback (v5): correctly returns `false` for unauthenticated routes rather than redirecting to a non-existent route

**Role-Based Access Control**
- User roles are stored in the database and loaded via the `jwt` callback — not trusted from the OAuth provider's profile claims
- Route protection is implemented in `middleware.ts` using the session token — not only in individual page/component checks
- Admin routes are protected at the middleware layer AND in the server component/action — defense in depth
- Role checks use type-safe enums, not raw string comparisons against role names

**Middleware Protection**
- `middleware.ts` exports a `config.matcher` that covers all protected routes
- Middleware does not accidentally protect public routes (signup, login, marketing pages, API health checks)
- API routes that are public (webhooks, health checks) are explicitly excluded from NextAuth middleware

**Database Adapter Security** (if using a database session strategy)
- Database adapter uses parameterized queries or a vetted ORM — no raw SQL string interpolation
- Session table has an index on `sessionToken` for fast lookups
- Expired sessions are purged — the adapter's cleanup is configured or a cron job exists

## Output Format

```
[AGENT: nextauth-auditor] [COMMAND: audit]
Version: <Auth.js v4 | Auth.js v5 (beta)>
Scope: <full | --providers | --session | --callbacks | custom>

### Critical
- [ ] **[Finding title]** — [file:line if known]
  Why it matters: [specific attack vector or consequence]
  Fix: [exact code change — show the before/after]

### High
- [ ] ...

### Medium
- [ ] ...

### Low
- [ ] ...

---

### Security Checklist

#### Session Strategy
- [x] `NEXTAUTH_SECRET` set with sufficient entropy
- [ ] Session `maxAge` appropriate for app sensitivity
- [ ] ...

#### CSRF Protection
- [x] CSRF token validation enabled
- [ ] ...

#### Provider Configuration
- [x] Client secrets in environment variables
- [ ] ...

#### Callback Security
- [x] `redirect` callback validates URL
- [ ] ...

#### RBAC
- [ ] Roles loaded from database, not OAuth claims
- [ ] ...

#### Middleware
- [x] Middleware matcher covers protected routes
- [ ] ...

---

### Summary
X critical, Y high, Z medium, W low — estimated remediation effort: [S/M/L/XL]

→ HANDOFF TO [web-security]: if Critical or High findings present, run `/panel:security` for full security sweep
```

## Audit Standards

- **Distinguish v4 from v5**: Auth.js v5 has a different API surface (`auth()` instead of `getServerSession()`, `authorized` callback instead of manual middleware). Findings must be version-specific.
- **Show the fix as code**: for Critical and High findings, show the before/after code. A description without code is incomplete for an auth audit.
- **Credentials provider gets extra scrutiny**: it is the most commonly misconfigured provider. Always check password hashing and rate limiting when it is present.
- **Don't flag necessary public routes**: if a route is intentionally public (the login page, marketing pages), say so and skip it. Only flag routes that accidentally bypass auth.
- **Open redirects are always Critical**: a `redirect` callback that does not validate the URL is a Critical finding, not a Medium. It enables phishing attacks.
