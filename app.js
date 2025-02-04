async function fetchEmails() {
    const container = document.getElementById('email-container');
    container.innerHTML = '<div>正在连接邮件服务器...</div>';
    
    try {
        console.log('开始获取邮件...');
        const response = await fetch('/.netlify/functions/email_handler');
        console.log('服务器响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('服务器错误响应:', errorText);
            throw new Error(`服务器响应错误 (${response.status}): ${errorText}`);
        }
        
        const emails = await response.json();
        console.log('获取到的邮件数据:', emails);
        
        if (emails.error) {
            console.error('邮件服务器返回错误:', emails.error);
            container.innerHTML = `<div class="error">
                <h3>邮件服务器错误</h3>
                <p>${emails.error}</p>
                <p>请稍后重试或联系管理员</p>
            </div>`;
            return;
        }
        
        if (!Array.isArray(emails)) {
            console.error('返回的数据格式不正确:', emails);
            throw new Error('服务器返回了意外的数据格式');
        }
        
        if (emails.length === 0) {
            container.innerHTML = '<div>没有找到任何邮件</div>';
            return;
        }
        
        const emailsHTML = emails.map(email => `
            <div class="email-item">
                <h3>${email.subject ? email.subject : '(无主题)'}</h3>
                <p>发件人: ${email.from ? email.from : '未知'}</p>
                <p>日期: ${email.date ? new Date(email.date).toLocaleString('zh-CN') : '未知时间'}</p>
            </div>
        `).join('');
        
        container.innerHTML = emailsHTML;
        console.log('邮件显示完成');
        
    } catch (error) {
        console.error('获取邮件时发生错误:', error);
        container.innerHTML = `
            <div class="error">
                <h3>获取邮件失败</h3>
                <p>${error.message}</p>
                <p>详细错误信息已记录到控制台</p>
                <button onclick="fetchEmails()">重试</button>
            </div>`;
    }
}

// 页面加载时获取邮件
console.log('页面加载，准备获取邮件...');
fetchEmails(); 