# Sushi Shop — assets for Next.js

Copy the `apps/` folder from this archive into the repository root `sushi-shop/` (merge folders, do not replace your source code). Assets end up under `apps/web/public/`. Copy `asset-docs/` into the repository root to keep the mapping documentation.

- 27 unique raster image fills, converted into WebP at original pixel dimensions (quality 91). Original source files are **not** included in this package; keep the five source ZIPs if you need originals.
- Three independent SVG social icons: `/icons/instagram.svg`, `/icons/telegram.svg`, `/icons/facebook.svg`. A combined backup is `/icons/social-combined.svg`.
- `asset-docs/assets-manifest.json` maps original Figma image hashes, node IDs, page names and layer paths to the new public URLs. Use this instead of guessing product names. `roll-01` etc. are technical placeholders, not verified product identities.
- Four additional user-provided Figma SVGs are included: `/icons/logo.svg`, `/icons/cart.svg`, `/icons/delete.svg`, `/icons/callback.svg`. Other UI icons not included can be exported later if needed.
- Staff photos `about/staff-*.webp` are local-development only until replaced/rights cleared. Review any map screenshot and other source licenses before publishing.
- Images have been converted for the web; crops/scaleMode from Figma should be reproduced through CSS / `next/image` with the original design data.
- Please avoid duplicating references inside the code: use stable `/images/...` and `/icons/...` URLs.

## Planned interactive map

`/images/restaurants/map.webp` is a temporary screenshot/reference from the Figma design, **not** the intended final map. Later replace it with an interactive Google Maps integration (provider/configuration and API keys to be decided during the functionality phase). Do not wire it now, and do not commit API keys.
