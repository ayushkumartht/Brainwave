import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet-provider";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentinel AI Trader",
  description: "Autonomous decentralized trading powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <WalletProvider>
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#0a0a0a',
                color: '#ffffff',
                border: '1px solid #333333',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#000000',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#888888',
                  secondary: '#000000',
                },
              },
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
