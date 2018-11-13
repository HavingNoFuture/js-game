'use strict';

class Vector {
	// Позволяет контролировать расположение объектов в двумерном пространстве и управлять их размером и перемещением.
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	plus(objvector) {
		if (!(objvector instanceof Vector)) {
			throw new Error('Можно прибавлять к вектору только вектор типа Vector');
		}
		return new Vector(this.x + objvector.x, this.y + objvector.y);
	}

	times(multiplier) {
		return new Vector(this.x * multiplier, this.y * multiplier);
	}
}


class Actor {
	// Позволяет контролировать все движущиеся объекты на игровом поле и контролировать их пересечение.
	constructor(posObjVector  = new Vector(0, 0), sizeObjVector = new Vector(1, 1), speedObjVector = new Vector(0, 0)) {
		this.pos = posObjVector;
		this.size = sizeObjVector;
		this.speed = speedObjVector;

		if (!(this.pos instanceof Vector) || !(this.size instanceof Vector) || !(this.speed instanceof Vector)) {
			throw new Error('Передан не обьект типа Vector */');
		}
  }

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

	get type() {
		return 'actor';
	}

	act() {};

	isIntersect(objActor) {
		if (!(objActor instanceof Actor)) {
			throw new Error('Передан не обьект типа Actor */');
		}
		if (objActor == this) {
			return false;
		}
		if (!(objActor.left >= this.right || objActor.right <= this.left || objActor.top >= this.bottom || objActor.bottom <= this.top)) {
			return true;
		} else {
			return false;
		}
	}
}

class Level {
	// Реализуют схему игрового поля конкретного уровня, контролируют все движущиеся объекты на нём и реализуют логику игры.
	constructor(gridArray = [], actorsArray = []) {
		this.grid = gridArray ;
		this.actors = actorsArray;
		this.status = null;
		this.finishDelay = 1;
		this.height = this.grid.length;
	}

  get width() {
    return Math.max(0, ...this.grid.map(line => line.length))
  }

	get player() {
    return this.actors.find(actor => actor.type === 'player');
	}

	isFinished() {
		if (this.status != null && this.finishDelay < 0) {
			return true;
		} else {
			return false;
		}
	}

	actorAt(objActor) {
		if (!(objActor instanceof Actor)) {
			throw new Error('Передан не обьект типа Actor */');
		}

    return this.actors.find(actor => actor.isIntersect(objActor))
	}

	obstacleAt(posObjVector, sizeObjVector) {
		if (!(posObjVector instanceof Vector) || !(sizeObjVector instanceof Vector)) {
			throw new Error('Передан не обьект типа Vector */');
		}

		const x = Math.floor(posObjVector.x);
		const y = Math.floor(posObjVector.y);
    const x2 = Math.ceil(posObjVector.x + sizeObjVector.x);
		const y2 = Math.ceil(posObjVector.y + sizeObjVector.y);

		if (x < 0 || y < 0 || x2 > this.width) {
			return 'wall';
		} else if (y2 > this.height) {
			return 'lava';
		}

		for (let i = y; i < y2; i++) {
			for (let j = x; j < x2; j++) {
        let obstacle = this.grid[i][j];
        if (obstacle !== undefined) {
          return obstacle;
        }
			}
		}
	}


	removeActor(objActor) {
    const index = this.actors.indexOf(objActor);
    if (index >= 0) this.actors.splice(index, 1); 
	}

	noMoreActors(typeStr) {
		for (let actor of this.actors) {
			if (actor.type === typeStr) {
				return false;
			}
		}
		return true;
	}

	playerTouched(typeStr, objActor) {
		if (this.status != null) {
			return;
		}

		if ((typeStr === 'lava') || (typeStr === 'fireball')) {
			this.status = 'lost';
		} 

    if ((typeStr === 'coin') && (objActor != undefined)) {
			this.removeActor(objActor);
			if (this.noMoreActors('coin')) {
				this.status = 'won';
			}
		}
	}
}


class LevelParser {
	// Позволяет создать игровое поле Level.
	constructor(dict) {
    // dict: Object. Keys: symbols; values: ActorsTypes
		this.dictActors = dict;
	}

	actorFromSymbol(symbolStr) {
		if ((symbolStr === undefined) || (this.dictActors === undefined)) {
			return;
		} 
    
		if (symbolStr in this.dictActors) {
			return this.dictActors[symbolStr];
		} 
	}

	obstacleFromSymbol(symbolStr) {
		switch(symbolStr) {
			case 'x':
				return 'wall';
				break;
			case '!':
				return 'lava';
				break;
			default:
				return;
				break;	
		}
	}

	createGrid(actorsArray) {
		const result = actorsArray.slice();
		for (let i = 0; i < result.length; i++) {
			let tempArray = []

			for (let symbol of result[i]) {
				tempArray.push(this.obstacleFromSymbol((symbol)));
			}
			result[i] = tempArray;
		}
		return result;
	}

