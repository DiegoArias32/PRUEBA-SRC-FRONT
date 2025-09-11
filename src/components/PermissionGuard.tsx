"use client";

import { ReactNode } from 'react';
import AuthUtils from '@/utils/auth';

interface PermissionGuardProps {
  children: ReactNode;
  formCode: string;
  permission: 'read' | 'create' | 'update' | 'delete';
  fallback?: ReactNode;
}

/**
 * Componente que renderiza contenido solo si el usuario tiene el permiso específico
 * 
 * @example
 * <PermissionGuard formCode="CITAS" permission="create">
 *   <button onClick={createCita}>Crear Cita</button>
 * </PermissionGuard>
 */
export default function PermissionGuard({ 
  children, 
  formCode, 
  permission, 
  fallback = null 
}: PermissionGuardProps) {
  const hasPermission = AuthUtils.hasFormPermission(formCode, permission);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Hook personalizado para usar en componentes funcionales
export function usePermission(formCode: string, permission: 'read' | 'create' | 'update' | 'delete') {
  return AuthUtils.hasFormPermission(formCode, permission);
}

// Hook para obtener todos los permisos de un formulario
export function useFormPermissions(formCode: string) {
  const permissions = AuthUtils.getCurrentUserPermissionsDetailed();
  return permissions.forms[formCode] || null;
}

// Hook para obtener módulos del usuario
export function useUserModules() {
  return AuthUtils.getCurrentUserModules();
}