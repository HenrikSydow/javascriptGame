var canvas;
var ctx;

window.onload = init;

var keys = [];
var gameObjects = [];
var texts = [];
var player;
var enemySpawner;

function init() {
    canvas =  document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
	ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);

    let playerX = canvas.width / 2 - 50, playerY = canvas.height / 2 - 50;
    let hpBar = new HpBar(100);
    player = new Player(playerX, playerY, hpBar);

    gameObjects.push(player);

    enemySpawner = new EnemySpawner(1);

    window.requestAnimationFrame(gameloop);
}

function keyDownHandler(event) {
    event.preventDefault();
    if (!keys.includes(event.key))
        keys.push(event.key);
}

function keyUpHandler(event) {
    let keyIndex = keys.indexOf(event.key);
    keys.splice(keyIndex, 1);
}

let secondsPassed;
let oldTimeStamp;
let fps;
function gameloop(timeStamp) {
    update();
    draw();
    
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    fps = Math.round(1 / secondsPassed);

    ctx.font = '25px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText("FPS: " + fps, 10, 30);
    ctx.fillText("Level: " + enemySpawner.level, canvas.width - 200, 30);

    window.requestAnimationFrame(gameloop);
}

function update() {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    gameObjects.forEach(gameObject => gameObject.update());
    texts.forEach(text => text.update());
    enemySpawner.spawnEnemy();
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    gameObjects.forEach(gameObject => gameObject.draw());
    texts.forEach(text => text.draw());
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

class EnemySpawner {
    constructor(level) {
        this.frequency = 3000;
        this.lastSpawn = 0;
        this.level = level;

        this.levels = [
            // level 0:
            [

            ],
            // level 1:
            [
                [1, BasicEnemy]
            ],
            // level 2:
            [
                [2, BasicEnemy],
                [1, BouncingEnemy]
            ],
            // level 3:
            [
                [3, BasicEnemy],
                [5, BouncingEnemy]
            ],
            // level 4:
            [
                [2, BasicEnemy],
                [7, BouncingEnemy]
            ],
            // level 5:
            [
                [1, BigBouncingEnemy]
            ]
        ];
    }

    areEnemiesLeft() {
        let enemyCount = 0;
        gameObjects.forEach(gameObject => {
            if (gameObject instanceof Enemy)
                enemyCount++;
        });
        return (enemyCount > 0 ) ? true : false;
    }

    cleanLevelList(currentLevel) {
        for (let i = 0; i < currentLevel.length; i++) {
            let currentEnemy = currentLevel[i];
            if (currentEnemy[0] == 0)
                currentLevel.splice(currentLevel.indexOf(currentEnemy), 1);
        }
    }

    spawnEnemy() {
        if (this.levels.length <= this.level)
            return;

        let currentLevel = this.levels[this.level];

        this.cleanLevelList(currentLevel);

        if (currentLevel.length != 0) {
            if (Date.now() - this.lastSpawn >= this.frequency) {
                let newX = getRandomInt(1, canvas.width - 100);
                let newY = getRandomInt(1, canvas.height - 100);
                let enemyIndex = getRandomInt(0, currentLevel.length);
                let newEnemy = new currentLevel[enemyIndex][1](newX, newY);
                currentLevel[enemyIndex][0] -= 1;

                gameObjects.push(newEnemy);
                this.lastSpawn = Date.now();
            }
        }
        
        if (!this.areEnemiesLeft() && currentLevel.length == 0)
            this.level += 1;
    }
}

class GameText {
    constructor(textStr, x, y, size, color, duration) {
        this.text = textStr;
        this.x = x;
        this.y = y;
        this.size = size;
        this.duration = duration;
        this.color = color;
        this.alpha = 1;
        this.creationTime = Date.now();
    }

    update() {
        // if duration == 0 --> do not apply a duration
        if (this.duration == 0)
            return;

        // fade out text
        if (Date.now() - this.creationTime >= this.duration - 500)
            this.alpha -= 0.03;

        // remove this after duration
        if (Date.now() - this.creationTime >= this.duration)
            texts.splice(texts.indexOf(this), 1);
    }

    draw() {
        ctx.font = `bold ${this.size}px Arial`;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
    }

    update() {}
    draw() {}
}

class HpBar extends GameObject {
    constructor() {
        super(0, 0);
        this.hp = 0;
        this.exp = 0;
        this.hpColor = "#FF0000";
    }

    draw() {
        super.draw();
        ctx.fillStyle = this.hpColor;
        ctx.fillRect(this.x, this.y, (this.hp / player.maxHp) * 100, 20);
        ctx.fillStyle = "#62d0f3";
        ctx.fillRect(this.x, this.y + 20, player.width * (this.exp / player.nextLvlExp), 8);
    }
}

class Hitbox extends GameObject {
    constructor(x, y, width, height) {
        super(x, y);
        this.width = width;
        this.height = height;
    }

    intersects(hitbox) {
        let rect1 = this;
        let rect2 = hitbox;
        if (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y) {
            return true;
        }
        return false;
    }
}

class Health extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = this.height = 40;
        this.hitbox = new Hitbox(this.x, this.y, this.width, this.height);
        this.healthValue = 20;
    }

    update() {
        if (this.hitbox.intersects(player.hitbox)) {
            player.hp += this.healthValue;
            if (player.hp > player.maxHp)
                player.hp = player.maxHp;
            gameObjects.splice(gameObjects.indexOf(this), 1);
        }
    }

    draw() {   
        ctx.fillStyle = "#13ec41";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

}

