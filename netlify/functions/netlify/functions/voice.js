exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/xml'
  };
 
  const body = event.body ? new URLSearchParams(event.body) : new URLSearchParams();
  const to = body.get('To') || '';
  const from = '+12135392226';
 
  let twiml = '';
 
  if (to && to.startsWith('+')) {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${from}" record="record-from-ringing" recordingStatusCallback="/.netlify/functions/recording-status">
    <Number>${to}</Number>
  </Dial>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid number. Please try again.</Say>
</Response>`;
  }
 
  return {
    statusCode: 200,
    headers,
    body: twiml
  };
};
