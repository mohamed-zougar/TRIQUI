import communesData from "./communes_data.json";

export interface Commune {
  id: number;
  nameFr: string;
  nameAr: string;
}

export interface WilayaWithCommunes {
  wilayaCode: number;
  nameFr: string;
  nameAr: string;
  communes: Commune[];
}

export const COMMUNES_DATA: WilayaWithCommunes[] = communesData as WilayaWithCommunes[];

export function getCommunesForWilaya(wilayaName: string): string[] {
  if (!wilayaName) return [];
  const found = COMMUNES_DATA.find(w => w.nameFr.toLowerCase() === wilayaName.toLowerCase());
  return found ? found.communes.map(c => c.nameFr).sort() : [];
}