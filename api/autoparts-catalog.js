// PartsForge server-side adapter for the AutoPartsAPI reference catalogue.
// The provider key must never be exposed to the browser or committed to source.

const DEFAULT_BASE_URL = 'https://auto-parts-catalog.apiprofile.com/api';
const DEFAULT_TYPE_ID = 1; // Passenger cars
const DEFAULT_LANGUAGE_ID = 4; // English
const DEFAULT_COUNTRY_FILTER_ID = 21; // Australia
const REQUEST_TIMEOUT_MS = 10_000;

const getSingleValue = (value) => Array.isArray(value) ? value[0] : value;

const readPositiveInteger = (query, name, fallback = null) => {
  const rawValue = getSingleValue(query?.[name]);

  if ((rawValue == null || rawValue === '') && fallback != null) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`INVALID_${name.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
  }

  return value;
};

const readPartNumber = (query) => {
  const value = String(getSingleValue(query?.partNumber) || '')
    .trim()
    .slice(0, 64);

  if (value.length < 2 || !/^[A-Za-z0-9 ._\-/]+$/.test(value)) {
    throw new Error('INVALID_PART_NUMBER');
  }

  return value;
};

export const buildAutoPartsTarget = (query = {}) => {
  const action = String(getSingleValue(query.action) || '').trim().toLowerCase();
  const typeId = () => readPositiveInteger(query, 'typeId', DEFAULT_TYPE_ID);
  const langId = () => readPositiveInteger(query, 'langId', DEFAULT_LANGUAGE_ID);
  const countryFilterId = () => readPositiveInteger(
    query,
    'countryFilterId',
    DEFAULT_COUNTRY_FILTER_ID
  );

  switch (action) {
    case 'countries':
      return { action, path: '/v2/countries/list', cacheSeconds: 604_800 };

    case 'languages':
      return { action, path: '/v2/languages/list', cacheSeconds: 604_800 };

    case 'manufacturers':
      return {
        action,
        path: `/v2/manufacturers/list/type-id/${typeId()}`,
        cacheSeconds: 86_400
      };

    case 'models': {
      const manufacturerId = readPositiveInteger(query, 'manufacturerId');
      return {
        action,
        path: `/v2/models/list/type-id/${typeId()}/manufacturer-id/${manufacturerId}/lang-id/${langId()}/country-filter-id/${countryFilterId()}`,
        cacheSeconds: 86_400
      };
    }

    case 'vehicles': {
      const modelId = readPositiveInteger(query, 'modelId');
      return {
        action,
        path: `/v2/types/type-id/${typeId()}/list-vehicles-id/${modelId}/lang-id/${langId()}/country-filter-id/${countryFilterId()}`,
        cacheSeconds: 86_400
      };
    }

    case 'categories': {
      const vehicleId = readPositiveInteger(query, 'vehicleId');
      return {
        action,
        path: `/v2/category/type-id/${typeId()}/products-groups-variant-1/${vehicleId}/lang-id/${langId()}`,
        cacheSeconds: 86_400
      };
    }

    case 'parts': {
      const vehicleId = readPositiveInteger(query, 'vehicleId');
      const categoryId = readPositiveInteger(query, 'categoryId');
      return {
        action,
        path: `/v2/articles/list/type-id/${typeId()}/vehicle-id/${vehicleId}/category-id/${categoryId}/lang-id/${langId()}`,
        cacheSeconds: 3_600
      };
    }

    case 'part-number': {
      const params = new URLSearchParams({
        langId: String(langId()),
        articleType: 'ArticleNumber',
        articleNo: readPartNumber(query)
      });

      return {
        action,
        path: `/v2/part-identifier/search-articles-by-article-no?${params.toString()}`,
        cacheSeconds: 3_600
      };
    }

    default:
      throw new Error('INVALID_ACTION');
  }
};

const providerError = (status) => {
  if (status === 429) {
    return {
      status: 429,
      code: 'CATALOG_RATE_LIMITED',
      error: 'The reference catalogue request limit has been reached. Try again later.'
    };
  }

  if (status === 401 || status === 403) {
    return {
      status: 502,
      code: 'CATALOG_AUTHENTICATION_FAILED',
      error: 'The reference catalogue connection needs attention.'
    };
  }

  return {
    status: 502,
    code: 'CATALOG_PROVIDER_UNAVAILABLE',
    error: 'The reference catalogue is temporarily unavailable.'
  };
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      error: 'Only GET requests are supported.'
    });
  }

  const apiKey = process.env.AUTOPARTS_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      success: false,
      code: 'CATALOG_NOT_CONFIGURED',
      error: 'The reference catalogue is not configured.'
    });
  }

  let target;

  try {
    target = buildAutoPartsTarget(req.query || {});
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: error.message || 'INVALID_REQUEST',
      error: 'The catalogue request contains invalid or missing fields.'
    });
  }

  const baseUrl = String(
    process.env.AUTOPARTS_API_BASE_URL || DEFAULT_BASE_URL
  ).replace(/\/+$/, '');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${target.path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-apiprofile-key': apiKey
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const failure = providerError(response.status);
      return res.status(failure.status).json({
        success: false,
        code: failure.code,
        error: failure.error
      });
    }

    const payload = await response.json();

    res.setHeader(
      'Cache-Control',
      `public, max-age=0, s-maxage=${target.cacheSeconds}, stale-while-revalidate=${target.cacheSeconds}`
    );

    return res.status(200).json({
      success: true,
      source: 'autoparts-api-v2',
      action: target.action,
      data: payload
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        code: 'CATALOG_TIMEOUT',
        error: 'The reference catalogue took too long to respond.'
      });
    }

    console.error('AutoParts catalogue request failed:', error?.message || error);

    return res.status(502).json({
      success: false,
      code: 'CATALOG_PROVIDER_UNAVAILABLE',
      error: 'The reference catalogue is temporarily unavailable.'
    });
  } finally {
    clearTimeout(timeout);
  }
}
