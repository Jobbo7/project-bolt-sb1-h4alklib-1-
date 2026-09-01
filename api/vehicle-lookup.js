// ─── PARTSFORGE MULTI-REGION VEHICLE REGISTRY BROKER ───
// FILE: api/vehicle-lookup.js

export default async function handler(req, res) {
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

    // ─────────────────────────────────────────────
    // 1. Registration source
    // ─────────────────────────────────────────────
    if (req.method === 'POST') {
      const { image } = body;

      if (!image) {
        return res.status(400).json({
          error: 'Missing raw image byte stream data.',
          code: 'IMAGE_MISSING'
        });
      }

      const cleanBase64 = String(image);

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const originUrl = `${protocol}://${req.headers.host}`;

      const ocrResponse = await fetch(`${originUrl}/api/ocr-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: cleanBase64
        })
      });

      if (!ocrResponse.ok) {
        return res.status(502).json({
          error: 'Vehicle plate OCR service unavailable.',
          code: 'OCR_UNAVAILABLE'
        });
      }

      const ocrData = await ocrResponse.json();

      cleanPlateText = String(ocrData.plate || '')
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase();

    } else {
      cleanPlateText = String(query.plate || '')
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase();
    }

    if (!cleanPlateText) {
      return res.status(422).json({
        error: 'Registration number is required.',
        code: 'REGISTRATION_MISSING'
      });
    }

    // ─────────────────────────────────────────────
    // 2. Region normalisation
    // ─────────────────────────────────────────────
    const stateSelector = region.includes('_')
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

    // ─────────────────────────────────────────────
    // 3. CarRegistrationAPI VIN enrichment
    // ─────────────────────────────────────────────
    let registryData = null;

    const registryUsername =
      process.env.CARREGISTRATION_USERNAME;

    if (registryUsername) {
      try {
        const regUrl = new URL(
          'https://www.regcheck.org.uk/api/reg.asmx/CheckAustralia'
        );

        regUrl.searchParams.set(
          'RegistrationNumber',
          cleanPlateText
        );

        regUrl.searchParams.set(
          'State',
          stateSelector
        );

        regUrl.searchParams.set(
          'username',
          registryUsername
        );

        console.log(
          `📡 CarRegistrationAPI VIN lookup: ${cleanPlateText} (${stateSelector})`
        );

        const regResponse = await fetch(regUrl.toString());

        console.log(
          `CarRegistrationAPI response: HTTP ${regResponse.status}`
        );

        if (regResponse.ok) {
          const xmlText = await regResponse.text();

          // Extract <vehicleJson>...</vehicleJson>
          // without requiring XML parsing in the frontend.
          const match = xmlText.match(
            /<vehicleJson[^>]*>([\s\S]*?)<\/vehicleJson>/i
          );

          if (match?.[1]) {
            const decodedJson = match[1]
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');

            try {
              registryData = JSON.parse(decodedJson);

              console.log(
                `🟢 Registry enrichment received for ${cleanPlateText}`
              );
            } catch (parseError) {
              console.warn(
                '⚠️ CarRegistrationAPI returned an unreadable vehicle payload.',
                { code: 'REGISTRY_PAYLOAD_INVALID_JSON' }
              );
            }
          } else {
            console.warn(
              '⚠️ CarRegistrationAPI returned no vehicle payload.',
              {
                code: /<soap:Fault>|<faultcode>/i.test(xmlText)
                  ? 'REGISTRY_SOAP_FAULT'
                  : 'REGISTRY_PAYLOAD_MISSING',
                contentType: regResponse.headers.get('content-type') || 'unknown',
                responseBytes: xmlText.length
              }
            );
          }
        } else {
          console.warn(
            '⚠️ CarRegistrationAPI request was rejected.',
            {
              code: 'REGISTRY_HTTP_ERROR',
              status: regResponse.status
            }
          );
        }
      } catch (registryError) {
        // IMPORTANT:
        // Registry failure must not break the working PlateAPI lookup.
        console.warn(
          '⚠️ VIN enrichment unavailable; continuing with PlateAPI:',
          registryError
        );
      }
    }

    // ─────────────────────────────────────────────
    // 4. PlateAPI vehicle identification
    // ─────────────────────────────────────────────
    const plateApiKey = process.env.PLATE_API_KEY;

    if (!plateApiKey) {
      return res.status(500).json({
        error: 'Vehicle lookup provider is not configured.',
        code: 'VEHICLE_PROVIDER_CONFIG_MISSING'
      });
    }

    const lookupUrl = new URL(
      'https://api.plateapi.com.au/api/v1/lookup'
    );

    lookupUrl.searchParams.set(
      'plate',
      cleanPlateText
    );

    lookupUrl.searchParams.set(
      'state',
      stateSelector
    );

    lookupUrl.searchParams.set(
      'detailed',
      'true'
    );

    console.log(
      `📡 PlateAPI lookup: ${cleanPlateText} (${stateSelector})`
    );

    const plateResponse = await fetch(
      lookupUrl.toString(),
      {
        method: 'GET',
        headers: {
          'X-API-Key': plateApiKey,
          Accept: 'application/json'
        }
      }
    );

    let plateData;

    try {
      plateData = await plateResponse.json();
    } catch {
      return res.status(502).json({
        error: 'Vehicle lookup provider returned an invalid response.',
        code: 'PROVIDER_INVALID_RESPONSE',
        rego: cleanPlateText,
        region
      });
    }

    if (plateResponse.status === 401) {
      return res.status(502).json({
        error: 'Vehicle lookup provider authentication failed.',
        code: 'PROVIDER_AUTH_FAILED'
      });
    }

    if (plateResponse.status === 429) {
      return res.status(429).json({
        error: 'Vehicle lookup service quota limit reached.',
        code: 'PROVIDER_RATE_LIMITED',
        rego: cleanPlateText,
        region
      });
    }

    if (!plateResponse.ok) {
      return res.status(502).json({
        error: 'Vehicle lookup provider unavailable.',
        code: 'PROVIDER_UNAVAILABLE',
        rego: cleanPlateText,
        region
      });
    }

   // PlateAPI may not recognise CarRegistrationAPI's free test plates.
// If the registry provider already returned real vehicle data,
// continue using that instead of failing the whole lookup.
if (!plateData.success && !registryData) {
  return res.status(404).json({
    error: 'Vehicle registration was not found.',
    code: plateData.code || 'VEHICLE_NOT_FOUND',
    rego: cleanPlateText,
    region
  });
}

    // ─────────────────────────────────────────────
    // 5. Merge both providers
    // ─────────────────────────────────────────────
    const vehicle = plateData.success
  ? (plateData.vehicle || {})
  : {};
    const alternatives = Array.isArray(
      plateData.alternatives
    )
      ? plateData.alternatives
      : [];

    const registryMake =
      registryData?.CarMake?.CurrentTextValue ||
      registryData?.MakeDescription?.CurrentTextValue ||
      null;

    const registryModel =
      registryData?.CarModel?.CurrentTextValue ||
      registryData?.ModelDescription?.CurrentTextValue ||
      null;

    // NOTE:
    // Their API deliberately spells this field
    // "VechileIdentificationNumber".
    const vin =
      registryData?.VechileIdentificationNumber ||
      registryData?.VIN ||
      null;

    const engineNumber =
      registryData?.Engine ||
      registryData?.EngineNumber ||
      null;
    // ─────────────────────────────────────────────
// VIN specification enrichment
// ─────────────────────────────────────────────
let vinSpecs = null;

if (vin) {
  try {
    console.log(`📡 Auto-decoding registry VIN: ${vin}`);

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const vinLookupUrl =
      `${protocol}://${req.headers.host}/api/vin-lookup?vin=${encodeURIComponent(vin)}`;

    const vinResponse = await fetch(vinLookupUrl);

    if (vinResponse.ok) {
      const vinData = await vinResponse.json();

      if (vinData?.success) {
        vinSpecs = vinData;

        console.log(
          `🟢 VIN specifications received: ${vinData.year || ''} ${vinData.make || ''} ${vinData.model || ''}`
        );
      }
    } else {
      console.warn(
        `⚠️ VIN decoder returned HTTP ${vinResponse.status}`
      );
    }
  } catch (vinError) {
    // VIN decoding failure must never break the working rego lookup.
    console.warn(
      '⚠️ VIN decoder unavailable; continuing with registration data:',
      vinError
    );
  }
}

    const result = {
      success: true,

      source: registryData
        ? 'plateapi+carregistrationapi'
        : 'plateapi',

      rego: cleanPlateText,

      region,

      country: 'AU',

      make: String(
        vehicle.make ||
        registryMake ||
        ''
      ).toUpperCase(),

      model: String(
        vehicle.model ||
        registryModel ||
        ''
      ).toUpperCase(),

      year:
        vehicle.lowest_year ||
        registryData?.RegistrationYear ||
        vehicle.highest_year ||
        null,

      yearRange:
        vehicle.year_range ||
        null,

      body:
        vehicle.body ||
        registryData?.BodyStyle?.CurrentTextValue ||
        registryData?.BodyStyle ||
        null,

      engine:
        vehicle.engine ||
        null,

      vin,

      engineNumber,

      colour:
        registryData?.Colour ||
        null,

      complianceDate:
        registryData?.ComplianceDate ||
        null,

      registrationExpiry:
        registryData?.Expiry ||
        null,

      registrationSerialNumber:
        registryData?.RegistrationSerialNumber ||
        null,

      stolen:
        registryData?.Stolen ||
        null,

      goodsCarryingVehicle:
        registryData?.GoodsCarryingVehicle ||
        null,

      description:
        vehicle.description ||
        registryData?.Description ||
        null,

      detailedDescription:
        vehicle.detailed_description ||
        null,

      alternatives,

      sandbox:
        plateData.sandbox === true,

      registryMatched:
        Boolean(registryData),

      vinMatched:
        Boolean(vin)
    };

    console.log(
      `🟢 PartsForge vehicle: ${result.year || ''} ${result.make} ${result.model} VIN:${result.vinMatched ? 'YES' : 'NO'}`
    );

    return res.status(200).json(result);

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
