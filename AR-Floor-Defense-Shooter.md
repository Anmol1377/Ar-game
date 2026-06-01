# AR Floor Defense Shooter

> One of the best beginner-friendly AR game ideas — it feels *magic* the first time users see enemies walking on their own floor.

---

## Core Gameplay

1. User opens app.
2. Camera starts scanning the room.
3. AR detects the floor.
4. User taps the floor to place a battlefield.
5. A portal appears.
6. Enemies spawn from the portal.
7. User taps enemies to shoot.
8. Earn coins.
9. Buy upgrades.
10. Survive longer waves.

---

## Game Flow

### Phase 1: Scan Environment

- Camera opens.
- Show message:

  > Move your phone slowly to detect surfaces.

- AR Foundation scans the floor.

**Visual:**
- 🟦 Grid appears on the detected floor.

### Phase 2: Place Battlefield

- User taps the floor.
- A glowing portal appears.

**Visual Effects:**
- Blue energy ring
- Smoke particles
- Portal sound

The portal becomes the enemy spawn point.

### Phase 3: Enemy Waves

Every few seconds an enemy emerges from the portal.

| Wave | Enemies |
|------|---------|
| Wave 1 | Slime, Robot bug |
| Wave 5 | Fast zombie, Drone |
| Wave 10 | Giant boss |

Enemies physically walk across your floor toward the player. This creates immersion because they seem to exist in your room.

### Phase 4: Shooting

**Simplest version:**
- Tap enemy.
- Enemy takes damage.
- Damage numbers appear:
  - `-10`
  - `-20`
  - `CRITICAL!`

**More advanced:**
- Crosshair in center.
- Player aims phone.
- Press fire button.
- *Like Pokémon Go meets COD.*

---

## Upgrade System

After every wave, the player earns **Coins** and **Gems**.

**Upgrade menu:**

- **Weapons**
  - Pistol
  - Shotgun
  - Laser Gun
  - Plasma Cannon
- **Stats**
  - Damage
  - Fire Rate
  - Critical Chance
- **Skills**
  - Freeze enemies
  - Lightning strike
  - Air strike

---

## Endless Progression

The game never ends.

**Formula:**

```
Enemy HP = Base HP × Wave Number
```

**Example:**

| Wave | Enemy HP |
|------|----------|
| Wave 1 | 100 HP |
| Wave 10 | 1,000 HP |
| Wave 100 | 10,000 HP |

Infinite scaling.

---

## Special Events

Triggered randomly to keep sessions exciting:

- **Treasure Goblin** — Appears for 10 seconds, drops lots of coins.
- **Golden Enemy** — 100× reward.
- **Boss Portal** — A massive enemy emerges.
- **Meteor Event** — Enemies fall from the sky.

---

## Meta Progression

Permanent account upgrades:

- Damage +1%
- Coin Gain +2%
- Faster Reload
- Better Loot

Even if the player dies, progress remains. This is what keeps people returning daily.

---

## Viral Features

### Room Screenshot

After a wave, take a photo showing:

```
Wave 57
Killed 1,204 Enemies
```

Share to Instagram.

### Giant Boss Mode

Imagine a 30-foot robot standing in someone's bedroom. People record and share these moments.

### Real Room Invasion

Enemies spawn:
- Under the desk
- Near the sofa
- Behind the chair

AR feels much more realistic.

---

## Monetization

Without becoming annoying:

- Rewarded ads for extra coins
- Battle Pass
- Weapon skins
- Portal skins
- Enemy skins

**No forced ads.**

---

## Tech Stack

| Area | Choice |
|------|--------|
| Engine | Unity |
| AR | AR Foundation |
| Android | Google ARCore |

**References:**
- [Unity](https://unity.com/)
- [AR Foundation Documentation](https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@latest)
- [Google ARCore](https://developers.google.com/ar)
