export default function handler(req, res) {
  const to = req.body?.To || req.query?.To || '';
  const from = '+12135392226';
  const yourCell = '+16263408897';

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (to && to.startsWith('+1626')) {
    // Inbound call to your Twilio number — forward to your cell
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${from}">
    <Number>${yourCell}</Number>
  </Dial>
</Response>`);
  } else if (to && to.startsWith('+')) {
    // Outbound call from browser to lead
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${from}" record="record-from-ringing" recordingStatusCallback="/api/recording-status">
    <Number>${to}</Number>
  </Dial>
</Response>`);
  } else {
    // Inbound call with no specific destination — forward to cell
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${from}">
    <Number>${yourCell}</Number>
  </Dial>
</Response>`);
  }
}
