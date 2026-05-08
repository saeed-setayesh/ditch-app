/** Preset navigation destinations (editable). Coordinates [lat, lng] in WGS84. */
export type DriverShortcut = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

/** Defaults for GTA-focused deployment; tune per fleet. */
const GTA_DEFAULTS: DriverShortcut[] = [
  {
    id: "tow-hq",
    label: "Fleet HQ · Mississauga hub",
    lat: 43.589,
    lng: -79.644,
  },
  {
    id: "collision-yard",
    label: "Collision lot · Vaughan yard",
    lat: 43.836,
    lng: -79.498,
  },
  {
    id: "city-core",
    label: "Toronto downtown ref",
    lat: 43.6532,
    lng: -79.3832,
  },
];

export function driverShortcutsForCity(_cityId: string): DriverShortcut[] {
  void _cityId;
  return GTA_DEFAULTS;
}
