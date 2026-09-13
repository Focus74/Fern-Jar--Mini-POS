import './globals.css';

export const metadata = {
  title: 'Fern & Jar — Mini POS',
  description: 'ระบบขายหน้าร้านเทอร์ราเรียมและต้นไม้จิ๋ว',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="bg-[#f7f3ea] text-[#2b2b28] min-h-screen">
        <header className="bg-[#2f5233] text-white p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">🌿 Fern & Jar — Mini POS</h1>
            <p className="text-xs opacity-80">ระบบขายหน้าร้านเทอร์ราเรียมและต้นไม้จิ๋ว</p>
          </div>
        </header>
        <main className="max-w-5xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
