export type BlockKind = 'p' | 'direction' | 'info' | 'caption' | 'tagline' | 'heading';

export type Block = { kind: BlockKind; text: string };

export type Photo = { file: string; w: number; h: number; caption?: string };

export type GeoConfidence = 'verified' | 'medium' | 'low' | 'estimated';

export type Stop = {
  id: string; // e.g. "IV-07"
  n: number; // number printed in the book
  title: string;
  subtitle?: string;
  blocks: Block[];
  photos: Photo[];
  lat: number;
  lng: number;
  geo: GeoConfidence;
  radius?: number; // arrival radius override in meters
  page: string; // source page in the PDF, for review
};

export type Walk = {
  id: string; // roman numeral, e.g. "IV"
  num: number;
  title: string;
  tagline?: string;
  theme?: string; // e.g. "King Kalākaua welcomes you to his Great Street"
  facts: { distance?: string; duration?: string; steps?: string };
  intro: Block[];
  info: string[]; // parking, bus, timing boxes
  cover?: string; // photo file
  bookMap?: string; // rendered map page from the book
  color: string;
  stops: Stop[];
};

export type FunFact = { id: string; text: string; walkId?: string; stopId?: string };

export type GlossaryEntry = { word: string; meaning: string };
