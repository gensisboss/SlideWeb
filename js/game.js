(function() {
    const {
        SHEEP_IDS,
        WOLF_IDS,
        OBSTACLE_IDS,
        TRAP_IDS,
        VILLAGE_IDS,
        ID_TO_CHAR,
        LEVEL_CONFIGS,
    } = window.GameConfig;

        const ROLE_TYPE = {
            SHEEP: 'sheep',
            WOLF: 'wolf',
            OBSTACLE: 'obstacle'
        };

        const TURN_STATE = {
            IDLE: 'idle',
            INPUT: 'input',
            CALCULATE_MOVE: 'calculateMove',
            CLEAR_BOARD: 'clearBoard',
            RESOLVE_LANDING: 'resolveLanding',
            RESOLVE_ROLE_ACTIONS: 'resolveRoleActions',
            APPLY_RESULT: 'applyResult',
            ANIMATE: 'animate',
            COMPLETE: 'complete'
        };

// ========== 游戏状态 ==========
        let currentLevel = 0;
        let maxUnlockedLevel = 0;
        let progressTracking = true;
        let guideActive = false;
        let guideConfigs = [];
        let guideLineIndex = 0;
        let activeGuide = null;
        let seenGuideLevels = new Set();
        let grid = [];
        let ROWS = 6;
        let COLS = 6;
        let sheepEntities = [];
        let wolfEntities = [];
        let villageEntities = [];
        let obstacleEntities = [];
        let trapEntities = [];
        let sheepCount = 0;
        let wolfCount = 0;
        let escapedSheep = 0;
        let goal = 2;
        let gameOver = false;
        let isMoving = false;
        let isTransitioning = false;
        let turnState = TURN_STATE.IDLE;
        let moveHistory = [];

        const gridContainer = document.getElementById('gridContainer');
        const startScreen = document.getElementById('startScreen');
        const startGameBtn = document.getElementById('startGameBtn');
        const openEditorBtn = document.getElementById('openEditorBtn');
        const gameScene = document.getElementById('gameScene');
        const editorScene = document.getElementById('editorScene');
        const prevLevelBtn = document.getElementById('prevLevelBtn');
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        const undoStepBtn = document.getElementById('undoStepBtn');
        const editorGrid = document.getElementById('editorGrid');
        const editorCategoryTabs = document.getElementById('editorCategoryTabs');
        const editorPalette = document.getElementById('editorPalette');
        const editorMessage = document.getElementById('editorMessage');
        const editorGoalInput = document.getElementById('editorGoalInput');
        const editorMoveObstacleInput = document.getElementById('editorMoveObstacleInput');
        const editorRowsInput = document.getElementById('editorRowsInput');
        const editorColsInput = document.getElementById('editorColsInput');
        const editorResizeBtn = document.getElementById('editorResizeBtn');
        const editorPlayBtn = document.getElementById('editorPlayBtn');
        const editorSaveBtn = document.getElementById('editorSaveBtn');
        const editorClearBtn = document.getElementById('editorClearBtn');
        const editorHomeBtn = document.getElementById('editorHomeBtn');
        const levelLoading = document.getElementById('levelLoading');
        const homeBtn = document.getElementById('homeBtn');
        const levelDisplay = document.getElementById('levelDisplay');
        const levelTitle = document.getElementById('levelTitle');
        const sheepCountSpan = document.getElementById('sheepCount');
        const wolfCountSpan = document.getElementById('wolfCount');
        const goalDisplay = document.getElementById('goalDisplay');
        const messageDisplay = document.getElementById('messageDisplay');
        const gameModal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalResetBtn = document.getElementById('modalResetBtn');
        const modalNextBtn = document.getElementById('modalNextBtn');
        const modalHomeBtn = document.getElementById('modalHomeBtn');
        const guideOverlay = document.getElementById('guideOverlay');
        const guideSpotlight = document.getElementById('guideSpotlight');
        const guideText = document.getElementById('guideText');
        const SPRITE_VARIANTS = {
            sheep: ['sheep.png', 'sheep-2.png', 'sheep-3.png', 'sheep-4.png', 'sheep-5.png'],
            wolf: ['wolf.png', 'wolf-2.png', 'wolf-3.png', 'wolf-4.png', 'wolf-5.png'],
            village: ['village.png', 'village-2.png', 'village-3.png', 'village-4.png'],
            obstacle: ['obstacle.png', 'obstacle-2.png', 'obstacle-3.png', 'obstacle-4.png'],
            trap: ['trap.png', 'trap-2.png', 'trap-3.png', 'trap-4.png']
        };

        const SPRITE_BASE = 'assets/hujian-tulou/';
        const LEVELS_URL = 'data/level.json';
        const GUIDE_URL = 'data/guide.json';
        const PROGRESS_STORAGE_KEY = 'slideweb-max-unlocked-level';
        const GUIDE_SEEN_STORAGE_KEY = 'slideweb-guide-seen-levels';
        const DEFAULT_EDITOR_ROWS = 6;
        const DEFAULT_EDITOR_COLS = 6;
        const MIN_EDITOR_SIZE = 1;
        const MAX_EDITOR_SIZE = 10;
        const editorCore = window.LevelEditorCore;
        const editorToolGroups = [
            { key: 'erase', label: '擦除', tools: [{ label: '擦除', id: 0, className: 'erase' }] },
            {
                key: 'sheep',
                label: '小羊',
                tools: [
                    { label: '羊1', id: SHEEP_IDS[0] },
                    { label: '羊2', id: SHEEP_IDS[1] },
                    { label: '羊3', id: SHEEP_IDS[2] },
                    { label: '羊4', id: SHEEP_IDS[3] },
                    { label: '羊5', id: SHEEP_IDS[4] }
                ]
            },
            {
                key: 'wolf',
                label: '狼',
                tools: [
                    { label: '狼1', id: WOLF_IDS[0] },
                    { label: '狼2', id: WOLF_IDS[1] },
                    { label: '狼3', id: WOLF_IDS[2] },
                    { label: '狼4', id: WOLF_IDS[3] },
                    { label: '狼5', id: WOLF_IDS[4] }
                ]
            },
            {
                key: 'village',
                label: '羊村',
                tools: [
                    { label: '羊村1', id: VILLAGE_IDS[0] },
                    { label: '羊村2', id: VILLAGE_IDS[1] },
                    { label: '羊村3', id: VILLAGE_IDS[2] },
                    { label: '羊村4', id: VILLAGE_IDS[3] }
                ]
            },
            {
                key: 'obstacle',
                label: '障碍',
                tools: [
                    { label: '障碍1', id: OBSTACLE_IDS[0] },
                    { label: '障碍2', id: OBSTACLE_IDS[1] },
                    { label: '障碍3', id: OBSTACLE_IDS[2] },
                    { label: '障碍4', id: OBSTACLE_IDS[3] }
                ]
            },
            {
                key: 'trap',
                label: '陷阱',
                tools: [
                    { label: '陷阱1', id: TRAP_IDS[0] },
                    { label: '陷阱2', id: TRAP_IDS[1] },
                    { label: '陷阱3', id: TRAP_IDS[2] },
                    { label: '陷阱4', id: TRAP_IDS[3] }
                ]
            }
        ];
        let editorRows = DEFAULT_EDITOR_ROWS;
        let editorCols = DEFAULT_EDITOR_COLS;
        let editorMap = editorCore.createEmptyMap(editorRows, editorCols);
        let selectedEditorId = SHEEP_IDS[0];
        let selectedEditorGroup = 'sheep';
        let levelConfigs = [];
        let levelsReady = false;
        let modalMode = 'game';

        const DIR = {
            'up': [-1, 0],
            'down': [1, 0],
            'left': [0, -1],
            'right': [0, 1]
        };

        // ========== 工具函数 ==========
        function loadLevelProgress() {
            try {
                const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
                const value = Number(raw);
                maxUnlockedLevel = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
            } catch {
                maxUnlockedLevel = 0;
            }
            try {
                const seenRaw = localStorage.getItem(GUIDE_SEEN_STORAGE_KEY);
                const seenList = seenRaw ? JSON.parse(seenRaw) : [];
                seenGuideLevels = new Set(
                    Array.isArray(seenList)
                        ? seenList.filter(n => Number.isFinite(Number(n))).map(n => Math.floor(Number(n)))
                        : []
                );
            } catch {
                seenGuideLevels = new Set();
            }
        }

        function saveLevelProgress() {
            try {
                localStorage.setItem(PROGRESS_STORAGE_KEY, String(maxUnlockedLevel));
            } catch {
                // ignore quota / private mode failures
            }
        }

        function saveGuideSeen() {
            try {
                localStorage.setItem(GUIDE_SEEN_STORAGE_KEY, JSON.stringify([...seenGuideLevels]));
            } catch {
                // ignore quota / private mode failures
            }
        }

        function normalizeGuideConfigs(source) {
            const list = source && Array.isArray(source.guides) ? source.guides : [];
            return list
                .map(item => {
                    if (!item || typeof item !== 'object') return null;
                    const level = Math.floor(Number(item.level));
                    const lines = Array.isArray(item.lines)
                        ? item.lines.map(line => String(line || '').trim()).filter(Boolean)
                        : [];
                    const row = Math.floor(Number(item.highlight?.row));
                    const col = Math.floor(Number(item.highlight?.col));
                    if (!Number.isFinite(level) || level < 1 || lines.length === 0) return null;
                    if (!Number.isFinite(row) || !Number.isFinite(col) || row < 0 || col < 0) return null;
                    return { level, lines, highlight: { row, col } };
                })
                .filter(Boolean);
        }

        async function loadGuideData() {
            try {
                const response = await fetch(`${GUIDE_URL}?t=${Date.now()}`, { cache: 'no-store' });
                if (!response.ok) {
                    guideConfigs = [];
                    return;
                }
                guideConfigs = normalizeGuideConfigs(await response.json());
            } catch {
                guideConfigs = [];
            }
        }

        function getGuideForLevel(levelIndex) {
            const levelNumber = levelIndex + 1;
            return guideConfigs.find(guide => guide.level === levelNumber) || null;
        }

        function hideGuideOverlay() {
            guideActive = false;
            activeGuide = null;
            guideLineIndex = 0;
            if (guideOverlay) {
                guideOverlay.classList.add('hidden');
                guideOverlay.setAttribute('aria-hidden', 'true');
            }
            if (guideSpotlight) {
                guideSpotlight.style.left = '0px';
                guideSpotlight.style.top = '0px';
                guideSpotlight.style.width = '0px';
                guideSpotlight.style.height = '0px';
            }
        }

        function positionGuideSpotlight(row, col) {
            if (!guideSpotlight) return;
            const cell = getCellElement(row, col);
            if (!cell) {
                guideSpotlight.style.width = '0px';
                guideSpotlight.style.height = '0px';
                return;
            }
            const rect = cell.getBoundingClientRect();
            const pad = 4;
            guideSpotlight.style.left = `${rect.left - pad}px`;
            guideSpotlight.style.top = `${rect.top - pad}px`;
            guideSpotlight.style.width = `${rect.width + pad * 2}px`;
            guideSpotlight.style.height = `${rect.height + pad * 2}px`;
        }

        function renderGuideLine() {
            if (!activeGuide || !guideText) return;
            guideText.textContent = activeGuide.lines[guideLineIndex] || '';
        }

        function markGuideSeen(levelNumber) {
            if (seenGuideLevels.has(levelNumber)) return;
            seenGuideLevels.add(levelNumber);
            saveGuideSeen();
        }

        function closeGuide() {
            if (activeGuide) {
                markGuideSeen(activeGuide.level);
            }
            hideGuideOverlay();
        }

        function advanceGuide() {
            if (!guideActive || !activeGuide) return;
            if (guideLineIndex < activeGuide.lines.length - 1) {
                guideLineIndex += 1;
                renderGuideLine();
                return;
            }
            closeGuide();
        }

        function maybeShowGuideForCurrentLevel() {
            hideGuideOverlay();
            if (!progressTracking || !guideOverlay) return;
            const guide = getGuideForLevel(currentLevel);
            if (!guide || seenGuideLevels.has(guide.level)) return;
            if (
                guide.highlight.row >= ROWS ||
                guide.highlight.col >= COLS
            ) {
                return;
            }

            activeGuide = guide;
            guideLineIndex = 0;
            guideActive = true;
            renderGuideLine();
            guideOverlay.classList.remove('hidden');
            guideOverlay.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
                positionGuideSpotlight(guide.highlight.row, guide.highlight.col);
            });
        }

        function clampLevelProgress() {
            if (!LEVEL_CONFIGS.length) {
                maxUnlockedLevel = 0;
                return;
            }
            maxUnlockedLevel = Math.max(0, Math.min(maxUnlockedLevel, LEVEL_CONFIGS.length - 1));
        }

        function unlockNextLevelProgress() {
            if (!progressTracking || !LEVEL_CONFIGS.length) return;
            const unlocked = Math.min(currentLevel + 1, LEVEL_CONFIGS.length - 1);
            if (unlocked > maxUnlockedLevel) {
                maxUnlockedLevel = unlocked;
                saveLevelProgress();
            }
        }

        function canSkipToNextLevel() {
            if (!LEVEL_CONFIGS.length) return false;
            if (!progressTracking) return currentLevel < LEVEL_CONFIGS.length - 1;
            return currentLevel < maxUnlockedLevel && currentLevel < LEVEL_CONFIGS.length - 1;
        }

        function getCellPixelPosition(row, col) {
            const cell = getCellElement(row, col);
            if (!cell) return { left: 0, top: 0 };
            const rect = cell.getBoundingClientRect();
            const containerRect = gridContainer.getBoundingClientRect();
            return {
                left: rect.left - containerRect.left + rect.width / 2,
                top: rect.top - containerRect.top + rect.height / 2
            };
        }

        function getCellElement(row, col) {
            return gridContainer.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        }

        function getCellKey(row, col) {
            return `${row},${col}`;
        }

        function getEntityKey(entity) {
            return entity.entityKey || `${entity.type || 'terrain'}-${entity.id}-${entity.row}-${entity.col}`;
        }

        function getEmojiForId(id) {
            if (id === 0) return '🌿';
            return ID_TO_CHAR[id] || '❓';
        }

        function setTurnState(state) {
            turnState = state;
            isMoving = state !== TURN_STATE.IDLE;
        }

        function createTerrainSets() {
            const obstacleSet = new Set(
                isMovingObstacleLevel() ? [] : obstacleEntities.map(e => getCellKey(e.row, e.col))
            );
            const trapSet = new Set(trapEntities.map(e => getCellKey(e.row, e.col)));
            const villageSet = new Set(villageEntities.map(e => getCellKey(e.row, e.col)));

            return { obstacleSet, trapSet, villageSet };
        }

        function isMovingObstacleLevel() {
            return Number(LEVEL_CONFIGS[currentLevel]?.moveObstacle) === 1;
        }

        function showGameModal(title, message, options = {}) {
            if (!gameModal) return;
            const { showNext = false, resetLabel = '重玩本关', homeLabel = '返回开始页', mode = 'game' } = options;
            modalMode = mode;
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            if (modalResetBtn) {
                modalResetBtn.setAttribute('aria-label', resetLabel);
                modalResetBtn.title = resetLabel;
            }
            if (modalHomeBtn) {
                modalHomeBtn.setAttribute('aria-label', homeLabel);
                modalHomeBtn.title = homeLabel;
            }
            if (modalNextBtn) {
                modalNextBtn.classList.toggle('hidden', !showNext);
            }
            gameModal.classList.remove('hidden');
        }

        function hideGameModal() {
            if (!gameModal) return;
            gameModal.classList.add('hidden');
            modalMode = 'game';
        }

        function showStartScreen() {
            hideGameModal();
            if (startScreen) startScreen.classList.remove('is-hidden');
            if (gameScene) gameScene.classList.add('is-hidden');
            if (editorScene) editorScene.classList.add('is-hidden');
        }

        function showGameScene() {
            hideGameModal();
            if (startScreen) startScreen.classList.add('is-hidden');
            if (gameScene) gameScene.classList.remove('is-hidden');
            if (editorScene) editorScene.classList.add('is-hidden');
            updateLevelNavUI();
        }

        function isPlaytestMode() {
            return !progressTracking;
        }

        function cloneEntityList(list) {
            return (list || []).map(entity => ({ ...entity }));
        }

        function clearMoveHistory() {
            moveHistory = [];
            updateUndoButtonState();
        }

        function capturePlaytestSnapshot() {
            return {
                sheepEntities: cloneEntityList(sheepEntities),
                wolfEntities: cloneEntityList(wolfEntities),
                obstacleEntities: cloneEntityList(obstacleEntities),
                trapEntities: cloneEntityList(trapEntities),
                escapedSheep,
                sheepCount,
                wolfCount
            };
        }

        function pushPlaytestSnapshot() {
            if (!isPlaytestMode()) return;
            moveHistory.push(capturePlaytestSnapshot());
            updateUndoButtonState();
        }

        function updateUndoButtonState() {
            if (!undoStepBtn) return;
            const canUndo = isPlaytestMode()
                && !gameOver
                && !isMoving
                && !isTransitioning
                && moveHistory.length > 0;
            undoStepBtn.disabled = !canUndo;
            undoStepBtn.classList.toggle('is-disabled', !canUndo);
        }

        function updateLevelNavUI() {
            const playtest = isPlaytestMode();
            if (prevLevelBtn) prevLevelBtn.classList.toggle('is-hidden', playtest);
            if (nextLevelBtn) nextLevelBtn.classList.toggle('is-hidden', playtest);
            if (undoStepBtn) undoStepBtn.classList.toggle('is-hidden', !playtest);
            updateUndoButtonState();
        }

        function getMovingEntitiesForUndo(snapshot) {
            const includeObstacles = isMovingObstacleLevel();
            return {
                current: [
                    ...sheepEntities,
                    ...wolfEntities,
                    ...(includeObstacles ? obstacleEntities : [])
                ],
                target: [
                    ...(snapshot.sheepEntities || []),
                    ...(snapshot.wolfEntities || []),
                    ...(includeObstacles ? (snapshot.obstacleEntities || []) : [])
                ]
            };
        }

        function animateFadeEntity(row, col, emoji, className, id, duration = 280) {
            return new Promise(resolve => {
                const pos = getCellPixelPosition(row, col);
                const el = document.createElement('div');
                el.className = `floating-entity ${getFloatingClassForEmoji(emoji)} ${className}`;
                el.textContent = emoji;
                applySpriteStyle(el, id);
                el.style.left = `${pos.left}px`;
                el.style.top = `${pos.top}px`;
                const sample = document.querySelector('.cell .emoji');
                if (sample) {
                    el.style.fontSize = getComputedStyle(sample).fontSize;
                }
                gridContainer.appendChild(el);
                setTimeout(() => {
                    el.remove();
                    resolve();
                }, duration);
            });
        }

        async function undoLastMove() {
            if (!isPlaytestMode() || gameOver || isMoving || isTransitioning || moveHistory.length === 0) {
                return;
            }

            const snapshot = moveHistory.pop();
            setTurnState(TURN_STATE.ANIMATE);
            updateUndoButtonState();

            const { current, target } = getMovingEntitiesForUndo(snapshot);
            const currentByKey = new Map(current.map(entity => [getEntityKey(entity), entity]));
            const targetByKey = new Map(target.map(entity => [getEntityKey(entity), entity]));
            const animations = [];

            trapEntities = cloneEntityList(snapshot.trapEntities);
            applyStaticState({ includeObstacles: !isMovingObstacleLevel() });

            for (const [key, fromEntity] of currentByKey) {
                const toEntity = targetByKey.get(key);
                if (toEntity && fromEntity.row === toEntity.row && fromEntity.col === toEntity.col) {
                    grid[toEntity.row][toEntity.col] = toEntity.id;
                }
            }
            renderGrid();

            for (const [key, fromEntity] of currentByKey) {
                const toEntity = targetByKey.get(key);
                const emoji = getEmojiForId(fromEntity.id);
                if (toEntity) {
                    if (fromEntity.row !== toEntity.row || fromEntity.col !== toEntity.col) {
                        animations.push(
                            animateEntity(
                                fromEntity.row,
                                fromEntity.col,
                                toEntity.row,
                                toEntity.col,
                                emoji,
                                350,
                                { id: fromEntity.id }
                            )
                        );
                    }
                } else {
                    animations.push(
                        animateFadeEntity(fromEntity.row, fromEntity.col, emoji, 'undo-fade-out', fromEntity.id)
                    );
                }
            }

            for (const [key, toEntity] of targetByKey) {
                if (currentByKey.has(key)) continue;
                animations.push(
                    animateFadeEntity(
                        toEntity.row,
                        toEntity.col,
                        getEmojiForId(toEntity.id),
                        'undo-fade-in',
                        toEntity.id
                    )
                );
            }

            await Promise.all(animations);

            sheepEntities = cloneEntityList(snapshot.sheepEntities);
            wolfEntities = cloneEntityList(snapshot.wolfEntities);
            obstacleEntities = cloneEntityList(snapshot.obstacleEntities);
            trapEntities = cloneEntityList(snapshot.trapEntities);
            escapedSheep = snapshot.escapedSheep;
            sheepCount = snapshot.sheepCount;
            wolfCount = snapshot.wolfCount;
            applyFinalState();
            renderGrid();
            updateUI();
            messageDisplay.textContent = '已返回上一步';
            setTurnState(TURN_STATE.IDLE);
            updateUndoButtonState();
        }

        function showEditorScene() {
            hideGameModal();
            if (startScreen) startScreen.classList.add('is-hidden');
            if (gameScene) gameScene.classList.add('is-hidden');
            if (editorScene) editorScene.classList.remove('is-hidden');
            renderEditor();
        }

        async function startGame() {
            if (!levelsReady || LEVEL_CONFIGS.length === 0) {
                showGameModal('需要关卡数据', '没有读取到 data/level.json，请检查关卡文件。', {
                    mode: 'missingLevels',
                    resetLabel: '去编辑',
                    homeLabel: '返回首页'
                });
                return;
            }
            showGameScene();
            await transitionToLevel(currentLevel);
        }

        function goHome() {
            if (isMoving || isTransitioning) return;
            hideGuideOverlay();
            currentLevel = 0;
            if (levelsReady && LEVEL_CONFIGS.length) {
                loadLevel(currentLevel);
            }
            showStartScreen();
        }

        function handleModalHome() {
            goHome();
        }

        function handleModalReset() {
            if (modalMode === 'missingLevels') {
                hideGameModal();
                showEditorScene();
                return;
            }
            resetLevel();
        }

        async function goNextLevel() {
            if (isMoving || isTransitioning || guideActive) return;
            if (canSkipToNextLevel()) {
                showGameScene();
                await transitionToLevel(currentLevel + 1);
            } else if (currentLevel >= LEVEL_CONFIGS.length - 1) {
                showGameModal('狼来了通关', '小羊都走过了山路，回到首页可以重新开始。');
            } else {
                messageDisplay.textContent = '请先通关当前关卡，才能进入下一关';
            }
        }

        function playLevelLoading(onCovered) {
            return new Promise(resolve => {
                if (!levelLoading) {
                    onCovered();
                    resolve();
                    return;
                }

                levelLoading.classList.remove('hidden');
                levelLoading.classList.remove('is-playing');
                void levelLoading.offsetWidth;
                levelLoading.classList.add('is-playing');

                setTimeout(onCovered, 430);
                setTimeout(() => {
                    levelLoading.classList.remove('is-playing');
                    levelLoading.classList.add('hidden');
                    resolve();
                }, 1180);
            });
        }

        async function transitionToLevel(index) {
            if (isMoving || isTransitioning) return;
            isTransitioning = true;
            setTurnState(TURN_STATE.ANIMATE);
            hideGameModal();
            hideGuideOverlay();
            await playLevelLoading(() => {
                currentLevel = index;
                loadLevel(currentLevel);
            });
            setTurnState(TURN_STATE.IDLE);
            isTransitioning = false;
            maybeShowGuideForCurrentLevel();
        }

        function applyLevels(source) {
            levelConfigs = editorCore.normalizeLevels(source);
            LEVEL_CONFIGS.length = 0;
            LEVEL_CONFIGS.push(...levelConfigs);
            levelsReady = levelConfigs.length > 0;
            progressTracking = true;
            clearMoveHistory();
            clampLevelProgress();
            currentLevel = levelsReady ? Math.min(currentLevel, levelConfigs.length - 1) : 0;
            updateLevelNavUI();
            return levelsReady;
        }

        async function loadLevelData() {
            try {
                const response = await fetch(`${LEVELS_URL}?t=${Date.now()}`, { cache: 'no-store' });
                if (!response.ok) return applyLevels([]);
                return applyLevels(await response.json());
            } catch {
                return applyLevels([]);
            }
        }

        function getEntityClassForId(id) {
            if (SHEEP_IDS.includes(id)) return 'entity-sheep';
            if (WOLF_IDS.includes(id)) return 'entity-wolf';
            if (OBSTACLE_IDS.includes(id)) return 'entity-obstacle';
            if (TRAP_IDS.includes(id)) return 'entity-trap';
            if (VILLAGE_IDS.includes(id)) return 'entity-village';
            return 'terrain-clear';
        }

        function getEntityKindForId(id) {
            if (SHEEP_IDS.includes(id)) return 'sheep';
            if (WOLF_IDS.includes(id)) return 'wolf';
            if (OBSTACLE_IDS.includes(id)) return 'obstacle';
            if (TRAP_IDS.includes(id)) return 'trap';
            if (VILLAGE_IDS.includes(id)) return 'village';
            return null;
        }

        function getSpriteForId(id) {
            const kind = getEntityKindForId(id);
            const variants = kind ? SPRITE_VARIANTS[kind] : null;
            if (!variants) return '';
            const idGroups = {
                sheep: SHEEP_IDS,
                wolf: WOLF_IDS,
                obstacle: OBSTACLE_IDS,
                trap: TRAP_IDS,
                village: VILLAGE_IDS
            };
            const idIndex = idGroups[kind].indexOf(id);
            const index = (idIndex >= 0 ? idIndex : Math.abs(Number(id) || 0)) % variants.length;
            return `${SPRITE_BASE}${variants[index]}`;
        }

        function applySpriteStyle(el, id) {
            const sprite = getSpriteForId(id);
            if (!sprite) return;
            el.style.setProperty('--entity-sprite', `url("../${sprite}")`);
        }

        function getEditorGoal() {
            const sheepTotal = editorMap.flat().filter(id => SHEEP_IDS.includes(id)).length;
            const fallback = Math.max(1, sheepTotal || 1);
            const value = Number(editorGoalInput?.value || fallback);
            const goalNumber = Math.max(1, Number.isFinite(value) ? Math.floor(value) : fallback);
            if (editorGoalInput) editorGoalInput.value = String(goalNumber);
            return goalNumber;
        }

        function getEditorMoveObstacle() {
            return editorMoveObstacleInput?.checked ? 1 : 0;
        }

        function clampEditorSize(value, fallback) {
            const number = Number(value);
            const normalized = Number.isFinite(number) ? Math.floor(number) : fallback;
            return Math.min(MAX_EDITOR_SIZE, Math.max(MIN_EDITOR_SIZE, normalized));
        }

        function syncEditorSizeInputs() {
            if (editorRowsInput) editorRowsInput.value = String(editorRows);
            if (editorColsInput) editorColsInput.value = String(editorCols);
        }

        function getEditorSizeFromInputs() {
            return {
                rows: clampEditorSize(editorRowsInput?.value, editorRows),
                cols: clampEditorSize(editorColsInput?.value, editorCols)
            };
        }

        function setEditorMessage(text) {
            if (editorMessage) editorMessage.textContent = text;
        }

        function getActiveEditorGroup() {
            return editorToolGroups.find(group => group.key === selectedEditorGroup) || editorToolGroups[0];
        }

        function renderEditorCategoryTabs() {
            if (!editorCategoryTabs) return;
            editorCategoryTabs.innerHTML = '';
            editorToolGroups.forEach(group => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'editor-category-btn';
                button.textContent = group.label;
                button.setAttribute('aria-label', `显示${group.label}素材`);
                button.classList.toggle('is-active', selectedEditorGroup === group.key);
                button.addEventListener('click', () => {
                    selectedEditorGroup = group.key;
                    selectedEditorId = group.tools[0].id;
                    renderEditorCategoryTabs();
                    renderEditorPalette();
                    setEditorMessage(`已切换：${group.label}`);
                });
                editorCategoryTabs.appendChild(button);
            });
        }

        function renderEditorPalette() {
            if (!editorPalette) return;
            editorPalette.innerHTML = '';
            getActiveEditorGroup().tools.forEach(tool => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `palette-btn ${tool.className || ''}`;
                button.setAttribute('aria-label', tool.label);
                button.classList.toggle('is-active', selectedEditorId === tool.id);
                if (tool.id) {
                    applySpriteStyle(button, tool.id);
                }
                button.addEventListener('click', () => {
                    selectedEditorId = tool.id;
                    renderEditorPalette();
                    setEditorMessage(tool.id ? `已选择：${tool.label}` : '已选择：擦除');
                });
                editorPalette.appendChild(button);
            });
        }

        function renderEditor() {
            if (!editorGrid) return;
            editorGrid.style.gridTemplateColumns = `repeat(${editorCols}, var(--cell-size))`;
            editorGrid.style.setProperty('--rows', editorRows);
            editorGrid.style.setProperty('--cols', editorCols);
            editorGrid.innerHTML = '';
            for (let r = 0; r < editorRows; r++) {
                for (let c = 0; c < editorCols; c++) {
                    const id = editorMap[r][c];
                    const cell = document.createElement('button');
                    cell.type = 'button';
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    cell.className = `cell ${getEntityClassForId(id)}`;
                    cell.setAttribute('aria-label', `第 ${r + 1} 行第 ${c + 1} 列`);
                    applySpriteStyle(cell, id);
                    if (OBSTACLE_IDS.includes(id)) cell.classList.add('obstacle');
                    if (TRAP_IDS.includes(id)) cell.classList.add('trap');
                    if (VILLAGE_IDS.includes(id)) cell.classList.add('sheep-village');
                    cell.innerHTML = `<span class="emoji">${getEmojiForId(id)}</span>`;
                    cell.addEventListener('click', () => {
                        editorMap = editorCore.placeTile(editorMap, r, c, selectedEditorId);
                        renderEditor();
                    });
                    editorGrid.appendChild(cell);
                }
            }
            syncEditorSizeInputs();
            renderEditorCategoryTabs();
            renderEditorPalette();
        }

        function buildEditorLevel() {
            return editorCore.buildLevelFromMap(editorMap, getEditorGoal(), getEditorMoveObstacle());
        }

        async function playEditorLevel() {
            if (isMoving || isTransitioning) return;
            const level = buildEditorLevel();
            levelConfigs = [level];
            LEVEL_CONFIGS.length = 0;
            LEVEL_CONFIGS.push(level);
            levelsReady = true;
            progressTracking = false;
            clearMoveHistory();
            await transitionToLevel(0);
            showGameScene();
        }

        async function writeTextToClipboard(text) {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            const copied = document.execCommand('copy');
            textarea.remove();
            return copied;
        }

        async function saveEditorLevel() {
            const levelJson = editorCore.exportLevelJson(buildEditorLevel());
            try {
                const copied = await writeTextToClipboard(levelJson);
                setEditorMessage(copied ? '关卡数据已复制到剪贴板' : '复制失败，请重新点击保存');
            } catch {
                setEditorMessage('复制失败，请检查浏览器剪贴板权限');
            }
        }

        function clearEditorMap() {
            editorMap = editorCore.createEmptyMap(editorRows, editorCols);
            renderEditor();
            setEditorMessage('已清空地图');
        }

        function resizeEditorMapFromInputs() {
            const nextSize = getEditorSizeFromInputs();
            editorRows = nextSize.rows;
            editorCols = nextSize.cols;
            editorMap = editorCore.resizeMap(editorMap, editorRows, editorCols);
            renderEditor();
            setEditorMessage(`已生成 ${editorRows} 行 × ${editorCols} 列地图`);
        }

        function getFloatingClassForEmoji(emoji) {
            if (emoji === '🐺') return 'is-wolf';
            if (emoji === '🧱') return 'is-obstacle';
            return 'is-person';
        }

        function getDirectionLabel(direction) {
            const labels = {
                up: '上',
                down: '下',
                left: '左',
                right: '右'
            };
            return labels[direction] || direction;
        }

        class RoleBehavior {
            constructor(type, emoji) {
                this.type = type;
                this.emoji = emoji;
            }

            canEnter(key, terrain) {
                return !terrain.obstacleSet.has(key);
            }

            shouldStop(key, terrain) {
                return terrain.trapSet.has(key);
            }

            participatesInLanding() {
                return true;
            }

            resolveLanding(entity, context, result) {
                if (context.terrain.trapSet.has(getCellKey(entity.row, entity.col))) {
                    this.onTrap(entity, context, result);
                    return false;
                }
                return true;
            }

            onTrap(entity, context, result) {
                context.trapsToRemove.add(getCellKey(entity.row, entity.col));
            }

            resolveRoleActions() {}

            queueAnimation(oldEntity, turnContext, animations, floatingEntities) {
                const entityKey = getEntityKey(oldEntity);
                const newPos = turnContext.movedById.get(entityKey);
                if (!newPos) return;

                const stillExists = turnContext.result[this.type].some(e => getEntityKey(e) === entityKey);
                if (stillExists) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 350, { id: oldEntity.id, removeOnComplete: false })
                            .then(el => floatingEntities.push(el))
                    );
                }
            }
        }

        class SheepBehavior extends RoleBehavior {
            constructor() {
                super(ROLE_TYPE.SHEEP, '🐑');
            }

            shouldStop(key, terrain) {
                return terrain.trapSet.has(key) || terrain.villageSet.has(key);
            }

            resolveLanding(entity, context, result) {
                const key = getCellKey(entity.row, entity.col);
                if (context.terrain.villageSet.has(key)) {
                    result.escaped.push(entity);
                    return false;
                }

                if (context.terrain.trapSet.has(key)) {
                    result.trapSheep.push(entity);
                    context.trapsToRemove.add(key);
                    return false;
                }

                return true;
            }

            queueAnimation(oldEntity, turnContext, animations, floatingEntities) {
                const entityKey = getEntityKey(oldEntity);
                const newPos = turnContext.movedById.get(entityKey);
                if (!newPos) return;

                const result = turnContext.result;
                const isEscaped = result.escaped.some(e => getEntityKey(e) === entityKey);
                const isEaten = result.eaten.some(e => getEntityKey(e) === entityKey);
                const isTrapped = result.trapSheep.some(e => getEntityKey(e) === entityKey);
                const stillExists = result.sheep.some(e => getEntityKey(e) === entityKey);

                if (isEscaped) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300, { id: oldEntity.id })
                            .then(() => createEffectEntity(this.emoji, newPos.row, newPos.col, 'escape', oldEntity.id))
                    );
                } else if (isEaten) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300, { id: oldEntity.id, removeOnComplete: false })
                            .then(el => floatingEntities.push(el))
                    );
                } else if (isTrapped) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300, { id: oldEntity.id })
                            .then(() => createEffectEntity(this.emoji, newPos.row, newPos.col, 'trap-hit', oldEntity.id))
                    );
                } else if (stillExists) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 350, { id: oldEntity.id, removeOnComplete: false })
                            .then(el => floatingEntities.push(el))
                    );
                }
            }
        }

        class WolfBehavior extends RoleBehavior {
            constructor() {
                super(ROLE_TYPE.WOLF, '🐺');
            }

            canEnter(key, terrain) {
                return !terrain.obstacleSet.has(key) && !terrain.villageSet.has(key);
            }

            onTrap(entity, context, result) {
                result.trapWolf.push(entity);
                context.trapsToRemove.add(getCellKey(entity.row, entity.col));
            }

            resolveRoleActions(result) {
                const reservedAttackCells = new Set();

                for (let wolf of result.wolf) {
                    const candidates = result.sheep.filter(sheep => {
                        const key = getCellKey(sheep.row, sheep.col);
                        const dist = Math.abs(wolf.row - sheep.row) + Math.abs(wolf.col - sheep.col);
                        return dist === 1 && !reservedAttackCells.has(key);
                    });

                    if (candidates.length === 0) continue;

                    const target = candidates[Math.floor(Math.random() * candidates.length)];
                    const targetKey = getCellKey(target.row, target.col);
                    reservedAttackCells.add(targetKey);
                    result.eaten.push(target);
                    result.wolfAttacks.push({
                        wolfKey: getEntityKey(wolf),
                        fromRow: wolf.row,
                        fromCol: wolf.col,
                        toRow: target.row,
                        toCol: target.col,
                        targetId: target.id
                    });
                    wolf.row = target.row;
                    wolf.col = target.col;
                }

                const eatenKeys = new Set(result.eaten.map(getEntityKey));
                result.sheep = result.sheep.filter(s => !eatenKeys.has(getEntityKey(s)));
            }

            queueAnimation(oldEntity, turnContext, animations, floatingEntities) {
                const entityKey = getEntityKey(oldEntity);
                const newPos = turnContext.movedById.get(entityKey);
                if (!newPos) return;

                const result = turnContext.result;
                const isTrapped = result.trapWolf.some(e => getEntityKey(e) === entityKey);
                const stillExists = result.wolf.some(e => getEntityKey(e) === entityKey);
                const attack = result.wolfAttacks.find(a => a.wolfKey === entityKey);

                if (isTrapped) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300, { id: oldEntity.id })
                            .then(() => createEffectEntity(this.emoji, newPos.row, newPos.col, 'trap-hit', oldEntity.id))
                    );
                } else if (stillExists && attack) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300, { id: oldEntity.id })
                            .then(() => animateEntity(attack.fromRow, attack.fromCol, attack.toRow, attack.toCol, this.emoji, 180, { id: oldEntity.id, removeOnComplete: false }))
                            .then(el => {
                                floatingEntities.push(el);
                                return createEffectEntity('🐑', attack.toRow, attack.toCol, 'eaten', attack.targetId);
                            })
                    );
                } else if (stillExists) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 350, { id: oldEntity.id, removeOnComplete: false })
                            .then(el => floatingEntities.push(el))
                    );
                }
            }
        }

        class ObstacleBehavior extends RoleBehavior {
            constructor() {
                super(ROLE_TYPE.OBSTACLE, '🧱');
            }

            canEnter(key, terrain) {
                return !terrain.villageSet.has(key) && !terrain.trapSet.has(key);
            }

            shouldStop() {
                return false;
            }

            participatesInLanding() {
                return false;
            }

            queueAnimation(oldEntity, turnContext, animations, floatingEntities) {
                const newPos = turnContext.movedById.get(getEntityKey(oldEntity));
                if (!newPos) return;

                animations.push(
                    animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 350, { id: oldEntity.id, removeOnComplete: false })
                        .then(el => floatingEntities.push(el))
                );
            }
        }

        const roleBehaviors = {
            [ROLE_TYPE.SHEEP]: new SheepBehavior(),
            [ROLE_TYPE.WOLF]: new WolfBehavior(),
            [ROLE_TYPE.OBSTACLE]: new ObstacleBehavior()
        };

        function getRoleBehavior(entityOrType) {
            const type = typeof entityOrType === 'string' ? entityOrType : entityOrType.type;
            return roleBehaviors[type];
        }

        // ========== 加载关卡 ==========
        function loadLevel(index) {
            const config = LEVEL_CONFIGS[index];
            if (!config) return;
            
            ROWS = config.rows || config.n || config.map.length;
            COLS = config.cols || config.n || config.map[0].length;
            goal = config.goal;
            grid = config.map.map(row => [...row]);
            
            sheepEntities = [];
            wolfEntities = [];
            villageEntities = [];
            obstacleEntities = [];
            trapEntities = [];
            escapedSheep = 0;
            gameOver = false;
            setTurnState(TURN_STATE.IDLE);
            hideGameModal();

            let entitySequence = 0;
            const createEntity = (id, row, col, type) => ({
                id,
                row,
                col,
                type,
                entityKey: `${type}-${entitySequence++}`
            });

            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const id = grid[r][c];
                    if (SHEEP_IDS.includes(id)) {
                        sheepEntities.push(createEntity(id, r, c, ROLE_TYPE.SHEEP));
                    } else if (WOLF_IDS.includes(id)) {
                        wolfEntities.push(createEntity(id, r, c, ROLE_TYPE.WOLF));
                    } else if (VILLAGE_IDS.includes(id)) {
                        villageEntities.push({ id, row: r, col: c });
                    } else if (OBSTACLE_IDS.includes(id)) {
                        obstacleEntities.push(createEntity(id, r, c, ROLE_TYPE.OBSTACLE));
                    } else if (TRAP_IDS.includes(id)) {
                        trapEntities.push({ id, row: r, col: c });
                    }
                }
            }
            
            sheepCount = sheepEntities.length;
            wolfCount = wolfEntities.length;
            clearMoveHistory();
            updateUI();
            renderGrid();
            messageDisplay.textContent = '滑动屏幕，护送小羊逃进羊村';
            if (levelDisplay) {
                levelDisplay.textContent = `第 ${index + 1} 关`;
            }
            if (levelTitle) {
                const title = typeof config.title === 'string' ? config.title.trim() : '';
                levelTitle.textContent = title;
            }
            updateLevelNavUI();
        }

        // ========== 渲染网格 ==========
        function renderGrid() {
            gridContainer.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
            gridContainer.style.setProperty('--rows', ROWS);
            gridContainer.style.setProperty('--cols', COLS);
            gridContainer.innerHTML = '';
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cell = document.createElement('div');
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    const id = grid[r][c];
                    cell.className = `cell ${getEntityClassForId(id)}`;
                    applySpriteStyle(cell, id);
                    const emoji = getEmojiForId(id);
                    
                    if (OBSTACLE_IDS.includes(id)) cell.classList.add('obstacle');
                    if (TRAP_IDS.includes(id)) cell.classList.add('trap');
                    if (VILLAGE_IDS.includes(id)) cell.classList.add('sheep-village');
                    
                    cell.innerHTML = `<span class="emoji">${emoji}</span>`;
                    gridContainer.appendChild(cell);
                }
            }
        }

        // ========== 更新UI ==========
        function updateUI() {
            sheepCountSpan.textContent = sheepCount;
            wolfCountSpan.textContent = wolfCount;
            goalDisplay.textContent = `${escapedSheep}/${goal}`;
        }

        // ========== 检查游戏状态 ==========
        function getGameStatus() {
            if (escapedSheep >= goal) {
                return 'win';
            }
            if (sheepCount <= 0) {
                return 'lose';
            }
            return 'playing';
        }

        // ========== 缓动动画 ==========
        function animateEntity(fromRow, fromCol, toRow, toCol, emoji, duration = 300, options = {}) {
            const { id, removeOnComplete = true } = options;
            return new Promise((resolve) => {
                const startPos = getCellPixelPosition(fromRow, fromCol);
                const endPos = getCellPixelPosition(toRow, toCol);
                
                const el = document.createElement('div');
                el.className = `floating-entity ${getFloatingClassForEmoji(emoji)}`;
                el.textContent = emoji;
                applySpriteStyle(el, id);
                el.style.left = startPos.left + 'px';
                el.style.top = startPos.top + 'px';
                el.style.fontSize = getComputedStyle(document.querySelector('.cell .emoji')).fontSize;
                gridContainer.appendChild(el);

                const startTime = performance.now();
                
                function animate(time) {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    
                    const currentX = startPos.left + (endPos.left - startPos.left) * eased;
                    const currentY = startPos.top + (endPos.top - startPos.top) * eased;
                    
                    el.style.left = currentX + 'px';
                    el.style.top = currentY + 'px';
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        if (removeOnComplete) {
                            el.remove();
                        }
                        resolve(el);
                    }
                }
                requestAnimationFrame(animate);
            });
        }

        function createEffectEntity(emoji, row, col, className, id) {
            return new Promise((resolve) => {
                const pos = getCellPixelPosition(row, col);
                const el = document.createElement('div');
                el.className = `floating-entity ${getFloatingClassForEmoji(emoji)} ${className}`;
                el.textContent = emoji;
                applySpriteStyle(el, id);
                el.style.left = pos.left + 'px';
                el.style.top = pos.top + 'px';
                el.style.fontSize = getComputedStyle(document.querySelector('.cell .emoji')).fontSize;
                gridContainer.appendChild(el);
                
                setTimeout(() => {
                    el.remove();
                    resolve();
                }, 700);
            });
        }

        // ========== 核心：计算移动后的位置 ==========
        function calculateMove(dr, dc) {
            const terrain = createTerrainSets();
            const movingEntities = [
                ...sheepEntities.map(e => ({ ...e })),
                ...wolfEntities.map(e => ({ ...e })),
                ...(isMovingObstacleLevel() ? obstacleEntities.map(e => ({ ...e })) : [])
            ];
            const movingObstacleKeys = new Set(
                isMovingObstacleLevel() ? obstacleEntities.map(getEntityKey) : []
            );

            const sorted = movingEntities.sort((a, b) => {
                if (dc !== 0) return dc > 0 ? b.col - a.col : a.col - b.col;
                if (dr !== 0) return dr > 0 ? b.row - a.row : a.row - b.row;
                return 0;
            });

            const occupied = new Set();

            for (let entity of sorted) {
                let nr = entity.row;
                let nc = entity.col;
                const behavior = getRoleBehavior(entity);

                while (true) {
                    const nextR = nr + dr;
                    const nextC = nc + dc;
                    if (nextR < 0 || nextR >= ROWS || nextC < 0 || nextC >= COLS) break;

                    const key = getCellKey(nextR, nextC);
                    if (!behavior.canEnter(key, terrain) || occupied.has(key)) break;

                    nr = nextR;
                    nc = nextC;
                    if (behavior.shouldStop(key, terrain)) break;
                }

                entity.row = nr;
                entity.col = nc;
                occupied.add(getCellKey(nr, nc));
            }

            return {
                newSheep: sorted.filter(e => e.type === ROLE_TYPE.SHEEP).map(e => ({ ...e })),
                newWolf: sorted.filter(e => e.type === ROLE_TYPE.WOLF).map(e => ({ ...e })),
                newObstacles: obstacleEntities.map(obstacle => {
                    if (!movingObstacleKeys.has(getEntityKey(obstacle))) return { ...obstacle };
                    const movedObstacle = sorted.find(e => getEntityKey(e) === getEntityKey(obstacle));
                    return movedObstacle ? { ...movedObstacle } : { ...obstacle };
                })
            };
        }

        // ========== 处理落点事件 ==========
        function resolveLandingEvents(sheepList, wolfList) {
            const result = {
                sheep: [],
                wolf: [],
                escaped: [],
                eaten: [],
                trapSheep: [],
                trapWolf: [],
                wolfAttacks: []
            };

            const landingContext = {
                terrain: createTerrainSets(),
                trapsToRemove: new Set()
            };

            for (let entity of [...sheepList, ...wolfList]) {
                const behavior = getRoleBehavior(entity);
                if (!behavior.participatesInLanding()) continue;

                const survivesLanding = behavior.resolveLanding(entity, landingContext, result);

                if (survivesLanding) {
                    result[entity.type].push(entity);
                }
            }

            for (let key of landingContext.trapsToRemove) {
                const [r, c] = key.split(',').map(Number);
                const idx = trapEntities.findIndex(t => t.row === r && t.col === c);
                if (idx !== -1) {
                    trapEntities.splice(idx, 1);
                }
            }

            return result;
        }

        // ========== 应用状态到grid ==========
        function applyStaticState(options = {}) {
            const { includeObstacles = true } = options;
            // 从实体状态重建屏幕，避免被移除的陷阱等旧格子残留。
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    grid[r][c] = 0;
                }
            }

            // 放置所有固定物体
            for (let v of villageEntities) {
                grid[v.row][v.col] = v.id;
            }
            for (let t of trapEntities) {
                grid[t.row][t.col] = t.id;
            }
            if (includeObstacles) {
                for (let o of obstacleEntities) {
                    grid[o.row][o.col] = o.id;
                }
            }
        }

        function applyFinalState() {
            applyStaticState();

            for (let s of sheepEntities) {
                grid[s.row][s.col] = s.id;
            }
            for (let w of wolfEntities) {
                grid[w.row][w.col] = w.id;
            }
        }

        function createTurnContext(direction) {
            return {
                direction,
                dr: DIR[direction][0],
                dc: DIR[direction][1],
                oldEntities: [
                    ...sheepEntities.map(e => ({ ...e })),
                    ...wolfEntities.map(e => ({ ...e })),
                    ...(isMovingObstacleLevel() ? obstacleEntities.map(e => ({ ...e })) : [])
                ],
                movedEntities: [],
                movedById: new Map(),
                newObstacles: obstacleEntities.map(e => ({ ...e })),
                result: null,
                animations: [],
                floatingEntities: []
            };
        }

        const turnStateHandlers = {
            [TURN_STATE.INPUT](context) {
                return TURN_STATE.CALCULATE_MOVE;
            },

            [TURN_STATE.CALCULATE_MOVE](context) {
                const { newSheep, newWolf, newObstacles } = calculateMove(context.dr, context.dc);
                context.newObstacles = newObstacles;
                context.movedEntities = [...newSheep, ...newWolf, ...newObstacles].map(e => ({ ...e }));
                context.movedById = new Map(context.movedEntities.map(e => [getEntityKey(e), e]));
                context.newSheep = newSheep;
                context.newWolf = newWolf;
                return TURN_STATE.CLEAR_BOARD;
            },

            [TURN_STATE.CLEAR_BOARD](context) {
                applyStaticState({ includeObstacles: !isMovingObstacleLevel() });
                renderGrid();
                return TURN_STATE.RESOLVE_LANDING;
            },

            [TURN_STATE.RESOLVE_LANDING](context) {
                context.result = resolveLandingEvents(context.newSheep, context.newWolf);
                return TURN_STATE.RESOLVE_ROLE_ACTIONS;
            },

            [TURN_STATE.RESOLVE_ROLE_ACTIONS](context) {
                getRoleBehavior(ROLE_TYPE.WOLF).resolveRoleActions(context.result);
                return TURN_STATE.APPLY_RESULT;
            },

            [TURN_STATE.APPLY_RESULT](context) {
                sheepEntities = context.result.sheep;
                wolfEntities = context.result.wolf;
                obstacleEntities = context.newObstacles;
                escapedSheep += context.result.escaped.length;
                sheepCount = sheepEntities.length;
                wolfCount = wolfEntities.length;
                applyFinalState();
                return TURN_STATE.ANIMATE;
            },

            async [TURN_STATE.ANIMATE](context) {
                for (let oldEntity of context.oldEntities) {
                    getRoleBehavior(oldEntity).queueAnimation(oldEntity, context, context.animations, context.floatingEntities);
                }

                await Promise.all(context.animations);
                renderGrid();
                context.floatingEntities.forEach(el => el.remove());
                return TURN_STATE.COMPLETE;
            },

            async [TURN_STATE.COMPLETE](context) {
                updateUI();
                const status = getGameStatus();

                if (status === 'win') {
                    gameOver = true;
                    messageDisplay.textContent = '成功，小羊已逃进羊村';
                    unlockNextLevelProgress();

                    if (currentLevel < LEVEL_CONFIGS.length - 1) {
                        showGameModal('逃跑成功', '小羊成功逃脱，继续穿过下一条山路。', { showNext: true });
                    } else {
                        showGameModal('狼来了通关', '小羊都走过了山路，回到首页可以重新开始。');
                    }
                } else if (status === 'lose') {
                    gameOver = true;
                    messageDisplay.textContent = '小羊被狼拦住了，请重新规划路线';
                    showGameModal('逃跑失败', '没有小羊可以继续进楼，重走这一段山路。');
                } else {
                    messageDisplay.textContent = `小羊和野狼向${getDirectionLabel(context.direction)}滑动`;
                }

                updateUndoButtonState();
                return TURN_STATE.IDLE;
            }
        };

        async function runTurnStateMachine(context) {
            let nextState = TURN_STATE.INPUT;

            while (nextState !== TURN_STATE.IDLE) {
                setTurnState(nextState);
                const handler = turnStateHandlers[nextState];
                nextState = await handler(context);
            }

            setTurnState(TURN_STATE.IDLE);
            updateUndoButtonState();
        }

        // ========== 移动逻辑 ==========
        async function moveAll(direction) {
            if (gameOver || isMoving || guideActive) return;
            pushPlaytestSnapshot();
            await runTurnStateMachine(createTurnContext(direction));
        }

        // ========== 重置关卡 ==========
        async function resetLevel() {
            if (isMoving || isTransitioning || guideActive) return;
            await transitionToLevel(currentLevel);
        }

        // ========== 滑动控制 ==========
        let touchStartX = 0, touchStartY = 0;
        let isDragging = false;

        function handleSwipeStart(e) {
            if (gameOver || isMoving || isTransitioning || guideActive) return;
            const t = e.touches ? e.touches[0] : e;
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            isDragging = true;
        }

        function handleSwipeEnd(e) {
            if (!isDragging || gameOver || isMoving || isTransitioning || guideActive) {
                isDragging = false;
                return;
            }
            isDragging = false;
            let endX, endY;
            if (e.changedTouches) {
                endX = e.changedTouches[0].clientX;
                endY = e.changedTouches[0].clientY;
            } else {
                endX = e.clientX;
                endY = e.clientY;
            }
            const dx = endX - touchStartX;
            const dy = endY - touchStartY;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
            let dir = '';
            if (Math.abs(dx) > Math.abs(dy)) {
                dir = dx > 0 ? 'right' : 'left';
            } else {
                dir = dy > 0 ? 'down' : 'up';
            }
            moveAll(dir);
        }

        function preventTouch(e) {
            if (e.cancelable) e.preventDefault();
        }

        // ========== 事件绑定 ==========
        function initEvents() {
            const container = gridContainer;
            container.addEventListener('touchstart', handleSwipeStart, { passive: false });
            container.addEventListener('touchend', handleSwipeEnd, { passive: false });
            container.addEventListener('touchcancel', () => { isDragging = false; }, { passive: false });
            container.addEventListener('mousedown', handleSwipeStart);
            container.addEventListener('mouseup', handleSwipeEnd);
            container.addEventListener('mouseleave', () => { isDragging = false; });
            container.addEventListener('contextmenu', e => e.preventDefault());

            if (startGameBtn) {
                startGameBtn.addEventListener('click', startGame);
            }
            if (openEditorBtn) {
                openEditorBtn.addEventListener('click', showEditorScene);
            }
            if (editorHomeBtn) {
                editorHomeBtn.addEventListener('click', showStartScreen);
            }
            if (editorPlayBtn) {
                editorPlayBtn.addEventListener('click', playEditorLevel);
            }
            if (editorResizeBtn) {
                editorResizeBtn.addEventListener('click', resizeEditorMapFromInputs);
            }
            if (editorSaveBtn) {
                editorSaveBtn.addEventListener('click', saveEditorLevel);
            }
            if (editorClearBtn) {
                editorClearBtn.addEventListener('click', clearEditorMap);
            }
            if (homeBtn) {
                homeBtn.addEventListener('click', goHome);
            }
            if (modalHomeBtn) {
                modalHomeBtn.addEventListener('click', handleModalHome);
            }
            if (modalNextBtn) {
                modalNextBtn.addEventListener('click', goNextLevel);
            }
            if (guideOverlay) {
                guideOverlay.addEventListener('click', advanceGuide);
            }
            window.addEventListener('resize', () => {
                if (guideActive && activeGuide) {
                    positionGuideSpotlight(activeGuide.highlight.row, activeGuide.highlight.col);
                }
            });
            document.getElementById('resetBtn').addEventListener('click', resetLevel);
            if (modalResetBtn) {
                modalResetBtn.addEventListener('click', handleModalReset);
            }
            if (undoStepBtn) {
                undoStepBtn.addEventListener('click', undoLastMove);
            }
            if (prevLevelBtn) {
                prevLevelBtn.addEventListener('click', async () => {
                    if (guideActive || isMoving || isTransitioning) return;
                    if (currentLevel > 0) {
                        await transitionToLevel(currentLevel - 1);
                    } else if (currentLevel === 0) {
                        messageDisplay.textContent = '已经是第一关';
                    }
                });
            }
            if (nextLevelBtn) {
                nextLevelBtn.addEventListener('click', async () => {
                    if (guideActive || isMoving || isTransitioning) return;
                    if (canSkipToNextLevel()) {
                        await transitionToLevel(currentLevel + 1);
                    } else if (currentLevel >= LEVEL_CONFIGS.length - 1) {
                        messageDisplay.textContent = '狼来了已经走到终章';
                    } else {
                        messageDisplay.textContent = '请先通关当前关卡，才能进入下一关';
                    }
                });
            }
        }

        async function bootGame() {
            loadLevelProgress();
            await Promise.all([loadLevelData(), loadGuideData()]);
            if (levelsReady) {
                currentLevel = Math.min(currentLevel, maxUnlockedLevel);
                loadLevel(currentLevel);
            }
            showStartScreen();
            syncEditorSizeInputs();
            renderEditorCategoryTabs();
            renderEditorPalette();
            initEvents();
            window.addEventListener('touchmove', preventTouch, { passive: false });
        }

        bootGame();
})();

