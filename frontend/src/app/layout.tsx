import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "GatherFlow | Premium Event Management",
  description: "Explore, host, and manage premium developer conferences, hackathons, and local meetups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${plusJakarta.variable} ${playfair.variable} min-h-full flex flex-col bg-navy-bg text-navy-text antialiased font-sans`}>
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_center,rgba(217,93,57,0.03),transparent_70%)] pointer-events-none" />
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col pt-24">
            {children}
          </main>
          <footer className="border-t border-navy-border bg-navy-card py-6 text-center text-xs text-navy-muted">
            <div className="mx-auto max-w-7xl px-4">
              <p>&copy; {new Date().getFullYear()} GatherFlow. All rights reserved.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
