import { Handler } from '@netlify/functions';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Readable } from 'stream';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sage-baklava-cb044e';

const config = {
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  host: process.env.EMAIL_HOST || 'imap.qq.com',
  port: Number(process.env.EMAIL_PORT) || 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false,
    enableTrace: true
  },
  debug: console.log,
  authTimeout: 3000
} as const;

interface Email {
  subject: string | null;
  from: string | null;
  date: Date | null;
  text: string | null;
  html: string | null;
  preview: string | null;
  isUnseen?: boolean;
}

// 验证JWT token
function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
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

          // 优化策略：优先获取未读，如果不足10封则用已读补充
          // 注意：这里使用 seq.fetch，获取最新的 10 封并标记未读状态
          const total = box.messages.total;
          const start = Math.max(1, total - 9);
          const fetch = imap.seq.fetch(`${start}:${total}`, {
            bodies: [''],
            struct: true
          });

          totalMessages = total >= 10 ? 10 : total;
          if (totalMessages === 0) {
            imap.end();
            resolve([]);
            return;
          }

          fetch.on('message', (msg: any, seqno: number) => {
            let isUnseen = false;
            msg.once('attributes', (attrs: any) => {
              isUnseen = !attrs.flags.includes('\\Seen');
            });

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
                    date: parsed.date || null,
                    text: parsed.text || null,
                    html: parsed.html || null,
                    preview: parsed.text ? parsed.text.slice(0, 200) + (parsed.text.length > 200 ? '...' : '') : null,
                    isUnseen
                  });
                  processedCount++;

                  if (processedCount === totalMessages) {
                    imap.end();
                    resolve(emails.sort((a, b) => {
                      const dateA = a.date ? new Date(a.date).getTime() : 0;
                      const dateB = b.date ? new Date(b.date).getTime() : 0;
                      return dateB - dateA;
                    }));
                  }
                } catch (err) {
                  processedCount++;
                  if (processedCount === totalMessages) {
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
            imap.end();
            reject(err);
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    } catch (error) {
      reject(error);
    }
  });
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: '未授权访问' }) };
  }

  const token = authHeader.split(' ')[1];
  if (!verifyToken(token)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: '无效的认证令牌' }) };
  }

  try {
    const emails = await fetchEmails();
    return { statusCode: 200, headers, body: JSON.stringify(emails) };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '获取邮件失败',
        details: error instanceof Error ? error.message : '未知错误'
      })
    };
  }
};
