# JDM Garage

A fullscreen, cinematic Three.js automotive experience. It begins with `HELLO.`, reports actual GLB loading state, then reveals a single vehicle with constrained orbit controls and an optional cinematic camera.

## Stack

Next.js, React, TypeScript, React Three Fiber and Three.js.

## Run

```bash
npm install
npm run dev
npm run build
```

The project uses only public paths, so it can be deployed to Vercel without server-specific configuration. The build script selects Next.js' official WASM compiler fallback because the native ARM SWC binary is not compatible with this local environment; this keeps `npm run build` reproducible.

`/create` provides a database-free editor for one to five YouTube links and a letter. The generated `/gift/[token]` link keeps the original Miata and Trueno garage, plays the selected videos sequentially behind the cars, and exposes the letter from the red-dot envelope control.

Development writes to `.next-dev`; production builds and `npm start` use `.next`. This separation prevents builds from overwriting the chunks of a running development server.

## Architecture

- `src/data/cars.ts`: vehicle contract and collection.
- `src/components/experience`: canvas, lighting, vehicle normalization and error boundary.
- `src/components/intro`: entry sequence and real loader UI.
- `src/components/ui`: deliberately minimal HUD.
- `public/models/miata/car.glb`: swappable vehicle asset.

## Add Or Replace A Car

Add an entry to `cars` in `src/data/cars.ts` and place a legally reusable GLB under `public/models`. The scene calculates its bounding box and centers/scales it rather than relying on the source model's origin.

The hero GLB at `public/models/miata/car.glb` is now an actual Miata NA; `public/models/ae86.glb` is a stylized AE86. The navigation cycles only these two available assets, not procedural stand-ins. Do not use an asset merely because it is public. Record its author, exact source URL, license, format, size and redistribution status in `ASSET_RESEARCH.md`, then preserve required attribution in `CREDITS.md` and `public/credits.txt`.

The initial `Miata Vibe` line-up has ten configured cars: MX-5 NA, Beat, Cappuccino, AZ-1, MR2 AW11, CR-X, AE86, Civic EG, RX-7 FC and Silvia S13. A car is only interactive when its `assetReady` flag is enabled after its model has passed this license review.

## Optimization

Use `gltf-transform` to remove unused data and consider Draco or Meshopt for a larger production model. Keep mobile textures near 1K-2K and preload only the current vehicle plus, at most, the next one.

## Licensing

The Miata is CC BY 4.0 by Ricy with a GLB adaptation by Shixuan Li. The AE86 is CC BY 3.0 by IvOfficial. Full attribution is in `CREDITS.md` and is accessible in the experience through `MODEL CREDITS`; research notes are in `ASSET_RESEARCH.md`.

Validate bundled GLB headers and embedded resources with `node scripts/check-models.mjs`.
