/** @type {HTMLCanvasElement} */

const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Global Variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let score = 0;
let gameOver = false;
const winningScore = 200;

const gameGridArray = [];
const defendersArray = [];
const projectilesArray = [];
const enemiesArray = [];
const enemiesPositions = [];
const resourcesArray = [];

// mouse
const mouse = {
    x: 0,
    y: 0,
    width: 0.1,
    height: 0.1
}

let canvasPositions = canvas.getBoundingClientRect();

canvas.addEventListener('mousemove', e => {
    mouse.x = e.x - canvasPositions.left;
    mouse.y = e.y - canvasPositions.top;
});
canvas.addEventListener('mouseleave', e => {
    mouse.x = 0;
    mouse.y = 0;
});

// Game Board
const controlsBar = {
    width: canvas.width,
    height: cellSize
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }

    draw() {
        if (collision(this, mouse)) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}


function createCell() {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
            gameGridArray.push(new Cell(x, y));
        }
    }
    return gameGridArray;
}

function handlegameGrid() {
    const arr = createCell();
    for (let i = 0; i < arr.length; i++) {
        arr[i].draw();
    }
}





// Projectiles 
class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 10;
        this.power = 20;
        this.speed = 5;

        // fire
        this.fireImg = new Image();
        this.fireImg.src = 'images/fire.png';
    }

    update() {
        this.x += this.speed;
    }

    draw() {
        ctx.drawImage(this.fireImg, this.x, this.y - 10, this.width, this.height)
    }
}


function handleProjectiles() {
    for (let i = 0; i < projectilesArray.length; i++) {
        projectilesArray[i].update();
        projectilesArray[i].draw();


        // check for collision between Projectile and Enemy
        for (let j = 0; j < enemiesArray.length; j++) {
            if (projectilesArray[i] && enemiesArray[j] && collision(projectilesArray[i], enemiesArray[j])) {
                enemiesArray[j].health -= projectilesArray[i].power;
                projectilesArray.splice(i, 1);
                i--;
            }
        }

        // if Projectile reach the end of canvas (minus cellSize), Remove Projectile
        if (projectilesArray[i] && projectilesArray[i].x > canvas.width - cellSize) {
            projectilesArray.splice(i, 1);
            i--;
        }
    }
}

// Defenders
const plansImgs = ['plane_green', 'plane_blue'];
class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize - (cellGap * 2); // cellGap to make small space between Defender and Enemy vertically
        this.height = cellSize - (cellGap * 2); // cellGap to make small space between Defender and Enemy vertically
        this.shooting = false;
        this.health = 100;
        this.projectiles = []; // missiles
        this.timer = 0;

        // Plane
        this.planeImg = new Image();
        this.planeImg.src = 'images/' + plansImgs[Math.floor(Math.random() * plansImgs.length)] + '.png';

    }

    draw() {
        ctx.fillStyle = 'gold';
        ctx.font = '40px VT323';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y - 2);

        // draw plane
        ctx.drawImage(this.planeImg, this.x, this.y, this.width, this.height * 0.7);
    }

    update() {
        if (this.shooting) {
            this.timer++;

            if (this.timer % 50 === 0) {
                projectilesArray.push(new Projectile(this.x + this.width, this.y + this.height / 2))
            }
        } else {
            this.timer = 0;
        }
    }
}




function handleDefenders() {
    for (let i = 0; i < defendersArray.length; i++) {
        defendersArray[i].draw();
        defendersArray[i].update();

        // chech if Enemy is on the same (Row / y Position) of Defender 
        if (enemiesPositions.indexOf(defendersArray[i].y) !== -1) {
            defendersArray[i].shooting = true;
        } else {
            defendersArray[i].shooting = false;
        }


        // check for collision between defnder and enemy
        for (let j = 0; j < enemiesArray.length; j++) {
            // if collision
            if (defendersArray[i] && enemiesArray[j] && collision(defendersArray[i], enemiesArray[j])) {
                enemiesArray[j].movement = 0; // stop Enemy movement
                defendersArray[i].health -= 0.5; // reduce Defender health
            }

            if (defendersArray[i] && defendersArray[i].health <= 0) {
                defendersArray.splice(i, 1); // Remove Defender When health <= 0
                enemiesArray[j].movement = enemiesArray[j].speed; // Return movement to enemy by his default speed
            }
        }
    }
}




