/**
 * game.js — 贪吃蛇游戏核心逻辑
 * 负责游戏循环、蛇移动、食物生成、碰撞检测和 Canvas 渲染
 */

// ========== 常量 ==========
const GRID_SIZE = 20;       // 网格大小（格子数）
const CELL_SIZE = 20;       // 每格像素大小
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 画布总像素
const GAME_SPEED = 130;     // 游戏速度（毫秒/帧）
const SCORE_PER_FOOD = 10;  // 每个食物得分

// ========== 游戏状态 ==========
let canvas, ctx;
let currentUser = null;

let snake = [];           // 蛇身坐标数组 [{ x, y }]
let food = { x: 0, y: 0 };
let direction = 'RIGHT';  // 当前方向
let nextDirection = 'RIGHT'; // 下一步方向（防止同帧多次转向）
let score = 0;
let gameLoop = null;
let isRunning = false;
let isPaused = false;

// ========== 初始化 ==========

/**
 * 页面加载时初始化
 */
window.addEventListener('DOMContentLoaded', function () {
  // 检查登录态
  currentUser = sessionStorage.getItem('snake_current_user');
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  // 设置用户信息
  document.getElementById('userName').textContent = currentUser;
  document.getElementById('userAvatar').textContent = currentUser.charAt(0).toUpperCase();

  // 初始化画布
  canvas = document.getElementById('gameCanvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  ctx = canvas.getContext('2d');

  // 刷新数据面板
  refreshDataPanels(currentUser);

  // 绘制初始画面
  drawIdleScreen();

  // 绑定键盘事件
  document.addEventListener('keydown', handleKeydown);
});

// ========== 键盘控制 ==========

/**
 * 处理键盘按下事件
 * @param {KeyboardEvent} e - 键盘事件
 */
function handleKeydown(e) {
  const key = e.key;

  // 方向控制
  const dirMap = {
    'ArrowUp': 'UP', 'w': 'UP', 'W': 'UP',
    'ArrowDown': 'DOWN', 's': 'DOWN', 'S': 'DOWN',
    'ArrowLeft': 'LEFT', 'a': 'LEFT', 'A': 'LEFT',
    'ArrowRight': 'RIGHT', 'd': 'RIGHT', 'D': 'RIGHT'
  };

  if (dirMap[key]) {
    e.preventDefault();
    setDirection(dirMap[key]);
  }

  // 空格键：开始/暂停
  if (key === ' ') {
    e.preventDefault();
    if (!isRunning) {
      startGame();
    } else {
      togglePause();
    }
  }
}

/**
 * 设置移动方向（禁止 180° 反向）
 * @param {string} dir - 新方向 ('UP' | 'DOWN' | 'LEFT' | 'RIGHT')
 */
function setDirection(dir) {
  if (!isRunning || isPaused) return;

  const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
  if (opposites[dir] !== direction) {
    nextDirection = dir;
  }
}

// ========== 游戏核心 ==========

/**
 * 开始游戏
 */
function startGame() {
  // 初始化蛇在画布中央
  const centerX = Math.floor(GRID_SIZE / 2);
  const centerY = Math.floor(GRID_SIZE / 2);
  snake = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY }
  ];

  direction = 'RIGHT';
  nextDirection = 'RIGHT';
  score = 0;
  isRunning = true;
  isPaused = false;

  // 更新 UI
  document.getElementById('currentScore').textContent = '0';
  document.getElementById('startBtn').disabled = true;
  document.getElementById('startBtn').textContent = '🎮 游戏中';
  document.getElementById('pauseBtn').disabled = false;
  document.getElementById('pauseBtn').textContent = '⏸ 暂停';

  // 生成食物
  spawnFood();

  // 启动游戏循环
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameStep, GAME_SPEED);
}

/**
 * 游戏每一帧的逻辑
 */
function gameStep() {
  if (isPaused) return;

  // 更新方向
  direction = nextDirection;

  // 计算蛇头新位置
  const head = { ...snake[0] };
  switch (direction) {
    case 'UP': head.y -= 1; break;
    case 'DOWN': head.y += 1; break;
    case 'LEFT': head.x -= 1; break;
    case 'RIGHT': head.x += 1; break;
  }

  // 碰撞检测 — 撞墙
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    gameOver();
    return;
  }

  // 碰撞检测 — 撞自身
  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      gameOver();
      return;
    }
  }

  // 移动蛇：在头部添加新位置
  snake.unshift(head);

  // 检测是否吃到食物
  if (head.x === food.x && head.y === food.y) {
    score += SCORE_PER_FOOD;
    document.getElementById('currentScore').textContent = score;
    spawnFood();
  } else {
    // 没吃到食物，移除尾部
    snake.pop();
  }

  // 绘制画面
  draw();
}

