const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const currentScoreDisplay = document.getElementById("currentScore");
const bestScoreDisplay = document.getElementById("bestScore");
let bestScore= Number(localStorage.getItem("oneMoreTryBest")) || 0;

bestScoreDisplay.textContent = bestScore;

const restartButton = document.getElementById("restartButton");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");

const pauseScreen = document.getElementById("pauseScreen");
const resumeButton = document.getElementById("resumeButton");

function resumeGame(){
    isPaused = false;
    pauseScreen.style.display = "none";
}

resumeButton.addEventListener("click", resumeGame);

let gameStarted = false;
let isPaused = false;
startButton.addEventListener("click", function(){
    gameStarted = true;
    startScreen.style.display = "none";
});

restartButton.addEventListener("click",restartGame);

const player = {
    x : 400,
    y: 400,
    size: 14,
    speed: 5,
    color: "#63f7ff"
};

const keys = {
    left: false,
    right: false
}

const obstacles = [];
const coins =[];
const shields = [];

let hasShield=false;
let shieldTimer = 0;
let shieldActive = false;
let obstacleTimer = 0;
let gameOver = false;
let score =0;
let difficulty =1;

function drawBackground() {
    ctx.fillStyle = "#0d0d20";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#191932";
    ctx.lineWidth = 1;

    for(let x=0; x< canvas.width; x+=40){
        ctx.beginPath();
        ctx.moveTo(x,0);
        ctx.lineTo(x,canvas.height);
        ctx.stroke();
    }
    for(let y=0; y< canvas.height; y+=40){
        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawPlayer(){
    ctx.save();
    ctx.shadowBlur =20;
    ctx.shadowColor = player.color;
    ctx.fillStyle=player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y,player.size,0,Math.PI *2);
    ctx.fill();
    ctx.restore();
}
function movePlayer(){
    if(keys.left){
        player.x -= player.speed;
    }
    if(keys.right){
        player.x += player.speed;
    }
    if(player.x < player.size){
        player.x  = player.size;
    }
    if(player.x > canvas.width - player.size){
        player.x = canvas.width - player.size;
    }
}

function createObstacle(){
    const size = Math.random() * 25 + 20;
    const obstacle = {
        x: Math.random() * (canvas.width - size),
        y: -size,
        size: size,
        speed: (Math.random() *2 + 2) * difficulty
    };
    obstacles.push(obstacle);
}

function createCoin(){
    const coin = {
        x: Math.random() * (canvas.width - 30) + 15,
        y: -20,
        size: 10,
        speed: 2.5
    };
    coins.push(coin);
}
function drawCoins(){
    ctx.save();
    ctx.fillStyle = "#ffd166";
    ctx.shadowColor = "#ffd166";
    ctx.shadowBlur = 15;
    for(let i =0; i<coins.length; i++){
        const coin = coins[i];
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function createShield(){
    const shield = {
        x: Math.random() * (canvas.width -40) + 20,
        y: -20,
        size: 12,
        speed: 2
    };
    shields.push(shield);
}
function drawShields(){
    ctx.save();
    ctx.fillStyle = "#63f7ff";
    ctx.shadowColor="#63f7ff";
    ctx.shadowBlur= 15;
    for(let i = 0; i<shields.length; i++){
        const shield = shields[i];
        ctx.beginPath();
        ctx.arc(shield.x, shield.y, shield.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawObstacles(){
    ctx.fillStyle = "#ff4d8d"
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff4d8d";

    for(let i = 0; i< obstacles.length; i++){
        const obstacle = obstacles[i];
        ctx.fillRect(
            obstacle.x,
            obstacle.y,
            obstacle.size,
            obstacle.size
        );

    }
    ctx.shadowBlur=0;
}

function moveObstacles(){
    for (let i=0; i< obstacles.length; i++){
        obstacles[i].y += obstacles[i].speed;
    }
    for(let i = obstacles.length -1; i >= 0 ; i--){
        if (obstacles[i].y > canvas.height){
            obstacles.splice(i,1);
            score++;
            difficulty = 1 + Math.floor(score / 5) * 0.2;
        }
    }
}

function moveCoins(){
    for(let i = coins.length -1; i>= 0; i--){
        const coin = coins[i];
        coin.y += coin.speed;
        const dx = player.x - coin.x;
        const dy = player.y - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if(distance < player.size + coin.size){
            coins.splice(i,1);
            score+=2;
        } else if(coin.y - coin.size > canvas.height){
            coins.splice(i,1);
        }

    }
}

function moveShields(){
    for(let i = shields.length -1;i>=0; i--){
        const shield = shields[i];
        shield.y += shield.speed;
        const dx = player.x - shield.x;
        const dy = player.y - shield.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if(distance < player.size + shield.size){
            shields.splice(i,1);
            hasShield = true;
        } else if (shield.y - shield.size > canvas.height){
            shields.splice(i,1);
        }
    }
}

function checkCollision(){
    for (let i = 0; i<obstacles.length; i++){
        const obstacle = obstacles[i];

        if(
            player.x + player.size > obstacle.x &&
            player.x - player.size < obstacle.x + obstacle.size &&
            player.y + player.size > obstacle.y && 
            player.y - player.size < obstacle.y + obstacle.size
        ){
            if(hasShield){
                obstacles.splice(i,1);
                hasShield=false;
                break;
            } else {
                gameOver = true;
                break;
            }
        } 
    }
}

function drawScore(){
    currentScoreDisplay.textContent = score;
    if(score>bestScore){
        bestScore=score;
        bestScoreDisplay.textContent = bestScore;
        localStorage.setItem("oneMoreTryBest",bestScore);
    }

    ctx.fillStyle = "#ffffff"; 
    ctx.font = "20px Arial";
    ctx.fillText("Score: "+ score, 20, 30);
    ctx.fillStyle="#64f7ff";
    ctx.font = "14px Arial";
    ctx.fillText(
        "LEVEL: "+(Math.floor(score /5 )+1),
        20,
        52
    );
    if(hasShield){
        ctx.fillStyle = "#63f7ff";
        ctx.font = "14px Arial";
        ctx.fillText("SHIELD READY", 20, 72);
    }
}

function restartGame(){
    player.x = canvas.width /2;
    player.y = 400;
    obstacles.length = 0 ;
    coins.length = 0;
    shields.length =0 ;
    hasShield=false;
    shieldTimer = 0;
    shieldActive = false;
    obstacleTimer = 0;
    score=0;
    difficulty = 1;
    gameOver= false;
    keys.left = false;
    keys.right = false;
    startScreen.style.display = "none";
    gameStarted = true;
    isPaused = false;
    pauseScreen.style.display = "none";
}

function gameLoop(){
    drawBackground();
    if(!gameStarted){
        requestAnimationFrame(gameLoop);
        return;
    }
    if(isPaused){
        requestAnimationFrame(gameLoop);
        return;
    }
    if(!gameOver){
        restartButton.style.display="none";
        movePlayer();

        obstacleTimer++;
        let spawnDelay = Math.max(18, 45-score);

        if(obstacleTimer > spawnDelay){
            createObstacle();
            obstacleTimer = 0;
        }
        if(Math.random() < 0.02){
            createCoin();
        }
        if(Math.random()<0.003){
            createShield();
        }

        moveObstacles();
        moveCoins();
        moveShields();
        checkCollision();

        drawCoins();
        drawShields();
        drawPlayer();
        drawObstacles();
        drawScore();
    } else {
        restartButton.style.display = "block";
        drawObstacles();
        drawPlayer();
        drawScore();

        ctx.fillStyle = "rgba(5,5,20,0.8)";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        ctx.fillStyle = "#ff4d8d";
        ctx.font = "42px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            "GAME OVER",
            canvas.width / 2,
            canvas.height / 2 -35
        );
        ctx.fillStyle="#ffffff";
        ctx.font = "20px Arial";
        ctx.fillText(
            "Press ENTER to try again",
            canvas.width /2,
            canvas.height / 2 +15
        );

        ctx.textAlign = "left";
    }
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", function(event) {
    if(event.key.toLowerCase()==="p" &&
        gameStarted && 
        !gameOver &&
        !event.repeat){
        isPaused = !isPaused;
        pauseScreen.style.display = isPaused ? "flex" : "none";
        return;
    }
    if(event.key === "Enter" && gameOver){
        restartGame();
    }
    if(!gameOver){
        if(event.key === "ArrowLeft" || event.key.toLowerCase()==="a"){
            keys.left = true;
            event.preventDefault();
        }
        if(event.key === "ArrowRight" || event.key.toLowerCase()==="d"){
            keys.right = true;
            event.preventDefault();
        }
    }
    
});
document.addEventListener("keyup", function(event){
    if(event.key === "ArrowLeft" || event.key.toLowerCase()==="a"){
        keys.left = false;
    }
    if(event.key === "ArrowRight" || event.key.toLowerCase()==="d"){
        keys.right= false;
    }
});
gameLoop();