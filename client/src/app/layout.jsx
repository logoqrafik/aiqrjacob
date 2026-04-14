import './globals.css';

export const metadata = {
  title: 'BUTA | Modern QR Menü & Yönetim Sistemi',
  description: 'BUTA Kalitesiyle Dijitalleşen İşletmeler, Mutlu Müşteriler.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
