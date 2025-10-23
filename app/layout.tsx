import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulador de Fourier',
  description: 'Análisis de Series de Fourier con Next.js y FastAPI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
