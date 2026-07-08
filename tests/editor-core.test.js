const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createEmptyMap,
    resizeMap,
    placeTile,
    buildLevelFromMap,
    normalizeLevelMaps,
    planLevelMapSave,
    applyLevelMapSave,
    exportLevelMapsJson
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

    assert.deepEqual(buildLevelFromMap(edited, 1), {
        rows: 2,
        cols: 3,
        goal: 1,
        note: '自定义关卡',
        map: [
            [10, 0, 50],
            [0, 0, 0]
        ]
    });
});

test('plans an overwrite when the requested level map already exists in the JSON file', () => {
    const existing = [[10, 50]];
    const maps = [existing];

    assert.deepEqual(planLevelMapSave(maps, 1), {
        action: 'overwrite',
        targetLevelNumber: 1,
        requiresConfirmation: true,
        existingMap: existing
    });
});

test('plans an append after the current JSON maximum when requested level is missing', () => {
    const maps = [
        [[10, 50]],
        [[11, 51]],
        [[12, 52]]
    ];

    assert.deepEqual(planLevelMapSave(maps, 10), {
        action: 'append',
        targetLevelNumber: 4,
        requiresConfirmation: false,
        existingMap: null
    });
});

test('applies map saves without mutating the previous map list', () => {
    const first = [[10, 50]];
    const next = [[11, 0, 51]];
    const maps = [first];
    const updated = applyLevelMapSave(maps, 2, next);

    assert.deepEqual(maps, [first]);
    assert.deepEqual(updated, [first, next]);
});

test('normalizes level map arrays and exports the JSON file as raw 2d arrays', () => {
    const maps = normalizeLevelMaps([
        [[10, 50]],
        { map: [[11, 51]] }
    ]);

    assert.deepEqual(maps, [
        [[10, 50]],
        [[11, 51]]
    ]);
    assert.equal(exportLevelMapsJson(maps), JSON.stringify([
        [[10, 50]],
        [[11, 51]]
    ], null, 2));
});