class Enemy extends GameObject {
    constructor(x, y, width, height) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.hitbox = new Hitbox(this.x, this.y, this.width, this.height);
        this.hpBar = new HpBar();
        this.velX = this.velY = 0;
        this.hp = 0;
        this.expWorth = 5;
    }
	
	takeDamage() {
		gameObjects.forEach(gameObject => {
            if (gameObject instanceof Bullet) {
                if (gameObject.hitbox.intersects(this.hitbox)) {
                    gameObjects.splice(gameObjects.indexOf(gameObject), 1);
                    this.hp -= player.damage * 10;
                }
            }
        });
	}

    spawnHealthRandom() {
        let randInt = getRandomInt(0, 21);
        if (randInt == 10)
            gameObjects.push(new Health(this.x, this.y));
    }
	
	updateHitbox() {
		this.hitbox.x = this.x;
        this.hitbox.y = this.y;
	}
	
	updateHpBar() {
		this.hpBar.x = this.x;
        this.hpBar.y = this.y - 30;
        this.hpBar.hp = this.hp;
	}

    update() {
        super.update();
		this.takeDamage();
		this.updateHitbox();
		this.updateHpBar();
        this.move();
        if (this.hp <= 0)
            this.die();
    }

    move() {
        this.x += this.velX;
        this.y += this.velY;
    }

    explode() {
        gameObjects.push(new ParticleExplosion(this.x, this.y, 20, "red"));
    }

    die() {
        this.dropExp();
        this.spawnHealthRandom();
        this.explode();
        gameObjects.splice(gameObjects.indexOf(this), 1);
    }

    draw() {
        super.draw();
        this.hpBar.draw();
    }

    dropExp() {
        for (let i = 0; i < this.expWorth; i++) {
            let expX = getRandomInt(this.x, this.x + this.width);
            let expY = getRandomInt(this.y, this.y + this.height);
            gameObjects.push(new ExpParticle(expX, expY));
        }
    }
}

class BasicEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 100, 100);
        this.velX = this.velY = 2;
        this.hp = 20;
    }

    move() {
		if (player.x >= this.x)
            this.x += this.velX;
        else
            this.x -= this.velX;
        if (player.y >= this.y)
            this.y += this.velY;
        else
            this.y -= this.velY;
	}

    draw() {
        super.draw();
        ctx.fillStyle = "#FF00FF";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class BouncingEnemy extends Enemy {
	constructor(x, y) {
		super(x, y, 40, 40);
		this.velX = this.velY = 9;
        this.hp = 10;
        this.expWorth = 7;
	}
	
	update() {
        super.update()
		if (this.x <= 0 || this.x + this.width >= canvas.width)
			this.velX = -this.velX;
		if (this.y <= 0 || this.y + this.height >= canvas.height)
			this.velY = -this.velY;
	}

    drawTrail() {
        ctx.globalAlpha = 0.25;
        for (let i = 1; i <= 5; i++){
            ctx.fillRect(this.x - this.velX * i, this.y - this.velY * i, this.width, this.height);
            ctx.globalAlpha -= 0.05;
        }
        ctx.globalAlpha = 1;
    }
	
	draw() {
        super.draw();
		ctx.fillStyle = "#ff4621"
        this.drawTrail();
        ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}

class BigBouncingEnemy extends BouncingEnemy {
    constructor(x, y) {
        super(x, y);
        this.width = this.height = 200;
        this.hitbox = new Hitbox(this.x, this.y, this.width, this.height);
        this.hp = 250;
        this.expWorth = 15;
        this.velX = this.velY = 15;
    }

    explode() {
        let explosion = new ParticleExplosion(this.x + this.width / 2, this.y + this.height / 2, 75, "red");
        explosion.duration = 500;
        gameObjects.push(explosion);
    }

    die() {
        let enemyOne = new BouncingEnemy(this.x + this.width / 2, this.y + this.height / 2);
        let enemyTwo = new BouncingEnemy(this.x + this.width / 2, this.y + this.height / 2);
        let enemyThree = new BouncingEnemy(this.x + this.width / 2, this.y + this.height / 2);
        let enemyFour = new BouncingEnemy(this.x + this.width / 2, this.y + this.height / 2);
        enemyOne.velX = enemyOne.velY = -enemyOne.velX;
        enemyThree.velX = -enemyThree.velX;
        enemyFour.velY = -enemyFour.velY;

        gameObjects.push(enemyOne);
        gameObjects.push(enemyTwo);
        gameObjects.push(enemyThree);
        gameObjects.push(enemyFour);
        super.die();
    }
}

class Bullet extends GameObject {
	static size = 20;
	
    constructor(x, y, velX, velY) {
        super(x, y);
        this.velX = velX;
        this.velY = velY;
        this.width = this.height = Bullet.size;
        this.hitbox = new Hitbox(this.x, this.y, this.width, this.height);
    }

    update() {
        super.update();

        this.x += this.velX;
        this.y += this.velY;

        this.hitbox.x = this.x;
        this.hitbox.y = this.y;
    }

    draw() {
        super.draw();
        ctx.fillStyle = "yellow"
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Particle extends GameObject {
    constructor(x, y, size, color) {
        super(x, y);
        this.size = size;
        this.color = color;
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class ParticleExplosion extends GameObject {
    constructor(x, y, amount, color) {
        super(x, y);
        this.alpha = 0.7;
        this.duration = 100;
        this.creationDate = Date.now();
        this.particles = [];
        for (let i = 0; i < amount; i++) {
            let size = getRandomInt(5, 30);
            let particle = new Particle(this.x, this.y, size, color);
            particle.velX = getRandomInt(-4, 4);
            particle.velY = getRandomInt(-4, 4);
            this.particles.push(particle);
        }
    }

    update() {
        let currentDate = Date.now();
        if (currentDate - this.creationDate > this.duration)
            this.alpha -= 0.01;
        if (this.alpha <= 0)
            gameObjects.splice(gameObjects.indexOf(this), 1);

        this.particles.forEach(element => {
            element.update();
        });
    }

    draw() {
        this.particles.forEach(element => {
            ctx.globalAlpha = this.alpha;
            element.draw();
            ctx.globalAlpha = 1;
        });
    }

}

class ExpParticle extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.width = this.height = 8;
        this.hitbox = new Hitbox(this.x, this.y, this.width, this.height);
    }

    trackPlayer() {
        let vX = player.x - this.x;
        let vY = player.y - this.y;
        let vLen = Math.sqrt(Math.pow(vX, 2) + Math.pow(vY, 2));
        this.velX = this.velY = Math.pow(300 / vLen, 2);

        if (this.x < player.x + player.width / 2)
            this.x += this.velX;
        else if (this.x > player.x + player.width / 2)
            this.x -= this.velX;

        if (this.y < player.y + player.height / 2)
            this.y += this.velY;
        else if (this.y > player.y + player.width / 2)
            this.y -= this.velY;
    }

    update() {
        super.update();

        this.trackPlayer();

        this.hitbox.x = this.x;
        this.hitbox.y = this.y;

        if (this.hitbox.intersects(player.hitbox)) {
            player.exp += 1;
            gameObjects.splice(gameObjects.indexOf(this), 1);
        }
    }

    draw() {
        super.draw();
        ctx.fillStyle = "#62d0f3";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

}

class Player extends GameObject{
    constructor(x, y, hpBar) {
        super(x, y);
        this.velX = this.velY = 4;
		this.bulletVel = 10;
		this.bulletCooldown = 750;
        this.hpBar = hpBar;
        this.hpBar.hpColor = "#00FF00";
        this.maxHp = 100;
        this.hp = 100;
        this.damage = 1;
        this.lvl = 1;
        this.exp = 0;
        this.nextLvlExp = 10;
        this.hpBar.hp = this.hp;
        this.width = 100;
        this.height = 100;
        this.hitbox = new Hitbox(this.x, this.y, this.width, this.height);
        this.lastShot = 0;
    }
	
	shoot() {
		if (Date.now() - this.lastShot >= this.bulletCooldown) {
			let bulletX = this.x + this.width / 2 - Bullet.size / 2;
			let bulletY = this.y + this.height / 2 - Bullet.size / 2;

            let bulletVelX = 0;
            let bulletVelY = 0;

            if (keys.includes("ArrowUp")) {
                bulletVelY = -this.bulletVel;
            }
            if (keys.includes("ArrowDown")) {
                bulletVelY = this.bulletVel;
            }
            if (keys.includes("ArrowLeft")) {
                bulletVelX = -this.bulletVel;
            }
            if (keys.includes("ArrowRight")) {
                bulletVelX = this.bulletVel;
            }

            if (bulletVelX != 0 || bulletVelY != 0) {
                gameObjects.push(new Bullet(bulletX, bulletY, bulletVelX, bulletVelY));
                this.lastShot = Date.now();
            }
        }
	}

    levelUp() {
        this.lvl += 1;
        this.exp = this.exp - this.nextLvlExp;
        this.nextLvlExp += 5;
        this.damage += 1;
        this.maxHp += 5;
        this.hp += 5;
        if (this.bulletCooldown >= 300);
            this.bulletCooldown -= 10;
        if (this.lvl % 10 == 0)
            this.velX = this.velY = this.velX + 1;
        texts.push(new GameText("Level up!", this.x, this.y, 20, "#e3f238", 1500));
    }

    die() {
        gameObjects = [];
        let newPlayer = new Player(canvas.width / 2 - this.width / 2, canvas.height / 2 - this.height / 2, this.hpBar);
        gameObjects.push(newPlayer);
        enemySpawner = new EnemySpawner(0);
        player = newPlayer;
    }

    update() {
        super.update();

        gameObjects.forEach(gameObject => {
            if (gameObject instanceof Enemy) {
                if (gameObject.hitbox.intersects(this.hitbox)) {
                    if(this.hp > 0)
                        this.hp -= 1;
                }
            }
        });

        const lower = keys.map(element => {
            return element.toLowerCase();
        });

        if (lower.includes("w")) {
            this.y -= this.velY;
        }
        if (lower.includes("a")) {
            this.x -= this.velX;
        }
        if (lower.includes("s")) {
            this.y += this.velY;
        }
        if (lower.includes("d")) {
            this.x += this.velX;
        }
        
        this.shoot();

        this.hpBar.x = this.x;
        this.hpBar.y = this.y - 30;
        this.hpBar.hp = this.hp;
        this.hpBar.exp = this.exp;

        this.hitbox.x = this.x;
        this.hitbox.y = this.y;

        if (this.exp >= this.nextLvlExp)
            this.levelUp();

        if (this.hp <= 0)
            this.die();
    }

    draw() {
        super.draw();
        ctx.fillStyle = "#0000FF";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.hpBar.draw();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = '18px Arial';
        ctx.fillText("Lv. " + this.lvl, this.x + 10, this.y + 20);
        ctx.font = '14px Arial';
        ctx.fillText("Dmg: " + this.damage, this.x + 10, this.y + 55);
        ctx.fillText("Spd: " + this.velX, this.x + 10, this.y + 70);
        ctx.fillText("Hp: " + this.hp + "/" + this.maxHp, this.x + 10, this.y + 85);
    }
}
