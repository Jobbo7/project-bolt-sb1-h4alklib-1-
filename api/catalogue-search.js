// ─── PARTSFORGE AUSTRALIAN PARTS CATALOGUE BROKER ───
// FILE: api/catalogue-search.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const query = req.query || {};
    const body = req.body || {};

    const search =
      String(
        query.q ||
        query.query ||
        body.q ||
        body.query ||
        ''
      )
        .trim()
        .toLowerCase();

    const vehicle = {
      vin: String(query.vin || body.vin || '')
        .trim()
        .toUpperCase(),

      make: String(query.make || body.make || '')
        .trim()
        .toUpperCase(),

      model: String(query.model || body.model || '')
        .trim()
        .toUpperCase(),

      year:
        Number(query.year || body.year || 0) ||
        null,

      engine:
        String(query.engine || body.engine || '')
          .trim()
          .toUpperCase(),

      engineCode:
        String(
          query.engineCode ||
          body.engineCode ||
          ''
        )
          .trim()
          .toUpperCase(),

      series:
        String(query.series || body.series || '')
          .trim()
          .toUpperCase(),

      variant:
        String(query.variant || body.variant || '')
          .trim()
          .toUpperCase()
    };

    if (!search) {
      return res.status(400).json({
        success: false,
        error: 'Catalogue search term is required.',
        code: 'CATALOGUE_QUERY_MISSING'
      });
    }

    if (
      !vehicle.vin &&
      !vehicle.make &&
      !vehicle.model
    ) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle identity is required for catalogue search.',
        code: 'CATALOGUE_VEHICLE_MISSING'
      });
    }

    console.log(
      `📚 PartsForge catalogue search: "${search}" | ` +
      `${vehicle.year || ''} ${vehicle.make} ${vehicle.model} ` +
      `${vehicle.vin ? `VIN:${vehicle.vin}` : ''}`
    );

    // ─────────────────────────────────────────────
    // PROVIDER SLOT 1 — AutoInfo
    // ─────────────────────────────────────────────
    //
    // AutoInfo credentials / API mapping will be
    // connected here once commercial/test access
    // has been provisioned.
    //
    // IMPORTANT:
    // Do not manufacture catalogue parts while the
    // authoritative provider is unavailable.

    const autoInfoConfigured =
      Boolean(process.env.AUTOINFO_USERNAME) &&
      Boolean(process.env.AUTOINFO_PASSWORD);

    if (!autoInfoConfigured) {
      return res.status(200).json({
        success: true,

        source: null,

        providerReady: false,

        vehicle,

        query: search,

        parts: [],

        message:
          'Parts catalogue provider is not configured yet.'
      });
    }

    // ─────────────────────────────────────────────
    // Future AutoInfo request goes here.
    // ─────────────────────────────────────────────

    return res.status(501).json({
      success: false,
      source: 'autoinfo',
      providerReady: true,
      vehicle,
      query: search,
      parts: [],
      error:
        'AutoInfo credentials are configured but the provider mapping has not yet been enabled.',
      code: 'CATALOGUE_PROVIDER_NOT_IMPLEMENTED'
    });

  } catch (error) {
    console.error(
      '❌ PartsForge catalogue broker failure:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Parts catalogue infrastructure failure.',
      code: 'CATALOGUE_SEARCH_FAILED',
      parts: []
    });
  }
}
