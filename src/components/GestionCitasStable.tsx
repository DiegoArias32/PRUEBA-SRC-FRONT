"use client";

import React, { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiService, CitaDto, ClienteDto } from '../services/api';
import { ValidationUtils } from '../utils/validation';



interface CompletionData {
  tecnicoAsignado: string;
  observacionesTecnico: string;
}

interface CancellationData {
  motivo: string;
}

// Componente memoizado para estabilizar renders
const GestionCitasContent = memo(() => {
  // Estados principales
  const [numeroCliente, setNumeroCliente] = useState('');
  const [cliente, setCliente] = useState<ClienteDto | null>(null);
  const [citas, setCitas] = useState<CitaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para modales
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<CitaDto | null>(null);
  
  // Estados para formularios de modales
  const [cancellationData, setCancellationData] = useState<CancellationData>({
    motivo: ''
  });
  
  const [completionData, setCompletionData] = useState<CompletionData>({
    tecnicoAsignado: '',
    observacionesTecnico: ''
  });

  // Estados de validación
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  // Función de validación centralizada
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'numeroCliente':
        const clientValidation = ValidationUtils.validateIdentificationNumber(value);
        return clientValidation.isValid ? '' : clientValidation.message;
      
      case 'motivo':
        if (!value || value.trim().length === 0) {
          return 'La razón de cancelación es obligatoria';
        }
        if (value.trim().length < 10) {
          return 'La razón debe tener al menos 10 caracteres';
        }
        if (value.length > 500) {
          return 'La razón no puede tener más de 500 caracteres';
        }
        return '';
        
      case 'tecnicoAsignado':
        if (!value || value.trim().length === 0) {
          return 'El técnico asignado es obligatorio';
        }
  const nameValidation = ValidationUtils.validateName(value, 'Técnico asignado');
        return nameValidation.isValid ? '' : nameValidation.message;
        
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

  // Buscar cliente por número
  const buscarCitas = async () => {
    if (!numeroCliente.trim()) {
      setError('Por favor ingrese un número de cliente');
      return;
    }

    // Validar número de cliente
    const clientError = validateField('numeroCliente', numeroCliente);
    if (clientError) {
      setValidationErrors(prev => ({ ...prev, numeroCliente: clientError }));
      setTouchedFields(prev => ({ ...prev, numeroCliente: true }));
      setError('Por favor corrija el número de cliente');
      return;
    }

    setLoading(true);
    GestionCitasContent.displayName = "GestionCitasContent";
    setError('');
    clearValidationErrors();

    try {
      // Buscar cliente y sus citas
      const [clienteData, citasData] = await Promise.all([
        apiService.getClienteByNumero(numeroCliente),
        apiService.getCitasClientePublico(numeroCliente)
      ]);

      setCliente(clienteData);
      setCitas(citasData || []);

      if (!citasData || citasData.length === 0) {
        setError('No se encontraron citas para este cliente');
      }
    } catch (err) {
      console.error('Error al buscar citas:', err);
      setError('Cliente no encontrado o error en el servidor');
      setCliente(null);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cancelación de cita
  const handleCancelCita = async () => {
    // Validar campos requeridos
    const motivoError = validateField('motivo', cancellationData.motivo);
    if (motivoError) {
      setValidationErrors(prev => ({ ...prev, motivo: motivoError }));
      setTouchedFields(prev => ({ ...prev, motivo: true }));
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

    setLoading(true);
    try {
      await apiService.cancelarCita(selectedCita.id, cancellationData.motivo);
      
      // Actualizar la lista de citas localmente
      setCitas(prev => prev.map(cita => 
        cita.id === selectedCita.id 
          ? { ...cita, estado: 'Cancelada', motivoCancelacion: cancellationData.motivo }
          : cita
      ));

      // Limpiar y cerrar modal
      setCancellationData({ motivo: '' });
      setShowCancelModal(false);
      setSelectedCita(null);
      clearValidationErrors();
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al cancelar la cita: ' + errorMessage);
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      await apiService.completarCita(
        selectedCita.id, 
        completionData.tecnicoAsignado,
        completionData.observacionesTecnico || ''
      );
      
      // Actualizar la lista de citas localmente
      setCitas(prev => prev.map(cita => 
        cita.id === selectedCita.id 
          ? { 
              ...cita, 
              estado: 'Completada', 
              tecnicoAsignado: completionData.tecnicoAsignado,
              observacionesTecnico: completionData.observacionesTecnico || ''
            }
          : cita
      ));

      // Limpiar y cerrar modal
      setCompletionData({ tecnicoAsignado: '', observacionesTecnico: '' });
      setShowCompleteModal(false);
      setSelectedCita(null);
      clearValidationErrors();
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al completar la cita: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de cancelación
  const openCancelModal = (cita: CitaDto) => {
    setSelectedCita(cita);
    setCancellationData({ motivo: '' });
    clearValidationErrors();
    setShowCancelModal(true);
  };

  // Abrir modal de completar
  const openCompleteModal = (cita: CitaDto) => {
    setSelectedCita(cita);
    setCompletionData({ tecnicoAsignado: '', observacionesTecnico: '' });
    clearValidationErrors();
    setShowCompleteModal(true);
  };

  // Cerrar modales
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedCita(null);
    setCancellationData({ motivo: '' });
    clearValidationErrors();
    setError('');
  };

  const closeCompleteModal = () => {
    setShowCompleteModal(false);
    setSelectedCita(null);
    setCompletionData({ tecnicoAsignado: '', observacionesTecnico: '' });
    clearValidationErrors();
    setError('');
  };

  return (
    <div key="gestion-citas-stable" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-40 border-b border-gray-200/50">
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
            <div>
              <h1 className="text-2xl font-bold text-[#203461]">Gestión de Citas</h1>
              <p className="text-sm text-gray-600">Sistema de administración de citas técnicas</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin" 
              className="text-[#203461] hover:text-[#1797D5] font-medium transition-colors duration-300"
            >
              Panel Admin
            </Link>
            <Link 
              href="/" 
              className="bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-6 py-2 rounded-lg hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#97D4E3] to-[#56C2E1] rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <svg className="w-10 h-10 text-[#203461]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#203461] mb-2">Buscar Citas por Cliente</h2>
            <p className="text-gray-600">Ingrese el número de cliente para ver y gestionar sus citas</p>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Cliente
              </label>
              <input
                type="text"
                value={numeroCliente}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Solo números
                  setNumeroCliente(value);
                  handleFieldChange('numeroCliente', value);
                }}
                onBlur={() => {
                  setTouchedFields(prev => ({ ...prev, numeroCliente: true }));
                  const error = validateField('numeroCliente', numeroCliente);
                  setValidationErrors(prev => ({ ...prev, numeroCliente: error }));
                }}
                placeholder="Ej: 12345"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                  validationErrors.numeroCliente && touchedFields.numeroCliente
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-[#1797D5]'
                }`}
              />
              {validationErrors.numeroCliente && touchedFields.numeroCliente && (
                <div className="text-red-600 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.numeroCliente}
                </div>
              )}
            </div>

            <button
              onClick={buscarCitas}
              disabled={loading || !!validationErrors.numeroCliente || !numeroCliente.trim()}
              className="w-full bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Buscando...
                </div>
              ) : (
                <>
                  🔍 Buscar Citas
                  <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Customer Info */}
        {cliente && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#203461]">Cliente: {cliente.nombreCompleto}</h3>
                <p className="text-gray-600">Número: {cliente.numeroCliente}</p>
              </div>
              <div className="bg-gradient-to-br from-[#97D4E3] to-[#56C2E1] text-[#203461] px-4 py-2 rounded-lg font-medium">
                {citas.length} cita{citas.length !== 1 ? 's' : ''} encontrada{citas.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {citas.length > 0 && (
          <div className="space-y-4">
            {citas.map((cita) => (
              <div key={`cita-${cita.id}`} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
                <div className="grid md:grid-cols-4 gap-4 items-center">
                  <div>
                    <h4 className="font-semibold text-[#203461]">{cita.tipoCitaNombre || 'Cita Técnica'}</h4>
                    <p className="text-sm text-gray-600">#{cita.numeroCita}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha y Hora</p>
                    <p className="font-medium">{new Date(cita.fechaCita).toLocaleDateString()} - {cita.horaCita}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      cita.estado === 'Programada' ? 'bg-blue-100 text-blue-800' :
                      cita.estado === 'Completada' ? 'bg-green-100 text-green-800' :
                      cita.estado === 'Cancelada' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cita.estado}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {cita.estado === 'Programada' && (
                      <>
                        <button
                          onClick={() => openCompleteModal(cita)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          ✓ Completar
                        </button>
                        <button
                          onClick={() => openCancelModal(cita)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          ✗ Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {cita.observaciones && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Observaciones: {cita.observaciones}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de Cancelación */}
        {showCancelModal && selectedCita && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#203461]">Cancelar Cita</h3>
                  <button
                    onClick={closeCancelModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600">Cita: <span className="font-medium">{selectedCita.numeroCita}</span></p>
                  <p className="text-gray-600">Fecha: <span className="font-medium">{new Date(selectedCita.fechaCita).toLocaleDateString()}</span></p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razón de cancelación *
                    </label>
                    <textarea
                      value={cancellationData.motivo}
                      onChange={(e) => {
                        setCancellationData({...cancellationData, motivo: e.target.value});
                        handleFieldChange('motivo', e.target.value);
                      }}
                      onBlur={() => {
                        setTouchedFields(prev => ({ ...prev, motivo: true }));
                        const error = validateField('motivo', cancellationData.motivo);
                        setValidationErrors(prev => ({ ...prev, motivo: error }));
                      }}
                      rows={4}
                      maxLength={500}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300 ${
                        validationErrors.motivo && touchedFields.motivo
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-[#1797D5]'
                      }`}
                      placeholder="Explique la razón de la cancelación..."
                    />
                    <div className="flex justify-between items-center mt-1">
                      <div>
                        {validationErrors.motivo && touchedFields.motivo && (
                          <div className="text-red-600 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {validationErrors.motivo}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {cancellationData.motivo.length}/500
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={closeCancelModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCancelCita}
                    disabled={loading || !!validationErrors.motivo || !cancellationData.motivo.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Completar */}
        {showCompleteModal && selectedCita && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#203461]">Completar Cita</h3>
                  <button
                    onClick={closeCompleteModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600">Cita: <span className="font-medium">{selectedCita.numeroCita}</span></p>
                  <p className="text-gray-600">Fecha: <span className="font-medium">{new Date(selectedCita.fechaCita).toLocaleDateString()}</span></p>
                </div>

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

                <div className="flex space-x-3">
                  <button
                    onClick={closeCompleteModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCompleteCita}
                    disabled={loading || !!validationErrors.tecnicoAsignado || !completionData.tecnicoAsignado.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Completando...' : 'Marcar como Completada'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#203461] text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4">
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
            <div>
              <h4 className="font-semibold mb-3">ElectroHuila</h4>
              <p className="text-gray-300 leading-relaxed">
                Empresa de servicios públicos comprometida con el desarrollo y bienestar del Huila.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Servicios</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Agendamiento de Citas</li>
                <li>Solicitud de Nuevas Conexiones</li>
                <li>Gestión de Servicios Técnicos</li>
                <li>Atención al Cliente</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contacto</h4>
              <ul className="space-y-2 text-gray-300">
                <li>📞 Línea de Atención</li>
                <li>📧 info@electrohuila.com.co</li>
                <li>🌐 www.electrohuila.com.co</li>
                <li>📍 Neiva, Huila</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Horarios</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Lunes a Viernes</li>
                <li>7:30 AM - 5:30 PM</li>
                <li>Sábados</li>
                <li>8:00 AM - 12:00 PM</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-600 mt-8 pt-6 text-center text-gray-400">
            <p>&copy; 2024 ElectroHuila. Todos los derechos reservados. | Sistema de Gestión de Citas v1.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default function GestionCitasPage() {
  return <GestionCitasContent />;
}
