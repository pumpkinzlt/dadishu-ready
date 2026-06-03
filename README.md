# Mole Rush Arena

A GitHub Pages-ready HTML5 Canvas arcade whack-a-mole game.

## Files

Upload these files to the root of your GitHub repository:

```text
index.html
style.css
game.js
README.md
.gitignore
.nojekyll
```

## Latest Fixes

- Guest / unsigned users can only play **Beginner Mode**.
- **Classic Mode**, **Arena Mode**, and **Level Mode** now require Register / Log In.
- Mode Select clearly shows locked modes before login.
- After Register / Log In, all modes are unlocked.
- Mode differences are now more obvious:
  - Beginner Mode: easier pace, more misses, no early punishment.
  - Classic Mode: balanced 60-second high-score challenge.
  - Arena Mode: faster spawns, AI rivals, live rank pressure, stricter miss limit.
  - Level Mode: target score, star rating, level unlock progress.
- Register / Log In buttons have direct, reliable button behavior.
- Right-click inspection remains enabled.
- Coin packs now call the connected checkout script through `DoRequest(options)`.

## Features

- HTML5 Canvas gameplay
- PC and mobile browser support
- Beginner Mode for unsigned users
- Classic Mode, Arena Mode, and Level Mode for signed-in users
- Local account system using `localStorage`
- Register / Log In / Log Out
- Account-isolated game saves
- Coins, items, skins, leaderboard, settings, daily reward, and level progress saved locally
- Shop with coin packs, items, and skins
- Coin pack checkout scripts referenced in `index.html`:
  - `https://www.roomilo.com/js/core/crypto-js.min.js`
  - `https://www.roomilo.com/js/core/PayApi-v2.js`
- Supported checkout payTypes: `8004` Credit Card, `8003` Apple Pay, `8012` Google Pay
- Keyboard controls: WASD / Arrow Keys / Space / P / R
- Mobile controls: touch, virtual D-pad, WHACK button
- Sound effects and background music toggles

## Important Note

This project uses browser `localStorage` only. It is suitable for a static GitHub Pages demo. It is not a secure production login system. For real online accounts, replace the local account system with backend authentication and a database.


## Payment Flow

Coin pack buttons build an `options` object and call `DoRequest(options)`. The game stores a pending payment order before redirecting. If the checkout returns to the page with `payment=success`, the matching coin pack is credited once. If it returns with `payment=failed`, no coins are added.
