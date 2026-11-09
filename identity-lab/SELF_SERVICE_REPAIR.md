# Ulab self-service repair pilot

This implementation runs **inside Ulab's website/API** and does not call the ChatGPT conversation or ChatGPT GitHub connector.

## Supported repair (pilot 002)

- User: authorized owner of `thiskeenan-glitch/keenan-gray-site`.
- Source: `app/components/FilmshowProject.tsx`.
- Detectable change: `Founder / Director` to `Co-Founder / Creative Director` in the Filmshow credits.
- Customer sees the precise before/after change, must check approval, then Ulab's server creates a GitHub **draft pull request**.
- The owner reviews and merges on GitHub; Ulab does **not** automatically merge or publish.
- The **Check live website** button reads `https://www.thiskeenan.com/work/filmshow` and reports whether the new role appears in public content.
- No panels, indexing, or third-party corrections are claimed.

## Why not usable by arbitrary clients yet

This is a fixed, owner-scoped validation flow, not an open GitHub repository editor or an arbitrary website authoring platform. Public visitors are never allowed to submit a plan ID, repository or file path of their choosing. Other customers require a separate approved GitHub App installation, owned-site verification, a plan proposal with exact source-match preconditions, and persistent consent/receipt records.

## Activation in the dedicated Ulab Vercel project

1. In GitHub Settings > Developer settings > OAuth Apps, register a new Ulab OAuth App. Use the **actual** Ulab domain as the Homepage URL. Set Authorization callback URL to `https://YOUR-ULAB-DOMAIN/api/github-auth?action=callback`.
2. In the **Ulab deployment only** configure:
   - `IDLAB_PUBLIC_ORIGIN`: Exact HTTPS origin of the deployed Ulab project, no trailing slash, e.g. `https://YOUR-ULAB-DOMAIN`.
   - `IDLAB_GITHUB_OAUTH_CLIENT_ID`: The OAuth App client ID.
   - `IDLAB_GITHUB_OAUTH_CLIENT_SECRET`: The OAuth App secret, kept server-side.
   - `IDLAB_SESSION_SECRET`: A new unpredictable secret of 32+ characters, stored only as an encrypted environment variable.
   - `IDLAB_GITHUB_ALLOWED_USER`: `thiskeenan-glitch` for pilot 002.
3. Deploy from the intended project root `identity-lab` on the reviewed Ulab branch. **Do not** deploy the portfolio's `main` branch as Ulab or change the live director's portfolio project.
4. Open `/repair`. Click Connect GitHub. GitHub's OAuth consent should authorize the owner's account. Only the hardcoded pilot account is accepted.
5. Confirm the real source still displays the old role, approve the proposal, and click **Create correction pull request**. Review on GitHub; merge only after confirming the exact file diff.
6. Click **Check live website** after the director-site production deployment. A PR by itself does not count as public verification.

Security controls: encrypted and expiring HttpOnly Secure SameSite=Lax OAuth session cookie, CSRF state validation, owner allowlist, JSON same-origin approval gate, fixed allowlisted repo/branch/path/change, exact old-content precondition, GitHub draft PR only, no merge and no direct write to main. OAuth permissions are wider than desired (`public_repo`), so future customers should use a per-repository GitHub App installation instead.

## Tests

`node --test identity-lab/test-github-owner-repair.mjs identity-lab/test-repair-execution.mjs`

This pilot is ready for code review, but **not ready to charge customers**. Production readiness requires dedicated authorization, persistent audit logs and consent records, monitoring, and abuse controls.
