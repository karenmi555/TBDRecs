# TBD Recommendations

Static, single-page TBD Recommendations app, ready to deploy on Vercel.

## Deploy

Import this repository into Vercel and use the repository root as the project root. No build command, output directory, environment variables, or framework preset is required; Vercel serves `index.html` directly.

## Update

Replace the root `index.html` with the current source app:

```sh
cp /root/ai-surfer-assets/software/tbd-recommendations/index.html index.html
```

Commit and push the change to trigger a new Vercel deployment. Keep the app file self-contained, and do not add server-side secrets. The embedded Supabase publishable key is intended for browser use.
