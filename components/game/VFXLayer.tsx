"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVFXStore } from '@/store/vfxStore';

const VFXLayer = () => {
    const { effects, removeEffect } = useVFXStore();

    // Cleanup old effects automatically (fail-safe)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            effects.forEach(e => {
                if (now - e.timestamp > 2000) {
                    removeEffect(e.id);
                }
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [effects, removeEffect]);

    return (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            <AnimatePresence>
                {effects.map(effect => {
                    if (effect.type === 'EXPLOSION') {
                        return (
                            <Explosion key={effect.id} effect={effect} onComplete={() => removeEffect(effect.id)} />
                        );
                    }
                    if (effect.type === 'FLOATER') {
                        return (
                            <Floater key={effect.id} effect={effect} onComplete={() => removeEffect(effect.id)} />
                        );
                    }
                    if (effect.type === 'FLASH') {
                        return (
                            <motion.div
                                key={effect.id}
                                initial={{ opacity: 0.2 }}
                                animate={{ opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.1 }}
                                className="absolute inset-0 bg-white z-50"
                                onAnimationComplete={() => removeEffect(effect.id)}
                            />
                        );
                    }
                    return null;
                })}
            </AnimatePresence>
        </div>
    );
};

// Sub-component for Explosion
const Explosion = ({ effect, onComplete }: { effect: any, onComplete: () => void }) => {
    // Generate 12 particles
    const particles = Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const velocity = Math.random() * 50 + 20; // Distance to travel
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        return { tx, ty, i };
    });

    return (
        <div className="absolute top-0 left-0" style={{ transform: `translate(${effect.x}px, ${effect.y}px)` }}>
            {particles.map((p) => (
                <motion.div
                    key={p.i}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: p.tx, y: p.ty, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute w-3 h-3 rounded-full"
                    style={{ backgroundColor: effect.color || '#fff' }}
                    onAnimationComplete={p.i === 0 ? onComplete : undefined} // Trigger complete on first particle (approx)
                />
            ))}
        </div>
    );
};

// Sub-component for Score Floater
const Floater = ({ effect, onComplete }: { effect: any, onComplete: () => void }) => {
    return (
        <motion.div
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -50, opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8 }}
            className="absolute text-2xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
            style={{
                left: effect.x,
                top: effect.y,
                transform: 'translate(-50%, -50%)', // Center it
                color: effect.color || '#fff'
            }}
            onAnimationComplete={onComplete}
        >
            {effect.text}
        </motion.div>
    );
};

export default VFXLayer;
