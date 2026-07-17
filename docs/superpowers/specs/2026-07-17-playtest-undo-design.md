# Playtest Undo Design

## Goal

In editor playtest mode only, replace prev/next level controls with a multi-step undo control that restores the previous board state with reverse slide animations.

## Mode detection

- Playtest mode: `progressTracking === false` (set by `playEditorLevel`).
- Normal campaign: `progressTracking === true` (set by `applyLevels`).

## UI

- Add `#undoStepBtn` in `.level-controls`, reusing `prev-icon` / `button-last` art.
- Playtest: hide `#prevLevelBtn` and `#nextLevelBtn`; show undo.
- Campaign: hide undo; show prev/next.
- Disable undo when stack is empty, `gameOver`, or a move/transition is in progress.
- After win/lose modal: undo stays unavailable (user must replay).

## Snapshot stack

Before each valid swipe in playtest, push a shallow-cloned snapshot:

- `sheepEntities`, `wolfEntities`, `obstacleEntities`, `trapEntities`
- `escapedSheep`, `sheepCount`, `wolfCount`

Clear the stack on `loadLevel` / replay / re-enter playtest.

## Undo animation

1. Pop snapshot; treat current entities as `from`.
2. Clear movable pieces from the board and render static terrain.
3. Match by `entityKey`:
   - both sides → slide current → snapshot cell
   - snapshot only (escaped / eaten / trapped) → fade in at snapshot cell
   - current only → fade out
4. After animations, restore snapshot entities and counters, `applyFinalState`, `renderGrid`, `updateUI`.

## Out of scope

- Undo in normal campaign
- Redo
- New undo artwork
- Modal layout changes
