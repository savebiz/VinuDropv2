"use client";

import React from "react";
import { useTheme, cn } from "./ThemeProvider";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Panel({ children, className, ...props }: PanelProps) {
    const { theme } = useTheme();

    return (
        <div
            className={cn(
                "rounded-2xl p-6 transition-all duration-300",
                theme === "ceramic"
                    ? "bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl"
                    : "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
