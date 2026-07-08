# Hu Jian Tulou Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the H5 sliding puzzle shell to match the Hu Jian Tulou mini game visual flow while preserving the existing gameplay.

**Architecture:** Keep `js/levels.js` and the movement state machine intact. Add a welcome/game/overlay flow in `index.html` and `js/game.js`, copy a curated set of Tulou assets locally, and use CSS classes to map existing entity ids to the new image-based presentation.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, PNG assets from the unpacked Cocos Creator package.

---

### Task 1: Replace Wrong Planning Artifacts

**Files:**
- Delete: `docs/superpowers/specs/2026-07-08-minifindgame-shell-design.md`
- Delete: `docs/superpowers/plans/2026-07-08-minifindgame-shell.md`
- Create: `docs/superpowers/specs/2026-07-08-hujian-tulou-shell-design.md`
- Create: `docs/superpowers/plans/2026-07-08-hujian-tulou-shell.md`

- [x] **Step 1: Remove MiniFindGame documents**

Delete the two MiniFindGame documents because that template was not the requested Hu Jian Tulou source.

- [x] **Step 2: Add Tulou design and plan documents**

Create documents that name the correct asset package, summarize the Tulou Cocos flow, and state that the existing gameplay remains unchanged.

### Task 2: Copy Curated Tulou Assets

**Files:**
- Create: `assets/hujian-tulou/`

- [ ] **Step 1: Create local asset folder**

Run:

```powershell
New-Item -ItemType Directory -Force -LiteralPath 'D:\Tool\SlideWeb\assets\hujian-tulou'
```

- [ ] **Step 2: Copy selected PNG assets**

Copy the chosen background, Tulou, map, button, and building sprites into the local asset folder with readable names.

### Task 3: Rebuild HTML Shell

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add welcome scene**

Add a full-screen welcome layer with the Tulou title, Tulou building image, and start button.

- [ ] **Step 2: Rework game scene markup**

Wrap the board in a portrait stage, add Cocos-like top controls, and keep all ids required by `js/game.js`.

- [ ] **Step 3: Extend modal controls**

Add next-level and home/start-over buttons while retaining the existing replay id.

### Task 4: Restyle With Tulou Assets

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Replace current forest toy theme**

Use the pixel mountain background, cloud panel, Tulou accent art, and warm parchment control surfaces.

- [ ] **Step 2: Style board cells and entities**

Map entity classes to themed sprites or icon treatments for population, patrol, barriers, trap markers, and Tulou destinations.

- [ ] **Step 3: Add responsive portrait layout**

Ensure 6x6 through 10x10 levels fit mobile and desktop viewports without text overlap.

### Task 5: Add Flow State And Entity Classes

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Bind new DOM nodes**

Read `startScreen`, `startGameBtn`, `gameScene`, `modalNextBtn`, and `modalHomeBtn` without breaking existing ids.

- [ ] **Step 2: Gate game start**

Load level data on page load but hide the board scene until the start button is clicked.

- [ ] **Step 3: Add themed render classes**

In `renderGrid()`, attach terrain/entity classes for existing ids while keeping the same data model.

- [ ] **Step 4: Update win/loss modal flow**

Show Tulou-styled pass/fail/final copy and make next/replay/home controls call existing level-loading behavior.

### Task 6: Verify

**Files:**
- Inspect: `index.html`, `css/styles.css`, `js/game.js`

- [ ] **Step 1: Static syntax check**

Run:

```powershell
node --check .\js\game.js
```

- [ ] **Step 2: Open locally and inspect**

Start a static server if needed, open the page, check console output, and verify welcome, start, movement, reset, previous, next, and modal flows.

- [ ] **Step 3: Inspect git diff**

Run:

```powershell
git diff --stat
git diff -- index.html css/styles.css js/game.js
```

Confirm changes are focused on Tulou shell and presentation.
