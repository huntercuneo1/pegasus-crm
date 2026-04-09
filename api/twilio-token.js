const crypto = require('crypto');

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

function createJWT(accountSid, secret, appSid) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ typ:'JWT', alg:'HS256' }));
  const payload = base64url(JSON.stringify({
    jti: `${accountSid}-${now}`,
    iss: accountSid,
    sub: accountSid,
    iat: now,
    exp: now + 3600,
    grants: {
      identity: 'pegasus-crm-user',
      voice: {
        outgoing: { application_sid: appSid },
        incoming: { allow: false }
      }
    }
  }));
  const unsigned = `${header}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(unsigned).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return `${unsigned}.${sig}`;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const token = createJWT(
      'ACe63e8527401fc9035a5eeefdda09a979',
      'ff5f897fd27a4889a484923d8e022dfa',
      'AP1ec734d127905ed29a7946f7da1e9805'
    );
    res.status(200).json({ token });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
