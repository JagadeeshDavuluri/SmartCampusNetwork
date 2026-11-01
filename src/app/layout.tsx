import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SmoothScroll } from "@/components/SmoothScroll";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Smart Campus Access Control System",
  description: "Automated access control system with RFID and biometric authentication for campus security",
  keywords: ["Smart Campus", "Access Control", "RFID", "Biometric", "Security", "IoT"],
  authors: [{ name: "Smart Campus Team" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {/* "dark" on body keeps every dark: utility active, even in portals (dialogs, selects) */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} dark antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider>
          <SmoothScroll />
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
