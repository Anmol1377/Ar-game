import * as THREE from 'three'
import { Hud } from './hud.js'
import { EnemyManager } from './enemies.js'

// ---------------------------------------------------------------------------
// State machine: SCANNING → PLACE → PLAYING → OVER
// ---------------------------------------------------------------------------
const State = { SCANNING: 'SCANNING', PLACE: 'PLACE', PLAYING: 'PLAYING', OVER: 'OVER' }

const hud = new Hud()
const clock = new THREE.Clock()

const player = { hp: 100, maxHp: 100, coins: 0, damage: 10, critChance: 0.2, critMult: 2.5 }
let state = State.SCANNING
let wave = 1

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 40)

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(devicePixelRatio)
renderer.setSize(innerWidth, innerHeight)
renderer.xr.enabled = true
document.body.appendChild(renderer.domElement)

scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.1))
const dir = new THREE.DirectionalLight(0xffffff, 1.0)
dir.position.set(0.5, 2, 0.5)
scene.add(dir)

// Reticle that snaps to detected surfaces while scanning.
const reticle = new THREE.Group()
{
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.085, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x5ad0ff, transparent: true, opacity: 0.95 })
  )
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.012, 16).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x5ad0ff })
  )
  reticle.add(ring, dot)
}
reticle.matrixAutoUpdate = false
reticle.visible = false
scene.add(reticle)

// ---------------------------------------------------------------------------
// Portal — layered glowing rings + a soft glow sprite + rising spark particles
// ---------------------------------------------------------------------------
let portal = null
let portalSparks = null

function makeGlowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(140,220,255,1)')
  g.addColorStop(0.4, 'rgba(80,150,255,0.5)')
  g.addColorStop(1, 'rgba(40,80,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}
const glowTex = makeGlowTexture()

function buildPortal(pos) {
  const group = new THREE.Group()
  group.position.copy(pos)

  const ringMat = new THREE.MeshStandardMaterial({ color: 0x2b6cff, emissive: 0x4aa0ff, emissiveIntensity: 1.4 })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 16, 60).rotateX(-Math.PI / 2), ringMat)
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.01, 16, 50).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x9fe0ff, emissive: 0x9fe0ff, emissiveIntensity: 1.6 }))
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.175, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x0a1a55, transparent: true, opacity: 0.5, side: THREE.DoubleSide }))
  disc.position.y = 0.001

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x6ab8ff, transparent: true, opacity: 0.9, depthWrite: false }))
  glow.scale.set(0.7, 0.7, 1); glow.position.y = 0.12

  group.add(ring, ring2, disc, glow)
  group.userData = { ring, ring2 }

  // Rising spark particles
  const N = 40
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(N * 3)
  const seeds = new Float32Array(N)
  for (let i = 0; i < N; i++) { seeds[i] = Math.abs(Math.sin(i * 12.9898) * 43758.5) % 1; positions[i * 3 + 1] = seeds[i] * 0.3 }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  portalSparks = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9fe0ff, size: 0.012, transparent: true, opacity: 0.85, depthWrite: false }))
  portalSparks.userData.seeds = seeds
  group.add(portalSparks)

  return group
}

const enemies = new EnemyManager(scene)

// ---------------------------------------------------------------------------
// Particle bursts (hit sparks + death explosions) — shared simple pool
// ---------------------------------------------------------------------------
const bursts = []
function spawnBurst(pos, color, count, spread, life) {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const vel = []
  for (let i = 0; i < count; i++) {
    positions[i * 3] = pos.x; positions[i * 3 + 1] = pos.y; positions[i * 3 + 2] = pos.z
    const a = (i / count) * Math.PI * 2, e = (Math.sin(i * 7.1) * 0.5 + 0.5)
    vel.push(new THREE.Vector3(Math.cos(a) * spread, e * spread, Math.sin(a) * spread))
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.02, transparent: true, depthWrite: false }))
  pts.userData = { vel, life, maxLife: life }
  scene.add(pts)
  bursts.push(pts)
}
function updateBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const p = bursts[i]; p.userData.life -= dt
    const pos = p.geometry.attributes.position
    for (let j = 0; j < p.userData.vel.length; j++) {
      const v = p.userData.vel[j]
      pos.array[j * 3] += v.x * dt; pos.array[j * 3 + 1] += (v.y - 0.6 * (p.userData.maxLife - p.userData.life)) * dt; pos.array[j * 3 + 2] += v.z * dt
    }
    pos.needsUpdate = true
    p.material.opacity = Math.max(0, p.userData.life / p.userData.maxLife)
    if (p.userData.life <= 0) { scene.remove(p); bursts.splice(i, 1) }
  }
}

