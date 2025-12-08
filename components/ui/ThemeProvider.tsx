"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

type Theme = "cosmic" | "ceramic";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("cosmic");

    useEffect(() => {
        const savedTheme = localStorage.getItem("vinu-theme") as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === "cosmic") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        } else {
            // Default to cosmic
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "cosmic" ? "ceramic" : "cosmic";
        setTheme(newTheme);
        localStorage.setItem("vinu-theme", newTheme);

        if (newTheme === "cosmic") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={clsx(
                "min-h-screen transition-colors duration-500",
                theme === "cosmic" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
            )}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
