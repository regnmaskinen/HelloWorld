'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const CELL = 24
const COLS = 25
const ROWS = 20
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

type Point = { x: number; y: number }
type Dir = { x: number; y: number }

function randomCell(exclude: Point[]): Point {
  let p: Point
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
  } while (exclude.some(e => e.x === p.x && e.y === p.y))
  return p
}

export default function SnakePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    snake: [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }] as Point[],
    dir: { x: 1, y: 0 } as Dir,
    nextDir: { x: 1, y: 0 } as Dir,
    food: { x: 18, y: 10 } as Point,
    letterIndex: 0,
    eaten: [] as string[],
    status: 'idle' as 'idle' | 'playing' | 'dead' | 'won',
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [display, setDisplay] = useState({ letterIndex: 0, eaten: [] as string[], status: 'idle' as string })

  const spawnFood = useCallback((snake: Point[], index: number) => {
    return randomCell(snake)
  }, [])

  const startGame = useCallback(() => {
    const snake = [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }]
    const s = stateRef.current
    s.snake = snake
    s.dir = { x: 1, y: 0 }
    s.nextDir = { x: 1, y: 0 }
    s.letterIndex = 0
    s.eaten = []
    s.food = spawnFood(snake, 0)
    s.status = 'playing'
    setDisplay({ letterIndex: 0, eaten: [], status: 'playing' })
  }, [spawnFood])

  const tick = useCallback(() => {
    const s = stateRef.current
    if (s.status !== 'playing') return

    s.dir = s.nextDir
    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y }

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      s.status = 'dead'
      setDisplay(d => ({ ...d, status: 'dead' }))
      return
    }
    // Self collision
    if (s.snake.some(p => p.x === head.x && p.y === head.y)) {
      s.status = 'dead'
      setDisplay(d => ({ ...d, status: 'dead' }))
      return
    }

    const ate = head.x === s.food.x && head.y === s.food.y
    s.snake = [head, ...s.snake]
    if (!ate) s.snake.pop()

    if (ate) {
      s.eaten = [...s.eaten, ALPHABET[s.letterIndex]]
      s.letterIndex++
      if (s.letterIndex >= ALPHABET.length) {
        s.status = 'won'
        setDisplay({ letterIndex: s.letterIndex, eaten: s.eaten, status: 'won' })
        return
      }
      s.food = spawnFood(s.snake, s.letterIndex)
      setDisplay({ letterIndex: s.letterIndex, eaten: s.eaten, status: 'playing' })
    }

    // Draw
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#0f0f0f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid dots
    ctx.fillStyle = '#1a1a1a'
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2)
      }
    }

    // Food letter
    const foodX = s.food.x * CELL
    const foodY = s.food.y * CELL
    ctx.fillStyle = '#3ecf8e22'
    ctx.fillRect(foodX + 2, foodY + 2, CELL - 4, CELL - 4)
    ctx.fillStyle = '#3ecf8e'
    ctx.font = `bold ${CELL - 6}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(ALPHABET[s.letterIndex], foodX + CELL / 2, foodY + CELL / 2)

    // Snake
    s.snake.forEach((p, i) => {
      const x = p.x * CELL
      const y = p.y * CELL
      const ratio = 1 - (i / s.snake.length) * 0.4
      ctx.fillStyle = i === 0 ? '#ffffff' : `rgba(100,200,140,${ratio})`
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
    })
  }, [spawnFood])

  // Draw idle screen
  const drawIdle = useCallback((status: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0f0f0f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#3ecf8e'
    ctx.font = 'bold 28px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    if (status === 'dead') {
      ctx.fillStyle = '#ff6b6b'
      ctx.fillText('GAME OVER', cx, cy - 20)
      ctx.fillStyle = '#888'
      ctx.font = '16px system-ui'
      ctx.fillText('Press Space or tap to restart', cx, cy + 20)
    } else if (status === 'won') {
      ctx.fillStyle = '#3ecf8e'
      ctx.fillText('YOU ATE THE ALPHABET!', cx, cy - 20)
      ctx.fillStyle = '#888'
      ctx.font = '16px system-ui'
      ctx.fillText('Press Space or tap to play again', cx, cy + 20)
    } else {
      ctx.fillStyle = '#ffffff'
      ctx.fillText('ALPHABET SNAKE', cx, cy - 30)
      ctx.fillStyle = '#888'
      ctx.font = '16px system-ui'
      ctx.fillText('Eat A → Z in order', cx, cy + 10)
      ctx.fillText('Press Space or tap to start', cx, cy + 36)
    }
  }, [])

  useEffect(() => {
    drawIdle('idle')
  }, [drawIdle])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (display.status === 'playing') {
      intervalRef.current = setInterval(tick, 120)
    } else {
      drawIdle(display.status)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [display.status, tick, drawIdle])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (e.code === 'Space') {
        if (s.status !== 'playing') startGame()
        return
      }
      if (s.status !== 'playing') return
      const d = s.dir
      if ((e.key === 'ArrowUp' || e.key === 'w') && d.y === 0) s.nextDir = { x: 0, y: -1 }
      if ((e.key === 'ArrowDown' || e.key === 's') && d.y === 0) s.nextDir = { x: 0, y: 1 }
      if ((e.key === 'ArrowLeft' || e.key === 'a') && d.x === 0) s.nextDir = { x: -1, y: 0 }
      if ((e.key === 'ArrowRight' || e.key === 'd') && d.x === 0) s.nextDir = { x: 1, y: 0 }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startGame])

  const handleTouch = useCallback(() => {
    if (stateRef.current.status !== 'playing') startGame()
  }, [startGame])

  const currentLetter = ALPHABET[Math.min(display.letterIndex, 25)]
  const progress = display.letterIndex

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Alphabet Snake</h1>

      <div style={styles.hud}>
        <div style={styles.hudItem}>
          <span style={styles.hudLabel}>Next</span>
          <span style={styles.hudValue}>{display.status === 'playing' ? currentLetter : '—'}</span>
        </div>
        <div style={styles.hudItem}>
          <span style={styles.hudLabel}>Progress</span>
          <span style={styles.hudValue}>{progress}/26</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={COLS * CELL}
        height={ROWS * CELL}
        style={styles.canvas}
        onClick={handleTouch}
      />

      <div style={styles.eaten}>
        {ALPHABET.map(l => (
          <span key={l} style={{
            ...styles.letter,
            color: display.eaten.includes(l) ? '#3ecf8e' : '#333',
            fontWeight: display.eaten.includes(l) ? 700 : 400,
          }}>
            {l}
          </span>
        ))}
      </div>

      <p style={styles.hint}>Arrow keys / WASD · Space to start</p>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f0f',
    gap: '1rem',
    fontFamily: 'system-ui, sans-serif',
    padding: '1rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  hud: {
    display: 'flex',
    gap: '2rem',
  },
  hudItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  hudLabel: {
    fontSize: '0.75rem',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  hudValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#3ecf8e',
    minWidth: '2rem',
    textAlign: 'center',
  },
  canvas: {
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    cursor: 'pointer',
    maxWidth: '100%',
  },
  eaten: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    maxWidth: `${COLS * CELL}px`,
    justifyContent: 'center',
  },
  letter: {
    fontSize: '1rem',
    width: '1.4rem',
    textAlign: 'center',
    transition: 'color 0.3s',
  },
  hint: {
    color: '#444',
    fontSize: '0.8rem',
    margin: 0,
  },
}