// Floating Messages
const floatingMessagesArray = [];

class FloatingMessage {
    constructor(value, x, y, size, color) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.lifeSpan = 0;
        this.color = color;
        this.opacity = 1;

    }

    update() {
        this.y -= 0.3;
        this.lifeSpan++;
        if (this.opacity > 0.05) this.opacity -= 0.02;
    }

    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + ' VT323';
        ctx.fillText(this.value, this.x, this.y)
        ctx.globalAlpha = 1;
    }
}


function hangleFloatingMessages() {
    for (let i = 0; i < floatingMessagesArray.length; i++) {
        floatingMessagesArray[i].update();
        floatingMessagesArray[i].draw();

        // Remove Message After time
        if (floatingMessagesArray[i].lifeSpan > 50) {
            floatingMessagesArray.splice(i, 1);
            i--;
        }
    }


}



// Enemies
const monestersImgs = [];
const monester_1 = {
    source: 'images/monester_1.png',
    widthSize: 8528 / 13,
    heightSize: 536,
    maxFrameX: 12,
}
const monester_2 = {
    source: 'images/monester_2.png',
    widthSize: 12324 / 13,
    heightSize: 823,
    maxFrameX: 12,
}
monestersImgs.push(monester_1, monester_2);

class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width; // to start from the end of canvas area
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;

        //monester
        this.enemyIndex = Math.floor(Math.random() * monestersImgs.length);
        this.enemyImg = new Image();
        this.enemyImg.src = monestersImgs[this.enemyIndex].source;
        this.spriteWidth = monestersImgs[this.enemyIndex].widthSize;
        this.spriteHeight = monestersImgs[this.enemyIndex].heightSize;
        this.frameX = 0;
        this.frameY = 0;
        this.timer = 0;
    }

    update() {
        this.x -= this.movement;
        this.timer++;

        if (this.timer % 5 === 0) {
            this.frameX < monestersImgs[this.enemyIndex].maxFrameX ? this.frameX++ : this.frameX = 0;
        }
    }

    draw() {
        ctx.fillStyle = 'pink';
        ctx.font = '40px VT323';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y - 2);

        // draw monester
        ctx.drawImage(this.enemyImg, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height)

    }
}


function handleEnemies() {
    for (let i = 0; i < enemiesArray.length; i++) {
        enemiesArray[i].update();
        enemiesArray[i].draw();
        if (enemiesArray[i].x < 0) { // check if enemy reach the end, then game over
            gameOver = true;
        }

        if (enemiesArray[i].health <= 0) { // remove Enemy when his health <= 0
            let gainedResorces = enemiesArray[i].maxHealth / 10;
            floatingMessagesArray.push(new FloatingMessage('+' + gainedResorces, 230, 55, '30px', 'white'));
            floatingMessagesArray.push(new FloatingMessage('+' + gainedResorces, enemiesArray[i].x, enemiesArray[i].y + 50, '50px', 'crimson'))
            numberOfResources += gainedResorces;
            score += gainedResorces;
            const thisIndex = enemiesPositions.indexOf(enemiesArray[i].y);
            enemiesPositions.splice(thisIndex, 1);
            enemiesArray.splice(i, 1);
            i--;

        }

    }

    // Add Enemy
    if (frame % enemiesInterval === 0 && score < winningScore) {
        // random between 100 - 500
        let verticalPos = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        enemiesArray.push(new Enemy(verticalPos));
        enemiesPositions.push(verticalPos);

        if (enemiesInterval > 100) enemiesInterval -= 40;
    }
}


// Resorces 
const amountsArray = [20, 30, 40];
const coinsImgs = ['bronze_coin', 'silver_coin', 'gold_coin'];

