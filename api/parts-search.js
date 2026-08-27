// ─── PARTSFORGE VEHICLE-AWARE PARTS SOURCING BROKER ───
// FILE: api/parts-search.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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

    const searchParam =
      query.q ||
      query.query ||
      body.query ||
      '';

    if (!String(searchParam).trim()) {
      return res.status(200).json({
        local: [],
        national: [],
        trans_tasman: [],
        global_direct: [],
        facebook: []
      });
    }

    const cleanQuery = String(searchParam)
      .trim()
      .toLowerCase();

    // Vehicle context supplied by PartsForge.
    const vehicle = {
      vin: String(query.vin || body.vin || '')
        .trim()
        .toUpperCase(),

      make: String(query.make || body.make || '')
        .trim()
        .toLowerCase(),

      model: String(query.model || body.model || '')
        .trim()
        .toLowerCase(),

      year: Number(query.year || body.year || 0) || null,

      engine: String(query.engine || body.engine || '')
        .trim()
        .toLowerCase(),

      engineCode: String(
        query.engineCode ||
        body.engineCode ||
        ''
      )
        .trim()
        .toLowerCase(),

      series: String(query.series || body.series || '')
        .trim()
        .toLowerCase(),

      variant: String(query.variant || body.variant || '')
        .trim()
        .toLowerCase()
    };

   console.log(
  `📡 PartsForge parts search: "${cleanQuery}" for ${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`
);

// ─────────────────────────────────────────────
// AUTHORITATIVE PARTS CATALOGUE LOOKUP
// ─────────────────────────────────────────────
let catalogueData = null;
let catalogueParts = [];

