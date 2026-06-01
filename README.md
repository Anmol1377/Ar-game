# 🎯 AR Floor Defense Shooter

A free, open-source **augmented reality** game built with **Three.js + WebXR**.
Scan your floor, open a portal, and shoot the enemies that walk across your real room.

> 📖 Full game design / vision: [AR-Floor-Defense-Shooter.md](AR-Floor-Defense-Shooter.md)

## ▶️ Play it (Android)

**Live:** https://anmol1377.github.io/Ar-game/

- Open the link in **Chrome on Android** (requires [Google Play Services for AR / ARCore](https://play.google.com/store/apps/details?id=com.google.ar.core)).
- Tap **Enter AR**, allow the camera.
- Pan slowly until the blue ring finds the floor → **tap** to open your portal.
- **Tap enemies** (or the Fire button) to shoot. Survive the endless waves!

> ⚠️ **iOS is not supported** — Safari doesn't implement WebXR AR. For iPhone you'd need a Unity + AR Foundation build instead.

## 🛠️ Tech stack (all free)

| Purpose | Tool |
|---------|------|
| 3D / rendering | [Three.js](https://threejs.org) |
| AR | [WebXR Device API](https://immersiveweb.dev/) (`hit-test` for floor detection) |
| Dev server / bundler | [Vite](https://vitejs.dev) |
| Hosting | [GitHub Pages](https://pages.github.com/) (HTTPS — required by WebXR) |

No app store, no developer account, no paid services.

## 💻 Run locally

```bash
npm install
npm run dev
```

WebXR needs a **secure context**. `localhost` qualifies even over HTTP, so test on
your phone via USB port forwarding:

```bash
adb reverse tcp:5173 tcp:5173   # then open http://localhost:5173 in phone Chrome
```

(Or use Chrome's `chrome://inspect` → Port forwarding.)

## 🚀 Deploy (GitHub Pages)

This repo auto-deploys via GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

**One-time setup:** Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions.**

After that, every push to `main` builds with Vite and publishes `dist/` to the live URL above.

> The Vite `base` is set to `/Ar-game/` for production builds (see [vite.config.js](vite.config.js)) so assets resolve under the repo subpath. If you fork/rename the repo, update that value.

## 🧩 Code map

| File | Responsibility |
|------|----------------|
| [src/main.js](src/main.js) | AR session, floor hit-test, portal, shooting, waves, particles, game loop |
| [src/enemies.js](src/enemies.js) | Enemy creatures, spawning, movement, HP scaling (`HP = 30 × wave`) |
| [src/hud.js](src/hud.js) | Start screen, HUD (health bar / coins / wave), banners, game over |
| [index.html](index.html) | DOM-overlay UI, styling, crosshair, fire button |

## ✅ Implemented

- Floor scanning + reticle
- Tap-to-place glowing portal (rings + particles)
- Enemy waves walking toward you, HP scaling per wave
- Tap / fire-button shooting, crits, floating damage numbers, hit & death particle bursts
- Health bar, coins, damage vignette, animated wave banners, game over + restart

## 🔜 Next steps

- Upgrade menu between waves (damage / fire rate / weapons)
- Real 3D enemy models (**Blender**, free assets from **Quaternius** / **Kenney.nl**)
- Sound effects (**Audacity**, **freesound.org**)
- Special events (Treasure Goblin, Boss Portal, Meteor)
- Meta progression saved to `localStorage`
- Screenshot-to-share

## 📜 License

MIT — free to use, learn from, and build on.