// ---------------------------------------------------------------------------
// Floating damage numbers (canvas sprite that drifts up + fades)
// ---------------------------------------------------------------------------
const dmgSprites = []
function spawnDamageNumber(text, color, position) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128
  const ctx = c.getContext('2d')
  ctx.font = 'bold 76px system-ui, sans-serif'; ctx.fillStyle = color
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.55)'
  ctx.strokeText(text, 128, 64); ctx.fillText(text, 128, 64)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false }))
  s.scale.set(0.18, 0.09, 1); s.position.copy(position); s.position.y += 0.14
  s.userData.life = 0.9; scene.add(s); dmgSprites.push(s)
}
function updateDamageNumbers(dt) {
  for (let i = dmgSprites.length - 1; i >= 0; i--) {
    const s = dmgSprites[i]; s.userData.life -= dt; s.position.y += dt * 0.2
    s.material.opacity = Math.max(0, s.userData.life / 0.9)
    if (s.userData.life <= 0) { scene.remove(s); dmgSprites.splice(i, 1) }
  }
}

// ---------------------------------------------------------------------------
// WebXR hit-test (floor detection)
// ---------------------------------------------------------------------------
let hitTestSource = null
let hitTestRequested = false
function requestHitTestSource(session) {
  session.requestReferenceSpace('viewer').then((refSpace) => {
    session.requestHitTestSource({ space: refSpace }).then((s) => { hitTestSource = s })
  })
  session.addEventListener('end', onSessionEnd)
  hitTestRequested = true
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster()
const fireDir = new THREE.Vector3(), fireOrigin = new THREE.Vector3()
const playerPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion()

// XR "select" = a tap anywhere on the screen.
const controller = renderer.xr.getController(0)
controller.addEventListener('select', () => {
  if (state === State.PLACE && reticle.visible) placePortal()
  else if (state === State.PLAYING) fire()
})
scene.add(controller)

// Dedicated fire button also fires (state guard prevents double-fire issues).
hud.onFire(() => { if (state === State.PLAYING) fire() })

function placePortal() {
  const pos = new THREE.Vector3().setFromMatrixPosition(reticle.matrix)
  portal = buildPortal(pos)
  scene.add(portal)
  reticle.visible = false
  enemies.setPortal(pos)
  spawnBurst(pos, 0x6ab8ff, 60, 0.5, 0.7) // portal-open puff
  state = State.PLAYING
  hud.startGame()
  startWave(1)
}

function fire() {
  const xrCam = renderer.xr.getCamera()
  xrCam.getWorldPosition(fireOrigin)
  xrCam.getWorldQuaternion(tmpQuat)
  fireDir.set(0, 0, -1).applyQuaternion(tmpQuat).normalize()
  raycaster.set(fireOrigin, fireDir)

  const enemy = enemies.raycast(raycaster)
  if (!enemy) return

  const crit = Math.random() < player.critChance
  const dmg = Math.round(player.damage * (crit ? player.critMult : 1))
  const killed = enemies.damage(enemy, dmg)
  spawnDamageNumber(crit ? `CRIT ${dmg}!` : `-${dmg}`, crit ? '#ffd23f' : '#ffffff', enemy.mesh.position)
  spawnBurst(enemy.mesh.position, crit ? 0xffd23f : 0xffffff, 10, 0.25, 0.3)

  if (killed) {
    spawnBurst(enemy.mesh.position, enemy.archetype.color, 24, 0.6, 0.6) // death burst
    player.coins += 5 * wave
    refreshHud()
  }
}

// ---------------------------------------------------------------------------
// Waves
// ---------------------------------------------------------------------------
function startWave(n) {
  wave = n
  enemies.startWave(n)
  hud.showWaveBanner(n)
  refreshHud()
}
function refreshHud() {
  hud.update({ wave, coins: player.coins, hp: player.hp, maxHp: player.maxHp })
}
function onEnemyReachPlayer() {
  player.hp -= 10
  hud.flashDamage()
  refreshHud()
  if (player.hp <= 0) { player.hp = 0; gameOver() }
}
function gameOver() {
  state = State.OVER
  hud.showGameOver(wave, player.coins)
}
hud.onRestart(() => {
  player.hp = player.maxHp; player.coins = 0; wave = 1
  enemies.reset(); hud.hideGameOver()
  state = State.PLAYING; startWave(1)
})

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
function render(timestamp, frame) {
  const dt = Math.min(0.05, clock.getDelta())

  if (frame) {
    const session = renderer.xr.getSession()
    if (!hitTestRequested) requestHitTestSource(session)

    if (hitTestSource && (state === State.SCANNING || state === State.PLACE)) {
      const refSpace = renderer.xr.getReferenceSpace()
      const results = frame.getHitTestResults(hitTestSource)
      if (results.length) {
        reticle.visible = true
        reticle.matrix.fromArray(results[0].getPose(refSpace).transform.matrix)
        if (state === State.SCANNING) { state = State.PLACE; hud.readyToPlace() }
      } else {
        reticle.visible = false
      }
    }
  }

  // Animate portal
  if (portal) {
    portal.userData.ring.rotation.z += dt * 1.4
    portal.userData.ring2.rotation.z -= dt * 2.2
    if (portalSparks) {
      const pos = portalSparks.geometry.attributes.position, seeds = portalSparks.userData.seeds
      for (let i = 0; i < seeds.length; i++) {
        pos.array[i * 3 + 1] += dt * (0.1 + seeds[i] * 0.12)
        if (pos.array[i * 3 + 1] > 0.32) {
          pos.array[i * 3 + 1] = 0
          const a = seeds[i] * Math.PI * 2, r = 0.02 + seeds[i] * 0.13
          pos.array[i * 3] = Math.cos(a) * r; pos.array[i * 3 + 2] = Math.sin(a) * r
        }
      }
      pos.needsUpdate = true
    }
  }

  if (state === State.PLAYING) {
    renderer.xr.getCamera().getWorldPosition(playerPos)
    enemies.update(dt, playerPos, onEnemyReachPlayer)

    // Targeting feedback: light the crosshair when aimed at an enemy.
    const xrCam = renderer.xr.getCamera()
    xrCam.getWorldQuaternion(tmpQuat)
    fireDir.set(0, 0, -1).applyQuaternion(tmpQuat).normalize()
    raycaster.set(playerPos, fireDir)
    hud.setLock(!!enemies.raycast(raycaster))

    if (enemies.waveCleared) { player.coins += 20 * wave; startWave(wave + 1) }
  }

  updateBursts(dt)
  updateDamageNumbers(dt)
  renderer.render(scene, camera)
}
renderer.setAnimationLoop(render)

// ---------------------------------------------------------------------------
// AR session start/stop (custom — replaces the default ARButton)
// ---------------------------------------------------------------------------
// Check support once at load so we can warn early — WITHOUT consuming the tap
// gesture that requestSession() needs later.
async function checkSupport() {
  if (!navigator.xr) {
    return hud.showStartError('WebXR not available. Use Chrome on Android with ARCore installed. (iOS Safari is not supported.)')
  }
  let supported = false
  try { supported = await navigator.xr.isSessionSupported('immersive-ar') } catch {}
  if (!supported) {
    hud.showStartError('AR session not supported here. Open in Chrome on Android with Google Play Services for AR (ARCore).')
  }
}
checkSupport()

// IMPORTANT: requestSession() must run inside the tap gesture with NO await
// before it, or Chrome rejects it ("must be called from a user gesture").
function enterAR() {
  if (!navigator.xr) {
    return hud.showStartError('WebXR not available on this browser.')
  }
  navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay', 'local-floor'],
    domOverlay: { root: document.getElementById('overlay') },
  }).then(async (session) => {
    renderer.xr.setReferenceSpaceType('local')
    await renderer.xr.setSession(session)
    hud.hideStartScreen()
    hud.scanning()
    state = State.SCANNING
  }).catch((e) => {
    hud.showStartError('Could not start AR: ' + (e.message || e))
  })
}

function onSessionEnd() {
  hitTestRequested = false
  hitTestSource = null
  hud.showStartScreen()
}

hud.onEnter(enterAR)

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
