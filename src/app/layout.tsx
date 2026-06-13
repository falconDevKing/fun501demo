import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "501 Hub Demo - Login",
  description: "501 Hub Demo authentication demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
