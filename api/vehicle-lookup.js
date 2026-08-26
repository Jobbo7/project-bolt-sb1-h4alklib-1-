// ─── PARTSFORGE SECURE MULTI-REGION VEHICLE REGISTRY BROKER ───
// FILE: api/vehicle-lookup.js

import { XMLParser } from 'fast-xml-parser';

export default async function handler(req, res) {
  // CORS Handshake security headers enable cross-platform tablet connections
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let cleanPlateText = '';
    const region = (req.query.region || req.body.region || 'AU_VIC').toUpperCase();

    // 1. Handle Post Payloads (Raw Tablet Camera base64 Snapshot Slices)
    if (req.method === 'POST') {
      const { image } = req.body;
      if (!image) return res.status(400).json({ error: 'Missing raw image byte stream data.' });

      const cleanBase64 = image.includes(',') ? image.split(',') : image;

      // Call your Vercel-internal cloud OCR proxy to parse the raw image
      const originUrl = typeof window !== 'undefined' ? window.location.origin : `https://${req.headers.host}`;
      const ocrResponse = await fetch(`${originUrl}/api/cloud-ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: cleanBase64 })
      });
      
      const ocrData = await ocrResponse.json();
      cleanPlateText = (ocrData.plate || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    } else {
      // 2. Handle Get Payloads (Manual Alphanumeric Keyboard Typing)
      const { plate, vin } = req.query;
      cleanPlateText = (plate || vin || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    }

    if (!cleanPlateText) {
      return res.status(422).json({ error: 'Failed to extract distinct registration details.' });
    }

    // 3. Live Australian Transport Registry Interception (RegCheck / CarRegistration API)
    const usernameKey = process.env.CARREGISTRATION_USERNAME || 'Jobbo7';
    
    // FIXED: Correctly grab index 1 to map 'AU_VIC' straight onto a clean 'VIC' primitive string
    const stateSelector = region.includes('_') ? region.split('_')[1] : 'VIC';

    console.log(`📡 Querying live state transport registry logs for: ${cleanPlateText} (State: ${stateSelector})`);
    
   // Live RegCheck Australia lookup.
const regCheckUrl =
  `https://www.regcheck.org.uk/api/reg.asmx/CheckAustralia` +
  `?RegistrationNumber=${encodeURIComponent(cleanPlateText)}` +
  `&State=${encodeURIComponent(stateSelector)}` +
  `&username=${encodeURIComponent(usernameKey)}`;

console.log(`📡 RegCheck request: ${regCheckUrl.replace(usernameKey, '[REDACTED]')}`);

const regResponse = await fetch(regCheckUrl);

if (regResponse.ok) {
  const rawXml = await regResponse.text();
  
  // Parse the returned XML envelope to extract the embedded vehicle data fields
  const parser = new XMLParser();
  const jsonObj = parser.parse(rawXml);
  const xmlWrapper = jsonObj['soap:Envelope']?.['soap:Body']?.CheckAustraliaResponse?.CheckAustraliaResult || jsonObj?.CheckAustraliaResult;
  
  if (xmlWrapper && xmlWrapper.vehicleJson) {
    const vehicle = JSON.parse(xmlWrapper.vehicleJson);
    
    console.log(`🟢 Live Registration Verified: Found ${vehicle.Make} ${vehicle.Model}`);
    return res.status(200).json({
      make: (vehicle.Make || 'GENUINE VEHICLE').toUpperCase(),
      model: (vehicle.Model || 'REGO MATCH').toUpperCase(),
      year: vehicle.RegistrationYear || vehicle.BuildYear || new Date().getFullYear(),
      engine: vehicle.EngineDescription || `${vehicle.EngineSize || 'Multi-Point'} ${vehicle.FuelType || 'Petrol'}`.toUpperCase(),
      vin: vehicle.Vin || vehicle.Chassis || `VIN-${cleanPlateText}`,
      rego: cleanPlateText
    });
  }
}
   // A failed upstream registry lookup must not be presented
// to the workshop as a successful vehicle lookup.
console.error(
  `❌ RegCheck lookup failed for ${cleanPlateText} (${stateSelector}). HTTP ${regResponse.status}`
);

return res.status(502).json({
  error: 'Vehicle registry lookup failed.',
  code: 'REGISTRY_UNAVAILABLE',
  rego: cleanPlateText,
  region
});
  } catch (err) {
    console.error('❌ Registry broker operation error:', err);
    return res.status(500).json({ error: 'Internal vehicle indexing infrastructure crash.' });
  }
}
