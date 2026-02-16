import type {Metadata} from 'next';
import './globals.css';
import './kununu-styles.scss';

export const metadata: Metadata = {
  description: 'Employee Value Proposition Architect',
  title: 'EVP Architect',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com"
          rel="preconnect"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
