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

    const { playMergeSound, playDropSound, startBGM } = useGameAudio();
    const { spawnEffect } = useVFXStore();

    // Refs to avoid stale closures in Matter.js events
    const actionsRef = useRef({
        playMergeSound,
        playDropSound,
        startBGM,
        triggerShake,
        spawnEffect,
        addScore
    });

    // Update refs on render
    useEffect(() => {
        actionsRef.current = { playMergeSound, playDropSound, startBGM, triggerShake, spawnEffect, addScore };
    }, [playMergeSound, playDropSound, startBGM, triggerShake, spawnEffect, addScore]);

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
                        const { playMergeSound, triggerShake, spawnEffect, addScore } = actionsRef.current;

                        addScore(ORB_LEVELS[level].score);
                        playMergeSound(level);

                        // Shake: Level 0->1 (Tiny), Level 10 (Massive)
                        // Formula: (level + 1) * 1.5
                        // const shakeIntensity = (level + 1) * 2;
                        // triggerShake(shakeIntensity); // DISABLED: User requested to disable spring motion on merge

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
                    actionsRef.current.playDropSound();
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

            // Update canvas size
            render.canvas.width = containerWidth;
            render.canvas.height = containerHeight;

            // Calculate scale to fit the physics world (GAME_WIDTH x GAME_HEIGHT) into the container
            // We want 'contain' behavior (show all physics world, may have letterboxing if aspect differs)
            // Or 'cover' behavior? Requirement: "Jar remains in the middle... max-width on desktop"
            // The container in GameContainer handles the max-width aspect ratio usually. 
            // So we usually just want to match the physics world 1:1 if possible, or scale uniformly.

            // Let's assume the container is resizing to match our desired aspect ratio roughly, 
            // but we need to map the physics coordinates (0,0 -> GAME_WIDTH, GAME_HEIGHT) 
            // to the canvas coordinates (0,0 -> containerWidth, containerHeight).

            const scaleX = containerWidth / GAME_WIDTH;
            const scaleY = containerHeight / GAME_HEIGHT;
            const scale = Math.min(scaleX, scaleY);

            // Center the view
            // render.bounds is the region of the physics world being viewed.
            // If scale is 1, bounds is 0,0 to width,height.
            // If scale is 0.5 (container is half size of physics), we effectively view a LARGER area if we don't zoom?
            // Wait, Matter.Render automatically handles simple scaling if we set pixelRatio? No.

            // Correct approach for Matter.js Responsive Scaling:
            // 1. Set render.options.width/height (logical size)
            // 2. Set canvas width/height (display size)
            // But standard Matter.Render doesn't auto-scale. We used lookAt usually.

            // SIMPLER: Use Matter.Render.lookAt to center the view on the board center.
            // Board Center: GAME_WIDTH/2, GAME_HEIGHT/2.
            // Padding: Maybe add some padding.

            Matter.Render.lookAt(render, {
                min: { x: 0, y: 0 },
                max: { x: GAME_WIDTH, y: GAME_HEIGHT }
            });

            // If we want exact pixel matching without blur, we might need to handle scaling manually context-wise, 
            // but lookAt is the robust physics-engine way.
        };

        const resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(sceneRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // ... existing Matter setup ...
    // BUT we need to remove the "width: GAME_WIDTH" style from the div to let it fill parent

    return (
        <div
            ref={sceneRef}
            className={`relative w-full h-full overflow-hidden rounded-xl bg-background transition-colors duration-500 ${laserMode ? 'cursor-crosshair' : 'cursor-pointer'}`}
            style={{ width: '100%', height: '100%' }}
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
                style={{ top: '15%' }} // Changed to % to be safer with responsiveness
            >
                <div className="absolute right-0 -top-6 text-red-600 text-xs font-bold bg-black/50 px-2 py-1 rounded">DANGER</div>
            </div>
        </div>
    );
});

PhysicsScene.displayName = "PhysicsScene";

export default PhysicsScene;
