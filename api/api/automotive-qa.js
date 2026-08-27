export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    return res.status(503).json({ error: 'DIAGNOSTICS_AI_NOT_CONFIGURED' });
  }

  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  const vehicle = req.body?.vehicleContext || {};
  if (!question) return res.status(400).json({ error: 'QUESTION_REQUIRED' });
  if (question.length > 3000) return res.status(413).json({ error: 'QUESTION_TOO_LONG' });

  const input = `You are an automotive diagnostic assistant. Give cautious, structured guidance and advise inspection by a qualified technician. Never claim a definitive diagnosis from limited information. Vehicle: ${vehicle.year || 'unknown year'} ${vehicle.make || ''} ${vehicle.model || ''}, engine ${vehicle.engine || 'unknown'}. Question: ${question}. Return only JSON with keys description, difficulty, estimatedCost, estimatedTime, requiredTools, safetyWarnings, diagnosticSteps.`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL, input }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI API error', response.status, data?.error?.type);
      return res.status(502).json({ error: 'DIAGNOSTICS_AI_FAILED' });
    }
    const text = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === 'output_text')
      .map(item => item.text)
      .join('')
      .replace(/^\`\`\`json\s*|\`\`\`$/g, '')
      .trim();
    const analysis = JSON.parse(text);
    return res.status(200).json({ success: true, analysis });
  } catch (error) {
    console.error('Diagnostics AI error', error);
    return res.status(502).json({ error: 'DIAGNOSTICS_AI_UNAVAILABLE' });
  }
}
