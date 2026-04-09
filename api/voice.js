export default function handler(req, res) {
  const to = req.body?.To || req.query?.To || '';
  const from = '+12135392226';
  const yourCell = '+16263408897';

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (to && to.startsWith('+')) {
    // Dial your cell first, then bridge to the lead
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${from}" record="record-from-ringing" recordingStatusCallback="/api/recording-status">
    <Number url="/api/bridge?to=${encodeURIComponent(to)}">${yourCell}</Number>
  </Dial>
</Response>`);
  } else {
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid number.</Say>
</Response>`);
  }
}
