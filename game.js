const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// ---------------- GAME STATE ----------------
let gameOver = false;

// ---------------- PLAYER ----------------
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 30,
  speed: 6,
  dx: 0,
  health: 3,
  hitCooldown: 0
};

// ---------------- ARRAYS ----------------
let bullets = [];
let enemies = [];
let enemyBullets = [];
let particles = [];

let score = 0;

// ---------------- EFFECTS ----------------
let shootCooldown = 0;
let shake = 0;

// ---------------- INPUT ----------------
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "a") player.dx = -player.speed;
  if (e.key.toLowerCase() === "d") player.dx = player.speed;

  if (e.key === " " && !gameOver) shoot();

  if (gameOver && e.key.toLowerCase() === "r") restartGame();
});

document.addEventListener("keyup", (e) => {
  if (e.key.toLowerCase() === "a" || e.key.toLowerCase() === "d") {
    player.dx = 0;
  }
});

// ---------------- FUNCTIONS ----------------
function shoot() {
  if (shootCooldown > 0) return;

  // single center bullet
  bullets.push({
    x: player.x + player.width / 2 - 3,
    y: player.y,
    width: 6,
    height: 10,
    speed: 7
  });

  shootCooldown = 10;
  shake = 3;
}

function enemyShoot(enemy) {
  if (enemy.type === "double") {
    enemyBullets.push({
      x: enemy.x + 5,
      y: enemy.y + enemy.height,
      width: 5,
      height: 10,
      speed: 4
    });

    enemyBullets.push({
      x: enemy.x + enemy.width - 10,
      y: enemy.y + enemy.height,
      width: 5,
      height: 10,
      speed: 4
    });
  } else {
    enemyBullets.push({
      x: enemy.x + enemy.width / 2 - 3,
      y: enemy.y + enemy.height,
      width: 6,
      height: 10,
      speed: 4
    });
  }
}

function spawnEnemy() {
  if (gameOver) return;

  enemies.push({
    x: Math.random() * (canvas.width - 40),
    y: 0,
    width: 40,
    height: 30,
    speed: 2 + Math.random() * 1.5,
    type: Math.random() < 0.3 ? "double" : "normal"
  });
}

function createExplosion(x, y) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x,
      y,
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4,
      life: 30
    });
  }
}

// ---------------- UPDATE ----------------
function update() {
  if (gameOver) return;

  // movement
  player.x += player.dx;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // LOCK Y (fix disappearing bug)
  player.y = canvas.height - 60;

  // cooldowns
  if (shootCooldown > 0) shootCooldown--;
  if (player.hitCooldown > 0) player.hitCooldown--;

  // bullets
  bullets = bullets.filter(b => {
    b.y -= b.speed;
    return b.y > 0;
  });

  // enemies
  enemies = enemies.filter(e => {
    e.y += e.speed;

    if (Math.random() < 0.02) enemyShoot(e);

    if (
      player.x < e.x + e.width &&
      player.x + player.width > e.x &&
      player.y < e.y + e.height &&
      player.y + player.height > e.y
    ) {
      createExplosion(player.x, player.y);
      gameOver = true;
    }

    return e.y < canvas.height;
  });

  // enemy bullets
  let newEnemyBullets = [];

  enemyBullets.forEach((b) => {
    b.y += b.speed;

    let hit =
      player.x < b.x + b.width &&
      player.x + player.width > b.x &&
      player.y < b.y + b.height &&
      player.y + player.height > b.y;

    if (hit && player.hitCooldown <= 0) {
      player.health--;
      player.hitCooldown = 20;
      createExplosion(player.x, player.y);
      shake = 6;

      if (player.health <= 0) gameOver = true;

    } else if (b.y < canvas.height) {
      newEnemyBullets.push(b);
    }
  });

  enemyBullets = newEnemyBullets;

  // bullet vs enemy
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        createExplosion(e.x, e.y);
        score += e.type === "double" ? 20 : 10;

        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
      }
    });
  });

  // particles
  particles = particles.filter(p => {
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
    return p.life > 0;
  });
}

// ---------------- DRAW ----------------
function draw() {
  ctx.save();

  let dx = (Math.random() - 0.5) * shake;
  let dy = (Math.random() - 0.5) * shake;
  ctx.translate(dx, dy);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // player (GREEN)
  ctx.fillStyle = player.hitCooldown > 0 ? "white" : "lime";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "darkgreen";
  ctx.fillRect(player.x + player.width / 2 - 5, player.y - 5, 10, 5);

  // bullets
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  // enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.type === "double" ? "purple" : "red";
    ctx.fillRect(e.x, e.y, e.width, e.height);
  });

  // enemy bullets
  ctx.fillStyle = "white";
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  // particles
  ctx.fillStyle = "orange";
  particles.forEach(p => ctx.fillRect(p.x, p.y, 3, 3));

  // UI
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 25);
  ctx.fillText("Health: " + player.health, 10, 50);

  if (gameOver) {
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 130, canvas.height / 2);

    ctx.font = "20px Arial";
    ctx.fillText("Press R to Restart", canvas.width / 2 - 100, canvas.height / 2 + 40);
  }

  ctx.restore();

  if (shake > 0) shake--;
}

// ---------------- LOOP ----------------
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(spawnEnemy, 1000);
gameLoop();

// ---------------- RESET ----------------
function restartGame() {
  player.x = canvas.width / 2 - 25;
  player.y = canvas.height - 60;
  player.health = 3;
  player.hitCooldown = 0;

  bullets = [];
  enemies = [];
  enemyBullets = [];
  particles = [];

  score = 0;
  shootCooldown = 0;
  shake = 0;

  gameOver = false;
}