	createActors(stringArray) {
		const result = [];

		for (let y = 0; y < stringArray.length; y++) {  
			for (let x = 0; x < stringArray[y].length; x++) {
				const symbol = stringArray[y][x];
				const symbolType = this.actorFromSymbol(symbol);
				if (typeof symbolType === 'function') {
					const actor = new symbolType(new Vector(x, y));
					if (actor instanceof Actor) {
						result.push(actor);
					}
				}
			}
		}
		return result;
	}

	parse(stringArray) {
		const grid = this.createGrid(stringArray);
		const actors = this.createActors(stringArray);
		return new Level(grid, actors);
	}
}

class Fireball extends Actor {
	// Прототип для движущихся опасностей на игровом поле.
	constructor(posObjVector = new Vector(0, 0), speedObjVector  = new Vector(0, 0)) {
		super(posObjVector, speedObjVector);
		this.pos = posObjVector;
		this.speed = speedObjVector;
		this.size = new Vector(1, 1);
	}

	get type() {
		return 'fireball';
	}

	getNextPosition(number = 1) {
		return this.pos.plus(this.speed.times(number));
	}

	handleObstacle() {
		this.speed = this.speed.times(-1);
	}

	act(time, objLevel) {
		const newPos = this.getNextPosition(time);
		if (objLevel.obstacleAt(newPos, this.size) === undefined) {
			this.pos = newPos;
		} else {
			this.handleObstacle();
		}
	}
}

class HorizontalFireball extends Fireball{
	/*
		представлять собой объект, который движется по горизонтали со скоростью 2 
		и при столкновении с препятствием движется в обратную сторону.
	*/
	constructor(posObjVector = new Vector(0, 0)) {
		super(posObjVector);
		this.pos = posObjVector;
		this.speed = new Vector(2, 0);
		this.size = new Vector(1, 1);
	}
}

class VerticalFireball extends Fireball {
	/*
		представлять собой объект, который движется по вертикали со скоростью 2 
		и при столкновении с препятствием движется в обратную сторону.
	*/
	constructor(posObjVector = new Vector(0, 0)) {
		super(posObjVector);
		this.pos = posObjVector;
		this.speed = new Vector(0, 2);
		this.size = new Vector(1, 1);
	}
}

class FireRain extends Fireball {
	/*
		Представлять собой объект, который движется по вертикали со скоростью 3 и 
		при столкновении с препятствием начинает движение в том же направлении 
		из исходного положения, которое задано при создании. 
	*/
	constructor(posObjVector = new Vector(0, 0)) {
		super(posObjVector);
		this.pos = posObjVector;
		this.speed = new Vector(0, 3);
		this.size = new Vector(1, 1);
		this.basePositions = this.pos;
	}

	handleObstacle() {
		this.pos = this.basePositions;
	}
}

class Coin extends Actor {
	// Реализует поведение монетки на игровом поле.
	constructor(posObjVector = new Vector(0, 0)) {
		super(posObjVector);
		this.pos = posObjVector.plus(new Vector(0.2, 0.1));
		this.speed = new Vector(0, 1);
		this.size = new Vector(0.6, 0.6);
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * (2 * Math.PI - 0) + 0;
		this.basePositions = this.pos;
	}

	get type() {
		return 'coin';
	}

	updateSpring(time = 1) {
		this.spring += this.springSpeed * time;
	}

	getSpringVector() {
		return new Vector(0, Math.sin(this.spring) * this.springDist);
	}

	getNextPosition(time = 1) {
		this.updateSpring(time);
		return new Vector(this.basePositions.x, this.basePositions.y).plus(this.getSpringVector());
	}

	act(time) {
		this.pos = this.getNextPosition(time);
	}
}

class Player extends Actor {
	//  Cодержит базовый функционал движущегося объекта, который представляет игрока на игровом поле. 
	constructor(posObjVector = new Vector(0, 0)) {
		super(posObjVector);
		this.pos = posObjVector.plus(new Vector(0, -0.5));
		this.speed = new Vector(0, 0);
		this.size = new Vector(0.8, 1.5);
	}

	get type() {
		return 'player';
	}
}


const schemas = [
  	[
  		'                  =           =     ',
  		'      v                             ',
  		'   v        =                       ',
  		'         o          x xx  v  xxx    ',
  		'                     !       o     o',
  		' @   xx  xx       o    |         v x',
  		'xxx             xxxx       xxx      ',
  		'!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
  		],
		[
  		'                  v                 ',
  		'@   =                             o ',
  		'xxx                         xxo  xxx',
  		'        o    =            o         ',
  		'     |xxx               =           ',
  		'o         o  xxx            o  xxx  ',
  		'xxx      xxx        xxxxx           ',
  		'!!!!!!!!!!!!!!!!!!!!!!!!!!!xxx!!!!!!'
	]
];

const actorDict = {
	'@': Player,
	'v': VerticalFireball,
	'o': Coin,
	'=': HorizontalFireball,
	'|': FireRain  
};

const parser = new LevelParser(actorDict);

// loadLevels()
// 	.then((levels) => {
// 		runGame(JSON.parse(levels), parser, DOMDisplay)
// 			.then(() => alert('YOU WON!'));
// 	});

runGame(schemas, parser, DOMDisplay)
	.then(() => alert('YOU WON!'));
