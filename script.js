const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const brickWidth = 32; 
const brickHeight = 16;  

let mapa = [
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0]
];

const SPEED_LEVELS = [4, 8, 12];

let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    side: 6,
    dx: 1,
    dy: -1,
    speedLevel: 0, 
    caughtBy: null, 
    lastHitBy: null
};

let kings = {
    p1: { x: 10, y: canvas.height - 25, width: 20, height: 20, alive: true, color: '#000dff' },
    p2: { x: canvas.width - 30, y: 5, width: 20, height: 20, alive: true, color: '#ff0000' }
};

let shields = {
    p1: {
        radius: 120,
        cx: 0,
        cy: canvas.height,
        width: 35,
        height: 35,
        arcPos: 0.25,
        holdingCatch: false
    },
    p2: {
        radius: 120,
        cx: canvas.width,
        cy: 0,
        width: 35,
        height: 35,
        arcPos: 0.25,
        holdingCatch: false
    }
};

let keys = {};

window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'wall') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'brick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'catch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'throw') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'kingHit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// Alterna a velocidade da bola: Nível 1 -> Nível 2 -> Nível 3 -> Nível 1
function applyImpactSpeedChange() {
    if (ball.speedLevel < 2) {
        ball.speedLevel++; 
    } else {
        ball.speedLevel = 0; 
    }
}

function reverseBallDirection() {
    ball.dx = -ball.dx;
    ball.dy = -ball.dy;
}

function updateShields() {
    if (keys['KeyD'] || keys['ArrowLeft']) shields.p1.arcPos = Math.max(0.05, shields.p1.arcPos - 0.025);
    if (keys['KeyA'] || keys['ArrowRight']) shields.p1.arcPos = Math.min(0.45, shields.p1.arcPos + 0.025);
    shields.p1.holdingCatch = !!(keys['KeyW'] || keys['Space'] || keys['ArrowUp']);

    if (keys['KeyJ']) shields.p2.arcPos = Math.max(0.05, shields.p2.arcPos - 0.025);
    if (keys['KeyL']) shields.p2.arcPos = Math.min(0.45, shields.p2.arcPos + 0.025);
    shields.p2.holdingCatch = !!(keys['KeyI'] || keys['ShiftRight'] || keys['ShiftLeft'] || keys['KeyK']);

    let angleP1 = shields.p1.arcPos * Math.PI;
    shields.p1.x = shields.p1.cx + Math.cos(angleP1) * shields.p1.radius - shields.p1.width / 2;
    shields.p1.y = shields.p1.cy - Math.sin(angleP1) * shields.p1.radius - shields.p1.height / 2;

    let angleP2 = Math.PI + shields.p2.arcPos * Math.PI;
    shields.p2.x = shields.p2.cx + Math.cos(angleP2) * shields.p2.radius - shields.p2.width / 2;
    shields.p2.y = shields.p2.cy - Math.sin(angleP2) * shields.p2.radius - shields.p2.height / 2;
}

function handleCatchAndThrow() {
    if (ball.caughtBy === 1) {
        ball.x = shields.p1.x + shields.p1.width / 2;
        ball.y = shields.p1.y - 8;

        if (!shields.p1.holdingCatch) {
            let targetX = kings.p2.x;
            let targetY = kings.p2.y;
            let angle = Math.atan2(targetY - ball.y, targetX - ball.x);
            
            ball.dx = Math.cos(angle);
            ball.dy = Math.sin(angle);
            
            // Regra do Arremesso: Aumenta a velocidade, sem exceder o nível 3
            if (ball.speedLevel < 2) {
                ball.speedLevel++;
            }
            
            ball.caughtBy = null;
            ball.lastHitBy = 1;
            playSound('throw');
        }
    } else if (ball.caughtBy === 2) {
        ball.x = shields.p2.x + shields.p2.width / 2;
        ball.y = shields.p2.y + shields.p2.height + 8;

        if (!shields.p2.holdingCatch) {
            let targetX = kings.p1.x;
            let targetY = kings.p1.y;
            let angle = Math.atan2(targetY - ball.y, targetX - ball.x);
            
            ball.dx = Math.cos(angle);
            ball.dy = Math.sin(angle);
            
            if (ball.speedLevel < 2) {
                ball.speedLevel++;
            }
            
            ball.caughtBy = null;
            ball.lastHitBy = 2;
            playSound('throw');
        }
    }
}

function collisionDetection() {
    if (!mapa || mapa.length === 0 || ball.caughtBy) return;

    for (let r = 0; r < mapa.length; r++) {
        for (let c = 0; c < mapa[r].length; c++) {
            if (mapa[r][c] === 1) {
                let brickX = c * brickWidth;
                let brickY = r * brickHeight;

                if (
                    ball.x < brickX + brickWidth && 
                    ball.x + ball.side > brickX && 
                    ball.y < brickY + brickHeight && 
                    ball.y + ball.side > brickY
                ) {
                    mapa[r][c] = 0; 
                    reverseBallDirection(); // Inverte o sentido no tijolo
                    applyImpactSpeedChange(); // Altera o nível de velocidade
                    playSound('brick');
                    return; 
                }
            }
        }
    }
}

