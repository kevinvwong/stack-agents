# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main`) | Yes |
| Older tagged releases | No — update to latest |

## Scope

stack-agents is a collection of Claude Code agent definitions (`.md` files), slash commands, and a local Vite dashboard. There is no server-side component, no user data stored, and no network service to attack.

Realistic security concerns:
- **Supply chain**: malicious content injected into agent `.md` files that gets executed as a system prompt
- **Workflow permissions**: overly permissive GitHub Actions `GITHUB_TOKEN` in `ci.yml`
- **install.ps1**: the installer copies files into `~/.claude/` — a malicious repo fork could use this path to overwrite Claude Code config

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report privately via [GitHub Security Advisories](https://github.com/kevinvwong/stack-agents/security/advisories/new) or email **kevin.v.wong@gmail.com** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

Expected response time: **within 7 days**.
