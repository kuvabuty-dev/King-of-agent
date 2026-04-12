// Game Constants
const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

CANVAS.width = GAME_WIDTH;
CANVAS.height = GAME_HEIGHT;

// Game States
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

// Game Variables
let gameState = GAME_STATE.MENU;
let score = 0;
let wave = 1;
let waveKills = 0;
let gameTime = 0;

// Player Object
const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    width: 25,
    height: 25,
    speed: 5,
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
    reloading: false,
    reloadTime: 0,
    maxReloadTime: 30,
    specialReady: false,
    kills: 0
};

// Input handling
const keys = {};
let mouseX = GAME_WIDTH / 2;
let mouseY = GAME_HEIGHT / 2;

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
        e.preventDefault();
        reloadWeapon();
    }
    if (e.key.toLowerCase() === 'e' && player.specialReady) {
        useSpecialAbility();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('click', (e) => {
    if (gameState === GAME_STATE.PLAYING) {
        shoot();
    }
});

// Bullets Array
let bullets = [];

// Enemies Array
let enemies = [];

// Particles Array
let particles = [];

// Player Movement
function updatePlayer() {
    if (keys['arrowup'] || keys['w']) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['arrowdown'] || keys['s']) {
        player.y = Math.min(GAME_HEIGHT - player.height, player.y + player.speed);
    }
    if (keys['arrowleft'] || keys['a']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keys['arrowright'] || keys['d']) {
        player.x = Math.min(GAME_WIDTH - player.width, player.x + player.speed);
    }

    // Handle reloading
    if (player.reloading) {
        player.reloadTime--;
        if (player.reloadTime <= 0) {
            player.ammo = player.maxAmmo;
            player.reloading = false;
        }
    }
}

function drawPlayer() {
    // Player body
    CTX.fillStyle = '#00AA00';
    CTX.fillRect(player.x, player.y, player.width, player.height);

    // Player outline
    CTX.strokeStyle = '#00FF00';
    CTX.lineWidth = 2;
    CTX.strokeRect(player.x, player.y, player.width, player.height);

    // Gun barrel
    const angle = Math.atan2(mouseY - (player.y + player.height / 2), mouseX - (player.x + player.width / 2));
    const gunLength = 20;
    const gunEndX = player.x + player.width / 2 + Math.cos(angle) * gunLength;
    const gunEndY = player.y + player.height / 2 + Math.sin(angle) * gunLength;

    CTX.strokeStyle = '#00FF00';
    CTX.lineWidth = 3;
    CTX.beginPath();
    CTX.moveTo(player.x + player.width / 2, player.y + player.height / 2);
    CTX.lineTo(gunEndX, gunEndY);
    CTX.stroke();

    // Health bar
    const healthBarWidth = 40;
    const healthBarHeight = 5;
    CTX.fillStyle = '#333';
    CTX.fillRect(player.x - healthBarWidth / 2 + player.width / 2, player.y - 15, healthBarWidth, healthBarHeight);
    CTX.fillStyle = player.health > 50 ? '#00FF00' : player.health > 25 ? '#FFFF00' : '#FF0000';
    CTX.fillRect(player.x - healthBarWidth / 2 + player.width / 2, player.y - 15, (healthBarWidth * player.health) / player.maxHealth, healthBarHeight);
}

// Shooting
function shoot() {
    if (player.reloading || player.ammo <= 0) return;

    player.ammo--;
    const angle = Math.atan2(mouseY - (player.y + player.height / 2), mouseX - (player.x + player.width / 2));

    bullets.push({
        x: player.x + player.width / 2 + Math.cos(angle) * 15,
        y: player.y + player.height / 2 + Math.sin(angle) * 15,
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7,
        radius: 3,
        lifetime: 300
    });

    createParticles(player.x + player.width / 2, player.y + player.height / 2, 5, '#FFFF00');
}

function reloadWeapon() {
    if (!player.reloading && player.ammo < player.maxAmmo) {
        player.reloading = true;
        player.reloadTime = player.maxReloadTime;
    }
}

function useSpecialAbility() {
    if (!player.specialReady) return;

    // Create explosion effect
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < 200) {
            enemy.health -= 50;
            createParticles(enemy.x, enemy.y, 10, '#FF6600');
            if (enemy.health <= 0) {
                enemies.splice(i, 1);
                score += enemy.points;
                player.kills++;
                waveKills++;
                i--;
            }
        }
    }

    player.specialReady = false;
    player.kills = 0;
}

// Bullets
function updateBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.lifetime--;

        // Remove if off-screen or lifetime expired
        if (bullet.lifetime <= 0 || bullet.x < 0 || bullet.x > GAME_WIDTH || bullet.y < 0 || bullet.y > GAME_HEIGHT) {
            bullets.splice(i, 1);
            i--;
            continue;
        }

        // Check collision with enemies
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < bullet.radius + enemy.radius) {
                enemy.health -= 10;
                createParticles(bullet.x, bullet.y, 8, '#FF6600');
                bullets.splice(i, 1);
                i--;

                if (enemy.health <= 0) {
                    enemies.splice(j, 1);
                    score += enemy.points;
                    player.kills++;
                    waveKills++;
                    if (player.kills % 10 === 0) {
                        player.specialReady = true;
                    }
                }
                break;
            }
        }
    }
}

