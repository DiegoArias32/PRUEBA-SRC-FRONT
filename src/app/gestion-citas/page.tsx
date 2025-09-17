"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiService, CitaDto } from '../../services/api';
// ...existing code...
import { ValidatedInput } from '../../components/ValidatedInput';
import FixedHeader from '../../components/FixedHeader';
import BackNavigation from '../../components/BackNavigation';

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
  const [successMessage, setSuccessMessage] = useState('');
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

  // UI states
  const [activeTab, setActiveTab] = useState<'pendientes' | 'completadas' | 'canceladas'>('pendientes');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

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
      
      // Esperar un momento para que el backend procese el cambio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh citas usando endpoint público
      const citasCliente = await apiService.getCitasClientePublico(cliente.numeroCliente);
      setCitas(citasCliente);
      
      // Cambiar automáticamente al tab de canceladas para mostrar la cita cancelada
      setActiveTab('canceladas');
      
      // Mostrar mensaje de éxito
      setSuccessMessage(`Cita ${selectedCita.numeroCita} cancelada exitosamente`);
      setTimeout(() => setSuccessMessage(''), 5000); // Ocultar después de 5 segundos
      
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

  // Componente de Estadísticas
  const StatsCard = ({ title, count, color, icon }: { title: string; count: number; color: string; icon: React.ReactNode }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-[#203461]">{count}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Componente de Tarjeta de Cita Compacta
  const CitaCard = ({ cita, isExpanded }: { cita: CitaDto; isExpanded: boolean }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="p-6">
        {/* Header de la tarjeta */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-[#203461] mb-1">{cita.tipoCitaNombre}</h4>
            <p className="text-sm text-gray-600">#{cita.numeroCita}</p>
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
                className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Información básica siempre visible */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-gray-700">
            <svg className="w-4 h-4 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h.5a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2H8z" />
            </svg>
            <span className="text-sm font-medium">{formatDate(cita.fechaCita)}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <svg className="w-4 h-4 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{formatTime(cita.horaCita)}</span>
          </div>
        </div>

        {/* Información expandible */}
        {isExpanded && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center text-gray-700">
              <svg className="w-4 h-4 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">{cita.sedeNombre}</span>
            </div>
            
            {cita.tecnicoAsignado && (
              <div className="flex items-center text-gray-700">
                <svg className="w-4 h-4 text-[#56C2E1] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm">{cita.tecnicoAsignado}</span>
              </div>
            )}

            {cita.observaciones && (
              <div className={`rounded-xl p-3 ${
                cita.estado.toLowerCase() === 'cancelada' ? 'bg-red-50' :
                cita.estado.toLowerCase() === 'completada' ? 'bg-gray-50' : 'bg-blue-50'
              }`}>
                <p className={`text-sm ${
                  cita.estado.toLowerCase() === 'cancelada' ? 'text-red-700' :
                  cita.estado.toLowerCase() === 'completada' ? 'text-gray-700' : 'text-blue-700'
                }`}>
                  <span className="font-medium">
                    {cita.estado.toLowerCase() === 'cancelada' ? 'Motivo de cancelación:' : 'Observaciones:'}
                  </span> {cita.observaciones}
                </p>
              </div>
            )}

            {cita.observacionesTecnico && (
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Observaciones del técnico:</span> {cita.observacionesTecnico}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botón de expandir/colapsar */}
        <button
          onClick={() => setExpandedCard(isExpanded ? null : cita.id)}
          className="w-full mt-4 py-2 text-sm text-[#1797D5] hover:text-[#203461] font-medium flex items-center justify-center transition-colors"
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
              Ver menos
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              Ver detalles
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <FixedHeader />

      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">{/* pt-24 para compensar el header fixed */}
        <BackNavigation backTo="/servicios" />
        
        {/* Page Description */}
        <div className="text-center mb-12">
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
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.4JUdGzvrMFDWrUUwY3toJATSeNwjn54LkCnKBPRzDuhzi5vSepHfUckJNxRL2gjkNrSqtCoRUrEDAgRwsQvVCjZbRyFTLRNyDmT1a1boZV293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
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
                <ValidatedInput
                  label="Número de Cliente"
                  value={codigoUsuario}
                  onChange={(value) => {
                    const onlyNumbers = value.replace(/\D/g, '');
                    setCodigoUsuario(onlyNumbers);
                    handleFieldChange('codigoUsuario', onlyNumbers);
                  }}
                  onBlur={() => {
                    setTouchedFields(prev => ({ ...prev, codigoUsuario: true }));
                    const error = validateField('codigoUsuario', codigoUsuario);
                    setValidationErrors(prev => ({ ...prev, codigoUsuario: error }));
                  }}
                  error={touchedFields.codigoUsuario ? validationErrors.codigoUsuario : ''}
                  type="text"
                  placeholder="Ej: 12345"
                  required
                  maxLength={15}
                  inputClassName="px-4 py-3 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all duration-300"
                />

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
          /* Dashboard y Citas Display */
          <div className="space-y-8">
            {/* User Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#203461]">
                    Cliente: {cliente?.nombreCompleto} ({cliente?.numeroCliente})
                  </h2>
                  <p className="text-gray-600">Total de citas encontradas: {citas.length}</p>
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

            {/* Dashboard de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Citas Pendientes"
                count={citasPendientes.length}
                color="bg-yellow-100"
                icon={
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatsCard
                title="Citas Completadas"
                count={citasCompletadas.length}
                color="bg-green-100"
                icon={
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatsCard
                title="Citas Canceladas"
                count={citasCanceladas.length}
                color="bg-red-100"
                icon={
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Sistema de Pestañas */}
            {citas.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Tab Headers */}
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    <button
                      onClick={() => setActiveTab('pendientes')}
                      className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors ${
                        activeTab === 'pendientes'
                          ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        <span>Pendientes ({citasPendientes.length})</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('completadas')}
                      className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors ${
                        activeTab === 'completadas'
                          ? 'border-green-500 text-green-600 bg-green-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span>Completadas ({citasCompletadas.length})</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('canceladas')}
                      className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors ${
                        activeTab === 'canceladas'
                          ? 'border-red-500 text-red-600 bg-red-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        <span>Canceladas ({citasCanceladas.length})</span>
                      </div>
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Citas Pendientes */}
                  {activeTab === 'pendientes' && (
                    <div>
                      {citasPendientes.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {citasPendientes.map((cita) => (
                            <CitaCard
                              key={cita.id}
                              cita={cita}
                              isExpanded={expandedCard === cita.id}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay citas pendientes</h3>
                          <p className="text-gray-500">Todas tus citas están completadas o canceladas.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Citas Completadas */}
                  {activeTab === 'completadas' && (
                    <div>
                      {citasCompletadas.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {citasCompletadas.map((cita) => (
                            <CitaCard
                              key={cita.id}
                              cita={cita}
                              isExpanded={expandedCard === cita.id}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay citas completadas</h3>
                          <p className="text-gray-500">Aún no se han completado citas.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Citas Canceladas */}
                  {activeTab === 'canceladas' && (
                    <div>
                      {citasCanceladas.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {citasCanceladas.map((cita) => (
                            <CitaCard
                              key={cita.id}
                              cita={cita}
                              isExpanded={expandedCard === cita.id}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay citas canceladas</h3>
                          <p className="text-gray-500">No se han cancelado citas.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No hay citas en absoluto */}
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
              <div className="font-semibold mb-2">?? Atención al Cliente</div>
              <div className="text-white/90">(608) 8664600</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">?? Mesa de Ayuda</div>
              <div className="text-white/90">(608) 8664646</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">?? Línea Gratuita</div>
              <div className="text-white/90">018000952115</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="font-semibold mb-2">?? Transparencia</div>
              <div className="text-white/90">Línea PQR</div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/70 text-sm">
            © <span className="note-year">{new Date().getFullYear()}</span> ElectroHuila S.A. E.S.P. - Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}