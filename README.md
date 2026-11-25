# Still Water Professional Counseling: static site

- `public/`: the website (plain HTML, CSS, JS, images, fonts). No WordPress, no database.
- `functions/api/contact.js`: Cloudflare Pages Function that emails form submissions through Resend.
- `wrangler.toml`: Cloudflare Pages config (`pages_build_output_dir = "public"`).

## Deploy to Cloudflare Pages

Option A: Git (recommended). Push this folder to a GitHub repo, then create a Cloudflare Pages project from it.
Framework preset: None. Build command: none. Build output directory: `public`.
The `functions/` folder is picked up automatically.

Option B: Wrangler CLI from this folder:

    npx wrangler pages deploy

(Drag-and-drop upload in the dashboard does NOT deploy `functions/`, so the form would not work that way.)

## Form email (Resend)

In Cloudflare Pages > Settings > Variables and Secrets (Production) add the secret below. The recipient (`CONTACT_TO`) and sender (`CONTACT_FROM`) are set in `wrangler.toml` under `[vars]`; Cloudflare ignores dashboard values for them because this project has a wrangler.toml.

| Name | Type | Example |
|---|---|---|
| `RESEND_API_KEY` | Secret | `re_...` |


The domain in `CONTACT_FROM` must be verified in Resend (Domains > Add domain, then add its DNS records in Cloudflare).

## Domain

Add `stillwatercounselingmidland.com` and `www.stillwatercounselingmidland.com` under the Pages project > Custom domains.
Then add a Cloudflare Redirect Rule: `www.stillwatercounselingmidland.com/*` to `https://stillwatercounselingmidland.com/${1}` (301).

## Files that help search engines and AI

`sitemap.xml`, `robots.txt` (all crawlers allowed), `llms.txt`, and `_redirects` (old WordPress URLs to the home page).

Deploys automatically to Cloudflare Pages (project `still-water-counseling`) on every push to `main`.
