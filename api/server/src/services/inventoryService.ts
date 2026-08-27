import { supabase } from '../lib/supabase.js';
import { haversineKm } from '../utils/distance.js';

export interface InventoryMatch {
  id: string;
  part_id: string;
  title: string;
  brand: string;
  part_number: string;
  price: number;
  stock_quantity: number;
  delivery_type: string;
  seller_id: string;
  latitude: number;
  longitude: number;
  distance_km: number;
}

export interface VehicleInfo {
  id: string;
  year: number;
  make: string;
  model: string;
}

const LOCAL_RADIUS_KM = 25;

/** Resolve a vehicle's year/make/model from the virtual garage. */
export async function getVehicleById(
  vehicleId: string,
): Promise<VehicleInfo | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, year, make, model')
    .eq('id', vehicleId)
    .single();

  if (error || !data) return null;
  return data as VehicleInfo;
}

/**
 * Query the internal Inventory database for parts matching the vehicle's
 * year/make/model via the ACES-style PartFitment table, joined to live
 * seller Inventory rows. Results are split into local (<=25km) and national
 * (>25km) buckets, each sorted by distance from the user.
 */
export async function searchInventoryByVehicle(
  vehicle: VehicleInfo,
  partQuery: string,
  userLocation: { lat: number; lng: number },
): Promise<{ localParts: InventoryMatch[]; nationalParts: InventoryMatch[] }> {
  const { data, error } = await supabase
    .from('part_fitment')
    .select(
      `
      part_id,
      parts (
        id,
        title,
        brand,
        part_number,
        inventory (
          id,
          seller_id,
          price,
          stock_quantity,
          delivery_type,
          latitude,
          longitude
        )
      )
    `,
    )
    .eq('year', vehicle.year)
    .eq('make', vehicle.make)
    .eq('model', vehicle.model)
    .ilike('parts.title', `%${partQuery}%`);

  if (error || !data) return { localParts: [], nationalParts: [] };

  const matches: InventoryMatch[] = [];
  for (const row of data) {
    const part = (row as any).parts;
    if (!part) continue;
    for (const inv of part.inventory ?? []) {
      const distance_km = haversineKm(userLocation, {
        lat: inv.latitude,
        lng: inv.longitude,
      });
      matches.push({
        id: inv.id,
        part_id: part.id,
        title: part.title,
        brand: part.brand,
        part_number: part.part_number,
        price: Number(inv.price),
        stock_quantity: inv.stock_quantity,
        delivery_type: inv.delivery_type,
        seller_id: inv.seller_id,
        latitude: inv.latitude,
        longitude: inv.longitude,
        distance_km,
      });
    }
  }

  const localParts = matches
    .filter((m) => m.distance_km <= LOCAL_RADIUS_KM)
    .sort((a, b) => a.distance_km - b.distance_km);

  const nationalParts = matches
    .filter((m) => m.distance_km > LOCAL_RADIUS_KM)
    .sort((a, b) => a.distance_km - b.distance_km);

  return { localParts, nationalParts };
}
