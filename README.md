# 28 GRILL

Static website for 28 GRILL in Kapana, Plovdiv.

## Pages

- `index.html`
- `menu.html`
- `order.html`
- `contact.html`

## Local Preview

Serve the project root with any static server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000/`.

## Cloudflare Pages

1. Push this repository to GitHub.
2. In Cloudflare Pages, choose **Create a project**.
3. Connect the GitHub repository.
4. Use these settings:
   - Framework preset: `None` / static site
   - Build command: empty
   - Build output directory: `/`
5. Deploy.

## Custom Domain

1. Open the Cloudflare Pages project.
2. Go to **Custom domains**.
3. Add `28grill.com`.
4. Follow Cloudflare's DNS instructions.
5. After DNS is active, verify:
   - `https://28grill.com/`
   - `https://28grill.com/menu.html`

