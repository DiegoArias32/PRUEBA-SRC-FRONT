"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BackNavigationProps {
  /** Ruta específica a la que regresar (opcional) */
  backTo?: string;
  /** Texto del botón de regreso (opcional) */
  backText?: string;
  /** Mostrar breadcrumb (opcional, por defecto true) */
  showBreadcrumb?: boolean;
  /** Items del breadcrumb personalizados */
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
  }>;
}

export default function BackNavigation({ 
  backTo, 
  backText = "Volver", 
  showBreadcrumb = true,
  breadcrumbItems
}: BackNavigationProps) {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCurrentPath(window.location.pathname);
  }, []);

  const handleBack = () => {
    if (backTo) {
      router.push(backTo);
    } else {
      router.back();
    }
  };

  // Breadcrumb por defecto basado en la URL actual
  const getDefaultBreadcrumb = (): Array<{ label: string; href?: string }> => {
    if (!isClient) return [{ label: 'Inicio', href: '/' }];
    
    const items: Array<{ label: string; href?: string }> = [
      { label: 'Inicio', href: '/' }
    ];

    // Manejar cada ruta específicamente
    if (currentPath === '/servicios') {
      // Solo mostrar Inicio > Servicios
      items.push({ label: 'Servicios' });
    } else if (currentPath === '/agendamiento-citas') {
      items.push({ label: 'Servicios', href: '/servicios' });
      items.push({ label: 'Agendar Citas' });
    } else if (currentPath === '/gestion-citas') {
      items.push({ label: 'Servicios', href: '/servicios' });
      items.push({ label: 'Consultar Citas' });
    } else if (currentPath === '/cuentas-nuevas') {
      items.push({ label: 'Servicios', href: '/servicios' });
      items.push({ label: 'Cuentas Nuevas' });
    } else if (currentPath === '/proyecto-nuevo') {
      items.push({ label: 'Servicios', href: '/servicios' });
      items.push({ label: 'Proyecto Nuevo' });
    }

    return items;
  };

  const items = breadcrumbItems || getDefaultBreadcrumb();

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      {showBreadcrumb && items.length > 1 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {items.map((item, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {item.href && index < items.length - 1 ? (
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-[#1797D5] hover:text-[#203461] transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={`text-sm font-medium ${
                    index === items.length - 1 
                      ? 'text-[#203461]' 
                      : 'text-[#1797D5] hover:text-[#203461] cursor-pointer'
                  }`}>
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Botón de regreso */}
      <button
        onClick={handleBack}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#1797D5] hover:text-[#203461] bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        {backText}
      </button>
    </div>
  );
}