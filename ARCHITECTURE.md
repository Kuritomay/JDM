# Architecture

## Product Boundaries

`/create` is a quiet journey editor. `/drive/[slug]` is a full-screen visitor experience and imports no creator UI. Creation is entirely local and has no write boundary.

## Narrative State Machine

```text
hello -> loading -> garage -> cockpit -> ignition -> departure
      -> drive -> arrival -> destination
```

The garage presentation advances automatically. `EMPECEMOS` is the only required visitor action and provides the user gesture needed by YouTube playback. The journey then advances against normalized narrative progress rather than real-world speed. At 97.5%, the camera enters the arrival sequence and finishes at the mountain overlook.

## Shareable Links

The validated drive configuration is serialized into a compact, versioned tuple and encoded as a Base64 URL-safe route token. It includes the recipient, selected car, distance, one to five YouTube IDs, up to eight road messages, letter and signature.

No database, API write route, account or deployment secret is required. The visitor route decodes and validates the token before rendering.

Privacy model: unlisted, not encrypted. Anyone with a link can open and decode it. There is no directory or listing endpoint.

## Rendering

The selected vehicle stays around the world origin. Eight road sections and environmental objects recycle along Z. Vegetation uses instanced trunks and clustered icosahedral canopies. Three generated ridge meshes create foreground, middle and distant mountain layers. A shader-driven sky interpolates atmospheric colors while procedural points reveal stars and a restrained Milky Way.

The licensed Miata GLB provides both exterior and interior. Its named steering wheel and radio meshes are controlled independently at runtime. DRIVER places the camera inside the normalized model; CHASE moves behind it. The Cappuccino remains an explicitly procedural prototype until a licensed model passes audit.

## Wireframes

Creator:

```text
CREATE YOUR DRIVE

01 CAR          [ MX-5 ] [ CAPPUCCINO ]
02 JOURNEY      [ 32 ] KM
03 MUSIC        1-5 YouTube links
04 ROAD MOMENTS GARAGE --o----o-------o-- DESTINATION
05 LETTER       optional
06 SIGNATURE    optional
07 PREVIEW      08 CREATE DRIVE
```

Visitor:

```text
HELLO -> GARAGE PRESENTATION -> DRIVER SEAT
                     EMPECEMOS
                          |
                 IGNITION + SHUTTER
                          |
       DRIVER <-> CHASE / ROAD SIGNS / PLAYLIST
                          |
                  500 M -> OVERLOOK
                          |
                      LLEGAMOS.
```
