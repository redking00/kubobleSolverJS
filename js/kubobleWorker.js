"use strict";
onmessage = (event) => {
    console.log(event.data);
    console.log('----');
    postMessage(kubobleResolver(event.data.xsize, event.data.ysize, event.data.obstacles, event.data.startPosition, event.data.endPosition));
};
function kubobleResolver(xsize, ysize, obstacles, startPosition, endPosition) {
    function createMailBox() {
        let xcords = new Array(xsize).fill(0).map((_, x) => x);
        let ycords = new Array(ysize).fill(0).map((_, y) => y);
        let mailBox = [];
        ycords.forEach((_, j) => {
            xcords.forEach((_, i) => {
                let up = ycords.slice(0, j).reverse().map(y => y * xsize + i);
                let down = ycords.slice(j + 1).map(y => y * xsize + i);
                let left = xcords.slice(0, i).reverse().map(x => j * xsize + x);
                let right = xcords.slice(i + 1).map(x => j * xsize + x);
                mailBox.push([up, right, down, left]);
            });
        });
        return mailBox;
    }
    function nodeIndexFromPosition(position) {
        const p = [...position].reverse();
        return p.reduce((p, c, n) => p + c * total ** n);
    }
    function positionFromNodeIndex(index) {
        let position = new Array(startPosition.length);
        for (let n = startPosition.length - 1; n >= 0; --n) {
            let p = (index % total);
            position[n] = p;
            index = (index - p) / total;
        }
        return position;
    }
    function genNewPositions(currentPosition) {
        let newPositions = [];
        currentPosition.forEach((piecePosition, n) => {
            mailBox[piecePosition].forEach((direction) => {
                let newPiecePosition = [...direction].reduce((p, c, _, arr) => {
                    if (currentPosition.includes(c) || obstacles.includes(c)) {
                        arr.splice(1);
                        return p;
                    }
                    return c;
                }, -1);
                if (newPiecePosition >= 0) {
                    let newPosition = [...currentPosition];
                    newPosition[n] = newPiecePosition;
                    newPositions.push(newPosition);
                }
            });
        });
        return newPositions;
    }
    function genGraph() {
        let currentPosition = nextNodes.shift();
        let currentIndex = nodeIndexFromPosition(currentPosition);
        graph[currentIndex] ||= { v: false };
        if (graph[currentIndex].v)
            return;
        graph[currentIndex].v = true;
        let newPositions = genNewPositions(currentPosition);
        newPositions.forEach((position, _, arr) => {
            let index = nodeIndexFromPosition(position);
            graph[index] ||= { f: currentIndex };
            graph[index].f ||= currentIndex;
            if (index === endIndex) {
                arr.length = 0;
                nextNodes.length = 0;
            }
            else
                nextNodes.push(position);
        });
    }
    const total = xsize * ysize;
    const mailBox = createMailBox();
    const startIndex = nodeIndexFromPosition(startPosition);
    const endIndex = nodeIndexFromPosition(endPosition);
    let nextNodes = [startPosition];
    let graph = {};
    while (nextNodes.length)
        genGraph();
    let solution = [];
    if (graph[endIndex]) {
        let currentIndex = endIndex;
        while (currentIndex !== startIndex) {
            solution.unshift(positionFromNodeIndex(currentIndex));
            currentIndex = graph[currentIndex].f;
        }
        solution.unshift([...startPosition]);
    }
    return solution;
}
