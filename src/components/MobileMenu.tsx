"use client";

import React, { useState, useEffect } from 'react';

interface MenuItem {
  label: string;
  href: string;
  icon: string;
}

interface MobileMenuProps {
  menuItems: MenuItem[];
  className?: string;
}

export default function MobileMenu({ menuItems, className = '' }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Prevenir scroll del body cuando el menú está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className={`mobile-menu-container ${className}`}>
      {/* Botón Hamburguesa Estilizado */}
      <button
        onClick={toggleMenu}
        className="mobile-menu-button relative z-50 w-14 h-14 bg-gradient-to-br from-white to-gray-50 border-2 border-[#1A6192] rounded-2xl hover:from-[#1A6192] hover:to-[#203461] group transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#1A6192]/30"
        aria-label="Menú de navegación"
        type="button"
      >
        <div className="w-7 h-6 relative flex flex-col justify-between mx-auto">
          <span
            className={`block w-full h-0.5 bg-[#1A6192] group-hover:bg-white transition-all duration-300 transform origin-center rounded-full ${
              isOpen ? 'rotate-45 translate-y-2.5' : ''
            }`}
          />
          <span
            className={`block w-full h-0.5 bg-[#1A6192] group-hover:bg-white transition-all duration-300 rounded-full ${
              isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
            }`}
          />
          <span
            className={`block w-full h-0.5 bg-[#1A6192] group-hover:bg-white transition-all duration-300 transform origin-center rounded-full ${
              isOpen ? '-rotate-45 -translate-y-2.5' : ''
            }`}
          />
        </div>
        
        {/* Indicador de estado */}
        <div className={`absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#56C2E1] to-[#1797D5] rounded-full transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}>
          <div className="absolute inset-0.5 bg-white rounded-full animate-pulse"></div>
        </div>
      </button>

      {/* Overlay de fondo con efecto blur mejorado */}
      {isOpen && (
        <div
          className="mobile-menu-overlay fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/40 backdrop-blur-md z-40 transition-all duration-500"
          onClick={closeMenu}
        />
      )}

      {/* Panel Lateral Estilizado */}
      <div
        className={`mobile-menu-slide fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-white shadow-2xl z-50 transition-all duration-500 ease-out transform ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Header del menú con diseño mejorado */}
        <div className="relative bg-gradient-to-r from-[#203461] via-[#1797D5] to-[#56C2E1] p-8 overflow-hidden">
          {/* Patrón de fondo decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-24 h-24 bg-white rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-full blur-lg"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">ElectroHuila</h3>
                </div>
              </div>
            </div>
            <button
              onClick={closeMenu}
              className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-sm"
              aria-label="Cerrar menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Indicador de navegación */}
          <div className="relative mt-4 flex items-center text-white/90 text-sm">
            <div className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2 animate-pulse"></div>
            Menú de navegación principal
          </div>
        </div>

        {/* Navegación con diseño Card-Based */}
        <nav className="px-6 py-8 bg-gray-200 rounded">
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div 
                key={index}
                className={`transform transition-all duration-300 delay-${index * 100}`}
                style={{
                  transform: isOpen ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.95)',
                  opacity: isOpen ? 1 : 0
                }}
              >
                <a
                  href={item.href}
                  onClick={closeMenu}
                  className="group flex items-center p-4 bg-white hover:bg-gradient-to-r hover:from-[#1A6192] hover:to-[#203461] rounded-2xl border border-gray-200 hover:border-transparent shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {/* Icono dinámico */}
                  <div className="w-12 h-12 bg-gradient-to-br from-[#97D4E3] to-[#56C2E1] group-hover:from-white/20 group-hover:to-white/10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg">
                    <span className="text-2xl group-hover:text-white transition-colors duration-300">
                      {item.icon}
                    </span>
                  </div>
                  
                  {/* Contenido */}
                  <div className="ml-4 flex-1">
                    <h4 className="font-semibold text-[#1A6192] group-hover:text-white transition-colors duration-300">
                      {item.label}
                    </h4>
                    <p className="text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300">
                      Acceder a {item.label.toLowerCase()}
                    </p>
                  </div>
                  
                  {/* Flecha */}
                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 transform group-hover:translate-x-1">
                    <svg 
                      className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}