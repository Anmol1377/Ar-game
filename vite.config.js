import { defineConfig } from 'vite'

// WebXR requires a "secure context". `localhost` always qualifies — even over
// plain HTTP — so when the phone reaches the server through port forwarding
// (adb reverse / Chrome chrome://inspect) at http://localhost:5173, WebXR works
// with no certificate prompts.
//
// (If you ever want to test over WiFi by IP instead, you'd need HTTPS again:
//  re-add `@vitejs/plugin-basic-ssl` and put `basicSsl()` in `plugins`.)
export default defineConfig(({ command }) => ({
  // On GitHub Pages the site lives at https://<user>.github.io/Ar-game/, so
  // built asset URLs must be prefixed with the repo name. In dev we keep "/"
  // so http://localhost:5173 (port forwarding) still works at the root.
  base: command === 'build' ? '/Ar-game/' : '/',
  server: {
    host: true, // also expose on the LAN, harmless alongside port forwarding
    port: 5173,
    strictPort: true // fail instead of silently picking another port
  }
}))
