'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/ProtectedRoute';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Gradient Border Effect */}
          <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 h-1"></div>
          
          <div className="p-8">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso No Autorizado
            </h1>
            
            {/* Message */}
            <p className="text-gray-600 mb-6">
              No tienes permisos para acceder a esta sección del sistema. 
              Contacta al administrador si crees que esto es un error.
            </p>

            {/* User Info */}
            {user && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                <p className="text-gray-700">
                  <strong>Usuario actual:</strong> {user.username}
                </p>
                <p className="text-gray-700">
                  <strong>Email:</strong> {user.email}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/admin"
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-[#1797D5] text-white font-medium rounded-xl hover:bg-[#1A6192] transition-colors duration-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Volver al Panel Principal
              </Link>

              <button
                onClick={logout}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors duration-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>

              <Link
                href="/"
                className="block text-[#1797D5] hover:text-[#1A6192] font-medium transition-colors duration-300"
              >
                ← Ir al Inicio
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-sm text-gray-600">
          <p>¿Necesitas ayuda?</p>
          <p>Contacta al administrador del sistema</p>
        </div>
      </div>
    </div>
  );
}