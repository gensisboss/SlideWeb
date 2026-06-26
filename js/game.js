(function() {
    const {
        SHEEP_IDS,
        WOLF_IDS,
        OBSTACLE_IDS,
        TRAP_IDS,
        VILLAGE_IDS,
        ID_TO_CHAR,
        LEVEL_CONFIGS,
        MOVING_OBSTACLE_START_LEVEL
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
        let turnState = TURN_STATE.IDLE;

        const gridContainer = document.getElementById('gridContainer');
        const levelDisplay = document.getElementById('levelDisplay');
        const sheepCountSpan = document.getElementById('sheepCount');
        const wolfCountSpan = document.getElementById('wolfCount');
        const goalDisplay = document.getElementById('goalDisplay');
        const messageDisplay = document.getElementById('messageDisplay');
        const gameModal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalResetBtn = document.getElementById('modalResetBtn');

        const DIR = {
            'up': [-1, 0],
            'down': [1, 0],
            'left': [0, -1],
            'right': [0, 1]
        };

        // ========== 工具函数 ==========
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
            return currentLevel + 1 >= MOVING_OBSTACLE_START_LEVEL;
        }

        function showGameModal(title, message) {
            if (!gameModal) return;
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            gameModal.classList.remove('hidden');
        }

        function hideGameModal() {
            if (!gameModal) return;
            gameModal.classList.add('hidden');
        }

        function wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
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
                const newPos = turnContext.movedById.get(oldEntity.id);
                if (!newPos) return;

                const stillExists = turnContext.result[this.type].some(e => e.id === oldEntity.id);
                if (stillExists) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 350, { removeOnComplete: false })
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
                const newPos = turnContext.movedById.get(oldEntity.id);
                if (!newPos) return;

                const result = turnContext.result;
                const isEscaped = result.escaped.some(e => e.id === oldEntity.id);
                const isEaten = result.eaten.some(e => e.id === oldEntity.id);
                const isTrapped = result.trapSheep.some(e => e.id === oldEntity.id);
                const stillExists = result.sheep.some(e => e.id === oldEntity.id);

                if (isEscaped) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300)
                            .then(() => createEffectEntity(this.emoji, newPos.row, newPos.col, 'escape'))
                    );
                } else if (isEaten) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300, { removeOnComplete: false })
                            .then(el => floatingEntities.push(el))
                    );
                } else if (isTrapped) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300)
                            .then(() => createEffectEntity(this.emoji, newPos.row, newPos.col, 'trap-hit'))
                    );
                } else if (stillExists) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 350, { removeOnComplete: false })
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
                        wolfId: wolf.id,
                        fromRow: wolf.row,
                        fromCol: wolf.col,
                        toRow: target.row,
                        toCol: target.col,
                        targetId: target.id
                    });
                    wolf.row = target.row;
                    wolf.col = target.col;
                }

                const eatenIds = new Set(result.eaten.map(s => s.id));
                result.sheep = result.sheep.filter(s => !eatenIds.has(s.id));
            }

            queueAnimation(oldEntity, turnContext, animations, floatingEntities) {
                const newPos = turnContext.movedById.get(oldEntity.id);
                if (!newPos) return;

                const result = turnContext.result;
                const isTrapped = result.trapWolf.some(e => e.id === oldEntity.id);
                const stillExists = result.wolf.some(e => e.id === oldEntity.id);
                const attack = result.wolfAttacks.find(a => a.wolfId === oldEntity.id);

                if (isTrapped) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300)
                            .then(() => createEffectEntity(this.emoji, newPos.row, newPos.col, 'trap-hit'))
                    );
                } else if (stillExists && attack) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 300)
                            .then(() => animateEntity(attack.fromRow, attack.fromCol, attack.toRow, attack.toCol, this.emoji, 180, { removeOnComplete: false }))
                            .then(el => {
                                floatingEntities.push(el);
                                return createEffectEntity('🐑', attack.toRow, attack.toCol, 'eaten');
                            })
                    );
                } else if (stillExists) {
                    animations.push(
                        animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 350, { removeOnComplete: false })
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
                const newPos = turnContext.movedById.get(oldEntity.id);
                if (!newPos) return;

                animations.push(
                    animateEntity(oldEntity.row, oldEntity.col, newPos.row, newPos.col, this.emoji, 350, { removeOnComplete: false })
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

            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const id = grid[r][c];
                    if (SHEEP_IDS.includes(id)) {
                        sheepEntities.push({ id, row: r, col: c, type: ROLE_TYPE.SHEEP });
                    } else if (WOLF_IDS.includes(id)) {
                        wolfEntities.push({ id, row: r, col: c, type: ROLE_TYPE.WOLF });
                    } else if (VILLAGE_IDS.includes(id)) {
                        villageEntities.push({ id, row: r, col: c });
                    } else if (OBSTACLE_IDS.includes(id)) {
                        obstacleEntities.push({ id, row: r, col: c, type: ROLE_TYPE.OBSTACLE });
                    } else if (TRAP_IDS.includes(id)) {
                        trapEntities.push({ id, row: r, col: c });
                    }
                }
            }
            
            sheepCount = sheepEntities.length;
            wolfCount = wolfEntities.length;
            updateUI();
            renderGrid();
            messageDisplay.textContent = '🐑 滑动屏幕移动角色';
            levelDisplay.textContent = `第 ${index + 1} 关`;
        }

        // ========== 渲染网格 ==========
        function renderGrid() {
            gridContainer.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
            gridContainer.innerHTML = '';
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    const id = grid[r][c];
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
            const { removeOnComplete = true } = options;
            return new Promise((resolve) => {
                const startPos = getCellPixelPosition(fromRow, fromCol);
                const endPos = getCellPixelPosition(toRow, toCol);
                
                const el = document.createElement('div');
                el.className = 'floating-entity';
                el.textContent = emoji;
                el.style.left = (startPos.left - 15) + 'px';
                el.style.top = (startPos.top - 15) + 'px';
                el.style.fontSize = getComputedStyle(document.querySelector('.cell .emoji')).fontSize;
                gridContainer.appendChild(el);

                const startTime = performance.now();
                
                function animate(time) {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    
                    const currentX = startPos.left + (endPos.left - startPos.left) * eased;
                    const currentY = startPos.top + (endPos.top - startPos.top) * eased;
                    
                    el.style.left = (currentX - 15) + 'px';
                    el.style.top = (currentY - 15) + 'px';
                    
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

        function createEffectEntity(emoji, row, col, className) {
            return new Promise((resolve) => {
                const pos = getCellPixelPosition(row, col);
                const el = document.createElement('div');
                el.className = `floating-entity ${className}`;
                el.textContent = emoji;
                el.style.left = (pos.left - 15) + 'px';
                el.style.top = (pos.top - 15) + 'px';
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
            const movingObstacleIds = new Set(
                isMovingObstacleLevel() ? obstacleEntities.map(e => e.id) : []
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
                    if (!movingObstacleIds.has(obstacle.id)) return { ...obstacle };
                    const movedObstacle = sorted.find(e => e.id === obstacle.id);
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
            // 从实体状态重建棋盘，避免被移除的陷阱等旧格子残留。
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
                context.movedById = new Map(context.movedEntities.map(e => [e.id, e]));
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
                    messageDisplay.textContent = '🎉 胜利！小羊们成功逃跑！';

                    if (currentLevel < LEVEL_CONFIGS.length - 1) {
                        await wait(700);
                        currentLevel++;
                        loadLevel(currentLevel);
                    } else {
                        showGameModal('全部通关', '恭喜完成所有关卡，点击重玩回到当前关。');
                    }
                } else if (status === 'lose') {
                    gameOver = true;
                    messageDisplay.textContent = '😱 没有小羊可以继续逃跑了... 失败';
                    showGameModal('游戏结束', '没有小羊可以继续逃跑了，点击重玩再试一次。');
                } else {
                    messageDisplay.textContent = `➡️ 向${context.direction}移动`;
                }

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
        }

        // ========== 移动逻辑 ==========
        async function moveAll(direction) {
            if (gameOver || isMoving) return;
            await runTurnStateMachine(createTurnContext(direction));
        }

        // ========== 重置关卡 ==========
        function resetLevel() {
            if (isMoving) return;
            loadLevel(currentLevel);
        }

        // ========== 滑动控制 ==========
        let touchStartX = 0, touchStartY = 0;
        let isDragging = false;

        function handleSwipeStart(e) {
            if (gameOver || isMoving) return;
            const t = e.touches ? e.touches[0] : e;
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            isDragging = true;
        }

        function handleSwipeEnd(e) {
            if (!isDragging || gameOver || isMoving) {
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

            document.getElementById('resetBtn').addEventListener('click', resetLevel);
            if (modalResetBtn) {
                modalResetBtn.addEventListener('click', resetLevel);
            }
            document.getElementById('prevLevelBtn').addEventListener('click', () => {
                if (currentLevel > 0 && !isMoving) {
                    currentLevel--;
                    loadLevel(currentLevel);
                } else if (currentLevel === 0) {
                    messageDisplay.textContent = '已经是第一关';
                }
            });
            document.getElementById('nextLevelBtn').addEventListener('click', () => {
                if (currentLevel < LEVEL_CONFIGS.length - 1 && !isMoving) {
                    currentLevel++;
                    loadLevel(currentLevel);
                } else if (currentLevel === LEVEL_CONFIGS.length - 1) {
                    messageDisplay.textContent = '恭喜通关所有关卡！';
                }
            });
        }

        // ========== 启动游戏 ==========
        loadLevel(0);
        initEvents();
        window.addEventListener('touchmove', preventTouch, { passive: false });
})();

