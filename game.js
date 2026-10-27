const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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

function gameLoop(){
    drawBackground();
    movePlayer();
    drawPlayer();
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", function(event) {
    if(event.key === "ArrowLeft" || event.key.toLowerCase()==="a"){
        keys.left = true;
        event.preventDefault();
    }
    if(event.key === "ArrowRight" || event.key.toLowerCase()==="d"){
        keys.right = true;
        event.preventDefault();
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