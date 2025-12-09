"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { ORB_LEVELS, GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS, GAME_OVER_TIME } from "@/lib/constants";
import { useGameStore } from "@/store/gameStore";
import { useGameAudio } from "@/hooks/useGameAudio";
import { useVFXStore } from "@/store/vfxStore";
import { PARTICLE_COLORS } from "@/lib/assets";

import confetti from "canvas-confetti";
import { useHaptic } from "@/hooks/useHaptic";

// Wrap in React.memo to prevent re-renders from parent state changes (like Theme)
const PhysicsScene = React.memo(() => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);

    const {
        addScore,
        setGameOver,
        nextOrbLevel,
        setNextOrbLevel,
        reviveTrigger,
        shakeTrigger,
        laserMode,
        useStrike,
        toggleLaserMode,
        triggerShake
    } = useGameStore();

    const { playMergeSound, playDropSound, startBGM } = useGameAudio();
    const { spawnEffect } = useVFXStore();
    const { trigger: triggerHaptic } = useHaptic();

    // Refs to avoid stale closures in Matter.js events
    const actionsRef = useRef({
        playMergeSound,
        playDropSound,
        startBGM,
        triggerShake,
        spawnEffect,
        addScore,
        triggerHaptic
    });

    // Update refs on render
    useEffect(() => {
        actionsRef.current = { playMergeSound, playDropSound, startBGM, triggerShake, spawnEffect, addScore, triggerHaptic };
    }, [playMergeSound, playDropSound, startBGM, triggerShake, spawnEffect, addScore, triggerHaptic]);

    const [canDrop, setCanDrop] = useState(true);

    // Revive Logic (Halve Protocol)
    useEffect(() => {
        if (reviveTrigger === 0 || !engineRef.current) return;

        const world = engineRef.current.world;
        const bodies = Matter.Composite.allBodies(world);

        // Filter dynamic bodies (orbs) - excluding sensors and walls
        const orbs = bodies.filter(b => !b.isStatic && b.label !== 'sensor');

        if (orbs.length === 0) return;

        // Sort by Y position (ascending = top to bottom)
        // Smaller Y is higher (closer to top). 
        // We want to remove the TOP 50% (most dangerous ones).
        orbs.sort((a, b) => a.position.y - b.position.y);

        const countToRemove = Math.floor(orbs.length / 2);
        const toRemove = orbs.slice(0, countToRemove);

        // Remove them
        toRemove.forEach(body => {
            Matter.World.remove(world, body);
        });

        // Resume game if over
        setGameOver(false);

    }, [reviveTrigger, setGameOver]);

    // Shake Logic (Reactor)
    useEffect(() => {
        if (shakeTrigger === 0 || !engineRef.current) return;

        const world = engineRef.current.world;
        const bodies = Matter.Composite.allBodies(world);
        const orbs = bodies.filter(b => !b.isStatic && b.label !== 'sensor');

        orbs.forEach(body => {
            // Apply random force vector
            const forceMagnitude = 0.05 * body.mass;
            Matter.Body.applyForce(body, body.position, {
                x: (Math.random() - 0.5) * forceMagnitude,
                y: -Math.random() * forceMagnitude // Mostly upward pop
            });
        });

    }, [shakeTrigger]); // Re-run when shakeTrigger updates

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

        // --- DESERIALIZATION (Load Saved Orbs) ---
        // We access the store via the hook, but since this is inside useEffect, we need to access the LATEST state
        // or just use the values we got from props if we passed them.
        // Zustand hook values 'savedOrbs' might be stale if closure captures it? 
        // No, 'useEffect' runs once. 'useGameStore.getState()' is better for reading inside effect without dep.
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
        // -----------------------------------------

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                // Initial size (will be overridden by resize handler, but good defaults)
                width: sceneRef.current.clientWidth,
                height: sceneRef.current.clientHeight,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio || 1, // High DPI Support
            },
        });
        renderRef.current = render;

        // Fit the world initially
        Matter.Render.lookAt(render, {
            min: { x: 0, y: 0 },
            max: { x: GAME_WIDTH, y: GAME_HEIGHT }
        });

        const wallOptions = {
            isStatic: true,
            render: { fillStyle: '#64748b' }
        };

        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + WALL_THICKNESS / 2 - 10, GAME_WIDTH, WALL_THICKNESS, wallOptions);
        const leftWall = Bodies.rectangle(0 - WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, wallOptions);
        const rightWall = Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, wallOptions);

        World.add(world, [ground, leftWall, rightWall]);

        Events.on(engine, "collisionStart", (event) => {
            const pairs = event.pairs;

            pairs.forEach((pair) => {
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

                        // --- JUICE START ---
                        const { playMergeSound, triggerShake, spawnEffect, addScore, triggerHaptic } = actionsRef.current;

                        addScore(ORB_LEVELS[level].score);

                        // 1. Audio
                        playMergeSound(level);

                        // 2. Haptics (Mobile Vibe)
                        // Light vibration for small orbs, heavy for big ones
                        if (triggerHaptic) {
                            triggerHaptic(level < 4 ? 5 : level < 8 ? 10 : [10, 50, 10]);
                        }

                        // 3. Screen Shake (Visual)
                        if (level > 4) triggerShake(level * 2);

                        // 4. Particles (Canvas Confetti for "Juicy" Pop)
                        // Calculate screen coordinates for the confetti origin (0 to 1 relative to viewport)
                        if (sceneRef.current) {
                            const rect = sceneRef.current.getBoundingClientRect();
                            // Physics x/y are 0-600 / 0-800. We map them to the canvas rect.
                            // However, let's assume the render view matches the physics size 1:1 or scaled.
                            const scaleX = rect.width / GAME_WIDTH;
                            const scaleY = rect.height / GAME_HEIGHT;

                            const screenX = rect.left + (midX * scaleX);
                            const screenY = rect.top + (midY * scaleY);

                            const normalizedX = screenX / window.innerWidth;
                            const normalizedY = screenY / window.innerHeight;

                            // Dynamic particle count based on level
                            const particleCount = (level + 1) * 3;
                            const spread = 30 + (level * 5);

                            confetti({
                                particleCount: particleCount,
                                spread: spread,
                                origin: { x: normalizedX, y: normalizedY },
                                colors: [ORB_LEVELS[newLevel].color, '#ffffff', ORB_LEVELS[level].color],
                                disableForReducedMotion: true,
                                zIndex: 200, // Above UI
                                startVelocity: 15,
                                gravity: 0.8,
                                scalar: 0.8,
                                ticks: 100
                            });
                        }

                        // Legacy VFX store effect (keep for additional juice)
                        spawnEffect(midX, midY, ORB_LEVELS[level].color);

                        // -------------------
                        playMergeSound(level);

                        // Calculate Screen Coordinates for VFX
                        let screenX = midX;
                        let screenY = midY;

                        if (renderRef.current) {
                            const r = renderRef.current;
                            const b = r.bounds;
                            // Use clientWidth to get CSS pixels (ignoring internal pixelRatio scaling)
                            const w = r.canvas.clientWidth;
                            const h = r.canvas.clientHeight;

                            if (w && h) {
                                const scaleX = w / (b.max.x - b.min.x);
                                const scaleY = h / (b.max.y - b.min.y);
                                screenX = (midX - b.min.x) * scaleX;
                                screenY = (midY - b.min.y) * scaleY;
                            }
                        }

                        // VFX: Explosion
                        spawnEffect({
                            type: 'EXPLOSION',
                            x: screenX,
                            y: screenY,
                            color: PARTICLE_COLORS[level] || '#fff'
                        });

                        // VFX: Score Floater
                        spawnEffect({
                            type: 'FLOATER',
                            x: screenX,
                            y: screenY,
                            text: `+${ORB_LEVELS[level].score}`,
                            color: '#fbbf24' // Amber-400
                        });

                        // VFX: Flash for high tier (Level 8+)
                        if (newLevel >= 8) {
                            spawnEffect({ type: 'FLASH', x: 0, y: 0 });
                        }
                        // --- JUICE END ---
                    } else {
                        World.remove(world, [bodyA, bodyB]);
                        // Max level merge (rare)
                        actionsRef.current.addScore(ORB_LEVELS[level].score * 2);
                        actionsRef.current.playMergeSound(level);
                    }
                }
            });
        });

        const sensor = Bodies.rectangle(GAME_WIDTH / 2, 100, GAME_WIDTH, 10, {
            isStatic: true,
            isSensor: true,
            label: 'sensor',
            render: { visible: false }
        });
        World.add(world, sensor);

        let sensorTimer: NodeJS.Timeout | null = null;

        Events.on(engine, "collisionActive", (event) => {
            const pairs = event.pairs;
            let touchingSensor = false;

            for (const pair of pairs) {
                if (pair.bodyA === sensor || pair.bodyB === sensor) {
                    touchingSensor = true;
                    break;
                }
            }

            if (touchingSensor) {
                if (!sensorTimer) {
                    sensorTimer = setTimeout(() => {
                        setGameOver(true);
                        Runner.stop(runner);
                    }, GAME_OVER_TIME);
                }
            } else {
                if (sensorTimer) {
                    clearTimeout(sensorTimer);
                    sensorTimer = null;
                }
            }
        });

        // --- SERIALIZATION (Auto-Save) ---
        // Save state every 1 second to redundant writes (localStorage is sync)
        const saveInterval = setInterval(() => {
            if (useGameStore.getState().isGameOver) return; // Don't save if game over

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
        }, 1000);
        // ---------------------------------

        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
        Render.run(render);

        return () => {
            clearInterval(saveInterval); // Cleanup save timer
            Render.stop(render);
            Runner.stop(runner);
            if (render.canvas) {
                render.canvas.remove();
            }
            World.clear(world, false);
            Engine.clear(engine);
            if (sensorTimer) clearTimeout(sensorTimer);
        };
    }, [addScore, setGameOver]);

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
        const scaleX = (bounds.max.x - bounds.min.x) / rect.width;
        const scaleY = (bounds.max.y - bounds.min.y) / rect.height;

        const worldX = bounds.min.x + x * scaleX;
        const worldY = bounds.min.y + y * scaleY;

        // --- LASER MODE ---
        if (laserMode) {
            // ... existing laser logic ...
            const bodies = Matter.Composite.allBodies(engineRef.current.world);
            // Query using TRANSFORMED world coordinates
            const clickedBodies = Matter.Query.point(bodies, { x: worldX, y: worldY });

            // Filter targets (ignore sensors/walls)
            const target = clickedBodies.find(b => !b.isStatic && b.label !== 'sensor');

            if (target) {
                if (useStrike()) {
                    Matter.World.remove(engineRef.current.world, target);
                    toggleLaserMode();
                    // Audio for laser? Maybe drop sound for now
                    actionsRef.current.playDropSound();

                    // Spawn Explosion Effect at the target position
                    actionsRef.current.spawnEffect({
                        type: 'EXPLOSION',
                        x: target.position.x,
                        y: target.position.y,
                        color: '#ff0000' // Red explosion for laser
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

        // For dropping, we clamp the X position to the game world width, 
        // using the worldX we calculated (handling scale properly).
        const clampedX = Math.max(ORB_LEVELS[nextOrbLevel].radius, Math.min(GAME_WIDTH - ORB_LEVELS[nextOrbLevel].radius, worldX));

        // Play Drop Sound & Start BGM
        actionsRef.current.playDropSound();
        actionsRef.current.startBGM();

        const orb = Matter.Bodies.circle(clampedX, 50, ORB_LEVELS[nextOrbLevel].radius, {
            restitution: 0.3,
            render: { fillStyle: ORB_LEVELS[nextOrbLevel].color }
        });
        // @ts-ignore
        orb.level = nextOrbLevel;

        Matter.World.add(engineRef.current.world, orb);

        setCanDrop(false);

        // Prepare next orb
        const nextLevel = Math.floor(Math.random() * 5); // 0-4
        setNextOrbLevel(nextLevel);

        setTimeout(() => {
            setCanDrop(true);
        }, 500);
    };


    // Dynamic Sizing
    useEffect(() => {
        if (!sceneRef.current || !renderRef.current || !engineRef.current) return;

        const handleResize = () => {
            if (!sceneRef.current || !renderRef.current) return;

            const containerWidth = sceneRef.current.clientWidth;
            const containerHeight = sceneRef.current.clientHeight;

            if (!containerWidth || !containerHeight) return;

            const render = renderRef.current;
            const pixelRatio = window.devicePixelRatio || 1;

            // Set canvas resolution (High DPI)
            render.canvas.width = containerWidth * pixelRatio;
            render.canvas.height = containerHeight * pixelRatio;

            // Set styles to ensure it fills container
            render.canvas.style.width = `${containerWidth}px`;
            render.canvas.style.height = `${containerHeight}px`;

            // Center the view on the 600x800 world
            const viewAspectRatio = containerWidth / containerHeight;
            const gameAspectRatio = GAME_WIDTH / GAME_HEIGHT;

            let paddingX = 0;
            let paddingY = 0;

            if (viewAspectRatio > gameAspectRatio) {
                // View is wider than game -> add padding to X
                const visibleWidth = GAME_HEIGHT * viewAspectRatio; // based on fixed height
                paddingX = (visibleWidth - GAME_WIDTH) / 2;
            } else {
                // View is taller than game -> add padding to Y
                const visibleHeight = GAME_WIDTH / viewAspectRatio; // based on fixed width
                paddingY = (visibleHeight - GAME_HEIGHT) / 2;
            }

            Matter.Render.lookAt(render, {
                min: { x: -paddingX, y: -paddingY },
                max: { x: GAME_WIDTH + paddingX, y: GAME_HEIGHT + paddingY }
            });
        };

        const resizeObserver = new ResizeObserver(() => {
            // Use requestAnimationFrame to debounce and ensuring layout
            requestAnimationFrame(handleResize);
        });
        resizeObserver.observe(sceneRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // ... existing Matter setup ...
    // BUT we need to remove the "width: GAME_WIDTH" style from the div to let it fill parent

    return (
        <div
            ref={sceneRef}
            className={`relative w-full h-full overflow-hidden rounded-xl bg-background transition-colors duration-500`}
            style={{
                width: '100%',
                height: '100%',
                cursor: laserMode ? 'url(/cursor-target.png) 16 16, crosshair' : 'pointer'
            }}
            onPointerDown={handlePointerDown}
        >
            {/* Danger Line Overlay - Scaled? Use % or fix based on physics world projection? 
                If we use Matter.Render, CSS overlays might desync from the canvas content if scaling happens.
                For now, let's keep it simply placed. 
                Improvement: If scaling is complex, CSS overlay needs transform too. 
                But if we rely on the container aspect ratio logic in GameContainer to hold scaling, 
                then this div is effectively 1:1 with physics world conceptually, just scaled via CSS transform on the parent?
                
                Actually, GameContainer has:
                 <div className="relative w-full lg:max-w-md ... flex items-center justify-center">
                    <motion.div ... className="relative w-full h-full"> 
                        <PhysicsScene />
                    </motion.div>
                </div>
                
                If we rely on CSS scaling, we don't need Matter.Render.lookAt logic changes usually.
                But the requirement asked for "Dynamic Canvas Scaling... adjust render.bounds".
                Safest path: Let the canvas fill the container, and use lookAt to fit the world.
            */}
            <div
                className="absolute w-full border-b-2 border-red-600 border-dashed z-50 pointer-events-none animate-pulse"
                style={{ top: '12.5%' }} // 100px / 800px = 12.5% matches the Sensor Y=100
            >
                <div className="absolute right-0 -top-6 text-red-600 text-xs font-bold bg-black/50 px-2 py-1 rounded">DANGER</div>
            </div>
        </div>
    );
});

PhysicsScene.displayName = "PhysicsScene";

export default PhysicsScene;
