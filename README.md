# V24 Item Usage and Non-Blocking Layout

- Added a clear **Item Guide** in Shop → Items.
- Added item usage instructions in Settings.
- In-game item buttons are now a compact dock instead of a large bottom bar.
- PC layout: item dock sits on the left safe area and does not cover the main mole holes.
- Mobile layout: item dock sits above the virtual controls and the play field reserves extra lower space.
- Manual item shortcuts: `1` Helmet, `2` Bait, `3` Combo, `4` Stun, `5` Slow-Mo.
- Second Chance is clarified as an auto-use item and is no longer shown in the in-game dock.

# V22 Payment False Error Fix

## V23 - Payment Method UI Emphasis
- Replaced the small payment method dropdown with large checkout method cards.
- Credit Card / Apple Pay / Google Pay are now visually obvious before selecting a coin pack.
- Selected payment method uses a persistent filled state; hover-only borders do not conflict with button selection.
- Existing login-required purchase logic, DoRequest(options), and payment return handling are preserved.


- Fixed false payment failure toast that could appear after `DoRequest(options)` while checkout still opened normally.
- Checkout launch now keeps the pending order and shows only an opening message.
- If checkout does not open after a few seconds, the game shows a soft retry hint instead of a hard payment error.

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

- Added richer WebAudio background music and arcade sound effects:
  - Different music pacing for Beginner, Classic, Arena, and Level modes.
  - Button, login, start, pause/resume, whack, mole pop, hit, combo, coin, item, bomb, shield, revive, purchase, payment, miss, hurt, and game-over sounds.
  - Music and sound effects still respect the Settings toggles.

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
- Enhanced WebAudio sound effects and mode-specific background music toggles

## Important Note

This project uses browser `localStorage` only. It is suitable for a static GitHub Pages demo. It is not a secure production login system. For real online accounts, replace the local account system with backend authentication and a database.


## Payment Flow

Coin pack buttons build an `options` object and call `DoRequest(options)`. The game stores a pending payment order before redirecting. If the checkout returns to the page with `payment=success`, the matching coin pack is credited once. If it returns with `payment=failed`, no coins are added.


## V13 Button Interaction Fix
- Clicked UI buttons now keep the blue selected background instead of flashing and disappearing.
- Other buttons in the same group return to transparent background.
- D-pad, WHACK, and item buttons keep gameplay-specific press behavior and do not get stuck selected.


## V14 Button Selection Logic Update
- Home screen now opens with a clear default selected action: Beginner Mode / Start Game.
- Login form opens with Log In selected by default.
- Mode Select defaults to Classic only after login; locked guest modes do not show a fake selected state.
- Shop opens with Coin Packs selected by default, and tabs keep one selected state at a time.
- Button selection is now group-based so unrelated buttons do not keep incorrect backgrounds.

## V15 Guest Payment Fix
- Guest players can buy coin packs without registering or logging in.
- Logged-in payments use the account email.
- Guest payments use the email typed in the auth email field when valid; otherwise the game generates a valid guest email for the payment request.
- Guest coin purchases are credited to the guest local save after a matching success return.


## V16 Payment Logic Update

- Guest users can play Beginner Mode, but cannot buy paid coin packs.
- Coin pack purchases require registration/login so purchased coins are tied to a specific account save.
- If a guest taps a coin pack button, the game returns to the start screen and asks the player to register or log in.
- Payment success grants coins to the pending order's account save key, preventing paid coins from being written to an unclear guest save.

## V18 Home Button Selection Fix

- Fixed the home menu button selected state so the clicked button actually keeps the blue background.
- The five home menu buttons now behave as one strict group: Beginner/Start, Mode Select, Shop, Leaderboard, and Settings.
- Only one home menu button can be active at a time.
- Unselected home buttons stay transparent.
- Hover/focus styling is now visually lighter, so it is not confused with the selected state.
- Returning from Mode Select, Shop, Leaderboard, or Settings preserves the last selected home menu button.


## V18 Update
- Signed-in users now see a clean account status card only: email/password fields and Log In/Register buttons are hidden after login.
- Logged-out users default to the Log In button being selected. Register remains selected only after the user chooses Register.
- Home button selection logic from V17 is preserved.


## V19 Button Hover Logic Update
- Button hover no longer shows a cyan/selected-looking border.
- Unselected buttons stay transparent with a neutral border.
- Only clicked/selected buttons keep the blue filled background.
- Signed-in auth UI, mode locks, payment login requirement, audio and storage logic are preserved.

## V20 Button Hover / Selected State Fix
- Unselected buttons no longer keep a cyan border because of the old `primary` class.
- Cyan border is now hover-only.
- Clicked/selected buttons keep the blue filled background through `ui-active`.
- Same button group still supports single-selection logic.

## V21 Item System Fit Update
- Reworked the item set to better match whack-a-mole gameplay.
- New item presentation:
  - Safety Helmet: blocks one wrong whack, trap hit, or escaped mole.
  - Golden Bait: attracts more golden moles and adds bonus coin rewards.
  - Combo Mallet: builds combo faster, boosts score, and doubles coin gain.
  - Stun Smash: safely stuns/clears every visible mole without trap penalties.
  - Slow-Mo Clock: keeps moles above ground longer for easier reaction.
  - Second Chance: automatically rescues one failed run.
- Updated HUD item labels, shop item cards, and in-game item buttons.
- Restart/new run still clears temporary effects and cooldowns.