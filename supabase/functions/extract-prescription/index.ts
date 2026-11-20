// Reads a prescription image and returns {hospital, doctor, date, follow_up, medicines[]}.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const PROMPT = `This is a medical prescription. Reply with JSON only: {"hospital":"","doctor":"","date":"YYYY-MM-DD","follow_up":"YYYY-MM-DD","medicines":[{"name":"","dose":"","frequency":"","duration":""}]}. "date" is the prescription date. "follow_up" is the next review date; convert relative wording (e.g. "after 2 weeks") using the prescription date; use "" if none. Use "" for anything unreadable and never guess medicine names.`;
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const { image, mediaType } = await req.json();
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 1000, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: image } }, { type: 'text', text: PROMPT }] }] })
  });
  const j = await r.json(); const text = (j.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim();
  return new Response(text, { headers: { ...cors, 'content-type': 'application/json' } });
});
