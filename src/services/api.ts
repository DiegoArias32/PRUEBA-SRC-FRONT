const API_BASE_URL = 'http://164.152.30.207:5000/api';

// ===== INTERFACES DE AUTENTICACIÓN =====
export interface LoginDto {
  usernameOrEmail: string;
  password: string;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  roles: string[];
  allowedTabs?: string[]; // Nuevas pestañas permitidas para empleados
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface FormPermissionDto {
  formCode: string;
  formName: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  moduleCode: string;
  moduleName: string;
}

export interface ModuleDto {
  id: number;
  name: string;
  code: string;
  forms: FormDto[];
}

export interface FormDto {
  id?: number;
  name: string;
  code: string;
}

export interface UserPermissionsDto {
  forms: { [formCode: string]: FormPermissionDto };
  modules: ModuleDto[];
}

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
  roles: string[];
  userPermissions: UserPermissionsDto;
  /** @deprecated Usar userPermissions.forms para permisos granulares */
  permissions: string[];
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  roleIds: number[];
}

export interface UpdateUserDto {
  id: number;
  username?: string;
  email?: string;
  roleIds?: number[];
}

export interface RolDto {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface UpdateRolDto {
  id: number;
  name?: string;
  code?: string;
}

// ===== INTERFACES DE GESTIÓN DE PESTAÑAS POR EMPLEADO =====
export interface UserTabPermissionDto {
  userId: number;
  username: string;
  email: string;
  allowedTabs: string[];
}

export interface UpdateUserTabsDto {
  userId: number;
  allowedTabs: string[];
}

export interface TabPermissionDto {
  tabId: string;
  tabName: string;
  tabIcon: string;
  isAllowed: boolean;
}

// ===== INTERFACES DE GESTIÓN DE PERMISOS =====
export interface PermissionViewDto {
  id: number;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  description: string;
  createdAt: string; // Se recibe como string ISO desde la API
}

export interface CreatePermissionDto {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface RolPermissionSummaryDto {
  rolId: number;
  rolName: string;
  rolCode: string;
  formPermissions: FormPermissionSummaryDto[];
}

export interface FormPermissionSummaryDto {
  formId: number;
  formName: string;
  formCode: string;
  assignedPermission?: PermissionSummaryDto;
  hasPermission: boolean;
}

export interface PermissionSummaryDto {
  id: number;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  description: string;
}

export interface RolFormPermissionDetailDto {
  id: number;
  rolId: number;
  rolName: string;
  rolCode: string;
  formId: number;
  formName: string;
  formCode: string;
  permissionId: number;
  permission: PermissionSummaryDto;
  assignedAt: string;
}

export interface AssignPermissionToRolDto {
  rolId: number;
  formId: number;
  permissionId: number;
}

export interface RemovePermissionFromRolDto {
  rolId: number;
  formId: number;
}

export interface UpdateRolFormPermissionDto {
  RolId: number;
  FormId: number;
  PermissionId?: number; // null para remover, valor para asignar/actualizar
}

// Interfaces existentes
export interface CitaDto {
  id: number;
  numeroCita: string;
  fechaCita: string;
  horaCita: string;
  estado: string;
  observaciones?: string;
  fechaCompletada?: string;
  tecnicoAsignado?: string;
  observacionesTecnico?: string;
  clienteId: number;
  sedeId: number;
  tipoCitaId: number;
  clienteNombre?: string;
  clienteNumero?: string;
  clienteDocumento?: string;
  sedeNombre?: string;
  sedeDireccion?: string;
  tipoCitaNombre?: string;
  tipoCitaIcono?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  status: boolean;
}

export interface UpdateCitaDto {
  id: number;
  numeroCita?: string;
  fechaCita?: string;
  horaCita?: string;
  estado?: string;
  observaciones?: string;
  fechaCompletada?: string;
  tecnicoAsignado?: string;
  observacionesTecnico?: string;
  clienteId?: number;
  sedeId?: number;
  tipoCitaId?: number;
}

export interface ClienteDto {
  id: number;
  numeroCliente: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  status: boolean;
}

export interface UpdateClienteDto {
  id: number;
  numeroCliente?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
}

export interface SedeDto {
  id: number;
  nombre: string;
  codigo: string;
  direccion: string;
  telefono?: string;
  ciudad: string;
  departamento: string;
  esPrincipal: boolean;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  status: boolean;
}

export interface UpdateSedeDto {
  id: number;
  nombre?: string;
  codigo?: string;
  direccion?: string;
  telefono?: string;
  ciudad?: string;
  departamento?: string;
  esPrincipal?: boolean;
}

export interface TipoCitaDto {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  tiempoEstimadoMinutos: number;
  requiereDocumentacion: boolean;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  status: boolean;
}

export interface UpdateTipoCitaDto {
  id: number;
  nombre?: string;
  descripcion?: string;
  icono?: string;
  tiempoEstimadoMinutos?: number;
  requiereDocumentacion?: boolean;
}

export interface HoraDisponibleDto {
  id: number;
  hora: string; // En TypeScript usamos string para representar TimeSpan
  sedeId: number;
  tipoCitaId?: number;
  sedeNombre?: string;
  tipoCitaNombre?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  status: boolean;
}

export interface UpdateHoraDisponibleDto {
  id: number;
  hora?: string;
  sedeId?: number;
  tipoCitaId?: number;
}

// API Service Class
class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expirado o inválido
        this.clearAuthData();
        window.location.href = '/login';
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en ${endpoint}:`, error);
      throw error;
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    localStorage.removeItem('permissions');
    localStorage.removeItem('empleado_logueado');
    localStorage.removeItem('empleado_username');
  }

  // ===== MÉTODOS DE AUTENTICACIÓN =====
  async login(loginData: LoginDto): Promise<LoginResponseDto> {
    return this.request<LoginResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  async refreshToken(refreshToken: string): Promise<LoginResponseDto> {
    return this.request<LoginResponseDto>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await this.request<void>('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.warn('Error durante logout:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Método para obtener datos del usuario actual
  getCurrentUser(): UserDto | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Método para obtener roles del usuario actual
  getCurrentUserRoles(): string[] {
    const rolesStr = localStorage.getItem('roles');
    return rolesStr ? JSON.parse(rolesStr) : [];
  }

  // Método para obtener permisos del usuario actual
  getCurrentUserPermissions(): string[] {
    const permissionsStr = localStorage.getItem('permissions');
    return permissionsStr ? JSON.parse(permissionsStr) : [];
  }

  // Método para obtener permisos granulares del usuario actual
  getCurrentUserPermissionsDetailed(): UserPermissionsDto {
    const userPermissionsStr = localStorage.getItem('userPermissions');
    return userPermissionsStr ? JSON.parse(userPermissionsStr) : { forms: {}, modules: [] };
  }

  // Método para verificar permiso específico en un formulario
  hasFormPermission(formCode: string, permission: 'read' | 'create' | 'update' | 'delete'): boolean {
    const userPermissions = this.getCurrentUserPermissionsDetailed();
    const formPermission = userPermissions.forms[formCode];
    if (!formPermission) return false;
    
    switch (permission) {
      case 'read': return formPermission.canRead;
      case 'create': return formPermission.canCreate;
      case 'update': return formPermission.canUpdate;
      case 'delete': return formPermission.canDelete;
      default: return false;
    }
  }

  // Método para obtener módulos del usuario actual
  getCurrentUserModules(): ModuleDto[] {
    const userPermissions = this.getCurrentUserPermissionsDetailed();
    return userPermissions.modules;
  }

  // ===== MÉTODOS PARA ACTUALIZAR PERMISOS DESDE EL SERVIDOR =====
  
  async getCurrentUserFromServer(): Promise<UserDto | null> {
    try {
      
      // Usar el endpoint específico para obtener información del usuario actual
      const userInfo = await this.request<any>('/auth/user-info');
      
      // Mapear la respuesta al formato UserDto esperado
      const user: UserDto = {
        id: parseInt(userInfo.id),
        username: userInfo.username,
        email: userInfo.email,
        roles: userInfo.roles || [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Actualizar localStorage con los datos frescos
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Error al obtener usuario desde servidor:', error);
      return null;
    }
  }

  async getCurrentUserRolesFromServer(): Promise<string[] | null> {
    try {
      const user = await this.getCurrentUserFromServer();
      if (!user || !user.roles) return null;
      
      const roles = user.roles;
      
      // Actualizar localStorage
      localStorage.setItem('roles', JSON.stringify(roles));
      
      return roles;
    } catch (error) {
      console.error('Error al obtener roles desde servidor:', error);
      return null;
    }
  }

  async getCurrentUserPermissionsFromServer(): Promise<UserPermissionsDto | null> {
    try {
      // Usar el endpoint de permisos del usuario actual
      const permissions = await this.request<UserPermissionsDto>('/auth/permissions');
      
      
      // Actualizar localStorage
      localStorage.setItem('userPermissions', JSON.stringify(permissions));
      
      // También actualizar los permisos simples para compatibilidad
      const simplePermissions = Object.keys(permissions.forms);
      localStorage.setItem('permissions', JSON.stringify(simplePermissions));
      
      return permissions;
    } catch (error) {
      console.error('Error al obtener permisos desde servidor:', error);
      return null;
    }
  }

  // ===== MÉTODOS DE USUARIOS =====
  async getUsers(): Promise<UserDto[]> {
    return this.request<UserDto[]>('/user');
  }

  async getUserById(id: number): Promise<UserDto> {
    return this.request<UserDto>(`/user/${id}`);
  }

  async createUser(userData: CreateUserDto): Promise<UserDto> {
    return this.request<UserDto>('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(updateData: UpdateUserDto): Promise<UserDto> {
    return this.request<UserDto>('/user', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.request<boolean>(`/user/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteLogicalUser(id: number): Promise<boolean> {
    return this.request<boolean>(`/user/delete-logical/${id}`, {
      method: 'PATCH',
    });
  }

