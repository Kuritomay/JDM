# 3D Asset Research

Research date: 2026-09-30. A public/downloadable file is not automatically reusable; every candidate below was checked for an explicit license.

## MVP Decision

| Vehicle | Decision | Reason |
| --- | --- | --- |
| Mazda MX-5 Miata NA | Use the existing Ricy/ngon_3d asset | CC BY 4.0, detailed interior, verified local GLB |
| Suzuki Cappuccino | Procedural preview only; do not bundle an unlicensed GLB | The exact model found is not downloadable and has no license |

The Visitor now uses the audited Miata for both exterior and cockpit views. GLB node inspection confirms named `steeringwheel`, `radio`, `radioscreen`, `seats`, `indoor1`, `indoor2` and mirror nodes, allowing targeted runtime behavior. The Cappuccino selector remains honest about its procedural exterior pending an asset that passes this audit.

## Verified Local Assets

| Asset | Source / author | License | GLB size | Interior | Mesh audit | Redistribution |
| --- | --- | --- | ---: | --- | --- | --- |
| 1990 Mazda Miata NA | [Ricy / ngon_3d](https://sketchfab.com/3d-models/1990-mazda-miata-na-7acee5044310499f85df631b203227b5), [GLB adaptation by Shixuan Li](https://shixuanli.com/objects) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 19,511,804 bytes | Yes: seats, dashboard, steering wheel, console and glass are present | 249 meshes. Steering wheel, radio, radio screen, seats, doors and mirrors have semantic node names and can be targeted. Wheel/tire naming still needs a Blender cleanup pass for guaranteed wheel rotation | Yes, with attribution, license link and modification notice |
| Toyota AE86 (legacy, not used by Infinite Drive) | [IvOfficial](https://poly.pizza/m/ZEFWmOPSgh) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | 829,404 bytes | No sufficiently detailed cockpit | 5 meshes | Yes, with attribution |

## Environment Assets

| Asset | Author / source | License | Local files | Modifications |
| --- | --- | --- | --- | --- |
| [Aerial Asphalt 01](https://polyhaven.com/a/aerial_asphalt_01) | Rob Tuytel / Poly Haven | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `public/models/environment/asphalt_*_1k.jpg` | Selected 1K diffuse, OpenGL normal and roughness JPG maps; renamed locally for web delivery |
| [Nature Kit](https://kenney.nl/assets/nature-kit) | Kenney | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `tree_pineTallA_detailed.glb`, `tree_oak.glb`, `tree_oak_fall.glb`, `plant_bushDetailed.glb`, `rock_largeA.glb` | Extracted only five optimized GLBs from the source pack; runtime transforms, material lighting and instancing only |

Both environment sources explicitly permit redistribution, modification and commercial use without attribution. Credits are retained voluntarily. All approved files are served locally; the runtime has no dependency on source URLs.

`node scripts/check-models.mjs` verified the local GLB headers, embedded resources, mesh counts and byte sizes. The Miata is too large for an ideal mobile first load; a future Blender/gltf-transform pass should rename cockpit parts, remove unseen exterior geometry in cockpit mode and target 5-8 MB.

### Miata Axis Audit

- Source bounds: min `[-2.018, 0.011, -4.087]`, max `[1.148, 2.728, 2.791]`.
- Source dimensions: `3.166 x 2.717 x 6.878`; longitudinal axis is local `Z`.
- Front is local `+Z`: pop-up lights and the front wheel pair are around `z = +1.4`; rear wheels are around `z = -2.59`.
- World road forward is `-Z`, therefore `CarRoot` applies one `Y = PI` rotation to the complete model. No individual body part compensates for orientation.
- Wheel roots are `tire`, `tire001`, `tire002`, `tire003` and matching `rim*` roots. Their source quaternions rotate their intrinsic wheel axis onto model `X`. Runtime spin is applied around parent/model `X`; front steering is a separate parent/model `Y` quaternion.

## Mazda Alternatives

| Candidate | License / size | Findings |
| --- | --- | --- |
| [Mazda Miata MX-5 NA by Lexyc16](https://sketchfab.com/3d-models/mazda-miata-mx-5-na-d51fcd44b74f4daf8012c41e0400c041) | CC BY 4.0; GLB 1.93 MB; 52,340 triangles | Downloadable. Interior appears present in the viewer. The API lists one animation, but does not identify its target or prove separate wheel/dashboard meshes. Strong optimization candidate. |
| [Classic Mazda Miata Cabriolet by SentientSundae](https://sketchfab.com/3d-models/classic-mazda-miata-cabriolet-low-poly-8bda7836f6514196b7b2fcf32c26d519) | CC BY 4.0; GLB 216 KB; 3,908 triangles | Author confirms a minimal interior. Excellent low tier exterior, but cockpit separation remains unknown. |

## Cappuccino And Kei Alternatives

| Candidate | License / size | Decision |
| --- | --- | --- |
| [Suzuki Cappuccino by Nizen](https://sketchfab.com/3d-models/suzuki-cappuccino-bd2213e2c8464e72b276b657cad37502) | No license; not downloadable; 231,454 triangles | Rejected. Redistribution and modification are not authorized. Interior and mesh organization are unverified. |
| [Daihatsu Copen LA400 by Mona x Supercars](https://sketchfab.com/3d-models/5a12931e2684424b8f432a6bd98e9b4c) | CC BY 4.0; downloadable GLB 5,823,664 bytes; 27,683 faces | Viable legal kei-roadster fallback. Preview suggests an interior, but source/file inspection is still required before bundling. Separate wheel/dashboard meshes are unknown. |
| [2020 Daihatsu Copen GR Sport](https://sketchfab.com/3d-models/2552efba1add4dfdab4378edc128d768) | CC BY-NC; GLB 6.8 MB | Rejected for a commercial-capable deployment because commercial use is prohibited. |
| [Autozam AZ-1 by Dem Can](https://sketchfab.com/3d-models/7efdb645c864462d842640d912092779) | CC BY-NC-SA; GLB 2.43 MB | Rejected for commercial use and it is a coupe, not a roadster. |

## License Conditions

CC BY permits sharing, modification and commercial use if attribution, a license link and modification notices are preserved. It does not grant trademarks, imply manufacturer endorsement or resolve every possible vehicle-design right. Remove badges where practical and avoid official-affiliation claims.

Before replacing the procedural Cappuccino, inspect the actual downloaded file in Blender and record: node names, independent steering/wheel meshes, material count, texture dimensions, draw calls, interior visibility from driver eye position, and optimized GLB output size.