function checkShieldCollisions() {
    if (ball.caughtBy) return;

    if (
        ball.x < shields.p1.x + shields.p1.width &&
        ball.x + ball.side > shields.p1.x &&
        ball.y < shields.p1.y + shields.p1.height &&
        ball.y + ball.side > shields.p1.y
    ) {
        if (shields.p1.holdingCatch) {
            ball.caughtBy = 1;
            playSound('catch');
        } else {
            reverseBallDirection();
            ball.lastHitBy = 1;
            playSound('wall');
        }
    }

    if (
        ball.x < shields.p2.x + shields.p2.width &&
        ball.x + ball.side > shields.p2.x &&
        ball.y < shields.p2.y + shields.p2.height &&
        ball.y + ball.side > shields.p2.y
    ) {
        if (shields.p2.holdingCatch) {
            ball.caughtBy = 2;
            playSound('catch');
        } else {
            reverseBallDirection();
            ball.lastHitBy = 2;
            playSound('wall');
        }
    }
}

function checkKingCollisions() {
    if (kings.p1.alive && 
        ball.x < kings.p1.x + kings.p1.width &&
        ball.x + ball.side > kings.p1.x &&
        ball.y < kings.p1.y + kings.p1.height &&
        ball.y + ball.side > kings.p1.y
    ) {
        kings.p1.alive = false;
        playSound('kingHit');
    }

    if (kings.p2.alive && 
        ball.x < kings.p2.x + kings.p2.width &&
        ball.x + ball.side > kings.p2.x &&
        ball.y < kings.p2.y + kings.p2.height &&
        ball.y + ball.side > kings.p2.y
    ) {
        kings.p2.alive = false;
        playSound('kingHit');
    }
}

function update() {
    updateShields();

    if (ball.caughtBy) {
        handleCatchAndThrow();
        return;
    }

    let currentSpeed = SPEED_LEVELS[ball.speedLevel];
    
    let mag = Math.hypot(ball.dx, ball.dy) || 1;
    let moveX = (ball.dx / mag) * currentSpeed;
    let moveY = (ball.dy / mag) * currentSpeed;

    ball.x += moveX;
    ball.y += moveY;

    // Rebote nos limites do mapa + alteração do Nível de Velocidade
    let hitWall = false;
    if (ball.x <= 0) {
        ball.x = 0;
        ball.dx = -ball.dx; 
        hitWall = true;
    } else if (ball.x + ball.side >= canvas.width) {
        ball.x = canvas.width - ball.side;
        ball.dx = -ball.dx; 
        hitWall = true;
    }

    if (ball.y <= 0) {
        ball.y = 0;
        ball.dy = -ball.dy; 
        hitWall = true;
    } else if (ball.y + ball.side >= canvas.height) {
        ball.y = canvas.height - ball.side;
        ball.dy = -ball.dy; 
        hitWall = true;
    }

    if (hitWall) {
        applyImpactSpeedChange(); // Altera velocidade ao bater nos limites do mapa
        playSound('wall');
    }

    checkShieldCollisions();
    collisionDetection();
    checkKingCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar Tijolos
    for (let r = 0; r < mapa.length; r++) {
        for (let c = 0; c < mapa[r].length; c++) {
            if (mapa[r][c] === 1) {
                let brickX = c * brickWidth;
                let brickY = r * brickHeight;

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth - 1, brickHeight - 1);
                ctx.fillStyle = (r < 8) ? "#ff0000" : "#000dff";
                ctx.fill();
                ctx.closePath();
            }
        }
    }

    // Desenhar Reis
    if (kings.p1.alive) {
        ctx.fillStyle = kings.p1.color;
        ctx.fillRect(kings.p1.x, kings.p1.y, kings.p1.width, kings.p1.height);
        ctx.fillStyle = "#fff";
        ctx.font = "10px monospace";
        ctx.fillText("P1", kings.p1.x + 4, kings.p1.y + 14);
    }

    if (kings.p2.alive) {
        ctx.fillStyle = kings.p2.color;
        ctx.fillRect(kings.p2.x, kings.p2.y, kings.p2.width, kings.p2.height);
        ctx.fillStyle = "#fff";
        ctx.font = "10px monospace";
        ctx.fillText("P2", kings.p2.x + 4, kings.p2.y + 14);
    }

    // Desenhar Escudos
    ctx.fillStyle = shields.p1.holdingCatch ? '#fff' : kings.p1.color;
    ctx.fillRect(shields.p1.x, shields.p1.y, shields.p1.width, shields.p1.height);

    ctx.fillStyle = shields.p2.holdingCatch ? '#fff' : kings.p2.color;
    ctx.fillRect(shields.p2.x, shields.p2.y, shields.p2.width, shields.p2.height);

    // Desenhar Bola
    ctx.beginPath();
    ctx.rect(ball.x, ball.y, ball.side, ball.side);
    if (ball.speedLevel === 0) {
        ctx.fillStyle = "#00ff66"; 
    } else if (ball.speedLevel === 1) {
        ctx.fillStyle = "#ffaa00"; 
    } else {
        ctx.fillStyle = "#ff0055"; 
    }
    ctx.fill();
    ctx.closePath();

    // Indicador HUD
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`VELOCIDADE: NÍVEL ${ball.speedLevel + 1}`, canvas.width / 2 - 65, 18);

    // Fim de Jogo
    if (!kings.p1.alive || !kings.p2.alive) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffcc00";
        ctx.font = "20px monospace";
        ctx.textAlign = "center";
        
        let winner = !kings.p1.alive ? "JOGADOR 2 VENCEU!" : "JOGADOR 1 VENCEU!";
        ctx.fillText(winner, canvas.width / 2, canvas.height / 2 - 10);
        
        ctx.font = "11px monospace";
        ctx.fillStyle = "#fff";
        ctx.fillText("Recarregue a página para reiniciar", canvas.width / 2, canvas.height / 2 + 20);
    }
}

function gameLoop() {
    if (kings.p1.alive && kings.p2.alive) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();