"use client";

import Link from 'next/link';
import MobileMenu from '@/components/MobileMenu';

interface FixedHeaderProps {
  className?: string;
}

export default function FixedHeader({ className = '' }: FixedHeaderProps) {
  // Elementos del menú para el componente MobileMenu
  const menuItems = [
    { label: 'Nuestra Empresa', href: '#', icon: '🏢' },
    { label: 'Usuarios', href: '#', icon: '👥' },
    { label: 'Proveedores', href: '#', icon: '🏭' },
    { label: 'Contáctenos', href: '#', icon: '📞' }
  ];

  return (
    <header className={`bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-[9999] ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
            <img 
              src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
              alt="ElectroHuila Logo"
              className="h-10 md:h-12 w-auto object-contain cursor-pointer"
              width="120"
              height="29"
            />
          </Link>
        </div>
        
        {/* Menú Desktop */}
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Nuestra Empresa</a>
          <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Usuarios</a>
          <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Proveedores</a>
          <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Contáctenos</a>
        </nav>
        
        {/* Botón Paga tu Factura - Desktop */}
        <button className="hidden md:flex bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          📄 Paga tu Factura
        </button>
        
        {/* Contenedor para móvil - Botón factura + Menú hamburguesa */}
        <div className="flex md:hidden items-center space-x-3">
          {/* Botón Paga tu Factura - Móvil (versión compacta) */}
          <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md">
            📄 Factura
          </button>
          
          {/* Menú Hamburguesa */}
          <MobileMenu menuItems={menuItems} />
        </div>
      </div>
    </header>
  );
}