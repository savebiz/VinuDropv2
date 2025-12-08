import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThirdwebProvider, AutoConnect } from "thirdweb/react"; // Import AutoConnect
import { activeChain } from "@/lib/chain";
import { client } from "@/app/client"; // Import client
import DevBanner from "@/components/ui/DevBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VinuDrop",
  description: "The premier physics merging game on VinuChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThirdwebProvider>
          <AutoConnect client={client} />
          <DevBanner />
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
