import type { Request, Response } from 'express';
import { getVehicleById, searchInventoryByVehicle } from '../services/inventoryService.js';
import { searchYouTubeTutorials } from '../services/youtubeService.js';

interface SearchQuery {
  vehicleId: string;
  partQuery: string;
  lat: string;
  lng: string;
}

/**
 * searchParts(vehicleId, partQuery)
 *
 * Queries the internal Inventory database for parts matching the vehicle's
 * year/make/model, sorts local inventory by geospatial distance from the
 * user (within 25km => "Local Courier", beyond => "National Shipping"),
 * and concurrently triggers a background request to the YouTube Data API v3
 * using the strict query format:
 *   [Year] [Make] [Model] [partQuery] repair replacement
 *
 * Returns a single JSON payload:
 *   { localParts: [], nationalParts: [], youtubeTutorials: [] }
 */
export async function searchParts(req: Request, res: Response): Promise<void> {
  const { vehicleId, partQuery, lat, lng } = req.query as unknown as SearchQuery;

  if (!vehicleId || !partQuery || !lat || !lng) {
    res.status(400).json({
      error: 'vehicleId, partQuery, lat, and lng are required query parameters.',
    });
    return;
  }

  const userLocation = { lat: Number(lat), lng: Number(lng) };
  if (Number.isNaN(userLocation.lat) || Number.isNaN(userLocation.lng)) {
    res.status(400).json({ error: 'lat and lng must be numeric.' });
    return;
  }

  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found in the virtual garage.' });
    return;
  }

  // Run the inventory query and the YouTube background request concurrently.
  const [inventory, youtubeTutorials] = await Promise.all([
    searchInventoryByVehicle(vehicle, partQuery, userLocation),
    searchYouTubeTutorials(vehicle, partQuery).catch(() => []),
  ]);

  res.json({
    localParts: inventory.localParts,
    nationalParts: inventory.nationalParts,
    youtubeTutorials,
  });
}
