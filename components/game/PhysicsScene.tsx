"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { ORB_LEVELS, GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS, GAME_OVER_TIME } from "@/lib/constants";
import { useGameStore } from "@/store/gameStore";
import { useGameAudio } from "@/hooks/useGameAudio";
import { useVFXStore } from "@/store/vfxStore";
import { PARTICLE_COLORS } from "@/lib/assets";

import confetti from "canvas-confetti";
import { useActiveAccount } from "thirdweb/react";
import { useHaptic } from "@/hooks/useHaptic";

// Wrap in React.memo to prevent re-renders from parent state changes (like Theme)
const PhysicsScene = React.memo(() => {
    const account = useActiveAccount();
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const dangerLineRef = useRef<HTMLDivElement>(null);

    // --- PERFORMANCE OPTIMIZATION ---
    // Only subscribe to state that MUST trigger a React re-render of this component.
    const laserMode = useGameStore(state => state.laserMode);
    const reviveTrigger = useGameStore(state => state.reviveTrigger);
    const shakeTrigger = useGameStore(state => state.shakeTrigger);

    // Actions are stable, but we can just grab them once or use getState() to be safe.
    const {
        addScore,
        setGameOver,
        setNextOrbLevel,
        useStrike,
        toggleLaserMode,
        triggerShake
    } = useGameStore.getState();

    const { playMergeSound, playDropSound, startBGM } = useGameAudio();
    const { spawnEffect } = useVFXStore();
    const { trigger: triggerHaptic } = useHaptic();

    // Refs for stable access in event loops
    const actionsRef = useRef({
        playMergeSound,
        playDropSound,
        startBGM,
        triggerShake,
        spawnEffect,
        addScore,
        triggerHaptic
    });

    // Update refs on render (when audio/vfx hooks change)
    useEffect(() => {
        actionsRef.current = { playMergeSound, playDropSound, startBGM, triggerShake, spawnEffect, addScore, triggerHaptic };
    }, [playMergeSound, playDropSound, startBGM, triggerShake, spawnEffect, addScore, triggerHaptic]);

    const [canDrop, setCanDrop] = useState(true);

    // Revive Logic (Halve Protocol)
    useEffect(() => {
        if (reviveTrigger === 0 || !engineRef.current) return;

        const world = engineRef.current.world;
        const bodies = Matter.Composite.allBodies(world);
        const orbs = bodies.filter(b => !b.isStatic && b.label !== 'sensor');

        if (orbs.length === 0) return;

        orbs.sort((a, b) => a.position.y - b.position.y);

        const countToRemove = Math.floor(orbs.length / 2);
        const toRemove = orbs.slice(0, countToRemove);

        toRemove.forEach(body => {
            Matter.World.remove(world, body);
        });

        setGameOver(false);

    }, [reviveTrigger, setGameOver]);

    // Shake Logic (Reactor)
    useEffect(() => {
        if (shakeTrigger === 0 || !engineRef.current) return;

        const world = engineRef.current.world;
        const bodies = Matter.Composite.allBodies(world);
        const orbs = bodies.filter(b => !b.isStatic && b.label !== 'sensor');

        orbs.forEach(body => {
            const forceMagnitude = 0.05 * body.mass;
            Matter.Body.applyForce(body, body.position, {
                x: (Math.random() - 0.5) * forceMagnitude,
                y: -Math.random() * forceMagnitude
            });
        });

    }, [shakeTrigger]);

    // Handle Mouse/Touch Interaction
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!engineRef.current || !renderRef.current) return;
        const rect = sceneRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Get relative mouse position on canvas element
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Transform to World Coordinates (Account for scaling/padding)
        const render = renderRef.current;
        const bounds = render.bounds;

        // Safety check to prevent Infinity/NaN if rect size is 0
        if (rect.width === 0 || rect.height === 0) return;

        const scaleX = (bounds.max.x - bounds.min.x) / rect.width;
        const scaleY = (bounds.max.y - bounds.min.y) / rect.height;

        const worldX = bounds.min.x + x * scaleX;
        const worldY = bounds.min.y + y * scaleY;

        // --- LASER MODE ---
        if (laserMode) {
            const bodies = Matter.Composite.allBodies(engineRef.current.world);
            const clickedBodies = Matter.Query.point(bodies, { x: worldX, y: worldY });
            const target = clickedBodies.find(b => !b.isStatic && b.label !== 'sensor');

            if (target) {
                if (useStrike(account?.address)) {
                    Matter.World.remove(engineRef.current.world, target);
                    toggleLaserMode();
                    actionsRef.current.playDropSound();
                    actionsRef.current.spawnEffect({
                        type: 'EXPLOSION',
                        x: target.position.x,
                        y: target.position.y,
                        color: '#ff0000'
                    });
                } else {
                    alert("Out of Precision Lasers!");
                    toggleLaserMode();
                }
            }
            return;
        }

        // --- NORMAL DROP MODE ---
        if (!canDrop) return;

        const currentNextOrbLevel = useGameStore.getState().nextOrbLevel;
        // Clamp spawn position to valid game width
        const clampedX = Math.max(ORB_LEVELS[currentNextOrbLevel].radius, Math.min(GAME_WIDTH - ORB_LEVELS[currentNextOrbLevel].radius, worldX));

        actionsRef.current.playDropSound();
        actionsRef.current.startBGM();

        const orb = Matter.Bodies.circle(clampedX, 50, ORB_LEVELS[currentNextOrbLevel].radius, {
            restitution: 0.3,
            render: { fillStyle: ORB_LEVELS[currentNextOrbLevel].color }
        });
        // @ts-ignore
        orb.level = currentNextOrbLevel;

        Matter.World.add(engineRef.current.world, orb);

        setCanDrop(false);

        // Prepare next orb
        const nextLevel = Math.floor(Math.random() * 5); // 0-4
        setNextOrbLevel(nextLevel);

        setTimeout(() => {
            setCanDrop(true);
        }, 500);
    };

    // Main Game Loop & Init
    useEffect(() => {
        if (!sceneRef.current) return;

        // Setup Matter JS
        const Engine = Matter.Engine;
        const Render = Matter.Render;
        const World = Matter.World;
        const Bodies = Matter.Bodies;
        const Runner = Matter.Runner;
        const Events = Matter.Events;

        const engine = Engine.create();
        const world = engine.world;
        engineRef.current = engine;

        // --- DESERIALIZATION ---
        const state = useGameStore.getState();
        const savedOrbs = state.savedOrbs;
        const isGameAlreadyOver = state.isGameOver;

        if (savedOrbs && savedOrbs.length > 0 && !isGameAlreadyOver) {
            savedOrbs.forEach(orbData => {
                const orb = Bodies.circle(orbData.x, orbData.y, orbData.radius, {
                    restitution: 0.3,
                    render: { fillStyle: ORB_LEVELS[orbData.level].color }
                });
                // @ts-ignore
                orb.level = orbData.level;
                World.add(world, orb);
            });
        }

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: sceneRef.current.clientWidth,
                height: sceneRef.current.clientHeight,
                wireframes: false,
                background: 'transparent',
                pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
            },
        });
        renderRef.current = render;

        // Initial LookAt (Safe Default)
        Matter.Render.lookAt(render, {
            min: { x: 0, y: 0 },
            max: { x: GAME_WIDTH, y: GAME_HEIGHT }
        });

        // Walls & Ground
        const wallOptions = { isStatic: true, render: { fillStyle: 'transparent' } };
        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + WALL_THICKNESS / 2 - 10, GAME_WIDTH, WALL_THICKNESS, wallOptions);
        const leftWall = Bodies.rectangle(0 - WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, wallOptions);
        const rightWall = Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, wallOptions);
        World.add(world, [ground, leftWall, rightWall]);

        // Collision Handlers
        const onCollisionStart = (event: any) => {
            const pairs = event.pairs;
            pairs.forEach((pair: any) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // @ts-ignore
                if (bodyA.level !== undefined && bodyB.level !== undefined && bodyA.level === bodyB.level) {
                    // @ts-ignore
                    const level = bodyA.level;
                    if (level < ORB_LEVELS.length - 1) {
                        const newLevel = level + 1;
                        const midX = (bodyA.position.x + bodyB.position.x) / 2;
                        const midY = (bodyA.position.y + bodyB.position.y) / 2;

                        World.remove(world, [bodyA, bodyB]);

                        const newOrb = Bodies.circle(midX, midY, ORB_LEVELS[newLevel].radius, {
                            restitution: 0.3,
                            render: { fillStyle: ORB_LEVELS[newLevel].color },
                        });
                        // @ts-ignore
                        newOrb.level = newLevel;
                        World.add(world, newOrb);

                        // --- JUICE ---
                        const { playMergeSound, triggerShake, spawnEffect, addScore, triggerHaptic } = actionsRef.current;
                        addScore(ORB_LEVELS[level].score);
                        playMergeSound(level);
                        if (triggerHaptic) triggerHaptic(level < 4 ? 5 : level < 8 ? 10 : [10, 50, 10]);
                        if (level > 4) triggerShake(level * 2);

                        // Visual Effects
                        if (renderRef.current) {
                            // Calculate screen coords using render bounds mapping
                            // This ensures VFX spawn at correct visual location even if zoomed/panned
                            const r = renderRef.current;
                            const b = r.bounds;
                            const w = r.canvas.clientWidth;
                            const h = r.canvas.clientHeight;
                            if (w && h) {
                                const scaleX = w / (b.max.x - b.min.x);
                                const scaleY = h / (b.max.y - b.min.y);
                                const screenX = (midX - b.min.x) * scaleX;
                                const screenY = (midY - b.min.y) * scaleY;

                                spawnEffect({ type: 'EXPLOSION', x: screenX, y: screenY, color: PARTICLE_COLORS[level] || '#fff' });
                                spawnEffect({ type: 'FLOATER', x: screenX, y: screenY, text: `+${ORB_LEVELS[level].score}`, color: '#fbbf24' });
                            }
                        }
                        if (newLevel >= 8) spawnEffect({ type: 'FLASH', x: 0, y: 0 });

                        // Confetti
                        if (sceneRef.current) {
                            const rect = sceneRef.current.getBoundingClientRect();
                            const scaleX = rect.width / GAME_WIDTH;
                            const scaleY = rect.height / GAME_HEIGHT;
                            // Approximate confetti origin (simplified)
                            const screenX = rect.left + (midX * scaleX);
                            const screenY = rect.top + (midY * scaleY);
                            confetti({
                                particleCount: (level + 1) * 3,
                                spread: 30 + (level * 5),
                                origin: { x: screenX / window.innerWidth, y: screenY / window.innerHeight },
                                colors: [ORB_LEVELS[newLevel].color, '#ffffff', ORB_LEVELS[level].color],
                                disableForReducedMotion: true,
                                zIndex: 200,
                                startVelocity: 15,
                                gravity: 0.8,
                                scalar: 0.8,
                                ticks: 100
                            });
                        }
                    } else {
                        World.remove(world, [bodyA, bodyB]);
                        actionsRef.current.addScore(ORB_LEVELS[level].score * 2);
                        actionsRef.current.playMergeSound(level);
                    }
                }
            });
        };

        const sensor = Bodies.rectangle(GAME_WIDTH / 2, 100, GAME_WIDTH, 10, {
            isStatic: true, isSensor: true, label: 'sensor', render: { visible: false }
        });
        World.add(world, sensor);

        let sensorContactStartTimes: { [key: string]: number } = {};

        const onCollisionActive = (event: any) => {
            const pairs = event.pairs;
            const now = engine.timing.timestamp;
            for (const pair of pairs) {
                if (pair.bodyA === sensor || pair.bodyB === sensor) {
                    const otherBody = pair.bodyA === sensor ? pair.bodyB : pair.bodyA;
                    if (otherBody.speed < 2.0) {
                        if (!sensorContactStartTimes[otherBody.id]) {
                            sensorContactStartTimes[otherBody.id] = now;
                        } else {
                            const elapsed = now - sensorContactStartTimes[otherBody.id];
                            if (elapsed > GAME_OVER_TIME) {
                                setGameOver(true);
                                Runner.stop(runner);
                            }
                        }
                    } else {
                        delete sensorContactStartTimes[otherBody.id];
                    }
                }
            }
        };

        const onCollisionEnd = (event: any) => {
            const pairs = event.pairs;
            for (const pair of pairs) {
                if (pair.bodyA === sensor || pair.bodyB === sensor) {
                    const otherBody = pair.bodyA === sensor ? pair.bodyB : pair.bodyA;
                    delete sensorContactStartTimes[otherBody.id];
                }
            }
        };

        Events.on(engine, "collisionStart", onCollisionStart);
        Events.on(engine, "collisionActive", onCollisionActive);
        Events.on(engine, "collisionEnd", onCollisionEnd);

        // Auto Save (Optimized: 3s interval to reduce I/O)
        const saveInterval = setInterval(() => {
            if (useGameStore.getState().isGameOver) return;
            const bodies = Matter.Composite.allBodies(world);
            const orbsToSave = bodies
                .filter(b => !b.isStatic && b.label !== 'sensor' && (b as any).level !== undefined)
                .map(b => ({
                    x: b.position.x,
                    y: b.position.y,
                    radius: (b as any).circleRadius || ORB_LEVELS[(b as any).level].radius,
                    level: (b as any).level
                }));
            useGameStore.getState().setSavedOrbs(orbsToSave);
        }, 3000);

        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
        Render.run(render);

        return () => {
            clearInterval(saveInterval);
            Events.off(engine, "collisionStart", onCollisionStart);
            Events.off(engine, "collisionActive", onCollisionActive);
            Events.off(engine, "collisionEnd", onCollisionEnd);
            Render.stop(render);
            Runner.stop(runner);
            if (render.canvas) render.canvas.remove();
            World.clear(world, false);
            Engine.clear(engine);
        };
    }, [addScore, setGameOver]);

    // Dynamic Sizing Effect - Handles Viewport Scaling & Danger Line Sync
    useEffect(() => {
        if (!sceneRef.current || !renderRef.current || !engineRef.current) return;

        const handleResize = () => {
            if (!sceneRef.current || !renderRef.current) return;

            const containerWidth = sceneRef.current.clientWidth;
            const containerHeight = sceneRef.current.clientHeight;

            if (!containerWidth || !containerHeight) return;

            const render = renderRef.current;
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

            render.canvas.width = containerWidth * pixelRatio;
            render.canvas.height = containerHeight * pixelRatio;

            // Only strictly needed if we want Matter.Render to respect these for its internal centering
            // but lookAt overrides it mostly. 
            render.options.width = containerWidth;
            render.options.height = containerHeight;

            render.canvas.style.width = `${containerWidth}px`;
            render.canvas.style.height = `${containerHeight}px`;

            const viewAspectRatio = containerWidth / containerHeight;
            const gameAspectRatio = GAME_WIDTH / GAME_HEIGHT; // 600 / 800 = 0.75

            // CONTAIN LOGIC:
            // We want to ensure the entire GAME_WIDTH x GAME_HEIGHT world is visible (0 to 800 Y is critical).
            // We do NOT want to crop the top (where spawns happen).

            if (viewAspectRatio > gameAspectRatio) {
                // View is Wider (e.g. Desktop 4:3, Landscape 16:9).
                // Fit Height (limited by height), Pillarbox X.
                // Visible Width will be > 600.
                const visibleWidth = GAME_HEIGHT * viewAspectRatio; // e.g. 800 * 1.33 = 1066
                const paddingX = (visibleWidth - GAME_WIDTH) / 2;

                // LookAt X range needs to be wider than 0-600.
                Matter.Render.lookAt(render, {
                    min: { x: -paddingX, y: 0 },
                    max: { x: GAME_WIDTH + paddingX, y: GAME_HEIGHT }
                });
            } else {
                // View is Taller (e.g. Mobile).
                // Fit Width (limited by width), Letterbox Y (Zoom out).
                // Visible Height will be > 800.
                const visibleHeight = GAME_WIDTH / viewAspectRatio;
                const paddingY = (visibleHeight - GAME_HEIGHT) / 2;

                // LookAt Y range needs to be taller than 0-800.
                Matter.Render.lookAt(render, {
                    min: { x: 0, y: -paddingY },
                    max: { x: GAME_WIDTH, y: GAME_HEIGHT + paddingY }
                });
            }

            // Sync Danger Line Overlay
            if (dangerLineRef.current) {
                const bounds = render.bounds;
                const boundsHeight = bounds.max.y - bounds.min.y;
                if (boundsHeight > 0) {
                    const scaleY = containerHeight / boundsHeight;
                    // Map Sensor Y (100) to screen coord.
                    // ScreenY = (WorldY - ViewportMinY) * ScaleY
                    const sensorScreenY = (100 - bounds.min.y) * scaleY;
                    dangerLineRef.current.style.top = `${sensorScreenY}px`;
                    dangerLineRef.current.style.display = 'block';
                }
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(handleResize);
        });
        resizeObserver.observe(sceneRef.current);
        handleResize();

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div
            ref={sceneRef}
            className={`relative w-full h-full overflow-hidden rounded-xl bg-white/60 dark:bg-slate-900/60 md:bg-background backdrop-blur-xl transition-colors duration-500`}
            style={{
                width: '100%',
                height: '100%',
                cursor: laserMode ? 'url(/cursor-target.png) 16 16, crosshair' : 'pointer'
            }}
            onPointerDown={handlePointerDown}
        >
            {/* Background Gradient - Matches MobileTopHUD */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-100/40 dark:from-cyan-900/20 via-transparent to-transparent pointer-events-none transition-colors duration-300" />

            <div
                ref={dangerLineRef}
                className="absolute w-full flex items-center z-50 pointer-events-none transition-all duration-300 transform -translate-y-1/2"
                style={{ top: '12.5%' }}
            >
                {/* Neon Laser Line */}
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />

                {/* Danger Label */}
                <div className="absolute right-2 -top-3 text-[10px] font-bold tracking-widest text-red-500 uppercase bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse">
                    Danger Zone
                </div>
            </div>
        </div>
    );
});

PhysicsScene.displayName = "PhysicsScene";

export default PhysicsScene;
