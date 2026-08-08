import { Router } from 'express';
import { searchParts } from '../controllers/searchController.js';
import { lookupRego, lookupVin } from '../controllers/regoController.js';

const router = Router();

// GET /api/search/parts?vehicleId=&partQuery=&lat=&lng=
router.get('/parts', searchParts);

// GET /api/rego/lookup?regoPlate=ABC123&region=AU_VIC
// Worldwide registration routing handler — routes a headless browser
// request to the region-specific public rego check site. If the live DOM
// is blocked or changes, returns a market-specific test vehicle profile.
router.get('/lookup', lookupRego);

// GET /api/rego/vin?vin=17CHARVIN&region=AU_VIC
// VIN Spec Sweep API Handshake — decodes a 17-character VIN sequence
// and hydrates the full nested vehicle specification array.
router.get('/vin', lookupVin);

export default router;
