# GitHub Pages + ohike.ca Deployment Notes

## 1) Repository-side configuration

This repo is configured for a custom domain via the `CNAME` file:

- `CNAME`: `ohike.ca`

When this branch is published with GitHub Pages, GitHub will use `ohike.ca` as the custom domain.

## 2) GitHub Pages settings

In GitHub repository settings:

1. Open `Settings -> Pages`
2. Build and deployment:
   - Source: `Deploy from a branch`
   - Branch: `main` (or your publish branch)
   - Folder: `/ (root)`
3. In `Custom domain`, set: `ohike.ca`
4. Enable `Enforce HTTPS` after DNS is resolved.

## 3) DNS records at your domain provider

Add these records:

- `A` record: host `@` -> `185.199.108.153`
- `A` record: host `@` -> `185.199.109.153`
- `A` record: host `@` -> `185.199.110.153`
- `A` record: host `@` -> `185.199.111.153`
- `CNAME` record: host `www` -> `<your-github-username>.github.io`

If you use Cloudflare, keep DNS-only mode during initial verification.

## 4) Important limitation

GitHub Pages is static hosting and cannot run ASP.NET handlers:

- `api/signup.ashx` will not execute on GitHub Pages.

If you need server-side form submission (without mail client), move signup API to a separate backend service (for example Azure Functions, Cloudflare Workers, or another server), then update frontend API endpoint accordingly.