class Resource {
    constructor() {
        this.x = Math.random() * canvas.height - cellGap;
        this.y = Math.floor(Math.random() * 5 + 1) * cellSize;
        this.width = 60;
        this.height = 60;
        this.amount = amountsArray[Math.floor(Math.random() * amountsArray.length)];

        // coins
        this.coinImg = new Image();
        this.coinImg.src = 'images/' + coinsImgs[amountsArray.indexOf(this.amount)] + '.png';
        this.spriteWidth = 828 / 3;
        this.spriteHeight = 1270 / 5;
        this.timer = 0;
        this.frameX = 0;
        this.frameY = 0;
    }

    update() {
        this.timer++;

        if (this.timer % 5 == 0) {
            if (this.frameX < 2) {
                this.frameX++;
            } else {

                this.frameX = 0;
                if (this.frameY < 4) {
                    this.frameY++;
                } else {
                    this.frameY = 0;
                }
            }
        }

    }

    draw() {
        ctx.fillStyle = 'orange';
        ctx.font = '20px VT323';
        ctx.fillText(this.amount, this.x + 22, this.y + 5);
        ctx.drawImage(this.coinImg, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height)
    }
}

function handleResources() {
    if (frame % 500 === 0 && score < winningScore && resourcesArray.length < 4) {
        resourcesArray.push(new Resource());
    }
    for (let i = 0; i < resourcesArray.length; i++) {
        resourcesArray[i].update();
        resourcesArray[i].draw();
        if (resourcesArray[i] && collision(resourcesArray[i], mouse)) {
            floatingMessagesArray.push(new FloatingMessage('+' + resourcesArray[i].amount, resourcesArray[i].x, resourcesArray[i].y, '40px', 'purple'));
            numberOfResources += resourcesArray[i].amount;
            resourcesArray.splice(i, 1);
            i--;
        }
    }

}








function handleGameStatus() {
    ctx.fillStyle = 'gold';
    ctx.font = '50px VT323';
    ctx.fillText('Score: ' + score, 10, 40);
    ctx.fillText('Resources: ' + numberOfResources, 10, 80);

    if (gameOver) {
        ctx.fillStyle = 'black';
        ctx.font = '100px VT323';
        ctx.fillText('GAME OVER!!', 180, 350);
    }

    if (score >= winningScore && enemiesArray.length === 0) {
        ctx.fillStyle = 'black';
        ctx.font = '80px VT323';
        ctx.fillText('Level Completed!!', 150, 300);
        ctx.font = '50px VT323';
        ctx.fillText('You Win With ' + score, 150, 350);
    }
}




canvas.addEventListener('click', e => {
    const gridPosX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPosY = mouse.y - (mouse.y % cellSize) + cellGap;

    if (gridPosY < cellSize) return; // if the click was on the top bar, so don't do anything and exit

    // check if there is a Defnder in this positions then don't do anything and exit
    for (let i = 0; i < defendersArray.length; i++) {
        if ((defendersArray[i].x === gridPosX && defendersArray[i].y === gridPosY)) {
            return;
        }
    }

    let defenderCost = 100; // cost of each Defender
    if (numberOfResources >= defenderCost) { // if there is enough resources
        defendersArray.push(new Defender(gridPosX, gridPosY));
        numberOfResources -= defenderCost; // reduce number of resources after pushing defender
    } else {
        floatingMessagesArray.push(new FloatingMessage('You need more resoures', mouse.x, mouse.y, '15px', 'red'))
    }

});





function collision(first, second) {
    if (
        !(first.x > second.x + second.width ||
            first.x + first.width < second.x ||
            first.y > second.y + second.height ||
            first.y + first.height < second.y)
    ) {
        return true;
    }
}




function animate() {
    ctx.fillStyle = '#6c52a0';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    handlegameGrid();
    handleDefenders();
    handleResources();
    handleProjectiles();
    handleEnemies();
    handleGameStatus();
    hangleFloatingMessages();
    frame++;

    if (!gameOver) { // game is Not over yet
        requestAnimationFrame(animate);
    }
}
animate();
