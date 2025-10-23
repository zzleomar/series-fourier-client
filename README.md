# Frontend Next.js - Simulador de Fourier

## ✅ Estado Actual

Las dependencias están instaladas. Necesitas crear los archivos de configuración y componentes.

## 📦 Dependencias Instaladas

- ✅ Next.js 14.2.3
- ✅ React 18.3.1
- ✅ TypeScript 5.4.5
- ✅ Recharts 2.12.7 (para gráficos)
- ✅ Axios 1.7.2 (para API calls)
- ✅ Tailwind CSS 3.4.4

## 📁 Estructura del Proyecto

```
client/
├── app/                        # Directorio de la aplicación Next.js 14
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Página principal
│   └── globals.css             # Estilos globales con Tailwind
├── components/                 # Componentes React reutilizables
│   └── charts/                 # Componentes de gráficos
├── lib/                        # Utilidades y helpers
├── types/                      # Definiciones de TypeScript
├── public/                     # Archivos estáticos
├── .github/                    # Configuración de GitHub
├── .env                        # Variables de entorno (desarrollo)
├── .env.production             # Variables de entorno (producción)
├── .gitignore                  # Archivos excluidos de Git
├── next.config.js              # Configuración de Next.js
├── tailwind.config.js          # Configuración de Tailwind CSS
├── postcss.config.js           # Configuración de PostCSS
├── tsconfig.json               # Configuración de TypeScript
├── package.json                # Dependencias del proyecto
├── package-lock.json           # Lock de dependencias
├── next-env.d.ts               # Tipos de Next.js
└── README.md                   # Documentación del proyecto
```

## 🔧 Archivos que Necesitas Crear

### 1. Configuración de Tailwind

**`tailwind.config.js`:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**`postcss.config.js`:**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 2. Next.js Config

**`next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
```

### 3. Archivos de la App

**`app/globals.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
```

**`app/layout.tsx`:**
```typescript
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulador de Fourier',
  description: 'Análisis de Series de Fourier',
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
```

**`app/page.tsx`:**
```typescript
'use client';

import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_API_URL;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const analyzeFunction = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/analyze`, {
        function_type: 'Onda Cuadrada',
        amplitude: 1.0,
        period: 2.0,
        duration: 5.0,
        n_harmonics: 15,
        sampling_rate: 1000
      });
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con la API');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-indigo-900">
          Simulador de Series de Fourier
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={analyzeFunction}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Analizando...' : 'Analizar Onda Cuadrada'}
          </button>
        </div>

        {data && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Resultados</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">MSE:</h3>
                <p>{data.statistics.mse.toFixed(6)}</p>
              </div>
              <div>
                <h3 className="font-semibold">RMSE:</h3>
                <p>{data.statistics.rmse.toFixed(6)}</p>
              </div>
              <div>
                <h3 className="font-semibold">Error Máximo:</h3>
                <p>{data.statistics.max_error.toFixed(6)}</p>
              </div>
              <div>
                <h3 className="font-semibold">Energía Total:</h3>
                <p>{data.statistics.total_energy.toFixed(6)}</p>
              </div>
            </div>

            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
```

## 🚀 Cómo Ejecutar

```bash
# 1. Asegúrate de que la API esté corriendo
# En otra terminal: make api-run

# 2. Inicia el frontend
npm run dev

# 3. Abre en el navegador
# http://localhost:3000
```

## 📊 Próximos Pasos para Gráficos

Para agregar gráficos con Recharts, crea componentes en `components/charts/` y úsalos en `app/page.tsx`.

Ver ejemplos en el README-API-FRONTEND.md del directorio padre.
