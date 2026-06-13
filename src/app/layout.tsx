import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "501 Hub - Login",
    template: "%s | 501 Hub",
  },
  description:
    "501 Hub is a demo session dashboard for managing match history, players, scoring, and session media.",
  applicationName: "501 Hub",
  icons: {
    icon: "/fun501Logo.png",
    apple: "/fun501Logo.png",
  },
  openGraph: {
    title: "501 Hub",
    description:
      "Demo session dashboard for match history, players, scoring, and session media.",
    images: [
      {
        url: "/fun501Logo.png",
        alt: "501 Hub logo",
      },
    ],
    siteName: "501 Hub",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "501 Hub",
    description:
      "Demo session dashboard for match history, players, scoring, and session media.",
    images: ["/fun501Logo.png"],
  },
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
