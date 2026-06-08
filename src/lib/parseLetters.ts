import data from '@/assets/nininshou.json';

export interface Segment {
  author: 'boy' | 'sensei';
  text:   string;
}

export interface Letter {
  page:          string;
  date:          string | null;
  author:        'boy' | 'sensei' | 'mixed';
  pagetype:      'lined' | 'manuscript';
  circle?:      boolean;
  hidden?:      boolean;
  paired_with?: string;
  segments?:     Segment[];
}

export interface Envelope {
  envelope:      number;
  date?: string | null;
  spotify_embed: string;
  pages:         Letter[];
}

export function getEnvelopePages(number: number, unlocked = false): Letter[] {
  const envelope = (data as Envelope[]).find(e => e.envelope === number);
  const pages = envelope?.pages ?? [];
  return unlocked ? [...pages] : pages.filter(p => !p.hidden);
}

export function getEnvelopeDate(number: number): string {
  const envelope = (data as Envelope[]).find(e => e.envelope === number);
  return envelope?.pages.find(p => p.date)?.date ?? "";
}
