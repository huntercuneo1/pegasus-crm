const crypto = require('crypto');

function base64url(obj) {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return Buffer.from(str).toString('base64')
    .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const accountSid  = 'ACe63e8527401fc9035a5eeefdda09a979';
    const authToken   = 'ff5f897fd27a4889a484923d8e022dfa';
    const appSid      = 'AP1ec734d127905ed29a7946f7da1e9805';
    const identity    = 'hunter';
    const now         = Math.floor(Date.now() / 1000);

    // Twilio Access Token format
    const header = base64url({ cty: 'twilio-fpa;v=1', typ: 'JWT', alg: 'HS256' });
    
    const payload = base64url({
      jti: `${accountSid}-${now}`,
      iss: accountSid,
      sub: accountSid,
      iat: now,
      exp: now + 3600,
      grants: {
        identity: identity,
        voice: {
          outgoing: { application_sid: appSid },
          incoming: { allow: false }
        }
      }
    });

    const unsigned = `${header}.${payload}`;
    const sig = crypto
      .createHmac('sha256', authToken)
      .update(unsigned)
      .digest('base64')
      .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');

    const token = `${unsigned}.${sig}`;
    res.status(200).json({ token, identity });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
