const BLOCK_SPLIT = /<\/(p|h[1-6]|li|div|tr)>/gi;

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/"/gi, '"')
    .replace(/&#39;|'/gi, "'")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      const code = parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    });
}

export function htmlToParagraphs(html: string, limit = 8): string[] {
  const cleaned = html
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<span\b[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, " ")
    .replace(/<ul\b[^>]*class="[^"]*gallery[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, " ");

  const chunks = cleaned.split(BLOCK_SPLIT);
  const paragraphs: string[] = [];

  for (const chunk of chunks) {
    const text = decodeEntities(
      chunk
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\[[\d, ]+\]/g, "")
        .replace(/\s+/g, " ")
        .replace(/\s+([,.;:!?])/g, "$1")
        .trim(),
    );
    if (text.length < 40) continue;
    if (/^edit$/i.test(text)) continue;
    paragraphs.push(text);
    if (paragraphs.length >= limit) break;
  }

  return paragraphs;
}

export function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}
