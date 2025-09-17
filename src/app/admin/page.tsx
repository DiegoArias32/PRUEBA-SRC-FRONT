"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  apiService, 
  CitaDto, 
 
  SedeDto, 
  TipoCitaDto,
  HoraDisponibleDto,
  UpdateCitaDto,
  UpdateSedeDto,
  UpdateTipoCitaDto,
  UpdateHoraDisponibleDto,
  UserDto,
  UpdateUserDto,
  RolDto,
  UpdateRolDto,
  FormPermissionDto,
  PermissionViewDto,
  RolPermissionSummaryDto,
  RolFormPermissionDetailDto,
  AssignPermissionToRolDto,
  UpdateRolFormPermissionDto
} from '../../services/api';
import { ValidationUtils, FormErrors } from '../../utils/validation';
import { ValidatedInput, ValidatedSelect, ValidatedTextarea } from '../../components/ValidatedInput';

type TabType = 'citas' | 'empleados' | 'roles' | 'sedes' | 'tipos-cita' | 'horas-disponibles' | 'permisos';
type ModalType = 'create' | 'edit' | 'delete' | 'activate' | null;
type ViewType = 'active' | 'inactive';
type EmpleadoFormData = Partial<UserDto> & { password?: string };

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('citas');
  const [currentView, setCurrentView] = useState<ViewType>('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<{ [formCode: string]: FormPermissionDto }>({});
  const [hasInitialPermissions, setHasInitialPermissions] = useState(false);
  const [permissionUpdateKey, setPermissionUpdateKey] = useState(0);

  // Data states
  const [citas, setCitas] = useState<CitaDto[]>([]);
  const [empleados, setEmpleados] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RolDto[]>([]);
  const [sedes, setSedes] = useState<SedeDto[]>([]);
  const [tiposCita, setTiposCita] = useState<TipoCitaDto[]>([]);
  const [horasDisponibles, setHorasDisponibles] = useState<HoraDisponibleDto[]>([]);
  const [permisos, setPermisos] = useState<PermissionViewDto[]>([]);
  const [rolPermissionsSummary, setRolPermissionsSummary] = useState<RolPermissionSummaryDto[]>([]);
  const [_rolFormPermissions, setRolFormPermissions] = useState<RolFormPermissionDetailDto[]>([]);

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<CitaDto | UserDto | RolDto | SedeDto | TipoCitaDto | HoraDisponibleDto | null>(null);

  // Form states
  const [citaForm, setCitaForm] = useState<Partial<CitaDto>>({});
  const [empleadoForm, setEmpleadoForm] = useState<EmpleadoFormData>({});
  const [rolForm, setRolForm] = useState<Partial<RolDto>>({});
  const [sedeForm, setSedeForm] = useState<Partial<SedeDto>>({});
  const [tipoCitaForm, setTipoCitaForm] = useState<Partial<TipoCitaDto>>({});
  const [horaDisponibleForm, setHoraDisponibleForm] = useState<Partial<HoraDisponibleDto>>({});

  // Validation states
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({});

  // Estado para acordeones de permisos
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set());

  // Estados para tiempo real
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para gestión de pestañas por empleado
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeTabPermissions, setEmployeeTabPermissions] = useState<{[tabId: string]: boolean}>({});
  const [isEditingTabs, setIsEditingTabs] = useState(false);
  const [originalTabPermissions, setOriginalTabPermissions] = useState<{[tabId: string]: boolean}>({});

  // Función para toggle acordeones
  const toggleRoleAccordion = (roleId: number) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // Función para refrescar datos en tiempo real
  const refreshData = async (silent = true) => {
    if (!silent) setIsRefreshing(true);
    
    try {
      await loadData(silent);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Función para configurar auto-refresh inteligente
  const setupAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    if (autoRefreshEnabled) {
      const interval = setInterval(() => {
        // Solo refrescar si no hay modales abiertos (para no interrumpir al usuario)
        if (!modalType) {
          refreshData(true); // refresh silencioso cada 30 segundos
        }
      }, 30000);
      
      setRefreshInterval(interval);
    }
  };

  // Cleanup del interval
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Setup auto-refresh cuando cambie el estado o modalType
  useEffect(() => {
    setupAutoRefresh();
  }, [autoRefreshEnabled, modalType]);

  useEffect(() => {
    const initializeUser = async () => {
      // Si se está cerrando sesión, no hacer nada
      if (isLoggingOut) return;

      // Verificar autenticación JWT
      if (!apiService.isAuthenticated()) {
        console.warn('No hay token válido, redirigiendo al login');
        router.push('/login');
        return;
      }

      try {
        // Cargar datos del usuario y permisos directamente del servidor
        const user = await apiService.getCurrentUserFromServer();
        const roles = await apiService.getCurrentUserRolesFromServer();
        const permissions = await apiService.getCurrentUserPermissionsFromServer();
        
        if (!user || !permissions) {
          console.warn('No se pudo obtener información del usuario');
          router.push('/login');
          return;
        }

        setCurrentUser(user);
        setUserRoles(roles || []);
        setUserPermissions(permissions.forms);
        setPermissionUpdateKey(prev => prev + 1);
        setHasInitialPermissions(true);
        
      } catch (error) {
        console.error('Error al inicializar usuario:', error);
        router.push('/login');
      }
    };

    initializeUser();
  }, [router, isLoggingOut]);

  // Segundo useEffect para cargar datos solo cuando los permisos están listos
  useEffect(() => {
    if (hasInitialPermissions) {
      loadData();
    }
  }, [activeTab, currentView, hasInitialPermissions]);

  const loadData = async (silent = false) => {
    // Verificar si el usuario tiene permisos para leer este formulario
    const formCode = getFormCodeForTab(activeTab);
    if (formCode && !hasPermission(formCode, 'read')) {
      // Solo mostrar error si no es un refresh silencioso
      if (!silent) {
        setError(`No tiene permisos para ver ${getTabDisplayName().toLowerCase()}`);
      }
      return;
    }

    setLoading(true);
    if (!silent) {
      setError('');
    }
    try {
      switch (activeTab) {
        case 'citas':
          // Para citas, filtrar por estado en lugar de isActive
          const citasData = await apiService.getAllCitasIncludingInactive();
          if (currentView === 'active') {
            // "Asistidas" = estado "Completada"
            setCitas(citasData.filter(c => c.estado === 'Completada'));
          } else {
            // "No asistidas" = estado "Pendiente" o "Cancelada"
            setCitas(citasData.filter(c => c.estado !== 'Completada'));
          }
          break;
        case 'empleados':
          const empleadosData = await apiService.getUsers();
          setEmpleados(currentView === 'active'
            ? empleadosData.filter(u => u.isActive)
            : empleadosData.filter(u => !u.isActive)
          );
          break;
        case 'roles':
          const rolesData = await apiService.getRoles();
          setRoles(currentView === 'active'
            ? rolesData.filter(r => r.isActive)
            : rolesData.filter(r => !r.isActive)
          );
          break;
        case 'sedes':
          const sedesData = currentView === 'active'
            ? await apiService.getSedes()
            : await apiService.getAllSedesIncludingInactive();
          setSedes(currentView === 'active'
            ? sedesData.filter(s => s.isActive)
            : sedesData.filter(s => !s.isActive)
          );
          break;
        case 'tipos-cita':
          const tiposData = currentView === 'active'
            ? await apiService.getTiposCita()
            : await apiService.getAllTiposCitaIncludingInactive();
          setTiposCita(currentView === 'active'
            ? tiposData.filter(t => t.isActive)
            : tiposData.filter(t => !t.isActive)
          );
          break;
        case 'horas-disponibles':
         const horasData = currentView === 'active'
  ? await apiService.getAllHorasDisponibles() // CORRECTO: Obtiene todas las horas configuradas
  : await apiService.getAllHorasDisponiblesIncludingInactive();
          setHorasDisponibles(currentView === 'active'
            ? horasData.filter(h => h.isActive)
            : horasData.filter(h => !h.isActive)
          );
          break;
        case 'permisos':
          // Siempre cargar permisos disponibles para los dropdowns
          const allPermisos = await apiService.getAllPermissions();
          setPermisos(allPermisos);
          
          if (currentView === 'active') {
            // Vista activa: mostrar resumen de permisos por rol
            const summary = await apiService.getAllRolPermissionsSummary();
            setRolPermissionsSummary(summary);
          }
          break;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // ===== FUNCIONES DE PERMISOS =====
  
  /**
   * Obtiene el código de formulario basado en la tab activa
   */
  const getFormCodeForTab = (tab: TabType): string | null => {
    switch (tab) {
      case 'citas': return 'CITAS';
      case 'empleados': return 'USERS';
      case 'roles': return 'ROLES';
      case 'sedes': return 'SEDES';
      case 'tipos-cita': return 'TIPOS_CITA';
      case 'horas-disponibles': return 'HORAS_DISPONIBLES';
      case 'permisos': return 'PERMISSIONS';
      default: return null;
    }
  };

  /**
   * Verifica si el usuario tiene un permiso específico en un formulario
   */
  const hasPermission = (formCode: string, permission: 'read' | 'create' | 'update' | 'delete'): boolean => {
    const formPermission = userPermissions[formCode];
    if (!formPermission) return false;
    
    switch (permission) {
      case 'read': return formPermission.canRead;
      case 'create': return formPermission.canCreate;
      case 'update': return formPermission.canUpdate;
      case 'delete': return formPermission.canDelete;
      default: return false;
    }
  };

  /**
   * Verifica si puede crear elementos en la tab actual
   */
  const canCreateInCurrentTab = (): boolean => {
    const formCode = getFormCodeForTab(activeTab);
    return formCode ? hasPermission(formCode, 'create') : false;
  };

  /**
   * Verifica si puede editar elementos en la tab actual
   */
  const canUpdateInCurrentTab = (): boolean => {
    const formCode = getFormCodeForTab(activeTab);
    return formCode ? hasPermission(formCode, 'update') : false;
  };

  /**
   * Verifica si puede eliminar elementos en la tab actual
   */
  const canDeleteInCurrentTab = (): boolean => {
    const formCode = getFormCodeForTab(activeTab);
    return formCode ? hasPermission(formCode, 'delete') : false;
  };

  /**
   * Obtiene las tabs que el usuario puede ver
   */
  const getAvailableTabs = (permissions?: { [formCode: string]: FormPermissionDto }) => {
    const permsToUse = permissions || userPermissions;
    
    const allTabs = [
      { id: 'citas', name: 'Citas', icon: '📅' },
      { id: 'empleados', name: 'Empleados', icon: '👨‍💼' },
      { id: 'roles', name: 'Roles', icon: '🔐' },
      { id: 'sedes', name: 'Sedes', icon: '🏢' },
      { id: 'tipos-cita', name: 'Tipos de Cita', icon: '📋' },
      { id: 'horas-disponibles', name: 'Horas Disponibles', icon: '🕐' },
      { id: 'permisos', name: 'Gestión de Permisos', icon: '🛡️' },
    ];

    const available = allTabs.filter(tab => {
      const formCode = getFormCodeForTab(tab.id as TabType);
      if (!formCode) return true;
      
      // Verificar permisos de formulario tradicionales
      const formPermission = permsToUse[formCode];
      const hasFormAccess = formPermission ? formPermission.canRead : false;
      
      // Verificar pestañas permitidas del usuario (allowedTabs)
      let userAllowedTabs: string[] = [];
      if (typeof window !== 'undefined') {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        userAllowedTabs = currentUser.allowedTabs || [];
      }
      const hasTabAccess = userAllowedTabs.includes(tab.id);
      
      // Permitir acceso si tiene permisos de formulario O si tiene la pestaña permitida
      return hasFormAccess || hasTabAccess;
    });
    return available;
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  // ===== FUNCIONES DE VALIDACIÓN =====
  
  const validateField = (fieldName: string, value: any, formType: string): string => {
    switch (formType) {
      case 'empleado':
        switch (fieldName) {
          case 'username':
            const usernameValidation = ValidationUtils.validateRequired(value, 'Nombre de usuario');
            if (!usernameValidation.isValid) return usernameValidation.message;
            if (value.length < 3) return 'Nombre de usuario debe tener al menos 3 caracteres';
            if (value.length > 50) return 'Nombre de usuario no puede tener más de 50 caracteres';
            break;
          case 'email':
            const emailValidation = ValidationUtils.validateEmail(value);
            if (!emailValidation.isValid) return emailValidation.message;
            break;
          case 'password':
            if (!value || value.trim() === '') return 'Contraseña es obligatoria';
            if (value.length < 6) return 'Contraseña debe tener al menos 6 caracteres';
            if (value.length > 100) return 'Contraseña no puede tener más de 100 caracteres';
            break;
        }
        break;
      
      case 'rol':
        switch (fieldName) {
          case 'name':
            const nameValidation = ValidationUtils.validateName(value, 'Nombre del rol');
            if (!nameValidation.isValid) return nameValidation.message;
            break;
          case 'code':
            if (!value || value.trim() === '') return 'Código es obligatorio';
            if (!/^[A-Z_]+$/.test(value)) return 'Código debe contener solo letras mayúsculas y guiones bajos';
            if (value.length > 50) return 'Código no puede tener más de 50 caracteres';
            break;
        }
        break;
      
      case 'sede':
        switch (fieldName) {
          case 'nombre':
            const nameValidation = ValidationUtils.validateName(value, 'Nombre de la sede');
            if (!nameValidation.isValid) return nameValidation.message;
            break;
          case 'codigo':
            if (!value || value.trim() === '') return 'Código es obligatorio';
            if (value.length > 20) return 'Código no puede tener más de 20 caracteres';
            break;
          case 'direccion':
            const addressValidation = ValidationUtils.validateAddress(value);
            if (!addressValidation.isValid) return addressValidation.message;
            break;
          case 'ciudad':
            const cityValidation = ValidationUtils.validateName(value, 'Ciudad');
            if (!cityValidation.isValid) return cityValidation.message;
            break;
          case 'departamento':
            const deptValidation = ValidationUtils.validateName(value, 'Departamento');
            if (!deptValidation.isValid) return deptValidation.message;
            break;
          case 'telefono':
            const phoneValidation = ValidationUtils.validatePhone(value, false);
            if (!phoneValidation.isValid) return phoneValidation.message;
            break;
        }
        break;
      
      case 'tipoCita':
        switch (fieldName) {
          case 'nombre':
            const nameValidation = ValidationUtils.validateName(value, 'Nombre del tipo de cita');
            if (!nameValidation.isValid) return nameValidation.message;
            break;
          case 'descripcion':
            if (value && value.length > 500) return 'Descripción no puede tener más de 500 caracteres';
            break;
          case 'tiempoEstimadoMinutos':
            if (!value || value <= 0) return 'Tiempo estimado debe ser mayor a 0';
            if (value > 480) return 'Tiempo estimado no puede ser mayor a 8 horas (480 minutos)';
            break;
        }
        break;
        
      case 'horaDisponible':
        switch (fieldName) {
          case 'hora':
            if (!value || value.trim() === '') return 'Hora es obligatoria';
            if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) return 'Formato de hora inválido (HH:MM)';
            break;
          case 'diaSemana':
            if (!value || value.trim() === '') return 'Día de la semana es obligatorio';
            const validDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            if (!validDays.includes(value)) return 'Día de la semana inválido';
            break;
        }
        break;
    }
    return '';
  };

  const validateForm = (formData: any, formType: string): FormErrors => {
    const errors: FormErrors = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field], formType);
      if (error) {
        errors[field] = error;
      }
    });
    
    return errors;
  };

  const clearFormErrors = () => {
    setFormErrors({});
    setTouchedFields({});
  };

  const handleFieldChange = (fieldName: string, value: any, formType: string) => {
    // Actualizar el campo tocado
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validar el campo si ya fue tocado
    if (touchedFields[fieldName]) {
      const error = validateField(fieldName, value, formType);
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  };

  // ===== FUNCIONES CRUD CON VALIDACIÓN DE PERMISOS =====
  
  // CITAS CRUD - Solo edición
  const handleUpdateCita = async () => {
    if (!selectedItem) {
      showError('No hay elemento seleccionado');
      return;
    }
    
    if (!canUpdateInCurrentTab()) {
      showError('No tiene permisos para editar citas');
      return;
    }
    
    try {
      const updateData: UpdateCitaDto = {
        id: selectedItem.id,
        ...citaForm
      };
      await apiService.updateCita(updateData);
      setModalType(null);
      setCitaForm({});
      showSuccess('Cita actualizada exitosamente');
      await refreshData(false);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Función para marcar cita como asistida/no asistida
  const handleToggleCitaAsistencia = async (cita: CitaDto, asistio: boolean) => {
    try {
      const nuevoEstado = asistio ? 'Completada' : 'Pendiente';
      const updateData: UpdateCitaDto = {
        id: cita.id,
        numeroCita: cita.numeroCita,
        fechaCita: cita.fechaCita,
        horaCita: cita.horaCita,
        estado: nuevoEstado,
        observaciones: cita.observaciones,
        clienteId: cita.clienteId,
        sedeId: cita.sedeId,
        tipoCitaId: cita.tipoCitaId
      };
      await apiService.updateCita(updateData);
      showSuccess(`Cita marcada como ${asistio ? 'asistida' : 'no asistida'} exitosamente`);
      await refreshData(false);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };


  const handleCreateEmpleado = async () => {
    if (!canCreateInCurrentTab()) {
      showError('No tiene permisos para crear empleados');
      return;
    }
    
    // Validar formulario
    const errors = validateForm(empleadoForm, 'empleado');
    if (ValidationUtils.hasErrors(errors)) {
      setFormErrors(errors);
      showError('Por favor corrija los errores en el formulario');
      return;
    }
    
    try {
      // Mapear nombres de roles a IDs (esto puede necesitar ajuste según la estructura real de la base de datos)
      const roleMap: { [key: string]: number } = {
        'ADMIN': 1,
        'USER': 2,
        'OPERATOR': 3
      };
      
      const roleIds = (empleadoForm.roles || []).map(role => roleMap[role]).filter(id => id !== undefined);
      
      if (roleIds.length === 0) {
        showError('Debe seleccionar al menos un rol');
        return;
      }
      
      if (!empleadoForm.username || !empleadoForm.email || !empleadoForm.password) {
        showError('Todos los campos son obligatorios');
        return;
      }
      
      await apiService.createUser({
        username: empleadoForm.username,
        email: empleadoForm.email,
        password: empleadoForm.password,
        roleIds: roleIds
      });
      
      setModalType(null);
      setEmpleadoForm({});
      clearFormErrors();
      showSuccess('Empleado creado exitosamente');
      await refreshData(false);
    } catch (err: unknown) {
      showError(`Error al crear empleado: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };


  const handleUpdateEmpleado = async () => {
    if (!selectedItem) {
      showError('No hay elemento seleccionado');
      return;
    }
    
    if (!canUpdateInCurrentTab()) {
      showError('No tiene permisos para editar empleados');
      return;
    }
    
    try {
      // Mapear nombres de roles a IDs
      const roleMap: { [key: string]: number } = {
        'ADMIN': 1,
        'USER': 2,
        'OPERATOR': 3
      };
      
      const roleIds = (empleadoForm.roles || []).map(role => roleMap[role]).filter(id => id !== undefined);
      
      if (roleIds.length === 0) {
        showError('Debe seleccionar al menos un rol');
        return;
      }
      
      if (!empleadoForm.username || !empleadoForm.email) {
        showError('Usuario y email son obligatorios');
        return;
      }
      
      const updateData: UpdateUserDto = {
        id: selectedItem.id,
        username: empleadoForm.username,
        email: empleadoForm.email,
        roleIds: roleIds
      };
      
      await apiService.updateUser(updateData);
      setModalType(null);
      setEmpleadoForm({});
      showSuccess('Empleado actualizado exitosamente');
      await refreshData(false);
    } catch (err: unknown) {
      showError(`Error al actualizar empleado: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };


  const handleDeleteEmpleado = async (id: number, logical = true) => {
    if (!canDeleteInCurrentTab()) {
      showError('No tiene permisos para eliminar empleados');
      return;
    }
    
    try {
      if (logical) {
        // Asumiendo que existe deleteLogicalUser en el backend
        await apiService.deleteLogicalUser(id);
        showSuccess('Empleado desactivado exitosamente');
      } else {
        // Asumiendo que existe deleteUser en el backend
        await apiService.deleteUser(id);
        showSuccess('Empleado eliminado exitosamente');
      }
      setModalType(null);
      await refreshData(false);
    } catch (err: unknown) {
      showError(`Error al ${logical ? 'desactivar' : 'eliminar'} empleado: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // ROLES CRUD
  const handleCreateRol = async () => {
    if (!canCreateInCurrentTab()) {
      showError('No tiene permisos para crear roles');
      return;
    }
    
    // Validar formulario
    const errors = validateForm(rolForm, 'rol');
    if (ValidationUtils.hasErrors(errors)) {
      setFormErrors(errors);
      showError('Por favor corrija los errores en el formulario');
      return;
    }
    
    try {
      const newRol = await apiService.createRol({
        ...rolForm as Omit<RolDto, 'id' | 'createdAt' | 'updatedAt'>,
        isActive: true
      });
      setRoles([...roles, newRol]);
      setModalType(null);
      setRolForm({});
      clearFormErrors();
      showSuccess('Rol creado exitosamente');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleUpdateRol = async () => {
    if (!selectedItem) {
      showError('No hay elemento seleccionado');
      return;
    }
    
    if (!canUpdateInCurrentTab()) {
      showError('No tiene permisos para editar roles');
      return;
    }
    
    try {
      const updatedData: UpdateRolDto = {
        id: selectedItem.id,
        name: rolForm.name,
        code: rolForm.code,
      };
      
      await apiService.updateRol(updatedData);
      setModalType(null);
      await refreshData(false);
      setRolForm({});
      showSuccess('Rol actualizado exitosamente');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDeleteRol = async (id: number, logical = true) => {
    if (!canDeleteInCurrentTab()) {
      showError('No tiene permisos para eliminar roles');
      return;
    }
    
    try {
      if (logical) {
        await apiService.deleteLogicalRol(id);
        showSuccess('Rol desactivado exitosamente');
      } else {
        await apiService.deleteRol(id);
        showSuccess('Rol eliminado exitosamente');
      }
      setModalType(null);
      await refreshData(false);
    } catch (err: unknown) {
      showError(`Error al ${logical ? 'desactivar' : 'eliminar'} rol: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // SEDES CRUD
  const handleCreateSede = async () => {
    if (!canCreateInCurrentTab()) {
      showError('No tiene permisos para crear sedes');
      return;
    }
    
    // Validar formulario
    const errors = validateForm(sedeForm, 'sede');
    if (ValidationUtils.hasErrors(errors)) {
      setFormErrors(errors);
      showError('Por favor corrija los errores en el formulario');
      return;
    }
    
    try {
      const newSede = await apiService.createSede({
        ...sedeForm as Omit<SedeDto, 'id' | 'createdAt' | 'updatedAt'>,
        isActive: true,
        status: true
      });
      setSedes([...sedes, newSede]);
      setModalType(null);
      setSedeForm({});
      clearFormErrors();
      showSuccess('Sede creada exitosamente');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleUpdateSede = async () => {
    if (!selectedItem) {
      showError('No hay elemento seleccionado');
      return;
    }
    
    if (!canUpdateInCurrentTab()) {
      showError('No tiene permisos para editar sedes');
      return;
    }
    
    // Validar formulario
    const errors = validateForm(sedeForm, 'sede');
    if (ValidationUtils.hasErrors(errors)) {
      setFormErrors(errors);
      showError('Por favor corrija los errores en el formulario');
      return;
    }
    
    try {
      const updateData: UpdateSedeDto = {
        id: selectedItem.id,
        ...sedeForm
      };
      await apiService.updateSede(updateData);
      setModalType(null);
      await refreshData(false);
      setSedeForm({});
      clearFormErrors();
      showSuccess('Sede actualizada exitosamente');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDeleteSede = async (id: number, logical = true) => {
    if (!canDeleteInCurrentTab()) {
      showError('No tiene permisos para eliminar sedes');
      return;
    }
    
    try {
      if (logical) {
        await apiService.deleteLogicalSede(id);
        showSuccess('Sede desactivada exitosamente');
      } else {
        await apiService.deleteSede(id);
        showSuccess('Sede eliminada exitosamente');
      }
      setModalType(null);
      await refreshData(false);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // TIPOS CITA CRUD
  const handleCreateTipoCita = async () => {
    if (!canCreateInCurrentTab()) {
      showError('No tiene permisos para crear tipos de cita');
      return;
    }
    
    // Validar formulario
    const errors = validateForm(tipoCitaForm, 'tipoCita');
    if (ValidationUtils.hasErrors(errors)) {
      setFormErrors(errors);
      showError('Por favor corrija los errores en el formulario');
      return;
    }
    
    try {
      const newTipoCita = await apiService.createTipoCita({
        ...tipoCitaForm as Omit<TipoCitaDto, 'id' | 'createdAt' | 'updatedAt'>,
        isActive: true,
        status: true
      });
      setTiposCita([...tiposCita, newTipoCita]);
      setModalType(null);
      setTipoCitaForm({});
      clearFormErrors();
      showSuccess('Tipo de cita creado exitosamente');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleUpdateTipoCita = async () => {
    if (!selectedItem) {
      showError('No hay elemento seleccionado');
      return;
    }
    
    if (!canUpdateInCurrentTab()) {
      showError('No tiene permisos para editar tipos de cita');
      return;
    }
    
    // Validar formulario
    const errors = validateForm(tipoCitaForm, 'tipoCita');
    if (ValidationUtils.hasErrors(errors)) {
      setFormErrors(errors);
      showError('Por favor corrija los errores en el formulario');
      return;
    }
    
    try {
      const updateData: UpdateTipoCitaDto = {
        id: selectedItem.id,
        ...tipoCitaForm
      };
      await apiService.updateTipoCita(updateData);
      setModalType(null);
      await refreshData(false);
      setTipoCitaForm({});
      clearFormErrors();
      showSuccess('Tipo de cita actualizado exitosamente');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDeleteTipoCita = async (id: number, logical = true) => {
    if (!canDeleteInCurrentTab()) {
      showError('No tiene permisos para eliminar tipos de cita');
      return;
    }
    
    try {
      if (logical) {
        await apiService.deleteLogicalTipoCita(id);
        showSuccess('Tipo de cita desactivado exitosamente');
      } else {
        await apiService.deleteTipoCita(id);
        showSuccess('Tipo de cita eliminado exitosamente');
      }
      setModalType(null);
      await refreshData(false);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // HORAS DISPONIBLES CRUD
const handleCreateHoraDisponible = async () => {
  if (!canCreateInCurrentTab()) {
    showError('No tiene permisos para crear horas disponibles');
    return;
  }
  
  // Validar formulario
  const errors = validateForm(horaDisponibleForm, 'horaDisponible');
  if (ValidationUtils.hasErrors(errors)) {
    setFormErrors(errors);
    showError('Por favor corrija los errores en el formulario');
    return;
  }
  
  try {

    // ✅ Estructura simplificada - Solo enviar campos necesarios para el POST
    const nuevaHoraData = {
      hora: horaDisponibleForm.hora,
      sedeId: typeof horaDisponibleForm.sedeId === 'string' ? parseInt(horaDisponibleForm.sedeId) : Number(horaDisponibleForm.sedeId),
      tipoCitaId: horaDisponibleForm.tipoCitaId ? (typeof horaDisponibleForm.tipoCitaId === 'string' ? parseInt(horaDisponibleForm.tipoCitaId) : Number(horaDisponibleForm.tipoCitaId)) : undefined,
      isActive: true,
      status: true
    };


    const newHora = await apiService.createHoraDisponible(nuevaHoraData);
    
    setHorasDisponibles([...horasDisponibles, newHora]);
    setModalType(null);
    setHoraDisponibleForm({});
    clearFormErrors();
    showSuccess('Hora disponible creada exitosamente');
    await refreshData(false);
    
  } catch (err: unknown) {
    console.error('🚨 Error completo:', err);
    
    // Ver detalles del error de validación
    let errorMessage = 'Error al crear hora disponible';
    
    if (err && typeof err === 'object') {
      if ('response' in err && err.response && typeof err.response === 'object' && 'data' in err.response) {
        console.error('🔍 Error del servidor:', err.response.data);
        const serverData = err.response.data as Record<string, unknown>;
        const serverError = (typeof serverData?.message === 'string' ? serverData.message : null) || 
                           (typeof serverData?.error === 'string' ? serverData.error : null) || 
                           (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? err.message : null);
        if (serverError) {
          errorMessage = `Error al crear hora disponible: ${serverError}`;
        }
      } else if ('message' in err && typeof err.message === 'string') {
        errorMessage = `Error al crear hora disponible: ${err.message}`;
      }
    }
    
    showError(errorMessage);
  }
};

const handleUpdateHoraDisponible = async () => {
  if (!selectedItem) {
    showError('No hay elemento seleccionado');
    return;
  }
  
  if (!canUpdateInCurrentTab()) {
    showError('No tiene permisos para editar horas disponibles');
    return;
  }
  
  try {
    // ✅ Para el UPDATE, usa UpdateHoraDisponibleDto que solo incluye campos modificables
    const updateData: UpdateHoraDisponibleDto = {
      id: selectedItem.id,                      // ✅ ID del elemento existente
      hora: horaDisponibleForm.hora,
      sedeId: horaDisponibleForm.sedeId ? (typeof horaDisponibleForm.sedeId === 'string' ? parseInt(horaDisponibleForm.sedeId) : Number(horaDisponibleForm.sedeId)) : undefined,
      tipoCitaId: horaDisponibleForm.tipoCitaId ? (typeof horaDisponibleForm.tipoCitaId === 'string' ? parseInt(horaDisponibleForm.tipoCitaId) : Number(horaDisponibleForm.tipoCitaId)) : undefined
    };


    await apiService.updateHoraDisponible(updateData);
    setModalType(null);
    setHoraDisponibleForm({});
    showSuccess('Hora disponible actualizada exitosamente');
    await refreshData(false);
    
  } catch (err: unknown) {
    console.error('🚨 Error al actualizar:', err);
    showError(`Error al actualizar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
  }
};

  const handleDeleteHoraDisponible = async (id: number, logical = true) => {
    if (!canDeleteInCurrentTab()) {
      showError('No tiene permisos para eliminar horas disponibles');
      return;
    }
    
    try {
      if (logical) {
        await apiService.deleteLogicalHoraDisponible(id);
        showSuccess('Hora disponible desactivada exitosamente');
      } else {
        await apiService.deleteHoraDisponible(id);
        showSuccess('Hora disponible eliminada exitosamente');
      }
      setModalType(null);
      await refreshData(false);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Type guards para verificar tipos
  const isCitaDto = (item: unknown): item is CitaDto => {
    return item !== null && typeof item === 'object' && 'numeroCita' in item && 'fechaCita' in item && 'horaCita' in item;
  };
  
  
  const isUserDto = (item: unknown): item is UserDto => {
    return item !== null && typeof item === 'object' && 'username' in item && 'email' in item && 'roles' in item;
  };
  
  const isRolDto = (item: unknown): item is RolDto => {
    return item !== null && typeof item === 'object' && 'name' in item && 'code' in item;
  };
  
  const isSedeDto = (item: unknown): item is SedeDto => {
    return item !== null && typeof item === 'object' && 'codigo' in item && 'ciudad' in item;
  };
  
  const isTipoCitaDto = (item: unknown): item is TipoCitaDto => {
    return item !== null && typeof item === 'object' && 'tiempoEstimadoMinutos' in item && 'requiereDocumentacion' in item;
  };
  
  const isHoraDisponibleDto = (item: unknown): item is HoraDisponibleDto => {
    return item !== null && typeof item === 'object' && 'hora' in item && 'sedeId' in item;
  };

  // ACTIVAR ELEMENTO
  const handleActivateItem = async () => {
    if (!selectedItem) {
      showError('No hay elemento seleccionado');
      return;
    }
    
    if (!canUpdateInCurrentTab()) {
      showError('No tiene permisos para activar elementos');
      return;
    }
    
    try {
      let updateData;
      
      switch (activeTab) {
        case 'sedes':
          if (isSedeDto(selectedItem)) {
            updateData = {
              id: selectedItem.id,
              codigo: selectedItem.codigo,
              nombre: selectedItem.nombre,
              direccion: selectedItem.direccion,
              telefono: selectedItem.telefono,
              ciudad: selectedItem.ciudad,
              departamento: selectedItem.departamento,
              esPrincipal: selectedItem.esPrincipal
            };
            await apiService.updateSede(updateData);
          }
          break;
        case 'tipos-cita':
          if (isTipoCitaDto(selectedItem)) {
            updateData = {
              id: selectedItem.id,
              nombre: selectedItem.nombre,
              descripcion: selectedItem.descripcion,
              icono: selectedItem.icono,
              tiempoEstimadoMinutos: selectedItem.tiempoEstimadoMinutos,
              requiereDocumentacion: selectedItem.requiereDocumentacion
            };
            await apiService.updateTipoCita(updateData);
          }
          break;
        case 'horas-disponibles':
          if (isHoraDisponibleDto(selectedItem)) {
            updateData = {
              id: selectedItem.id,
              hora: selectedItem.hora,
              sedeId: selectedItem.sedeId,
              tipoCitaId: selectedItem.tipoCitaId
            };
            await apiService.updateHoraDisponible(updateData);
          }
          break;
      }
      
      setModalType(null);
      await refreshData(false);
      showSuccess('Elemento activado exitosamente');
      
    } catch (err: unknown) {
      showError(`Error al activar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const openCreateModal = () => {
    setSelectedItem(null);
    setModalType('create');
    setCitaForm({});
    setEmpleadoForm({});
    setRolForm({});
    setSedeForm({});
    setTipoCitaForm({});
    setHoraDisponibleForm({});
    clearFormErrors();
  };

  const openEditModal = (item: CitaDto | UserDto | RolDto | SedeDto | TipoCitaDto | HoraDisponibleDto) => {
    setSelectedItem(item);
    setModalType('edit');
    clearFormErrors();
    
    switch (activeTab) {
      case 'citas':
        if (isCitaDto(item)) {
          setCitaForm({
            numeroCita: item.numeroCita,
            fechaCita: item.fechaCita?.split('T')[0],
            horaCita: item.horaCita,
            estado: item.estado,
            observaciones: item.observaciones,
            clienteId: item.clienteId,
            sedeId: item.sedeId,
            tipoCitaId: item.tipoCitaId
          });
        }
        break;
      case 'empleados':
        if (isUserDto(item)) {
          setEmpleadoForm({
            username: item.username,
            email: item.email,
            roles: item.roles
          });
        }
        break;
      case 'roles':
        if (isRolDto(item)) {
          setRolForm({
            name: item.name,
            code: item.code
          });
        }
        break;
      case 'sedes':
        if (isSedeDto(item)) {
          setSedeForm({
            nombre: item.nombre,
            codigo: item.codigo,
            direccion: item.direccion,
            telefono: item.telefono,
            ciudad: item.ciudad,
            departamento: item.departamento,
            esPrincipal: item.esPrincipal
          });
        }
        break;
      case 'tipos-cita':
        if (isTipoCitaDto(item)) {
          setTipoCitaForm({
            nombre: item.nombre,
            descripcion: item.descripcion,
            icono: item.icono,
            tiempoEstimadoMinutos: item.tiempoEstimadoMinutos,
            requiereDocumentacion: item.requiereDocumentacion
          });
        }
        break;
      case 'horas-disponibles':
        if (isHoraDisponibleDto(item)) {
          setHoraDisponibleForm({
            hora: item.hora,
            sedeId: item.sedeId,
            tipoCitaId: item.tipoCitaId
          });
        }
        break;
    }
  };

  const openDeleteModal = (item: CitaDto | UserDto | RolDto | SedeDto | TipoCitaDto | HoraDisponibleDto) => {
    setSelectedItem(item);
    setModalType('delete');
  };

  const openActivateModal = (item: CitaDto | UserDto | RolDto | SedeDto | TipoCitaDto | HoraDisponibleDto) => {
    setSelectedItem(item);
    setModalType('activate');
  };

  const getStatusBadge = (isActive: boolean) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
      isActive 
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isActive ? 'Activo' : 'Desactivado'}
    </span>
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours);
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      const hour12 = hour24 % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  const getTabDisplayName = () => {
    switch (activeTab) {
      case 'citas': return 'Citas';
      case 'empleados': return 'Empleados';
      case 'roles': return 'Roles';
      case 'sedes': return 'Sedes';
      case 'tipos-cita': return 'Tipos de Cita';
      case 'horas-disponibles': return 'Horas Disponibles';
      case 'permisos': return 'Permisos';
      default: return '';
    }
  };

  const getViewDisplayName = () => {
    if (activeTab === 'citas') {
      return currentView === 'active' ? 'Asistidas' : 'No Asistidas';
    }
    if (activeTab === 'permisos') {
      return currentView === 'active' ? 'Por Rol' : 'Por Empleado';
    }
    return currentView === 'active' ? 'Activos' : 'Inactivos';
  };

  // Función para recargar permisos del usuario actual
  const reloadUserPermissions = async (): Promise<{ [formCode: string]: FormPermissionDto } | null> => {
    try {
      // Obtener permisos actualizados del servidor
      const updatedUser = await apiService.getCurrentUserFromServer();
      const updatedRoles = await apiService.getCurrentUserRolesFromServer(); 
      const updatedPermissions = await apiService.getCurrentUserPermissionsFromServer();
      
      if (updatedUser && updatedRoles && updatedPermissions) {
        setCurrentUser(updatedUser);
        setUserRoles(updatedRoles);
        setUserPermissions(updatedPermissions.forms); // Usar solo la parte de forms
        setPermissionUpdateKey(prev => prev + 1);
        setHasInitialPermissions(true);
        return updatedPermissions.forms;
      }
      return null;
    } catch (error) {
      console.error('Error al recargar permisos del usuario:', error);
      return null;
    }
  };

  // Funciones para gestión de pestañas por empleado
  const loadEmployeeTabPermissions = async (employeeId: number) => {
    try {
      // Cargar pestañas permitidas del empleado desde allowedTabs
      const employee = empleados.find(emp => emp.id === employeeId);
      if (employee && employee.allowedTabs) {
        const allowedTabsArray = Array.isArray(employee.allowedTabs) 
          ? employee.allowedTabs 
          : employee.allowedTabs.split(',').map(tab => tab.trim());
        
        const permissions: {[tabId: string]: boolean} = {};
        ['citas', 'sedes', 'empleados', 'tipos-cita', 'horas-disponibles', 'roles'].forEach(tabId => {
          permissions[tabId] = allowedTabsArray.includes(tabId);
        });
        
        setEmployeeTabPermissions(permissions);
        setOriginalTabPermissions({...permissions});
      } else {
        // Si no tiene allowedTabs, todas están deshabilitadas
        const permissions: {[tabId: string]: boolean} = {};
        ['citas', 'sedes', 'empleados', 'tipos-cita', 'horas-disponibles', 'roles'].forEach(tabId => {
          permissions[tabId] = false;
        });
        setEmployeeTabPermissions(permissions);
        setOriginalTabPermissions({...permissions});
      }
    } catch (error) {
      console.error('Error al cargar permisos de pestañas del empleado:', error);
      showError('Error al cargar permisos de pestañas del empleado');
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const id = employeeId ? parseInt(employeeId) : null;
    setSelectedEmployeeId(id);
    setIsEditingTabs(false);
    
    if (id) {
      loadEmployeeTabPermissions(id);
    } else {
      setEmployeeTabPermissions({});
      setOriginalTabPermissions({});
    }
  };

  const handleToggleTabPermission = (tabId: string) => {
    if (!isEditingTabs) return;
    
    setEmployeeTabPermissions(prev => ({
      ...prev,
      [tabId]: !prev[tabId]
    }));
  };

  const handleStartEditingTabs = () => {
    setIsEditingTabs(true);
  };

  const handleCancelEditingTabs = () => {
    setEmployeeTabPermissions({...originalTabPermissions});
    setIsEditingTabs(false);
  };

  const handleSaveTabPermissions = async () => {
    if (!selectedEmployeeId) return;

    try {
      const allowedTabsArray = Object.entries(employeeTabPermissions)
        .filter(([_, allowed]) => allowed)
        .map(([tabId, _]) => tabId);

      const updateData = {
        userId: selectedEmployeeId,
        allowedTabs: allowedTabsArray
      };

      const result = await apiService.updateUserTabs(updateData);
      
      if (result.success) {
        setOriginalTabPermissions({...employeeTabPermissions});
        setIsEditingTabs(false);
        
        // Recargar datos de empleados para reflejar cambios
        await loadData(true);
        
        showSuccess('Pestañas del empleado actualizadas correctamente');
      } else {
        showError(result.message || 'Error al actualizar pestañas del empleado');
      }
    } catch (error) {
      console.error('Error al guardar permisos de pestañas:', error);
      showError('Error al guardar permisos de pestañas');
    }
  };

  const getActiveTabsCount = () => {
    return Object.values(employeeTabPermissions).filter(allowed => allowed).length;
  };

  // Función para cambiar permisos de rol
  const handleUpdateRolPermission = async (rolId: number, formId: number, permissionId?: number) => {
    try {
      const updateData: UpdateRolFormPermissionDto = {
        RolId: rolId,
        FormId: formId,
        PermissionId: permissionId
      };
      
      const result = await apiService.updateRolFormPermission(updateData);
      
      if (result.success) {
        await refreshData(false);
        
        // Actualizar permisos del usuario actual para reflejar cambios inmediatos
        await reloadUserPermissions();
        
        showSuccess(result.message);
      } else {
        showError('No se pudo actualizar el permiso');
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Si no hay tabs disponibles, mostrar mensaje de acceso denegado
  const availableTabs = getAvailableTabs();
  if (hasInitialPermissions && availableTabs.length === 0) {
    if (typeof window !== 'undefined') {
      window.location.replace('/unauthorized');
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
                alt="ElectroHuila Logo"
                className="h-12 w-auto object-contain"
                width="120"
                height="29"
              />
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <span className="text-sm text-gray-600">
              Bienvenido, {currentUser?.username || 'Usuario'}
            </span>
            <span className="text-xs text-gray-500">
              ({userRoles?.join(', ') || 'Sin rol'})
            </span>
            {currentUser?.email && (
              <span className="text-xs text-gray-400">Email: {currentUser.email}</span>
            )}
            <button
              onClick={async () => {
                setIsLoggingOut(true);
                try {
                  await apiService.logout();
                } catch (error) {
                  console.warn('Error durante logout:', error);
                }
                // Usar replace para evitar que el usuario pueda volver con el botón atrás
                window.location.replace('/login');
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-800 font-medium transition-colors duration-300 hover:bg-red-50 px-3 py-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
            <Link 
              href="/"
              className="flex items-center space-x-2 text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 hover:bg-gray-50 px-3 py-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Volver al Inicio</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-white/70 rounded-full text-[#1A6192] text-sm font-medium mb-6 shadow-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Panel de Administración
          </div>
          <h1 className="text-4xl font-bold text-[#203461] mb-4">
            Gestión del
            <span className="bg-gradient-to-r from-[#1797D5] to-[#56C2E1] bg-clip-text text-transparent"> Sistema</span>
          </h1>
          <p className="text-xl text-gray-600">
            Administre citas, clientes, sedes, tipos de servicio y horarios disponibles
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div key={permissionUpdateKey} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {getAvailableTabs().map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#1797D5] text-[#1797D5]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Header with View Toggle */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-[#203461]">
                  {getTabDisplayName()} {getViewDisplayName()}
                </h2>
                
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentView('active')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      currentView === 'active'
                        ? 'bg-white text-[#1797D5] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {activeTab === 'citas' ? '✅ Asistidas' : activeTab === 'permisos' ? '🛡️ Por Rol' : '✅ Activos'}
                  </button>
                  <button
                    onClick={() => setCurrentView('inactive')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      currentView === 'inactive'
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {activeTab === 'citas' ? '❌ No Asistidas' : activeTab === 'permisos' ? '👨‍💼 Por Empleado' : '❌ Inactivos'}
                  </button>
                </div>
              </div>

              {/* Create Button - No mostrar para citas, permisos y validar permisos */}
              {currentView === 'active' && activeTab !== 'citas' && activeTab !== 'permisos' && canCreateInCurrentTab() && (
                <button
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Nuevo
                </button>
              )}
              
              {/* Mensaje cuando no tiene permisos de creación */}
              {currentView === 'active' && activeTab !== 'citas' && activeTab !== 'permisos' && !canCreateInCurrentTab() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-sm">
                  <span className="text-yellow-800">⚠️ No tiene permisos para crear elementos</span>
                </div>
              )}
            </div>

            {/* Info Banner para citas */}
            {activeTab === 'citas' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-800 font-medium">
                    {currentView === 'active' 
                      ? 'Mostrando citas completadas (asistidas). Use los botones de acción para cambiar el estado de asistencia.'
                      : 'Mostrando citas pendientes y canceladas (no asistidas). Puede marcarlas como asistidas desde aquí.'
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Info Banner para permisos */}
            {activeTab === 'permisos' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-purple-800 font-medium">
                    {currentView === 'active' 
                      ? 'Gestión de permisos por rol. Seleccione el tipo de permiso para cada formulario usando los menús desplegables. Los cambios se aplican inmediatamente.'
                      : 'Gestión de pestañas por empleado. Seleccione un empleado para configurar qué pestañas del panel administrativo puede ver. Los cambios se aplican inmediatamente.'
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Info Banner para vista inactivos */}
            {currentView === 'inactive' && activeTab !== 'citas' && activeTab !== 'permisos' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-amber-800 font-medium">
                    Mostrando elementos desactivados. Puede reactivarlos usando el botón Activar.
                  </span>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#1797D5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando datos...
                </div>
              </div>
            )}

            {/* Data Tables */}
            {!loading && (
              <div className="overflow-x-auto">
                {/* CITAS TABLE - Modificada */}
                {activeTab === 'citas' && (
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {citas.map((cita) => (
                        <tr key={cita.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cita.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cita.numeroCita}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cita.clienteNombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(cita.fechaCita)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(cita.horaCita)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              cita.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              cita.estado === 'Completada' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {cita.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openEditModal(cita)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              >
                                Editar
                              </button>
                            ) : (
                              <span className="text-gray-400 cursor-not-allowed">Sin permisos</span>
                            )}
                            {canUpdateInCurrentTab() && (
                              currentView === 'active' ? (
                                <button
                                  onClick={() => handleToggleCitaAsistencia(cita, false)}
                                  className="text-orange-600 hover:text-orange-900 transition-colors"
                                >
                                  Marcar No Asistida
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleCitaAsistencia(cita, true)}
                                  className="text-green-600 hover:text-green-900 transition-colors font-medium"
                                >
                                  ✅ Marcar Asistida
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}



                {/* EMPLEADOS TABLE */}
                {activeTab === 'empleados' && (
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                        {currentView === 'inactive' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {empleados.map((empleado) => (
                        <tr key={empleado.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{empleado.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{empleado.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{empleado.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1">
                              {empleado.roles.map((role, index) => (
                                <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {role}
                                </span>
                              ))}
                            </div>
                          </td>
                          {currentView === 'inactive' && <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(empleado.isActive)}</td>}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openEditModal(empleado)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              >
                                Editar
                              </button>
                            ) : (
                              <span className="text-gray-400 cursor-not-allowed text-xs">Sin permisos</span>
                            )}
                            {currentView === 'active' && canDeleteInCurrentTab() ? (
                              <button
                                onClick={() => openDeleteModal(empleado)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                Desactivar
                              </button>
                            ) : currentView === 'inactive' && canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openActivateModal(empleado)}
                                className="text-green-600 hover:text-green-900 transition-colors font-medium"
                              >
                                ✅ Activar
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* ROLES TABLE */}
                {activeTab === 'roles' && (
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                        {currentView === 'inactive' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {roles.map((rol) => (
                        <tr key={rol.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rol.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {rol.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rol.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(rol.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          {currentView === 'inactive' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactivo
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                            {canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openEditModal(rol)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              >
                                Editar
                              </button>
                            ) : (
                              <span className="text-gray-400 cursor-not-allowed text-xs">Sin permisos</span>
                            )}
                            {currentView === 'active' && canDeleteInCurrentTab() ? (
                              <button
                                onClick={() => openDeleteModal(rol)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                Desactivar
                              </button>
                            ) : currentView === 'inactive' && canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openActivateModal(rol)}
                                className="text-green-600 hover:text-green-900 transition-colors font-medium"
                              >
                                ✅ Activar
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* SEDES TABLE */}
                {activeTab === 'sedes' && (
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciudad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                        {currentView === 'inactive' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sedes.map((sede) => (
                        <tr key={sede.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sede.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sede.codigo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sede.nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sede.ciudad}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sede.esPrincipal ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sede.esPrincipal ? 'Sí' : 'No'}
                            </span>
                          </td>
                          {currentView === 'inactive' && <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(sede.isActive)}</td>}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openEditModal(sede)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              >
                                Editar
                              </button>
                            ) : (
                              <span className="text-gray-400 cursor-not-allowed text-xs">Sin permisos</span>
                            )}
                            {currentView === 'active' && canDeleteInCurrentTab() ? (
                              <button
                                onClick={() => openDeleteModal(sede)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                Desactivar
                              </button>
                            ) : currentView === 'inactive' && canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openActivateModal(sede)}
                                className="text-green-600 hover:text-green-900 transition-colors font-medium"
                              >
                                ✅ Activar
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* TIPOS CITA TABLE */}
                {activeTab === 'tipos-cita' && (
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo (min)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documentación</th>
                        {currentView === 'inactive' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tiposCita.map((tipo) => (
                        <tr key={tipo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tipo.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tipo.nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tipo.icono}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tipo.tiempoEstimadoMinutos}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tipo.requiereDocumentacion ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {tipo.requiereDocumentacion ? 'Sí' : 'No'}
                            </span>
                          </td>
                          {currentView === 'inactive' && <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(tipo.isActive)}</td>}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openEditModal(tipo)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              >
                                Editar
                              </button>
                            ) : (
                              <span className="text-gray-400 cursor-not-allowed text-xs">Sin permisos</span>
                            )}
                            {currentView === 'active' && canDeleteInCurrentTab() ? (
                              <button
                                onClick={() => openDeleteModal(tipo)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                Desactivar
                              </button>
                            ) : currentView === 'inactive' && canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openActivateModal(tipo)}
                                className="text-green-600 hover:text-green-900 transition-colors font-medium"
                              >
                                ✅ Activar
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* HORAS DISPONIBLES TABLE */}
                {activeTab === 'horas-disponibles' && (
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sede</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Cita</th>
                        {currentView === 'inactive' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {horasDisponibles.map((hora) => (
                        <tr key={hora.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hora.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(hora.hora)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hora.sedeNombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hora.tipoCitaNombre || 'Todas'}</td>
                          {currentView === 'inactive' && <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(hora.isActive)}</td>}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openEditModal(hora)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              >
                                Editar
                              </button>
                            ) : (
                              <span className="text-gray-400 cursor-not-allowed text-xs">Sin permisos</span>
                            )}
                            {currentView === 'active' && canDeleteInCurrentTab() ? (
                              <button
                                onClick={() => openDeleteModal(hora)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                Desactivar
                              </button>
                            ) : currentView === 'inactive' && canUpdateInCurrentTab() ? (
                              <button
                                onClick={() => openActivateModal(hora)}
                                className="text-green-600 hover:text-green-900 transition-colors font-medium"
                              >
                                ✅ Activar
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* GESTIÓN DE PERMISOS - VERSION MEJORADA CON ACORDEONES */}
                {activeTab === 'permisos' && currentView === 'active' && (
                  <div className="space-y-3">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-900">Gestión de Permisos por Rol</h3>
                        <button
                          onClick={() => {
                            if (expandedRoles.size === rolPermissionsSummary.length) {
                              setExpandedRoles(new Set());
                            } else {
                              setExpandedRoles(new Set(rolPermissionsSummary.map(r => r.rolId)));
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {expandedRoles.size === rolPermissionsSummary.length ? 'Contraer todos' : 'Expandir todos'}
                        </button>
                      </div>
                    </div>
                    {rolPermissionsSummary.map((rolSummary) => (
                      <div key={rolSummary.rolId} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div 
                          className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => toggleRoleAccordion(rolSummary.rolId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">{rolSummary.rolName}</h4>
                                <p className="text-xs text-gray-500">{rolSummary.formPermissions.filter(fp => fp.hasPermission).length} formularios con permisos</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {rolSummary.formPermissions.filter(fp => fp.hasPermission).length}/{rolSummary.formPermissions.length}
                              </span>
                              <svg 
                                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                  expandedRoles.has(rolSummary.rolId) ? 'rotate-180' : ''
                                }`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedRoles.has(rolSummary.rolId) ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="px-4 pb-4">
                            <div className="space-y-2">
                              {rolSummary.formPermissions.map((formPermission) => (
                                <div key={formPermission.formId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="text-sm font-medium text-gray-900">{formPermission.formName}</div>
                                      <div className="flex flex-wrap gap-1">
                                        {formPermission.assignedPermission ? (
                                          <>
                                            {formPermission.assignedPermission.canRead && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                Leer
                                              </span>
                                            )}
                                            {formPermission.assignedPermission.canCreate && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                Crear
                                              </span>
                                            )}
                                            {formPermission.assignedPermission.canUpdate && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Actualizar
                                              </span>
                                            )}
                                            {formPermission.assignedPermission.canDelete && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                Eliminar
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            Sin permisos
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {canUpdateInCurrentTab() ? (
                                      <select
                                        value={formPermission.assignedPermission?.id || ''}
                                        onChange={async (e) => {
                                          const permissionId = e.target.value ? parseInt(e.target.value) : undefined;
                                          await handleUpdateRolPermission(rolSummary.rolId, formPermission.formId, permissionId);
                                        }}
                                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      >
                                        <option value="">Sin permiso</option>
                                        {permisos.map((permiso) => (
                                          <option key={permiso.id} value={permiso.id}>
                                            {permiso.description}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-gray-400 cursor-not-allowed text-xs">Sin permisos</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* GESTIÓN DE PESTAÑAS POR EMPLEADO */}
                {activeTab === 'permisos' && currentView === 'inactive' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">👨‍💼 Pestañas por Empleado</h3>
                    </div>

                    {/* Selector de Empleado */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seleccionar Empleado
                        </label>
                        <select 
                          value={selectedEmployeeId || ''}
                          onChange={(e) => handleEmployeeChange(e.target.value)}
                          className="w-full md:w-1/3 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccione un empleado...</option>
                          {empleados
                            .filter(emp => !emp.roles?.some(role => role.code === 'SUPER_ADMIN'))
                            .map((empleado) => (
                            <option key={empleado.id} value={empleado.id}>
                              {empleado.username} ({empleado.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Grid de Pestañas */}
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium text-gray-800">Pestañas Administrativas</h4>
                          <span className="text-sm text-gray-500">Pestañas activas: {getActiveTabsCount()} de 6</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          {[
                            { id: 'citas', name: 'Citas', icon: '📅' },
                            { id: 'sedes', name: 'Sedes', icon: '🏢' },
                            { id: 'empleados', name: 'Empleados', icon: '👨‍💼' },
                            { id: 'tipos-cita', name: 'Tipos de Cita', icon: '📋' },
                            { id: 'horas-disponibles', name: 'Horas Disponibles', icon: '🕐' },
                            { id: 'roles', name: 'Roles', icon: '🔐' }
                          ].map((tab) => {
                            const isAllowed = employeeTabPermissions[tab.id] || false;
                            const isActive = selectedEmployeeId && isEditingTabs;
                            
                            return (
                              <div key={tab.id} className={`border border-gray-200 rounded-lg p-4 text-center transition-all ${
                                isAllowed ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                              } ${isActive ? 'hover:shadow-md cursor-pointer' : ''}`}>
                                <div className="text-2xl mb-2">{tab.icon}</div>
                                <h5 className="text-sm font-medium text-gray-900 mb-2">{tab.name}</h5>
                                <div className="text-xs mb-3">
                                  {isAllowed ? (
                                    <span className="text-green-600 font-medium">✅ Permitido</span>
                                  ) : (
                                    <span className="text-gray-500">⭕ No permitido</span>
                                  )}
                                </div>
                                <div className="flex justify-center">
                                  {selectedEmployeeId ? (
                                    <button 
                                      onClick={() => handleToggleTabPermission(tab.id)}
                                      disabled={!isEditingTabs}
                                      className={`text-xs px-3 py-1 rounded-md transition-colors ${
                                        isEditingTabs 
                                          ? (isAllowed 
                                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                              : 'bg-green-100 text-green-700 hover:bg-green-200')
                                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      {isAllowed ? 'Deshabilitar' : 'Habilitar'}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-400">Sin empleado</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Controles de Edición */}
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            {!selectedEmployeeId ? 
                              'Seleccione un empleado para configurar sus pestañas' :
                              isEditingTabs ?
                                'Haga clic en las pestañas para habilitar/deshabilitar' :
                                `Configurando pestañas para ${empleados.find(emp => emp.id === selectedEmployeeId)?.username}`
                            }
                          </div>
                          <div className="flex space-x-3">
                            {selectedEmployeeId && !isEditingTabs && (
                              <button 
                                onClick={handleStartEditingTabs}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                              >
                                ✏️ Editar Pestañas
                              </button>
                            )}
                            {selectedEmployeeId && isEditingTabs && (
                              <>
                                <button 
                                  onClick={handleCancelEditingTabs}
                                  className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                                >
                                  ❌ Cancelar
                                </button>
                                <button 
                                  onClick={handleSaveTabPermissions}
                                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                                >
                                  💾 Guardar
                                </button>
                              </>
                            )}
                            {!selectedEmployeeId && (
                              <button 
                                disabled
                                className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg text-sm cursor-not-allowed"
                              >
                                ✏️ Editar Pestañas
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {((currentView === 'active' && citas.length === 0 && activeTab === 'citas') ||
                  (currentView === 'active' && empleados.length === 0 && activeTab === 'empleados') ||
                  (currentView === 'active' && roles.length === 0 && activeTab === 'roles') ||
                  (currentView === 'active' && sedes.length === 0 && activeTab === 'sedes') ||
                  (currentView === 'active' && tiposCita.length === 0 && activeTab === 'tipos-cita') ||
                  (currentView === 'active' && horasDisponibles.length === 0 && activeTab === 'horas-disponibles') ||
                  (currentView === 'active' && rolPermissionsSummary.length === 0 && activeTab === 'permisos') ||
                  (currentView === 'inactive' && citas.length === 0 && activeTab === 'citas') ||
                  (currentView === 'inactive' && empleados.length === 0 && activeTab === 'empleados') ||
                  (currentView === 'inactive' && roles.length === 0 && activeTab === 'roles') ||
                  (currentView === 'inactive' && sedes.length === 0 && activeTab === 'sedes') ||
                  (currentView === 'inactive' && tiposCita.length === 0 && activeTab === 'tipos-cita') ||
                  (currentView === 'inactive' && horasDisponibles.length === 0 && activeTab === 'horas-disponibles') ||
                  (currentView === 'inactive' && permisos.length === 0 && activeTab === 'permisos')) && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      {activeTab === 'citas' 
                        ? (currentView === 'active' ? 'No hay citas asistidas' : 'No hay citas no asistidas')
                        : activeTab === 'permisos'
                          ? (currentView === 'active' ? 'No hay roles con permisos' : 'No hay permisos disponibles')
                        : (currentView === 'active' ? 'No hay elementos activos' : 'No hay elementos desactivados')
                      }
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {activeTab === 'citas'
                        ? (currentView === 'active' 
                            ? 'No se encontraron citas completadas (asistidas).'
                            : 'No hay citas pendientes o canceladas.')
                        : activeTab === 'permisos'
                          ? (currentView === 'active'
                              ? 'No hay roles configurados en el sistema o no tienen permisos asignados.'
                              : 'No hay permisos creados en el sistema. Los permisos definen qué acciones pueden realizar los roles.')
                          : (currentView === 'active' 
                              ? `No se encontraron ${getTabDisplayName().toLowerCase()} activos.`
                              : `No hay ${getTabDisplayName().toLowerCase()} desactivados en el sistema.`
                            )
                      }
                    </p>
                    {currentView === 'active' && activeTab !== 'citas' && activeTab !== 'permisos' && canCreateInCurrentTab() && (
                      <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#203461] to-[#1797D5] text-white rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Crear {getTabDisplayName().slice(0, -1)}
                      </button>
                    )}
                    {currentView === 'active' && activeTab !== 'citas' && activeTab !== 'permisos' && !canCreateInCurrentTab() && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-center">
                        <p className="text-yellow-800 text-sm font-medium">
                          ⚠️ No tiene permisos para crear {getTabDisplayName().toLowerCase()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#203461]">
                  {modalType === 'create' && `Crear ${getTabDisplayName().slice(0, -1)}`}
                  {modalType === 'edit' && `Editar ${getTabDisplayName().slice(0, -1)}`}
                  {modalType === 'delete' && `Desactivar ${getTabDisplayName().slice(0, -1)}`}
                  {modalType === 'activate' && `Activar ${getTabDisplayName().slice(0, -1)}`}
                </h3>
                <button
                  onClick={() => setModalType(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              {modalType === 'delete' ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    ¿Está seguro de que desea desactivar este elemento? Será marcado como inactivo pero no se eliminará permanentemente.
                    <br /><br />
                    También puede eliminar permanentemente si es necesario.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setModalType(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedItem) return;
                        switch (activeTab) {
                          case 'empleados':
                            handleDeleteEmpleado(selectedItem.id, true);
                            break;
                          case 'roles':
                            handleDeleteRol(selectedItem.id, true);
                            break;
                          case 'sedes':
                            handleDeleteSede(selectedItem.id, true);
                            break;
                          case 'tipos-cita':
                            handleDeleteTipoCita(selectedItem.id, true);
                            break;
                          case 'horas-disponibles':
                            handleDeleteHoraDisponible(selectedItem.id, true);
                            break;
                        }
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      Desactivar
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedItem) return;
                        switch (activeTab) {
                          case 'empleados':
                            handleDeleteEmpleado(selectedItem.id, false);
                            break;
                          case 'roles':
                            handleDeleteRol(selectedItem.id, false);
                            break;
                          case 'sedes':
                            handleDeleteSede(selectedItem.id, false);
                            break;
                          case 'tipos-cita':
                            handleDeleteTipoCita(selectedItem.id, false);
                            break;
                          case 'horas-disponibles':
                            handleDeleteHoraDisponible(selectedItem.id, false);
                            break;
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Eliminar Permanentemente
                    </button>
                  </div>
                </div>
              ) : modalType === 'activate' ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    ¿Está seguro de que desea activar este elemento? Volverá a estar disponible en el sistema.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setModalType(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleActivateItem}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      ✅ Activar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* CITAS FORM - Solo edición */}
                  {activeTab === 'citas' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cita</label>
                          <input
                            type="text"
                            value={citaForm.numeroCita || ''}
                            onChange={(e) => setCitaForm({...citaForm, numeroCita: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                            placeholder="EH-2025-1234"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                          <select
                            value={citaForm.estado || ''}
                            onChange={(e) => setCitaForm({...citaForm, estado: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                          >
                            <option value="">Seleccionar estado</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Completada">Completada</option>
                            <option value="Cancelada">Cancelada</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                          <input
                            type="date"
                            value={citaForm.fechaCita || ''}
                            onChange={(e) => setCitaForm({...citaForm, fechaCita: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                          <input
                            type="time"
                            value={citaForm.horaCita || ''}
                            onChange={(e) => setCitaForm({...citaForm, horaCita: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente ID</label>
                          <input
                            type="number"
                            value={citaForm.clienteId || ''}
                            onChange={(e) => setCitaForm({...citaForm, clienteId: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sede ID</label>
                          <input
                            type="number"
                            value={citaForm.sedeId || ''}
                            onChange={(e) => setCitaForm({...citaForm, sedeId: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Cita ID</label>
                          <input
                            type="number"
                            value={citaForm.tipoCitaId || ''}
                            onChange={(e) => setCitaForm({...citaForm, tipoCitaId: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                        <textarea
                          value={citaForm.observaciones || ''}
                          onChange={(e) => setCitaForm({...citaForm, observaciones: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}


                  {/* EMPLEADOS FORM */}
                  {activeTab === 'empleados' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <ValidatedInput
                          label="Nombre de Usuario"
                          value={empleadoForm.username || ''}
                          onChange={(value) => {
                            setEmpleadoForm({...empleadoForm, username: value});
                            handleFieldChange('username', value, 'empleado');
                          }}
                          onBlur={() => handleFieldChange('username', empleadoForm.username, 'empleado')}
                          error={formErrors.username}
                          placeholder="usuario123"
                          required
                          maxLength={50}
                        />
                        <ValidatedInput
                          label="Email"
                          type="email"
                          value={empleadoForm.email || ''}
                          onChange={(value) => {
                            setEmpleadoForm({...empleadoForm, email: value});
                            handleFieldChange('email', value, 'empleado');
                          }}
                          onBlur={() => handleFieldChange('email', empleadoForm.email, 'empleado')}
                          error={formErrors.email}
                          placeholder="usuario@electrohuila.com"
                          required
                        />
                      </div>
                      
                      {modalType === 'create' && (
                        <ValidatedInput
                          label="Contraseña"
                          type="password"
                          value={empleadoForm.password || ''}
                          onChange={(value) => {
                            setEmpleadoForm({...empleadoForm, password: value});
                            handleFieldChange('password', value, 'empleado');
                          }}
                          onBlur={() => handleFieldChange('password', empleadoForm.password, 'empleado')}
                          error={formErrors.password}
                          placeholder="••••••••"
                          required
                          maxLength={100}
                        />
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="admin-role"
                              checked={empleadoForm.roles?.includes('ADMIN') || false}
                              onChange={(e) => {
                                const currentRoles = empleadoForm.roles || [];
                                if (e.target.checked) {
                                  setEmpleadoForm({...empleadoForm, roles: [...currentRoles.filter(r => r !== 'ADMIN'), 'ADMIN']});
                                } else {
                                  setEmpleadoForm({...empleadoForm, roles: currentRoles.filter(r => r !== 'ADMIN')});
                                }
                              }}
                              className="h-4 w-4 text-[#1797D5] focus:ring-[#1797D5] border-gray-300 rounded"
                            />
                            <label htmlFor="admin-role" className="ml-2 text-sm text-gray-700">Administrador</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="user-role"
                              checked={empleadoForm.roles?.includes('USER') || false}
                              onChange={(e) => {
                                const currentRoles = empleadoForm.roles || [];
                                if (e.target.checked) {
                                  setEmpleadoForm({...empleadoForm, roles: [...currentRoles.filter(r => r !== 'USER'), 'USER']});
                                } else {
                                  setEmpleadoForm({...empleadoForm, roles: currentRoles.filter(r => r !== 'USER')});
                                }
                              }}
                              className="h-4 w-4 text-[#1797D5] focus:ring-[#1797D5] border-gray-300 rounded"
                            />
                            <label htmlFor="user-role" className="ml-2 text-sm text-gray-700">Usuario</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="operator-role"
                              checked={empleadoForm.roles?.includes('OPERATOR') || false}
                              onChange={(e) => {
                                const currentRoles = empleadoForm.roles || [];
                                if (e.target.checked) {
                                  setEmpleadoForm({...empleadoForm, roles: [...currentRoles.filter(r => r !== 'OPERATOR'), 'OPERATOR']});
                                } else {
                                  setEmpleadoForm({...empleadoForm, roles: currentRoles.filter(r => r !== 'OPERATOR')});
                                }
                              }}
                              className="h-4 w-4 text-[#1797D5] focus:ring-[#1797D5] border-gray-300 rounded"
                            />
                            <label htmlFor="operator-role" className="ml-2 text-sm text-gray-700">Operador</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ROLES FORM */}
                  {activeTab === 'roles' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <ValidatedInput
                          label="Nombre del Rol"
                          value={rolForm.name || ''}
                          onChange={(value) => {
                            setRolForm({...rolForm, name: value});
                            handleFieldChange('name', value, 'rol');
                          }}
                          onBlur={() => handleFieldChange('name', rolForm.name, 'rol')}
                          error={formErrors.name}
                          placeholder="Administrador"
                          required
                          maxLength={100}
                        />
                        <ValidatedInput
                          label="Código del Rol"
                          value={rolForm.code || ''}
                          onChange={(value) => {
                            const upperValue = value.toUpperCase();
                            setRolForm({...rolForm, code: upperValue});
                            handleFieldChange('code', upperValue, 'rol');
                          }}
                          onBlur={() => handleFieldChange('code', rolForm.code, 'rol')}
                          error={formErrors.code}
                          placeholder="ADMIN"
                          required
                          maxLength={50}
                          pattern="[A-Z_]+"
                        />
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Nota:</span> El código del rol se utiliza internamente para identificar los permisos. 
                          Se recomienda usar códigos descriptivos en mayúsculas (ej: ADMIN, OPERATOR, TECH).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SEDES FORM */}
                  {activeTab === 'sedes' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <ValidatedInput
                          label="Código"
                          value={sedeForm.codigo || ''}
                          onChange={(value) => {
                            setSedeForm({...sedeForm, codigo: value});
                            handleFieldChange('codigo', value, 'sede');
                          }}
                          onBlur={() => handleFieldChange('codigo', sedeForm.codigo, 'sede')}
                          error={formErrors.codigo}
                          placeholder="NEI"
                          required
                          maxLength={20}
                        />
                        <ValidatedInput
                          label="Nombre"
                          value={sedeForm.nombre || ''}
                          onChange={(value) => {
                            setSedeForm({...sedeForm, nombre: value});
                            handleFieldChange('nombre', value, 'sede');
                          }}
                          onBlur={() => handleFieldChange('nombre', sedeForm.nombre, 'sede')}
                          error={formErrors.nombre}
                          placeholder="Neiva - Sede Principal"
                          required
                          maxLength={100}
                        />
                      </div>
                      <ValidatedInput
                        label="Dirección"
                        value={sedeForm.direccion || ''}
                        onChange={(value) => {
                          setSedeForm({...sedeForm, direccion: value});
                          handleFieldChange('direccion', value, 'sede');
                        }}
                        onBlur={() => handleFieldChange('direccion', sedeForm.direccion, 'sede')}
                        error={formErrors.direccion}
                        placeholder="Carrera 1a #60-79"
                        required
                        maxLength={200}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <ValidatedInput
                          label="Ciudad"
                          value={sedeForm.ciudad || ''}
                          onChange={(value) => {
                            setSedeForm({...sedeForm, ciudad: value});
                            handleFieldChange('ciudad', value, 'sede');
                          }}
                          onBlur={() => handleFieldChange('ciudad', sedeForm.ciudad, 'sede')}
                          error={formErrors.ciudad}
                          placeholder="Neiva"
                          required
                          maxLength={100}
                        />
                        <ValidatedInput
                          label="Departamento"
                          value={sedeForm.departamento || ''}
                          onChange={(value) => {
                            setSedeForm({...sedeForm, departamento: value});
                            handleFieldChange('departamento', value, 'sede');
                          }}
                          onBlur={() => handleFieldChange('departamento', sedeForm.departamento, 'sede')}
                          error={formErrors.departamento}
                          placeholder="Huila"
                          required
                          maxLength={100}
                        />
                        <ValidatedInput
                          label="Teléfono"
                          type="tel"
                          value={sedeForm.telefono || ''}
                          onChange={(value) => {
                            setSedeForm({...sedeForm, telefono: value});
                            handleFieldChange('telefono', value, 'sede');
                          }}
                          onBlur={() => handleFieldChange('telefono', sedeForm.telefono, 'sede')}
                          error={formErrors.telefono}
                          placeholder="6088664600"
                          maxLength={15}
                        />
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={sedeForm.esPrincipal || false}
                            onChange={(e) => setSedeForm({...sedeForm, esPrincipal: e.target.checked})}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">¿Es sede principal?</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* TIPOS CITA FORM */}
                  {activeTab === 'tipos-cita' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={tipoCitaForm.nombre || ''}
                            onChange={(e) => setTipoCitaForm({...tipoCitaForm, nombre: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                            placeholder="Reclamo por Facturación"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Icono</label>
                          <input
                            type="text"
                            value={tipoCitaForm.icono || ''}
                            onChange={(e) => setTipoCitaForm({...tipoCitaForm, icono: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                            placeholder="💰"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                          value={tipoCitaForm.descripcion || ''}
                          onChange={(e) => setTipoCitaForm({...tipoCitaForm, descripcion: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                          placeholder="Descripción del tipo de cita..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Estimado (minutos)</label>
                          <input
                            type="number"
                            value={tipoCitaForm.tiempoEstimadoMinutos || ''}
                            onChange={(e) => setTipoCitaForm({...tipoCitaForm, tiempoEstimadoMinutos: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                            placeholder="120"
                            min="1"
                            max="480"
                          />
                        </div>
                        <div className="flex items-center pt-6">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tipoCitaForm.requiereDocumentacion || false}
                              onChange={(e) => setTipoCitaForm({...tipoCitaForm, requiereDocumentacion: e.target.checked})}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">¿Requiere documentación?</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HORAS DISPONIBLES FORM */}
                  {activeTab === 'horas-disponibles' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                        <input
                          type="time"
                          value={horaDisponibleForm.hora || ''}
                          onChange={(e) => setHoraDisponibleForm({...horaDisponibleForm, hora: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sede ID</label>
                          <input
                            type="number"
                            value={horaDisponibleForm.sedeId || ''}
                            onChange={(e) => setHoraDisponibleForm({...horaDisponibleForm, sedeId: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                            placeholder="ID de la sede"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cita ID (Opcional)</label>
                          <input
                            type="number"
                            value={horaDisponibleForm.tipoCitaId || ''}
                            onChange={(e) => setHoraDisponibleForm({...horaDisponibleForm, tipoCitaId: e.target.value ? parseInt(e.target.value) : undefined})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1797D5] focus:border-transparent"
                            placeholder="Opcional - Para tipos específicos"
                          />
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Nota:</strong> Si no especifica un Tipo de Cita ID, esta hora estará disponible para todos los tipos de cita.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Modal Actions */}
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => setModalType(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (modalType === 'create') {
                          switch (activeTab) {
                            case 'empleados':
                              handleCreateEmpleado();
                              break;
                            case 'roles':
                              handleCreateRol();
                              break;
                            case 'sedes':
                              handleCreateSede();
                              break;
                            case 'tipos-cita':
                              handleCreateTipoCita();
                              break;
                            case 'horas-disponibles':
                              handleCreateHoraDisponible();
                              break;
                          }
                        } else if (modalType === 'edit') {
                          switch (activeTab) {
                            case 'citas':
                              handleUpdateCita();
                              break;
                            case 'empleados':
                              handleUpdateEmpleado();
                              break;
                            case 'roles':
                              handleUpdateRol();
                              break;
                            case 'sedes':
                              handleUpdateSede();
                              break;
                            case 'tipos-cita':
                              handleUpdateTipoCita();
                              break;
                            case 'horas-disponibles':
                              handleUpdateHoraDisponible();
                              break;
                          }
                        }
                      }}
                      className="px-4 py-2 bg-[#1797D5] text-white rounded-lg hover:bg-[#56C2E1]"
                    >
                      {modalType === 'create' ? 'Crear' : 'Actualizar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#203461] to-[#1A6192] text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-3 mb-8">
            <img 
              src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
              alt="ElectroHuila Logo"
              className="h-10 w-auto object-contain filter brightness-0 invert"
              width="100"
              height="24"
            />
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/70 text-sm">
            © <span className="note-year">{new Date().getFullYear()}</span> ElectroHuila S.A. E.S.P. - Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}