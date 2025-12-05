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
        reviveTrigger
    } = useGameStore();

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
        const wallOptions = {
            isStatic: true,
            render: { fillStyle: theme === 'cosmic' ? '#00FFFF' : '#94a3b8' }
        };

        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + WALL_THICKNESS / 2 - 10, GAME_WIDTH, WALL_THICKNESS, wallOptions);
        const leftWall = Bodies.rectangle(0 - WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, wallOptions);
        const rightWall = Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, wallOptions);

        World.add(world, [ground, leftWall, rightWall]);

        // Collision Event
        Events.on(engine, "collisionStart", (event) => {
            const pairs = event.pairs;

            pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check if both bodies are orbs (have a level property)
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
                        // Max level merge
                        World.remove(world, [bodyA, bodyB]);
                        addScore(ORB_LEVELS[level].score * 2);
                    }
                }
            });
        });

        // Top Sensor
        const sensor = Bodies.rectangle(GAME_WIDTH / 2, 100, GAME_WIDTH, 10, {
            isStatic: true,
            isSensor: true,
            label: 'sensor',
            render: { visible: false } // Invisible sensor, visualized by CSS overlay
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
    }, [theme, addScore, setGameOver]);


    // Handle Mouse/Touch Interaction
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!canDrop || !engineRef.current) return;

        const rect = sceneRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const clampedX = Math.max(ORB_LEVELS[nextOrbLevel].radius, Math.min(GAME_WIDTH - ORB_LEVELS[nextOrbLevel].radius, x));

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
            className="relative overflow-hidden rounded-xl cursor-pointer"
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
}