  // ===== MÉTODOS DE ROLES =====
  async getRoles(): Promise<RolDto[]> {
    return this.request<RolDto[]>('/rol');
  }

  async getRolById(id: number): Promise<RolDto> {
    return this.request<RolDto>(`/rol/${id}`);
  }

  async createRol(rol: Omit<RolDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<RolDto> {
    return this.request<RolDto>('/rol', {
      method: 'POST',
      body: JSON.stringify(rol),
    });
  }

  async updateRol(rol: UpdateRolDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/rol', {
      method: 'PUT',
      body: JSON.stringify(rol),
    });
  }

  async deleteRol(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/rol/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteLogicalRol(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/rol/delete-logical/${id}`, {
      method: 'PATCH',
    });
  }

  async getRolByCode(code: string): Promise<RolDto> {
    return this.request<RolDto>(`/rol/by-code/${code}`);
  }

  async getRolesByUserId(userId: number): Promise<RolDto[]> {
    return this.request<RolDto[]>(`/rol/by-user/${userId}`);
  }

  // MÉTODOS PARA OBTENER TODOS LOS ROLES (INCLUYENDO INACTIVOS)
  async getAllRolesIncludingInactive(): Promise<RolDto[]> {
    return this.request<RolDto[]>('/rol/all-including-inactive');
  }

  // CITAS
  async getCitas(): Promise<CitaDto[]> {
    return this.request<CitaDto[]>('/cita');
  }

  async getCitaById(id: number): Promise<CitaDto> {
    return this.request<CitaDto>(`/cita/${id}`);
  }

  async createCita(cita: Omit<CitaDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<CitaDto> {
    return this.request<CitaDto>('/cita', {
      method: 'POST',
      body: JSON.stringify(cita),
    });
  }

  async updateCita(cita: UpdateCitaDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/cita/update', {
      method: 'PATCH',
      body: JSON.stringify(cita),
    });
  }

  async deleteCita(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/cita/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteLogicalCita(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/cita/delete-logical/${id}`, {
      method: 'PATCH',
    });
  }

