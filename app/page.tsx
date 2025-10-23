'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const PREDEFINED_FUNCTIONS = [
  'Seno',
  'Coseno',
  'Onda Cuadrada',
  'Onda Triangular',
  'Onda Diente de Sierra',
  'Pulso',
  'Personalizada'
];

export default function Home() {
  // States
  const [functionType, setFunctionType] = useState('Onda Cuadrada');
  const [customExpression, setCustomExpression] = useState('A * sin(2*pi*t/T)');
  const [amplitude, setAmplitude] = useState(1.0);
  const [period, setPeriod] = useState(2.0);
  const [duration, setDuration] = useState(5.0);
  const [nHarmonics, setNHarmonics] = useState(15);

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Refs para los gráficos
  const chart1Ref = useRef<HTMLDivElement>(null);
  const chart2Ref = useRef<HTMLDivElement>(null);
  const chart3Ref = useRef<HTMLDivElement>(null);
  const chart4Ref = useRef<HTMLDivElement>(null);

  // Función para exportar gráfico a PNG
  const exportChartToPNG = async (chartRef: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!chartRef.current) return;

    try {
      // Encontrar y ocultar el botón de exportación dentro del gráfico
      const button = chartRef.current.querySelector('button');
      const originalDisplay = button ? button.style.display : '';
      if (button) {
        button.style.display = 'none';
      }

      // Encontrar el título (h3) y agregar expresión si es personalizada
      const titleElement = chartRef.current.querySelector('h3');
      const originalTitle = titleElement ? titleElement.textContent : '';
      if (titleElement && functionType === 'Personalizada' && customExpression) {
        titleElement.textContent = `${originalTitle} (${customExpression})`;
      }

      // Esperar un momento para que el DOM se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capturar la imagen
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Mayor calidad
        logging: false,
      });

      // Restaurar el título original
      if (titleElement && originalTitle) {
        titleElement.textContent = originalTitle;
      }

      // Restaurar el botón
      if (button) {
        button.style.display = originalDisplay;
      }

      // Convertir canvas a blob y descargar
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${functionType}-${fileName}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error al exportar gráfico:', error);
    }
  };

  const analyzeFunction = async () => {
    console.log('Analizando función...');
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        function_type: functionType,
        expression: functionType === 'Personalizada' ? customExpression : undefined,
        amplitude,
        period,
        duration,
        n_harmonics: nHarmonics,
        sampling_rate: 1000
      };

      const response = await axios.post(`${API_URL}/api/analyze`, payload);
      setData(response.data);
    } catch (error: any) {
      console.error('Error:', error);
      setError(
        error.response?.data?.detail ||
        `Error al conectar con la API. Asegúrate de que esté corriendo en ${API_URL}.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Preparar datos para gráficos
  const prepareChartData = () => {
    if (!data) return null;

    // Gráfico 1: Función original vs aproximación (decimación para rendimiento)
    const decimationFactor = Math.ceil(data.original_signal.time.length / 500);
    const signalData = data.original_signal.time
      .filter((_: any, i: number) => i % decimationFactor === 0)
      .map((t: number, i: number) => ({
        time: parseFloat(t.toFixed(3)),
        original: data.original_signal.values[i * decimationFactor],
        fourier: data.fourier_approximation.values[i * decimationFactor],
      }));

    // Gráfico 2: Error
    const errorData = data.error_signal.time
      .filter((_: any, i: number) => i % decimationFactor === 0)
      .map((t: number, i: number) => ({
        time: parseFloat(t.toFixed(3)),
        error: data.error_signal.values[i * decimationFactor],
      }));

    // Gráfico 3: Coeficientes de Fourier
    const coeffsData = data.coefficients.an.map((an: number, i: number) => ({
      n: i + 1,
      an: an,
      bn: data.coefficients.bn[i],
      magnitude: data.coefficients.magnitudes[i],
    })).slice(0, Math.min(20, nHarmonics)); // Solo primeros 20

    // Gráfico 4: Espectro de frecuencias
    const spectrumData = data.frequency_spectrum.frequencies
      .map((freq: number, i: number) => ({
        frequency: parseFloat(freq.toFixed(2)),
        magnitude: data.frequency_spectrum.magnitudes[i],
      }))
      .filter((d: any) => d.frequency > 0 && d.frequency <= 50)
      .slice(0, 100); // Solo primeras 100 frecuencias

    return { signalData, errorData, coeffsData, spectrumData };
  };

  const chartData = prepareChartData();

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Simulador de Funciones con Análisis de Fourier
          </h1>
          <p className="text-gray-600">Análisis y visualización interactiva</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Controles */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">⚙️ Controles</h2>

              {/* Selector de Función */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Función
                </label>
                <select
                  value={functionType}
                  onChange={(e) => setFunctionType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition-all"
                >
                  {PREDEFINED_FUNCTIONS.map((func) => (
                    <option key={func} value={func}>
                      {func}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expresión Custom */}
              {functionType === 'Personalizada' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expresión Matemática
                  </label>
                  <textarea
                    value={customExpression}
                    onChange={(e) => setCustomExpression(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition-all font-mono text-sm"
                    rows={3}
                    placeholder="A * sin(2*pi*t/T)"
                  />
                   <p className="text-xs text-gray-500 mt-1">
                    Variables: t, A, T | Funciones: sin, cos, exp, log, sqrt
                  </p>

                  {/* Acordeón de Ayuda */}
                  <div className="mt-3 border border-gray-200 rounded-lg overflow-y-auto">
                    <button
                      onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-left flex items-center justify-between transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span>📖</span>
                        <span>Guía de Expresiones Matemáticas</span>
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>

                    <div
                      className={`transition-all duration-300 ${isAccordionOpen ? 'max-h-[400px]' : 'max-h-0'} overflow-y-auto' : 'max-h-0'}`}
                    >
                      <div className="px-4 py-3 bg-white text-xs space-y-3">
                        {/* Variables */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                            <span className="text-indigo-600">●</span> Variables Disponibles
                          </h4>
                          <div className="pl-3 space-y-1 text-gray-600">
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">t</code> - Variable de tiempo</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">A</code> - Amplitud de la función</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">T</code> - Período de la función</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">pi</code> - Constante π (3.14159...)</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">e</code> - Constante e (2.71828...)</div>
                          </div>
                        </div>

                        {/* Operadores */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                            <span className="text-purple-600">●</span> Operadores
                          </h4>
                          <div className="pl-3 space-y-1 text-gray-600">
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">+</code> Suma <br/><code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">-</code> Resta <br/><code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">*</code> Multiplicación <br/><code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">/</code> División</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">**</code> o <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">^</code> - Potencia (ej: <code className="font-mono">t**2</code> o <code className="font-mono">t^2</code>)</div>
                          </div>
                        </div>

                        {/* Funciones */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                            <span className="text-green-600">●</span> Funciones Matemáticas
                          </h4>
                          <div className="pl-3 space-y-1 text-gray-600">
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-green-600 font-mono">sin(x)</code> - Seno</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-green-600 font-mono">cos(x)</code> - Coseno</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-green-600 font-mono">tan(x)</code> - Tangente</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-green-600 font-mono">exp(x)</code> - Exponencial (eˣ)</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-green-600 font-mono">log(x)</code> - Logaritmo natural</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-green-600 font-mono">sqrt(x)</code> - Raíz cuadrada</div>
                            <div><code className="bg-gray-100 px-1.5 py-0.5 rounded text-green-600 font-mono">abs(x)</code> - Valor absoluto</div>
                          </div>
                        </div>

                        {/* Ejemplos */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
                            <span className="text-orange-600">●</span> Ejemplos de Uso
                          </h4>
                          <div className="pl-3 space-y-1.5 text-gray-600">
                            <div className="bg-blue-50 p-2 rounded border border-blue-200">
                              <code className="font-mono text-blue-700">A * sin(2*pi*t/T)</code>
                              <div className="text-xs text-gray-500 mt-0.5">Onda sinusoidal estándar</div>
                            </div>
                            <div className="bg-purple-50 p-2 rounded border border-purple-200">
                              <code className="font-mono text-purple-700">A * exp(-t) * cos(t)</code>
                              <div className="text-xs text-gray-500 mt-0.5">Oscilación amortiguada</div>
                            </div>
                            <div className="bg-green-50 p-2 rounded border border-green-200">
                              <code className="font-mono text-green-700">A * (sin(t) + sin(3*t)/3)</code>
                              <div className="text-xs text-gray-500 mt-0.5">Suma de armónicos</div>
                            </div>
                            <div className="bg-orange-50 p-2 rounded border border-orange-200">
                              <code className="font-mono text-orange-700">A * t * exp(-t/T)</code>
                              <div className="text-xs text-gray-500 mt-0.5">Rampa exponencial</div>
                            </div>
                          </div>
                        </div>

                        {/* Nota importante */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-yellow-800 text-xs">
                            <strong>💡 Nota:</strong> Asegúrate de usar paréntesis correctamente y evita divisiones por cero.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amplitud */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amplitud: <span className="text-indigo-600 font-bold">{amplitude.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={amplitude}
                  onChange={(e) => setAmplitude(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Período */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período: <span className="text-indigo-600 font-bold">{period.toFixed(2)} s</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={period}
                  onChange={(e) => setPeriod(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Duración */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración: <span className="text-indigo-600 font-bold">{duration.toFixed(1)} s</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={duration}
                  onChange={(e) => setDuration(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Número de Armónicos */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Armónicos: <span className="text-indigo-600 font-bold">{nHarmonics}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={nHarmonics}
                  onChange={(e) => setNHarmonics(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Botón Analizar */}
              <button
                onClick={analyzeFunction}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analizando...
                  </span>
                ) : (
                  '🎵 Analizar Función'
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {data && (
                <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <p className="text-green-700 font-medium text-sm">
                    ✓ Análisis completado
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    MSE: {data.statistics.mse.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Panel de Visualización */}
          <div className="lg:col-span-2 space-y-6">
            {!data && !isLoading && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  Listo para Analizar
                </h3>
                <p className="text-gray-600">
                  Configura los parámetros y haz clic en "Analizar Función"
                </p>
              </div>
            )}

            {chartData && (
              <>
                {/* Gráfico 1: Función Original vs Aproximación */}
                <div ref={chart1Ref} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      📈 Función Original vs Aproximación de Fourier
                    </h3>
                    <button
                      onClick={() => exportChartToPNG(chart1Ref, 'funcion-original-vs-aproximacion.png')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                      title="Exportar como PNG"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PNG
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.signalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        label={{ value: 'Tiempo (s)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis label={{ value: 'f(t)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="original"
                        stroke="#3B82F6"
                        name="Original"
                        dot={false}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="fourier"
                        stroke="#EF4444"
                        name="Aproximación"
                        dot={false}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Gráfico 2: Error de Aproximación */}
                <div ref={chart2Ref} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      📉 Error de Aproximación
                    </h3>
                    <button
                      onClick={() => exportChartToPNG(chart2Ref, 'error-aproximacion.png')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                      title="Exportar como PNG"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PNG
                    </button>
                  </div>
                  <div className="mb-2 text-sm text-gray-600">
                    MSE: {data.statistics.mse.toFixed(6)} |
                    RMSE: {data.statistics.rmse.toFixed(6)} |
                    Max: {data.statistics.max_error.toFixed(6)}
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData.errorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: 'Tiempo (s)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Error', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="error"
                        stroke="#10B981"
                        name="Error"
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Gráfico 3: Coeficientes de Fourier */}
                <div ref={chart3Ref} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      📊 Coeficientes de Fourier
                    </h3>
                    <button
                      onClick={() => exportChartToPNG(chart3Ref, 'coeficientes-fourier.png')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                      title="Exportar como PNG"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PNG
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.coeffsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="n" label={{ value: 'Armónico (n)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Coeficiente', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="an" fill="#3B82F6" name="aₙ (cos)" />
                      <Bar dataKey="bn" fill="#EF4444" name="bₙ (sin)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Gráfico 4: Espectro de Frecuencias */}
                <div ref={chart4Ref} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      🌊 Espectro de Frecuencias (FFT)
                    </h3>
                    <button
                      onClick={() => exportChartToPNG(chart4Ref, 'espectro-frecuencias.png')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                      title="Exportar como PNG"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PNG
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.spectrumData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="frequency"
                        label={{ value: 'Frecuencia (Hz)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis
                        scale="log"
                        domain={['auto', 'auto']}
                        label={{ value: 'Magnitud', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="magnitude"
                        stroke="#8B5CF6"
                        name="Magnitud"
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 mb-6">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Sección superior con degradado */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 h-1"></div>

            <div className="p-8 md:p-10">

              {/* Divisor */}
              <div className="w-24 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mx-auto mb-8"></div>

              {/* Equipo de desarrollo */}
              <div className="mb-8">
                <p className="text-center text-gray-600 font-semibold mb-6 text-sm uppercase tracking-wider">
                  Desarrollado por
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <div className="group">
                    <div className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-gray-800 font-semibold text-sm leading-tight">Hernández</p>
                          <p className="text-gray-600 text-xs">Asdrúbal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <div className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-gray-800 font-semibold text-sm leading-tight">Salmerón</p>
                          <p className="text-gray-600 text-xs">Jean Carlos</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <div className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-pink-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-gray-800 font-semibold text-sm leading-tight">Jiménez</p>
                          <p className="text-gray-600 text-xs">Yusvania</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <div className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-gray-800 font-semibold text-sm leading-tight">Esparragoza</p>
                          <p className="text-gray-600 text-xs">Leomar</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tecnologías */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <span>Next.js & React</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span>FastAPI & Python</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500"></div>
                    <span>Recharts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <span>Tailwindcss</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <span>© 2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
