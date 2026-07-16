const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const gameSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'game.js'), 'utf8');

test('turn animation matches moved entities by unique entity identity instead of tile id', () => {
    assert.match(gameSource, /entityKey/);
    assert.doesNotMatch(gameSource, /movedEntities\.map\(e => \[e\.id,\s*e\]\)/);
});
