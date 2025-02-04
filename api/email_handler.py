import imaplib
import email
from email.header import decode_header
import json
from http.server import BaseHTTPRequestHandler
from datetime import datetime

IMAP_SERVER = 'imap.qq.com'
IMAP_PORT = 993
USERNAME = '1137583371@qq.com'
AUTHORIZATION_CODE = 'wrtckdfbevlujdec'

def get_emails():
    try:
        # 连接到IMAP服务器
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(USERNAME, AUTHORIZATION_CODE)
        
        # 选择收件箱
        mail.select('INBOX')
        
        # 搜索最新的10封邮件
        _, message_numbers = mail.search(None, 'ALL')
        email_list = []
        
        for num in message_numbers[0].split()[-10:]:
            _, msg_data = mail.fetch(num, '(RFC822)')
            email_body = msg_data[0][1]
            email_message = email.message_from_bytes(email_body)
            
            subject = decode_header(email_message["Subject"])[0]
            subject = subject[0] if isinstance(subject[0], str) else subject[0].decode()
            
            sender = decode_header(email_message["From"])[0]
            sender = sender[0] if isinstance(sender[0], str) else sender[0].decode()
            
            date = email_message["Date"]
            
            email_list.append({
                "subject": subject,
                "from": sender,
                "date": date
            })
        
        mail.close()
        mail.logout()
        return email_list
        
    except Exception as e:
        return {"error": str(e)}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        emails = get_emails()
        self.wfile.write(json.dumps(emails).encode())
        return 