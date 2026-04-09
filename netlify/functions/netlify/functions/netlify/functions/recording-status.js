exports.handler = async (event, context) => {
  // This receives recording status from Twilio
  // Recording URL will be available in the webhook
  const body = event.body ? new URLSearchParams(event.body) : new URLSearchParams();
  const recordingUrl = body.get('RecordingUrl');
  const callSid = body.get('CallSid');
  const duration = body.get('RecordingDuration');
 
  console.log('Recording completed:', { callSid, recordingUrl, duration });
 
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/xml' },
    body: '<Response></Response>'
  };
};
