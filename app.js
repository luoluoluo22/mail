let currentEmails = [];

// 检查是否已登录
function checkAuth() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        return true;
    }
    return false;
}

// 处理认证失败
function handleAuthError() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('password').value = '';
    document.getElementById('remember').checked = false;
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
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('password').value = '';
    document.getElementById('remember').checked = false;
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
    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-start">
                <h3 class="text-xl font-semibold text-gray-900">${email.subject || '(无主题)'}</h3>
                <span class="text-sm text-gray-500">${formatDate(email.date)}</span>
            </div>
            <div class="space-y-2">
                <p class="text-gray-600">${email.from || '未知'}</p>
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
                <p class="mt-1 text-sm text-gray-500">暂时没有其他邮件。</p>
            </div>`;
        return;
    }
    
    const emailsHTML = emails.slice(1).map((email, index) => `
        <div class="email-item bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50" onclick="showModal(currentEmails[${index + 1}])">
            <div class="flex justify-between items-start">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${email.subject || '(无主题)'}</h3>
                <span class="text-sm text-gray-500">${formatDate(email.date)}</span>
            </div>
            <p class="text-gray-600 mb-2">${email.from || '未知'}</p>
            <p class="text-gray-500 text-sm email-preview">${email.preview || '(无预览)'}</p>
        </div>
    `).join('');
    
    container.innerHTML = emailsHTML;
}

async function fetchEmails() {
    const latestEmailContainer = document.getElementById('latest-email-content');
    const container = document.getElementById('email-container');
    
    try {
        console.log('开始获取邮件...');
        // 获取认证令牌
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) {
            throw new Error('未登录');
        }

        const response = await fetch('/.netlify/functions/email_handler', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('服务器响应状态:', response.status);
        
        if (response.status === 401) {
            handleAuthError();
            return;
        }

        const responseText = await response.text();
        console.log('服务器原始响应:', responseText);
        
        if (!response.ok) {
            console.error('服务器错误响应:', responseText);
            throw new Error(`服务器响应错误 (${response.status}): ${responseText}`);
        }
        
        if (!responseText) {
            console.error('服务器返回空响应');
            throw new Error('服务器返回空响应');
        }
        
        let emails;
        try {
            emails = JSON.parse(responseText);
            console.log('解析后的邮件数据:', emails);
            currentEmails = emails;
        } catch (e) {
            console.error('解析响应JSON失败:', e);
            throw new Error(`解析服务器响应失败: ${e.message}`);
        }
        
        if (emails.error) {
            console.error('邮件服务器返回错误:', emails.error);
            const errorHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">邮件服务器错误</h3>
                            <p class="mt-2 text-sm text-red-700">${emails.error}</p>
                            ${emails.stack ? `<pre class="mt-2 text-xs text-red-700">${emails.stack}</pre>` : ''}
                            ${emails.details ? `<p class="mt-2 text-sm text-red-700">${emails.details}</p>` : ''}
                        </div>
                    </div>
                    <button onclick="fetchEmails()" class="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200">重试</button>
                </div>`;
            latestEmailContainer.innerHTML = errorHTML;
            container.innerHTML = '';
            return;
        }
        
        if (!Array.isArray(emails)) {
            console.error('返回的数据格式不正确:', emails);
            throw new Error('服务器返回了意外的数据格式');
        }
        
        if (emails.length === 0) {
            const emptyHTML = `
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">没有邮件</h3>
                    <p class="mt-1 text-sm text-gray-500">收件箱中没有找到任何邮件。</p>
                </div>`;
            latestEmailContainer.innerHTML = emptyHTML;
            container.innerHTML = '';
            return;
        }
        
        // 渲染最新邮件
        renderLatestEmail(emails[0]);
        
        // 渲染其他邮件列表
        renderEmailList(emails);
        
        console.log('邮件显示完成');
        
    } catch (error) {
        console.error('获取邮件时发生错误:', error);
        const errorHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">获取邮件失败</h3>
                        <p class="mt-2 text-sm text-red-700">${error.message}</p>
                    </div>
                </div>
                <button onclick="fetchEmails()" class="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200">重试</button>
            </div>`;
        latestEmailContainer.innerHTML = errorHTML;
        container.innerHTML = '';
    }
}

// 初始化
document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('email-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// 检查登录状态并加载邮件
if (checkAuth()) {
    fetchEmails();
} 