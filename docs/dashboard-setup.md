# Portfolio publishing setup

The `/admin` dashboard uses GitHub OAuth. Only `Ahmed-Nashat` with push access to `Ahmed-Nashat/Portfolio-` can publish. There is no public registration or password database. GitHub holds published content in `client/public/content.json` on `main`, with each publication recorded as a commit.

## One-time setup

1. Open https://github.com/settings/applications/new while signed in as Ahmed-Nashat.
2. Set application name to `Ahmed Portfolio Admin`, homepage URL to `https://ahmednashaat-steel.vercel.app`, and authorization callback URL to `https://ahmednashaat-steel.vercel.app/api/auth/callback`.
3. Register the OAuth app and generate a client secret. Do not paste secrets into chat, source files, or the repository.
4. In the Vercel project's Settings → Environment Variables, add these server-only values for Production:
   - `GITHUB_CLIENT_ID`: the OAuth application's client ID.
   - `GITHUB_CLIENT_SECRET`: the OAuth application's client secret.
   - `SESSION_SECRET`: a cryptographically random secret of at least 32 characters. Generate one in your terminal with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste it directly into Vercel.
   - `SITE_URL`: `https://ahmednashaat-steel.vercel.app` (optional, this is the default).
5. Redeploy the latest commit. Keep Vercel Root Directory at the repository root; the existing build configuration targets `client`.
6. Open `/admin`, sign in with GitHub, edit a field, and press Publish changes. Confirm the update from a private browser window. GitHub raw-content caching can take a few minutes to refresh; the associated Vercel deployment also includes the new content file.

The app requests `public_repo` scope to write the public portfolio repository. This GitHub OAuth scope can access your other public repositories; the application code restricts all storage operations to the fixed portfolio repository/path. Do not reuse an unrelated OAuth application.

## Behavior

- Authentication tokens remain in encrypted HttpOnly, Secure cookies with an eight-hour session lifetime. Logout clears the browser session. GitHub can revoke the OAuth grant under Settings → Applications.
- Mutation endpoints reject unauthenticated requests and requests from another origin. All submitted content is validated server-side; links must use HTTP(S).
- Publishing checks the file revision, so a stale editor cannot overwrite a newer save. Export your draft before reloading to resolve a conflict.
- The public site reads shared content and no longer uses browser local storage. Original HTML is retained as a fallback if content is unavailable.
- Existing browser-only drafts are not published automatically. Use the previous dashboard's JSON export, or retrieve the old `portfolio-content-v1` browser storage backup locally, then import it after signing in. Publishing requires an explicit click.
- An empty repository content file state uses the original defaults until the first publish.
- Signing into GitHub CLI does not configure this website's OAuth login; this app requires its own OAuth credentials.

## Verification

Run `node --test tests/cms.test.cjs` from the repository root, followed by `npm --prefix client run build`. These tests use mocked GitHub responses and make no remote writes. Use `vercel dev` from the repository root for local API development; ordinary Vite dev serves the frontend only. Production login requires the HTTPS domain registered above.
