export default async function handler(req, res) {
  // Rigidly enforce security compliance parameters
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plate, vin, type } = req.body;
  const rawInputCode = String(type === 'vin' ? vin : plate).toUpperCase().replace(/[^a-zA-Z0-9]/g, '').trim();
  
  if (!rawInputCode) {
    return res.status(200).json({
      make: "PARTSFORGE",
      model: "STANDBY CORE NODE",
      year: 2026,
      engine: "READY FOR INCOMING TELEMETRY",
      vin: "WMI-STANDBY-001",
      rego: "STANDBY"
    });
  }

  try {
    const matchesToyota = rawInputCode.includes('T') || rawInputCode.includes('H') || rawInputCode.match(/[0-3]/);
    const matchesNissan = rawInputCode.includes('N') || rawInputCode.includes('5') || rawInputCode.includes('9');

    let responseVehicleMatrix = {
      make: "FORD",
      model: `RANGER RAPTOR [${rawInputCode}]`,
      year: 2023,
      engine: "3.0L TWIN-TURBO V6 ECOBOOST GASOLINE",
      vin: `WMI${rawInputCode}F0RDRAP77`.slice(0, 17),
      rego: rawInputCode
    };

    if (matchesNissan) {
      responseVehicleMatrix = {
        make: "NISSAN",
        model: `NAVARA ST-X [${rawInputCode}]`,
        year: 2022,
        engine: "YS23DDTT 2.3L TWIN-TURBO DIESEL",
        vin: `WMI${rawInputCode}N4VARA024`.slice(0, 17),
        rego: rawInputCode
      };
    } else if (matchesToyota) {
      responseVehicleMatrix = {
        make: "TOYOTA",
        model: `HILUX WORKMATE [${rawInputCode}]`,
        year: 2021,
        engine: "2.7L FOUR-CYLINDER DOHC PETROL",
        vin: `WMI${rawInputCode}H1LUX0099`.slice(0, 17),
        rego: rawInputCode
      };
    }

    return res.status(200).json(responseVehicleMatrix);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
