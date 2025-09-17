"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FixedHeader from '@/components/FixedHeader';

export default function Home() {
  const router = useRouter();
  const [keySequence, setKeySequence] = useState('');

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Solo letras y números
      if (event.key.match(/^[a-zA-Z0-9]$/)) {
        setKeySequence(prev => {
          const newSequence = (prev + event.key).toLowerCase();
          
          // Secuencia secreta: "admin123"
          if (newSequence.includes('admin123')) {
            // Usar setTimeout para mover la navegación fuera del setState
            setTimeout(() => router.push('/login'), 0);
            return '';
          }
          
          // Mantener solo los últimos 10 caracteres
          return newSequence.slice(-10);
        });
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      {/* Header */}
      <FixedHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#1797D5] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#56C2E1] rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/70 rounded-full text-[#1A6192] text-sm font-medium mb-6 shadow-sm">
              <span className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2 animate-pulse"></span>
              Sistema Digital Integrado
            </div>
            <h1 className="text-6xl font-bold text-[#203461] mb-4 leading-tight">
              Sistema de
              <span className="bg-gradient-to-r from-[#1797D5] to-[#56C2E1] bg-clip-text text-transparent"> Servicios</span>
            </h1>
            <h2 className="text-2xl font-semibold text-[#1A6192] mb-6">Electrohuila</h2>
          </div>

 
{/* Service Cards Grid */}
          <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
            {/* Sistema de Gestión Unificado Card */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#203461] via-[#1797D5] to-[#56C2E1] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-3xl m-[1px] p-8">
                {/* Icon Container */}
                <div className="mb-8 relative">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#97D4E3] to-[#56C2E1] rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-10 h-10 text-[#203461]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h.5a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2H8zM9 5v2h6V5H9zm-4 8h14" />
                    </svg>
                  </div>
                  {/* Floating Elements */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#56C2E1] rounded-full animate-bounce opacity-60"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#1797D5] rounded-full animate-pulse opacity-40"></div>
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#203461] mb-4">Sistema de Gestión</h3>
                  <p className="text-gray-600 text-base mb-8 leading-relaxed">
                    Gestione todos sus servicios eléctricos de forma rápida y segura: 
                    <span className="font-semibold text-[#1A6192]"> agende citas, consulte estados y gestione cuentas nuevas</span>
                  </p>
                  
                  {/* Features List */}
                  <div className="grid grid-cols-2 gap-3 mb-8 text-sm">
                    <div className="flex items-center text-[#1A6192]">
                      <div className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2"></div>
                      Agendar Citas
                    </div>
                    <div className="flex items-center text-[#1A6192]">
                      <div className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2"></div>
                      Consultar Citas
                    </div>
                    <div className="flex items-center text-[#1A6192]">
                      <div className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2"></div>
                      Cuentas Nuevas
                    </div>
                    <div className="flex items-center text-[#1A6192]">
                      <div className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2"></div>
                      Estado en Tiempo Real
                    </div>
                  </div>

                  <Link 
                    href="/servicios"
                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group-hover:scale-105"
                  >
                    <span>Acceder al Sistema</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          

        </div>
      </section>

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