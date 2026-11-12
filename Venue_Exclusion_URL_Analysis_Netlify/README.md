# Venue Exclusion Directory — URL Analysis

Deploy the entire folder (or ZIP) to Netlify via a Git-connected project / Netlify CLI build so the serverless function is deployed. A drag-and-drop static HTML deploy alone does not install the function.

Set the Netlify environment variable `OPENAI_API_KEY` to your API key (do not put it in HTML). Optionally set `OPENAI_MODEL` (defaults to `gpt-4.1-mini`). Redeploy after setting the variable.

Enter a website URL, artwork image URL, or both and click **Check for Exclusions**. The function extracts evidence; the existing browser-based Copilot checks it against General and venue-specific rules.

Supported artwork URLs: directly accessible PNG, JPEG, GIF or WEBP images. PDFs, login-only pages, Cloudflare-blocked sites, JavaScript-rendered content, and some hotlink-protected images may not be readable. No image files are stored by this package. The result is a screening aid, not automatic approval.

Security: the function blocks private/loopback IPs, validates DNS and redirects, limits response size, and keeps the API key server-side. For a publicly shared site, add Netlify authentication/rate limiting to control API costs and prevent abuse.
