async function fetchEmails() {
    try {
        const response = await fetch('/.netlify/functions/email_handler');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const emails = await response.json();
        
        const container = document.getElementById('email-container');
        
        if (emails.error) {
            container.innerHTML = `<div class="error">错误: ${emails.error}</div>`;
            return;
        }
        
        const emailsHTML = emails.map(email => `
            <div class="email-item">
                <h3>${email.subject || '(无主题)'}</h3>
                <p>发件人: ${email.from || '未知'}</p>
                <p>日期: ${new Date(email.date).toLocaleString('zh-CN')}</p>
            </div>
        `).join('');
        
        container.innerHTML = emailsHTML || '<div>没有邮件</div>';
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('email-container').innerHTML = 
            `<div class="error">获取邮件失败: ${error.message}</div>`;
    }
}

// 页面加载时获取邮件
fetchEmails(); 