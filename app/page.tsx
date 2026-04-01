'use client'

import { useEffect, useRef, useCallback } from 'react'

const W = 800, H = 520
const GUN_X = W / 2, GUN_Y = H - 30
const MAX_HEALTH = 5
const BASE_SPAWN = 110

interface Spider {
  id: number
  x: number; y: number
  size: number
  vx: number; vy: number
  legPhase: number
  alive: boolean
  deathTimer: number
}

interface Droplet {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
}

interface Shot {
  id: number
  x: number; y: number
  vx: number; vy: number
  trail: { x: number; y: number }[]
  splash: Droplet[]
  active: boolean
  hit: boolean
}

interface State {
  phase: 'menu' | 'playing' | 'dead'
  spiders: Spider[]
  shots: Shot[]
  score: number
  health: number
  mx: number; my: number
  spawnTimer: number
  wave: number
  killed: number
  nextId: number
  frame: number
}

function bg(ctx: CanvasRenderingContext2D) {
  // Ceiling
  const cg = ctx.createLinearGradient(0, 0, 0, H * 0.4)
  cg.addColorStop(0, '#08080f')
  cg.addColorStop(1, '#141420')
  ctx.fillStyle = cg
  ctx.fillRect(0, 0, W, H * 0.4)

  // Wall
  const wg = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.65)
  wg.addColorStop(0, '#251c14')
  wg.addColorStop(0.5, '#3a2a1a')
  wg.addColorStop(1, '#1e1508')
  ctx.fillStyle = wg
  ctx.fillRect(0, H * 0.3, W, H * 0.35)

  // Brick lines
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1
  const brickH = H * 0.065
  for (let row = 0; row < 6; row++) {
    const by = H * 0.3 + row * brickH
    const offset = row % 2 === 0 ? 0 : 55
    for (let x = -55 + offset; x < W; x += 110) {
      ctx.strokeRect(x + 1, by + 1, 108, brickH - 2)
    }
  }

  // Floor
  const fg = ctx.createLinearGradient(0, H * 0.65, 0, H)
  fg.addColorStop(0, '#100c04')
  fg.addColorStop(1, '#060402')
  ctx.fillStyle = fg
  ctx.fillRect(0, H * 0.65, W, H * 0.35)

  // Floor perspective
  ctx.strokeStyle = 'rgba(80,60,20,0.2)'
  ctx.lineWidth = 0.8
  for (let i = 0; i <= 9; i++) {
    ctx.beginPath()
    ctx.moveTo(W / 2, H * 0.65)
    ctx.lineTo((i / 9) * W, H)
    ctx.stroke()
  }
  for (let i = 1; i < 4; i++) {
    const y = H * 0.65 + (i / 4) * H * 0.35
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
}

