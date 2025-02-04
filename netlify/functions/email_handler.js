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
  try {
    const emails = await fetchEmails();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(emails)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

function fetchEmails() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    const emails = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) reject(err);
        
        const fetch = imap.seq.fetch('1:10', {
          bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          msg.on('body', stream => {
            simpleParser(stream, (err, parsed) => {
              if (err) reject(err);
              emails.push({
                subject: parsed.subject,
                from: parsed.from.text,
                date: parsed.date
              });
            });
          });
        });

        fetch.once('error', err => reject(err));
        
        fetch.once('end', () => {
          imap.end();
          resolve(emails);
        });
      });
    });

    imap.once('error', err => reject(err));
    imap.connect();
  });
} 