  async getCitasPendientes(): Promise<CitaDto[]> {
    return this.request<CitaDto[]>('/cita/pendientes');
  }

  async getCitasCompletadas(): Promise<CitaDto[]> {
    return this.request<CitaDto[]>('/cita/completadas');
  }

  async cancelarCita(citaId: number, observaciones: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/cita/cancelar/${citaId}`, {
      method: 'PATCH',
      body: JSON.stringify(observaciones),
    });
  }

  async completarCita(citaId: number, tecnicoAsignado: string, observacionesTecnico: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/cita/completar/${citaId}`, {
      method: 'PATCH',
      body: JSON.stringify({ tecnicoAsignado, observacionesTecnico }),
    });
  }

  // CLIENTES
  async getClientes(): Promise<ClienteDto[]> {
    return this.request<ClienteDto[]>('/cliente');
  }

  async getClienteById(id: number): Promise<ClienteDto> {
    return this.request<ClienteDto>(`/cliente/${id}`);
  }

  async createCliente(cliente: Omit<ClienteDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClienteDto> {
    return this.request<ClienteDto>('/cliente', {
      method: 'POST',
      body: JSON.stringify(cliente),
    });
  }

  async updateCliente(cliente: UpdateClienteDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/cliente/update', {
      method: 'PATCH',
      body: JSON.stringify(cliente),
    });
  }

  async deleteCliente(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/cliente/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteLogicalCliente(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/cliente/delete-logical/${id}`, {
      method: 'PATCH',
    });
  }

  async getClienteByNumero(numeroCliente: string): Promise<ClienteDto> {
    return this.request<ClienteDto>(`/cliente/numero/${numeroCliente}`);
  }

  // SEDES
  async getSedes(): Promise<SedeDto[]> {
    return this.request<SedeDto[]>('/sede');
  }

  async getSedeById(id: number): Promise<SedeDto> {
    return this.request<SedeDto>(`/sede/${id}`);
  }

  async createSede(sede: Omit<SedeDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<SedeDto> {
    return this.request<SedeDto>('/sede', {
      method: 'POST',
      body: JSON.stringify(sede),
    });
  }

  async updateSede(sede: UpdateSedeDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/sede/update', {
      method: 'PATCH',
      body: JSON.stringify(sede),
    });
  }

  async deleteSede(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/sede/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteLogicalSede(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/sede/delete-logical/${id}`, {
      method: 'PATCH',
    });
  }

  async getSedesActivas(): Promise<SedeDto[]> {
    return this.request<SedeDto[]>('/sede/activas');
  }

  // TIPOS DE CITA
  async getTiposCita(): Promise<TipoCitaDto[]> {
    return this.request<TipoCitaDto[]>('/tipocita');
  }

  async getTipoCitaById(id: number): Promise<TipoCitaDto> {
    return this.request<TipoCitaDto>(`/tipocita/${id}`);
  }

  async createTipoCita(tipoCita: Omit<TipoCitaDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<TipoCitaDto> {
    return this.request<TipoCitaDto>('/tipocita', {
      method: 'POST',
      body: JSON.stringify(tipoCita),
    });
  }

  async updateTipoCita(tipoCita: UpdateTipoCitaDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/tipocita/update', {
      method: 'PATCH',
      body: JSON.stringify(tipoCita),
    });
  }

  async deleteTipoCita(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/tipocita/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteLogicalTipoCita(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/tipocita/delete-logical/${id}`, {
      method: 'PATCH',
    });
  }

  async getTiposCitaActivos(): Promise<TipoCitaDto[]> {
    return this.request<TipoCitaDto[]>('/tipocita/activos');
  }

  // HORAS DISPONIBLES
  async getAllHorasDisponibles(): Promise<HoraDisponibleDto[]> {
    return this.request<HoraDisponibleDto[]>('/horadisponible');
  }

  async getHoraDisponibleById(id: number): Promise<HoraDisponibleDto> {
    return this.request<HoraDisponibleDto>(`/horadisponible/${id}`);
  }

  async createHoraDisponible(hora: Omit<HoraDisponibleDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<HoraDisponibleDto> {
    return this.request<HoraDisponibleDto>('/horadisponible', {
      method: 'POST',
      body: JSON.stringify(hora),
    });
  }

  async updateHoraDisponible(hora: UpdateHoraDisponibleDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/horadisponible/update', {
      method: 'PATCH',
      body: JSON.stringify(hora),
    });
  }

  async deleteHoraDisponible(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/horadisponible/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteLogicalHoraDisponible(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/horadisponible/delete-logical/${id}`, {
      method: 'PATCH',
    });
  }

  async getHorasDisponiblesBySede(sedeId: number): Promise<HoraDisponibleDto[]> {
    return this.request<HoraDisponibleDto[]>(`/horadisponible/sede/${sedeId}`);
  }

  async getHorasDisponiblesByTipoCita(tipoCitaId: number): Promise<HoraDisponibleDto[]> {
    return this.request<HoraDisponibleDto[]>(`/horadisponible/tipocita/${tipoCitaId}`);
  }

  // MÉTODOS PARA OBTENER TODOS (INCLUYENDO INACTIVOS)
  async getAllCitasIncludingInactive(): Promise<CitaDto[]> {
    return this.request<CitaDto[]>('/cita/all-including-inactive');
  }

  async getAllClientesIncludingInactive(): Promise<ClienteDto[]> {
    return this.request<ClienteDto[]>('/cliente/all-including-inactive');
  }

  async getAllSedesIncludingInactive(): Promise<SedeDto[]> {
    return this.request<SedeDto[]>('/sede/all-including-inactive');
  }

  async getAllTiposCitaIncludingInactive(): Promise<TipoCitaDto[]> {
    return this.request<TipoCitaDto[]>('/tipocita/all-including-inactive');
  }

  async getAllHorasDisponiblesIncludingInactive(): Promise<HoraDisponibleDto[]> {
    return this.request<HoraDisponibleDto[]>('/horadisponible/all-including-inactive');
  }

  // MÉTODO SIMPLIFICADO PARA OBTENER HORAS DISPONIBLES - SOLO DESDE BASE DE DATOS
  
  /**
   * Obtiene las horas disponibles para una fecha y sede específica
   * SOLO retorna las horas que están configuradas en la base de datos
   * Si no hay endpoint en el backend, usa las horas configuradas para la sede
   */
  async getHorasDisponibles(fecha: string, sedeId: number): Promise<string[]> {
    try {
      // Intentar obtener horas desde el endpoint del backend (horas disponibles para la fecha específica)
      const response = await this.request<string[]>(`/cita/horas-disponibles?fecha=${fecha}&sedeId=${sedeId}`);
      return response || [];
    } catch (error) {
      console.warn('Endpoint de horas disponibles no implementado, obteniendo desde configuración de sede:', error);
      
      try {
        // Si no existe el endpoint, obtener las horas configuradas para la sede
        // y filtrar las que ya están ocupadas en esa fecha
        const horasConfiguradas = await this.getHorasDisponiblesBySede(sedeId);
        
        if (horasConfiguradas.length === 0) {
          console.warn('No hay horas configuradas para esta sede en la base de datos');
          return [];
        }

        // Extraer solo las horas activas
        const horasDisponibles = horasConfiguradas
          .filter(h => h.isActive)
          .map(h => h.hora)
          .sort();

        // Filtrar horas ya ocupadas en esa fecha
        const horasLibres = await this.filterOccupiedHours(horasDisponibles, fecha, sedeId);
        return horasLibres;
        
      } catch (configError) {
        console.error('Error al obtener horas configuradas de la sede:', configError);
        return [];
      }
    }
  }

  /**
   * Filtra las horas que ya están ocupadas por citas existentes en una fecha específica
   */
  private async filterOccupiedHours(horasDisponibles: string[], fecha: string, sedeId: number): Promise<string[]> {
    try {
      // Obtener todas las citas para la fecha y sede especificadas
      const todasCitas = await this.getCitas();
      const citasDelDia = todasCitas.filter(cita => 
        cita.fechaCita.split('T')[0] === fecha && 
        cita.sedeId === sedeId && 
        cita.isActive && 
        cita.estado !== 'Cancelada'
      );

      // Extraer las horas ocupadas
      const horasOcupadas = citasDelDia.map(cita => cita.horaCita);

      // Filtrar y retornar solo las horas disponibles
      return horasDisponibles.filter(hora => !horasOcupadas.includes(hora));
    } catch (error) {
      console.error('Error al filtrar horas ocupadas:', error);
      // En caso de error, retornar las horas configuradas (mejor mostrar algo que nada)
      return horasDisponibles;
    }
  }

  /**
   * Valida si una hora específica está disponible
   */
  async validarDisponibilidad(fecha: string, hora: string, sedeId: number): Promise<{ disponible: boolean }> {
    try {
      // Intentar usar endpoint del backend si existe
      return await this.request<{ disponible: boolean }>(`/cita/disponibilidad?fecha=${fecha}&hora=${hora}&sedeId=${sedeId}`);
    } catch (error) {
      console.warn('Endpoint de disponibilidad no implementado, validando manualmente:', error);
      
      // Fallback: validar manualmente usando las horas de la BD
      const horasDisponibles = await this.getHorasDisponibles(fecha, sedeId);
      return { disponible: horasDisponibles.includes(hora) };
    }
  }

  // MÉTODOS AUXILIARES PARA FORMATEO DE HORAS

  /**
   * Convierte hora en formato 24h a formato 12h con AM/PM
   */
  formatTimeForDisplay(time: string): string {
    if (!time || typeof time !== 'string') {
      return '';
    }
    
    const cleanTime = time.trim();
    if (!cleanTime.includes(':')) {
      return time;
    }
    
    const parts = cleanTime.split(':');
    if (parts.length < 2) {
      return time;
    }
    
    const [hoursStr, minutesStr] = parts;
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return time;
    }
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    return `${hour12}:${formattedMinutes} ${ampm}`;
  }

  /**
   * Convierte hora en formato 12h a formato 24h
   */
  convertTo24HourFormat(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  // ===== MÉTODOS PÚBLICOS (SIN AUTENTICACIÓN) =====
  
  /**
   * Valida un cliente público por su número
   */
  async validarClientePublico(numeroCliente: string): Promise<ClienteDto> {
    const url = `${API_BASE_URL}/public/cliente/validar/${numeroCliente}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Cliente no encontrado' }));
      throw new Error(errorData.message || 'Cliente no encontrado');
    }
    
    return await response.json();
  }

  /**
   * Obtiene sedes públicas (sin autenticación)
   */
  async getSedesPublicas(): Promise<SedeDto[]> {
    const url = `${API_BASE_URL}/public/sedes`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener sedes');
    }
    
    return await response.json();
  }

  /**
   * Obtiene tipos de cita públicos (sin autenticación)
   */
  async getTiposCitaPublicos(): Promise<TipoCitaDto[]> {
    const url = `${API_BASE_URL}/public/tipos-cita`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener tipos de cita');
    }
    
    return await response.json();
  }

  /**
   * Obtiene horas disponibles públicas (sin autenticación)
   */
  async getHorasDisponiblesPublicas(fecha: string, sedeId: number): Promise<string[]> {
    const url = `${API_BASE_URL}/public/horas-disponibles?fecha=${fecha}&sedeId=${sedeId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener horas disponibles');
    }
    
    return await response.json();
  }

  /**
   * Agenda una cita pública (sin autenticación)
   */
  async agendarCitaPublica(citaData: {
    numeroCliente: string;
    sedeId: number;
    tipoCitaId: number;
    fechaCita: string;
    horaCita: string;
    observaciones?: string;
  }): Promise<{ numeroCita: string; fechaCita: string; horaCita: string; estado: string; message: string }> {
    const url = `${API_BASE_URL}/public/agendar-cita`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(citaData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al agendar cita' }));
      throw new Error(errorData.message || 'Error al agendar cita');
    }
    
    return await response.json();
  }

  /**
   * Consulta una cita pública (sin autenticación)
   */
  async consultarCitaPublica(numeroCita: string, numeroCliente: string): Promise<{
    numeroCita: string;
    fechaCita: string;
    horaCita: string;
    estado: string;
    observaciones?: string;
    fechaCompletada?: string;
    sede: { nombre: string };
    tipoCita: { nombre: string; icono: string };
  }> {
    const url = `${API_BASE_URL}/public/cita/${numeroCita}?numeroCliente=${numeroCliente}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Cita no encontrada' }));
      throw new Error(errorData.message || 'Cita no encontrada');
    }
    
    return await response.json();
  }

  /**
   * Obtiene las citas de un cliente (sin autenticación)
   */
  async getCitasClientePublico(numeroCliente: string): Promise<CitaDto[]> {
    const url = `${API_BASE_URL}/public/cliente/${numeroCliente}/citas`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al obtener citas' }));
      throw new Error(errorData.message || 'Error al obtener las citas del cliente');
    }
    
    return await response.json();
  }

  /**
   * Cancela una cita pública (sin autenticación)
   */
  async cancelarCitaPublica(numeroCliente: string, citaId: number, motivoCancelacion: string): Promise<{ message: string }> {
    const url = `${API_BASE_URL}/public/cliente/${numeroCliente}/cita/${citaId}/cancelar`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(motivoCancelacion)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al cancelar cita' }));
      throw new Error(errorData.message || 'Error al cancelar la cita');
    }
    
    return await response.json();
  }

  /**
   * Verifica una cita por código QR (sin autenticación)
   */
  async verificarCitaPorQR(numeroCita: string, numeroCliente: string): Promise<{
    valida: boolean;
    numeroCita: string;
    fechaCita: string;
    horaCita: string;
    estado: string;
    estadoDescripcion: string;
    cliente: { numeroCliente: string; nombreCompleto: string };
    sede: { nombre: string; direccion: string };
    tipoCita: { nombre: string; icono: string };
    fechaCreacion: string;
    observaciones?: string;
    message: string;
  }> {
    const url = `${API_BASE_URL}/public/verificar-cita?numero=${encodeURIComponent(numeroCita)}&cliente=${encodeURIComponent(numeroCliente)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error de verificación', valida: false }));
      throw new Error(errorData.message || 'Error al verificar la cita');
    }
    
    return await response.json();
  }

  // ===== GESTIÓN DE PERMISOS =====
  
  /**
   * Obtiene todos los permisos disponibles
   */
  async getAllPermissions(): Promise<PermissionViewDto[]> {
    return this.request<PermissionViewDto[]>('/permissionmanagement/permissions');
  }

  /**
   * Obtiene resumen de permisos de todos los roles
   */
  async getAllRolPermissionsSummary(): Promise<RolPermissionSummaryDto[]> {
    return this.request<RolPermissionSummaryDto[]>('/permissionmanagement/roles-permissions-summary');
  }

  /**
   * Obtiene resumen de permisos de un rol específico
   */
  async getRolPermissionsSummary(rolId: number): Promise<RolPermissionSummaryDto> {
    return this.request<RolPermissionSummaryDto>(`/permissionmanagement/roles/${rolId}/permissions-summary`);
  }

  /**
   * Obtiene detalles de asignaciones de permisos
   */
  async getRolFormPermissions(rolId?: number, formId?: number): Promise<RolFormPermissionDetailDto[]> {
    const params = new URLSearchParams();
    if (rolId) params.append('rolId', rolId.toString());
    if (formId) params.append('formId', formId.toString());
    
    const endpoint = `/permissionmanagement/assignments?${params.toString()}`;
    return this.request<RolFormPermissionDetailDto[]>(endpoint);
  }

  /**
   * Asigna un permiso a un rol
   */
  async assignPermissionToRol(assignment: AssignPermissionToRolDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/permissionmanagement/assign', {
      method: 'POST',
      body: JSON.stringify(assignment)
    });
  }

  /**
   * Remueve un permiso de un rol
   */
  async removePermissionFromRol(removal: RemovePermissionFromRolDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/permissionmanagement/remove', {
      method: 'DELETE',
      body: JSON.stringify(removal)
    });
  }

  /**
   * Actualiza un permiso de rol
   */
  async updateRolFormPermission(update: UpdateRolFormPermissionDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/permissionmanagement/update', {
      method: 'PUT',
      body: JSON.stringify(update)
    });
  }

  /**
   * Crea un nuevo permiso
   */
  async createPermission(permission: CreatePermissionDto): Promise<PermissionViewDto> {
    return this.request<PermissionViewDto>('/permissionmanagement/permissions', {
      method: 'POST',
      body: JSON.stringify(permission)
    });
  }

  // ===== MÉTODOS DE GESTIÓN DE PESTAÑAS POR EMPLEADO =====
  
  /**
   * Obtiene todos los usuarios con sus pestañas permitidas
   */
  async getUserTabsPermissions(): Promise<UserTabPermissionDto[]> {
    return this.request<UserTabPermissionDto[]>('/permissionmanagement/user-tabs');
  }

  /**
   * Obtiene las pestañas permitidas para un usuario específico
   */
  async getUserTabsPermission(userId: number): Promise<UserTabPermissionDto> {
    return this.request<UserTabPermissionDto>(`/permissionmanagement/user-tabs/${userId}`);
  }

  /**
   * Actualiza las pestañas permitidas para un usuario
   */
  async updateUserTabs(data: UpdateUserTabsDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/permissionmanagement/user-tabs', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Obtiene todas las pestañas disponibles del sistema
   */
  async getAvailableTabs(): Promise<TabPermissionDto[]> {
    return this.request<TabPermissionDto[]>('/permissionmanagement/available-tabs');
  }

  // ==================== ENDPOINTS PÚBLICOS PARA CUENTAS NUEVAS ====================

  /**
   * Solicita una cuenta nueva (sin autenticación)
   */
  async solicitarCuentaNuevaPublica(solicitudData: {
    tipoDocumento?: string;
    numeroDocumento: string;
    nombreCompleto: string;
    telefono?: string;
    celular: string;
    email: string;
    tipoInmueble?: string;
    direccion: string;
    barrio?: string;
    municipio?: string;
    estrato?: number;
    metrosCuadrados?: number;
    numeroApartamento?: string;
    usoServicio?: string;
    tipoInstalacion?: string;
    cargaRequerida?: string;
    tipoConexion?: string;
    tieneTransformador?: string;
    distanciaRed?: string;
    sedeId: number;
    fechaCita: string;
    horaCita: string;
    observaciones?: string;
  }): Promise<{ numeroSolicitud: string; fechaCita: string; horaCita: string; estado: string; message: string }> {
    const url = `${API_BASE_URL}/public/solicitar-cuenta-nueva`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solicitudData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al solicitar cuenta nueva' }));
      throw new Error(errorData.message || 'Error al solicitar cuenta nueva');
    }
    
    return await response.json();
  }

  /**
   * Consulta una solicitud de cuenta nueva (sin autenticación)
   */
  async consultarCuentaNuevaPublica(numeroSolicitud: string, numeroDocumento: string): Promise<{
    numeroSolicitud: string;
    fechaCita: string;
    horaCita: string;
    estado: string;
    nombreCompleto: string;
    direccion: string;
    municipio: string;
    sedeNombre: string;
    tipoInstalacion: string;
    usoServicio: string;
    fechaCreacion: string;
    observaciones?: string;
  }> {
    const url = `${API_BASE_URL}/public/consultar-cuenta-nueva?numeroSolicitud=${numeroSolicitud}&numeroDocumento=${numeroDocumento}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Solicitud no encontrada' }));
      throw new Error(errorData.message || 'Solicitud no encontrada');
    }
    
    return await response.json();
  }
}

export const apiService = new ApiService();