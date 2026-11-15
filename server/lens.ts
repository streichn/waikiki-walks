// Supabase Edge Function: lens ("What am I looking at?")
// Receives a photo plus the stops the phone thinks are in view (from GPS and compass),
// and asks a vision model to choose among ONLY those stops, or say none match.
// Constraining the choice to the book's stops keeps answers tied to Veneeta's text.
// Deploy: supabase functions deploy lens --no-verify-jwt   (set ANTHROPIC_API_KEY as a secret)

type Candidate = { id: string; title: string; distance: number; summary?: string };

Deno.serve(async (req) => {
  const { image, candidates } = (await req.json()) as { image: string; candidates: Candidate[] };
  if (!image || !candidates?.length) return Response.json({ stopId: null, reason: 'Nothing nearby to compare.' });

  const list = candidates.map((c, i) => `${i + 1}. [${c.id}] ${c.title} (${c.distance} m away). ${c.summary ?? ''}`).join('\n');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-5-5',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            {
              type: 'text',
              text: `A walker in Waikīkī took this photo. Which of these places from a walking-tour book is it most likely showing?\n${list}\n\nReply as JSON: {"stopId": "<id or null>", "reason": "<one short sentence>"}. Use null if none fits.`,
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return Response.json({ stopId: candidates[0].id, reason: 'Matched by location and direction.' });
  const out = await res.json();
  try {
    const text = out.content?.[0]?.text ?? '{}';
    return Response.json(JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)));
  } catch {
    return Response.json({ stopId: candidates[0].id, reason: 'Matched by location and direction.' });
  }
});
