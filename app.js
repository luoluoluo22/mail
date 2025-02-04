let currentEmails = [];

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

async function fetchEmails() {
    const container = document.getElementById('email-container');
    
    try {
        console.log('开始获取邮件...');
        const response = await fetch('/.netlify/functions/email_handler');
        console.log('服务器响应状态:', response.status);
        
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
            container.innerHTML = `
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
            return;
        }
        
        if (!Array.isArray(emails)) {
            console.error('返回的数据格式不正确:', emails);
            throw new Error('服务器返回了意外的数据格式');
        }
        
        if (emails.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">没有邮件</h3>
                    <p class="mt-1 text-sm text-gray-500">收件箱中没有找到任何邮件。</p>
                </div>`;
            return;
        }
        
        const emailsHTML = emails.map((email, index) => `
            <div class="email-item bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50" onclick="showModal(currentEmails[${index}])">
                <div class="flex justify-between items-start">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${email.subject || '(无主题)'}</h3>
                    <span class="text-sm text-gray-500">${formatDate(email.date)}</span>
                </div>
                <p class="text-gray-600 mb-2">${email.from || '未知'}</p>
                <p class="text-gray-500 text-sm email-preview">${email.preview || '(无预览)'}</p>
            </div>
        `).join('');
        
        container.innerHTML = emailsHTML;
        console.log('邮件显示完成');
        
    } catch (error) {
        console.error('获取邮件时发生错误:', error);
        container.innerHTML = `
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
    }
}

// 页面加载时获取邮件
console.log('页面加载，准备获取邮件...');
fetchEmails();

// 点击模态框背景时关闭
document.getElementById('email-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
}); 