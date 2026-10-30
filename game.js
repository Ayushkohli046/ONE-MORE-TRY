const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let audioContext;

const soundButton = document.getElementById("soundButton");
let soundEnabled = localStorage.getItem("oneMoreTrySound") !== "false";
soundButton.textContent = soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";

function initAudio(){
    if(!audioContext){
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if(audioContext.state === "suspended"){
        audioContext.resume();
    }
}
function playSound(frequency, duration, type, volume){
    if(!audioContext || !soundEnabled) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
    );
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime+duration);
}

function playCoinSound(){
    playSound(880, 0.12, "sine", 0.15);
}

function playShieldSound(){
    playSound(660, 0.25, "sine", 0.18);
}

function playCollisionSound(){
    playSound(130, 0.35, "sawtooth", 0.18);
}

function playHighScoreSound(){
    playSound(660, 0.15, "sine", 0.15);

    setTimeout(function(){
        playSound(990, 0.25, "sine", 0.15);
    }, 150);
}

const currentScoreDisplay = document.getElementById("currentScore");
const bestScoreDisplay = document.getElementById("bestScore");
let bestScore= Number(localStorage.getItem("oneMoreTryBest")) || 0;
let newHighScore = false;

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
let countdown = 0;
let countdownFrames = 0;
let countdownStartTime = 0;
let isCountingDown = false;

const countdownScreen = document.getElementById("countdownScreen");
const countdownText = document.getElementById("countdownText");

startButton.addEventListener("click", function(){
    initAudio();

    gameStarted = true;
    startScreen.style.display = "none";
    startCountDown();
});

soundButton.addEventListener("click", function(){
    soundEnabled = !soundEnabled;
    localStorage.setItem("oneMoreTrySound", soundEnabled);

    if(soundEnabled){
        soundButton.textContent = "🔊 Sound ON";
    } else {
        soundButton.textContent = "🔇 Sound OFF";
    }
});

restartButton.addEventListener("click",restartGame);

const player = {
    x : 400,
    y: 400,
    size: 14,
    speed: 0,
    maxSpeed: 5,
    acceleration: 0.6,
    friction: 0.8,
    color: "#63f7ff"
};

const keys = {
    left: false,
    right: false
}

const obstacles = [];
const coins =[];
const shields = [];
const particles = [];

let hasShield=false;
let shieldTimer = 0;
let shieldActive = false;
let obstacleTimer = 0;
let gameOver = false;
let score =0;

let combo =0;
let lastCoinTime = 0;
let comboTimer = 200;

let difficulty =1;
let shakeTime = 0;
let shakeStrength = 8;

function drawBackground() {
    ctx.fillStyle = "#0d0d20";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#63f7ff";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
        "LEVEL: " + (Math.floor(score / 5) +1),
        20,
        30
    );

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
        player.speed -= player.acceleration;
    }
    if(keys.right){
        player.speed += player.acceleration;
    }
    if(!keys.left && !keys.right){
        player.speed *= player.friction;
    }
    if(player.speed > player.maxSpeed){
        player.speed = player.maxSpeed;
    }
    if(player.speed < -player.maxSpeed){
        player.speed = -player.maxSpeed;
    }
    player.x +=player.speed;

    if(player.x < player.size){
        player.x = player.size;
        player.speed =0;
    }
    if(player.x > canvas.width - player.size){
        player.x = canvas.width - player.size;
        player.speed = 0;
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

function createParticles(x,y){
    for( let i =0; i<12; i++){
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;

        particles.push({
            x:x,
            y:y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            size: Math.random() * 3 + 2,
            life:30
        });
    }
}
function updateParticles(){
    for(let i = particles.length -1; i >= 0; i--){
        const particle = particles[i];
        particle.x +=particle.dx;
        particle.y += particle.dy;
        particle.life--;
        if(particle.life <= 0){
            particles.splice(i,1);
        }
    }
}
function drawParticles(){
    ctx.save();
    for(let i = 0; i< particles.length; i++){
        const particle = particles[i];
        ctx.globalAlpha = particle.life / 30;
        ctx.fillStyle = "#ffd166";
        ctx.shadowColor = "#ffd166";
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    ctx.restore();
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
            createParticles(coin.x, coin.y);
            playCoinSound();

            const currentTime = performance.now();

            if(currentTime - lastCoinTime < comboTimer){
                combo++;
            } else {
                combo =1;
            }
            lastCoinTime = currentTime;

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

            playShieldSound();
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
                shakeTime = 12;
                playCollisionSound();

                gameOver = true;
                break;
            }
        } 
    }
}

