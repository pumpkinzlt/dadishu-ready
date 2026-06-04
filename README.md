# Mole Rush Arena - V29 Pacing & Item Practice Update

GitHub Pages ready HTML5 Canvas game.

## V29 changes

- Beginner Mode is now a real 120-second practice run instead of a short demo.
- Classic Mode is now a 100-second high-score run.
- Arena Mode is now 95 seconds: still faster, but no longer ends before players understand the item flow.
- Level Mode now uses longer level timers and fairer miss limits.
- Early game difficulty ramps more slowly; fast/trap moles appear later.
- Moles stay visible longer, especially in Beginner / Classic / Level modes.
- Item effects last longer:
  - Forgiving Hammer: 36s
  - Golden Bait: 30s
  - Combo Mallet: 28s
  - Slow-Mo Clock: 32s
- Second Chance now restores at least 30 seconds, so the revive feels useful.
- Start-of-run tip added: players can tap the item dock or press 1-5.

## Existing core features retained

- Register / log in / log out with localStorage account saves.
- Unlogged users can only play Beginner Mode.
- Logged-in users unlock Classic, Arena, and Level modes.
- Login required for coin pack purchase.
- PayApi-v2.js / crypto-js payment integration retained.
- Daily login reward retained.
- Accessibility Mode / High Contrast / Reduced Motion retained.
- Shop, Items, Skins, Leaderboard, Settings, Level progress, and localStorage saves retained.

## GitHub Pages structure

```text
index.html
style.css
game.js
README.md
.gitignore
.nojekyll
```
