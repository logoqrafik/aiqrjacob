import './globals.css';

export const metadata = {
  title: 'Lezzet Durağı | QR Menü & Sipariş',
  description: 'Geleceğin Menüsü, Şimdi Masanızda.',
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
