'use strict';

class Vector {
  // Позволяет контролировать расположение объектов в двумерном пространстве и управлять их размером и перемещением.
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector /*обьект Vector*/) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y)
  }

  times(multiplier /* число*/) {
    return new Vector(this.x * multiplier, this.y * multiplier)
  }
}


class Actor {
   constructor(pos  = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0) /* все обьект Vector*/) {
     this.pos = pos; // можно таким образом задать по умолчанию
     this.size = size;
     this.speed = speed;

    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error('Передан не обьект типа Vector */');
    }

    Object.defineProperty(this, 'left', {
      value: this.pos.x,
      writable: false
    });
    Object.defineProperty(this, 'top', {
      value: this.pos.y,
      writable: false
    });
    Object.defineProperty(this, 'right', {
      value: this.pos.x + this.size.x,
      writable: false
    });
    Object.defineProperty(this, 'bottom', {
      value: this.pos.y + this.size.y,
      writable: false
    });
  }

  get type() {
    return 'actor';
  }

  act() {};

  isIntersect(actor /* все обьект */) {
    if (!(actor instanceof Actor)) {
      throw new Error('Передан не обьект типа Actor */');
    }
    if (actor == this) {
    	return false
    }
    if (!(actor.left >= this.right || actor.right <= this.left || actor.top >= this.bottom || actor.bottom <= this.top)) {
    	return true
    } else {
      return false
    }
  }
}

class Level {
  constructor(grid = []/* двумерный массив строк*/, actors = [] /* массив Actorсов*/) {
    this.grid = grid;
    this.actors = actors;
    this.status = null;
    this.finishDelay = 1;
    this.height = this.grid.length;

  }

  get player() {
  	for (let actor of this.actors) {
		if (actor.type === 'player') {
			return actor;
		}
	}
  }

  get width() {
    let max;
    if (this.height === 0) {
		  max = 0;
    } else {
      max = this.grid[0].length;
      for (let i = 1; i < this.height; i++) {
        if (this.grid[i].length > max) {
          max = this.grid[i].length;
        }
      }
    }
    return max;
  };
  

  isFinished() {
    if (this.status != null && this.finishDelay < 0) {
      return true
    } else {
      return false
    }
  }

  actorAt(actor /* обьект типа Actor*/) {
    if (!(actor instanceof Actor)) {
      throw new Error('Передан не обьект типа Actor */');
    }

    for (let item of this.actors) {
		if (item.isIntersect(actor)) {
			return item;
		}
    }
  }

  obstacleAt(pos, size /* оба обьект типа Vector*/) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Передан не обьект типа Vector */');
    }
    const x = Math.floor(pos.x);
    const y = Math.floor(pos.y);
    const y2 = Math.ceil(pos.y + size.y);
    const x2 = Math.ceil(pos.x + size.x);

    if ((x < 0 || y < 0 || x2 > this.width) && (y2 < this.height))  {
    	return 'wall';
    } else if (y2 > this.height) {
    	return 'lava';
    }
    for (let i = x; i < x2; i++) {
    	for (let j = y; j < y2; j++) {
    		if (this.grid[x][y] === 'wall') {
    			return 'wall';
    		} else if (this.grid[x][y] == 'lava') {
    			return 'lava';
    		}
    	}
    }
  }


  removeActor(actor /*обьект типа Vector*/) {
  	for (let i = 0; i < this.actors.length; i++) {
        if (this.actors[i] === actor) {
	        this.actors.splice(i, 1);
	    }
    }
  }

  noMoreActors(type /* строка*/) {
    for (let actor of this.actors) {
        if (actor.type === type) {
	        return false
	    }
    }
    return true
  }

  playerTouched(type /* строка*/, actor) {
  	if (this.status != null) {
  		return undefined;
  	} else {
		if ((type === 'lava') || (type === 'fireball')) {
	  		this.status = 'lost';
	  	} else if ((type === 'coin') && (actor != undefined)) {
	  		this.removeActor(actor);
	  		if (this.noMoreActors('coin')) {
	  			this.status = 'won';
	  		}
	  	}
  	}
  }
}


class LevelParser {
  constructor(dict) {
  	this.dictActors = dict;
  }

  actorFromSymbol(symbol) {
  	if ((symbol === undefined) || (this.dictActors === undefined)) {
  		return undefined;
  	} 
  	if (symbol in this.dictActors) {
  		return this.dictActors[symbol];
  	} 
  }

  obstacleFromSymbol(symbol) {
  	switch(symbol) {
	  case 'x':
	    return 'wall';
	    break;
	  case '!':
	    return 'lava';
	    break;
	  default:
	    return undefined;
	    break;
	} 
  }

  createGrid(array) {
  	const result = array.slice();
  	for (let i = 0; i < result.length; i++) {
  		let tempArray = []
  		for (let symbol of result[i]) {
  			tempArray.push(this.obstacleFromSymbol((symbol)));
  		}
  		result[i] = tempArray;
  	}
  	return result;
  }

  createActors(array) {
  	const result = [];

  	for (let y = 0; y < array.length; y++) {
  		for (let x = 0; x < array[y].length; x++) {
	  		const symbol = array[y][x];
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

  parse(array) {
  	const grid = this.createGrid(array);
  	const actors = this.createActors(array);
  	return new Level(grid, actors);
  }
}

class Fireball extends Actor {
	constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
		super(pos, speed)
		this.pos = pos;
		this.speed = speed
		this.size = new Vector(1, 1)
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

	act(time, level) {
		const newPos = this.getNextPosition(time);
		if (level.obstacleAt(newPos, this.size) === undefined) {
			this.pos = newPos;
		} else {
			this.handleObstacle();
		}
	}
}

class HorizontalFireball extends Fireball{
	constructor(pos = new Vector(0, 0)) {
		super(pos)
		this.pos = pos;
		this.speed = new Vector(2, 0)
		this.size = new Vector(1, 1)
	}
}

class VerticalFireball extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos)
		this.pos = pos;
		this.speed = new Vector(0, 2)
		this.size = new Vector(1, 1)
	}
}

class FireRain extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos)
		this.pos = pos;
		this.speed = new Vector(0, 3);
		this.size = new Vector(1, 1);
		this.basePositions = this.pos;
	}

	handleObstacle() {
		this.pos = this.basePositions;
	}
}

class Coin extends Actor {
	constructor(pos = new Vector(0, 0)) {
		super(pos)
		this.pos = pos.plus(new Vector(0.2, 0.1));
		this.speed = new Vector(0, 0);
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
		return new Vector(0, Math.sin(this.spring) * this.springDist)
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
	constructor(pos = new Vector(0, 0)) {
		super(pos);
		this.pos = pos.plus(new Vector(0, -0.5));
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
    '         o          x!xx  v  xxx    ',
    '                             o     o',
    ' @   xx  xx       o    |         v x',
    'xxx              xxx       xxx      ',
    '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
  ],
  [
    '@                 v                 ',
    'xxx =                           v o ',
    '                            xxo  xxx',
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
//   .then((levels) => {
//     runGame(JSON.parse(levels), parser, DOMDisplay)
//       .then(() => alert('YOU WON!'));
//   });

runGame(schemas, parser, DOMDisplay)
.then(() => alert('YOU WON!'));
