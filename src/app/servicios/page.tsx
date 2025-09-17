"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import FixedHeader from '@/components/FixedHeader';
import BackNavigation from '@/components/BackNavigation';
import { faHouse, faBuilding, faCalendarDays, faMagnifyingGlass, faClipboardList, faChevronDown, faArrowRight, faInfoCircle, faPhone, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface Service {
  id: string;
  name: string;
  icon: IconDefinition;
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
      icon: faHouse,
      href: '/cuentas-nuevas'
    },
    {
      id: 'proyecto-nuevo',
      name: 'Proyecto Nuevo',
      icon: faBuilding,
      href: '/proyecto-nuevo'
    },
    {
      id: 'agendamiento-citas',
      name: 'Agendamiento De Citas',
      icon: faCalendarDays,
      href: '/agendamiento-citas'
    },
    {
      id: 'gestion-citas',
      name: 'Consultar Citas Existentes',
      icon: faMagnifyingGlass,
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
          <h1 className="text-4xl md:text-5xl font-bold text-[#203461] mb-4">
            Sistema de
            <span className="bg-gradient-to-r from-[#1797D5] to-[#56C2E1] bg-clip-text text-transparent"> Servicios</span>
          </h1>
          <h2 className="text-2xl font-semibold text-[#203461] mb-8">ElectroHuila</h2>
        </div>

        {/* Service Selection Card */}
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 mx-auto max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#97D4E3] to-[#56C2E1] rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <FontAwesomeIcon icon={faClipboardList} className="text-3xl text-[#1797D5]" />
            </div>
            <h3 className="text-2xl font-bold text-[#203461] mb-2">Seleccione el Tipo de Servicio</h3>
            <p className="text-gray-600">Elija el servicio que necesita para continuar con su solicitud</p>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 mx-auto flex justify-center max-w-md">
            <div className="flex items-center text-xs">
              <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-blue-800 font-medium">Seleccione el tipo de servicio que requiere para continuar</span>
            </div>
          </div>

          {/* Dropdown */}
          <div className="relative mb-6" ref={dropdownRef}>
            <div className="mx-auto max-w-xs">
              <label className="block text-xs font-semibold text-[#203461] mb-1">
                Tipo de Servicio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-left text-xs focus:outline-none focus:border-[#1797D5] transition-colors duration-200 hover:border-[#56C2E1]"
                >
                  <div className="flex items-center justify-between">
                    <span className={`${selectedService ? 'text-gray-900' : 'text-gray-500'}`}>
                      {selectedService || 'Seleccione un servicio...'}
                    </span>
                    <FontAwesomeIcon 
                      icon={faChevronDown}
                      className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      <div className="px-4 py-2 bg-[#1797D5] text-white font-medium text-xs">
                        Seleccione un servicio...
                      </div>
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}
                          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 flex items-center space-x-2"
                        >
                          <span className="text-base">
                            <FontAwesomeIcon icon={service.icon} className="text-[#1797D5]" />
                          </span>
                          <span className="text-gray-900 font-medium">{service.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Continue Button */}
          {selectedService && selectedServiceData && (
            <div className="text-center">
              <Link 
                href={selectedServiceData.href}
                className="inline-flex items-center justify-center bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-8 py-3 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="mr-2">
                  <FontAwesomeIcon icon={selectedServiceData.icon} className="text-white" />
                </span>
                <span>Continuar con {selectedService}</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5 ml-2" />
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
                  <span className="text-2xl">
                    <FontAwesomeIcon icon={service.icon} className="text-[#1797D5]" />
                  </span>
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
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
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
              <div className="font-semibold mb-2"><FontAwesomeIcon icon={faPhone} className="mr-1" /> Atención al Cliente</div>
              <div className="text-white/90">(608) 8664600</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2"><FontAwesomeIcon icon={faPhone} className="mr-1" /> Mesa de Ayuda</div>
              <div className="text-white/90">(608) 8664646</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2"><FontAwesomeIcon icon={faPhone} className="mr-1" /> Línea Gratuita</div>
              <div className="text-white/90">018000952115</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2"><FontAwesomeIcon icon={faSearch} className="mr-1" /> Transparencia</div>
              <div className="text-white/90">Línea PQR</div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/70 text-sm">
            © <span className="note-year">{new Date().getFullYear()}</span> ElectroHuila S.A. E.S.P. - Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}