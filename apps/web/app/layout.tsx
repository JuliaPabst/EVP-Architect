import type {Metadata} from 'next';
import './fonts.scss';
import './globals.scss';
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
      <body>{children}</body>
    </html>
  );
}
