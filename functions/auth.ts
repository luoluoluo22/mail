import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const APP_PASSWORD = process.env.APP_PASSWORD || '123456';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const handler: Handler = async (event) => {
    // 只允许POST请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: '方法不允许' })
        };
    }

    try {
        const { password } = JSON.parse(event.body || '{}');

        // 验证密码
        if (password !== APP_PASSWORD) {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, message: '密码错误' })
            };
        }

        // 生成JWT token
        const token = jwt.sign({ authorized: true }, JWT_SECRET, { expiresIn: '7d' });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                token
            })
        };
    } catch (error) {
        console.error('认证错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: '服务器错误' })
        };
    }
}; 