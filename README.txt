Netlify page navigation integration

1. Copy index.html, scripts/build-pages.cjs, netlify.toml, and shared/ to the root of your GitHub repository.
2. Commit and push. Netlify should build with command: node scripts/build-pages.cjs and publish directory: .
3. The generated pages.json lists all HTML files under shared/ and populates the dropdown.
4. Adding/removing shared HTML files updates the directory on the next deployment.
5. Files are public on a public Netlify site. The dropdown is navigation, not access control.
6. Browser localStorage data does not automatically synchronize between computers.
7. If you already have a netlify.toml, merge the [build] settings rather than replacing existing rules.
