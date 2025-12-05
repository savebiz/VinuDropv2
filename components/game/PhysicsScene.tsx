"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { ORB_LEVELS, GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS, GAME_OVER_TIME } from "@/lib/constants";
import { useGameStore } from "@/store/gameStore";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function PhysicsScene() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);

    const { theme } = useTheme();
    const {
        addScore,
        setGameOver,
        nextOrbLevel,
        setNextOrbLevel,
        setScore
    } = useGameStore();

    const [currentOrb, setCurrentOrb] = useState<Matter.Body | null>(null);
    const [canDrop, setCanDrop] = useState(true);

    useEffect(() => {
        if (!sceneRef.current) return;

        // Setup Matter JS
        const Engine = Matter.Engine;
        const Render = Matter.Render;
        const World = Matter.World;
        const Bodies = Matter.Bodies;
        const Runner = Matter.Runner;
        const Events = Matter.Events;
        const Composite = Matter.Composite;

        const engine = Engine.create();
        const world = engine.world;
        engineRef.current = engine;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio,
            },
        });
        renderRef.current = render;

        // Walls
        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + WALL_THICKNESS / 2 - 10, GAME_WIDTH, WALL_THICKNESS, {
            isStatic: true,
            render: { fillStyle: theme === 'cosmic' ? '#00FFFF' : '#94a3b8' }
        });
        const leftWall = Bodies.rectangle(0 - WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, {
            isStatic: true,
            render: { fillStyle: theme === 'cosmic' ? '#00FFFF' : '#94a3b8' }
        });
        const rightWall = Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, {
            isStatic: true,
            render: { fillStyle: theme === 'cosmic' ? '#00FFFF' : '#94a3b8' }
        });

        World.add(world, [ground, leftWall, rightWall]);

        // Collision Event
        Events.on(engine, "collisionStart", (event) => {
            const pairs = event.pairs;

            pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check if both bodies are orbs (have a level property)
                // We attach 'level' to the body object when creating it
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
                        addScore(ORB_LEVELS[level].score);
                    } else {
                        // Max level merge - just remove and give big points?
                        // Or keep them? Standard Suika removes them or keeps them as max.
                        // Let's keep them as max for now, or just remove if they merge?
                        // Usually two max orbs merging disappear.
                        World.remove(world, [bodyA, bodyB]);
                        addScore(ORB_LEVELS[level].score * 2);
                    }
                }
            });
        });

        // Game Over Check
        Events.on(engine, "afterUpdate", () => {
            const bodies = Composite.allBodies(world);
            for (const body of bodies) {
                if (!body.isStatic && body.position.y < 100 && body.velocity.y > -0.1 && body.velocity.y < 0.1) {
                    // Simple check: if a body is near the top and stable.
                    // A more robust check would involve a sensor and a timer.
                    // For this MVP, we'll use a simple height check + time.
                    // Implementing a proper sensor is better but complex for this snippet.
                    // Let's stick to the "Sensor at top" requirement.
                }
            }
        });

        // Top Sensor
        const sensor = Bodies.rectangle(GAME_WIDTH / 2, 50, GAME_WIDTH, 10, {
            isStatic: true,
            isSensor: true,
            render: { visible: false } // Invisible sensor
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


        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
        Render.run(render);

        return () => {
            Render.stop(render);
            Runner.stop(runner);
            if (render.canvas) {
                render.canvas.remove();
            }
            World.clear(world, false);
            Engine.clear(engine);
            if (sensorTimer) clearTimeout(sensorTimer);
        };
    }, [theme, addScore, setGameOver]); // Re-run if theme changes to update wall colors? 
    // Actually, updating wall colors dynamically is better than remounting.
    // But for now, let's just stick to the initial theme or force remount on theme change if needed.
    // The user asked for Key-Based Remount on Game Reset, which is handled in parent.

    // Handle Mouse/Touch Interaction
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!canDrop || !engineRef.current) return;

        const rect = sceneRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        // Clamp x
        const clampedX = Math.max(ORB_LEVELS[nextOrbLevel].radius, Math.min(GAME_WIDTH - ORB_LEVELS[nextOrbLevel].radius, x));

        // Create a preview orb or just drop it?
        // Suika usually lets you move a "cloud" or "claw" and then click to drop.
        // Here we'll implement: Click/Tap to drop at that X position.

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
        }, 500); // Delay before next drop
    };

    // Power Ups
    const shake = () => {
        if (!engineRef.current) return;
        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        bodies.forEach(body => {
            if (!body.isStatic) {
                Matter.Body.applyForce(body, body.position, {
                    x: (Math.random() - 0.5) * 0.1,
                    y: -0.05 // Upward jolt
                });
            }
        });
    };

    // Expose shake to parent via ref? Or use store?
    // Ideally, we should use a command pattern or context, but for simplicity, 
    // we can listen to a store trigger or just put buttons inside this component?
    // The design says "Power-Ups" but doesn't specify where the buttons are.
    // Assuming they are in the UI overlay.
    // Let's attach shake to the window or store for now, or better, make this component handle it via props/store.
    // But wait, the request says "PhysicsScene component MUST be rendered as <PhysicsScene key={gameId}... />".
    // So internal state is reset.

    return (
        <div
            ref={sceneRef}
            className="relative overflow-hidden rounded-xl cursor-pointer"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
            onPointerDown={handlePointerDown}
        >
            {/* Overlay UI could go here if needed, but we'll keep it clean */}
        </div>
    );
}
