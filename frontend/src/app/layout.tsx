import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev Analytics Dashboard",
  description: "Real-time GitHub analytics dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-50 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
