'use strict';

let SCOREBOARD_SIZE = 5;

function removeContent(node) {
	node.innerHTML = "";
}

async function postJSON(link, value) {
	console.log(value);
	let response = await fetch(link, {
		method: "POST",
		headers: {
			"Content-Type": "application/json;charset=utf-8"
		},
		body: value
	});
	return response;
}

function back(T) {
	return T[T.length - 1];
}

function addPx(s) {
	return String(s) + 'px';
}

function addRad(s) {
	return String(s) + 'rad';
}

function sqr(x) {
	return x * x;
}

class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	norm() {
		return sqr(this.x) + sqr(this.y);
	}
}

function dotProduct(v1, v2) {
	return v1.x * v2.x + v1.y * v2.y;
}

function crossProduct(v1, v2) {
	return v1.x * v2.y - v1.y * v2.x;
}

function sign(x) {
	if (x > 0) {
		return 1;
	}
	if (x < 0) {
		return -1;
	}
	return 0;
}

function signMult(x, y) {
	return sign(x) * sign(y);
}

function vectorBetween(a, b) {
	return new Point(b.x - a.x, b.y - a.y);
}

function print(a) {
	console.log(a.x, a.y);
}

function intersecting(a1, b1, a2, b2) {
	// console.log("intersect");
	// print(a1);
	// print(b1);
	// print(a2);
	// print(b2);
	let diffDir = crossProduct(
		vectorBetween(a1, b1),
		vectorBetween(a2, b2)
	);
	if (diffDir == 0) {
		if (crossProduct(vectorBetween(a1, b1), vectorBetween(a1, a2)) == 0) {
			//same line
			let d1 = dotProduct(
				vectorBetween(a1, a2),
				vectorBetween(a1, b2)
			);
			let d2 = dotProduct(
				vectorBetween(b1, a2),
				vectorBetween(b1, b2)
			);
			return (d1 <= 0) || (d2 <= 0);
		} else {
			return 0;
		}
	}
	// console.log("passed");
	let c1 = crossProduct(
		vectorBetween(a1, b1), vectorBetween(a1, a2)
	);
	let c2 = crossProduct(
		vectorBetween(a1, b1), vectorBetween(a1, b2)
	);
	let c3 = crossProduct(
		vectorBetween(a2, b2), vectorBetween(a2, a1)
	);
	let c4 = crossProduct(
		vectorBetween(a2, b2), vectorBetween(a2, b1)
	);
	// console.log(c1, c2, c3, c4);
	return signMult(c1, c2) <= 0 && signMult(c3, c4) <= 0;
}

function strictlyEqual(a, b) {
	return (a.x == b.x && a.y == b.y);
}

function sqDist(a, b) {
	return vectorBetween(a, b).norm();
}

function dist(a, b) {
	return Math.sqrt(sqDist(a, b));
}

function polar(a) {
	return Math.atan2(a.y, a.x);
}

class DivCanvas {
	constructor(frame) {
		this.frame = frame
	}

	drawLinePoints(from, to, kwargs) {
		let elem = document.createElement('div');

		let lineWidth = (('width' in kwargs) ? kwargs['width'] : 2);

		if ('class' in kwargs) {
			elem.className = kwargs['class'];
		}

		elem.style.height = addPx(lineWidth);
		elem.style.width = addPx(dist(from, to) + lineWidth);

		elem.style.position = 'absolute';
		elem.style.left = addPx(from.x - lineWidth / 2);
		elem.style.top = addPx(from.y - lineWidth / 2);
		elem.style.transformOrigin = addPx(lineWidth / 2) + ' ' + addPx(lineWidth / 2)
		elem.style.transform = 'rotate(' + addRad(polar(vectorBetween(from, to))) + ')';

		this.frame.append(elem);
		return elem;
	}

	drawLine(x1, y1, x2, y2, kwargs) {
		return this.drawLinePoints(new Point(x1, y1), new Point(x2, y2), kwargs);
	}
}

class Node {
	constructor(coords, elem) {
		this.coords = coords;
		this.elem = elem;
	}

	addLine(line) {
		this.line = line;
	}

	destroy() {
		this.elem.remove();
		if ('line' in this) {
			this.line.remove();
		}
	}
}

class PolylineGame {
	initCellCoords() {
		this.cellCoords = [];

		for (let i = 0; i < this.width; ++i) {
			this.cellCoords.push([]);
			for (let j = 0; j < this.height; ++j) {
				this.cellCoords[this.cellCoords.length - 1].push(
					new Point(this.padding + i * this.cellWidth, this.padding + j * this.cellHeight)
				);
			}
		}
	}

