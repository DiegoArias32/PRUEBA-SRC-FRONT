"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { apiService, SedeDto } from '../../services/api';
import MobileMenu from '@/components/MobileMenu';

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
  projectData: {
    nombreProyecto: string;
    tipoProyecto: string;
    direccion: string;
    barrio: string;
    municipio: string;
    numeroUnidades: string;
    cargaTotalRequerida: string;
    descripcion: string;
  };
  appointmentData: {
    sede: string;
    appointmentDate: string;
    appointmentTime: string;
  };
  observations: string;
}

// Opciones para proyectos
const TIPOS_DOCUMENTO = ['Cédula de Ciudadanía', 'Cédula de Extranjería', 'NIT', 'Pasaporte'];
const TIPOS_PROYECTO = ['Urbanización', 'Conjunto Residencial', 'Centro Comercial', 'Zona Industrial', 'Complejo Turístico', 'Otro'];
const MUNICIPIOS = ['Neiva', 'Garzón', 'La Plata', 'Pitalito', 'Gigante', 'Guadalupe', 'Campoalegre', 'Rivera'];
const CARGAS_PROYECTO = ['100 kW', '200 kW', '500 kW', '1 MW', '2 MW', '5 MW', 'Más de 5 MW'];

export default function ProyectoNuevoPage() {
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [loading, setLoading] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [error, setError] = useState('');
  const [solicitudData, setSolicitudData] = useState<SolicitudData | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  
  // Data from API
  const [sedes, setSedes] = useState<SedeDto[]>([]);
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);
  
  // Elementos del menú para el componente MobileMenu
  const menuItems = [
    { label: 'Nuestra Empresa', href: '#', icon: '🏢' },
    { label: 'Usuarios', href: '#', icon: '👥' },
    { label: 'Proveedores', href: '#', icon: '🏭' },
    { label: 'Contáctenos', href: '#', icon: '📞' }
  ];
  
  const [personalData, setPersonalData] = useState({
    tipoDocumento: 'Cédula de Ciudadanía',
    numeroDocumento: '',
    nombreCompleto: '',
    telefono: '',
    celular: '',
    email: ''
  });

  const [projectData, setProjectData] = useState({
    nombreProyecto: '',
    tipoProyecto: 'Urbanización',
    direccion: '',
    barrio: '',
    municipio: 'Neiva',
    numeroUnidades: '',
    cargaTotalRequerida: '100 kW',
    descripcion: ''
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

  // Load available hours when date or sede changes
  useEffect(() => {
    if (appointmentData.appointmentDate && appointmentData.sedeId && step === 'form') {
      loadHorasDisponibles();
    }
  }, [appointmentData.appointmentDate, appointmentData.sedeId, step]);

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

  const loadHorasDisponibles = async () => {
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
  };

  const generateQRCode = async (solicitudData: { numeroSolicitud: string }) => {
    try {
      // URL directa para verificación de la solicitud
      const verificacionURL = `http://localhost:3000/verificar-proyecto?numero=${encodeURIComponent(solicitudData.numeroSolicitud)}&documento=${encodeURIComponent(personalData.numeroDocumento)}`;
      
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
    
    // Validaciones
    if (!appointmentData.appointmentTime) {
      setError('Por favor seleccione una hora para su cita');
      return;
    }

    // Número de documento: solo números, 10 dígitos
    if (!/^\d{10}$/.test(personalData.numeroDocumento.trim())) {
      setError('El número de documento debe tener exactamente 10 dígitos numéricos.');
      return;
    }

    // Nombre: solo letras y espacios
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(personalData.nombreCompleto.trim())) {
      setError('El nombre solo debe contener letras y espacios.');
      return;
    }

    // Email: debe tener '@' y al menos un '.' después de la '@'
    if (!/^.+@.+\..+$/.test(personalData.email.trim())) {
      setError('El correo debe ser una dirección válida.');
      return;
    }

    // Celular: solo números, 10 dígitos
    if (!/^\d{10}$/.test(personalData.celular.trim())) {
      setError('El número de celular debe tener exactamente 10 dígitos numéricos.');
      return;
    }

    if (!projectData.nombreProyecto || !projectData.direccion) {
      setError('Por favor complete los datos del proyecto obligatorios');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Crear solicitud usando endpoint específico para proyectos
      const solicitudDataForAPI = {
        ...personalData,
        ...projectData,
        sedeId: appointmentData.sedeId,
        fechaCita: appointmentData.appointmentDate,
        horaCita: appointmentData.appointmentTime,
        observaciones: observations
      };

      // Simulamos la creación de solicitud (pendiente implementación en backend)
      const nuevaSolicitud = {
        numeroSolicitud: 'PROY-' + Date.now().toString().slice(-6)
      };

      // Generar código QR para la solicitud
      await generateQRCode(nuevaSolicitud);

      const solicitud = {
        numeroSolicitud: nuevaSolicitud.numeroSolicitud,
        fechaCreacion: getCurrentDateTime(),
        personalData,
        projectData,
        appointmentData,
        observations
      };
      
      setSolicitudData(solicitud);
      setStep('confirmation');
    } catch (err: unknown) {
      setError('Error al solicitar proyecto nuevo: ' + (err instanceof Error ? err.message : 'Error desconocido'));
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
    setProjectData({
      nombreProyecto: '',
      tipoProyecto: 'Urbanización',
      direccion: '',
      barrio: '',
      municipio: 'Neiva',
      numeroUnidades: '',
      cargaTotalRequerida: '100 kW',
      descripcion: ''
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200">
              <img 
                src="https://www.electrohuila.com.co/wp-content/uploads/2024/07/cropped-logo-nuevo-eh.png.webp"
                alt="ElectroHuila Logo"
                className="h-10 md:h-12 w-auto object-contain cursor-pointer"
                width="120"
                height="29"
              />
            </Link>
          </div>
          
          {/* Menú Desktop */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Nuestra Empresa</a>
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Usuarios</a>
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Proveedores</a>
            <a href="#" className="text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300">Contáctenos</a>
          </nav>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/servicios"
              className="flex items-center space-x-2 text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 hover:bg-gray-50 px-3 py-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver a Servicios</span>
            </Link>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              📄 Paga tu Factura
            </button>
          </div>
          
          {/* Contenedor para móvil */}
          <div className="flex md:hidden items-center space-x-3">
            {/* Botón Volver - Móvil */}
            <Link 
              href="/servicios"
              className="flex items-center space-x-1 text-[#1A6192] hover:text-[#203461] font-medium transition-colors duration-300 hover:bg-gray-50 px-2 py-1 rounded-lg text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Servicios</span>
            </Link>
            
            {/* Botón Paga tu Factura - Móvil */}
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md">
              📄 Factura
            </button>
            
            {/* Menú Hamburguesa */}
            <MobileMenu menuItems={menuItems} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 print:hidden">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#203461] mb-4">
            Solicite su
            <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent"> Proyecto Nuevo</span>
          </h1>
          <h2 className="text-2xl font-semibold text-[#203461] mb-6">ElectroHuila</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete el formulario para solicitar servicio eléctrico para su proyecto de construcción
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
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-4 mb-8">
                <p className="text-green-700 text-sm font-medium flex items-center">
                  <span className="text-2xl mr-2">🏗️</span>
                  Solicitud de Proyecto Nuevo - Para proyectos de construcción y desarrollos inmobiliarios
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 mb-8">
                <p className="text-blue-700 text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Debe presentarse con planos del proyecto y documentos de factibilidad técnica
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-8">
                {/* Datos Personales */}
                <div className="bg-gradient-to-r from-green-50/50 to-green-100/50 rounded-2xl p-6 border border-green-200/30">
                  <h4 className="text-xl font-semibold text-[#203461] mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Datos del Solicitante
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Tipo de Documento *
                      </label>
                      <select
                        value={personalData.tipoDocumento}
                        onChange={(e) => setPersonalData({...personalData, tipoDocumento: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                      >
                        {TIPOS_DOCUMENTO.map((tipo) => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Número de Documento *
                      </label>
                      <input
                        type="text"
                        value={personalData.numeroDocumento}
                        onChange={(e) => {
                          // Solo permitir números y máximo 10 dígitos
                          if (/^\d{0,10}$/.test(e.target.value)) {
                            setPersonalData({...personalData, numeroDocumento: e.target.value});
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        placeholder="Ej: 1075287436"
                        required
                        pattern="\d{10}"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={personalData.nombreCompleto}
                        onChange={(e) => {
                          // Solo permitir letras y espacios
                          if (/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]*$/.test(e.target.value)) {
                            setPersonalData({...personalData, nombreCompleto: e.target.value});
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        placeholder="Nombres y apellidos completos"
                        required
                        pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ ]+"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Teléfono Fijo
                      </label>
                      <input
                        type="tel"
                        value={personalData.telefono}
                        onChange={(e) => setPersonalData({...personalData, telefono: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        placeholder="Ej: 6088664600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Celular *
                      </label>
                      <input
                        type="tel"
                        value={personalData.celular}
                        onChange={(e) => {
                          // Solo permitir números y máximo 10 dígitos
                          if (/^\d{0,10}$/.test(e.target.value)) {
                            setPersonalData({...personalData, celular: e.target.value});
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        placeholder="Ej: 3154987623"
                        required
                        pattern="\d{10}"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        value={personalData.email}
                        onChange={(e) => setPersonalData({...personalData, email: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        placeholder="ejemplo@correo.com"
                        required
                        pattern=".+@.+\..+"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos del Proyecto */}
                <div className="bg-gradient-to-r from-green-50/50 to-green-100/50 rounded-2xl p-6 border border-green-200/30">
                  <h4 className="text-xl font-semibold text-[#203461] mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Datos del Proyecto
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Nombre del Proyecto *
                      </label>
                      <input
                        type="text"
                        value={projectData.nombreProyecto}
                        onChange={(e) => setProjectData({...projectData, nombreProyecto: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        placeholder="Ej: Urbanización Los Pinos"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Tipo de Proyecto *
                      </label>
                      <select
                        value={projectData.tipoProyecto}
                        onChange={(e) => setProjectData({...projectData, tipoProyecto: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                      >
                        {TIPOS_PROYECTO.map((tipo) => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Dirección del Proyecto *
                      </label>
                      <input
                        type="text"
                        value={projectData.direccion}
                        onChange={(e) => setProjectData({...projectData, direccion: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        placeholder="Dirección completa del proyecto"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Barrio/Sector
                      </label>
                      <input
                        type="text"
                        value={projectData.barrio}
                        onChange={(e) => setProjectData({...projectData, barrio: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        placeholder="Nombre del barrio o sector"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Municipio *
                      </label>
                      <select
                        value={projectData.municipio}
                        onChange={(e) => setProjectData({...projectData, municipio: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                      >
                        {MUNICIPIOS.map((municipio) => (
                          <option key={municipio} value={municipio}>{municipio}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Número de Unidades *
                      </label>
                      <input
                        type="number"
                        value={projectData.numeroUnidades}
                        onChange={(e) => setProjectData({...projectData, numeroUnidades: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                        placeholder="Cantidad de unidades/lotes"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Carga Total Requerida *
                      </label>
                      <select
                        value={projectData.cargaTotalRequerida}
                        onChange={(e) => setProjectData({...projectData, cargaTotalRequerida: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
                      >
                        {CARGAS_PROYECTO.map((carga) => (
                          <option key={carga} value={carga}>{carga}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#203461] mb-2">
                        Descripción del Proyecto
                      </label>
                      <textarea
                        rows={3}
                        value={projectData.descripcion}
                        onChange={(e) => setProjectData({...projectData, descripcion: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm resize-none"
                        placeholder="Describa brevemente las características del proyecto..."
                      />
                    </div>
                  </div>
                </div>

                {/* Agendamiento de Cita */}
                <div className="bg-gradient-to-r from-green-50/50 to-green-100/50 rounded-2xl p-6 border border-green-200/30">
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm"
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
                        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
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
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {horasDisponibles.map((hora, index) => (
                          <button
                            key={`hora-${index}-${hora}`}
                            type="button"
                            onClick={() => setAppointmentData({...appointmentData, appointmentTime: hora})}
                            className={`px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all duration-300 ${
                              appointmentData.appointmentTime === hora
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg transform scale-105'
                                : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 hover:from-green-100 hover:to-green-200 hover:shadow-md'
                            }`}
                          >
                            {formatTimeForDisplay(hora)}
                          </button>
                        ))}
                      </div>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors duration-300 bg-white/70 backdrop-blur-sm resize-none"
                    placeholder="Escriba aquí cualquier información adicional sobre su proyecto... (máx. 300 caracteres)"
                  />
                </div>  

                <div className="text-center pt-4">
                  <button
                    type="submit"
                    disabled={loading || !appointmentData.appointmentTime}
                    className="w-full md:w-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                        🏗️ Solicitar Proyecto Nuevo
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
                    Su solicitud de proyecto nuevo ha sido registrada
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50/50 to-green-100/50 rounded-2xl p-6 border border-green-200/30 mb-8">
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div className="text-center md:text-left">
                      <div className="text-2xl font-bold text-[#203461] mb-2">
                        Número de Solicitud
                      </div>
                      <div className="text-3xl font-bold text-green-600 tracking-wider mb-4">
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
                      <span className="font-medium text-gray-600">Proyecto:</span>
                      <p className="text-[#203461] font-semibold">{solicitudData.projectData.nombreProyecto}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Tipo:</span>
                      <p className="text-[#203461] font-semibold">{solicitudData.projectData.tipoProyecto}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Dirección:</span>
                      <p className="text-[#203461] font-semibold">{solicitudData.projectData.direccion}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Municipio:</span>
                      <p className="text-[#203461] font-semibold">{solicitudData.projectData.municipio}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Unidades:</span>
                      <p className="text-[#203461] font-semibold">{solicitudData.projectData.numeroUnidades}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Carga:</span>
                      <p className="text-[#203461] font-semibold">{solicitudData.projectData.cargaTotalRequerida}</p>
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
                      <li>• Preséntese con planos del proyecto</li>
                      <li>• Documentos de factibilidad técnica</li>
                      <li>• Cédula de ciudadanía original</li>
                      <li>• Escrituras de la propiedad</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handlePrint}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
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
            © <span className="note-year">{new Date().getFullYear()}</span> ElectroHuila S.A. E.S.P. - Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}