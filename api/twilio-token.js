const twilio = require('twilio');
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const accountSid   = 'ACe63e8527401fc9035a5eeefdda09a979';
    const apiKeySid    = 'SK51764bb9dcc7aad5fe3d18125085ab40';
    const apiKeySecret = 'QNlKvZbliC9QBBtqRwZo15nRio9spq15';
    const appSid       = 'AP1ec734d127905ed29a7946f7da1e9805';

    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
      identity: 'hunter',
      ttl: 3600
    });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: appSid,
      incomingAllow: false
    });

    token.addGrant(voiceGrant);

    res.status(200).json({ token: token.toJwt(), identity: 'hunter' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