function drawScore(){
    currentScoreDisplay.textContent = score;
    if(score>bestScore){
        if(!newHighScore){
            playHighScoreSound();
        }

        newHighScore = true;
        bestScore=score;
        
        bestScoreDisplay.textContent = bestScore;
        localStorage.setItem("oneMoreTryBest",bestScore);
    }
    ctx.fillStyle = "#63f7ff";
    ctx.font = "14px Arial";
    ctx.fillText(
        "LEVEL: "+(Math.floor(score / 5)+1),
        20,
        30
    );

    if(combo >1 && performance.now() - lastCoinTime < comboTimer){
        ctx.save();

        ctx.fillStyle = "#ffd166";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ffd166";
        ctx.shadowBlur = 12;

        ctx.fillText(
            combo + "x COMBO!",
            canvas.width / 2,
            70
        );
        ctx.restore();
    }

    if(hasShield){
        ctx.fillStyle = "#63f7ff";
        ctx.font = "14px Arial";
        ctx.fillText("SHIELD READY", 20, 72);
    }
}

function restartGame(){
    initAudio();
    restartButton.style.display = "none";

    player.x = canvas.width /2;
    player.y = 400;
    player.speed=0;
    obstacles.length = 0 ;
    coins.length = 0;
    shields.length =0 ;
    particles.length=0;
    hasShield=false;
    shieldTimer = 0;
    shieldActive = false;
    obstacleTimer = 0;
    score=0;
    newHighScore = false;
    shakeTime =0;
    difficulty = 1;
    gameOver= false;
    keys.left = false;
    keys.right = false;
    startScreen.style.display = "none";
    gameStarted = true;
    isPaused = false;
    pauseScreen.style.display = "none";
    startCountDown();
}

function startCountDown(){
    countdown  = 3;
    countdownStartTime = performance.now();
    isCountingDown = true;
    countdownScreen.style.display = "flex";
    countdownText.textContent = countdown;
}

function gameLoop(){
    ctx.save();
    if(shakeTime > 0){
        const intensity = (shakeTime / 12) * shakeStrength;

        const shakeX = (Math.random() - 0.5)*intensity;
        const shakeY = (Math.random() - 0.5)*intensity;

        ctx.translate(shakeX,shakeY);
        shakeTime--;
    }
    drawBackground();
    if(!gameStarted){
        ctx.restore();
        requestAnimationFrame(gameLoop);
        return;
    }
    if(isPaused){
        ctx.restore();
        requestAnimationFrame(gameLoop);
        return;
    }
    if(isCountingDown){
        const elapsed = performance.now() - countdownStartTime;
        countdown = 3 - Math.floor(elapsed/1000);

        if(countdown>0){
            countdownText.textContent = countdown;
        } else if(elapsed < 4000){
            countdownText.textContent = "GO!";
        } else {
            isCountingDown=false;
            countdownScreen.style.display ="none";
        }
        ctx.restore();
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
        updateParticles();
        checkCollision();

        drawCoins();
        drawParticles();
        drawShields();
        drawPlayer();
        drawObstacles();
        drawScore();
    } else {
        restartButton.style.display = "block";
        drawObstacles();
        drawPlayer();

        ctx.fillStyle = "rgba(5,5,20,0.8)";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        ctx.textAlign = "center";

        ctx.fillStyle = "#ff4d8d";
        ctx.font = "bold 44px Arial";
        ctx.shadowColor = "#ff4d8d";
        ctx.shadowBlur = 15;

        if(newHighScore){
            const glow = Math.sin(performance.now() / 200) *5 +15;

            ctx.save();
            ctx.fillStyle = "#ffd166";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.shadowColor = "#ffd166";
            ctx.shadowBlur = glow;

            ctx.fillText(
                "NEW HIGH SCORE",
                canvas.width  /2,
                140
            );
            ctx.restore();
        }

        ctx.fillText("GAME OVER", canvas.width / 2, 180);

        ctx.shadowBlur=0;

        ctx.fillStyle = "#63f7ff";
        ctx.font="bold 22px Arial";

        ctx.fillText(
            "SCORE: "+score,
            canvas.width / 2,
            220
        );

        ctx.fillStyle = "#a5a5c7";
        ctx.font = "15px Arial";

        ctx.fillText(
            "Every run makes you better.",
            canvas.width / 2,
            260
        );

        ctx.fillText(
            "Press ENTER or click PLAY AGAIN",
            canvas.width /2,
            290
        );

        ctx.textAlign = "left";
    }
    ctx.restore();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", function(event) {
    if(event.key.toLowerCase()==="p" &&
        gameStarted && 
        !gameOver &&
        !isCountingDown &&
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

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

leftButton.addEventListener("pointerdown", function(event){
    event.preventDefault();
    keys.left = true;
});

rightButton.addEventListener("pointerdown", function(event){
    event.preventDefault();
    keys.right = true;
});

function stopLeftMovement(){
    keys.left = false;
}
function stopRightMovement(){
    keys.right = false;
}

leftButton.addEventListener("pointerup", stopLeftMovement);
leftButton.addEventListener("pointercancel", stopLeftMovement);
leftButton.addEventListener("pointerleave", stopLeftMovement);

rightButton.addEventListener("pointerup", stopRightMovement);
rightButton.addEventListener("pointercancel", stopRightMovement);
rightButton.addEventListener("pointerleave", stopRightMovement);

gameLoop();