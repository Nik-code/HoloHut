import './globals.css'
import { ReactNode } from 'react'
import Head from 'next/head'

export const metadata = {
  title: 'HoloHut — Pokémon TCG Stock Tracker',
  description: 'Track in-stock Pokémon TCG booster packs from Indian retailers. Updated hourly.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo.png" />
        <meta property="og:title" content="HoloHut — Pokémon TCG Stock Tracker" />
        <meta property="og:description" content="Track booster packs across India. No purchases, just live stock info." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:url" content="https://holo-hut.vercel.app/" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body>{children}</body>
    </html>
  )
}
