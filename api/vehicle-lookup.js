// ─── PARTSFORGE MULTI-REGION VEHICLE REGISTRY BROKER ───
// FILE: api/vehicle-lookup.js

export default async function handler(req, res) {
  // CORS headers for workshop tablets
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let cleanPlateText = '';

    const query = req.query || {};
    const body = req.body || {};

    const region = String(
      query.region || body.region || 'AU_VIC'
    ).toUpperCase();

    // 1. Handle POST payloads from the tablet camera
    if (req.method === 'POST') {
      const { image } = body;

      if (!image) {
        return res.status(400).json({
          error: 'Missing raw image byte stream data.',
          code: 'IMAGE_MISSING'
        });
      }

      // Preserve the base64 payload as a string.
      const cleanBase64 = String(image);

      // Call the internal OCR endpoint.
      const originUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : `https://${req.headers.host}`;

      const ocrResponse = await fetch(`${originUrl}/api/cloud-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: cleanBase64
        })
      });

      if (!ocrResponse.ok) {
        console.error(
          `❌ OCR service failed. HTTP ${ocrResponse.status}`
        );

        return res.status(502).json({
          error: 'Vehicle plate OCR service unavailable.',
          code: 'OCR_UNAVAILABLE'
        });
      }

      const ocrData = await ocrResponse.json();

      cleanPlateText = String(
        ocrData.plate || ''
      )
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase();
    } else {
      // 2. Handle GET payloads from manual registration entry
      const { plate, vin } = query;

      cleanPlateText = String(
        plate || vin || ''
      )
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase();
    }

    if (!cleanPlateText) {
      return res.status(422).json({
        error: 'Failed to extract distinct registration details.',
        code: 'REGISTRATION_MISSING'
      });
    }

    // 3. Australia provider
    // AU_VIC → VIC
    // AU_NSW → NSW
    // AU_QLD → QLD
    // etc.
    const stateSelector =
      region.includes('_')
        ? region.split('_')[1]
        : 'VIC';

    const australianStates = [
      'ACT',
      'NSW',
      'NT',
      'QLD',
      'SA',
      'TAS',
      'VIC',
      'WA'
    ];

    if (!australianStates.includes(stateSelector)) {
      return res.status(400).json({
        error: 'Unsupported Australian state or territory.',
        code: 'INVALID_REGION',
        region
      });
    }

    // 4. PlateAPI authentication
    const plateApiKey = process.env.PLATE_API_KEY;

    if (!plateApiKey) {
      console.error('❌ PLATE_API_KEY is not configured.');

      return res.status(500).json({
        error: 'Vehicle lookup provider is not configured.',
        code: 'VEHICLE_PROVIDER_CONFIG_MISSING'
      });
    }

    // 5. Live PlateAPI lookup
    const lookupUrl = new URL(
      'https://api.plateapi.com.au/api/v1/lookup'
    );

    lookupUrl.searchParams.set('plate', cleanPlateText);
    lookupUrl.searchParams.set('state', stateSelector);
    lookupUrl.searchParams.set('detailed', 'true');

    console.log(
      `📡 PlateAPI lookup: ${cleanPlateText} (${stateSelector})`
    );

    const plateResponse = await fetch(lookupUrl.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': plateApiKey,
        'Accept': 'application/json'
      }
    });

    let plateData;

    try {
      plateData = await plateResponse.json();
    } catch {
      console.error(
        `❌ PlateAPI returned invalid JSON. HTTP ${plateResponse.status}`
      );

      return res.status(502).json({
        error: 'Vehicle lookup provider returned an invalid response.',
        code: 'PROVIDER_INVALID_RESPONSE',
        rego: cleanPlateText,
        region
      });
    }

    // 6. Authentication failure
    if (plateResponse.status === 401) {
      console.error('❌ PlateAPI authentication failed.');

      return res.status(502).json({
        error: 'Vehicle lookup provider authentication failed.',
        code: 'PROVIDER_AUTH_FAILED'
      });
    }

    // 7. Rate limit / free quota exhausted
    if (plateResponse.status === 429) {
      console.error('❌ PlateAPI rate or quota limit reached.');

      return res.status(429).json({
        error: 'Vehicle lookup service rate or quota limit reached.',
        code: 'PROVIDER_RATE_LIMITED',
        rego: cleanPlateText,
        region
      });
    }

    // 8. Other provider failure
    if (!plateResponse.ok) {
      console.error(
        `❌ PlateAPI failed. HTTP ${plateResponse.status}`,
        plateData
      );

      return res.status(502).json({
        error: 'Vehicle lookup provider unavailable.',
        code: 'PROVIDER_UNAVAILABLE',
        rego: cleanPlateText,
        region
      });
    }

    // 9. PlateAPI successfully responded but did not find the plate
    if (!plateData.success) {
      console.log(
        `⚠️ Vehicle not found: ${cleanPlateText} (${stateSelector})`
      );

      return res.status(404).json({
        error: 'Vehicle registration was not found.',
        code: plateData.code || 'VEHICLE_NOT_FOUND',
        rego: cleanPlateText,
        region,
        source: 'plateapi'
      });
    }

    // 10. Normalise the provider response into the PartsForge format
    const vehicle = plateData.vehicle || {};

    const alternatives = Array.isArray(plateData.alternatives)
      ? plateData.alternatives
      : [];

    console.log(
      `🟢 Live Vehicle Verified: ${vehicle.make || ''} ${vehicle.model || ''}`
    );

    return res.status(200).json({
      success: true,

      source: 'plateapi',

      rego: cleanPlateText,

      region,

      country: 'AU',

      make: String(vehicle.make || '').toUpperCase(),

      model: String(vehicle.model || '').toUpperCase(),

      year:
        vehicle.lowest_year ||
        vehicle.highest_year ||
        null,

      yearRange: vehicle.year_range || null,

      body: vehicle.body || null,

      engine: vehicle.engine || null,

      description: vehicle.description || null,

      detailedDescription:
        vehicle.detailed_description || null,

      alternatives,

      sandbox: plateData.sandbox === true
    });

  } catch (err) {
    console.error(
      '❌ Vehicle registry broker operation error:',
      err
    );

    return res.status(500).json({
      error: 'Internal vehicle indexing infrastructure crash.',
      code: 'VEHICLE_LOOKUP_INTERNAL_ERROR'
    });
  }
}