/**
 * 生成食物（随机位置，不与蛇身重叠）
 */
function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
  food = newFood;
}

/**
 * 切换暂停状态
 */
function togglePause() {
  if (!isRunning) return;

  isPaused = !isPaused;
  const pauseBtn = document.getElementById('pauseBtn');

  if (isPaused) {
    pauseBtn.textContent = '▶ 继续';
    drawPauseOverlay();
  } else {
    pauseBtn.textContent = '⏸ 暂停';
  }
}

/**
 * 游戏结束
 */
function gameOver() {
  isRunning = false;
  isPaused = false;

  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }

  // 保存得分
  saveScore(currentUser, score);

  // 更新 UI
  document.getElementById('startBtn').disabled = false;
  document.getElementById('startBtn').textContent = '▶ 开始游戏';
  document.getElementById('pauseBtn').disabled = true;
  document.getElementById('pauseBtn').textContent = '⏸ 暂停';

  // 显示游戏结束弹窗
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOverModal').classList.add('active');

  // 刷新数据面板
  refreshDataPanels(currentUser);
}

/**
 * 重新开始
 */
function restartGame() {
  closeModal();
  startGame();
}

/**
 * 关闭弹窗
 */
function closeModal() {
  document.getElementById('gameOverModal').classList.remove('active');
}

/**
 * 登出
 */
function handleLogout() {
  if (gameLoop) clearInterval(gameLoop);
  sessionStorage.removeItem('snake_current_user');
  window.location.href = 'index.html';
}

// ========== Canvas 渲染 ==========

/**
 * 绘制游戏画面
 */
function draw() {
  // 清空画布
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // 绘制网格线（淡色）
  drawGrid();

  // 绘制食物
  drawFood();

  // 绘制蛇
  drawSnake();
}

/**
 * 绘制网格线
 */
function drawGrid() {
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 0.5;

  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, CANVAS_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(CANVAS_SIZE, pos);
    ctx.stroke();
  }
}

/**
 * 绘制蛇身（渐变色）
 */
function drawSnake() {
  const len = snake.length;

  snake.forEach((seg, i) => {
    const x = seg.x * CELL_SIZE;
    const y = seg.y * CELL_SIZE;

    // 从青色到紫红色渐变
    const ratio = len > 1 ? i / (len - 1) : 0;
    const r = Math.round(6 + (217 - 6) * ratio);
    const g = Math.round(182 + (70 - 182) * ratio);
    const b = Math.round(212 + (239 - 212) * ratio);

    // 蛇头更亮
    if (i === 0) {
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    // 圆角矩形
    const padding = 1;
    const radius = 4;
    roundRect(ctx, x + padding, y + padding,
      CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, radius);
    ctx.fill();
  });

  // 重置阴影
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * 绘制食物（带发光效果）
 */
function drawFood() {
  const x = food.x * CELL_SIZE + CELL_SIZE / 2;
  const y = food.y * CELL_SIZE + CELL_SIZE / 2;
  const r = CELL_SIZE / 2 - 2;

  // 外发光
  ctx.shadowColor = '#d946ef';
  ctx.shadowBlur = 16;

  // 渐变填充
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, '#f0abfc');
  gradient.addColorStop(0.6, '#d946ef');
  gradient.addColorStop(1, '#a21caf');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // 重置阴影
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * 绘制待机画面（游戏未开始时）
 */
function drawIdleScreen() {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawGrid();

  // 提示文字
  ctx.fillStyle = '#64748b';
  ctx.font = '600 16px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('按「开始游戏」或空格键开始', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 12);
  ctx.font = '400 13px Outfit, sans-serif';
  ctx.fillText('方向键 / WASD 控制移动', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 16);
}

/**
 * 绘制暂停覆盖层
 */
function drawPauseOverlay() {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = '#22d3ee';
  ctx.font = '700 24px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⏸ 已暂停', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
}

/**
 * 绘制圆角矩形路径
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {number} x - 左上角 x
 * @param {number} y - 左上角 y
 * @param {number} w - 宽度
 * @param {number} h - 高度
 * @param {number} r - 圆角半径
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
