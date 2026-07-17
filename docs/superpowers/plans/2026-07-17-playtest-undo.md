# Playtest Undo Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Add multi-step undo with reverse slide animation for editor playtest only.

**Architecture:** Snapshot stack before each playtest swipe; dedicated undo button replaces prev/next; restore via `entityKey`-matched reverse animations then apply snapshot.

**Tech Stack:** Vanilla JS (`js/game.js`), HTML, CSS.

## Global Constraints

- Only when `progressTracking === false`
- No undo after `gameOver`
- Reuse `prev-icon` art; no new assets
- Continuous undo back to start

---

### Task 1: UI shell

- [x] Add `#undoStepBtn` in `index.html` (hidden by default)
- [x] CSS: playtest nav visibility + disabled state
- [x] Wire `updateLevelNavUI()` from playtest / campaign scene entry

### Task 2: Snapshot + undo animation

- [x] `moveHistory` stack + capture/clear helpers
- [x] Push snapshot at start of playtest `moveAll`
- [x] `undoLastMove()` with slide / fade-in / fade-out
- [x] Clear history in `loadLevel`; refresh button state after turns

### Task 3: Verify

- [x] Syntax check `js/game.js` + existing unit test
- [ ] Manual: playtest shows undo, hides prev/next
- [ ] Manual: multi-step undo with reverse motion
- [ ] Manual: after lose/win modal, undo disabled; replay clears stack
