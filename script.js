/* ================= FIREBASE v12 ================= */
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAiewnQoIiEEU-lj1iA_g2V-CD2DV6ikJQ",
  authDomain: "game-1973e.firebaseapp.com",
  projectId: "game-1973e",
  storageBucket: "game-1973e.firebasestorage.app",
  messagingSenderId: "713228551610",
  appId: "1:713228551610:web:3108b0166542c2bc8c4983"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= GAME ================= */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const leaderboardList = document.getElementById("leaderboardList");

let box = 20;
let snake, direction, food, score;
let game;
let isPaused = false;

/* ---------- CANVAS ---------- */
function resizeCanvas() {
  const size = Math.min(window.innerWidth, 420) - 40;
  canvas.width = Math.floor(size / 20) * 20;
  canvas.height = canvas.width;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ---------- INIT ---------- */
function init() {
  snake = [{ x: 9 * box, y: 10 * box }];
  direction = "RIGHT";
  score = 0;
  scoreDisplay.textContent = score;
  food = generateFood();
}

/* ---------- FOOD ---------- */
function generateFood() {
  return {
    x: Math.floor(Math.random() * (canvas.width / box)) * box,
    y: Math.floor(Math.random() * (canvas.height / box)) * box
  };
}

/* ---------- CONTROLS ---------- */
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
});

window.setDirection = dir => {
  if (dir === "UP" && direction !== "DOWN") direction = "UP";
  if (dir === "DOWN" && direction !== "UP") direction = "DOWN";
  if (dir === "LEFT" && direction !== "RIGHT") direction = "LEFT";
  if (dir === "RIGHT" && direction !== "LEFT") direction = "RIGHT";
};

/* ---------- LEADERBOARD (FIXED) ---------- */
async function saveScore(name, score) {
  await addDoc(collection(db, "leaderboard"), {
    name,
    score,
    createdAt: serverTimestamp()
  });
  loadLeaderboard();
}

async function loadLeaderboard() {
  leaderboardList.innerHTML = "";

  const q = query(
    collection(db, "leaderboard"),
    orderBy("score", "desc"),
    limit(5)
  );

  const snapshot = await getDocs(q);

  let rank = 1; // ✅ FIXED (no NaN)

  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${rank}. ${data.name}</span>
      <b>${data.score}</b>
    `;
    leaderboardList.appendChild(li);
    rank++;
  });
}

loadLeaderboard();

/* ---------- GAME LOOP ---------- */
function drawGame() {
  if (isPaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  snake.forEach((p, i) => {
    ctx.fillStyle = i === 0 ? "#00ff88" : "#00cc6f";
    ctx.fillRect(p.x, p.y, box, box);
  });

  ctx.fillStyle = "#ff4757";
  ctx.fillRect(food.x, food.y, box, box);

  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === "UP") headY -= box;
  if (direction === "DOWN") headY += box;
  if (direction === "LEFT") headX -= box;
  if (direction === "RIGHT") headX += box;

  if (headX === food.x && headY === food.y) {
    score++;
    scoreDisplay.textContent = score;
    food = generateFood();
  } else {
    snake.pop();
  }

  const newHead = { x: headX, y: headY };

  if (
    headX < 0 || headY < 0 ||
    headX >= canvas.width || headY >= canvas.height ||
    snake.some(p => p.x === newHead.x && p.y === newHead.y)
  ) {
    clearInterval(game);
    const name = document.getElementById("playerName").value || "Anonymous";
    saveScore(name, score);
    alert(`Game Over!\n${name}: ${score}`);
    return;
  }

  snake.unshift(newHead);
}

/* ---------- BUTTONS ---------- */
window.startGame = () => {
  clearInterval(game);
  isPaused = false;
  init();
  game = setInterval(drawGame, 120);
};

window.pauseGame = () => {
  isPaused = !isPaused;
};

window.resetGame = () => {
  clearInterval(game);
  isPaused = false;
  init();
  game = setInterval(drawGame, 120);
};
