export interface CustomerLocation {
  county: string;
  subCounty: string;
  ward?: string;
  address: string;
  locationDescription?: string;
  mapsLink?: string;
  lat?: number;
  lng?: number;
}
