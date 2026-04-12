export type CityConfig = {
  id: string;
  name: string;
  bbox: string; // minLon,minLat,maxLon,maxLat
  center: [number, number]; // [lng, lat]
};

export const CITIES: CityConfig[] = [
  {
    id: "DitchApp",
    name: "DitchApp",
    bbox: "-79.64,43.58,-79.11,43.85",
    center: [-79.3832, 43.6532],
  },
  {
    id: "mississauga",
    name: "Mississauga",
    bbox: "-79.72,43.52,-79.55,43.68",
    center: [-79.6441, 43.589],
  },
  {
    id: "brampton",
    name: "Brampton",
    bbox: "-79.82,43.68,-79.68,43.78",
    center: [-79.7613, 43.7315],
  },
  {
    id: "vaughan",
    name: "Vaughan",
    bbox: "-79.62,43.78,-79.42,43.92",
    center: [-79.4982, 43.8361],
  },
];

const CITIES_BY_ID = new Map(CITIES.map((c) => [c.id, c]));

export function getCityById(id: string): CityConfig | undefined {
  return CITIES_BY_ID.get(id);
}

export function getDefaultCity(): CityConfig {
  return CITIES[0];
}
