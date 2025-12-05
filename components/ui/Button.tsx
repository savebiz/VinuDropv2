"use client";

import React from "react";
import { useTheme, cn } from "./ThemeProvider";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "danger";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", ...props }, ref) => {
        const { theme } = useTheme();

        const variants = {
            primary: theme === "cosmic"
                ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg",
            secondary: theme === "cosmic"
                ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                : "bg-slate-200 hover:bg-slate-300 text-slate-900",
            danger: "bg-red-500 hover:bg-red-400 text-white",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "px-6 py-3 rounded-xl font-bold transition-all duration-200",
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";
