import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Mini POS',
  description: 'ระบบขายของสำหรับร้านเล็ก',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header className="header">
          <div className="nav-container">
            <h1 className="logo">Mini POS</h1>
            <nav className="nav-links">
              <Link href="/">สินค้า</Link>
              <Link href="/sell">ขายสินค้า</Link>
              <Link href="/history">ประวัติการขาย</Link>
            </nav>
          </div>
        </header>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
