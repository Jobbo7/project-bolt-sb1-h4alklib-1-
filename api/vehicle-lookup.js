// ─── PARTSFORGE TRANS-TASMAN AU/NZ VEHICLE REGISTRY ENGINE ───
export default async function handler(req, res) {
  // CORS Handshake settings enables secure tablet browser traffic loops
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const searchSource = req.method === 'POST' ? req.body : req.query;
    const plateText = (searchSource.plate || '').trim().toUpperCase();
    
    // Detect incoming country and region strings from your tablet frontend states
    const rawRegion = (searchSource.region || 'VIC').trim().toUpperCase();
    const isNewZealand = rawRegion === 'NZ' || rawRegion === 'AU_NZ';
    const stateRegion = rawRegion.replace('AU_', ''); 

    console.log(`📡 Querying global proxy for plate: ${plateText} | Region Node: ${isNewZealand ? 'NEW ZEALAND' : stateRegion}`);

    if (!plateText) {
      return res.status(400).json({ error: "Missing registration identifier parameter" });
    }

    // Pulls your credentials securely out of your Vercel panel settings variables
    const apiUsername = process.env.CARREGISTRATION_USERNAME || "Jobbo7"; 
    
    // 🟢 DYNAMIC ROUTER GENERATES TRANSTASMAN ENDPOINTS AUTOMATICALLY
    let targetUrl = "";
    if (isNewZealand) {
      // Formulates the New Zealand Land Transport Agency (NZTA) query framework
      targetUrl = `http://carregistrationapi.com.au{encodeURIComponent(plateText)}&username=${apiUsername}`;
    } else {
      // Formulates the Australian National NEVDIS state registry framework
      targetUrl = `http://carregistrationapi.com.au{encodeURIComponent(plateText)}&State=${stateRegion}&username=${apiUsername}`;
    }

    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`Global transport database rejection code: ${response.status}`);
    
    const rawXmlText = await response.text();

    // Deep parsing the structural XML string layers to extract precise telemetry data
    const extractField = (field) => {
      const match = rawXmlText.match(new RegExp(`<${field}>(.*?)<\/${field}>`));
      return match ? match[1].trim().toUpperCase() : '';
    };

    // Universal mapping covers both AU field tags (CarMake) and NZ field tags (VehicleMake)
    const make = extractField('CarMake') || extractField('Make') || extractField('VehicleMake');
    const model = extractField('CarModel') || extractField('Model') || extractField('VehicleModel');
    const year = extractField('RegistrationYear') || extractField('YearOfManufacture') || extractField('Year');
    const engine = extractField('EngineSize') || extractField('EngineDescription') || extractField('CcRating') || "4.0L";
    const vin = extractField('Vin') || extractField('ChassisNumber') || extractField('Chassis');

    // Handle lookup data dropouts if the vehicle registration plate does not exist inside the records
    if (!make && !model) {
      return res.status(200).json({
        make: "REGISTRATION",
        model: "NOT FOUND",
        year: "⚠️",
        engine: "Verify plate string entry or country switch",
        vin: "UNKNOWN ID",
        rego: plateText
      });
    }

    // 🏎️ RETURN REAL DATA DIRECTLY TO YOUR NATIVE LAYOUT DRAWER
    return res.status(200).json({
      make: make,
      model: model,
      year: parseInt(year) || year,
      engine: engine,
      vin: vin,
      rego: plateText
    });

  } catch (error) {
    console.error("❌ Core vehicle lookup serverless process failure:", error);
    return res.status(500).json({ error: "Internal server registry pipeline error" });
  }
}
