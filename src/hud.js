// Drives every DOM element in the overlay + start screen (see index.html).
// Keeping all DOM access here keeps main.js focused on game logic.
export class Hud {
  constructor() {
    // start screen
    this.start = document.getElementById('start')
    this.enterBtn = document.getElementById('enter')
    this.startError = document.getElementById('start-error')

    // top hud
    this.hudTop = document.getElementById('hud-top')
    this.wave = document.getElementById('stat-wave')
    this.coins = document.getElementById('stat-coins')
    this.hpFill = document.getElementById('hp-fill')

    // hint / crosshair / fire
    this.hint = document.getElementById('hint')
    this.hintText = document.getElementById('hint-text')
    this.scanRing = document.getElementById('scan-ring')
    this.crosshair = document.getElementById('crosshair')
    this.fireBtn = document.getElementById('fire')

    // banners / feedback
    this.banner = document.getElementById('wave-banner')
    this.bannerN = document.getElementById('banner-n')
    this.vignette = document.getElementById('vignette')

    // game over
    this.gameover = document.getElementById('gameover')
    this.goWave = document.getElementById('go-wave')
    this.goCoins = document.getElementById('go-coins')
    this.restartBtn = document.getElementById('restart')

    this._coinShown = 0
  }

  onEnter(fn) { this.enterBtn.onclick = fn }
  onFire(fn) { this.fireBtn.onclick = fn }
  onRestart(fn) { this.restartBtn.onclick = fn }

  hideStartScreen() { this.start.style.display = 'none' }
  showStartScreen() { this.start.style.display = 'flex' }
  showStartError(msg) { this.startError.style.display = 'block'; this.startError.textContent = msg }

  // ---- scanning / placement hint ----
  scanning() {
    this.hint.style.display = 'flex'
    this.scanRing.style.display = 'block'
    this.scanRing.classList.remove('scan-tap')
    this.scanRing.textContent = ''
    this.hintText.textContent = 'Move your phone slowly to scan the floor…'
  }
  readyToPlace() {
    this.hint.style.display = 'flex'
    // swap the spinner for a tap icon
    this.scanRing.style.display = 'block'
    this.scanRing.className = 'scan-tap'
    this.scanRing.textContent = '👆'
    this.hintText.textContent = 'Floor found — tap it to open your portal'
  }
  hideHint() { this.hint.style.display = 'none' }

  // ---- enter live game ----
  startGame() {
    this.hideHint()
    this.hudTop.style.display = 'flex'
    this.crosshair.style.display = 'block'
    this.fireBtn.style.display = 'block'
    this.gameover.style.display = 'none'
  }

  // ---- live stats ----
  update({ wave, coins, hp, maxHp }) {
    this.wave.textContent = wave
    this.coins.textContent = coins
    this._coinShown = coins
    const pct = Math.max(0, Math.min(1, hp / maxHp))
    this.hpFill.style.width = (pct * 100) + '%'
    // green → amber → red as health drops
    const hue = Math.round(120 * pct)
    this.hpFill.style.background = `linear-gradient(90deg, hsl(${hue},80%,45%), hsl(${hue},85%,62%))`
  }

  // ---- targeting feedback ----
  setLock(on) { this.crosshair.classList.toggle('lock', on) }

  // ---- wave banner ----
  showWaveBanner(n) {
    this.bannerN.textContent = `Wave ${n}`
    this.banner.classList.remove('show')
    void this.banner.offsetWidth // restart the CSS animation
    this.banner.classList.add('show')
  }

  // ---- player hit feedback ----
  flashDamage() {
    this.vignette.classList.remove('hit')
    void this.vignette.offsetWidth
    this.vignette.classList.add('hit')
  }

  // ---- game over ----
  showGameOver(wave, coins) {
    this.goWave.textContent = wave
    this.goCoins.textContent = coins
    this.gameover.style.display = 'flex'
    this.crosshair.style.display = 'none'
    this.fireBtn.style.display = 'none'
  }
  hideGameOver() {
    this.gameover.style.display = 'none'
    this.crosshair.style.display = 'block'
    this.fireBtn.style.display = 'block'
  }
}
