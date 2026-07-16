const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const gameSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'game.js'), 'utf8');

test('obstacle movement is controlled by the current level moveObstacle setting', () => {
    assert.match(gameSource, /moveObstacle/);
    assert.doesNotMatch(gameSource, /currentLevel \+ 1 >= MOVING_OBSTACLE_START_LEVEL/);
});
