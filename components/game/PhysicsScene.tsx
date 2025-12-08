"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { ORB_LEVELS, GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS, GAME_OVER_TIME } from "@/lib/constants";
import { useGameStore } from "@/store/gameStore";
import { useGameAudio } from "@/hooks/useGameAudio";
import { useVFXStore } from "@/store/vfxStore";
import { PARTICLE_COLORS } from "@/lib/assets";

// Wrap in React.memo to prevent re-renders from parent state changes (like Theme)
const PhysicsScene = React.memo(() => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);

    // REMOVED useTheme hook to prevent dependency on theme context
    // const { theme } = useTheme(); 

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
        triggerShake // Get triggerShake
    } = useGameStore();

    const { playMergeSound, playDropSound } = useGameAudio();
    const { spawnEffect } = useVFXStore();

    // Refs to avoid stale closures in Matter.js events
    const actionsRef = useRef({
        playMergeSound,
        triggerShake,
        spawnEffect,
        addScore
    });

    // Update refs on render
    useEffect(() => {
        actionsRef.current = { playMergeSound, triggerShake, spawnEffect, addScore };
    }, [playMergeSound, triggerShake, spawnEffect, addScore]);

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
            console.log("Restoring session...", savedOrbs.length, "orbs");
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
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                wireframes: false,
                background: 'transparent',
                pixelRatio: 1,
            },
        });
        renderRef.current = render;

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
                        const { playMergeSound, triggerShake, spawnEffect, addScore } = actionsRef.current;

                        addScore(ORB_LEVELS[level].score);
                        playMergeSound(level);

                        // Shake: Very Light (Fixed low intensity, logic handled in hook)
                        triggerShake(1); // Intensity ignored by new hook but keeps API valid

                        // VFX: Explosion
                        spawnEffect({
                            type: 'EXPLOSION',
                            x: midX,
                            y: midY,
                            color: PARTICLE_COLORS[level] || '#fff'
                        });

                        // VFX: Score Floater
                        spawnEffect({
                            type: 'FLOATER',
                            x: midX,
                            y: midY,
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
        if (!engineRef.current) return;
        const rect = sceneRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // --- LASER MODE ---
        if (laserMode) {
            // ... existing laser logic ...
            const bodies = Matter.Composite.allBodies(engineRef.current.world);
            const clickedBodies = Matter.Query.point(bodies, { x, y });
            const target = clickedBodies.find(b => !b.isStatic && b.label !== 'sensor');

            if (target) {
                if (useStrike()) {
                    Matter.World.remove(engineRef.current.world, target);
                    toggleLaserMode();
                    // Audio for laser? Maybe drop sound for now
                    playDropSound();
                } else {
                    alert("Out of Precision Lasers!");
                    toggleLaserMode();
                }
            }
            return;
        }

        // --- NORMAL DROP MODE ---
        if (!canDrop) return;

        const clampedX = Math.max(ORB_LEVELS[nextOrbLevel].radius, Math.min(GAME_WIDTH - ORB_LEVELS[nextOrbLevel].radius, x));

        // Play Drop Sound
        playDropSound();

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

    return (
        <div
            ref={sceneRef}
            // Use CSS variables for background to ensure instant theme switching without re-render
            className={`relative overflow-hidden rounded-xl bg-background transition-colors duration-500 ${laserMode ? 'cursor-crosshair' : 'cursor-pointer'}`}
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
            onPointerDown={handlePointerDown}
        >
            {/* Danger Line Overlay */}
            {/* Positioned at Y=100 which is where the sensor is */}
            <div
                className="absolute w-full border-b-2 border-red-600 border-dashed z-50 pointer-events-none animate-pulse"
                style={{ top: '100px' }}
            >
                <div className="absolute right-0 -top-6 text-red-600 text-xs font-bold bg-black/50 px-2 py-1 rounded">DANGER</div>
            </div>
        </div>
    );
});

PhysicsScene.displayName = "PhysicsScene";

export default PhysicsScene;

