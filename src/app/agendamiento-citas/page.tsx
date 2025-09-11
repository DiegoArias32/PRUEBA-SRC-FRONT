"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { apiService, ClienteDto, SedeDto, TipoCitaDto } from '../../services/api';
import { ValidationUtils } from '../../utils/validation';
import { ValidatedInput } from '../../components/ValidatedInput';

interface AppointmentData {
  ticketNumber: string;
  issueDateTime: string;
  clientData: ClienteDto;
  formData: {
    documentType: string;
    motivo: string;
    sede: string;
    appointmentDate: string;
    appointmentTime: string;
    observations: string;
  };
}

export default function AgendamientoCitasPage() {
  const [step, setStep] = useState<'client' | 'form' | 'confirmation'>('client');
  const [clientNumber, setClientNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [error, setError] = useState('');
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [clientData, setClientData] = useState<ClienteDto | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  
  // Data from API
  const [sedes, setSedes] = useState<SedeDto[]>([]);
  const [tiposCita, setTiposCita] = useState<TipoCitaDto[]>([]);
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    documentType: 'Cédula de Ciudadanía',
    motivo: '',
    sede: '',
    appointmentDate: '',
    appointmentTime: '',
    observations: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load available hours when date or sede changes
  useEffect(() => {
    if (formData.appointmentDate && formData.sede && step === 'form') {
      loadHorasDisponibles();
    }
  }, [formData.appointmentDate, formData.sede, step]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sedesData, tiposData] = await Promise.all([
        apiService.getSedesPublicas(),
        apiService.getTiposCitaPublicos()
      ]);
      
      setSedes(sedesData);
      setTiposCita(tiposData);

      // Set default values
      if (sedesData.length > 0) {
        const sedePrincipal = sedesData.find(s => s.esPrincipal) || sedesData[0];
        setFormData(prev => ({
          ...prev,
          sede: `${sedePrincipal.nombre}`
        }));
      }

      if (tiposData.length > 0) {
        setFormData(prev => ({
          ...prev,
          motivo: `${tiposData[0].icono} ${tiposData[0].nombre}`
        }));
      }

      // Set default date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        appointmentDate: tomorrow.toISOString().split('T')[0]
      }));

    } catch (err: unknown) {
      setError('Error al cargar los datos iniciales: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const loadHorasDisponibles = async () => {
  if (!formData.appointmentDate || !formData.sede) return;
  
  setLoadingHours(true);
  try {
    const selectedSede = sedes.find(s => s.nombre === formData.sede);
    if (!selectedSede) {
      setHorasDisponibles([]);
      return;
    }

    const horas = await apiService.getHorasDisponiblesPublicas(
      formData.appointmentDate, 
      selectedSede.id
    );
    
    setHorasDisponibles(horas || []);
    
    // Clear selected time if it's no longer available
    if (formData.appointmentTime && !horas.includes(formData.appointmentTime)) {
      setFormData(prev => ({
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
};

  const buscarCliente = async () => {
    // Validar número de cliente antes de buscar
    const validation = ValidationUtils.validateIdentificationNumber(clientNumber);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cliente = await apiService.validarClientePublico(clientNumber);
      setClientData(cliente);
      setStep('form');
    } catch {
      setError('Número de cliente no encontrado. Verifique el número e intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (citaData: { numeroCita: string }) => {
    try {
      // URL directa para verificación de la cita
      const verificacionURL = `http://164.152.30.207:5000/verificar-cita?numero=${encodeURIComponent(citaData.numeroCita)}&cliente=${encodeURIComponent(clientData?.numeroCliente || '')}`;
      
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
    
    if (!formData.appointmentTime) {
      errors.appointmentTime = 'Por favor seleccione una hora para su cita';
    }
    
    if (!formData.motivo) {
      errors.motivo = 'Por favor seleccione un motivo para su cita';
    }
    
    if (!formData.sede) {
      errors.sede = 'Por favor seleccione una sede';
    }
    
    if (!formData.appointmentDate) {
      errors.appointmentDate = 'Por favor seleccione una fecha';
    }

    if (!clientData) {
      setError('Datos del cliente no encontrados');
      return;
    }

    // Si hay errores, mostrarlos y no continuar
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    setValidationErrors({});
    setLoading(true);
    setError('');

    try {
      // Find selected sede and tipo cita
      const selectedSede = sedes.find(s => s.nombre === formData.sede);
      const selectedTipoCita = tiposCita.find(t => formData.motivo.includes(t.nombre));

      if (!selectedSede || !selectedTipoCita) {
        throw new Error('Sede o tipo de cita no encontrado');
      }

      // Create cita using public endpoint
      const citaData = {
        numeroCliente: clientData.numeroCliente,
        sedeId: selectedSede.id,
        tipoCitaId: selectedTipoCita.id,
        fechaCita: formData.appointmentDate,
        horaCita: formData.appointmentTime,
        observaciones: formData.observations
      };

      const nuevaCita = await apiService.agendarCitaPublica(citaData);

      // Generar código QR para la cita
      await generateQRCode(nuevaCita);

      const ticketData = {
        ticketNumber: nuevaCita.numeroCita,
        issueDateTime: getCurrentDateTime(),
        clientData,
        formData
      };
      
      setAppointmentData(ticketData);
      setStep('confirmation');
    } catch (err: unknown) {
      setError('Error al agendar la cita: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewRequest = () => {
    setStep('client');
    setClientNumber('');
    setError('');
    setClientData(null);
    setQrCodeDataURL(''); // Limpiar el QR
    setFormData({
      documentType: 'Cédula de Ciudadanía',
      motivo: tiposCita.length > 0 ? `${tiposCita[0].icono} ${tiposCita[0].nombre}` : '',
      sede: sedes.length > 0 ? sedes.find(s => s.esPrincipal)?.nombre || sedes[0].nombre : '',
      appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      appointmentTime: '',
      observations: ''
    });
    setAppointmentData(null);
    setHorasDisponibles([]);
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

  const handleSedeChange = (nuevaSede: string) => {
    setFormData(prev => ({
      ...prev,
      sede: nuevaSede,
      appointmentTime: '' // Clear selected time when sede changes
    }));
  };

  const handleDateChange = (nuevaFecha: string) => {
    setFormData(prev => ({
      ...prev,
      appointmentDate: nuevaFecha,
      appointmentTime: '' // Clear selected time when date changes
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
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
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Nuestra Empresa</a>
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Usuarios</a>
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Proveedores</a>
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Contáctenos</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link 
              href="/servicios"
              className="flex items-center space-x-2 text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 hover:bg-gray-50 px-3 py-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Volver a Servicios</span>
            </Link>

            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              📄 Paga tu Factura
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-white/70 rounded-full text-[#1A6192] text-sm font-medium mb-6 shadow-sm">
            <span className="w-2 h-2 bg-[#56C2E1] rounded-full mr-2 animate-pulse"></span>
            Agendamiento de Citas
          </div>
          <h1 className="text-5xl font-bold text-[#203461] mb-4">
            Agende su
            <span className="bg-gradient-to-r from-[#1797D5] to-[#56C2E1] bg-clip-text text-transparent"> Cita</span>
          </h1>
          <h2 className="text-2xl font-semibold text-[#1A6192] mb-6">ElectroHuila</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ingrese su número de cliente para verificar sus datos y agendar su cita
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

        {/* CLIENT STEP */}
        {step === 'client' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#97D4E3] to-[#56C2E1] rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <svg className="w-10 h-10 text-[#203461]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#203461] mb-2">Verificación de Cliente</h2>
                <p className="text-gray-600">Ingrese su número de cliente para continuar con el agendamiento</p>
              </div>

              <div className="space-y-6">
                <ValidatedInput
                  label="Número de Cliente"
                  value={clientNumber}
                  onChange={(value) => setClientNumber(value)}
                  onBlur={() => {
                    const validation = ValidationUtils.validateIdentificationNumber(clientNumber);
                    setValidationErrors(prev => ({
                      ...prev,
                      clientNumber: validation.isValid ? '' : validation.message
                    }));
                  }}
                  error={validationErrors.clientNumber}
                  type="text"
                  placeholder="Ej: 12345"
                  required={true}
                  pattern="[0-9]*"
                  inputClassName="px-4 py-3 rounded-xl focus:ring-[#56C2E1]"
                />

                <button
                  onClick={buscarCliente}
                  disabled={loading || !!validationErrors.clientNumber || !clientNumber.trim()}
                  className="w-full bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verificando...
                    </div>
                  ) : (
                    'Continuar'
                  )}
                </button>

              </div>
            </div>
          </div>
        )}

        {/* FORM STEP */}
        {step === 'form' && clientData && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="p-8">
              <div className="mb-8">
                <button 
                  onClick={() => setStep('client')}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-6"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver a verificación
                </button>

                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-4 mb-8">
                  <p className="text-red-700 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Debe presentarse 10 minutos antes de la hora agendada
                  </p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-8">
                {/* Datos del Cliente Verificado */}
                <div className="bg-gradient-to-r from-[#97D4E3]/5 to-[#56C2E1]/5 rounded-2xl p-6 border border-[#56C2E1]/10">
                  <h4 className="text-xl font-semibold text-[#203461] mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cliente Verificado
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white/50 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-[#203461] mb-1">
                        Número de Cliente
                      </label>
                      <p className="text-lg font-bold text-[#1797D5]">{clientData.numeroCliente}</p>
                    </div>

                    <div className="bg-white/50 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-[#203461] mb-1">
                        Nombre Completo
                      </label>
                      <p className="text-lg font-bold text-[#203461]">{clientData.nombreCompleto}</p>
                    </div>

                    <div className="bg-white/50 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-[#203461] mb-1">
                        Documento
                      </label>
                      <p className="text-gray-700">{clientData.numeroDocumento}</p>
                    </div>

                    <div className="bg-white/50 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-[#203461] mb-1">
                        Teléfono
                      </label>
                      <p className="text-gray-700">{clientData.celular || clientData.telefono}</p>
                    </div>

                    <div className="bg-white/50 rounded-xl p-4 md:col-span-2">
                      <label className="block text-sm font-semibold text-[#203461] mb-1">
                        Correo Electrónico
                      </label>
                      <p className="text-gray-700">{clientData.email}</p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-700 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cliente verificado exitosamente. Si algún dato no es correcto, contacte al 608 8664600.
                    </p>
                  </div>
                </div>

                {/* Detalles de la Cita */}
                <div className="bg-gradient-to-r from-[#97D4E3]/5 to-[#56C2E1]/5 rounded-2xl p-6 border border-[#56C2E1]/10">
                  <h4 className="text-xl font-semibold text-[#203461] mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Detalles de la Cita
                  </h4>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Motivo de la Cita *
                      </label>
                      <select
                        value={formData.motivo}
                        onChange={(e) => {
                          setFormData({...formData, motivo: e.target.value});
                          setValidationErrors(prev => ({...prev, motivo: ''}));
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors duration-300 bg-white/70 backdrop-blur-sm ${
                          validationErrors.motivo 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-200 focus:border-[#56C2E1]'
                        }`}
                        required
                      >
                        <option value="">Seleccione un motivo</option>
                        {tiposCita.map((tipo) => (
                          <option key={tipo.id} value={`${tipo.icono} ${tipo.nombre}`}>
                            {tipo.icono} {tipo.nombre}
                          </option>
                        ))}
                      </select>
                      {validationErrors.motivo && (
                        <div className="text-red-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {validationErrors.motivo}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Sede *
                      </label>
                      <select
                        value={formData.sede}
                        onChange={(e) => {
                          handleSedeChange(e.target.value);
                          setValidationErrors(prev => ({...prev, sede: ''}));
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors duration-300 bg-white/70 backdrop-blur-sm ${
                          validationErrors.sede 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-200 focus:border-[#56C2E1]'
                        }`}
                      >
                        <option value="">Seleccione una sede</option>
                        {sedes.map((sede) => (
                          <option key={sede.id} value={sede.nombre}>
                            {sede.nombre}
                          </option>
                        ))}
                      </select>
                      {validationErrors.sede && (
                        <div className="text-red-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {validationErrors.sede}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Fecha de Cita *
                      </label>
                      <input
                        type="date"
                        value={formData.appointmentDate}
                        onChange={(e) => {
                          handleDateChange(e.target.value);
                          setValidationErrors(prev => ({...prev, appointmentDate: ''}));
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors duration-300 bg-white/70 backdrop-blur-sm ${
                          validationErrors.appointmentDate 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-200 focus:border-[#56C2E1]'
                        }`}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                      {validationErrors.appointmentDate && (
                        <div className="text-red-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {validationErrors.appointmentDate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selección de Hora */}
                <div className="bg-gradient-to-r from-[#97D4E3]/5 to-[#56C2E1]/5 rounded-2xl p-6 border border-[#56C2E1]/10">
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
                        {formData.appointmentDate && formData.sede 
                          ? 'Para la fecha y sede seleccionadas'
                          : 'Seleccione una fecha y sede primero'
                        }
                      </p>
                      {formData.appointmentDate && formData.sede && (
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
                            onClick={() => {
                              setFormData({...formData, appointmentTime: hora});
                              setValidationErrors(prev => ({...prev, appointmentTime: ''}));
                            }}
                            className={`px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all duration-300 ${
                              formData.appointmentTime === hora
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
                  
                  {validationErrors.appointmentTime && (
                    <div className="text-red-600 text-sm mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.appointmentTime}
                    </div>
                  )}
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-semibold text-[#203461] mb-2">
                    Observaciones Adicionales
                  </label>
                  <div className="relative">
                    <textarea
                      rows={4}
                      value={formData.observations}
                      maxLength={250}
                      onChange={(e) => setFormData({...formData, observations: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#56C2E1] transition-colors duration-300 bg-white/70 backdrop-blur-sm resize-none"
                      placeholder="Escriba aquí cualquier información adicional sobre su solicitud..."
                    />
                    <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                      {formData.observations.length}/250
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button
                    type="submit"
                    disabled={loading || !formData.appointmentTime}
                    className="w-full md:w-auto bg-gradient-to-r from-[#203461] to-[#1797D5] text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-[#1A6192] hover:to-[#56C2E1] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Agendando Cita...
                      </div>
                    ) : (
                      <>
                        📅 Agendar Cita
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
        {step === 'confirmation' && appointmentData && (
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
                      ¡Cita Agendada Exitosamente!
                    </h3>
                    <p className="text-[#1A6192] text-lg">
                      Su cita ha sido programada correctamente
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-[#97D4E3]/10 to-[#56C2E1]/10 rounded-2xl p-6 border border-[#56C2E1]/20 mb-8">
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                      <div className="text-center md:text-left">
                        <div className="text-2xl font-bold text-[#203461] mb-2">
                          Número de Cita
                        </div>
                        <div className="text-3xl font-bold text-[#1797D5] tracking-wider mb-4">
                          {appointmentData.ticketNumber}
                        </div>
                        <p className="text-sm text-gray-600">
                          Escanee el código QR para verificar su cita
                        </p>
                      </div>
                      
                      {/* Código QR */}
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                          {qrCodeDataURL ? (
                            <div className="text-center">
                              <img 
                                src={qrCodeDataURL} 
                                alt="Código QR de la cita"
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
                      📋 Resumen de su Cita
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Nombre:</span>
                        <p className="text-[#203461] font-semibold">{appointmentData.clientData.nombreCompleto}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Documento:</span>
                        <p className="text-[#203461] font-semibold">{appointmentData.clientData.numeroDocumento}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Motivo:</span>
                        <p className="text-[#203461] font-semibold">{appointmentData.formData.motivo}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Sede:</span>
                        <p className="text-[#203461] font-semibold">{appointmentData.formData.sede}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Fecha de Cita:</span>
                        <p className="text-[#203461] font-semibold">{appointmentData.formData.appointmentDate}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Hora de Cita:</span>
                        <p className="text-[#203461] font-semibold">{formatTimeForDisplay(appointmentData.formData.appointmentTime)}</p>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
                      <p className="text-red-700 text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Recuerde presentarse 10 minutos antes de la hora programada
                      </p>
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
                      Nueva Cita
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
                  <h2 className="text-base font-semibold text-gray-700">Comprobante de Cita</h2>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-b border-gray-300 py-4">
                  <div className="space-y-3 text-left text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Número de Cita:</span>
                      <span className="font-bold">{appointmentData.ticketNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha de Expedición:</span>
                      <span>{appointmentData.issueDateTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Nombre:</span>
                      <span>{appointmentData.clientData.nombreCompleto}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Documento:</span>
                      <span>{appointmentData.clientData.numeroDocumento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Motivo:</span>
                      <span>{appointmentData.formData.motivo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Sede:</span>
                      <span>{appointmentData.formData.sede}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha de Cita:</span>
                      <span>{appointmentData.formData.appointmentDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Hora de Cita:</span>
                      <span>{formatTimeForDisplay(appointmentData.formData.appointmentTime)}</span>
                    </div>
                  </div>
                  
                  {/* Código QR para impresión */}
                  <div className="flex flex-col items-center justify-center">
                    {qrCodeDataURL && (
                      <div className="text-center">
                        <img 
                          src={qrCodeDataURL} 
                          alt="Código QR de la cita"
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
                  Por favor preséntese 10 minutos antes de la hora programada
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