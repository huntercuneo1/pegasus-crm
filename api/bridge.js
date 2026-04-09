export default function handler(req, res) {
  const to = req.query?.to || '';
  
  res.setHeader('Content-Type', 'text/xml');
  
  // When you answer your cell, this bridges you to the lead
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Number>${to}</Number>
  </Dial>
</Response>`);
}
