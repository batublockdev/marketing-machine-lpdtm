import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LPDTM Marketing Machine",
  description: "Social media content management and approval platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-gray-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}