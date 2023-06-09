import m from './ui-base.js';
class LevelSelector {
    view(vnode) {
        return [
            m('label', { for: 'level' }, 'Level'),
            m('select', {
                id: 'level',
                onchange: (e) => vnode.attrs.onLevelChanged(parseInt(e.target.value))
            }, m('option', { selected: vnode.attrs.selectedLevel === null, hidden: true, disabled: true }, 'Select'), m('option', { selected: vnode.attrs.selectedLevel === 0, value: 0 }, 'Custom'), ...Array(vnode.attrs.nLevels).fill(0).map((_, l) => m('option', { selected: vnode.attrs.selectedLevel === l + 1, value: l + 1 }, `${l + 1}`)))
        ];
    }
}
class BoardSizeEditor {
    view(vnode) {
        const sizes = [3, 4, 5, 6];
        const stones = [2, 3, 4, 5];
        return [
            m('h4', 'Board size'),
            m('label', { for: 'xsize' }, 'sizeX'), m('select', { id: 'xsize', onchange: (e) => vnode.attrs.onSizeChanged(Object.assign({ ...vnode.attrs.boardSize }, { xsize: parseInt(e.target.value) })) }, [m('option', { selected: vnode.attrs.boardSize.xsize === null, disabled: true, hidden: true }, 'Select'), ...sizes.map(s => m('option', { value: s, selected: vnode.attrs.boardSize.xsize === s }, `${s}`))]),
            m('label', { for: 'ysize' }, 'sizeY'), m('select', { id: 'ysize', onchange: (e) => vnode.attrs.onSizeChanged(Object.assign({ ...vnode.attrs.boardSize }, { ysize: parseInt(e.target.value) })) }, [m('option', { selected: vnode.attrs.boardSize.ysize === null, disabled: true, hidden: true }, 'Select'), ...sizes.map(s => m('option', { value: s, selected: vnode.attrs.boardSize.ysize === s }, `${s}`))]),
            m('label', { for: 'stones' }, 'stones'), m('select', { id: 'stones', onchange: (e) => vnode.attrs.onSizeChanged(Object.assign({ ...vnode.attrs.boardSize }, { stoneCount: parseInt(e.target.value) })) }, [m('option', { selected: vnode.attrs.boardSize.stoneCount === null, disabled: true, hidden: true }, 'Select'), ...stones.map(s => m('option', { value: s, selected: vnode.attrs.boardSize.stoneCount === s }, `${s}`))])
        ];
    }
}
class BoardEditor {
    selectedItem = null;
    view(vnode) {
        return [
            m('h4', 'Board setup'),
            m('table', [...Array(vnode.attrs.boardSize.ysize).keys()].map(j => m('tr', [...Array(vnode.attrs.boardSize.xsize).keys()].map(i => {
                const index = j * vnode.attrs.boardSize.xsize + i;
                const isObstacle = vnode.attrs.boardState.obstacles.includes(index);
                const stoneIndex = vnode.attrs.boardState.stones.indexOf(index);
                const targetIndex = vnode.attrs.boardState.targets.indexOf(index);
                const isLive = this.selectedItem && !isObstacle && ((this.selectedItem.obstacle && stoneIndex < 0 && targetIndex < 0) ||
                    (this.selectedItem.stoneIndex !== null && stoneIndex < 0) ||
                    (this.selectedItem.targetIndex !== null && targetIndex < 0));
                let symbol = '';
                if (isObstacle)
                    symbol = '⬛';
                else {
                    symbol = stoneIndex >= 0 ? `&#${9312 + stoneIndex};` : symbol;
                    symbol = targetIndex >= 0 ? `${symbol}&#${9461 + targetIndex};` : symbol;
                }
                return m('td', {
                    class: isLive ? 'live' : '',
                    onclick: () => {
                        if (isLive) {
                            let newstate = JSON.parse(JSON.stringify(vnode.attrs.boardState));
                            let changed = false;
                            if (this.selectedItem.obstacle) {
                                if (!vnode.attrs.boardState.obstacles.includes(index) && !vnode.attrs.boardState.stones.includes(index) && !vnode.attrs.boardState.targets.includes(index)) {
                                    newstate.obstacles.push(index);
                                    changed = true;
                                }
                            }
                            else if (this.selectedItem.stoneIndex !== null) {
                                if (!vnode.attrs.boardState.obstacles.includes(index) && !vnode.attrs.boardState.stones.includes(index)) {
                                    newstate.stones[this.selectedItem.stoneIndex] = index;
                                    changed = true;
                                }
                            }
                            else if (this.selectedItem.targetIndex !== null) {
                                if (!vnode.attrs.boardState.obstacles.includes(index) && !vnode.attrs.boardState.targets.includes(index)) {
                                    newstate.targets[this.selectedItem.targetIndex] = index;
                                    changed = true;
                                }
                            }
                            if (changed) {
                                vnode.attrs.onStateChanged(newstate);
                                this.selectedItem = null;
                            }
                        }
                    }
                }, m.trust(symbol));
            })))),
            m('table#items', m('tr', [
                m('td', {
                    className: this.selectedItem?.obstacle ? 'selected' : '',
                    onclick: () => { this.selectedItem = { obstacle: true, stoneIndex: null, targetIndex: null }; }
                }, '⬛'),
                ...vnode.attrs.boardState.stones.map((s, n) => s === null ? m('td', {
                    className: this.selectedItem?.stoneIndex === n ? 'selected' : '',
                    onclick: () => { this.selectedItem = { obstacle: false, stoneIndex: n, targetIndex: null }; }
                }, m.trust(`&#${9312 + n};`)) : null),
                ...vnode.attrs.boardState.targets.map((t, n) => t === null ? m('td', {
                    className: this.selectedItem?.targetIndex === n ? 'selected' : '',
                    onclick: () => { this.selectedItem = { obstacle: false, stoneIndex: null, targetIndex: n }; }
                }, m.trust(`&#${9461 + n};`)) : null)
            ])),
            m('p#legend', [
                'legend: ',
                m('span', '⬛'), ' wall | ',
                m('span', m.trust('&#9312')), ' stone | ',
                m('span', m.trust('&#9461')), ' target'
            ])
        ];
    }
}
class SolutionPlayer {
    view(vnode) {
        return [
            m('h4', 'Solution'),
            m('table', [...Array(vnode.attrs.boardSize.ysize).keys()].map(j => m('tr', [...Array(vnode.attrs.boardSize.xsize).keys()].map(i => {
                const index = j * vnode.attrs.boardSize.xsize + i;
                let isObstacle = vnode.attrs.obstacles.includes(index);
                let stoneIndex = vnode.attrs.solution.steps[vnode.attrs.currentStep].indexOf(index);
                return m('td', m.trust(isObstacle ? '⬛' : (stoneIndex >= 0 ? `&#${9312 + stoneIndex};` : '')));
            })))),
            m('h4', `Step ${vnode.attrs.currentStep} of ${vnode.attrs.solution.steps.length - 1}`),
            m('p', [
                m('button', { disabled: vnode.attrs.currentStep === 0, onclick: vnode.attrs.onPrevStep }, 'Prev'),
                m('button', { disabled: vnode.attrs.currentStep === vnode.attrs.solution.steps.length - 1, onclick: vnode.attrs.onNextStep }, 'Next')
            ])
        ];
    }
}
//-----------------------------------------------------------------------------
export class App {
    boardSize = { xsize: null, ysize: null, stoneCount: null };
    boardState = { stones: [], targets: [], obstacles: [] };
    showBoardEditor = false;
    showRunButton = false;
    showOverlay = false;
    solution = null;
    currentStep = 0;
    stateHistory = [];
    levels = [];
    selectedLevel = null;
    kworker = new Worker('js/kubobleWorker.js');
    onLevelChanged = (level) => {
        this.selectedLevel = level;
        if (this.selectedLevel > 0) {
            this.onSizeChanged({
                xsize: this.levels[this.selectedLevel - 1].x,
                ysize: this.levels[this.selectedLevel - 1].y,
                stoneCount: this.levels[this.selectedLevel - 1].n
            });
            this.onStateChanged({
                stones: this.levels[this.selectedLevel - 1].s,
                targets: this.levels[this.selectedLevel - 1].t,
                obstacles: this.levels[this.selectedLevel - 1].o,
            });
            this.stateHistory = [];
            this.solve();
        }
        else {
            this.onSizeChanged({ xsize: null, ysize: null, stoneCount: null });
            this.onStateChanged({ stones: [], targets: [], obstacles: [] });
            this.stateHistory = [];
        }
    };
    onSizeChanged = (boardSize) => {
        this.boardSize = boardSize;
        this.boardState = {
            stones: new Array(this.boardSize.stoneCount).fill(null),
            targets: new Array(this.boardSize.stoneCount).fill(null),
            obstacles: []
        };
        this.showBoardEditor = !!this.boardSize.xsize && !!this.boardSize.ysize && !!this.boardSize.stoneCount;
        this.showRunButton = false;
        this.solution = null;
        this.currentStep = 0;
        this.stateHistory = [];
    };
    onStateChanged = (boardState) => {
        this.stateHistory.unshift(JSON.parse(JSON.stringify(this.boardState)));
        this.boardState = boardState;
        this.showRunButton = this.boardState.stones.length > 0 && this.boardState.targets.length > 0 && !this.boardState.stones.includes(null) && !this.boardState.targets.includes(null);
        this.solution = null;
        this.currentStep = 0;
    };
    onUndo = () => {
        this.boardState = this.stateHistory.shift();
        this.showRunButton = this.boardState.stones.length > 0 && this.boardState.targets.length > 0 && !this.boardState.stones.includes(null) && !this.boardState.targets.includes(null);
        this.solution = null;
        this.currentStep = 0;
    };
    solve = () => {
        let params = {
            xsize: this.boardSize.xsize,
            ysize: this.boardSize.ysize,
            startPosition: this.boardState.stones,
            endPosition: this.boardState.targets,
            obstacles: this.boardState.obstacles
        };
        this.kworker.postMessage(params);
        this.showOverlay = true;
    };
    constructor() {
        fetch('levels.json').then(res => res.json().then(levels => {
            this.levels = levels;
            console.log(this.levels);
            m.redraw();
        }));
        this.kworker.onmessage = (event) => {
            this.showOverlay = false;
            if (event.data.length)
                this.solution = { steps: event.data };
            else
                alert('No solution');
            m.redraw();
        };
        m.route(document.body, '/', {
            '/': {
                render: () => [
                    m('h3#title', 'KubobleSolverJS'),
                    m('p#desc', ['A solver for ', m('a', { href: 'https://kuboble.com/', target: '_blank' }, 'https://kuboble.com/')]),
                    m(LevelSelector, {
                        nLevels: this.levels.length,
                        selectedLevel: this.selectedLevel,
                        onLevelChanged: this.onLevelChanged
                    }),
                    this.solution ? m(SolutionPlayer, { boardSize: this.boardSize, obstacles: this.boardState.obstacles, solution: this.solution, currentStep: this.currentStep, onNextStep: () => this.currentStep++, onPrevStep: () => this.currentStep-- }) : this.selectedLevel === 0 ? [
                        m(BoardSizeEditor, { boardSize: this.boardSize, onSizeChanged: this.onSizeChanged }),
                        this.showBoardEditor ? m(BoardEditor, { boardSize: this.boardSize, boardState: this.boardState, onStateChanged: this.onStateChanged }) : null
                    ] : null,
                    this.selectedLevel === 0 && this.showBoardEditor && this.stateHistory.length > 0 ? [
                        m('button#reset', { onclick: () => { this.onSizeChanged(this.boardSize); } }, 'Reset'),
                        m('button#undo', { onclick: this.onUndo }, 'Undo'),
                    ] : null,
                    this.selectedLevel === 0 && this.solution === null && this.showRunButton ? m('button#run', { onclick: this.solve }, 'Solve') : null,
                    this.showOverlay ? m('div#overlay', m('div', 'Solving...')) : null,
                    m('p#footer', 'by dvt - 2023')
                ]
            }
        });
    }
}