function drawBullets() {
    CTX.fillStyle = '#FFFF00';
    for (const bullet of bullets) {
        CTX.beginPath();
        CTX.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        CTX.fill();
    }
}

// Enemies
function spawnEnemies() {
    const enemyCount = Math.min(5 + wave * 2, 20);
    if (enemies.length < enemyCount && Math.random() < 0.02 * wave) {
        const side = Math.floor(Math.random() * 4);
        let x, y;

        if (side === 0) { // top
            x = Math.random() * GAME_WIDTH;
            y = -20;
        } else if (side === 1) { // right
            x = GAME_WIDTH + 20;
            y = Math.random() * GAME_HEIGHT;
        } else if (side === 2) { // bottom
            x = Math.random() * GAME_WIDTH;
            y = GAME_HEIGHT + 20;
        } else { // left
            x = -20;
            y = Math.random() * GAME_HEIGHT;
        }

        enemies.push({
            x: x,
            y: y,
            radius: 10,
            speed: 2 + Math.random() * wave,
            health: 30 + wave * 10,
            maxHealth: 30 + wave * 10,
            points: 10 * wave,
            shootTimer: 0,
            shootInterval: 100
        });
    }
}

function updateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];

        // Move towards player
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Enemy shooting
        enemy.shootTimer++;
        if (enemy.shootTimer > enemy.shootInterval) {
            const bulletAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            bullets.push({
                x: enemy.x + Math.cos(bulletAngle) * 10,
                y: enemy.y + Math.sin(bulletAngle) * 10,
                vx: Math.cos(bulletAngle) * 4,
                vy: Math.sin(bulletAngle) * 4,
                radius: 2,
                lifetime: 300,
                isEnemyBullet: true
            });
            enemy.shootTimer = 0;
        }

        // Check collision with player
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < enemy.radius + player.width / 2) {
            player.health -= 1;
            if (player.health <= 0) {
                endGame();
            }
        }
    }

    // Check player bullets hitting player (enemy bullets)
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        if (bullet.isEnemyBullet) {
            const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
            if (dist < bullet.radius + player.width / 2) {
                player.health -= 5;
                bullets.splice(i, 1);
                i--;
                if (player.health <= 0) {
                    endGame();
                }
            }
        }
    }
}

function drawEnemies() {
    for (const enemy of enemies) {
        // Enemy body
        CTX.fillStyle = '#FF0000';
        CTX.beginPath();
        CTX.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        CTX.fill();

        // Enemy outline
        CTX.strokeStyle = '#FF4444';
        CTX.lineWidth = 2;
        CTX.stroke();

        // Health bar
        const healthBarWidth = 25;
        const healthBarHeight = 3;
        CTX.fillStyle = '#333';
        CTX.fillRect(enemy.x - healthBarWidth / 2, enemy.y - 20, healthBarWidth, healthBarHeight);
        CTX.fillStyle = '#00FF00';
        CTX.fillRect(enemy.x - healthBarWidth / 2, enemy.y - 20, (healthBarWidth * enemy.health) / enemy.maxHealth, healthBarHeight);
    }
}

// Particles
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            lifetime: 30,
            color: color
        });
    }
}

function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.lifetime--;

        if (particle.lifetime <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

function drawParticles() {
    for (const particle of particles) {
        CTX.fillStyle = particle.color;
        CTX.globalAlpha = particle.lifetime / 30;
        CTX.fillRect(particle.x, particle.y, 3, 3);
        CTX.globalAlpha = 1;
    }
}

// Wave Management
function updateWave() {
    if (enemies.length === 0 && waveKills >= 5 + wave * 3) {
        wave++;
        waveKills = 0;
        player.health = Math.min(player.health + 20, player.maxHealth);
        player.ammo = player.maxAmmo;
    }
}

// UI Update
function updateUI() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('health').textContent = `Health: ${player.health}`;
    document.getElementById('wave').textContent = `Wave: ${wave}`;
    document.getElementById('ammo').textContent = `Ammo: ${player.ammo}${player.reloading ? ' (Reloading)' : ''}`;
}

// Game End
function endGame() {
    gameState = GAME_STATE.GAME_OVER;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('waveReached').textContent = wave;
}

// Start Game
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    gameState = GAME_STATE.PLAYING;
    gameLoop();
}

// Main Game Loop
function gameLoop() {
    // Clear canvas
    CTX.fillStyle = 'rgba(30, 60, 114, 0.1)';
    CTX.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (gameState === GAME_STATE.PLAYING) {
        updatePlayer();
        updateBullets();
        spawnEnemies();
        updateEnemies();
        updateParticles();
        updateWave();

        drawPlayer();
        drawBullets();
        drawEnemies();
        drawParticles();

        updateUI();
    }

    requestAnimationFrame(gameLoop);
}

// Handle window resize
window.addEventListener('resize', () => {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
});