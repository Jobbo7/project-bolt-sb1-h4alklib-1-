// ─── PARTSFORGE VIN SPECIFICATION DECODER ───
// FILE: api/vin-lookup.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed.',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    const rawVin = String(req.query?.vin || '')
      .trim()
      .toUpperCase();

    const cleanVin = rawVin.replace(/[^A-Z0-9]/g, '');

    if (!cleanVin) {
      return res.status(400).json({
        success: false,
        error: 'VIN is required.',
        code: 'VIN_MISSING'
      });
    }

    if (cleanVin.length !== 17) {
      return res.status(422).json({
        success: false,
        error: 'VIN must contain exactly 17 characters.',
        code: 'VIN_INVALID_LENGTH',
        vin: cleanVin
      });
    }

    // VINs do not use I, O or Q.
    if (/[IOQ]/.test(cleanVin)) {
      return res.status(422).json({
        success: false,
        error: 'VIN contains invalid characters.',
        code: 'VIN_INVALID_CHARACTERS',
        vin: cleanVin
      });
    }

    console.log(`📡 Decoding VIN through vPIC: ${cleanVin}`);

    const lookupUrl =
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(cleanVin)}?format=json`;

    const response = await fetch(lookupUrl, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ vPIC request failed. HTTP ${response.status}`);

      return res.status(502).json({
        success: false,
        error: 'VIN decoding provider unavailable.',
        code: 'VIN_PROVIDER_UNAVAILABLE'
      });
    }

    const payload = await response.json();

    const vehicle = payload?.Results?.[0];

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'VIN could not be decoded.',
        code: 'VIN_NOT_FOUND',
        vin: cleanVin
      });
    }

    const errorCode = String(vehicle.ErrorCode || '');

    // vPIC uses ErrorCode 0 for a clean decode.
    // Some non-zero responses can still contain useful partial data,
    // so we return the decoded fields together with the provider message.
    const decoded = {
      success: true,
      source: 'nhtsa-vpic',

      vin: cleanVin,

      make: vehicle.Make || null,
      model: vehicle.Model || null,
      year: vehicle.ModelYear || null,

      manufacturer: vehicle.Manufacturer || null,
      vehicleType: vehicle.VehicleType || null,
      body: vehicle.BodyClass || null,

      series: vehicle.Series || null,
      trim: vehicle.Trim || null,

      driveType: vehicle.DriveType || null,

      fuelType: vehicle.FuelTypePrimary || null,
      secondaryFuelType: vehicle.FuelTypeSecondary || null,

      engineModel: vehicle.EngineModel || null,
      engineManufacturer: vehicle.EngineManufacturer || null,
      engineCylinders: vehicle.EngineCylinders || null,

      displacementL:
        vehicle.DisplacementL || null,

      enginePowerHp:
        vehicle.EngineHP || null,

      transmissionStyle:
        vehicle.TransmissionStyle || null,

      transmissionSpeeds:
        vehicle.TransmissionSpeeds || null,

      doors:
        vehicle.Doors || null,

      cabType:
        vehicle.CabType || null,

      plantCity:
        vehicle.PlantCity || null,

      plantCountry:
        vehicle.PlantCountry || null,

      plantState:
        vehicle.PlantState || null,

      gvwr:
        vehicle.GVWR || null,

      errorCode,
      providerMessage:
        vehicle.ErrorText || null
    };

    console.log(
      `🟢 VIN decoded: ${decoded.year || ''} ${decoded.make || ''} ${decoded.model || ''}`
    );

    return res.status(200).json(decoded);

  } catch (error) {
    console.error('❌ VIN decoder crash:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal VIN decoder error.',
      code: 'VIN_LOOKUP_INTERNAL_ERROR'
    });
  }
}
