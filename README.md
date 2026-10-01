# JDM Infinite Drive

A database-free, shareable cinematic journey with a beginning and destination. A creator adds the recipient's name, selects a JDM car, 5-100 virtual kilometers, up to five YouTube tracks, physical road messages and an optional letter. The visitor begins in a used Japanese garage, starts the car, drives from sunset into a starry night and arrives at a mountain overlook.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
npm run typecheck
npm run build
```

The project uses only public paths, so it can be deployed to Vercel without server-specific configuration. The build script selects Next.js' official WASM compiler fallback because the native ARM SWC binary is not compatible with this local environment; this keeps `npm run build` reproducible.

`/create` provides a database-free editor for one to five YouTube links and a letter. The generated `/gift/[token]` link keeps the original Miata and Trueno garage, plays the selected videos sequentially behind the cars, and exposes the letter from the red-dot envelope control.

Development writes to `.next-dev`; production builds and `npm start` use `.next`. This separation prevents builds from overwriting the chunks of a running development server.

## Architecture

- `src/app/create`: standalone Creator.
- `src/app/drive/[slug]`: standalone Visitor and dynamic OpenGraph image.
- `src/lib/drive-links.ts`: compact URL encoding and decoding.
- `src/components/drive`: garage, licensed vehicle, pooled road, environment, narrative timeline, cameras, letter and YouTube playlist controller.
- `src/lib/drives.ts`: shared contracts, sanitization and validation.
- `ARCHITECTURE.md`: boundaries and wireframes.
- `ASSET_RESEARCH.md`, `CREDITS.md`: asset audit and attribution.

The car/camera remain around the origin. Eight 36-unit road sections recycle behind the camera. Quality detection adjusts DPR, shadows, vegetation and procedural star count. Music uses only the official YouTube IFrame Player API; no audio is downloaded, extracted or stored.

## Asset Status

The audited Miata is bundled under CC BY 4.0 and used for both exterior and cockpit views. File inspection confirms named meshes for the steering wheel, radio, radio screen, seats and mirrors. No legally redistributable Cappuccino with a verified detailed interior was found, so its current visual is explicitly procedural rather than an unrelated or unlicensed model. See `ASSET_RESEARCH.md` before replacing it.
