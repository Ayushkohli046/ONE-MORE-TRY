const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const restartButton = document.getElementById("restartButton");
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

let obstacleTimer = 0;
let gameOver = false;
let score =0;

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
        speed: Math.random() *2+2
    };
    obstacles.push(obstacle);
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
            gameOver = true;
        } 
    }
}

function drawScore(){
    ctx.fillStyle = "#ffffff"; 
    ctx.font = "20px Arial";
    ctx.fillText("Score: "+ score, 20, 30);
}

function restartGame(){
    player.x = canvas.width /2;
    player.y = 400;
    obstacles.length = 0 ;
    obstacleTimer = 0;
    score=0;
    gameOver= false;
    keys.left = false;
    keys.right = false;
}

function gameLoop(){
    drawBackground();
    if(!gameOver){
        restartButton.style.display="none";
        movePlayer();

        obstacleTimer++;
        if(obstacleTimer > 45){
            createObstacle();
            obstacleTimer = 0;
        }
        moveObstacles();
        checkCollision();
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