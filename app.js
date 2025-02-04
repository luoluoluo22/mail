async function fetchEmails() {
    try {
        const response = await fetch('/.netlify/functions/email_handler');
        const emails = await response.json();
        
        const container = document.getElementById('email-container');
        
        if (emails.error) {
            container.innerHTML = `<div class="error">错误: ${emails.error}</div>`;
            return;
        }
        
        const emailsHTML = emails.map(email => `
            <div class="email-item">
                <h3>${email.subject}</h3>
                <p>发件人: ${email.from}</p>
                <p>日期: ${email.date}</p>
            </div>
        `).join('');
        
        container.innerHTML = emailsHTML;
    } catch (error) {
        document.getElementById('email-container').innerHTML = 
            `<div class="error">获取邮件失败: ${error.message}</div>`;
    }
}

// 页面加载时获取邮件
fetchEmails(); 