try {
  const catalogueUrl = new URL(
    `https://${req.headers.host}/api/catalogue-search`
  );

  catalogueUrl.searchParams.set('q', cleanQuery);

  if (vehicle.vin) {
    catalogueUrl.searchParams.set('vin', vehicle.vin);
  }

  if (vehicle.make) {
    catalogueUrl.searchParams.set('make', vehicle.make);
  }

  if (vehicle.model) {
    catalogueUrl.searchParams.set('model', vehicle.model);
  }

  if (vehicle.year) {
    catalogueUrl.searchParams.set('year', String(vehicle.year));
  }

  if (vehicle.engine) {
    catalogueUrl.searchParams.set('engine', vehicle.engine);
  }

  if (vehicle.engineCode) {
    catalogueUrl.searchParams.set(
      'engineCode',
      vehicle.engineCode
    );
  }

  if (vehicle.series) {
    catalogueUrl.searchParams.set('series', vehicle.series);
  }

  if (vehicle.variant) {
    catalogueUrl.searchParams.set('variant', vehicle.variant);
  }

  console.log(
    `📚 Checking authoritative catalogue for "${cleanQuery}"`
  );

  const catalogueResponse = await fetch(
    catalogueUrl.toString()
  );

  if (catalogueResponse.ok) {
    catalogueData = await catalogueResponse.json();

    if (Array.isArray(catalogueData?.parts)) {
      catalogueParts = catalogueData.parts;
    }

    console.log(
      `📚 Catalogue result: ${catalogueParts.length} authoritative part(s)`
    );
  }

} catch (catalogueError) {
  console.warn(
    '⚠️ Catalogue provider unavailable; continuing with supplier search:',
    catalogueError
  );
}

    // Search by part description first.
    const { data: dbMatches, error: dbError } = await supabase
      .from('seller_offers')
      .select('*')
      .ilike('part', `%${cleanQuery}%`);

    if (dbError) {
      throw dbError;
    }

    const scoreFitment = (item) => {
      let score = 0;
      const reasons = [];

      // VIN-specific match: strongest possible database match.
      if (
        vehicle.vin &&
        item.vin &&
        String(item.vin).toUpperCase() === vehicle.vin
      ) {
        score += 100;
        reasons.push('VIN_MATCH');
      }

      // Engine code.
      if (
        vehicle.engineCode &&
        item.engine_code &&
        String(item.engine_code).toLowerCase() === vehicle.engineCode
      ) {
        score += 40;
        reasons.push('ENGINE_CODE_MATCH');
      }

      // Make.
      if (
        vehicle.make &&
        item.make &&
        String(item.make).toLowerCase() === vehicle.make
      ) {
        score += 20;
        reasons.push('MAKE_MATCH');
      }

      // Model.
      if (
        vehicle.model &&
        item.model &&
        String(item.model).toLowerCase() === vehicle.model
      ) {
        score += 25;
        reasons.push('MODEL_MATCH');
      }

      // Series.
      if (
        vehicle.series &&
        item.series &&
        String(item.series).toLowerCase() === vehicle.series
      ) {
        score += 20;
        reasons.push('SERIES_MATCH');
      }

      // Variant.
      if (
        vehicle.variant &&
        item.variant &&
        String(item.variant).toLowerCase() === vehicle.variant
      ) {
        score += 20;
        reasons.push('VARIANT_MATCH');
      }

      // Engine description.
      if (
        vehicle.engine &&
        item.engine &&
        String(item.engine).toLowerCase().includes(vehicle.engine)
      ) {
        score += 20;
        reasons.push('ENGINE_MATCH');
      }

      // Year-range compatibility.
      if (
        vehicle.year &&
        item.year_from != null &&
        item.year_to != null &&
        vehicle.year >= Number(item.year_from) &&
        vehicle.year <= Number(item.year_to)
      ) {
        score += 20;
        reasons.push('YEAR_MATCH');
      } else if (
        vehicle.year &&
        item.year_from != null &&
        item.year_to == null &&
        vehicle.year >= Number(item.year_from)
      ) {
        score += 15;
        reasons.push('YEAR_FROM_MATCH');
      }

      return {
        score,
        reasons
      };
    };

    const wholesaleItems = (dbMatches || [])
      .map((item, idx) => {
        const fitment = scoreFitment(item);

        const parsedPrice =
          item.price != null
            ? Number(item.price)
            : null;

        return {
          id:
            item.id
              ? `SKU-DB-${item.id}`
              : `SKU-DB-${idx}`,

          title:
            item.part
              ? String(item.part).toUpperCase()
              : 'AUTO COMPONENT',

          brand:
            item.brand
              ? String(item.brand).toUpperCase()
              : null,

          partNumber:
            item.part_number || null,

          oemNumber:
            item.oem_number || null,

          shop:
            item.wholesaler_business_name || null,

          price: parsedPrice,

          trade:
            parsedPrice != null
              ? +(parsedPrice * 0.85).toFixed(2)
              : null,

          retail: parsedPrice,

          distanceKm:
            item.distance != null
              ? Number(item.distance)
              : null,

          stock:
            item.stock != null
              ? Number(item.stock)
              : null,

          loc:
            item.location || null,

          category: 'part',

          fitmentScore:
            fitment.score,

          fitmentReasons:
            fitment.reasons,

          fitmentVerified:
            fitment.score >= 60,

          vehicleFitment: {
            make: item.make || null,
            model: item.model || null,
            series: item.series || null,
            variant: item.variant || null,
            yearFrom: item.year_from || null,
            yearTo: item.year_to || null,
            engine: item.engine || null,
            engineCode: item.engine_code || null,
            transmission: item.transmission || null,
            drivetrain: item.drivetrain || null,
            body: item.body || null,
            vin: item.vin || null
          },

          fitmentNotes:
            item.fitment_notes || null
        };
      })
      .sort(
        (a, b) =>
          b.fitmentScore - a.fitmentScore
      );

    // Keep social search generic for now.
    let facebookItems = [];

    if (process.env.SOCIALCRAWL_API_KEY) {
      try {
        const proxyResponse = await fetch(
          'https://socialcrawl.dev',
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${process.env.SOCIALCRAWL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              searchKeyword: cleanQuery,
              location: 'Melbourne, Australia',
              radiusKm: 50
            })
          }
        );

        if (proxyResponse.ok) {
          const scraped =
            await proxyResponse.json();

          facebookItems = (scraped || [])
            .slice(0, 3)
            .map((item, idx) => {
              const price =
                item.price != null
                  ? Number(item.price)
                  : null;

              return {
                id:
                  item.id ||
                  `CRAWL-${idx}`,

                title:
                  `[FB MARKETPLACE] ${String(
                    item.title || 'AUTO PART'
                  ).toUpperCase()}`,

                brand:
                  'USED CONSUMER LISTING',

                shop:
                  item.sellerName ||
                  'Private Seller',

                price,

                retail: price,
                trade: price,

                distanceKm:
                  item.distanceKm ?? null,

                stock: 1,

                loc:
                  item.location || null,

                category: 'part',

                fitmentScore: 0,
                fitmentReasons: [],
                fitmentVerified: false
              };
            });
        }
      } catch (crawlErr) {
        console.warn(
          '⚠️ Social marketplace provider unavailable:',
          crawlErr
        );
      }
    }

    return res.status(200).json({
      vehicleContext: vehicle,

      local: wholesaleItems,

      national: [],

      trans_tasman: [],

      global_direct: [],

      facebook: facebookItems
    });

  } catch (error) {
    console.error(
      '❌ Parts search broker failure:',
      error
    );

    return res.status(500).json({
      error: 'Parts search infrastructure failure.',
      code: 'PARTS_SEARCH_FAILED',

      local: [],
      national: [],
      trans_tasman: [],
      global_direct: [],
      facebook: []
    });
  }
}
