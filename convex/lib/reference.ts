// Short claim reference that travels in email subjects, e.g. "[Ref RC-7K2P]".
// Excludes 0/O/1/I so people can type it back without mistakes.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateReference(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `RC-${code}`;
}

export function extractReference(text: string): string | null {
  const match = /\bRC[-\s]?([2-9A-HJ-NP-Z]{4})\b/i.exec(text);
  return match ? `RC-${match[1].toUpperCase()}` : null;
}
