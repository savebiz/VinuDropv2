"use client";

import Image from "next/image";
import React, { useState } from "react";
import { ConnectButton, darkTheme, lightTheme } from "thirdweb/react";
import { client } from "./client";
import { activeChain } from "@/lib/chain";
import { ThemeProvider, useTheme } from "@/components/ui/ThemeProvider";
import GameContainer from "@/components/game/GameContainer";
import { Button } from "@/components/ui/Button";
import NetworkBanner from "@/components/ui/NetworkBanner";
import { Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { ErrorBoundary } from '@/components/utility/ErrorBoundary';

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const setIsWalletConnecting = useGameStore((state) => state.setIsWalletConnecting);

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col transition-colors duration-500 ${theme === 'cosmic' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <NetworkBanner />
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-16 md:h-20 px-2 md:px-4 flex justify-between items-center z-50 backdrop-blur-md shadow-md transition-colors duration-500 ${theme === 'cosmic' ? 'bg-slate-900/80' : 'bg-white/80'}`}>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="relative w-8 h-8 md:w-10 md:h-10">
            <Image
              src="/vinudrop-logo.png"
              alt="VinuDrop"
              fill
              className="object-contain drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]"
            />
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tighter">VinuDrop</h1>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            onClick={useGameStore((state) => state.toggleMute)}
            variant="secondary"
            className={`p-1.5 rounded-full w-8 h-8 flex items-center justify-center group transition-colors ${theme === 'cosmic' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
          >
            {useGameStore((state) => state.isMuted) ? (
              <VolumeX size={16} className={`transition-colors ${theme === 'cosmic' ? 'text-white/70 group-hover:text-white' : 'text-black/50 group-hover:text-black'}`} />
            ) : (
              <Volume2 size={16} className="text-cyan-500" />
            )}
          </Button>

          <Button
            onClick={toggleTheme}
            variant="secondary"
            className={`p-1.5 rounded-full w-8 h-8 flex items-center justify-center transition-colors ${theme === 'cosmic' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
          >
            {theme === 'cosmic' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          <div onClickCapture={() => setIsWalletConnecting(true)}>
            <ConnectButton
              client={client}
              chain={activeChain}
              theme={theme === "cosmic" ? darkTheme({
                colors: {
                  modalBg: "#000000",
                  borderColor: "#333333",
                }
              }) : lightTheme()}
              connectButton={{
                label: "Connect",
                className: "!bg-cyan-600 !text-white !font-bold !rounded-lg !px-3 !py-1.5 !h-auto !text-xs !min-w-0"
              }}
              detailsButton={{
                className: `!backdrop-blur-md !border !h-auto !py-2 !px-3 !text-xs !max-w-[120px] md:!max-w-none !overflow-hidden !whitespace-nowrap ${theme === 'cosmic' ? '!bg-white/10 !border-white/10 !text-white' : '!bg-black/5 !border-black/10 !text-black'}`,
                displayBalanceToken: {} // Empty object to satisfy type, relying on CSS max-height/width to compact.
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative pt-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          {theme === 'cosmic' && (
            <>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px]" />
            </>
          )}
        </div>

        <ErrorBoundary>
          <GameContainer />
        </ErrorBoundary>
      </main>

      <footer className={`h-8 flex items-center justify-center text-[10px] shrink-0 z-10 font-bold transition-colors ${theme === 'cosmic' ? 'text-white/40 bg-black/20' : 'text-black/40 bg-white/20'}`}>
        Powered by VinuChain • Built with ❤️ by VinuChain Africa
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