function spider(ctx: CanvasRenderingContext2D, sp: Spider) {
  const { x, y, size, legPhase, alive, deathTimer } = sp
  if (!alive && deathTimer <= 0) return
  const a = alive ? 1 : deathTimer / 30
  ctx.save()
  ctx.globalAlpha = a

  const ll = size * 1.6
  ctx.strokeStyle = '#100500'
  ctx.lineWidth = Math.max(0.8, size * 0.09)
  ctx.lineCap = 'round'

  for (let i = 0; i < 4; i++) {
    const wave = Math.sin(legPhase + i * 0.9) * 0.18
    const baseA = (0.25 + i * 0.18) * Math.PI

    // left
    const la = Math.PI + baseA + wave
    const lkx = x + Math.cos(la) * ll * 0.5
    const lky = y + Math.sin(la) * ll * 0.5 + Math.abs(Math.sin(legPhase + i)) * size * 0.3
    ctx.beginPath(); ctx.moveTo(x, y)
    ctx.quadraticCurveTo(lkx, lky, x + Math.cos(la) * ll, y + Math.sin(la) * ll); ctx.stroke()

    // right
    const ra = -baseA - wave
    const rkx = x + Math.cos(ra) * ll * 0.5
    const rky = y + Math.sin(ra) * ll * 0.5 + Math.abs(Math.sin(legPhase + i)) * size * 0.3
    ctx.beginPath(); ctx.moveTo(x, y)
    ctx.quadraticCurveTo(rkx, rky, x + Math.cos(ra) * ll, y + Math.sin(ra) * ll); ctx.stroke()
  }

  // Abdomen
  ctx.fillStyle = '#1e0800'
  ctx.beginPath(); ctx.ellipse(x, y + size * 0.4, size * 0.52, size * 0.65, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#140400'
  ctx.beginPath(); ctx.ellipse(x, y + size * 0.35, size * 0.18, size * 0.38, 0, 0, Math.PI * 2); ctx.fill()

  // Head
  ctx.fillStyle = '#2e1200'
  ctx.beginPath(); ctx.ellipse(x, y - size * 0.1, size * 0.46, size * 0.42, 0, 0, Math.PI * 2); ctx.fill()

  // Eyes
  const er = Math.max(1.5, size * 0.1)
  ;[[-0.22, -0.18], [0.22, -0.18], [-0.1, -0.28], [0.1, -0.28], [-0.32, -0.08], [0.32, -0.08]].forEach(([ex, ey]) => {
    ctx.fillStyle = '#ee1100'
    ctx.beginPath(); ctx.arc(x + ex * size, y + ey * size, er, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ff8844'
    ctx.beginPath(); ctx.arc(x + ex * size - er * 0.3, y + ey * size - er * 0.3, er * 0.35, 0, Math.PI * 2); ctx.fill()
  })

  ctx.restore()
}

function gun(ctx: CanvasRenderingContext2D, mx: number, my: number) {
  const angle = Math.atan2(my - GUN_Y, mx - GUN_X)

  // Hand
  ctx.save()
  ctx.translate(GUN_X, GUN_Y + 5)
  ctx.fillStyle = '#c8845a'
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 20, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(GUN_X, GUN_Y)
  ctx.rotate(angle)

  // Tank (translucent blue)
  ctx.fillStyle = 'rgba(100,180,255,0.25)'
  ctx.strokeStyle = '#4a9fd4'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(-32, -14, 26, 28, 5); ctx.fill(); ctx.stroke()
  // Water level
  ctx.fillStyle = 'rgba(80,160,255,0.55)'
  ctx.beginPath(); ctx.roundRect(-31, -5, 24, 18, 3); ctx.fill()

  // Body
  ctx.fillStyle = '#2a78c4'
  ctx.beginPath(); ctx.roundRect(-8, -9, 72, 18, 4); ctx.fill()
  ctx.fillStyle = '#1a5fa0'
  ctx.beginPath(); ctx.roundRect(-8, 2, 72, 7, [0,0,4,4]); ctx.fill()

  // Nozzle
  ctx.fillStyle = '#1560a8'
  ctx.beginPath(); ctx.roundRect(62, -4, 22, 8, 2); ctx.fill()
  ctx.fillStyle = '#3ecf8e'
  ctx.beginPath(); ctx.arc(85, 0, 4, 0, Math.PI * 2); ctx.fill()

  // Trigger guard
  ctx.strokeStyle = '#1a5fa0'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(18, 14, 10, 0, Math.PI); ctx.stroke()
  ctx.fillStyle = '#555'
  ctx.beginPath(); ctx.roundRect(14, 7, 7, 14, 2); ctx.fill()

  ctx.restore()
}

function crosshair(ctx: CanvasRenderingContext2D, mx: number, my: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'
  ctx.lineWidth = 1.5
  ctx.shadowColor = 'rgba(62,207,142,0.6)'
  ctx.shadowBlur = 4
  const g = 5, l = 12
  ;[[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(mx + dx * g, my + dy * g)
    ctx.lineTo(mx + dx * (g + l), my + dy * (g + l))
    ctx.stroke()
  })
  ctx.beginPath(); ctx.arc(mx, my, 3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(62,207,142,0.9)'; ctx.fill()
  ctx.restore()
}

function hud(ctx: CanvasRenderingContext2D, score: number, health: number, wave: number) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.beginPath(); ctx.roundRect(10, 10, 130, 38, 4); ctx.fill()
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'; ctx.textBaseline = 'middle'
  ctx.fillText(`SCORE  ${score}`, 20, 29)

  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.beginPath(); ctx.roundRect(W - 145, 10, 135, 38, 4); ctx.fill()
  ctx.textAlign = 'center'
  const hearts = '❤️'.repeat(health) + '🖤'.repeat(MAX_HEALTH - health)
  ctx.font = '15px system-ui'; ctx.fillStyle = '#fff'
  ctx.fillText(hearts, W - 77, 29)

  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.beginPath(); ctx.roundRect(W / 2 - 55, 10, 110, 38, 4); ctx.fill()
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px monospace'
  ctx.fillText(`WAVE  ${wave}`, W / 2, 29)

  ctx.restore()
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const G = useRef<State>({
    phase: 'menu', spiders: [], shots: [], score: 0, health: MAX_HEALTH,
    mx: W / 2, my: H / 2, spawnTimer: 60, wave: 1, killed: 0, nextId: 0, frame: 0,
  })
  const rafRef = useRef<number>(0)

  const startGame = useCallback(() => {
    const s = G.current
    Object.assign(s, {
      phase: 'playing', spiders: [], shots: [], score: 0, health: MAX_HEALTH,
      spawnTimer: 60, wave: 1, killed: 0, nextId: 0, frame: 0,
    })
  }, [])

  const fireShot = useCallback((tx: number, ty: number) => {
    const s = G.current
    if (s.phase !== 'playing') return
    const dx = tx - GUN_X, dy = ty - GUN_Y
    const d = Math.hypot(dx, dy)
    const spd = 14
    s.shots.push({
      id: s.nextId++,
      x: GUN_X, y: GUN_Y,
      vx: (dx / d) * spd, vy: (dy / d) * spd,
      trail: [], splash: [], active: true, hit: false,
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const spawnSpider = (s: State) => {
      const x = 60 + Math.random() * (W - 120)
      const y = H * 0.34 + Math.random() * H * 0.26
      const sz = 18 + Math.random() * 28
      const spd = (0.35 + Math.random() * 0.45) * (1 + s.wave * 0.12)
      const dx = W / 2 - x + (Math.random() - 0.5) * 80
      const dy = H * 0.52 - y + (Math.random() - 0.5) * 40
      const d = Math.hypot(dx, dy)
      s.spiders.push({
        id: s.nextId++, x, y, size: sz,
        vx: (dx / d) * spd, vy: (dy / d) * spd,
        legPhase: Math.random() * Math.PI * 2,
        alive: true, deathTimer: 0,
      })
    }

    const loop = () => {
      const s = G.current
      s.frame++
      ctx.clearRect(0, 0, W, H)
      bg(ctx)

      if (s.phase === 'menu') {
        ctx.fillStyle = 'rgba(0,0,0,0.62)'
        ctx.fillRect(0, 0, W, H)
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.font = 'bold 46px system-ui'; ctx.fillStyle = '#3ecf8e'
        ctx.shadowColor = '#3ecf8e'; ctx.shadowBlur = 20
        ctx.fillText('SPIDER SQUIRTER', W / 2, H / 2 - 70)
        ctx.shadowBlur = 0
        ctx.font = '18px system-ui'; ctx.fillStyle = '#bbb'
        ctx.fillText('Shoot the spiders before they reach you!', W / 2, H / 2 - 15)
        ctx.font = 'bold 22px system-ui'; ctx.fillStyle = '#fff'
        ctx.fillText('Click to Start', W / 2, H / 2 + 40)
        ctx.font = '13px system-ui'; ctx.fillStyle = '#555'
        ctx.fillText('Move mouse to aim  ·  Click to shoot', W / 2, H / 2 + 82)

      } else if (s.phase === 'playing') {
        // Spawn
        s.spawnTimer--
        if (s.spawnTimer <= 0) {
          spawnSpider(s)
          s.spawnTimer = Math.max(35, BASE_SPAWN - s.wave * 8)
        }

        // Update spiders
        s.spiders.forEach(sp => {
          if (!sp.alive) { sp.deathTimer--; return }
          sp.x += sp.vx; sp.y += sp.vy; sp.legPhase += 0.14
          if (Math.hypot(sp.x - W / 2, sp.y - H * 0.52) < sp.size + 15) {
            sp.alive = false; sp.deathTimer = 1
            if (--s.health <= 0) s.phase = 'dead'
          }
        })
        s.spiders = s.spiders.filter(sp => sp.alive || sp.deathTimer > 0)

        // Update shots
        s.shots.forEach(sh => {
          sh.trail.push({ x: sh.x, y: sh.y })
          if (sh.trail.length > 12) sh.trail.shift()
          sh.x += sh.vx; sh.y += sh.vy; sh.vy += 0.18

          // Hit check
          if (!sh.hit) {
            s.spiders.forEach(sp => {
              if (!sp.alive || sh.hit) return
              if (Math.hypot(sh.x - sp.x, sh.y - sp.y) < sp.size * 0.95) {
                sh.hit = true
                sp.alive = false; sp.deathTimer = 28
                s.score += Math.round(20 + sp.size)
                if (++s.killed % 8 === 0) s.wave++
                for (let i = 0; i < 12; i++) {
                  const a = (i / 12) * Math.PI * 2
                  sh.splash.push({ x: sp.x, y: sp.y, vx: Math.cos(a) * (2 + Math.random() * 3), vy: Math.sin(a) * (2 + Math.random() * 3) - 1, life: 22, maxLife: 22 })
                }
              }
            })
          }

          sh.splash.forEach(d => { d.x += d.vx; d.y += d.vy; d.vy += 0.15; d.life-- })
          sh.splash = sh.splash.filter(d => d.life > 0)

          if ((sh.x < 0 || sh.x > W || sh.y > H || sh.y < -50) && sh.splash.length === 0) sh.active = false
          if (sh.hit && sh.splash.length === 0) sh.active = false
        })
        s.shots = s.shots.filter(sh => sh.active)

        // Draw spiders
        ;[...s.spiders].sort((a, b) => a.size - b.size).forEach(sp => spider(ctx, sp))

        // Draw shots
        s.shots.forEach(sh => {
          // Trail
          sh.trail.forEach((p, i) => {
            const a = (i / sh.trail.length) * 0.7
            ctx.beginPath(); ctx.arc(p.x, p.y, 4 * (i / sh.trail.length), 0, Math.PI * 2)
            ctx.fillStyle = `rgba(100,190,255,${a})`; ctx.fill()
          })
          // Head
          if (!sh.hit) {
            ctx.beginPath(); ctx.arc(sh.x, sh.y, 5, 0, Math.PI * 2)
            ctx.fillStyle = '#7dd8ff'; ctx.fill()
          }
          // Splash
          sh.splash.forEach(d => {
            const a = d.life / d.maxLife
            ctx.beginPath(); ctx.arc(d.x, d.y, 3, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(100,200,255,${a})`; ctx.fill()
          })
        })

        gun(ctx, s.mx, s.my)
        crosshair(ctx, s.mx, s.my)
        hud(ctx, s.score, s.health, s.wave)

      } else {
        // Dead
        ;[...s.spiders].forEach(sp => spider(ctx, sp))
        gun(ctx, s.mx, s.my)
        ctx.fillStyle = 'rgba(0,0,0,0.72)'
        ctx.fillRect(0, 0, W, H)
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.font = 'bold 52px system-ui'; ctx.fillStyle = '#ff4444'
        ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 24
        ctx.fillText('THE SPIDERS GOT YOU', W / 2, H / 2 - 70)
        ctx.shadowBlur = 0
        ctx.font = '22px system-ui'; ctx.fillStyle = '#ddd'
        ctx.fillText(`Score: ${s.score}   ·   Wave: ${s.wave}   ·   Killed: ${s.killed}`, W / 2, H / 2 - 10)
        ctx.font = 'bold 20px system-ui'; ctx.fillStyle = '#3ecf8e'
        ctx.fillText('Click to Try Again', W / 2, H / 2 + 50)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current!
    const rect = () => canvas.getBoundingClientRect()

    const scale = (e: MouseEvent) => {
      const r = rect()
      return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }
    }

    const onMove = (e: MouseEvent) => { const p = scale(e); G.current.mx = p.x; G.current.my = p.y }
    const onClick = (e: MouseEvent) => {
      const p = scale(e)
      const s = G.current
      if (s.phase !== 'playing') startGame()
      else fireShot(p.x, p.y)
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('click', onClick)
    return () => { canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('click', onClick) }
  }, [startGame, fireShot])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080808', gap: '0.5rem' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%', cursor: 'none', borderRadius: '6px', border: '1px solid #1a1a1a' }} />
      <p style={{ color: '#333', fontSize: '0.8rem', margin: 0, fontFamily: 'monospace' }}>Move mouse to aim · Click to shoot</p>
    </main>
  )
}
