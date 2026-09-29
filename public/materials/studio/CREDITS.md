# Studio surface materials

Photographic PBR texture maps by **Poly Haven**, distributed under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
[Poly Haven asset license](https://polyhaven.com/license).

| Asset | Local channels | Use |
| --- | --- | --- |
| [Wood Table 001](https://polyhaven.com/a/wood_table_001) | Diffuse, OpenGL normal, roughness | Dark wooden clock rim |
| [White Oak Veneer](https://polyhaven.com/a/white_oak_veneer) | Diffuse, OpenGL normal, roughness | Fine-grained furniture, frames, joinery and garden bench |
| [Wood Floor](https://polyhaven.com/a/wood_floor) | Diffuse, OpenGL normal, roughness | Staggered floor boards |
| [Fabric Pattern 07](https://polyhaven.com/a/fabric_pattern_07) | OpenGL normal, roughness | Dyed cloth, sewn rug binding, blinds, lamp shade, book bindings |
| [Poly Wool Herringbone](https://polyhaven.com/a/poly_wool_herringbone) | OpenGL normal, roughness | Thin bound wool rug, folded cloth and bench cushion |
| [Leather White](https://polyhaven.com/a/leather_white) | Diffuse, OpenGL normal, roughness | Dyed chair upholstery, desk pad, notebook |
| [Plastered Wall 04](https://polyhaven.com/a/plastered_wall_04) | OpenGL normal, roughness | Painted interior walls |
| [Bark Brown 02](https://polyhaven.com/a/bark_brown_02) | Diffuse, OpenGL normal, roughness | Tree trunk and branches |
| [Sandstone Cracks](https://polyhaven.com/a/sandstone_cracks) | Diffuse, OpenGL normal, roughness | Separate stepping stones, edging and a turned birdbath |
| [Grass Ground](https://polyhaven.com/a/grass_ground) | Diffuse, OpenGL normal, roughness | Ground below individual meadow blades and flowers |

The initial 13 maps were downloaded on 2026-09-28; the 14 additional maps on
2026-09-29. All 27 original 1k JPEG files are unmodified. `manifest.json` records
source URLs, MD5 checksums and byte sizes, verified against the official API's
metadata. Assets are served locally; the running site makes no Poly Haven requests.

Colour tint, metric UV scale, normal strength and surface response are adjusted in
`app/surfaceMaterials.ts`. Colour maps use sRGB; normal and roughness maps use
linear data. Fine paper, cork, brushed-metal and glaze height fields, leaf veins,
keyboard legends and printed graphics are original procedural assets. Models,
sewn rug binding and fringe, plant instances, butterfly wings and birdbath are
built in Three.js. No external model or image generator was needed for this pass.
The existing Atlas model licenses remain in `public/models/atlas/CREDITS.md`.
