import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const APP_PASSWORD = process.env.APP_PASSWORD || '123456';
const JWT_SECRET = process.env.JWT_SECRET || 'sage-baklava-cb044e';

export const handler: Handler = async (event) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: '方法不允许' })
    };
  }

  try {
    const { password } = JSON.parse(event.body || '{}');

    // 验证密码
    if (password !== APP_PASSWORD) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: '密码错误' })
      };
    }

    // 生成JWT token
    const token = jwt.sign({ authorized: true }, JWT_SECRET, { expiresIn: '7d' });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token
      })
    };
  } catch (error) {
    console.error('认证错误:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: '服务器错误' })
    };
  }
}; 