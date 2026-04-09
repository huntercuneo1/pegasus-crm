export default function handler(req, res) {
  console.log('Recording:', req.body);
  res.status(200).send('<Response></Response>');
}
