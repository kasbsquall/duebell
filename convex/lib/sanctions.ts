// Parses the markdown Firecrawl returns from Indecopi's "Mira a quién le compras"
// portal (https://enlinea.indecopi.gob.pe/miraaquienlecompras/).

export interface SearchResult {
  legalName: string;
  ruc: string;
}

export interface Sanction {
  year: number;
  matter: string;
  offense: string;
  resolution: string;
  finalDate: string;
  fineUit: number;
}

export interface SanctionsDetail {
  legalName: string;
  totalSanctions: number;
  totalFineUit: number;
  periodFrom: string;
  periodTo: string;
  recent: Sanction[];
}

function tableRows(block: string): string[][] {
  return block
    .split("\n")
    .filter((line) => line.startsWith("|") && !line.startsWith("| ---"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
}

function toIsoDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}-${m}-${d}`;
}

export function parseSearchResults(markdown: string): SearchResult[] {
  const mainBlock = markdown.split("Quizás quisiste decir")[0];
  const results: SearchResult[] = [];
  for (const cells of tableRows(mainBlock)) {
    const match = /^(.*?)\s*-\s*RUC:(\d{11})$/.exec(cells[1] ?? "");
    if (match) results.push({ legalName: match[1].trim(), ruc: match[2] });
  }
  return results;
}

export function parseSanctionsDetail(markdown: string): SanctionsDetail | null {
  const detailStart = markdown.indexOf("Detalle por empresa");
  if (detailStart === -1) return null;
  const detail = markdown.slice(detailStart);

  const [companyBlock, rest = ""] = detail.split("SANCIONES");
  const company = tableRows(companyBlock).find((cells) => cells.length >= 4 && /^\d+$/.test(cells[2]));
  if (!company) return null;

  const period = /Resultados de (\d{2}\/\d{2}\/\d{4}) al (\d{2}\/\d{2}\/\d{4})/.exec(detail);
  const recent: Sanction[] = tableRows(rest)
    .filter((cells) => /^\d{4}$/.test(cells[0] ?? ""))
    .map((cells) => ({
      year: Number(cells[0]),
      matter: cells[1],
      offense: cells[2],
      resolution: cells[3],
      finalDate: cells[4],
      fineUit: Number(cells[5]),
    }));

  return {
    legalName: company[0],
    totalSanctions: Number(company[2]),
    totalFineUit: Number(company[3]),
    periodFrom: period ? toIsoDate(period[1]) : "",
    periodTo: period ? toIsoDate(period[2]) : "",
    recent,
  };
}

const LEGAL_SUFFIX = /\b(s\.?\s?a\.?\s?c\.?|s\.?\s?a\.?\s?a\.?|s\.?\s?r\.?\s?l\.?|e\.?\s?i\.?\s?r\.?\s?l\.?|s\.?\s?a\.?)$/i;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[,.]+$/g, "")
    .replace(LEGAL_SUFFIX, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// The portal's result order is not stable, so rank candidates against what the user typed.
export function pickBestMatch(query: string, results: SearchResult[]): SearchResult | null {
  if (results.length === 0) return null;
  const q = query.trim();
  const byRuc = results.find((r) => r.ruc === q);
  if (byRuc) return byRuc;

  const target = normalizeName(q);
  const exact = results.find((r) => normalizeName(r.legalName) === target);
  if (exact) return exact;

  const containing = results
    .filter((r) => normalizeName(r.legalName).includes(target))
    .sort((a, b) => a.legalName.length - b.legalName.length);
  return containing[0] ?? results[0];
}
