const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createEmptyMap,
    resizeMap,
    placeTile,
    buildLevelFromMap,
    normalizeLevels,
    exportLevelJson
} = require('../js/editor-core.js');

test('creates an empty map with the requested dimensions', () => {
    assert.deepEqual(createEmptyMap(2, 3), [
        [0, 0, 0],
        [0, 0, 0]
    ]);
});

test('places a selected entity without mutating the original map', () => {
    const original = createEmptyMap(2, 2);
    const edited = placeTile(original, 1, 0, 20);

    assert.deepEqual(original, [
        [0, 0],
        [0, 0]
    ]);
    assert.deepEqual(edited, [
        [0, 0],
        [20, 0]
    ]);
});

test('resizes a map while keeping tiles still inside the new bounds', () => {
    const original = [
        [10, 0, 50],
        [0, 20, 0]
    ];

    assert.deepEqual(resizeMap(original, 3, 2), [
        [10, 0],
        [0, 20],
        [0, 0]
    ]);
    assert.deepEqual(original, [
        [10, 0, 50],
        [0, 20, 0]
    ]);
});

test('builds a playable level from the editor map', () => {
    const map = createEmptyMap(2, 3);
    const edited = placeTile(placeTile(map, 0, 0, 10), 0, 2, 50);
    const level = buildLevelFromMap(edited, 1);

    assert.equal(level.rows, 2);
    assert.equal(level.cols, 3);
    assert.equal(level.goal, 1);
    assert.equal(level.moveObstacle, 0);
    assert.deepEqual(level.map, [
        [10, 0, 50],
        [0, 0, 0]
    ]);
});

test('normalizes level objects with explicit goals and obstacle movement settings', () => {
    const levels = normalizeLevels({
        levels: [
            { title: '双羊借位', goal: 2, moveObstacle: 1, map: [[10, 50], [11, 0]] },
            { goal: 1, rows: 1, cols: 2, map: [[12, 52]] }
        ]
    });

    assert.deepEqual(levels.map(level => ({
        title: level.title,
        rows: level.rows,
        cols: level.cols,
        goal: level.goal,
        moveObstacle: level.moveObstacle,
        map: level.map
    })), [
        {
            title: '双羊借位',
            rows: 2,
            cols: 2,
            goal: 2,
            moveObstacle: 1,
            map: [[10, 50], [11, 0]]
        },
        {
            title: undefined,
            rows: 1,
            cols: 2,
            goal: 1,
            moveObstacle: 0,
            map: [[12, 52]]
        }
    ]);
});

test('keeps old raw map arrays readable by deriving safe defaults', () => {
    const levels = normalizeLevels([
        [[10, 50], [11, 0]],
        { map: [[12, 52]] }
    ]);

    assert.deepEqual(levels.map(level => level.goal), [2, 1]);
    assert.deepEqual(levels.map(level => level.moveObstacle), [0, 0]);
    assert.deepEqual(levels.map(level => level.map), [
        [[10, 50], [11, 0]],
        [[12, 52]]
    ]);
});

test('exports one editable level object for clipboard saves', () => {
    const level = buildLevelFromMap([[10, 50], [11, 0]], 2, 1, '木箱开路');

    assert.equal(exportLevelJson(level), JSON.stringify({
        title: '木箱开路',
        goal: 2,
        moveObstacle: 1,
        map: [[10, 50], [11, 0]]
    }, null, 2));
});
