---
name: auth:clerk
description: Audits a Clerk authentication configuration for security vulnerabilities, misconfigurations, and hardening gaps. Covers middleware protection, route authorization, JWT template security, organization/role configuration, webhook validation, and Clerk + Next.js App Router integration patterns.
---

# /auth:clerk [scope]

Audit a Clerk authentication configuration for security vulnerabilities, misconfigurations, and hardening gaps.

## Usage

```
/auth:clerk                         # full audit of all Clerk configuration
/auth:clerk --middleware            # focus on middleware gaps and route protection
/auth:clerk --jwt                   # JWT template security
/auth:clerk --webhooks              # webhook validation and security
/auth:clerk [scope]                 # describe a specific area to focus on
```

Examples:
```
/auth:clerk
/auth:clerk --middleware
/auth:clerk --jwt
/auth:clerk --webhooks
/auth:clerk "we just added organizations"
/auth:clerk "review our RBAC setup"
```

## Execution

```
[AGENT: clerk-auditor] [COMMAND: audit]
```

The agent audits the Clerk configuration against the following checklist:

**Middleware Protection**
- `clerkMiddleware()` is present in `middleware.ts` (not the deprecated `authMiddleware`)
- All non-public routes are protected — no route that should require auth is accidentally in `publicRoutes`
- `matcher` config correctly excludes static assets and Next.js internals without accidentally excluding API routes
- API routes that accept webhooks are correctly excluded from Clerk auth (they use their own validation)
- Middleware runs on the Edge — no Node.js-only code paths in middleware

**Route Authorization**
- Server Components that render sensitive data call `auth()` and check the result before rendering
- Server Actions call `auth()` at the top of the action, not deep inside a conditional
- API route handlers check auth before performing any business logic
- No route assumes the presence of a session — all access `auth()` result defensively

**JWT Template Security**
- JWT templates expose only the minimum claims required by each consumer
- No sensitive user metadata is included in the JWT template without a specific reason
- JWT template `exp` (expiration) is appropriate for the use case
- Custom claims do not shadow standard JWT claims (`sub`, `iss`, `aud`, `exp`, `iat`)

**Organization and Role Configuration**
- Organization roles are defined with least-privilege defaults
- Role assignments are validated server-side, not trusted from client claims alone
- `has({ permission: '...' })` is used for permission checks rather than role-name string comparisons (which are fragile to renames)
- Admin-only operations check `auth().has({ role: 'org:admin' })` — not just `userId` presence

**Webhook Validation**
- All Clerk webhook endpoints validate the `svix-signature` header using `svix`
- Webhook secret is stored in an environment variable, not hardcoded
- Webhook handler returns `400` on validation failure — not `200` (which would ack a forged event)
- Webhook endpoint is excluded from CSRF protection and Clerk middleware, but NOT from signature validation

**Next.js App Router Integration**
- `<ClerkProvider>` wraps the root layout — not individual pages
- `currentUser()` vs `auth()` used correctly: `currentUser()` for user profile data (slower, reads DB), `auth()` for auth state and claims (fast, reads session)
- `useAuth()` / `useUser()` are only used in Client Components
- Server Components do not import client-only Clerk hooks

## Output Format

```
[AGENT: clerk-auditor] [COMMAND: audit]
Scope: <full | --middleware | --jwt | --webhooks | custom>

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

### Hardening Checklist

#### Middleware
- [x] `clerkMiddleware()` used (not deprecated `authMiddleware`)
- [ ] All non-public routes explicitly protected
- [x] Matcher excludes static assets
- [ ] ...

#### Route Authorization
- [x] Server Components call `auth()` before rendering sensitive data
- [ ] ...

#### JWT Templates
- [x] Templates expose minimum required claims
- [ ] ...

#### Webhooks
- [x] `svix` signature validation present
- [ ] ...

#### Organization / RBAC
- [ ] Roles use least-privilege defaults
- [ ] ...

---

### Summary
X critical, Y high, Z medium, W low — estimated remediation effort: [S/M/L/XL]

→ HANDOFF TO [web-security]: if Critical or High findings present, run `/panel:security` for full security sweep
```

## Audit Standards

- **Be specific about Clerk API usage**: cite the specific Clerk method, hook, or config property. "Auth is not checked" is not actionable. "`app/dashboard/page.tsx` calls `currentUser()` but does not check for `null` before rendering user data" is.
- **Show the fix as code**: for Critical and High findings, show the before/after. A description without code is incomplete for a Clerk audit.
- **Don't flag intentional public routes**: if a route is public by design (marketing pages, webhook endpoints), say so and move on. Only flag routes that appear to accidentally bypass auth.
- **Version-aware**: flag use of deprecated APIs (`authMiddleware`, `withClerkMiddleware`) as High — they will break on Clerk SDK upgrades.
