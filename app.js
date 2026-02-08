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
    }, 15000); // 15秒刷新一次
}

// 处理认证失败
function handleAuthError() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    if (refreshTimer) clearInterval(refreshTimer);
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('password').value = '';
    document.getElementById('remember').checked = true;
    alert('登录已过期，请重新登录');
}

// 登录处理
function handleLogin(event) {
    event.preventDefault();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (remember) {
                localStorage.setItem('auth_token', data.token);
            } else {
                sessionStorage.setItem('auth_token', data.token);
            }
            document.getElementById('login-container').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            startAutoRefresh();
            fetchEmails();
        } else {
            alert('密码错误');
        }
    })
    .catch(error => {
        console.error('登录失败:', error);
        alert('登录失败，请重试');
    });
}

// 退出登录
function logout() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    if (refreshTimer) clearInterval(refreshTimer);
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('password').value = '';
}

// 提取验证码
function extractCode(text) {
    if (!text) return null;
    // 匹配 4-6 位纯数字，通常验证码前后会有空格或特殊字符
    const match = text.match(/(?<!\d)\d{4,6}(?!\d)/);
    return match ? match[0] : null;
}

// 复制到剪贴板
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerText;
        btn.innerText = '已复制！';
        btn.classList.replace('bg-indigo-600', 'bg-green-600');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.replace('bg-green-600', 'bg-indigo-600');
        }, 2000);
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes} 分钟前`;
        }
        return `${hours} 小时前`;
    } else if (days === 1) {
        return '昨天';
    } else if (days === 2) {
        return '前天';
    } else if (days < 7) {
        return `${days} 天前`;
    } else {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function showModal(email) {
    const modal = document.getElementById('email-modal');
    const subject = document.getElementById('modal-subject');
    const from = document.getElementById('modal-from');
    const date = document.getElementById('modal-date');
    const content = document.getElementById('modal-content');

    subject.textContent = email.subject || '(无主题)';
    from.textContent = `发件人: ${email.from || '未知'}`;
    date.textContent = formatDate(email.date);
    content.innerHTML = email.html || email.text || '(无内容)';

    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('email-modal');
    modal.classList.add('hidden');
}

function renderLatestEmail(email) {
    const container = document.getElementById('latest-email-content');
    const code = extractCode(email.text);

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-semibold ${email.isUnseen ? 'text-indigo-700' : 'text-gray-900'}">
                        ${email.isUnseen ? '● ' : ''}${email.subject || '(无主题)'}
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">${formatDate(email.date)}</p>
                </div>
                ${code ? `
                    <button onclick="copyToClipboard('${code}', this)" class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                        复制验证码: ${code}
                    </button>
                ` : ''}
            </div>
            <div class="space-y-2">
                <p class="text-gray-600 font-medium">${email.from || '未知'}</p>
                <div class="border-t border-gray-100 pt-4">
                    <div class="prose max-w-none">
                        ${email.html || email.text || '(无内容)'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderEmailList(emails) {
    const container = document.getElementById('email-container');

    if (emails.length <= 1) {
        container.innerHTML = `
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">没有更多邮件</h3>
            </div>`;
        return;
    }

    const emailsHTML = emails.slice(1).map((email, index) => {
        const code = extractCode(email.text);
        return `
            <div class="email-item bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-gray-50 transition-colors" onclick="showModal(currentEmails[${index + 1}])">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold ${email.isUnseen ? 'text-indigo-700' : 'text-gray-900'}">
                            ${email.isUnseen ? '● ' : ''}${email.subject || '(无主题)'}
                        </h3>
                        <p class="text-gray-600 text-sm mb-1">${email.from || '未知'}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs text-gray-400 block mb-2">${formatDate(email.date)}</span>
                        ${code ? `
                            <button onclick="event.stopPropagation(); copyToClipboard('${code}', this)" class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded text-xs font-bold hover:bg-indigo-100 border border-indigo-200">
                                复制 ${code}
                            </button>
                        ` : ''}
                    </div>
                </div>
                <p class="text-gray-500 text-sm email-preview mt-1">${email.preview || '(无预览)'}</p>
            </div>
        `;
    }).join('');

    container.innerHTML = emailsHTML;
}

async function fetchEmails() {
    try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch('/.netlify/functions/email_handler', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (response.ok) {
            const emails = await response.json();
            currentEmails = emails;
            if (emails.length > 0) {
                renderLatestEmail(emails[0]);
                renderEmailList(emails);
            }
        }
    } catch (error) {
        console.error('获取邮件失败:', error);
    }
}

// 初始化
document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('email-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

if (checkAuth()) {
    fetchEmails();
}
