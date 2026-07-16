const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { normalizeLevels } = require('../js/editor-core.js');

test('default level file contains ten playable level objects with goals', () => {
    const filePath = path.join(__dirname, '..', 'data', 'level.json');
    const levelData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const levels = normalizeLevels(levelData);

    assert.ok(Array.isArray(levelData.levels));
    assert.ok(levelData.levels.every(level => Array.isArray(level.map)));
    assert.equal(levels.length, 10);
    levels.forEach((level, index) => {
        const sheepCount = level.map.flat().filter(id => id >= 10 && id <= 19).length;

        assert.equal(typeof level.goal, 'number', `level ${index + 1} should have a numeric goal`);
        assert.ok(level.goal >= 1, `level ${index + 1} should require at least one escaped sheep`);
        assert.ok(level.goal <= sheepCount, `level ${index + 1} should not require more escaped sheep than it contains`);
        assert.ok(levelData.levels[index].hasOwnProperty('moveObstacle'), `level ${index + 1} should declare moveObstacle`);
        assert.ok([0, 1].includes(level.moveObstacle), `level ${index + 1} moveObstacle should be 0 or 1`);
        assert.equal(typeof levelData.levels[index].title, 'string', `level ${index + 1} should declare a title`);
        assert.ok(levelData.levels[index].title.trim().length > 0, `level ${index + 1} title should not be empty`);
        assert.equal(level.title, levelData.levels[index].title.trim(), `level ${index + 1} title should survive normalize`);
        assert.ok(Array.isArray(level.map), `level ${index + 1} should have a map`);
        assert.ok(level.map.length >= 1, `level ${index + 1} should have at least one row`);
        assert.ok(level.map.every(row => Array.isArray(row) && row.length === level.cols));
    });
});
