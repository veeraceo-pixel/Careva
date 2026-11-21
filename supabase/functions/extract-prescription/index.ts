// Reads a prescription photo or PDF with Claude and returns {hospital, doctor, date, follow_up, medicines[]}.
// Only signed-in users can call it (Supabase checks the login token). The API key stays on the server.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const PROMPT = `You are reading a medical prescription (printed or handwritten, possibly from an Indian hospital). Reply with JSON only, no other text:
{"hospital":"","doctor":"","date":"YYYY-MM-DD","follow_up":"YYYY-MM-DD","medicines":[{"name":"","dose":"","frequency":"","duration":""}]}
Rules: "hospital" is the hospital, clinic or scheme name at the top. "doctor" is the prescribing doctor (include Dr.). "date" is the prescription date, read day-first (dd/mm/yyyy). "follow_up" is the next review date; if only a relative time is written (e.g. "review after 1 week") add it to the prescription date; "" if none. "medicines" lists every drug: "name" is the drug name only, "dose" like "500 mg", "frequency" as written (e.g. "1-0-1 after food", "twice daily", "at night"), "duration" like "5 days". Use "" for anything you cannot read and never guess a drug name.`;
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { image, mediaType } = await req.json();
    const block = mediaType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: image } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 1500, messages: [{ role: 'user', content: [block, { type: 'text', text: PROMPT }] }] })
    });
    const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'Claude request failed');
    const text = (j.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim();
    return new Response(text, { headers: { ...cors, 'content-type': 'application/json' } });
  } catch (e) { return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 500, headers: { ...cors, 'content-type': 'application/json' } }); }
});
