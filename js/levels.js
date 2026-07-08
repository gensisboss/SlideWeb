window.GameConfig = (() => {
    const SHEEP_IDS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const WOLF_IDS = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
    const OBSTACLE_IDS = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
    const TRAP_IDS = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49];
    const VILLAGE_IDS = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
    const MOVING_OBSTACLE_START_LEVEL = 61;

    const ID_TO_CHAR = {};
    SHEEP_IDS.forEach(id => ID_TO_CHAR[id] = '羊');
    WOLF_IDS.forEach(id => ID_TO_CHAR[id] = '狼');
    OBSTACLE_IDS.forEach(id => ID_TO_CHAR[id] = '障');
    TRAP_IDS.forEach(id => ID_TO_CHAR[id] = '陷');
    VILLAGE_IDS.forEach(id => ID_TO_CHAR[id] = '村');

    return {
        SHEEP_IDS,
        WOLF_IDS,
        OBSTACLE_IDS,
        TRAP_IDS,
        VILLAGE_IDS,
        MOVING_OBSTACLE_START_LEVEL,
        ID_TO_CHAR,
        LEVEL_CONFIGS: []
    };
})();
