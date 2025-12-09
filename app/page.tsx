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

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-slate-900">
      <NetworkBanner />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 px-4 flex justify-between items-center z-50 bg-background/80 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            <Image
              src="/vinudrop-logo.png"
              alt="VinuDrop"
              fill
              className="object-contain drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tighter">VinuDrop</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={useGameStore((state) => state.toggleMute)}
            variant="secondary"
            className="p-2 rounded-full w-9 h-9 flex items-center justify-center group"
          >
            {useGameStore((state) => state.isMuted) ? (
              <VolumeX size={18} className="text-white/70 group-hover:text-white" />
            ) : (
              <Volume2 size={18} className="text-cyan-400 group-hover:text-cyan-300" />
            )}
          </Button>

          <Button
            onClick={toggleTheme}
            variant="secondary"
            className="p-2 rounded-full w-9 h-9 flex items-center justify-center"
          >
            {theme === 'cosmic' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

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
              className: "!bg-cyan-600 !text-white !font-bold !rounded-lg !px-3 !py-2 !h-auto !text-sm"
            }}
            detailsButton={{
              className: "!bg-black/5 dark:!bg-white/10 !backdrop-blur-md !border !border-black/10 dark:!border-white/10 !text-black dark:!text-white !h-9"
            }}
          />
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative pt-20 overflow-hidden">
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

      <footer className="h-8 flex items-center justify-center text-[10px] opacity-40 shrink-0 z-10 bg-black/20">
        Powered by VinuChain • Built with love by VinuChain Africa
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
