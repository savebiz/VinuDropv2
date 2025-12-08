**Copy and Paste the following into Cursor Composer:**

# **Role: Senior UX/UI Engineer & WebGL Physics Specialist**

# **Objective**

Refactor the existing GameContainer and layout architecture to resolve critical responsive design failures on both mobile and desktop. The current implementation relies on a fragile stacked layout that breaks below the fold on mobile and detaches on desktop.

# **Core Requirements**

## **1\. Viewport Locking & Containerization (The "App-Like" Feel)**

* **Constraint:** The root container MUST use h-\[100dvh\] (Dynamic Viewport Height) and w-full to completely fill the screen on mobile browsers, accounting for dynamic address bars (Safari/Chrome).  
* **Overflow:** Enforce overflow-hidden globally on the game view. There should be ZERO scrolling. The game must fit entirely on one screen.  
* **Gestures:** Apply touch-action: none to the canvas container to prevent browser zooming, panning, or pull-to-refresh gestures. This is critical for preventing accidental reloads during gameplay.

## **2\. Layout Architecture Pivot**

* **Mobile (\< 768px):** Implement a **"Heads-Up Display" (HUD)** pattern.  
  * **Inversion:** Do NOT stack the Score/Next Orb panels above/below the canvas. This pushes content below the fold.  
  * **Overlay:** Overlay these elements *on top* of the canvas using absolute positioning (absolute inset-0) and Z-indexing (z-50).  
  * **Hit Testing:** Apply pointer-events-none to the HUD container so touches pass through to the game canvas. Apply pointer-events-auto strictly to the interactive buttons (Settings, Shop) to make them clickable.  
  * **Placement Strategy:**  
    * Top-Left: Score / High Score.  
    * Top-Right: Settings / Leaderboard.  
    * Bottom-Center: "Next Orb" Indicator (Crucial: Must be visible without scrolling).  
    * Bottom-Right: Shop / Power-ups.  
* **Desktop (\>= 768px):**  
  * Maintain a centralized "Game Jar" with a fixed aspect ratio (approx 9:16 or similar vertical slice).  
  * The side panels (Leaderboard/Shop) must align strictly with the height of the game canvas, using a flex-row layout that centers the canvas and flanks it with UI panels.  
  * Use a "Bento Grid" or "Holy Grail" layout where the central canvas dictates the height, and side panels expand/contract to match.

## **3\. Dynamic Canvas Scaling (The Physics-Visual Sync)**

* **Hook Implementation:** Create/Use a custom useGameDimensions hook utilizing a ResizeObserver on the parent container.  
* **Scaling Logic:**  
  * Do NOT resize the internal physics world coordinates (keeps physics deterministic).  
  * Instead, dynamically adjust the render.bounds and render.canvas.width/height to fit the available DOM space.  
  * Enforce a **max-width** on the canvas for desktop (e.g., don't let the jar get 2000px wide on an ultrawide monitor).  
  * **High-DPI Support:** Ensure window.devicePixelRatio is respected (cap at 2x for performance) to fix blurriness on Retina screens. The canvas width attribute should be clientWidth \* dpr, while the style.width remains clientWidth.

## **4\. Implementation Steps (Code Request)**

### **Step A: The MobileHUD Component**

Generate a React component MobileHUD using Tailwind CSS.

* Use flex justify-between for top and bottom rows.  
* Ensure high contrast text (white with black outline/shadow) for visibility against game fruits.  
* Integrate the "Next Orb" preview directly into the bottom navigation bar.

### **Step B: The GameLayout Wrapper**

Refactor the main page to:

JavaScript

\<div className="relative w-full h-\[100dvh\] overflow-hidden bg-slate-900 touch-none select-none"\>  
  {/\* Canvas Layer \- Centered \*/}  
  \<div className="absolute inset-0 flex items-center justify-center"\>  
      \<canvas ref\={canvasRef} className\="max-w-md shadow-2xl" /\>  
  \</div\>  
    
  {/\* UI Layer \- Overlaid \*/}  
  \<div className="absolute inset-0 pointer-events-none z-10"\>  
      \<MobileHUD score\={score} nextOrb\={nextOrb} /\>  
  \</div\>  
\</div\>

### **Step C: Matter.js Resize Handler**

Write a helper function resizeEngine(render, width, height) that:

1. Updates render.canvas.width and height.  
2. Updates render.options.width and height.  
3. Calculates the correct scale factor based on the aspect ratio of the container vs. the physics world.  
4. Applies Matter.Render.lookAt or updates render.bounds to center the physics world view so the "Jar" remains in the middle of the screen regardless of aspect ratio changes.

# **deliverable**

Produce the complete, refactored React code for Game.js (or relevant container), the MobileHUD component, and the CSS/Tailwind classes required to achieve this responsive, scroll-free experience. Ensure the solution specifically addresses the "Next Orb" visibility issue on mobile.