import * as THREE from 'three'

// A few simple "archetypes" built from primitive geometry so we need zero
// external art assets. Swap these for real glTF models later (Blender/Quaternius).
const ARCHETYPES = [
  { name: 'Slime',     color: 0x55dd66, size: 0.10, speed: 0.18 },
  { name: 'Robot bug', color: 0x8899aa, size: 0.11, speed: 0.22 },
  { name: 'Fast zombie', color: 0x99cc44, size: 0.10, speed: 0.34 },
  { name: 'Drone',     color: 0x44aaff, size: 0.09, speed: 0.40 },
]

class Enemy {
  constructor(archetype, wave) {
    this.archetype = archetype
    this.maxHp = 30 * wave            // Enemy HP = Base HP × Wave Number
    this.hp = this.maxHp
    this.speed = archetype.speed
    this.alive = true

    // Body: a rounded blob with two glowing eyes. Cheap but reads as a creature.
    this.mesh = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.IcosahedronGeometry(archetype.size, 1),
      new THREE.MeshStandardMaterial({
        color: archetype.color, emissive: archetype.color,
        emissiveIntensity: 0.25, roughness: 0.6, flatShading: true
      })
    )
    body.castShadow = true
    this.body = body
    this.mesh.add(body)

    const eyeGeo = new THREE.SphereGeometry(archetype.size * 0.18, 8, 8)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 })
    const e1 = new THREE.Mesh(eyeGeo, eyeMat)
    const e2 = new THREE.Mesh(eyeGeo, eyeMat)
    const s = archetype.size
    e1.position.set(-s * 0.35, s * 0.15, s * 0.8)
    e2.position.set(s * 0.35, s * 0.15, s * 0.8)
    this.mesh.add(e1, e2)

    // Used to detect taps; raycaster hits this larger invisible sphere so the
    // creature is easy to tap on a phone screen.
    this.hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(archetype.size * 1.6, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    )
    this.hitSphere.userData.enemy = this
    this.mesh.add(this.hitSphere)
  }

  flashHit() {
    this.body.material.emissiveIntensity = 1.2
  }
}

export class EnemyManager {
  constructor(scene) {
    this.scene = scene
    this.enemies = []
    this.portalPos = new THREE.Vector3()
    this.toSpawn = 0
    this.spawnTimer = 0
    this.spawnInterval = 1.6 // seconds between spawns
    this.wave = 1
  }

  setPortal(pos) { this.portalPos.copy(pos) }

  // Begin a wave: queue up a number of enemies that grows each wave.
  startWave(wave) {
    this.wave = wave
    this.toSpawn = 3 + wave            // wave 1 = 4 enemies, scales up
    this.spawnTimer = 0
    this.spawnInterval = Math.max(0.6, 1.6 - wave * 0.06)
  }

  // True when the queue is empty and nothing is left on the field.
  get waveCleared() {
    return this.toSpawn === 0 && this.enemies.length === 0
  }

  spawnOne() {
    // Harder archetypes unlock as waves progress.
    const maxIdx = Math.min(ARCHETYPES.length - 1, Math.floor(this.wave / 3))
    const idx = Math.floor((this.wave * 7 + this.enemies.length * 3) % (maxIdx + 1))
    const enemy = new Enemy(ARCHETYPES[idx], this.wave)

    // Spawn just above the portal, slightly randomised around its ring.
    const angle = (this.enemies.length * 1.7) % (Math.PI * 2)
    const r = 0.08
    enemy.mesh.position.set(
      this.portalPos.x + Math.cos(angle) * r,
      this.portalPos.y + 0.1,
      this.portalPos.z + Math.sin(angle) * r
    )
    this.scene.add(enemy.mesh)
    this.enemies.push(enemy)
  }

  // dt = seconds since last frame, playerPos = camera world position.
  // onReachPlayer(enemy) fires when an enemy touches the player.
  update(dt, playerPos, onReachPlayer) {
    // Drip-feed the queued enemies out of the portal.
    if (this.toSpawn > 0) {
      this.spawnTimer -= dt
      if (this.spawnTimer <= 0) {
        this.spawnOne()
        this.toSpawn--
        this.spawnTimer = this.spawnInterval
      }
    }

    const tmp = new THREE.Vector3()
    for (const e of this.enemies) {
      // Cool the hit-flash back down each frame.
      e.body.material.emissiveIntensity += (0.25 - e.body.material.emissiveIntensity) * Math.min(1, dt * 6)

      // Move along the floor toward the player (ignore vertical difference).
      tmp.set(playerPos.x - e.mesh.position.x, 0, playerPos.z - e.mesh.position.z)
      const dist = tmp.length()
      if (dist > 0.0001) {
        tmp.normalize()
        e.mesh.position.addScaledVector(tmp, e.speed * dt)
        e.mesh.lookAt(playerPos.x, e.mesh.position.y, playerPos.z)
      }
      // Little hover bob.
      e.body.position.y = Math.sin((performance.now() / 300) + e.mesh.id) * 0.01

      if (dist < 0.35) {            // reached the player
        e.alive = false
        onReachPlayer(e)
      }
    }

    this.cleanupDead()
  }

  // Returns the nearest enemy hit by the ray, or null.
  raycast(raycaster) {
    const meshes = this.enemies.map(e => e.hitSphere)
    const hits = raycaster.intersectObjects(meshes, false)
    return hits.length ? hits[0].object.userData.enemy : null
  }

  // Apply damage; returns true if this killed the enemy.
  damage(enemy, amount) {
    enemy.hp -= amount
    enemy.flashHit()
    if (enemy.hp <= 0) {
      enemy.alive = false
      return true
    }
    return false
  }

  cleanupDead() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      if (!e.alive) {
        this.scene.remove(e.mesh)
        this.enemies.splice(i, 1)
      }
    }
  }

  reset() {
    for (const e of this.enemies) this.scene.remove(e.mesh)
    this.enemies = []
    this.toSpawn = 0
    this.spawnTimer = 0
  }
}
