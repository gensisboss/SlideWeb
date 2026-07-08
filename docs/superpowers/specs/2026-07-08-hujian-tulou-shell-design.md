# Hu Jian Tulou Shell Redesign

## Goal

Restyle the current sliding puzzle as a Hu Jian Tulou themed mini game using assets from `C:\Users\pc\Documents\Codex\2026-07-07\wo-z\outputs\hujian_tulou_assets`, while preserving the existing sheep, wolf, obstacle, trap, village movement rules and level data.

## Source Template

The referenced asset package is an unpacked Cocos Creator WeChat mini game. Its exported analysis identifies a `welcomeScene -> Gaming -> rankScene` flow, 6x6 board logic, building cards, population clearing, 24 seasonal terms, pixel mountain backgrounds, Tulou buildings, river/map tiles, and circular UI buttons.

The H5 project should not port the Cocos gameplay. It should borrow the visual shell and flow language:

- Portrait phone-like stage.
- Pixel mountain and river background.
- Tulou building artwork as destination and identity.
- Start screen before the playable board.
- Compact Cocos-like top controls and round icon buttons.
- Win/lose overlay with replay and next-level flow.

## Gameplay Boundary

Keep the current gameplay implementation:

- `js/levels.js` remains the source of levels and role ids.
- Sheep, wolf, obstacle, trap, and village categories keep the same behavior.
- Swipe/mouse drag still moves all applicable entities in one direction.
- Win and loss checks remain based on escaped sheep and sheep count.
- Later moving-obstacle behavior remains unchanged.

Only presentation, copy, flow wrapper, and entity rendering should change.

## UI Flow

1. Show a Tulou themed welcome screen on load.
2. Clicking the start button hides the welcome screen and loads level 1.
3. The game screen shows a top bar with current level, previous/next level buttons, reset, and a compact status row.
4. The board uses Hu Jian Tulou terrain styling and image-based entities.
5. On success, show a pass overlay with continue/replay controls. Continue advances to the next level when available.
6. On failure, show a replay overlay.
7. On final completion, show an end overlay.

## Assets To Use

Copy a small curated subset into `assets/hujian-tulou/`:

- Main background: `native/images/a1c3aa87-9629-45ef-9dfa-58477209a4ab.png`
- Tulou hero: `native/images/31273e28-1e28-4467-a89f-3934ec23238c.png`
- Game map lower background: `native/images/0dc1b5c0-4937-4432-a549-e37315d3ce5d.png`
- Cloud panel: `spriteframes/01cf3290d/Cloud_BG1__ab873209.png`
- Start button: `spriteframes/057436cf3/UI_Button_Start__4b28c163.png`
- Replay, next, home, setting buttons from the `057436cf3` spriteframes folder.
- Building card sheet: `spriteframes/07b7444a-e233-4879-84da-81d8e87e44ac/buildingCardNew__ad7f8647.png`
- Representative Tulou/building sprites from `spriteframes/063137460`.

## Implementation Notes

- Use CSS background images and entity CSS classes rather than changing gameplay ids.
- Add entity classes in `renderGrid()` so ids can map to `entity-sheep`, `entity-wolf`, `entity-obstacle`, `entity-trap`, and `entity-village`.
- Keep emoji fallback text available but visually replace it with themed sprites or styled tokens.
- Add a `hasStarted` flow state so the game can begin from the welcome screen without altering turn-state logic.
- Preserve desktop and mobile playability with stable grid dimensions.

## Verification

Manual verification should include:

- Page opens without console errors.
- Welcome screen appears first.
- Start enters the board.
- Swiping/mouse dragging still moves entities.
- Reset, previous, and next controls work.
- Win, lose, and final overlays render in the Tulou style.
