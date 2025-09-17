"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { apiService, SedeDto } from '../../services/api';
import { ValidationUtils } from '../../utils/validation';
import { ValidatedInput, ValidatedSelect } from '../../components/ValidatedInput';
import FixedHeader from '@/components/FixedHeader';
import BackNavigation from '../../components/BackNavigation';

interface SolicitudData {
  numeroSolicitud: string;
  fechaCreacion: string;
  personalData: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombreCompleto: string;
    telefono: string;
    celular: string;
    email: string;
  };
  propertyData: {
    tipoInmueble: string;
    direccion: string;
    barrio: string;
    municipio: string;
    estrato: string;
    metrosCuadrados: string;
    numeroApartamento: string;
    usoServicio: string;
  };
  technicalData: {
    tipoInstalacion: string;
    cargaRequerida: string;
    tipoConexion: string;
    tieneTransformador: string;
    distanciaRed: string;
  };
  appointmentData: {
    sede: string;
    appointmentDate: string;
    appointmentTime: string;
  };
  observations: string;
}

// Opciones dinámicas que se pueden configurar
const TIPOS_DOCUMENTO = ['Cédula de Ciudadanía', 'Cédula de Extranjería', 'NIT', 'Pasaporte'];

export default function CuentasNuevasPage() {
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [loading, setLoading] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [error, setError] = useState('');
  const [solicitudData, setSolicitudData] = useState<SolicitudData | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  
  // Data from API
  const [sedes, setSedes] = useState<SedeDto[]>([]);
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);
  
  const [personalData, setPersonalData] = useState({
    tipoDocumento: 'Cédula de Ciudadanía',
    numeroDocumento: '',
    nombreCompleto: '',
    telefono: '',
    celular: '',
    email: ''
  });

  const [propertyData, setPropertyData] = useState({
    tipoInmueble: 'Casa',
    direccion: '',
    barrio: '',
    municipio: 'Neiva',
    estrato: 3,
    metrosCuadrados: '',
    numeroApartamento: '',
    usoServicio: 'Residencial'
  });

  const [observations, setObservations] = useState('');

  const [appointmentData, setAppointmentData] = useState({
    sede: '',
    sedeId: 0,
    appointmentDate: '',
    appointmentTime: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadHorasDisponibles = useCallback(async () => {
    if (!appointmentData.appointmentDate || !appointmentData.sedeId) return;
    
    setLoadingHours(true);
    try {
      const horas = await apiService.getHorasDisponiblesPublicas(
        appointmentData.appointmentDate, 
        appointmentData.sedeId
      );
      
      setHorasDisponibles(horas || []);
      
      // Clear selected time if it's no longer available
      if (appointmentData.appointmentTime && !horas.includes(appointmentData.appointmentTime)) {
        setAppointmentData(prev => ({
          ...prev,
          appointmentTime: ''
        }));
      }
    } catch {
      setError('Error al cargar los horarios disponibles. Intente nuevamente.');
      setHorasDisponibles([]);
    } finally {
      setLoadingHours(false);
    }
  }, [appointmentData.appointmentDate, appointmentData.sedeId, appointmentData.appointmentTime]);

  // Load available hours when date or sede changes
  useEffect(() => {
    if (appointmentData.appointmentDate && appointmentData.sedeId && step === 'form') {
      loadHorasDisponibles();
    }
  }, [appointmentData.appointmentDate, appointmentData.sedeId, step, loadHorasDisponibles]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const sedesData = await apiService.getSedesPublicas();
      setSedes(sedesData);

      // Set default values
      if (sedesData.length > 0) {
        const sedePrincipal = sedesData.find(s => s.esPrincipal) || sedesData[0];
        setAppointmentData(prev => ({
          ...prev,
          sede: sedePrincipal.nombre,
          sedeId: sedePrincipal.id
        }));
      }

      // Set default date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setAppointmentData(prev => ({
        ...prev,
        appointmentDate: tomorrow.toISOString().split('T')[0]
      }));

    } catch (err: unknown) {
      setError('Error al cargar los datos iniciales: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (solicitudData: { numeroSolicitud: string }) => {
    try {
      // URL directa para verificación de la solicitud
      const verificacionURL = `http://localhost:3000/verificar-cuenta-nueva?numero=${encodeURIComponent(solicitudData.numeroSolicitud)}&documento=${encodeURIComponent(personalData.numeroDocumento)}`;
      
      // Generar el código QR que apunta directamente a la URL de verificación
      const qrCodeDataURL = await QRCode.toDataURL(verificacionURL, {
        width: 200,
        margin: 2,
        color: {
          dark: '#203461',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeDataURL(qrCodeDataURL);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generando código QR:', error);
      return null;
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('es-CO');
    const time = now.toLocaleTimeString('es-CO', { hour12: false });
    return `${date} ${time}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos requeridos
    const errors: { [key: string]: string } = {};
    
    // Validaciones de datos personales
    // Validación de nombre: solo letras y espacios
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(personalData.nombreCompleto.trim())) {
      errors.nombreCompleto = 'El nombre solo debe contener letras y espacios.';
    }

    // Validación de número de cédula: solo números, 10 dígitos
    if (!/^\d{10}$/.test(personalData.numeroDocumento.trim())) {
      errors.numeroDocumento = 'El número de cédula debe tener exactamente 10 dígitos numéricos.';
    }

    // Validación de email: debe tener '@' y al menos un '.' después de la '@'
    if (!/^.+@.+\..+$/.test(personalData.email.trim())) {
      errors.email = 'El correo debe ser una dirección válida.';
    }

    // Validación de celular: solo números, 10 dígitos
    if (!/^\d{10}$/.test(personalData.celular.trim())) {
      errors.celular = 'El número de celular debe tener exactamente 10 dígitos numéricos.';
    }
    
    // Validaciones opcionales de teléfono
    if (personalData.telefono) {
      const telefonoValidation = ValidationUtils.validatePhone(personalData.telefono, false);
      if (!telefonoValidation.isValid) {
        errors.telefono = telefonoValidation.message;
      }
    }
    
    // Validaciones de propiedad
    const direccionValidation = ValidationUtils.validateAddress(propertyData.direccion);
    if (!direccionValidation.isValid) {
      errors.direccion = direccionValidation.message;
    }
    
    if (propertyData.metrosCuadrados) {
      const metrosValidation = ValidationUtils.validateSquareMeters(propertyData.metrosCuadrados);
      if (!metrosValidation.isValid) {
        errors.metrosCuadrados = metrosValidation.message;
      }
    }
    
    // Validaciones de cita
    if (!appointmentData.appointmentTime) {
      errors.appointmentTime = 'Por favor seleccione una hora para su cita';
    }
    
    if (!appointmentData.sedeId) {
      errors.sede = 'Por favor seleccione una sede';
    }
    
    if (!appointmentData.appointmentDate) {
      errors.appointmentDate = 'Por favor seleccione una fecha';
    }

    // Si hay errores, mostrarlos y no continuar
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Por favor corrija los errores en el formulario antes de continuar');
      // Scroll to the first error
      const firstErrorElement = document.querySelector('.text-red-600');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setValidationErrors({});
    setLoading(true);
    setError('');

    try {
      // Crear solicitud usando endpoint público
      const solicitudDataForAPI = {
        tipoDocumento: personalData.tipoDocumento,
        numeroDocumento: personalData.numeroDocumento,
        nombreCompleto: personalData.nombreCompleto,
        telefono: personalData.telefono,
        celular: personalData.celular,
        email: personalData.email,
        tipoInmueble: propertyData.tipoInmueble,
        direccion: propertyData.direccion,
        barrio: propertyData.barrio,
        municipio: propertyData.municipio,
        estrato: propertyData.estrato,
        metrosCuadrados: parseFloat(propertyData.metrosCuadrados) || 0,
        numeroApartamento: propertyData.numeroApartamento,
        usoServicio: propertyData.usoServicio,
        tipoInstalacion: 'Monofásica (1Φ)', // Valor por defecto para formulario simplificado
        cargaRequerida: '5 kW', // Valor por defecto
        tipoConexion: 'Aérea', // Valor por defecto
        tieneTransformador: 'No', // Valor por defecto
        distanciaRed: 'Menos de 50m', // Valor por defecto
        sedeId: appointmentData.sedeId,
        fechaCita: appointmentData.appointmentDate,
        horaCita: appointmentData.appointmentTime,
        observaciones: observations
      };

      const nuevaSolicitud = await apiService.solicitarCuentaNuevaPublica(solicitudDataForAPI);

      // Generar código QR para la solicitud
      await generateQRCode(nuevaSolicitud);

      const solicitud = {
        numeroSolicitud: nuevaSolicitud.numeroSolicitud,
        fechaCreacion: getCurrentDateTime(),
        personalData,
        propertyData: {
          ...propertyData,
          estrato: propertyData.estrato.toString(),
          metrosCuadrados: propertyData.metrosCuadrados
        },
        technicalData: {
          tipoInstalacion: 'Monofásica (1Φ)',
          cargaRequerida: '5 kW',
          tipoConexion: 'Aérea',
          tieneTransformador: 'No',
          distanciaRed: 'Menos de 50m'
        },
        appointmentData,
        observations
      };
      
      setSolicitudData(solicitud);
      setStep('confirmation');
    } catch (err: unknown) {
      setError('Error al solicitar cuenta nueva: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewRequest = () => {
    setStep('form');
    setPersonalData({
      tipoDocumento: 'Cédula de Ciudadanía',
      numeroDocumento: '',
      nombreCompleto: '',
      telefono: '',
      celular: '',
      email: ''
    });
    setPropertyData({
      tipoInmueble: 'Casa',
      direccion: '',
      barrio: '',
      municipio: 'Neiva',
      estrato: 3,
      metrosCuadrados: '',
      numeroApartamento: '',
      usoServicio: 'Residencial'
    });
    setObservations('');
    
    // Reset appointment data with defaults
    if (sedes.length > 0) {
      const sedePrincipal = sedes.find(s => s.esPrincipal) || sedes[0];
      setAppointmentData({
        sede: sedePrincipal.nombre,
        sedeId: sedePrincipal.id,
        appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        appointmentTime: ''
      });
    }
    
    setSolicitudData(null);
    setQrCodeDataURL('');
    setHorasDisponibles([]);
    setError('');
  };

  const formatTimeForDisplay = (time: string) => {
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
  };

  const handleSedeChange = (selectedSede: string) => {
    const sede = sedes.find(s => s.nombre === selectedSede);
    if (sede) {
      setAppointmentData(prev => ({
        ...prev,
        sede: selectedSede,
        sedeId: sede.id,
        appointmentTime: '' // Clear selected time when sede changes
      }));
    }
  };

  const handleDateChange = (nuevaFecha: string) => {
    setAppointmentData(prev => ({
      ...prev,
      appointmentDate: nuevaFecha,
      appointmentTime: '' // Clear selected time when date changes
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      {/* Header */}
      <FixedHeader />

      {/* Back Navigation */}
      <div className="max-w-6xl mx-auto px-4 pt-24">
        <BackNavigation backTo="/servicios" />
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 print:hidden">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-white/70 rounded-full text-[#1A6192] text-sm font-medium mb-6 shadow-sm">
            <span className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2 animate-pulse"></span>
            Cuentas Nuevas
          </div>
          <h1 className="text-5xl font-bold text-[#203461] mb-4">
            Solicite su
            <span className="bg-gradient-to-r from-[#1797D5] to-[#56C2E1] bg-clip-text text-transparent"> Cuenta Nueva</span>
          </h1>
          <h2 className="text-2xl font-semibold text-[#1A6192] mb-6">ElectroHuila</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete el formulario para solicitar la instalación de servicio eléctrico
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


        {/* FORM STEP */}
        {step === 'form' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="p-8">
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 mb-8">
                  <p className="text-blue-700 text-sm font-medium flex items-center">
                    <span className="text-2xl mr-2">🏠</span>
                    Solicitud de Cuenta Nueva - Solo datos personales
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 mb-8">
                  <p className="text-blue-700 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Debe presentarse 10 minutos antes de la hora agendada con los documentos requeridos
                  </p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-8">
                {/* Datos Personales */}
                <div className="bg-gradient-to-r from-[#97D4E3]/5 to-[#56C2E1]/5 rounded-2xl p-6 border border-[#56C2E1]/10">
                  <h4 className="text-xl font-semibold text-[#203461] mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Datos del Solicitante
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <ValidatedSelect
                      label="Tipo de Documento"
                      value={personalData.tipoDocumento}
                      onChange={(value) => setPersonalData({...personalData, tipoDocumento: value as string})}
                      options={TIPOS_DOCUMENTO.map(tipo => ({ value: tipo, label: tipo }))}
                      required={true}
                    />

                    <ValidatedInput
                      label="Número de Documento"
                      value={personalData.numeroDocumento}
                      onChange={(value) => {
                        // Solo permitir números y máximo 10 dígitos
                        if (/^\d{0,10}$/.test(value)) {
                          setPersonalData({...personalData, numeroDocumento: value});
                          if (validationErrors.numeroDocumento) {
                            setValidationErrors(prev => ({...prev, numeroDocumento: ''}));
                          }
                        }
                      }}
                      onBlur={() => {
                        if (!/^\d{10}$/.test(personalData.numeroDocumento.trim())) {
                          setValidationErrors(prev => ({
                            ...prev,
                            numeroDocumento: 'El número de cédula debe tener exactamente 10 dígitos numéricos.'
                          }));
                        } else {
                          setValidationErrors(prev => ({...prev, numeroDocumento: ''}));
                        }
                      }}
                      error={validationErrors.numeroDocumento}
                      type="text"
                      placeholder="Ej: 1075287436"
                      required={true}
                      pattern="\d{10}"
                    />

                    <div className="md:col-span-2">
                      <ValidatedInput
                        label="Nombre Completo"
                        value={personalData.nombreCompleto}
                        onChange={(value) => {
                          // Solo permitir letras y espacios
                          if (/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]*$/.test(value)) {
                            setPersonalData({...personalData, nombreCompleto: value});
                            if (validationErrors.nombreCompleto) {
                              setValidationErrors(prev => ({...prev, nombreCompleto: ''}));
                            }
                          }
                        }}
                        onBlur={() => {
                          if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(personalData.nombreCompleto.trim())) {
                            setValidationErrors(prev => ({
                              ...prev,
                              nombreCompleto: 'El nombre solo debe contener letras y espacios.'
                            }));
                          } else {
                            setValidationErrors(prev => ({...prev, nombreCompleto: ''}));
                          }
                        }}
                        error={validationErrors.nombreCompleto}
                        type="text"
                        placeholder="Nombres y apellidos completos"
                        required={true}
                        pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ ]+"
                      />
                    </div>

                    <ValidatedInput
                      label="Teléfono Fijo"
                      value={personalData.telefono}
                      onChange={(value) => {
                        setPersonalData({...personalData, telefono: value});
                        if (validationErrors.telefono) {
                          setValidationErrors(prev => ({...prev, telefono: ''}));
                        }
                      }}
                      onBlur={() => {
                        if (personalData.telefono) {
                          const validation = ValidationUtils.validatePhone(personalData.telefono, false);
                          setValidationErrors(prev => ({
                            ...prev,
                            telefono: validation.isValid ? '' : validation.message
                          }));
                        }
                      }}
                      error={validationErrors.telefono}
                      type="tel"
                      placeholder="Ej: 6088664600"
                      required={false}
                    />

                    <ValidatedInput
                      label="Celular"
                      value={personalData.celular}
                      onChange={(value) => {
                        // Solo permitir números y máximo 10 dígitos
                        if (/^\d{0,10}$/.test(value)) {
                          setPersonalData({...personalData, celular: value});
                          if (validationErrors.celular) {
                            setValidationErrors(prev => ({...prev, celular: ''}));
                          }
                        }
                      }}
                      onBlur={() => {
                        if (!/^\d{10}$/.test(personalData.celular.trim())) {
                          setValidationErrors(prev => ({
                            ...prev,
                            celular: 'El número de celular debe tener exactamente 10 dígitos numéricos.'
                          }));
                        } else {
                          setValidationErrors(prev => ({...prev, celular: ''}));
                        }
                      }}
                      error={validationErrors.celular}
                      type="tel"
                      placeholder="Ej: 3154987623"
                      required={true}
                      pattern="\d{10}"
                    />

                    <div className="md:col-span-2">
                      <ValidatedInput
                        label="Correo Electrónico"
                        value={personalData.email}
                        onChange={(value) => {
                          setPersonalData({...personalData, email: value});
                          if (validationErrors.email) {
                            setValidationErrors(prev => ({...prev, email: ''}));
                          }
                        }}
                        onBlur={() => {
                          if (!/^.+@.+\..+$/.test(personalData.email.trim())) {
                            setValidationErrors(prev => ({
                              ...prev,
                              email: 'El correo debe ser una dirección válida.'
                            }));
                          } else {
                            setValidationErrors(prev => ({...prev, email: ''}));
                          }
                        }}
                        error={validationErrors.email}
                        type="email"
                        placeholder="ejemplo@correo.com"
                        required={true}
                        pattern=".+@.+\..+"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <ValidatedInput
                        label="Dirección donde requiere el servicio"
                        value={propertyData.direccion}
                        onChange={(value) => {
                          setPropertyData({...propertyData, direccion: value});
                          if (validationErrors.direccion) {
                            setValidationErrors(prev => ({...prev, direccion: ''}));
                          }
                        }}
                        onBlur={() => {
                          const validation = ValidationUtils.validateAddress(propertyData.direccion);
                          setValidationErrors(prev => ({
                            ...prev,
                            direccion: validation.isValid ? '' : validation.message
                          }));
                        }}
                        error={validationErrors.direccion}
                        type="text"
                        placeholder="Dirección completa donde se requiere la conexión eléctrica"
                        required={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Agendamiento de Cita */}
                <div className="bg-gradient-to-r from-[#97D4E3]/5 to-[#56C2E1]/5 rounded-2xl p-6 border border-[#56C2E1]/10">
                  <h4 className="text-xl font-semibold text-[#203461] mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Datos de la Cita
                  </h4>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Sede *
                      </label>
                      <select
                        value={appointmentData.sede}
                        onChange={(e) => handleSedeChange(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#56C2E1] transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                      >
                        {sedes.map((sede) => (
                          <option key={sede.id} value={sede.nombre}>
                            {sede.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Fecha de Cita *
                      </label>
                      <input
                        type="date"
                        value={appointmentData.appointmentDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#56C2E1] transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  {/* Selección de Hora */}
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#203461] mb-4">
                      Hora de Cita *
                    </label>
                    
                    {loadingHours ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-[#56C2E1] border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando horarios disponibles...</p>
                      </div>
                    ) : horasDisponibles.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium">No hay horarios disponibles</p>
                        <p className="text-gray-500 text-sm mt-2">
                          {appointmentData.appointmentDate && appointmentData.sedeId 
                            ? 'Para la fecha y sede seleccionadas'
                            : 'Seleccione una fecha y sede primero'
                          }
                        </p>
                        {appointmentData.appointmentDate && appointmentData.sedeId && (
                          <button
                            type="button"
                            onClick={loadHorasDisponibles}
                            className="mt-4 text-[#1797D5] hover:text-[#56C2E1] font-medium text-sm"
                          >
                            🔄 Recargar horarios
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {horasDisponibles.map((hora, index) => (
                            <button
                              key={`hora-${index}-${hora}`}
                              type="button"
                              onClick={() => setAppointmentData({...appointmentData, appointmentTime: hora})}
                              className={`px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all duration-300 ${
                                appointmentData.appointmentTime === hora
                                  ? 'bg-gradient-to-r from-[#56C2E1] to-[#1797D5] text-white border-[#56C2E1] shadow-lg transform scale-105'
                                  : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 hover:from-green-100 hover:to-green-200 hover:shadow-md'
                              }`}
                            >
                              {formatTimeForDisplay(hora)}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-gradient-to-r from-green-100 to-green-200 border border-green-300 rounded"></div>
                              <span className="text-gray-600">Disponible</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 rounded"></div>
                              <span className="text-gray-600">Seleccionado</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={loadHorasDisponibles}
                            className="text-[#1797D5] hover:text-[#56C2E1] font-medium text-sm"
                          >
                            🔄 Actualizar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-semibold text-[#203461] mb-2">
                    Observaciones Adicionales
                  </label>
                  <textarea
                    rows={4}
                    value={observations}
                    onChange={(e) => {
                      if (e.target.value.length <= 300) {
                        setObservations(e.target.value);
                      }
                    }}
                    maxLength={300}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#56C2E1] transition-colors duration-300 bg-white/70 backdrop-blur-sm resize-none"
                    placeholder="Escriba aquí cualquier información adicional sobre su solicitud de instalación... (máx. 300 caracteres)"
                  />
                </div>

                <div className="text-center pt-4">
                  <button
                    type="submit"
                    disabled={loading || !appointmentData.appointmentTime}
                    className="w-full md:w-auto bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando Solicitud...
                      </div>
                    ) : (
                      <>
                        📄 Solicitar Cuenta Nueva
                        <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRMATION STEP */}
        {step === 'confirmation' && solicitudData && (
          <div className="max-w-2xl mx-auto">
            <div className="print:hidden">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-green-600 mb-2">
                      ✅ ¡Solicitud Enviada Exitosamente!
                    </h3>
                    <p className="text-[#1A6192] text-lg">
                      Su solicitud de cuenta nueva ha sido registrada
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-[#97D4E3]/10 to-[#56C2E1]/10 rounded-2xl p-6 border border-[#56C2E1]/20 mb-8">
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                      <div className="text-center md:text-left">
                        <div className="text-2xl font-bold text-[#203461] mb-2">
                          Número de Solicitud
                        </div>
                        <div className="text-3xl font-bold text-[#1797D5] tracking-wider mb-4">
                          {solicitudData.numeroSolicitud}
                        </div>
                        <p className="text-sm text-gray-600">
                          Escanee el código QR para verificar su solicitud
                        </p>
                      </div>
                      
                      {/* Código QR */}
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                          {qrCodeDataURL ? (
                            <div className="text-center">
                              <img 
                                src={qrCodeDataURL} 
                                alt="Código QR de la solicitud"
                                className="mx-auto mb-2"
                                width="160"
                                height="160"
                              />
                              <p className="text-xs text-gray-500 font-medium">Código QR</p>
                            </div>
                          ) : (
                            <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h4 className="text-xl font-semibold text-[#203461] border-b border-gray-200 pb-2">
                      📋 Resumen de su Solicitud
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Nombre:</span>
                        <p className="text-[#203461] font-semibold">{solicitudData.personalData.nombreCompleto}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Documento:</span>
                        <p className="text-[#203461] font-semibold">{solicitudData.personalData.numeroDocumento}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Dirección:</span>
                        <p className="text-[#203461] font-semibold">{solicitudData.propertyData.direccion}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Municipio:</span>
                        <p className="text-[#203461] font-semibold">{solicitudData.propertyData.municipio}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Tipo de Instalación:</span>
                        <p className="text-[#203461] font-semibold">{solicitudData.technicalData.tipoInstalacion}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Uso del Servicio:</span>
                        <p className="text-[#203461] font-semibold">{solicitudData.propertyData.usoServicio}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Sede:</span>
                        <p className="text-[#203461] font-semibold">{solicitudData.appointmentData.sede}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Fecha de Cita:</span>
                        <p className="text-[#203461] font-semibold">{solicitudData.appointmentData.appointmentDate}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Hora de Cita:</span>
                        <p className="text-[#203461] font-semibold">{formatTimeForDisplay(solicitudData.appointmentData.appointmentTime)}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                      <p className="text-blue-700 text-sm font-medium flex items-center mb-2">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Información importante:
                      </p>
                      <ul className="text-blue-700 text-sm space-y-1 ml-6">
                        <li>• Preséntese 10 minutos antes de la hora agendada</li>
                        <li>• Traiga cédula de ciudadanía original</li>
                        <li>• Documentos de la propiedad</li>
                        <li>• Planos o bocetos del inmueble</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handlePrint}
                      className="flex-1 bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Imprimir Comprobante
                    </button>
                    
                    <button
                      onClick={handleNewRequest}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Nueva Solicitud
                    </button>
                  </div>

                  <div className="text-center mt-6">
                    <Link 
                      href="/servicios"
                      className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300"
                    >
                      ← Volver a servicios
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Versión para impresión */}
            <div className="hidden print:block print:text-black">
              <div className="max-w-md mx-auto bg-white p-6 text-center">
                <div className="mb-6">
                  <img 
                    src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
                    alt="ElectroHuila Logo"
                    className="h-12 w-auto mx-auto mb-4"
                  />
                  <h1 className="text-lg font-bold text-gray-800">ELECTROHUILA S.A. E.S.P.</h1>
                  <h2 className="text-base font-semibold text-gray-700">Comprobante de Solicitud - Cuenta Nueva</h2>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-b border-gray-300 py-4">
                  <div className="space-y-3 text-left text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Número de Solicitud:</span>
                      <span className="font-bold">{solicitudData.numeroSolicitud}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha de Expedición:</span>
                      <span>{solicitudData.fechaCreacion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Nombre:</span>
                      <span>{solicitudData.personalData.nombreCompleto}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Documento:</span>
                      <span>{solicitudData.personalData.numeroDocumento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Dirección:</span>
                      <span>{solicitudData.propertyData.direccion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Municipio:</span>
                      <span>{solicitudData.propertyData.municipio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Uso del Servicio:</span>
                      <span>{solicitudData.propertyData.usoServicio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tipo de Instalación:</span>
                      <span>{solicitudData.technicalData.tipoInstalacion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Sede:</span>
                      <span>{solicitudData.appointmentData.sede}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha de Cita:</span>
                      <span>{solicitudData.appointmentData.appointmentDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Hora de Cita:</span>
                      <span>{formatTimeForDisplay(solicitudData.appointmentData.appointmentTime)}</span>
                    </div>
                  </div>
                  
                  {/* Código QR para impresión */}
                  <div className="flex flex-col items-center justify-center">
                    {qrCodeDataURL && (
                      <div className="text-center">
                        <img 
                          src={qrCodeDataURL} 
                          alt="Código QR de la solicitud"
                          className="mb-2"
                          width="120"
                          height="120"
                        />
                        <p className="text-xs font-bold text-gray-700">Código QR de Verificación</p>
                        <p className="text-xs text-gray-600">Escanee para verificar</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center text-xs font-bold text-red-600 mb-4 mt-4">
                  Preséntese 10 minutos antes de la hora agendada
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p>Dirección: Carrera 1a #60-79, Neiva, Huila</p>
                  <p>Teléfono: 608 8758000</p>
                  <p>www.electrohuila.com.co</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#203461] to-[#1A6192] text-white py-12 mt-20 print:hidden">
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

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:text-black {
            color: black !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}