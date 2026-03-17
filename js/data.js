/**
 * data.js — 数据记录与展示模块
 * 负责分数保存、历史记录渲染和排行榜展示
 */

// ========== 数据操作 ==========

/**
 * 保存游戏得分
 * @param {string} username - 用户名
 * @param {number} score - 本局得分
 */
function saveScore(username, score) {
  const users = JSON.parse(localStorage.getItem('snake_users') || '{}');
  if (!users[username]) return;

  // 更新最高分
  if (score > users[username].highScore) {
    users[username].highScore = score;
  }

  // 添加得分记录（保留最近 50 条）
  users[username].scores.push({
    score: score,
    time: new Date().toISOString()
  });
  if (users[username].scores.length > 50) {
    users[username].scores = users[username].scores.slice(-50);
  }

  localStorage.setItem('snake_users', JSON.stringify(users));
}

/**
 * 获取用户历史得分
 * @param {string} username - 用户名
 * @returns {Array} 得分记录数组（按时间倒序）
 */
function getScores(username) {
  const users = JSON.parse(localStorage.getItem('snake_users') || '{}');
  if (!users[username]) return [];
  return [...users[username].scores].reverse();
}

/**
 * 获取用户最高分
 * @param {string} username - 用户名
 * @returns {number} 最高分
 */
function getHighScore(username) {
  const users = JSON.parse(localStorage.getItem('snake_users') || '{}');
  if (!users[username]) return 0;
  return users[username].highScore || 0;
}

/**
 * 获取全局排行榜（按最高分降序）
 * @returns {Array} 排行榜数据 [{ name, score }]
 */
function getLeaderboard() {
  const users = JSON.parse(localStorage.getItem('snake_users') || '{}');
  return Object.entries(users)
    .map(([name, data]) => ({ name, score: data.highScore || 0 }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

/**
 * 获取用户登录历史
 * @param {string} username - 用户名
 * @returns {Array} 登录时间戳数组（按时间倒序）
 */
function getLoginHistory(username) {
  const users = JSON.parse(localStorage.getItem('snake_users') || '{}');
  if (!users[username]) return [];
  return [...(users[username].loginHistory || [])].reverse();
}

// ========== DOM 渲染 ==========

/**
 * 格式化时间戳
 * @param {string} isoString - ISO 时间字符串
 * @returns {string} 格式化后的时间
 */
function formatTime(isoString) {
  const d = new Date(isoString);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

/**
 * 渲染历史得分面板
 * @param {string} username - 用户名
 */
function renderScoreHistory(username) {
  const container = document.getElementById('scoreHistory');
  const scores = getScores(username);

  if (scores.length === 0) {
    container.innerHTML = '<li class="empty-tip">暂无记录，开始游戏吧！</li>';
    return;
  }

  container.innerHTML = scores.slice(0, 15).map((item, i) => `
    <li class="record-item">
      <span class="rank">#${i + 1}</span>
      <span class="score">${item.score} 分</span>
      <span class="time">${formatTime(item.time)}</span>
    </li>
  `).join('');
}

/**
 * 渲染排行榜
 */
function renderLeaderboard() {
  const container = document.getElementById('leaderboard');
  const data = getLeaderboard();

  if (data.length === 0) {
    container.innerHTML = '<li class="empty-tip">暂无记录</li>';
    return;
  }

  container.innerHTML = data.map((item, i) => {
    // 前三名特殊样式
    let rankClass = '';
    let rankText = `#${i + 1}`;
    if (i === 0) { rankClass = 'gold'; rankText = '🥇'; }
    else if (i === 1) { rankClass = 'silver'; rankText = '🥈'; }
    else if (i === 2) { rankClass = 'bronze'; rankText = '🥉'; }

    return `
      <li class="record-item">
        <span class="rank ${rankClass}">${rankText}</span>
        <span class="name">${item.name}</span>
        <span class="score">${item.score} 分</span>
      </li>
    `;
  }).join('');
}

/**
 * 更新顶部最高分显示
 * @param {string} username - 用户名
 */
function updateHighScoreDisplay(username) {
  const el = document.getElementById('highScore');
  if (el) {
    el.textContent = getHighScore(username);
  }
}

/**
 * 刷新所有数据面板
 * @param {string} username - 用户名
 */
function refreshDataPanels(username) {
  renderScoreHistory(username);
  renderLeaderboard();
  updateHighScoreDisplay(username);
}
