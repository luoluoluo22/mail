let currentEmails = [];
let refreshTimer = null;

// 检查是否已登录
function checkAuth() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        startAutoRefresh();
        return true;
    }
    return false;
}

// 自动刷新逻辑
function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
        if (!document.hidden && !document.getElementById('main-content').classList.contains('hidden')) {
            fetchEmails();
        }
    }, 15000);
}

// 登录处理
function handleLogin(event) {
    event.preventDefault();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (remember) localStorage.setItem('auth_token', data.token);
            else sessionStorage.setItem('auth_token', data.token);
            document.getElementById('login-container').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            startAutoRefresh();
            fetchEmails();
        } else {
            alert('密码错误');
        }
    });
}

// 退出登录
function logout() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    if (refreshTimer) clearInterval(refreshTimer);
    location.reload();
}

// 增强版验证码提取逻辑
function extractCode(text, subject) {
    const combined = ((subject || '') + " " + (text || '')).replace(/\s+/g, ' ');
    const codeKeywords = ['验证码', 'code', '码', 'verification', 'otp', 'token', '验证碼'];

    // 1. 尝试匹配关键词后面的数字 (优先)
    for (const kw of codeKeywords) {
        const regex = new RegExp(`${kw}[^0-9]*?(\\d{4,6})(?!\\d)`, 'i');
        const match = combined.match(regex);
        if (match) return match[1];
    }

    // 2. 兜底策略：匹配所有 4-6 位数字，排除年份干扰
    const matches = combined.match(/(?<!\d)\d{4,6}(?!\d)/g);
    if (matches) {
        // 过滤掉 2020-2030 之间的年份
        const filtered = matches.filter(m => {
            const n = parseInt(m);
            return n < 2020 || n > 2030;
        });
        if (filtered.length > 0) return filtered[0];
        return matches[0];
    }
    return null;
}

// 复制功能
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const oldText = btn.innerText;
        btn.innerText = '已复制 ' + text;
        btn.classList.replace('bg-indigo-600', 'bg-green-600');
        setTimeout(() => {
            btn.innerText = oldText;
            btn.classList.replace('bg-green-600', 'bg-indigo-600');
        }, 2000);
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    return date.toLocaleDateString();
}

function renderLatestEmail(email) {
    const container = document.getElementById('latest-email-content');
    const code = extractCode(email.text, email.subject);
    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold ${email.isUnseen ? 'text-indigo-600' : 'text-gray-900'}">
                        ${email.isUnseen ? '<span class="inline-block w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>' : ''}${email.subject || '(无主题)'}
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">${email.from} · ${formatDate(email.date)}</p>
                </div>
                ${code ? `
                    <button onclick="copyToClipboard('${code}', this)" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105">
                        点击复制验证码: ${code}
                    </button>
                ` : ''}
            </div>
            <div class="border-t border-gray-100 pt-4 prose max-w-none">
                ${email.html || email.text || ''}
            </div>
        </div>
    `;
}

function renderEmailList(emails) {
    const container = document.getElementById('email-container');
    if (emails.length <= 1) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">没有更多历史邮件</p>';
        return;
    }
    container.innerHTML = emails.slice(1).map((email, idx) => {
        const code = extractCode(email.text, email.subject);
        return `
            <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer mb-3" onclick="showModal(currentEmails[${idx + 1}])">
                <div class="flex justify-between">
                    <span class="font-bold ${email.isUnseen ? 'text-indigo-600' : 'text-gray-800'}">${email.subject}</span>
                    <span class="text-xs text-gray-400">${formatDate(email.date)}</span>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-sm text-gray-500">${email.from}</span>
                    ${code ? `<button onclick="event.stopPropagation(); copyToClipboard('${code}', this)" class="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 font-bold">复制 ${code}</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function showModal(email) {
    const modal = document.getElementById('email-modal');
    document.getElementById('modal-subject').textContent = email.subject;
    document.getElementById('modal-content').innerHTML = email.html || email.text;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('email-modal').classList.add('hidden');
}

async function fetchEmails() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) return;
    try {
        const res = await fetch('/.netlify/functions/email_handler', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) logout();
        if (res.ok) {
            const data = await res.json();
            currentEmails = data;
            if (data.length > 0) {
                renderLatestEmail(data[0]);
                renderEmailList(data);
            }
        }
    } catch (e) { console.error(e); }
}

document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('email-modal').addEventListener('click', function(e) { if(e.target===this) closeModal(); });
if (checkAuth()) fetchEmails();
