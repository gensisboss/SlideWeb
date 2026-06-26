// ========== 角色ID映射 ==========
window.GameConfig = (() => {
    const SHEEP_IDS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const WOLF_IDS = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
    const OBSTACLE_IDS = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
    const TRAP_IDS = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49];
    const VILLAGE_IDS = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
    const MOVING_OBSTACLE_START_LEVEL = 61;

    const ID_TO_CHAR = {};
    SHEEP_IDS.forEach(id => ID_TO_CHAR[id] = '🐑');
    WOLF_IDS.forEach(id => ID_TO_CHAR[id] = '🐺');
    OBSTACLE_IDS.forEach(id => ID_TO_CHAR[id] = '🧱');
    TRAP_IDS.forEach(id => ID_TO_CHAR[id] = '🪤');
    VILLAGE_IDS.forEach(id => ID_TO_CHAR[id] = '🏡');

    function makeMap(rows, cols, entries) {
        const map = Array.from({ length: rows }, () => Array(cols).fill(0));
        entries.forEach(([row, col, id]) => {
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
                map[row][col] = id;
            }
        });
        return map;
    }

    function level(rows, cols, goal, entries, note = '') {
        return {
            rows,
            cols,
            goal,
            note,
            map: makeMap(rows, cols, entries)
        };
    }

    function directedLevel(index, options = {}) {
        const size = Math.min(10, 4 + Math.floor(index / 12));
        const rows = options.rows || size;
        const cols = options.cols || size;
        const direction = options.direction || ['right', 'up', 'left', 'down'][index % 4];
        const sheepCount = options.sheepCount || 1 + Math.floor(index / 24);
        const wolfCount = options.wolfCount || Math.max(0, Math.floor((index - 18) / 14));
        const obstacleCount = options.obstacleCount || Math.max(0, Math.floor((index - 10) / 9));
        const trapCount = options.trapCount || Math.max(0, Math.floor((index - 30) / 12));
        const entries = [];
        const used = new Set();
        const put = (row, col, id) => {
            const key = `${row},${col}`;
            if (row < 0 || row >= rows || col < 0 || col >= cols || used.has(key)) return false;
            used.add(key);
            entries.push([row, col, id]);
            return true;
        };

        const lanes = Array.from({ length: sheepCount }, (_, i) => {
            if (direction === 'left' || direction === 'right') {
                return Math.min(rows - 1, Math.max(0, 1 + i));
            }
            return Math.min(cols - 1, Math.max(0, 1 + i));
        });

        lanes.forEach((lane, i) => {
            const sheepId = SHEEP_IDS[i % SHEEP_IDS.length];
            const villageId = VILLAGE_IDS[i % VILLAGE_IDS.length];
            if (direction === 'right') {
                put(lane, Math.max(0, 1 - (i % 2)), sheepId);
                put(lane, cols - 1, villageId);
            } else if (direction === 'left') {
                put(lane, Math.min(cols - 1, cols - 2 + (i % 2)), sheepId);
                put(lane, 0, villageId);
            } else if (direction === 'up') {
                put(Math.min(rows - 1, rows - 2 + (i % 2)), lane, sheepId);
                put(0, lane, villageId);
            } else {
                put(Math.max(0, 1 - (i % 2)), lane, sheepId);
                put(rows - 1, lane, villageId);
            }
        });

        for (let i = 0; i < obstacleCount; i++) {
            const id = OBSTACLE_IDS[i % OBSTACLE_IDS.length];
            const row = (2 + i * 2) % rows;
            const col = (2 + i * 3) % cols;
            put(row, col, id) || put((row + 1) % rows, (col + 1) % cols, id);
        }

        for (let i = 0; i < trapCount; i++) {
            const id = TRAP_IDS[i % TRAP_IDS.length];
            const row = (rows - 1 - i * 2 + rows) % rows;
            const col = (cols - 1 - i * 3 + cols) % cols;
            put(row, col, id) || put((row + rows - 1) % rows, (col + 1) % cols, id);
        }

        for (let i = 0; i < wolfCount; i++) {
            const id = WOLF_IDS[i % WOLF_IDS.length];
            const row = (rows - 1 - i) % rows;
            const col = (i * 2) % cols;
            put(row, col, id) || put((row + rows - 1) % rows, (col + 2) % cols, id);
        }

        return level(rows, cols, Math.min(sheepCount, 1 + Math.floor(index / 30)), entries, options.note || '');
    }

    const tutorialLevels = [
        level(1, 5, 1, [[0, 0, 10], [0, 4, 50]], '一行教学：水平滑动移动羊'),
        level(4, 4, 1, [[3, 1, 10], [0, 1, 50]], '多行教学：垂直滑动也能移动'),
        level(4, 5, 1, [[2, 0, 10], [2, 4, 50]], '水平到村庄即可逃离'),
        level(5, 5, 1, [[4, 2, 10], [0, 2, 50]], '垂直到村庄即可逃离'),
        level(5, 5, 1, [[2, 0, 10], [2, 4, 50], [1, 2, 30]], '首次加入障碍：障碍会阻挡角色'),
        level(5, 5, 1, [[4, 2, 10], [0, 2, 50], [2, 3, 30]], '障碍只挡对应路线'),
        level(5, 6, 1, [[2, 0, 10], [2, 5, 50], [4, 0, 20]], '首次加入狼：靠近羊会吃羊'),
        level(6, 6, 1, [[4, 2, 10], [0, 2, 50], [5, 4, 20]], '狼也会随滑动移动'),
        level(6, 6, 1, [[2, 0, 10], [2, 5, 50], [0, 5, 40]], '首次加入陷阱：踩到陷阱会死亡'),
        level(6, 6, 1, [[5, 2, 10], [0, 2, 50], [2, 2, 40], [4, 5, 20]], '陷阱和狼同时出现'),
        level(6, 6, 2, [[2, 0, 10], [3, 0, 11], [2, 5, 50], [3, 5, 51]], '多个羊需要达到目标数量'),
        level(6, 6, 2, [[5, 2, 10], [5, 3, 11], [0, 2, 50], [0, 3, 51], [4, 0, 20]], '多个羊和狼一起移动')
    ];

    const generatedLevels = Array.from({ length: 88 }, (_, i) => {
        const levelNumber = i + 13;
        if (levelNumber <= 20) {
            return directedLevel(levelNumber, {
                rows: 6,
                cols: 6,
                direction: ['right', 'up', 'left', 'down'][levelNumber % 4],
                sheepCount: 1,
                wolfCount: Math.floor((levelNumber - 12) / 4),
                obstacleCount: 1,
                note: '基础组合：方向、障碍和狼'
            });
        }

        if (levelNumber <= 35) {
            return directedLevel(levelNumber, {
                rows: 7,
                cols: 7,
                direction: ['up', 'right', 'down', 'left'][levelNumber % 4],
                sheepCount: 1 + (levelNumber % 2),
                wolfCount: 1 + Math.floor((levelNumber - 20) / 6),
                obstacleCount: 2 + Math.floor((levelNumber - 20) / 7),
                trapCount: Math.floor((levelNumber - 20) / 5),
                note: '加入更多陷阱和阻挡'
            });
        }

        if (levelNumber <= 60) {
            return directedLevel(levelNumber, {
                rows: 8,
                cols: 8,
                direction: ['left', 'up', 'right', 'down'][levelNumber % 4],
                sheepCount: 2 + (levelNumber % 3 === 0 ? 1 : 0),
                wolfCount: 2 + Math.floor((levelNumber - 36) / 10),
                obstacleCount: 3 + Math.floor((levelNumber - 36) / 8),
                trapCount: 1 + Math.floor((levelNumber - 36) / 8),
                note: '中期关卡：多个羊、多个狼和陷阱'
            });
        }

        if (levelNumber <= 80) {
            return directedLevel(levelNumber, {
                rows: 9,
                cols: 9,
                direction: ['right', 'down', 'left', 'up'][levelNumber % 4],
                sheepCount: 2 + (levelNumber % 2),
                wolfCount: 3,
                obstacleCount: 4 + Math.floor((levelNumber - 61) / 6),
                trapCount: 2 + Math.floor((levelNumber - 61) / 8),
                note: '移动障碍阶段：障碍也会随滑动移动'
            });
        }

        return directedLevel(levelNumber, {
            rows: 10,
            cols: 10,
            direction: ['up', 'left', 'down', 'right'][levelNumber % 4],
            sheepCount: 3,
            wolfCount: 4,
            obstacleCount: 6 + Math.floor((levelNumber - 81) / 5),
            trapCount: 3 + Math.floor((levelNumber - 81) / 6),
            note: '后期综合关卡'
        });
    });

    const LEVEL_CONFIGS = [...tutorialLevels, ...generatedLevels];

    return {
        SHEEP_IDS,
        WOLF_IDS,
        OBSTACLE_IDS,
        TRAP_IDS,
        VILLAGE_IDS,
        MOVING_OBSTACLE_START_LEVEL,
        ID_TO_CHAR,
        LEVEL_CONFIGS
    };
})();