	drawGrid() { 
		for (let i = 0; i < this.width; ++i) {
			this.canvas.drawLinePoints(this.cellCoords[i][0], this.cellCoords[i][this.height - 1], this.lineStyle);
		}
		for (let i = 0; i < this.height; ++i) {
			this.canvas.drawLinePoints(this.cellCoords[0][i], this.cellCoords[this.width - 1][i], this.lineStyle);
		}
	}

	getCenter(gridGoords) {
		return this.cellCoords[gridGoords.x][gridGoords.y];
	}

	moveCircle(elem, coords) {
		let center = this.getCenter(coords);
		elem.style.left = addPx(center.x);
		elem.style.top = addPx(center.y);
	}

	createCircle(coords, color) {
		let elem = document.createElement('div');
		elem.className = 'node';
		this.moveCircle(elem, coords);
		elem.style.backgroundColor = color;
		this.frame.append(elem);
		return elem;
	}

	createNode(coords, color) {
		return new Node(coords, this.createCircle(coords, color));
	}

	// {'result': 'impossible'}
	// {'result': 'ignore'}
	// {'result': 'revert', remain: ...}
	// {'result': 'next'}
	getClickAction(cell) {
		for (let i = 0; i < this.polyline.length; ++i) {
			if (strictlyEqual(this.polyline[i].coords, cell)) {
				return {'result': 'revert', 'remain' : i + 1}
			}
		}
		if (strictlyEqual(back(this.polyline).coords, this.endNode.coords)) {
			return {'result': 'ignore'};
		}
		if (sqDist(back(this.polyline).coords, cell) != 5) {
			return {'result': 'impossible'};
		}
		for (let i = 0; i < this.polyline.length - 2; ++i) {
			if (intersecting(
					this.polyline[i].coords,
					this.polyline[i + 1].coords,
					back(this.polyline).coords,
					cell
			)) {
				return {'result': 'impossible'};
			}
		}
		return {'result': 'next'};
	}

	handleClick() {
		let frameRect = this.frame.getBoundingClientRect();
		let X = event.clientX - frameRect.left;
		let Y = event.clientY - frameRect.top;
		let clickPoint = new Point(X, Y);
		let cell, clicked = 0;
		for (let i = 0; i < this.width; ++i) {
			for (let j = 0; j < this.height; ++j) {
				if (dist(clickPoint, this.cellCoords[i][j]) < this.clickArea) {
					cell = new Point(i, j);
					clicked = 1;
				}
			}
		}
		if (clicked) {
			let action = this.getClickAction(cell);
			if (action['result'] == 'revert') {
				while (this.polyline.length > action['remain']) {
					if (strictlyEqual(back(this.polyline).coords, this.endNode.coords)) {
						this.endWinFunction();
					}
					back(this.polyline).destroy();
					this.polyline.pop();
				}
			}
			if (action['result'] == 'next') {
				let nextNode = this.createNode(cell, 'black');
				let line = this.canvas.drawLinePoints(
					this.getCenter(this.polyline[this.polyline.length - 1].coords), 
					this.getCenter(cell), 
					this.edgeStyle
				);
				nextNode.addLine(line);
				this.polyline.push(nextNode);
				if (strictlyEqual(cell, this.endNode.coords)) {
					this.winFunction(this.polyline.length - 1);
				}
			}
		}
	}

	handleMouseMove() {
		let frameRect = this.frame.getBoundingClientRect();
		let X = event.clientX - frameRect.left;
		let Y = event.clientY - frameRect.top;
		let clickPoint = new Point(X, Y);
		let cell, clicked = 0;
		for (let i = 0; i < this.width; ++i) {
			for (let j = 0; j < this.height; ++j) {
				if (dist(clickPoint, this.cellCoords[i][j]) < this.clickArea) {
					cell = new Point(i, j);
					clicked = 1;
				}
			}
		}

		this.holdCircle.hidden = true;
		if (clicked) {
			let action = this.getClickAction(cell);
			if (action['result'] == 'ignore') {
				return;
			}
			this.holdCircle.hidden = false;
			this.moveCircle(this.holdCircle, cell);
			if (action['result'] == 'revert') {
				this.holdCircle.style.backgroundColor = "rgb(255, 100, 0)";
			}
			if (action['result'] == 'next') {
				this.holdCircle.style.backgroundColor = "grey";
			}
			if (action['result'] == 'impossible') {
				this.holdCircle.style.backgroundColor = "red";
			}
		}
	}

