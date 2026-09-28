# Studio surface materials

Photographic PBR texture maps by **Poly Haven**, distributed under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
[Poly Haven asset license](https://polyhaven.com/license).

| Asset | Local channels | Use |
| --- | --- | --- |
| [Wood Table 001](https://polyhaven.com/a/wood_table_001) | Diffuse, OpenGL normal, roughness | Dark wood furniture, frames, bookcases |
| [Wood Floor](https://polyhaven.com/a/wood_floor) | Diffuse, OpenGL normal, roughness | Lighter staggered floor boards |
| [Fabric Pattern 07](https://polyhaven.com/a/fabric_pattern_07) | OpenGL normal, roughness | Dyed woven rug, mats, blinds, lamp shade, bindings |
| [Leather White](https://polyhaven.com/a/leather_white) | Diffuse, OpenGL normal, roughness | Dyed chair upholstery, desk pad, notebook |
| [Plastered Wall 04](https://polyhaven.com/a/plastered_wall_04) | OpenGL normal, roughness | Painted interior walls |

Downloaded on 2026-09-28 from the official public API's 1k JPEG entries.
Original files are unmodified. `manifest.json` records source URLs, MD5 checksums
and byte sizes; these were verified against the provider's metadata. All maps
are served locally. There are no runtime requests to Poly Haven.

Colour tint, UV scale, normal strength and surface response are adjusted in
`app/surfaceMaterials.ts`. Colour maps use sRGB; normal and roughness maps use
linear data. Fine paper, cork, brushed-metal and glaze height fields, leaf veins,
keyboard legends and printed graphics are original procedural assets generated
locally by this application. Model detail is built procedurally in Three.js. The existing Atlas model licenses remain in
`public/models/atlas/CREDITS.md`.
