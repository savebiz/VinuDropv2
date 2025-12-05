I have received critical feedback from a tester. We need to fix 4 specific issues in the 'VinuDrop' project.

**Context:** Next.js 14, Tailwind, Matter.js, Thirdweb SDK v5, Supabase, Zustand.

Please implement the following changes file-by-file:

### **1\. Network Switcher Banner (Critical Fix)**

Create a new component components/ui/NetworkBanner.tsx.

* **Logic:** Use Thirdweb's useActiveWalletChain to check if the connected chain ID is **207** (VinuChain).  
* **If Mismatch:** Render a sticky top banner (Red background, White text).  
* **Content:** 'You are on the wrong network. Click here to switch to VinuChain.'  
* **Action:** On click, use useSwitchActiveWalletChain to switch to Chain 207\.  
* **Mount:** Add this component to app/game/page.tsx so it appears above the game.

### **2\. Persistent Best Score (Supabase)**

The 'Best Score' currently resets on reload. Fix this in hooks/useGameLogic.ts or a new hook useHighScore.ts.

* **On Wallet Connect:** Trigger a Supabase query:  
  SQL  
  SELECT MAX(score) as high\_score FROM game\_scores WHERE wallet\_address \= 'USER\_WALLET'

* **Update Store:** Save this value to the highScore in the Zustand store.  
* **Display:** Ensure ScorePanel.tsx displays this fetched value, not local state.

### **3\. Danger Line Visibility**

Update components/game/PhysicsContainer.tsx (or wherever the line is rendered).

* **Style:** Change the border color to border-red-600 (darker red) and increase opacity to 100%.  
* **Animation:** Ensure the 'pulse' animation is visible against both Dark (Space) and Light (White) backgrounds. Add z-index-50 to ensure it's on top of the glass layers.

### **4\. Shop & Leaderboard Activation (Major Feature)**

Part A: The Active Shop (components/shop/ShopPanel.tsx)  
Wire up the buttons to real logic.

* **Contract:** Use the VinuGameEconomy contract address.  
* **Items & Costs:**  
  1. **Shake:** Cost 200 VC. Reward: Add 5 Shakes to inventory.  
  2. **Precision Strike:** Cost 200 VC. Reward: Add 2 Strikes to inventory.  
  3. **Revive:** Cost 500 VC. Effect: "Halve Protocol" (See below).  
* **Implementation:** Use \<TransactionButton /\> from Thirdweb.  
  * transaction={() \=\> prepareContractCall(... purchaseItem(type)...)}  
  * onTransactionConfirmed: Update the Zustand store inventory (incrementShakes(5), etc.).  
* **Revive Logic (Physics):** When 'Revive' is purchased successfully, trigger a function in Matter.js that identifies all dynamic bodies, sorts them by Y position (height), and removes the top 50% of them.

Part B: Expanded Leaderboard (components/leaderboard/)  
We need a 'Deep Dive' modal.  
**1\. Supabase SQL (Create supabase/migrations/rank\_finder.sql):**

SQL

\-- Function to find exact rank of a user  
create or replace function get\_player\_rank(search\_wallet text, time\_period text)  
returns bigint language plpgsql as $$  
declare  
  rank\_val bigint;  
begin  
  \-- Logic: Count rows with score \> user\_max\_score  
  \-- (You will need to write the specific query here based on the time\_period logic)  
  return rank\_val;  
end;  
$$;

**2\. Full Modal (FullLeaderboardModal.tsx):**

* **Trigger:** Add a 'Maximize' icon button to the main LeaderboardPanel.  
* **UI:** Full-screen glass overlay.  
* **List:** Scrollable list of Top 30 (Gold/Silver/Bronze icons for 1-3).  
* **Search Footer:** A sticky footer with an input 'Enter Wallet'.  
  * On Search, call the get\_player\_rank RPC.  
  * Show a 'Player Card' result: "Rank \#4,205 \- Score: 12,500".

Please generate the code for these components and the SQL file."

### ---

**Technical Notes for the Team:**

1. **Smart Contract Arguments:** Ensure the purchaseItem function in your solidity contract accepts string arguments that match the UI (e.g., "shake", "strike", "revive").  
2. **Revive Physics:** "Cutting orbs by half" is best implemented by removing the *top-most* orbs (lowest Y value in Canvas coordinates). This clears the danger zone immediately, providing the best value for the 500 VC spent.  
3. **Rank Finder:** The SQL logic is tricky because of the time periods. The prompt instructs the AI to generate the SQL structure, but you may need to verify it creates specific views for daily\_scores, weekly\_scores, etc., to make the ranking query efficient.