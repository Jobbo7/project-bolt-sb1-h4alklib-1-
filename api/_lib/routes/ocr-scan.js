const MAX_IMAGE_LENGTH = 8_000_000;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'OCR_NOT_CONFIGURED' });

  const image = typeof req.body?.image === 'string' ? req.body.image : '';
  if (!image) return res.status(400).json({ error: 'MISSING_IMAGE_DATA' });
  if (image.length > MAX_IMAGE_LENGTH) return res.status(413).json({ error: 'IMAGE_TOO_LARGE' });

  const base64Image = image.startsWith('data:image') ? image : `data:image/jpeg;base64,${image}`;
  const body = new URLSearchParams({ base64Image, language: 'eng', isOverlayRequired: 'false' });

  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await response.json();
    if (!response.ok || data?.IsErroredOnProcessing) {
      return res.status(502).json({ error: 'OCR_PROVIDER_FAILED' });
    }
    const parsed = data?.ParsedResults?.map(result => result?.ParsedText || '').join(' ') || '';
    const candidates = parsed.toUpperCase().match(/[A-Z0-9]{2,8}/g) || [];
    const plate = candidates.sort((a, b) => b.length - a.length)[0] || '';
    if (!plate) return res.status(422).json({ error: 'PLATE_NOT_DETECTED' });
    return res.status(200).json({ plate });
  } catch (error) {
    console.error('OCR provider error', error);
    return res.status(502).json({ error: 'OCR_PROVIDER_UNAVAILABLE' });
  }
}
