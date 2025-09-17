'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthUtils from '@/utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission 
}: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si está autenticado
        if (!AuthUtils.isAuthenticated()) {
          // Intentar refrescar token
          const refreshed = await AuthUtils.refreshTokenIfNeeded();
          if (!refreshed) {
            router.push('/login');
            return;
          }
        }

        // Verificar rol si es requerido
        if (requiredRole && !AuthUtils.hasRole(requiredRole)) {
          router.push('/unauthorized');
          return;
        }

        // Verificar permiso si es requerido
        if (requiredPermission && !AuthUtils.hasPermission(requiredPermission)) {
          router.push('/unauthorized');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole, requiredPermission]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1797D5] mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // El router.push ya se encarga de la redirección
  }

  return <>{children}</>;
}

// Hook personalizado para verificar autenticación
export function useAuth() {
  const [user, setUser] = useState(AuthUtils.getCurrentUser());
  const [roles, setRoles] = useState(AuthUtils.getCurrentUserRoles());
  const [permissions, setPermissions] = useState(AuthUtils.getCurrentUserPermissions());
  const [permissionsDetailed, setPermissionsDetailed] = useState(AuthUtils.getCurrentUserPermissionsDetailed());
  const [isAuthenticated, setIsAuthenticated] = useState(AuthUtils.isAuthenticated());

  useEffect(() => {
    // Actualizar estado cuando cambie el localStorage
    const handleStorageChange = () => {
      setUser(AuthUtils.getCurrentUser());
      setRoles(AuthUtils.getCurrentUserRoles());
      setPermissions(AuthUtils.getCurrentUserPermissions());
      setPermissionsDetailed(AuthUtils.getCurrentUserPermissionsDetailed());
      setIsAuthenticated(AuthUtils.isAuthenticated());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = async () => {
    await AuthUtils.logout();
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setPermissionsDetailed({ forms: {}, modules: [] });
    setIsAuthenticated(false);
  };

  return {
    user,
    roles,
    permissions,
    permissionsDetailed,
    isAuthenticated,
    logout,
    hasRole: (role: string) => roles.includes(role),
    hasPermission: (permission: string) => permissions.includes(permission),
    isAdmin: () => roles.includes('ADMIN')
  };
}