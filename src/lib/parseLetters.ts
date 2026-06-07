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

  if (!unlocked || number === 29) return pages;

  // Inject envelope 29 paired pages that belong to this envelope.
  const env29 = (data as Envelope[]).find(e => e.envelope === 29);
  const paired = (env29?.pages ?? []).filter(p => {
    const match = p.paired_with?.match(/^(\d+)-/);
    return match && parseInt(match[1]) === number;
  });

  return [...pages, ...paired];
}

export function getEnvelopeDate(number: number): string {
  const envelope = (data as Envelope[]).find(e => e.envelope === number);
  return envelope?.pages.find(p => p.date)?.date ?? "";
}
