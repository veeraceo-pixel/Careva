// Reads a prescription photo or PDF with an AI vision model and returns {hospital, doctor, date, follow_up, medicines[]}.
// Uses Google Gemini if GEMINI_API_KEY is set (free tier available), otherwise Claude if ANTHROPIC_API_KEY is set.
// Only signed-in users can call it (Supabase checks the login token). API keys stay on the server.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const PROMPT = `You are reading a medical prescription (printed or handwritten, possibly from an Indian hospital or health scheme). Reply with JSON only, no other text:
{"hospital":"","doctor":"","date":"YYYY-MM-DD","follow_up":"YYYY-MM-DD","medicines":[{"name":"","dose":"","frequency":"","duration":""}]}
Rules: "hospital" is the hospital, clinic or scheme name at the top. "doctor" is the prescribing doctor (include Dr.). "date" is the prescription date, read day-first (dd/mm/yyyy). "follow_up" is the next review date; if only a relative time is written (e.g. "review after 1 week") add it to the prescription date; "" if none. "medicines" lists every drug: "name" is the drug name only, "dose" like "500 mg", "frequency" as written (e.g. "1-0-1 after food", "twice daily", "at night"), "duration" like "5 days". Indian prescription conventions: "T." or "Tab" = tablet, "Cap" = capsule, "Syp" = syrup, "Inj" = injection. Brand names include their strength, so "T. TELMA BS 40/2.5" has name "Telma BS" and dose "40/2.5". Frequency patterns: morning-afternoon-night, so "1-0-0" is morning only, "0-1-0" afternoon only, "0-0-1" night only, "1-0-1" morning and night; keep the pattern as written. "R/A", "RA", "RV" or "review" with a period (e.g. "R/A 2 mths") is the follow-up: add it to the prescription date. "SOS" means only when needed. The patient's name is NOT the doctor: if no doctor name is printed (only a signature), return "" for doctor. Ignore vitals (BP, SpO2, PR), echo notes and lists of tests advised. Use "" for anything you cannot read and never guess a drug name; if unsure of a value, still give your best reading but leave out words you cannot see.`;
const json = (o: unknown, status = 200) => new Response(typeof o === 'string' ? o : JSON.stringify(o), { status, headers: { ...cors, 'content-type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { image, mediaType } = await req.json();
    const gemini = Deno.env.get('GEMINI_API_KEY'), claude = Deno.env.get('ANTHROPIC_API_KEY');
    let text = '{}';
    if (gemini) {
      const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': gemini, 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mediaType, data: image } }, { text: PROMPT }] }], generationConfig: { temperature: 0, responseMimeType: 'application/json' } })
      });
      const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'Gemini request failed');
      text = (j.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || '').join('') || '{}';
    } else if (claude) {
      const block = mediaType === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: image } }
        : { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } };
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': claude, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 1500, messages: [{ role: 'user', content: [block, { type: 'text', text: PROMPT }] }] })
      });
      const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'Claude request failed');
      text = j.content?.[0]?.text || '{}';
    } else throw new Error('No API key set. Set GEMINI_API_KEY or ANTHROPIC_API_KEY.');
    return json(text.replace(/```json|```/g, '').trim());
  } catch (e) { return json({ error: String((e as Error).message || e) }, 500); }
});
