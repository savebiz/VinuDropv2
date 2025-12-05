I need to fix 4 critical bugs reported by users. Please apply these fixes systematically.

**1\. Fix Theme Switch Reset (Critical)**

* **Issue:** Toggling Light/Dark mode destroys the Matter.js physics world.  
* **Fix in PhysicsScene.tsx:** Wrap the component export in React.memo. Ensure theme is NOT a dependency of the main useEffect that initializes the engine. Use CSS variables (e.g., className="bg-background") for styling so the canvas doesn't need to re-mount to change colors.

**2\. "Play Again" Safety & Auto-Save**

* **Update GameContainer.tsx:**  
  * When 'Play Again' is clicked, DO NOT reset immediately.  
  * Show a AlertDialog (from shadcn): 'Are you sure? Your current score of will be saved.'  
  * **On Confirm:**  
    1. Call submitScore(score) to save the session to Supabase.  
    2. Only *after* the save confirms (or fails), trigger the resetGame() action to generate a new gameId.

**3\. Fix Leaderboard Visibility**

* **Update LeaderboardPanel.tsx:**  
  * Ensure the Supabase query is selecting from the correct views (leaderboard\_daily, etc.).  
  * **Debug:** If data is empty, render a 'EmptyState' component (e.g., a Trophy icon with text 'No scores yet today') instead of a blank black box.  
  * **Visuals:** Force the text color to text-slate-900 dark:text-white to ensure it isn't black-on-black in Dark Mode.

**4\. Fix QR Code Scannability**

* **Update WalletGatewayModal.tsx:**  
  * In the 'Transfer' tab, wrap the QRCode component in a div with bg-white p-4 rounded-lg.  
  * **Force Colors:** Set the QR code props to fgColor="\#000000" and bgColor="\#ffffff". **Do not** allow these to change with the theme. QR codes must always be high-contrast black-on-white to work reliable."

These should be able to fix the following

**1\. Theme Switch Reset (The "Orbs Clear" Bug)**

The Cause:  
When switching themes (Light/Dark), your theme state likely lives high up in the component tree (e.g., layout.tsx). When it changes, it forces a re-render of the entire GameContainer. Because PhysicsScene is inside GameContainer, it gets unmounted and remounted, destroying the Matter.js world.  
The Fix:  
We must ensure the PhysicsScene does not depend on the theme state for its mounting.

* **Memoization:** Wrap PhysicsScene in React.memo so it only re-renders if its specific props (like gameId) change, ignoring parent re-renders caused by theme toggles.  
* **CSS Variables:** Use CSS variables for styling the canvas background (e.g., var(--bg-game)) instead of passing different props to the component. This allows the *style* to change without the *component logic* re-running.

### **2\. "Play Again" Warning & Session Saving**

**The Strategy:**

* **The UX:** Instead of an instant reset, show a "Confirm Restart?" modal warning that progress will be lost.  
* **The Logic:** Before the reset happens, we must fire the submitScore API call. We cannot rely on the user to hit "Submit". The game must auto-save the *current* score as a "Session Score" before wiping the board.

### **3\. Leaderboard "Blackout"**

The Cause:  
The data fetching hook likely isn't differentiating between "No Data" and "Loading".

* **The Fix:** Ensure the fetchLeaderboard function explicitly requests leaderboard\_daily, leaderboard\_weekly, etc. (the Materialized Views we created). If the views are empty, the UI should show a "Be the first to place\!" message instead of a black void.

### **4\. Unscannable QR Code**

The Cause:  
Dark Mode often breaks QR codes because QR scanners expect a White Background with Black Modules. If your "Cosmic" theme inverts this (White Modules on Black Background), many scanners fail.

* **The Fix:** Force the QR Code component to *always* render with a white background and black foreground, regardless of the app's theme.