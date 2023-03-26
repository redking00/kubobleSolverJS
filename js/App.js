import m from './ui-base.js';
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
                let symbol = '';
                if (isObstacle)
                    symbol = '⬛';
                else {
                    symbol = stoneIndex >= 0 ? `&#${9312 + stoneIndex};` : symbol;
                    symbol = targetIndex >= 0 ? `${symbol}&#${9461 + targetIndex};` : symbol;
                }
                return m('td', {
                    onclick: () => {
                        if (this.selectedItem) {
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
    currentStep = 0;
    view(vnode) {
        return [
            m('h4', 'Solution'),
            m('table', [...Array(vnode.attrs.boardSize.ysize).keys()].map(j => m('tr', [...Array(vnode.attrs.boardSize.xsize).keys()].map(i => {
                const index = j * vnode.attrs.boardSize.xsize + i;
                let isObstacle = vnode.attrs.obstacles.includes(index);
                let stoneIndex = vnode.attrs.solution.steps[this.currentStep].indexOf(index);
                return m('td', m.trust(isObstacle ? '⬛' : (stoneIndex >= 0 ? `&#${9312 + stoneIndex};` : '')));
            })))),
            m('h4', `Step ${this.currentStep} of ${vnode.attrs.solution.steps.length - 1}`),
            m('button', { disabled: this.currentStep === 0, onclick: () => { this.currentStep--; } }, 'Prev'),
            m('button', { disabled: this.currentStep === vnode.attrs.solution.steps.length - 1, onclick: () => { this.currentStep++; } }, 'Next')
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
    kworker = new Worker('js/kubobleWorker.js');
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
    };
    onStateChanged = (boardState) => {
        this.boardState = boardState;
        this.showRunButton = !this.boardState.stones.includes(null) && !this.boardState.targets.includes(null);
        this.solution = null;
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
                    this.solution ? m(SolutionPlayer, { boardSize: this.boardSize, obstacles: this.boardState.obstacles, solution: this.solution }) : [
                        m(BoardSizeEditor, { boardSize: this.boardSize, onSizeChanged: this.onSizeChanged }),
                        this.showBoardEditor ? m(BoardEditor, { boardSize: this.boardSize, boardState: this.boardState, onStateChanged: this.onStateChanged }) : null,
                        this.showRunButton ? m('button#run', { onclick: this.solve }, 'Solve') : null
                    ],
                    this.showBoardEditor ? m('button#reset', { onclick: () => { this.onSizeChanged(this.boardSize); } }, 'Reset') : null,
                    this.showOverlay ? m('div#overlay', m('div', 'Solving...')) : null,
                    m('p#footer', 'by dvt - 2023')
                ]
            }
        });
    }
}
