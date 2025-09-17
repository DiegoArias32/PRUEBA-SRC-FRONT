'use client';

import React from 'react';

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Página en Mantenimiento</h1>
        <p className="text-gray-600 mb-6">
          Estamos realizando mejoras en esta sección. Por favor, vuelve más tarde.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Disculpa las molestias. Estamos trabajando para brindarte un mejor servicio.
        </p>
        <a 
          href="/servicios" 
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          ← Volver a Servicios
        </a>
      </div>
    </div>
  );
};

export default MaintenancePage;