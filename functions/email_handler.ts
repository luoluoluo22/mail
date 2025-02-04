import { Handler } from '@netlify/functions';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Readable } from 'stream';

const config = {
  user: '1137583371@qq.com',
  password: 'wrtckdfbevlujdec',
  host: 'imap.qq.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
} as const;

interface Email {
  subject: string | null;
  from: string | null;
  date: Date | null;
}

function fetchEmails(): Promise<Email[]> {
  return new Promise((resolve, reject) => {
    try {
      console.log('创建IMAP连接...');
      const imap = new (Imap as any)(config);
      const emails: Email[] = [];
      let processedCount = 0;
      let totalMessages = 0;

      imap.once('ready', () => {
        console.log('IMAP连接就绪');
        imap.openBox('INBOX', false, (err: Error | null, box: any) => {
          if (err) {
            console.error('打开收件箱失败:', err);
            reject(err);
            return;
          }

          console.log('成功打开收件箱');
          // 获取最新的10封邮件
          const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - 9)}:${box.messages.total}`, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
            struct: true
          });

          totalMessages = Math.min(10, box.messages.total);
          console.log(`准备获取 ${totalMessages} 封邮件`);

          fetch.on('message', (msg: any, seqno: number) => {
            console.log(`处理第 ${seqno} 封邮件`);
            msg.on('body', (stream: Readable) => {
              let buffer = '';
              stream.on('data', (chunk: Buffer) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  emails.push({
                    subject: parsed.subject || null,
                    from: parsed.from?.text || null,
                    date: parsed.date || null
                  });
                  console.log(`成功解析第 ${seqno} 封邮件`);
                  processedCount++;

                  if (processedCount === totalMessages) {
                    console.log('所有邮件处理完成');
                    imap.end();
                    resolve(emails.sort((a, b) => {
                      const dateA = a.date ? new Date(a.date).getTime() : 0;
                      const dateB = b.date ? new Date(b.date).getTime() : 0;
                      return dateB - dateA;
                    }));
                  }
                } catch (err) {
                  console.error(`解析第 ${seqno} 封邮件失败:`, err);
                  processedCount++;

                  if (processedCount === totalMessages) {
                    console.log('所有邮件处理完成（包含错误）');
                    imap.end();
                    resolve(emails.sort((a, b) => {
                      const dateA = a.date ? new Date(a.date).getTime() : 0;
                      const dateB = b.date ? new Date(b.date).getTime() : 0;
                      return dateB - dateA;
                    }));
                  }
                }
              });
            });
          });

          fetch.once('error', (err: Error) => {
            console.error('获取邮件时发生错误:', err);
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            console.log('邮件获取完成，等待处理...');
          });
        });
      });

      imap.once('error', (err: Error) => {
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

export const handler: Handler = async (event, context) => {
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
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: '获取邮件时发生错误'
      })
    };
  }
}; 