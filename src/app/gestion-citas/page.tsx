"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiService, CitaDto } from '../../services/api';
import { ValidationUtils } from '../../utils/validation';
import { ValidatedInput } from '../../components/ValidatedInput';

// Definir tipos para mejor type safety
interface Cliente {
  id: string;
  numeroCliente: string;
  nombreCompleto: string;
}

interface CompletionData {
  tecnicoAsignado: string;
  observacionesTecnico: string;
}

type ModalType = 'cancel' | 'complete' | null;

export default function GestionCitas() {
  const [codigoUsuario, setCodigoUsuario] = useState('');
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [citas, setCitas] = useState<CitaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cliente, setCliente] = useState<Cliente | null>(null);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedCita, setSelectedCita] = useState<CitaDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [completionData, setCompletionData] = useState<CompletionData>({
    tecnicoAsignado: '',
    observacionesTecnico: ''
  });

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'codigoUsuario':
        if (!value.trim()) {
          return 'Número de cliente es obligatorio';
        }
        if (!/^\d+$/.test(value)) {
          return 'El número de cliente debe contener solo números';
        }
        if (value.length < 3) {
          return 'El número de cliente debe tener al menos 3 dígitos';
        }
        return '';
      case 'cancelReason':
        if (!value.trim()) {
          return 'El motivo de cancelación es obligatorio';
        }
        if (value.trim().length < 10) {
          return 'El motivo debe tener al menos 10 caracteres';
        }
        if (value.length > 500) {
          return 'El motivo no puede tener más de 500 caracteres';
        }
        return '';
      case 'tecnicoAsignado':
        if (!value.trim()) {
          return 'El nombre del técnico es obligatorio';
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          return 'El nombre del técnico debe contener solo letras';
        }
        if (value.trim().length < 2) {
          return 'El nombre del técnico debe tener al menos 2 caracteres';
        }
        if (value.length > 100) {
          return 'El nombre del técnico no puede tener más de 100 caracteres';
        }
        return '';
      case 'observacionesTecnico':
        if (value && value.length > 1000) {
          return 'Las observaciones no pueden tener más de 1000 caracteres';
        }
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    // Actualizar el campo tocado
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));

    // Validar el campo si ya fue tocado
    if (touchedFields[field]) {
      const error = validateField(field, value);
      setValidationErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
    setTouchedFields({});
  };

  const buscarCitas = async () => {
    // Validar número de cliente
    const codigoError = validateField('codigoUsuario', codigoUsuario);
    if (codigoError) {
      setValidationErrors({ codigoUsuario: codigoError });
      setTouchedFields({ codigoUsuario: true });
      setError(codigoError);
      return;
    }

    setLoading(true);
    setError('');
    clearValidationErrors();

    try {
      // Validar cliente y obtener sus citas usando endpoints públicos
      const clienteData = await apiService.validarClientePublico(codigoUsuario);
      setCliente({
        ...clienteData,
        id: String(clienteData.id),
      });

      // Obtener citas del cliente usando endpoint público
      const citasCliente = await apiService.getCitasClientePublico(codigoUsuario);
      
      if (citasCliente.length === 0) {
        setError('No se encontraron citas para este código de usuario');
        setUsuarioAutenticado(false);
      } else {
        setCitas(citasCliente);
        setUsuarioAutenticado(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('Código de usuario no encontrado o sin citas registradas');
      setUsuarioAutenticado(false);
      console.error('Error al buscar citas:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoTexto = (estado: string): string => {
    return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    // If it's already in HH:MM format, convert to display format
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours);
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      const hour12 = hour24 % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  const handleCancelCita = async () => {
    // Validar motivo de cancelación
    const cancelError = validateField('cancelReason', cancelReason);
    if (cancelError) {
      setValidationErrors(prev => ({ ...prev, cancelReason: cancelError }));
      setTouchedFields(prev => ({ ...prev, cancelReason: true }));
      setError(cancelError);
      return;
    }

    if (!selectedCita) {
      setError('Error: Cita no seleccionada');
      return;
    }

    if (!cliente) {
      setError('Error: Cliente no encontrado');
      return;
    }

    try {
      await apiService.cancelarCitaPublica(cliente.numeroCliente, selectedCita.id, cancelReason);
      
      // Refresh citas usando endpoint público
      const citasCliente = await apiService.getCitasClientePublico(cliente.numeroCliente);
      setCitas(citasCliente);
      
      setModalType(null);
      setSelectedCita(null);
      setCancelReason('');
      setError('');
      clearValidationErrors();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al cancelar la cita: ' + errorMessage);
    }
  };

  const handleCompleteCita = async () => {
    // Validar campos requeridos
    const errors: { [key: string]: string } = {};
    
    const tecnicoError = validateField('tecnicoAsignado', completionData.tecnicoAsignado);
    if (tecnicoError) {
      errors.tecnicoAsignado = tecnicoError;
    }
    
    const observacionesError = validateField('observacionesTecnico', completionData.observacionesTecnico);
    if (observacionesError) {
      errors.observacionesTecnico = observacionesError;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setTouchedFields({
        tecnicoAsignado: true,
        observacionesTecnico: true
      });
      setError('Por favor corrija los errores en el formulario');
      return;
    }

    if (!selectedCita) {
      setError('Error: Cita no seleccionada');
      return;
    }

    if (!cliente) {
      setError('Error: Cliente no encontrado');
      return;
    }

    try {
      await apiService.completarCita(
        selectedCita.id, 
        completionData.tecnicoAsignado, 
        completionData.observacionesTecnico
      );
      
      // Refresh citas
      const todasCitas = await apiService.getCitas();
      const citasCliente = todasCitas.filter(cita => String(cita.clienteId) === cliente.id);
      setCitas(citasCliente);
      
      setModalType(null);
      setSelectedCita(null);
      setCompletionData({ tecnicoAsignado: '', observacionesTecnico: '' });
      setError('');
      clearValidationErrors();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al completar la cita: ' + errorMessage);
    }
  };

  const citasPendientes = citas.filter(cita => cita.estado.toLowerCase() === 'pendiente');
  const citasCompletadas = citas.filter(cita => cita.estado.toLowerCase() === 'completada');
  const citasCanceladas = citas.filter(cita => cita.estado.toLowerCase() === 'cancelada');

  const resetForm = () => {
    setUsuarioAutenticado(false);
    setCodigoUsuario('');
    setCitas([]);
    setError('');
    setCliente(null);
    clearValidationErrors();
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedCita(null);
    setCancelReason('');
    setCompletionData({ tecnicoAsignado: '', observacionesTecnico: '' });
    clearValidationErrors();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
                alt="ElectroHuila Logo"
                className="h-12 w-auto object-contain"
                width={120}
                height={29}
              />
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Nuestra Empresa</a>
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Usuarios</a>
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Proveedores</a>
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Contáctenos</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 hover:bg-gray-50 px-3 py-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Volver al Inicio</span>
            </Link>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              📄 Paga tu Factura
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Description */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-white/70 rounded-full text-[#1A6192] text-sm font-medium mb-6 shadow-sm">
            <span className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2 animate-pulse"></span>
            Sistema de Consulta
          </div>
          <h1 className="text-5xl font-bold text-[#203461] mb-4">
            Gestión de
            <span className="bg-gradient-to-r from-[#1797D5] to-[#56C2E1] bg-clip-text text-transparent"> Citas</span>
          </h1>
          <p className="text-xl text-[#1A6192] max-w-2xl mx-auto">
            Consulte el estado de sus citas para reclamos por facturación y reportes por daños
          </p>
        </div>

        {/* Error Alert */}
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

        {!usuarioAutenticado ? (
          /* Login Form */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#97D4E3] to-[#56C2E1] rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <svg className="w-10 h-10 text-[#203461]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#203461] mb-2">Acceso al Sistema</h2>
                <p className="text-gray-600">Ingrese su número de cliente para consultar sus citas de reclamos por facturación y reportes por daños</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="codigo" className="block text-sm font-semibold text-[#203461] mb-2">
                    Número de Cliente
                  </label>
                  <input
                    type="text"
                    id="codigo"
                    value={codigoUsuario}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Solo números
                      setCodigoUsuario(value);
                      handleFieldChange('codigoUsuario', value);
                    }}
                    onBlur={() => {
                      setTouchedFields(prev => ({ ...prev, codigoUsuario: true }));
                      const error = validateField('codigoUsuario', codigoUsuario);
                      setValidationErrors(prev => ({ ...prev, codigoUsuario: error }));
                    }}
                    placeholder="Ej: 12345"
                    maxLength={15}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all duration-300 ${
                      validationErrors.codigoUsuario && touchedFields.codigoUsuario
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-[#56C2E1]'
                    }`}
                    onKeyPress={(e) => e.key === 'Enter' && buscarCitas()}
                  />
                  {validationErrors.codigoUsuario && touchedFields.codigoUsuario && (
                    <div className="text-red-600 text-sm mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.codigoUsuario}
                    </div>
                  )}
                </div>

                <button
                  onClick={buscarCitas}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Consultando...
                    </div>
                  ) : (
                    'Consultar Citas'
                  )}
                </button>

              </div>
            </div>
          </div>
        ) : (
          /* Citas Display */
          <div className="space-y-8">
            {/* User Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#203461]">
                    Cliente: {cliente?.nombreCompleto} ({cliente?.numeroCliente})
                  </h2>
                  <p className="text-gray-600">Total de citas encontradas: {citas.length}</p>
                  <div className="flex items-center space-x-6 mt-2 text-sm">
                    <span className="flex items-center text-yellow-600">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                      Pendientes: {citasPendientes.length}
                    </span>
                    <span className="flex items-center text-green-600">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Completadas: {citasCompletadas.length}
                    </span>
                    <span className="flex items-center text-red-600">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      Canceladas: {citasCanceladas.length}
                    </span>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="flex items-center space-x-2 text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Cambiar Usuario</span>
                </button>
              </div>
            </div>

            {/* Citas Pendientes */}
            {citasPendientes.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-[#203461] mb-6 flex items-center">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></span>
                  Citas Pendientes ({citasPendientes.length})
                </h3>
                <div className="grid gap-6">
                  {citasPendientes.map((cita) => (
                    <div key={cita.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-[#203461] mb-1">{cita.tipoCitaNombre}</h4>
                          <p className="text-gray-600 text-sm">Número: {cita.numeroCita}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(cita.estado)}`}>
                            {getEstadoTexto(cita.estado)}
                          </span>
                          {cita.estado.toLowerCase() === 'pendiente' && (
                            <button
                              onClick={() => {
                                setSelectedCita(cita);
                                setModalType('cancel');
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h.5a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2H8z" />
                          </svg>
                          <span className="font-medium">{formatDate(cita.fechaCita)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTime(cita.horaCita)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{cita.sedeNombre}</span>
                        </div>
                      </div>

                      {cita.observaciones && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Observaciones:</span> {cita.observaciones}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Citas Completadas */}
            {citasCompletadas.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-[#203461] mb-6 flex items-center">
                  <span className="w-3 h-3 bg-green-400 rounded-full mr-3"></span>
                  Historial de Citas Completadas ({citasCompletadas.length})
                </h3>
                <div className="grid gap-6">
                  {citasCompletadas.map((cita) => (
                    <div key={cita.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-[#203461] mb-1">{cita.tipoCitaNombre}</h4>
                          <p className="text-gray-600 text-sm">Número: {cita.numeroCita}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(cita.estado)}`}>
                          {getEstadoTexto(cita.estado)}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h.5a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2H8z" />
                          </svg>
                          <span className="font-medium">{formatDate(cita.fechaCita)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTime(cita.horaCita)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{cita.sedeNombre}</span>
                        </div>
                        {cita.tecnicoAsignado && (
                          <div className="flex items-center text-gray-700">
                            <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{cita.tecnicoAsignado}</span>
                          </div>
                        )}
                      </div>

                      {(cita.observaciones || cita.observacionesTecnico) && (
                        <div className="space-y-3">
                          {cita.observaciones && (
                            <div className="bg-gray-50 rounded-xl p-4">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Observaciones:</span> {cita.observaciones}
                              </p>
                            </div>
                          )}
                          {cita.observacionesTecnico && (
                            <div className="bg-green-50 rounded-xl p-4">
                              <p className="text-sm text-green-800">
                                <span className="font-medium">Observaciones del técnico:</span> {cita.observacionesTecnico}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Citas Canceladas */}
            {citasCanceladas.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-[#203461] mb-6 flex items-center">
                  <span className="w-3 h-3 bg-red-400 rounded-full mr-3"></span>
                  Citas Canceladas ({citasCanceladas.length})
                </h3>
                <div className="grid gap-6">
                  {citasCanceladas.map((cita) => (
                    <div key={cita.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 opacity-75">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-[#203461] mb-1">{cita.tipoCitaNombre}</h4>
                          <p className="text-gray-600 text-sm">Número: {cita.numeroCita}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(cita.estado)}`}>
                          {getEstadoTexto(cita.estado)}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h.5a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2H8z" />
                          </svg>
                          <span className="font-medium">{formatDate(cita.fechaCita)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTime(cita.horaCita)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{cita.sedeNombre}</span>
                        </div>
                      </div>

                      {cita.observaciones && (
                        <div className="bg-red-50 rounded-xl p-4">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">Motivo de cancelación:</span> {cita.observaciones}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No hay citas */}
            {citas.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h.5a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2H8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay citas registradas</h3>
                <p className="text-gray-500 mb-4">No se encontraron citas para este usuario.</p>
                <Link 
                  href="/agendamiento-citas"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#203461] to-[#1797D5] text-white rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agendar Nueva Cita
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {modalType && selectedCita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#203461]">
                  {modalType === 'cancel' ? 'Cancelar Cita' : 'Completar Cita'}
                </h3>
                <button
                  onClick={closeModal}
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
              {modalType === 'cancel' ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    ¿Está seguro de que desea cancelar la cita <strong>{selectedCita.numeroCita}</strong>?
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de la cancelación *
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => {
                        setCancelReason(e.target.value);
                        handleFieldChange('cancelReason', e.target.value);
                      }}
                      onBlur={() => {
                        setTouchedFields(prev => ({ ...prev, cancelReason: true }));
                        const error = validateField('cancelReason', cancelReason);
                        setValidationErrors(prev => ({ ...prev, cancelReason: error }));
                      }}
                      rows={3}
                      maxLength={500}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300 ${
                        validationErrors.cancelReason && touchedFields.cancelReason
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#1797D5]'
                      }`}
                      placeholder="Explique el motivo de la cancelación (mínimo 10 caracteres)..."
                    />
                    <div className="flex justify-between items-center mt-1">
                      <div>
                        {validationErrors.cancelReason && touchedFields.cancelReason && (
                          <div className="text-red-600 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {validationErrors.cancelReason}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {cancelReason.length}/500
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setModalType(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCancelCita}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Confirmar Cancelación
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    Complete la información para marcar la cita <strong>{selectedCita.numeroCita}</strong> como completada.
                  </p>
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Técnico Asignado *
                      </label>
                      <input
                        type="text"
                        value={completionData.tecnicoAsignado}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); // Solo letras y espacios
                          setCompletionData({...completionData, tecnicoAsignado: value});
                          handleFieldChange('tecnicoAsignado', value);
                        }}
                        onBlur={() => {
                          setTouchedFields(prev => ({ ...prev, tecnicoAsignado: true }));
                          const error = validateField('tecnicoAsignado', completionData.tecnicoAsignado);
                          setValidationErrors(prev => ({ ...prev, tecnicoAsignado: error }));
                        }}
                        maxLength={100}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300 ${
                          validationErrors.tecnicoAsignado && touchedFields.tecnicoAsignado
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-[#1797D5]'
                        }`}
                        placeholder="Nombre completo del técnico"
                      />
                      {validationErrors.tecnicoAsignado && touchedFields.tecnicoAsignado && (
                        <div className="text-red-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {validationErrors.tecnicoAsignado}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones del técnico
                      </label>
                      <textarea
                        value={completionData.observacionesTecnico}
                        onChange={(e) => {
                          setCompletionData({...completionData, observacionesTecnico: e.target.value});
                          handleFieldChange('observacionesTecnico', e.target.value);
                        }}
                        onBlur={() => {
                          setTouchedFields(prev => ({ ...prev, observacionesTecnico: true }));
                          const error = validateField('observacionesTecnico', completionData.observacionesTecnico);
                          setValidationErrors(prev => ({ ...prev, observacionesTecnico: error }));
                        }}
                        rows={3}
                        maxLength={1000}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300 ${
                          validationErrors.observacionesTecnico && touchedFields.observacionesTecnico
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-[#1797D5]'
                        }`}
                        placeholder="Observaciones sobre el trabajo realizado (opcional)..."
                      />
                      <div className="flex justify-between items-center mt-1">
                        <div>
                          {validationErrors.observacionesTecnico && touchedFields.observacionesTecnico && (
                            <div className="text-red-600 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {validationErrors.observacionesTecnico}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {completionData.observacionesTecnico.length}/1000
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setModalType(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCompleteCita}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Completar Cita
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
            <Image 
              src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
              alt="ElectroHuila Logo"
              className="h-10 w-auto object-contain filter brightness-0 invert"
              width={100}
              height={24}
            />
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 text-sm">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">📞 Atención al Cliente</div>
              <div className="text-white/90">(608) 8664600</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">📞 Mesa de Ayuda</div>
              <div className="text-white/90">(608) 8664646</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">📞 Línea Gratuita</div>
              <div className="text-white/90">018000952115</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">🔍 Transparencia</div>
              <div className="text-white/90">Línea PQR</div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/70 text-sm">
            © 2025 ElectroHuila S.A. E.S.P. - Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}