"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiService } from '../../services/api';

interface VerificacionCita {
  valida: boolean;
  numeroCita: string;
  fechaCita: string;
  horaCita: string;
  estado: string;
  estadoDescripcion: string;
  cliente: {
    numeroCliente: string;
    nombreCompleto: string;
  };
  sede: {
    nombre: string;
    direccion: string;
  };
  tipoCita: {
    nombre: string;
    icono: string;
  };
  fechaCreacion: string;
  observaciones?: string;
  message: string;
}

// Componente interno que usa useSearchParams
function VerificarCitaContent() {
  const searchParams = useSearchParams();
  const [verificacion, setVerificacion] = useState<VerificacionCita | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const numero = searchParams.get('numero');
    const cliente = searchParams.get('cliente');

    if (!numero || !cliente) {
      setError('Parámetros de verificación incompletos');
      setLoading(false);
      return;
    }

    verificarCita(numero, cliente);
  }, [searchParams]);

  const verificarCita = async (numero: string, cliente: string) => {
    try {
      setLoading(true);
      setError('');

      const data = await apiService.verificarCitaPorQR(numero, cliente);
      setVerificacion(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar la cita';
      setError(errorMessage);
      setVerificacion(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour24 = parseInt(hours, 10);
        const mins = parseInt(minutes, 10);
        
        if (isNaN(hour24) || isNaN(mins)) return timeString;
        
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = hour24 % 12 || 12;
        const formattedMinutes = mins.toString().padStart(2, '0');
        return `${hour12}:${formattedMinutes} ${ampm}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const getStatusColor = (estado: string, valida: boolean) => {
    if (!valida) return 'bg-red-500';
    
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-500';
      case 'Completada': return 'bg-green-500';
      case 'Cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (estado: string, valida: boolean) => {
    if (!valida) return '❌';
    
    switch (estado) {
      case 'Pendiente': return '⏳';
      case 'Completada': return '✅';
      case 'Cancelada': return '❌';
      default: return '📅';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
                alt="ElectroHuila Logo"
                className="h-12 w-auto object-contain"
                width="120"
                height="29"
              />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/agendamiento-citas"
              className="flex items-center space-x-2 text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 hover:bg-gray-50 px-3 py-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Agendar Cita</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-white/70 rounded-full text-[#1A6192] text-sm font-medium mb-6 shadow-sm">
            <span className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2 animate-pulse"></span>
            Verificación de Cita
          </div>
          <h1 className="text-5xl font-bold text-[#203461] mb-4">
            Verificar
            <span className="bg-gradient-to-r from-[#1797D5] to-[#56C2E1] bg-clip-text text-transparent"> Cita</span>
          </h1>
          <h2 className="text-2xl font-semibold text-[#1A6192] mb-6">ElectroHuila</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Verificación automática de la autenticidad de su cita
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="animate-spin w-16 h-16 border-4 border-[#56C2E1] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Verificando cita...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden">
              <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Error de Verificación</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 text-center">
                <p className="text-gray-600 mb-6">
                  No se pudo verificar la cita. Verifique que el código QR sea válido o contacte al servicio al cliente.
                </p>
                <div className="flex justify-center space-x-4">
                  <Link 
                    href="/agendamiento-citas"
                    className="bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300"
                  >
                    Agendar Nueva Cita
                  </Link>
                  <a 
                    href="tel:6088664600"
                    className="bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
                  >
                    Llamar Soporte
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {verificacion && !loading && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Status Header */}
              <div className={`px-6 py-4 border-b border-gray-200 ${verificacion.valida ? 
                verificacion.estado === 'Completada' ? 'bg-green-50' : 'bg-blue-50' 
                : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                      verificacion.valida ? 
                        verificacion.estado === 'Completada' ? 'bg-green-100' : 'bg-blue-100'
                        : 'bg-red-100'
                    }`}>
                      <span className="text-2xl">
                        {getStatusIcon(verificacion.estado, verificacion.valida)}
                      </span>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${
                        verificacion.valida ? 
                          verificacion.estado === 'Completada' ? 'text-green-800' : 'text-blue-800'
                          : 'text-red-800'
                      }`}>
                        Cita {verificacion.valida ? 'Verificada' : 'No Válida'}
                      </h3>
                      <p className={`${
                        verificacion.valida ? 
                          verificacion.estado === 'Completada' ? 'text-green-700' : 'text-blue-700'
                          : 'text-red-700'
                      }`}>
                        {verificacion.estadoDescripcion}
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    getStatusColor(verificacion.estado, verificacion.valida)
                  } text-white`}>
                    {verificacion.estado}
                  </div>
                </div>
              </div>

              {/* Cita Details */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-[#203461] mb-4">
                        📋 Información de la Cita
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Número de Cita:</span>
                          <span className="font-semibold text-[#1797D5]">{verificacion.numeroCita}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fecha:</span>
                          <span className="font-medium">{formatDate(verificacion.fechaCita)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hora:</span>
                          <span className="font-medium">{formatTime(verificacion.horaCita)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo de Servicio:</span>
                          <span className="font-medium">
                            {verificacion.tipoCita.icono} {verificacion.tipoCita.nombre}
                          </span>
                        </div>
                      </div>
                    </div>

                    {verificacion.observaciones && (
                      <div>
                        <h4 className="text-lg font-semibold text-[#203461] mb-2">
                          📝 Observaciones
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-700">{verificacion.observaciones}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-[#203461] mb-4">
                        👤 Cliente
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Número:</span>
                          <span className="font-medium">{verificacion.cliente.numeroCliente}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nombre:</span>
                          <span className="font-medium">{verificacion.cliente.nombreCompleto}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-[#203461] mb-4">
                        🏢 Sede de Atención
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nombre:</span>
                          <span className="font-medium">{verificacion.sede.nombre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dirección:</span>
                          <span className="font-medium text-sm">{verificacion.sede.direccion}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-[#203461] mb-2">
                        📅 Fecha de Creación
                      </h4>
                      <p className="text-gray-600 text-sm">{verificacion.fechaCreacion}</p>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 Importante:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Presentarse 10 minutos antes de la hora programada</li>
                    <li>• Traer documento de identidad</li>
                    <li>• Este código QR es único e intransferible</li>
                    {verificacion.estado === 'Pendiente' && (
                      <li>• La cita está confirmada y activa</li>
                    )}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-center space-x-4">
                  <Link 
                    href="/agendamiento-citas"
                    className="bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300"
                  >
                    Agendar Otra Cita
                  </Link>
                  <Link 
                    href="/"
                    className="bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
                  >
                    Volver al Inicio
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#203461] to-[#1A6192] text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-3 mb-8">
            <img 
              src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
              alt="ElectroHuila Logo"
              className="h-10 w-auto object-contain filter brightness-0 invert"
              width="100"
              height="24"
            />
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 text-sm">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">📞 Atención al Cliente</div>
              <div className="text-white/90">(608) 8664600</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">📞 Mesa de Ayuda</div>
              <div className="text-white/90">(608) 8664646</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">📞 Línea Gratuita</div>
              <div className="text-white/90">018000952115</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">🔍 Transparencia</div>
              <div className="text-white/90">Línea PQR</div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/70 text-sm">
            © 2025 ElectroHuila S.A. E.S.P. - Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente principal con Suspense
export default function VerificarCitaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin w-16 h-16 border-4 border-[#56C2E1] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando verificación...</p>
        </div>
      </div>
    }>
      <VerificarCitaContent />
    </Suspense>
  );
}