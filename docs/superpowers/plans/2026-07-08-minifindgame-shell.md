# MiniFindGame Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the current static sliding puzzle shell so it looks and flows like the confirmed MiniFindGame challenge UI while preserving the existing gameplay rules.

**Architecture:** Keep the app as static HTML/CSS/JavaScript. Copy the required MiniFindGame images into a local asset folder, replace the wrapper markup, retheme the board with CSS, and add small UI flow hooks around the existing `game.js` state machine.

**Tech Stack:** Static HTML, CSS, plain JavaScript, MiniFindGame PNG assets, PowerShell verification, local browser smoke testing.

---

## File Structure

- Create: `assets/minifindgame/`
  - Local copy of the MiniFindGame image assets used by the web shell.
- Modify: `index.html`
  - Start screen, game HUD, guide strip, board mount, pause modal, win/lose modal.
- Modify: `css/styles.css`
  - MiniFindGame parchment style, asset-backed title/buttons/modals, responsive board styling.
- Modify: `js/game.js`
  - UI flow hooks for start, pause, resume, back to start, replay, next level, and result modal state.
- Leave unchanged: `js/levels.js`
  - Existing level data and gameplay identifiers remain the source of truth.

---

### Task 1: Copy MiniFindGame Assets

**Files:**
- Create: `assets/minifindgame/title.png`
- Create: `assets/minifindgame/bg_title.png`
- Create: `assets/minifindgame/bg_level.png`
- Create: `assets/minifindgame/bg_level1.png`
- Create: `assets/minifindgame/minigame_bg_tips.png`
- Create: `assets/minifindgame/minigame_tips_titlebg.png`
- Create: `assets/minifindgame/minigame_guide_bg.png`
- Create: `assets/minifindgame/minigame_guide_jt.png`
- Create: `assets/minifindgame/minigame_guide_text.png`
- Create: `assets/minifindgame/minigame_tilel_win.png`
- Create: `assets/minifindgame/minigame_tilel_lose.png`
- Create: `assets/minifindgame/icon_tongguan.png`
- Create: `assets/minifindgame/minigame_icon_replay.png`
- Create: `assets/minifindgame/minigame_icon_reward.png`
- Create: `assets/minifindgame/minigame_select_1.png`
- Create: `assets/minifindgame/MiniGame_1.png`
- Create: `assets/minifindgame/MiniGame_4.png`
- Create: `assets/minifindgame/MiniGame_5.png`
- Create: `assets/minifindgame/MiniGame_9.png`

- [ ] **Step 1: Copy selected assets**

Run:

```powershell
$src = 'D:\Project\dysj_zj_clinet\assets\bundles\gui\MiniFindGame\texture\uitexture'
$dst = 'D:\Tool\SlideWeb\assets\minifindgame'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
@(
  'title.png',
  'bg_title.png',
  'bg_level.png',
  'bg_level1.png',
  'minigame_bg_tips.png',
  'minigame_tips_titlebg.png',
  'minigame_guide_bg.png',
  'minigame_guide_jt.png',
  'minigame_guide_text.png',
  'minigame_tilel_win.png',
  'minigame_tilel_lose.png',
  'icon_tongguan.png',
  'minigame_icon_replay.png',
  'minigame_icon_reward.png',
  'minigame_select_1.png',
  'MiniGame_1.png',
  'MiniGame_4.png',
  'MiniGame_5.png',
  'MiniGame_9.png'
) | ForEach-Object {
  Copy-Item -LiteralPath (Join-Path $src $_) -Destination (Join-Path $dst $_) -Force
}
Get-ChildItem $dst -File | Measure-Object
```

Expected: `Count` is `19`.

- [ ] **Step 2: Verify required assets exist**

Run:

```powershell
@(
  'title.png',
  'bg_title.png',
  'bg_level.png',
  'bg_level1.png',
  'minigame_bg_tips.png',
  'minigame_tilel_win.png',
  'minigame_tilel_lose.png',
  'minigame_icon_replay.png'
) | ForEach-Object {
  if (-not (Test-Path "assets/minifindgame/$_")) { throw "Missing $_" }
}
Write-Output 'assets ok'
```

Expected: `assets ok`.

---

### Task 2: Replace HTML Shell

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the body structure**

Use this shape in `index.html` while keeping the existing script tags at the bottom:

