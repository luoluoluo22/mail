const Imap = require('imap');
const { simpleParser } = require('mailparser');

const config = {
  user: '1137583371@qq.com',
  password: 'wrtckdfbevlujdec',
  host: 'imap.qq.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

exports.handler = async function(event, context) {
  console.log('邮件处理函数开始执行...');
  
  try {
    console.log('尝试获取邮件...');
    const emails = await fetchEmails();
    console.log('成功获取邮件:', emails);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(emails)
    };
  } catch (error) {
    console.error('邮件处理函数发生错误:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        details: '获取邮件时发生错误'
      })
    };
  }
};

function fetchEmails() {
  return new Promise((resolve, reject) => {
    try {
      console.log('创建IMAP连接...');
      const imap = new Imap(config);
      const emails = [];

      imap.once('ready', () => {
        console.log('IMAP连接就绪');
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('打开收件箱失败:', err);
            reject(err);
            return;
          }
          
          console.log('成功打开收件箱');
          const fetch = imap.seq.fetch('1:10', {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
            struct: true
          });

          fetch.on('message', (msg, seqno) => {
            console.log(`处理第 ${seqno} 封邮件`);
            msg.on('body', stream => {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  console.error(`解析第 ${seqno} 封邮件失败:`, err);
                  return;
                }
                emails.push({
                  subject: parsed.subject,
                  from: parsed.from ? parsed.from.text : null,
                  date: parsed.date
                });
                console.log(`成功解析第 ${seqno} 封邮件`);
              });
            });
          });

          fetch.once('error', err => {
            console.error('获取邮件时发生错误:', err);
            reject(err);
          });
          
          fetch.once('end', () => {
            console.log('所有邮件获取完成');
            imap.end();
            resolve(emails);
          });
        });
      });

      imap.once('error', err => {
        console.error('IMAP连接错误:', err);
        reject(err);
      });

      imap.once('end', () => {
        console.log('IMAP连接结束');
      });

      console.log('开始连接IMAP服务器...');
      imap.connect();
    } catch (error) {
      console.error('fetchEmails函数发生错误:', error);
      reject(error);
    }
  });
} 