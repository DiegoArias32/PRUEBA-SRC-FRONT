import './globals.css'; // Importa estilos globales si los tienes
import { ReactNode } from 'react';

export const metadata = {
  title: 'PQR Agendamiento de Citas',
  description: 'Aplicación para agendar citas con PQR',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}