import { apiService } from '@/services/api';

export class AuthUtils {
  /**
   * Verifica si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    return apiService.isAuthenticated();
  }

  /**
   * Obtiene el usuario actual
   */
  static getCurrentUser() {
    return apiService.getCurrentUser();
  }

  /**
   * Obtiene los roles del usuario actual
   */
  static getCurrentUserRoles(): string[] {
    return apiService.getCurrentUserRoles();
  }

  /**
   * Obtiene los permisos del usuario actual
   */
  static getCurrentUserPermissions(): string[] {
    return apiService.getCurrentUserPermissions();
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  static hasRole(role: string): boolean {
    const userRoles = this.getCurrentUserRoles();
    return userRoles.includes(role);
  }

  /**
   * Verifica si el usuario es administrador
   */
  static isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  static hasPermission(permission: string): boolean {
    const userPermissions = this.getCurrentUserPermissions();
    return userPermissions.includes(permission);
  }

  /**
   * Verifica si el usuario tiene un permiso granular específico en un formulario
   */
  static hasFormPermission(formCode: string, permission: 'read' | 'create' | 'update' | 'delete'): boolean {
    return apiService.hasFormPermission(formCode, permission);
  }

  /**
   * Obtiene permisos granulares del usuario actual
   */
  static getCurrentUserPermissionsDetailed() {
    return apiService.getCurrentUserPermissionsDetailed();
  }

  /**
   * Obtiene módulos del usuario actual
   */
  static getCurrentUserModules() {
    return apiService.getCurrentUserModules();
  }

  /**
   * Intenta refrescar el token automáticamente
   */
  static async refreshTokenIfNeeded(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await apiService.refreshToken(refreshToken);
      
      // Actualizar tokens en localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('roles', JSON.stringify(response.roles));
      localStorage.setItem('permissions', JSON.stringify(response.permissions));
      
      return true;
    } catch (error) {
      console.error('Error refrescando token:', error);
      return false;
    }
  }

  /**
   * Cerrar sesión completamente
   */
  static async logout(): Promise<void> {
    await apiService.logout();
    
    // Redirigir al login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Configurar interceptor para refrescar tokens automáticamente
   * Este método debe ser llamado al inicializar la aplicación
   */
  static setupTokenRefreshInterceptor(): void {
    // Interceptar respuestas 401 y intentar refrescar token
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        // Intentar refrescar token una sola vez
        const refreshed = await this.refreshTokenIfNeeded();
        if (refreshed) {
          // Reintentar la petición original con el nuevo token
          const token = localStorage.getItem('token');
          const [url, options = {}] = args;
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${token}`
            }
          };
          return originalFetch(url, newOptions);
        }
      }
      
      return response;
    };
  }

  /**
   * Guardar datos de autenticación después del login exitoso
   */
  static saveAuthData(loginResponse: any): void {
    localStorage.setItem('token', loginResponse.token);
    localStorage.setItem('refreshToken', loginResponse.refreshToken);
    localStorage.setItem('user', JSON.stringify(loginResponse.user));
    localStorage.setItem('roles', JSON.stringify(loginResponse.roles));
    localStorage.setItem('permissions', JSON.stringify(loginResponse.permissions));
    
    // Guardar permisos granulares si existen
    if (loginResponse.userPermissions) {
      localStorage.setItem('userPermissions', JSON.stringify(loginResponse.userPermissions));
    }
    
    // Mantener compatibilidad con el sistema existente
    localStorage.setItem('empleado_logueado', 'true');
    localStorage.setItem('empleado_username', loginResponse.user.username);
  }

  /**
   * Limpiar todos los datos de autenticación
   */
  static clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    localStorage.removeItem('permissions');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('empleado_logueado');
    localStorage.removeItem('empleado_username');
  }

  /**
   * Verificar si el token está próximo a expirar (dentro de 5 minutos)
   */
  static isTokenNearExpiry(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = currentTime + (5 * 60); // 5 minutos
      
      return payload.exp <= fiveMinutesFromNow;
    } catch {
      return true;
    }
  }
}

export default AuthUtils;