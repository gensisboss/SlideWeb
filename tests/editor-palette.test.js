const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const gameSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'game.js'), 'utf8');

function readEditorToolGroups() {
    const declaration = 'const editorToolGroups = [';
    const start = gameSource.indexOf(declaration);
    assert.notEqual(start, -1, 'editorToolGroups definition should exist');

    const groups = [];
    let cursor = start + declaration.length;
    while (cursor < gameSource.length) {
        const keyMatch = /\{\s*key:/g;
        keyMatch.lastIndex = cursor;
        const found = keyMatch.exec(gameSource);
        if (!found) break;
        const keyIndex = found.index;

        let depth = 0;
        let end = keyIndex;
        for (; end < gameSource.length; end++) {
            if (gameSource[end] === '{') depth++;
            if (gameSource[end] === '}') depth--;
            if (depth === 0) {
                end++;
                break;
            }
        }

        const groupSource = gameSource.slice(keyIndex, end);
        const key = groupSource.match(/key:\s*'([^']+)'/)?.[1];
        const label = groupSource.match(/label:\s*'([^']+)'/)?.[1];
        const tools = [...groupSource.matchAll(/\{\s*label:\s*'([^']+)'\s*,\s*id:\s*([^,}\n]+)/g)].map(([, toolLabel, idExpression]) => ({
            label: toolLabel,
            idExpression: idExpression.trim()
        }));
        groups.push({ key, label, tools });
        cursor = end;
    }

    return groups;
}

test('editor palette groups generated sprite variants by category', () => {
    const groups = readEditorToolGroups();
    const byKey = Object.fromEntries(groups.map(group => [group.key, group]));

    assert.deepEqual(groups.map(group => group.key), ['erase', 'sheep', 'wolf', 'village', 'obstacle', 'trap']);
    assert.deepEqual(groups.map(group => group.label), ['擦除', '小羊', '狼', '羊村', '障碍', '陷阱']);
    assert.deepEqual(byKey.erase.tools.map(tool => tool.idExpression), ['0']);
    assert.deepEqual(byKey.sheep.tools.map(tool => tool.label), [
        '羊1', '羊2', '羊3', '羊4', '羊5'
    ]);
    assert.deepEqual(byKey.wolf.tools.map(tool => tool.label), [
        '狼1', '狼2', '狼3', '狼4', '狼5'
    ]);
    assert.deepEqual(byKey.village.tools.map(tool => tool.label), [
        '羊村1', '羊村2', '羊村3', '羊村4'
    ]);
    assert.deepEqual(byKey.obstacle.tools.map(tool => tool.label), [
        '障碍1', '障碍2', '障碍3', '障碍4'
    ]);
    assert.deepEqual(byKey.trap.tools.map(tool => tool.label), [
        '陷阱1', '陷阱2', '陷阱3', '陷阱4'
    ]);
});
