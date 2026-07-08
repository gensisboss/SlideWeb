# MiniFindGame Shell Redesign

## Goal

Update the current sliding puzzle game so its visual style and outer flow match the confirmed MiniFindGame challenge shell, while preserving the existing core gameplay: swipe movement, sheep/wolf/obstacle/trap/village rules, level data, automatic next-level behavior, and win/lose conditions.

## Scope

- Use the MiniFindGame asset set from `D:\Project\dysj_zj_clinet\assets\bundles\gui\MiniFindGame\texture\uitexture`.
- Copy only the assets needed by this web project into a local `assets/minifindgame/` folder.
- Replace the current legacy themed wrapper with a MiniFindGame-like start screen, game HUD, pause modal, guide/tips strip, win modal, lose modal, and level controls.
- Restyle the board as a paper/photo exploration surface with light yellow panels, stamp-like success treatment, and orange/gold action controls.
- Keep `js/game.js` as the gameplay authority. UI changes may add state for start/pause/result overlays, but movement and collision behavior should remain unchanged.

## Architecture

The project remains a static web app:

- `index.html` owns the view structure: start layer, game layer, HUD, board mount, guide text, pause/result modals.
- `css/styles.css` owns the MiniFindGame visual shell, responsive layout, asset-backed buttons, and board theme.
- `js/game.js` keeps the existing game state machine and gains small UI hooks for start, pause, continue, next level, replay, and result display.
- `js/levels.js` remains unchanged unless text labels require cosmetic fixes.

## Flow

1. Initial load shows a MiniFindGame-style start screen with title art, level badge, rule/tips card, and a start button.
2. Start hides the start screen and shows the playable board.
3. During play, the HUD shows level, saved target progress, remaining sheep, wolves, and pause/replay controls.
4. Pause opens a modal with continue, replay, and back-to-start actions.
5. Win opens a MiniFindGame-style victory modal. If more levels exist, the player can continue to the next level.
6. Lose opens a MiniFindGame-style failure modal with replay and back-to-start actions.
7. Existing next/previous level controls remain available, but styled as compact icon buttons in the new HUD.

## Visual Direction

- Background: warm parchment and soft yellow/orange panels, inspired by MiniFindGame's title, guide, and result assets.
- Title and modal titles: use copied image assets where possible, with text fallback for accessibility.
- Board: light paper cells, subtle photo-frame border, destination cells as stamp/target areas, traps and obstacles as exploration hazards.
- Entities: replace sheep/wolf emoji presentation with image-like themed tokens where possible using CSS and asset-backed or styled icons. If no direct character asset exists in the source set, use polished CSS tokens and keep text alternatives.
- Motion: preserve current movement animations and retheme floating effects to match the stamped/paper style.

## Testing

- Verify the static app loads in a local browser without a build step.
- Test swipe/mouse drag movement on at least the first few levels.
- Verify start, pause, continue, replay, previous level, next level, win, lose, and final-clear flows.
- Check desktop and mobile-sized viewports for layout overflow, unreadable text, or overlapping HUD/board elements.
