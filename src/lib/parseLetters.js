import data from '@/assets/nininshou.json';
export function getEnvelopePages(number) {
    const envelope = data.find(e => e.envelope === number);
    return envelope?.pages ?? [];
}
export function getEnvelopeDate(number) {
    const envelope = data.find(e => e.envelope === number);
    return envelope?.date ?? "";
}