```html
<div class="game-shell" id="app">
    <section class="start-screen" id="startScreen">
        <div class="start-card">
            <img class="game-title-img" src="assets/minifindgame/title.png" alt="探索大挑战">
            <div class="level-ticket">
                <span id="startLevelDisplay">第 1 关</span>
            </div>
            <div class="rules-panel">
                <div class="rules-title">滑动探索路线</div>
                <p>让同伴抵达土楼据点，避开陷阱和追兵。</p>
            </div>
            <button class="primary-btn" id="startBtn" type="button">开始挑战</button>
        </div>
    </section>

    <section class="play-screen is-hidden" id="playScreen">
        <header class="top-hud">
            <button class="icon-btn back-btn" id="backToStartBtn" type="button" aria-label="返回开始">‹</button>
            <div class="hud-title">
                <span class="hud-kicker">探索大挑战</span>
                <span id="levelDisplay">第 1 关</span>
            </div>
            <button class="icon-btn pause-btn" id="pauseBtn" type="button" aria-label="暂停">Ⅱ</button>
        </header>

        <div class="progress-row">
            <button class="level-btn" id="prevLevelBtn" type="button" aria-label="上一关">‹</button>
            <div class="stat-pill">目标 <span id="goalDisplay">0/0</span></div>
            <button class="level-btn" id="nextLevelBtn" type="button" aria-label="下一关">›</button>
        </div>

        <main class="board-stage">
            <div class="grid-container" id="gridContainer"></div>
        </main>

        <div class="task-strip">
            <div>同伴 <span id="sheepCount">0</span></div>
            <div>追兵 <span id="wolfCount">0</span></div>
            <button class="text-btn" id="resetBtn" type="button">重新挑战</button>
        </div>

        <div class="guide-bar">
            <span class="guide-arrow"></span>
            <span class="message" id="messageDisplay">滑动屏幕移动角色</span>
        </div>
    </section>
</div>

<div class="overlay-modal hidden" id="pauseModal">
    <div class="paper-modal">
        <div class="modal-title-text">暂停</div>
        <button class="primary-btn" id="resumeBtn" type="button">继续挑战</button>
        <button class="secondary-btn" id="pauseReplayBtn" type="button">重新挑战</button>
        <button class="secondary-btn" id="pauseHomeBtn" type="button">返回首页</button>
    </div>
</div>

<div class="overlay-modal hidden" id="gameModal">
    <div class="paper-modal result-modal">
        <img class="result-title-img" id="modalTitleImg" src="assets/minifindgame/minigame_tilel_win.png" alt="">
        <div class="modal-title-text" id="modalTitle">挑战成功</div>
        <div class="game-modal-message" id="modalMessage">继续下一关。</div>
        <div class="result-actions">
            <button class="primary-btn" id="modalNextBtn" type="button">下一关</button>
            <button class="secondary-btn" id="modalResetBtn" type="button">重新挑战</button>
            <button class="secondary-btn" id="modalHomeBtn" type="button">返回首页</button>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Run a markup ID smoke check**

Run:

```powershell
$html = Get-Content -Raw index.html
@(
  'startScreen','playScreen','startBtn','pauseBtn','resumeBtn','pauseModal',
  'gridContainer','levelDisplay','startLevelDisplay','sheepCount','wolfCount',
  'goalDisplay','messageDisplay','gameModal','modalTitle','modalMessage',
  'modalTitleImg','modalNextBtn','modalResetBtn','modalHomeBtn'
) | ForEach-Object {
  if ($html -notmatch "id=`"$_`"") { throw "Missing id $_" }
}
Write-Output 'markup ids ok'
```

Expected: `markup ids ok`.

---

### Task 3: Apply MiniFindGame CSS Theme

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Replace the existing stylesheet**

Use a full stylesheet with these required selectors:

```css
:root {
    --paper: #fff4d8;
    --paper-deep: #f4c86e;
    --ink: #604235;
    --orange: #f29a3f;
    --brown: #8a5c33;
    --shadow: rgba(96, 66, 53, 0.24);
}

body {
    min-height: 100vh;
    margin: 0;
    overflow: hidden;
    background: radial-gradient(circle at 50% 8%, #fff9e8 0 18%, #f7d88f 48%, #eaa955 100%);
    font-family: Arial, "Microsoft YaHei", sans-serif;
    color: var(--ink);
    touch-action: none;
}

.is-hidden,
.hidden {
    display: none !important;
}

.game-shell,
.start-screen,
.play-screen {
    min-height: 100vh;
}

.start-screen,
.play-screen {
    width: min(100vw, 520px);
    margin: 0 auto;
    position: relative;
    padding: 18px;
}

.start-card,
.paper-modal {
    background: rgba(255, 244, 216, 0.96);
    border: 3px solid #fff7df;
    box-shadow: 0 16px 36px var(--shadow), inset 0 -5px 0 rgba(175, 112, 49, 0.18);
}
```

Then include the full implementation for start screen, HUD, board, cells, modals, buttons, and responsive breakpoints.

- [ ] **Step 2: Verify required selectors exist**

Run:

```powershell
$css = Get-Content -Raw css/styles.css
@(
  '.start-screen','.play-screen','.top-hud','.board-stage','.grid-container',
  '.cell.sheep-village','.overlay-modal','.paper-modal','.primary-btn',
  '.result-title-img','.guide-bar'
) | ForEach-Object {
  if ($css -notlike "*$_*") { throw "Missing selector $_" }
}
Write-Output 'css selectors ok'
```

Expected: `css selectors ok`.

---

### Task 4: Connect UI Flow in Game JavaScript

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Add DOM references and UI state**

Add references near the existing DOM constants:

```javascript
const startScreen = document.getElementById('startScreen');
const playScreen = document.getElementById('playScreen');
const startBtn = document.getElementById('startBtn');
const startLevelDisplay = document.getElementById('startLevelDisplay');
const pauseBtn = document.getElementById('pauseBtn');
const pauseModal = document.getElementById('pauseModal');
const resumeBtn = document.getElementById('resumeBtn');
const pauseReplayBtn = document.getElementById('pauseReplayBtn');
const pauseHomeBtn = document.getElementById('pauseHomeBtn');
const backToStartBtn = document.getElementById('backToStartBtn');
const modalTitleImg = document.getElementById('modalTitleImg');
const modalNextBtn = document.getElementById('modalNextBtn');
const modalHomeBtn = document.getElementById('modalHomeBtn');
let hasStarted = false;
let isPaused = false;
```

- [ ] **Step 2: Add shell helpers**

Add helpers after `hideGameModal()`:

```javascript
function showStartScreen() {
    hasStarted = false;
    isPaused = false;
    startScreen.classList.remove('is-hidden');
    playScreen.classList.add('is-hidden');
    hidePauseModal();
    hideGameModal();
}

function showPlayScreen() {
    hasStarted = true;
    startScreen.classList.add('is-hidden');
    playScreen.classList.remove('is-hidden');
}

function showPauseModal() {
    if (!hasStarted || gameOver || isMoving) return;
    isPaused = true;
    pauseModal.classList.remove('hidden');
}

function hidePauseModal() {
    isPaused = false;
    pauseModal.classList.add('hidden');
}
```

- [ ] **Step 3: Update result modal behavior**

Change `showGameModal(title, message)` into:

```javascript
function showGameModal(title, message, type = 'win') {
    if (!gameModal) return;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    if (modalTitleImg) {
        modalTitleImg.src = type === 'lose'
            ? 'assets/minifindgame/minigame_tilel_lose.png'
            : 'assets/minifindgame/minigame_tilel_win.png';
        modalTitleImg.alt = title;
    }
    if (modalNextBtn) {
        modalNextBtn.classList.toggle('hidden', type !== 'win' || currentLevel >= LEVEL_CONFIGS.length - 1);
    }
    gameModal.classList.remove('hidden');
}
```

- [ ] **Step 4: Guard movement while paused or before start**

Change the first line of `moveAll(direction)` to:

```javascript
if (!hasStarted || isPaused || gameOver || isMoving) return;
```

Apply the same `isPaused` check in `handleSwipeStart()` and `handleSwipeEnd()`.

- [ ] **Step 5: Wire new buttons**

Add event listeners in `initEvents()`:

```javascript
startBtn.addEventListener('click', showPlayScreen);
pauseBtn.addEventListener('click', showPauseModal);
resumeBtn.addEventListener('click', hidePauseModal);
pauseReplayBtn.addEventListener('click', () => {
    hidePauseModal();
    resetLevel();
    showPlayScreen();
});
pauseHomeBtn.addEventListener('click', showStartScreen);
backToStartBtn.addEventListener('click', showStartScreen);
modalHomeBtn.addEventListener('click', showStartScreen);
modalNextBtn.addEventListener('click', () => {
    if (currentLevel < LEVEL_CONFIGS.length - 1 && !isMoving) {
        currentLevel++;
        loadLevel(currentLevel);
        showPlayScreen();
    }
});
```

- [ ] **Step 6: Verify JavaScript references exist**

Run:

```powershell
$js = Get-Content -Raw js/game.js
@(
  'showStartScreen','showPlayScreen','showPauseModal','hidePauseModal',
  'modalTitleImg','modalNextBtn','isPaused','hasStarted'
) | ForEach-Object {
  if ($js -notlike "*$_*") { throw "Missing JS token $_" }
}
Write-Output 'js flow tokens ok'
```

Expected: `js flow tokens ok`.

---

### Task 5: Verify End-to-End

**Files:**
- Test app through local browser.

- [ ] **Step 1: Start a static server**

Run:

```powershell
python -m http.server 4173
```

Expected: local server serves `http://localhost:4173/`.

- [ ] **Step 2: Browser smoke test**

Open `http://localhost:4173/` and verify:

```text
Start screen appears.
Clicking start shows the board.
Mouse drag or touch swipe moves entities.
Pause opens and resume closes the pause modal.
Replay reloads the current level.
Win and lose modals use MiniFindGame-style result art.
No major overflow at desktop or mobile widths.
```

- [ ] **Step 3: Check working tree**

Run:

```powershell
git status --short
```

Expected: only the planned files and copied assets are changed.