	bindWinFunction(func) {
		this.winFunction = func;
	}

	bindEndWinFunction(func) {
		this.endWinFunction = func;
	}

	constructor(params) {
		Object.assign(this, params);

		this.canvas = new DivCanvas(this.frame);

		this.cellWidth = (this.frame.offsetWidth - 2 * this.padding) / (this.width - 1);
		this.cellHeight = (this.frame.offsetHeight - 2 * this.padding) / (this.height - 1);
		
		this.initCellCoords();
		this.drawGrid();

		this.polyline = [this.createNode(this.firstPoint, 'black')];
		this.endNode = this.createNode(this.lastPoint, 'black');

		this.frame.onclick = () => this.handleClick();
		this.frame.onmousemove = () => this.handleMouseMove();

		this.holdCircle = this.createCircle(new Point(0, 0), 'black');
		this.holdCircle.style.zIndex = 4;
		this.holdCircle.hidden = true;

		this.winFunction = (score) => null;
		this.endWinFunction = () => null;
	}
}

async function getJSON(uri) {
	let response = await fetch(uri);
	return response.json();
}

class ScoreboardHandler {
	getP(text, className) {
		let elem = document.createElement('p');
		let textNode = document.createTextNode(text);
		elem.append(textNode);
		elem.className = className;
		return elem;
	}

	async update() {
		let scoreboard = await getJSON('/get');
		removeContent(this.leadersColumn);
		removeContent(this.scoresColumn);
		for (let i = 0; i < Math.min(SCOREBOARD_SIZE, scoreboard.length); ++i) {
			this.leadersColumn.append(
				this.getP(String(i + 1) + ". " + scoreboard[i]['name'], 
				"leaderName"
			));
			this.scoresColumn.append(
				this.getP(String(scoreboard[i]['score']) + " pts", 
				"leaderScore"
			));
		}
	}

	constructor(leadersColumn, scoresColumn) {
		this.leadersColumn = leadersColumn;
		this.scoresColumn = scoresColumn;
		this.update();
	}
}

class ResultHandler {
	win(score) {
		this.submitButton.disabled = false;
		this.isWin = 1;
		this.winScore = score;
		// console.log("win", score);
	}

	endWin() {
		this.submitButton.disabled = true;
		this.isWin = 0;
		// console.log("endWin");
	}

	async submit() {
		if (this.isWin) {
			let data = {
				"name": this.nameField.value,
				"score": this.winScore
			};
			await postJSON('/post', JSON.stringify(data));
			await this.scoreboardHandler.update();
		}
	}

	constructor(game, submitButton, nameField, scoreboardHandler) {
		this.game = game;
		this.game.bindWinFunction((score) => this.win(score));
		this.game.bindEndWinFunction(() => this.endWin());
		this.submitButton = submitButton;
		this.nameField = nameField;
		this.submitButton.disabled = true;
		this.isWin = 0;
		this.winScore = 0;
		this.submitButton.onclick = () => this.submit();
		this.scoreboardHandler = scoreboardHandler
	}
}

class FieldNameInsideHandler {
	handleClick() {
		if (this.clicked == 0) {
			this.field.style.color = "black";
			this.field.value = "";
			this.clicked = 1;
		}
	}

	constructor(field) {
		this.field = field;
		this.clicked = 0;
		this.field.onclick = () => this.handleClick();
	}
}

function main() {
	let submitButton = document.getElementById('submitButton');
	let nameField = document.getElementById('editField');
	let scoreboardHandler = new ScoreboardHandler(
		document.getElementById('leadersContainer'),
		document.getElementById('scoresContainer')
	);
	let nameFieldHandler = new FieldNameInsideHandler(nameField);
	let game = new PolylineGame({
		'frame': document.getElementById('gameFrame'),
		'padding': 20,
		'height': 7,
		'width': 7,
		'firstPoint': new Point(3, 3),
		'lastPoint': new Point(4, 6),
		'lineStyle': {
			'width': 5,
			'class': 'borderLine'
		},
		'edgeStyle': {
			'width': 4,
			'class': 'edgeLine'
		},
		'clickArea': 25
	});
	let resultHandler = new ResultHandler(game, submitButton, nameField, scoreboardHandler);
}

main();
