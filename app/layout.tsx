import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google"; // Stable fonts
import { ThirdwebProvider, AutoConnect } from "thirdweb/react";
import { activeChain } from "@/lib/chain";
import { client } from "@/app/client";
import DevBanner from "@/components/ui/DevBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans", // Standard variable
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono", // Standard variable
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
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
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
