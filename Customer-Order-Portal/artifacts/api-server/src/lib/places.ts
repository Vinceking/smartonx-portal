/**
 * Places Mock Service — returns realistic-looking address predictions.
 * In production, this would proxy Google Places API.
 */

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
}

const MOCK_ADDRESSES: PlaceDetails[] = [
  { placeId: "place_001", address1: "123 Main St", city: "Salt Lake City", state: "UT", zip: "84101" },
  { placeId: "place_002", address1: "456 Center St", city: "Provo", state: "UT", zip: "84601" },
  { placeId: "place_003", address1: "789 State St", city: "Ogden", state: "UT", zip: "84401" },
  { placeId: "place_004", address1: "321 N Temple", city: "Salt Lake City", state: "UT", zip: "84103" },
  { placeId: "place_005", address1: "654 Broadway Ave", city: "Provo", state: "UT", zip: "84604" },
  { placeId: "place_006", address1: "987 University Ave", city: "Logan", state: "UT", zip: "84321" },
  { placeId: "place_007", address1: "111 Commerce Dr", city: "St. George", state: "UT", zip: "84770" },
  { placeId: "place_008", address1: "222 Medical Pkwy", city: "Murray", state: "UT", zip: "84107" },
  { placeId: "place_009", address1: "333 Dental Way", city: "Sandy", state: "UT", zip: "84094" },
  { placeId: "place_010", address1: "444 Clinic Blvd", city: "West Valley City", state: "UT", zip: "84119" },
];

export function autocomplete(query: string): PlacePrediction[] {
  if (!query || query.length < 3) return [];
  const q = query.toLowerCase();
  const matches = MOCK_ADDRESSES.filter(
    (a) =>
      a.address1.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.zip.includes(q),
  );
  const results = matches.length > 0 ? matches : MOCK_ADDRESSES.slice(0, 3);
  return results.slice(0, 5).map((a) => ({
    placeId: a.placeId,
    description: `${a.address1}, ${a.city}, ${a.state} ${a.zip}, USA`,
    mainText: a.address1,
    secondaryText: `${a.city}, ${a.state} ${a.zip}`,
  }));
}

export function details(placeId: string): PlaceDetails | null {
  return MOCK_ADDRESSES.find((a) => a.placeId === placeId) ?? null;
}
