"use client";

import Link from 'next/link';
import Image from 'next/image';
import MobileMenu from '@/components/MobileMenu';

interface HeaderProps {
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  className?: string;
}

export default function Header({ 
  showBackButton = false, 
  backButtonText = "Volver", 
  backButtonHref = "/",
  className = ""
}: HeaderProps) {
  
  // Elementos del menú para el componente MobileMenu
  const menuItems = [
    { label: 'Nuestra Empresa', href: '#', icon: '🏢' },
    { label: 'Usuarios', href: '#', icon: '👥' },
    { label: 'Proveedores', href: '#', icon: '🏭' },
    { label: 'Contáctenos', href: '#', icon: '📞' }
  ];

  return (
    <header className={`bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50 ${className}`}>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
              alt="ElectroHuila Logo"
              className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto object-contain"
              width={120}
              height={29}
              priority
            />
          </Link>
        </div>
        
        {/* Menú Desktop */}
        <nav className="hidden lg:flex space-x-4 xl:space-x-8">
          <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 whitespace-nowrap text-sm xl:text-base">Nuestra Empresa</a>
          <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 whitespace-nowrap text-sm xl:text-base">Usuarios</a>
          <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 whitespace-nowrap text-sm xl:text-base">Proveedores</a>
          <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 whitespace-nowrap text-sm xl:text-base">Contáctenos</a>
        </nav>
        
        {/* Sección derecha - incluye botón de volver si se especifica */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
          {/* Botón de volver - solo en desktop si se especifica */}
          {showBackButton && (
            <Link 
              href={backButtonHref}
              className="hidden md:flex items-center space-x-1 lg:space-x-2 text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 hover:bg-gray-50 px-2 lg:px-3 py-2 rounded-lg text-sm lg:text-base"
            >
              <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="whitespace-nowrap hidden lg:inline">{backButtonText}</span>
              <span className="whitespace-nowrap lg:hidden">Volver</span>
            </Link>
          )}
          
          {/* Botón Paga tu Factura - Desktop */}
          <button className="hidden md:flex bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 lg:px-4 xl:px-6 py-2 lg:py-2.5 rounded-lg lg:rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap text-xs lg:text-sm xl:text-base">
            <span className="hidden lg:inline">📄 Paga tu Factura</span>
            <span className="lg:hidden">📄 Factura</span>
          </button>
          
          {/* Contenedor para móvil - Botón volver + Botón factura + Menú hamburguesa */}
          <div className="flex md:hidden items-center space-x-1 sm:space-x-2">
            {/* Botón de volver - solo en móvil si se especifica */}
            {showBackButton && (
              <Link 
                href={backButtonHref}
                className="flex items-center text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 px-1.5 sm:px-2 py-1.5 rounded-lg"
                title={backButtonText}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            
            {/* Botón Paga tu Factura - Móvil (versión compacta) */}
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md whitespace-nowrap">
              <span className="hidden xs:inline">📄 Factura</span>
              <span className="xs:hidden">📄</span>
            </button>
            
            {/* Menú Hamburguesa */}
            <MobileMenu menuItems={menuItems} />
          </div>
        </div>
      </div>
    </header>
  );
}