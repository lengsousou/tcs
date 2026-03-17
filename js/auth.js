/**
 * auth.js — 用户认证模块
 * 负责注册、登录、会话管理和登出功能
 * 数据存储在 localStorage 中
 */

// ========== 工具函数 ==========

/**
 * 简单字符串哈希（非加密，仅用于演示）
 * @param {string} str - 待哈希的字符串
 * @returns {string} 哈希结果
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转为 32 位整数
  }
  return Math.abs(hash).toString(36);
}

/**
 * 获取所有用户数据
 * @returns {Object} 用户数据对象
 */
function getUsers() {
  return JSON.parse(localStorage.getItem('snake_users') || '{}');
}

/**
 * 保存用户数据
 * @param {Object} users - 用户数据对象
 */
function saveUsers(users) {
  localStorage.setItem('snake_users', JSON.stringify(users));
}

/**
 * 显示提示消息
 * @param {string} text - 消息内容
 * @param {string} type - 消息类型 ('error' | 'success')
 */
function showMessage(text, type) {
  const el = document.getElementById('authMessage');
  el.textContent = text;
  el.className = 'message ' + type;
}

/**
 * 隐藏提示消息
 */
function hideMessage() {
  const el = document.getElementById('authMessage');
  el.className = 'message';
}

// ========== Tab 切换 ==========

/**
 * 切换登录/注册表单
 * @param {string} tab - 'login' | 'register'
 */
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');

  hideMessage();

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

// ========== 注册 ==========

/**
 * 处理注册表单提交
 * @param {Event} e - 表单提交事件
 */
function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  // 校验用户名长度
  if (username.length < 3 || username.length > 16) {
    showMessage('用户名需为 3-16 个字符', 'error');
    return;
  }

  // 校验密码长度
  if (password.length < 6) {
    showMessage('密码至少需要 6 个字符', 'error');
    return;
  }

  // 校验两次密码一致
  if (password !== confirm) {
    showMessage('两次输入的密码不一致', 'error');
    return;
  }

  const users = getUsers();

  // 检查用户名是否已存在
  if (users[username]) {
    showMessage('该用户名已被注册', 'error');
    return;
  }

  // 创建新用户
  users[username] = {
    passwordHash: simpleHash(password),
    highScore: 0,
    scores: [],
    loginHistory: [],
    createdAt: new Date().toISOString()
  };

  saveUsers(users);
  showMessage('注册成功！请切换到登录页面', 'success');

  // 清空表单
  document.getElementById('registerForm').reset();
}

// ========== 登录 ==========

/**
 * 处理登录表单提交
 * @param {Event} e - 表单提交事件
 */
function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  const users = getUsers();

  // 检查用户是否存在
  if (!users[username]) {
    showMessage('用户名不存在', 'error');
    return;
  }

  // 校验密码
  if (users[username].passwordHash !== simpleHash(password)) {
    showMessage('密码错误', 'error');
    return;
  }

  // 记录登录时间
  users[username].loginHistory.push(new Date().toISOString());
  // 只保留最近 20 条登录记录
  if (users[username].loginHistory.length > 20) {
    users[username].loginHistory = users[username].loginHistory.slice(-20);
  }
  saveUsers(users);

  // 设置会话
  sessionStorage.setItem('snake_current_user', username);

  // 跳转到游戏页
  window.location.href = 'game.html';
}

// ========== 会话管理 ==========

/**
 * 检查当前登录态
 * @returns {string|null} 当前登录的用户名，未登录返回 null
 */
function checkSession() {
  return sessionStorage.getItem('snake_current_user');
}

/**
 * 登出
 */
function handleLogout() {
  sessionStorage.removeItem('snake_current_user');
  window.location.href = 'index.html';
}

// ========== 页面初始化 ==========

// 如果已经登录，直接跳转到游戏页
(function init() {
  // 仅在 index.html 页面执行
  if (window.location.pathname.endsWith('index.html') ||
      window.location.pathname.endsWith('/')) {
    if (checkSession()) {
      window.location.href = 'game.html';
    }
  }
})();
