"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import FixedHeader from '@/components/FixedHeader';
import BackNavigation from '@/components/BackNavigation';

interface Service {
  id: string;
  name: string;
  icon: string;
  href: string;
}

export default function ServiciosPage() {
  const [selectedService, setSelectedService] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const services: Service[] = [
    {
      id: 'cuentas-nuevas', 
      name: 'Cuentas Nuevas',
      icon: '🏠',
      href: '/cuentas-nuevas'
    },
    {
      id: 'proyecto-nuevo',
      name: 'Proyecto Nuevo',
      icon: '🏗️',
      href: '/proyecto-nuevo'
    },
    {
      id: 'agendamiento-citas',
      name: 'Agendamiento De Citas',
      icon: '📅', 
      href: '/agendamiento-citas'
    },
    {
      id: 'gestion-citas',
      name: 'Consultar Citas Existentes',
      icon: '🔍',
      href: '/gestion-citas'
    }
  ];

  const handleServiceSelect = (service: Service): void => {
    setSelectedService(service.name);
    setIsOpen(false);
  };

  // Cerrar dropdown cuando se hace clic fuera de él o se presiona Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const selectedServiceData: Service | undefined = services.find(s => s.name === selectedService);

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      {/* Header */}
      <FixedHeader />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 pt-24">
        {/* Back Navigation */}
        <BackNavigation backTo="/" />
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-white/70 rounded-full text-[#1A6192] text-sm font-medium mb-6 shadow-sm">
            <span className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2 animate-pulse"></span>
            Sistema Digital Integrado
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#203461] mb-4">
            Sistema de
            <span className="bg-gradient-to-r from-[#1797D5] to-[#56C2E1] bg-clip-text text-transparent"> Servicios</span>
          </h1>
          <h2 className="text-2xl font-semibold text-[#1A6192] mb-8">ElectroHuila</h2>
        </div>

        {/* Service Selection Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#97D4E3] to-[#56C2E1] rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-2xl font-bold text-[#203461] mb-2">Seleccione el Tipo de Servicio</h3>
            <p className="text-gray-600">Elija el servicio que necesita para continuar con su solicitud</p>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-800 font-medium">Seleccione el tipo de servicio que requiere para continuar</span>
            </div>
          </div>

          {/* Dropdown */}
          <div className="relative mb-6" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-[#203461] mb-2">
              Tipo de Servicio <span className="text-red-500">*</span>
            </label>
            
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:border-[#1797D5] transition-colors duration-200 hover:border-[#56C2E1]"
              >
                <div className="flex items-center justify-between">
                  <span className={`${selectedService ? 'text-gray-900' : 'text-gray-500'}`}>
                    {selectedService || 'Seleccione un servicio...'}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="py-1">
                    <div className="px-4 py-2 bg-[#1797D5] text-white font-medium">
                      Seleccione un servicio...
                    </div>
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 flex items-center space-x-3"
                      >
                        <span className="text-lg">{service.icon}</span>
                        <span className="text-gray-900 font-medium">{service.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          {selectedService && selectedServiceData && (
            <div className="text-center">
              <Link 
                href={selectedServiceData.href}
                className="inline-flex items-center justify-center bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-8 py-3 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="mr-2">{selectedServiceData.icon}</span>
                <span>Continuar con {selectedService}</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Services Info Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {services.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:border-[#56C2E1] transform hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full"
            >
              <div className="text-center flex-1 flex flex-col">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#97D4E3] to-[#56C2E1] rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">{service.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-[#203461] mb-2 group-hover:text-[#1797D5] transition-colors duration-300">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-1">
                  {service.id === 'cuentas-nuevas' && 'Solicite nuevas conexiones eléctricas para su hogar o negocio'}
                  {service.id === 'proyecto-nuevo' && 'Para proyectos de construcción, urbanizaciones o desarrollos inmobiliarios'}
                  {service.id === 'agendamiento-citas' && 'Programe citas para reclamos, reportes de daños y otros servicios'}
                  {service.id === 'gestion-citas' && 'Verifique el estado y detalles de sus citas existentes'}
                </p>
                <div className="flex items-center justify-center text-[#1797D5] group-hover:text-[#56C2E1] transition-colors duration-300 mt-auto">
                  <span className="text-sm font-medium">Ir al servicio</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
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