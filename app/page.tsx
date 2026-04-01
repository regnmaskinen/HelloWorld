'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const fallbackGreetings = [
  { language: 'English', greeting: 'Hello, World!' },
  { language: 'Spanish', greeting: '¡Hola, Mundo!' },
  { language: 'French', greeting: 'Bonjour, le Monde!' },
  { language: 'German', greeting: 'Hallo, Welt!' },
  { language: 'Japanese', greeting: 'こんにちは、世界！' },
  { language: 'Chinese (Simplified)', greeting: '你好，世界！' },
  { language: 'Arabic', greeting: 'مرحبًا بالعالم!' },
  { language: 'Portuguese', greeting: 'Olá, Mundo!' },
  { language: 'Russian', greeting: 'Привет, мир!' },
  { language: 'Korean', greeting: '안녕하세요, 세계!' },
  { language: 'Italian', greeting: 'Ciao, Mondo!' },
  { language: 'Hindi', greeting: 'नमस्ते, दुनिया!' },
  { language: 'Dutch', greeting: 'Hallo, Wereld!' },
  { language: 'Swedish', greeting: 'Hej, Världen!' },
  { language: 'Norwegian', greeting: 'Hei, Verden!' },
  { language: 'Danish', greeting: 'Hej, Verden!' },
  { language: 'Finnish', greeting: 'Hei, Maailma!' },
  { language: 'Polish', greeting: 'Witaj, Świecie!' },
  { language: 'Turkish', greeting: 'Merhaba, Dünya!' },
  { language: 'Greek', greeting: 'Γεια σου, Κόσμε!' },
  { language: 'Hebrew', greeting: '!שלום, עולם' },
  { language: 'Thai', greeting: 'สวัสดี ชาวโลก!' },
  { language: 'Vietnamese', greeting: 'Xin chào, Thế giới!' },
  { language: 'Indonesian', greeting: 'Halo, Dunia!' },
  { language: 'Malay', greeting: 'Helo, Dunia!' },
  { language: 'Czech', greeting: 'Ahoj, Světe!' },
  { language: 'Slovak', greeting: 'Ahoj, Svet!' },
  { language: 'Hungarian', greeting: 'Helló, Világ!' },
  { language: 'Romanian', greeting: 'Bună ziua, Lume!' },
  { language: 'Bulgarian', greeting: 'Здравей, Свят!' },
  { language: 'Croatian', greeting: 'Zdravo, Svijete!' },
  { language: 'Serbian', greeting: 'Zdravo, Svete!' },
  { language: 'Ukrainian', greeting: 'Привіт, Світе!' },
  { language: 'Catalan', greeting: 'Hola, Món!' },
  { language: 'Basque', greeting: 'Kaixo, Mundua!' },
  { language: 'Galician', greeting: 'Ola, Mundo!' },
  { language: 'Welsh', greeting: 'Helo, Byd!' },
  { language: 'Irish', greeting: 'Dia duit, a Dhomhan!' },
  { language: 'Scottish Gaelic', greeting: 'Halò, a Shaoghail!' },
  { language: 'Icelandic', greeting: 'Halló, heimur!' },
  { language: 'Estonian', greeting: 'Tere, Maailm!' },
  { language: 'Latvian', greeting: 'Sveika, Pasaule!' },
  { language: 'Lithuanian', greeting: 'Labas, Pasauli!' },
  { language: 'Slovenian', greeting: 'Pozdravljen, Svet!' },
  { language: 'Albanian', greeting: 'Përshëndetje, Botë!' },
  { language: 'Macedonian', greeting: 'Здраво, Свету!' },
  { language: 'Bosnian', greeting: 'Zdravo, Svijete!' },
  { language: 'Maltese', greeting: 'Bonġu, Dinja!' },
  { language: 'Afrikaans', greeting: 'Hallo, Wêreld!' },
  { language: 'Swahili', greeting: 'Habari, Dunia!' },
  { language: 'Zulu', greeting: 'Sawubona, Mhlaba!' },
  { language: 'Xhosa', greeting: 'Molo, Lizwe!' },
  { language: 'Amharic', greeting: 'ሰላም ዓለም!' },
  { language: 'Somali', greeting: 'Salam, Adduunka!' },
  { language: 'Hausa', greeting: 'Sannu, Duniya!' },
  { language: 'Yoruba', greeting: 'Pẹlẹ o, Ayé!' },
  { language: 'Igbo', greeting: 'Nnọọ, Ụwa!' },
  { language: 'Bengali', greeting: 'হ্যালো, বিশ্ব!' },
  { language: 'Punjabi', greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਦੁਨੀਆ!' },
  { language: 'Tamil', greeting: 'வணக்கம், உலகம்!' },
  { language: 'Telugu', greeting: 'హలో, ప్రపంచం!' },
  { language: 'Kannada', greeting: 'ಹಲೋ, ವಿಶ್ವ!' },
  { language: 'Malayalam', greeting: 'ഹലോ, ലോകം!' },
  { language: 'Sinhala', greeting: 'හෙලෝ, ලෝකය!' },
  { language: 'Nepali', greeting: 'नमस्ते, संसार!' },
  { language: 'Urdu', greeting: 'ہیلو، دنیا!' },
  { language: 'Persian', greeting: '!سلام دنیا' },
  { language: 'Pashto', greeting: '!سلام نړۍ' },
  { language: 'Kurdish', greeting: 'Silav, Cîhan!' },
  { language: 'Azerbaijani', greeting: 'Salam, Dünya!' },
  { language: 'Kazakh', greeting: 'Сәлем, Әлем!' },
  { language: 'Uzbek', greeting: 'Salom, Dunyo!' },
  { language: 'Turkmen', greeting: 'Salam, Dünýä!' },
  { language: 'Georgian', greeting: 'გამარჯობა, სამყარო!' },
  { language: 'Armenian', greeting: 'Բարև, Աշխարհ!' },
  { language: 'Mongolian', greeting: 'Сайн уу, Дэлхий!' },
  { language: 'Tibetan', greeting: 'བཀྲ་ཤིས་བདེ་ལེགས། འཛམ་གླིང་།' },
  { language: 'Burmese', greeting: 'မင်္ဂလာပါ ကမ္ဘာလောက!' },
  { language: 'Khmer', greeting: 'សួស្តី ពិភពលោក!' },
  { language: 'Lao', greeting: 'ສະບາຍດີ, ໂລກ!' },
  { language: 'Filipino', greeting: 'Kamusta, Mundo!' },
  { language: 'Javanese', greeting: 'Halo, Donya!' },
  { language: 'Sundanese', greeting: 'Halo, Dunya!' },
  { language: 'Cebuano', greeting: 'Kumusta, Kalibutan!' },
  { language: 'Malagasy', greeting: 'Manao ahoana, Izao tontolo izao!' },
  { language: 'Esperanto', greeting: 'Saluton, Mondo!' },
  { language: 'Latin', greeting: 'Ave, Munde!' },
  { language: 'Hawaiian', greeting: 'Aloha, Honua!' },
  { language: 'Māori', greeting: 'Kia ora, e te Ao!' },
  { language: 'Samoan', greeting: 'Talofa, Lalolagi!' },
  { language: 'Tongan', greeting: 'Mālō e lelei, Mamani!' },
  { language: 'Fijian', greeting: 'Bula, Vuravura!' },
  { language: 'Haitian Creole', greeting: 'Bonjou, Mond!' },
  { language: 'Quechua', greeting: '¡Rimaykullayki, Pacha!' },
  { language: 'Guaraní', greeting: '¡Mba\'éichapa, Yvy!' },
  { language: 'Nahuatl', greeting: '¡Niltze, Cemanahuatl!' },
  { language: 'Yoruba', greeting: 'Ẹ káàárọ̀, Ayé!' },
  { language: 'Tigrinya', greeting: 'ሰላም ዓለም!' },
  { language: 'Lingala', greeting: 'Mbote, Mokili!' },
  { language: 'Wolof', greeting: 'Salaam, Asamaan!' },
  { language: 'Bambara', greeting: 'I ni ce, Diɲɛ!' },
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

      <Link href="/snake" style={styles.snakeLink}>Play Alphabet Snake 🐍</Link>
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
  snakeLink: {
    color: '#3ecf8e',
    fontSize: '0.95rem',
    textDecoration: 'none',
    borderBottom: '1px solid #3ecf8e44',
    paddingBottom: '2px',
  },
}
