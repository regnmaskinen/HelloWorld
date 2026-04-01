'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const fallbackGreetings = [
  { language: 'English', greeting: 'Hello, World!' },
  { language: 'Spanish', greeting: '¡Hola, Mundo!' },
  { language: 'French', greeting: 'Bonjour, le Monde!' },
  { language: 'German', greeting: 'Hallo, Welt!' },
  { language: 'Japanese', greeting: 'こんにちは、世界！' },
  { language: 'Chinese', greeting: '你好，世界！' },
  { language: 'Arabic', greeting: 'مرحبا بالعالم!' },
  { language: 'Portuguese', greeting: 'Olá, Mundo!' },
  { language: 'Russian', greeting: 'Привет, мир!' },
  { language: 'Korean', greeting: '안녕하세요, 세계!' },
  { language: 'Italian', greeting: 'Ciao, Mondo!' },
  { language: 'Hindi', greeting: 'नमस्ते, दुनिया!' },
]

export default function Home() {
  const [greeting, setGreeting] = useState<{ language: string; greeting: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [usedIndices, setUsedIndices] = useState<number[]>([])

  async function getGreeting() {
    setLoading(true)

    const result = supabase
      ? await supabase.from('greetings').select('language, greeting')
      : { data: null, error: true }
    const { data, error } = result

    if (!error && data && data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)]
      setGreeting(random)
    } else {
      let available = fallbackGreetings
        .map((_, i) => i)
        .filter((i) => !usedIndices.includes(i))

      if (available.length === 0) {
        available = fallbackGreetings.map((_, i) => i)
        setUsedIndices([])
      }

      const pick = available[Math.floor(Math.random() * available.length)]
      setUsedIndices((prev) => [...prev, pick])
      setGreeting(fallbackGreetings[pick])
    }

    setLoading(false)
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Hello World</h1>

      <button onClick={getGreeting} disabled={loading} style={styles.button}>
        {loading ? '...' : 'Get Greeting'}
      </button>

      {greeting && (
        <div style={styles.card}>
          <p style={styles.language}>{greeting.language}</p>
          <p style={styles.greetingText}>{greeting.greeting}</p>
        </div>
      )}
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
    gap: '2rem',
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  button: {
    padding: '0.9rem 2.5rem',
    fontSize: '1.1rem',
    fontWeight: 600,
    background: '#3ecf8e',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '2rem 3rem',
    textAlign: 'center',
    minWidth: '300px',
  },
  language: {
    fontSize: '0.9rem',
    color: '#888',
    margin: '0 0 0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  greetingText: {
    fontSize: '2rem',
    color: '#ffffff',
    margin: 0,
    fontWeight: 500,
  },
}
