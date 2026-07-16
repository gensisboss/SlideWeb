(function(root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.LevelEditorCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
    function createEmptyMap(rows = 6, cols = 6) {
        return Array.from({ length: rows }, () => Array(cols).fill(0));
    }

    function cloneMap(map) {
        return map.map(row => [...row]);
    }

    function normalizeMoveObstacle(value) {
        return Number(value) === 1 ? 1 : 0;
    }

    function resizeMap(map, rows, cols) {
        const next = createEmptyMap(rows, cols);
        for (let row = 0; row < Math.min(rows, map.length); row++) {
            for (let col = 0; col < Math.min(cols, map[row].length); col++) {
                next[row][col] = map[row][col];
            }
        }
        return next;
    }

    function placeTile(map, row, col, id) {
        const next = cloneMap(map);
        if (row >= 0 && row < next.length && col >= 0 && col < next[0].length) {
            next[row][col] = id;
        }
        return next;
    }

    function buildLevelFromMap(map, goal = 1, moveObstacle = 0) {
        const rows = map.length;
        const cols = rows > 0 ? map[0].length : 0;
        return {
            rows,
            cols,
            goal: Math.max(1, Number(goal) || 1),
            moveObstacle: normalizeMoveObstacle(moveObstacle),
            note: '自定义关卡',
            map: cloneMap(map)
        };
    }

    function countSheepInMap(map) {
        return map.flat().filter(id => id >= 10 && id <= 19).length;
    }

    function isMap(value) {
        return Array.isArray(value) && value.every(row => Array.isArray(row));
    }

    function normalizeLevels(source) {
        const sourceLevels = source && Array.isArray(source.levels) ? source.levels : source;
        if (!Array.isArray(sourceLevels)) return [];
        return sourceLevels
            .map(item => {
                if (isMap(item)) {
                    return buildLevelFromMap(item, countSheepInMap(item));
                }
                if (item && isMap(item.map)) {
                    return buildLevelFromMap(item.map, item.goal || countSheepInMap(item.map), item.moveObstacle);
                }
                return null;
            })
            .filter(Boolean);
    }

    function exportLevelJson(level) {
        return JSON.stringify({
            goal: Math.max(1, Number(level?.goal) || 1),
            moveObstacle: normalizeMoveObstacle(level?.moveObstacle),
            map: isMap(level?.map) ? cloneMap(level.map) : createEmptyMap()
        }, null, 2);
    }

    return {
        createEmptyMap,
        resizeMap,
        placeTile,
        buildLevelFromMap,
        normalizeLevels,
        exportLevelJson
    };
});
