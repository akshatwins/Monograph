import { htmlToParagraphs } from "./html";
import { cacheGetOrSet } from "./cache";
import { spotifySearchUrl } from "@/lib/format";
import type {
  AlbumDetail,
  ArtistDossier,
  AwardRecord,
  CatalogAlbum,
  CatalogArtist,
  CatalogTrack,
  HomeCatalogue,
  LifeFact,
  WikiSection,
} from "./types";

const UA = "Monograph/1.0 (artist catalogue; https://grok.com)";
const WIKI_UA = "Monograph/1.0 (https://grok.com; artist encyclopedic profiles)";

type Json = Record<string, unknown>;

async function fetchJson<T>(
  url: string,
  opts?: { timeoutMs?: number; headers?: Record<string, string> },
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 9000);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": opts?.headers?.["User-Agent"] ?? UA,
        ...opts?.headers,
      },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;
}

function deezerPicture(obj: Json, key: "picture" | "cover"): { md: string; xl: string } {
  const xl = asStr(obj[`${key}_xl`]) || asStr(obj[`${key}_big`]) || asStr(obj[key]);
  const md = asStr(obj[`${key}_medium`]) || asStr(obj[`${key}_big`]) || xl;
  return { md, xl };
}

function mapArtist(raw: Json): CatalogArtist {
  const pic = deezerPicture(raw, "picture");
  return {
    id: asStr(raw.id),
    name: asStr(raw.name),
    picture: pic.md,
    pictureXl: pic.xl,
    fans: asNum(raw.nb_fan),
    albumCount: asNum(raw.nb_album),
  };
}

function mapAlbum(raw: Json): CatalogAlbum {
  const cover = deezerPicture(raw, "cover");
  const artist = (raw.artist as Json | undefined) ?? {};
  return {
    id: asStr(raw.id),
    title: asStr(raw.title),
    cover: cover.md,
    coverXl: cover.xl,
    artistId: asStr(artist.id),
    artistName: asStr(artist.name),
    releaseDate: asStr(raw.release_date),
    recordType: asStr(raw.record_type) || "album",
    explicit: Boolean(raw.explicit_lyrics),
    trackCount: raw.nb_tracks != null ? asNum(raw.nb_tracks) : undefined,
  };
}

function mapTrack(raw: Json): CatalogTrack {
  const artist = (raw.artist as Json | undefined) ?? {};
  const album = (raw.album as Json | undefined) ?? {};
  const cover = deezerPicture(album, "cover");
  const contributorsRaw = Array.isArray(raw.contributors) ? (raw.contributors as Json[]) : [];
  return {
    id: asStr(raw.id),
    title: asStr(raw.title),
    duration: asNum(raw.duration),
    preview: asStr(raw.preview) || null,
    explicit: Boolean(raw.explicit_lyrics),
    artistId: asStr(artist.id),
    artistName: asStr(artist.name),
    albumId: asStr(album.id),
    albumTitle: asStr(album.title),
    albumCover: cover.md || asStr(raw.md5_image),
    rank: raw.rank != null ? asNum(raw.rank) : undefined,
    contributors: contributorsRaw.map((c) => ({
      id: asStr(c.id),
      name: asStr(c.name),
      role: asStr(c.role) || "Main",
    })),
  };
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

type DeezerList<T> = { data?: T[]; error?: { type?: string; message?: string } };

export async function searchArtists(query: string): Promise<CatalogArtist[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 1) return [];
  return cacheGetOrSet(`search:${q.toLowerCase()}`, 120_000, async () => {
    const res = await fetchJson<DeezerList<Json>>(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=24`,
    );
    const rows = (res.data ?? []).map(mapArtist).filter((a) => a.name);
    return uniqueById(rows);
  });
}

export async function loadHomeCatalogue(): Promise<HomeCatalogue> {
  return cacheGetOrSet("home:v2", 180_000, async () => {
    const [artistsRes, albumsRes, tracksRes] = await Promise.all([
      fetchJson<DeezerList<Json>>("https://api.deezer.com/chart/0/artists?limit=16"),
      fetchJson<DeezerList<Json>>("https://api.deezer.com/chart/0/albums?limit=12"),
      fetchJson<DeezerList<Json>>("https://api.deezer.com/chart/0/tracks?limit=10"),
    ]);
    return {
      artists: uniqueById((artistsRes.data ?? []).map(mapArtist)),
      albums: uniqueById((albumsRes.data ?? []).map(mapAlbum)),
      tracks: uniqueById((tracksRes.data ?? []).map(mapTrack)),
    };
  });
}

async function loadDeezerArtist(id: string): Promise<CatalogArtist> {
  const raw = await fetchJson<Json>(`https://api.deezer.com/artist/${encodeURIComponent(id)}`);
  if (raw.error || !raw.id) {
    throw new Error("Artist not found");
  }
  return mapArtist(raw);
}

async function loadDeezerList(
  path: string,
): Promise<Json[]> {
  const res = await fetchJson<DeezerList<Json>>(`https://api.deezer.com${path}`);
  return res.data ?? [];
}

function classifyAlbums(albums: CatalogAlbum[]) {
  const studio: CatalogAlbum[] = [];
  const eps: CatalogAlbum[] = [];
  const singles: CatalogAlbum[] = [];
  for (const album of albums) {
    const t = album.recordType.toLowerCase();
    if (t === "single") singles.push(album);
    else if (t === "ep") eps.push(album);
    else studio.push(album);
  }
  const byDate = (a: CatalogAlbum, b: CatalogAlbum) =>
    (b.releaseDate || "").localeCompare(a.releaseDate || "");
  return {
    albums: studio.sort(byDate),
    eps: eps.sort(byDate),
    singles: singles.sort(byDate),
  };
}

function isGuestAppearance(track: CatalogTrack, artistId: string, artistName: string): boolean {
  if (track.artistId === artistId) return false;
  const name = artistName.toLowerCase();
  const inContrib = track.contributors.some(
    (c) => c.id === artistId || c.name.toLowerCase() === name,
  );
  const title = track.title.toLowerCase();
  const featInTitle =
    title.includes(`feat. ${name}`) ||
    title.includes(`feat ${name}`) ||
    title.includes(`ft. ${name}`) ||
    title.includes(`with ${name}`);
  return inContrib || featInTitle;
}

async function loadFeaturedOn(artistId: string, artistName: string): Promise<CatalogTrack[]> {
  const queries = [`feat. ${artistName}`, `"${artistName}" feat`];
  try {
    const lists = await Promise.all(
      queries.map(async (q) => {
        const res = await fetchJson<DeezerList<Json>>(
          `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=25`,
        );
        return (res.data ?? []).map(mapTrack);
      }),
    );
    return uniqueById(lists.flat()).filter((t) => isGuestAppearance(t, artistId, artistName));
  } catch {
    return [];
  }
}

/* ---------------- Wikipedia + Wikidata ---------------- */

type WikiSearch = {
  query?: { search?: { title: string; snippet: string }[] };
};

type WikiSummary = {
  title?: string;
  extract?: string;
  description?: string;
  wikibase_item?: string;
  content_urls?: { desktop?: { page?: string } };
  type?: string;
};

type WikiSections = {
  parse?: { sections?: { index: string; line: string; anchor: string; level: string }[] };
};

const MUSIC_HINT =
  /\b(singer|songwriter|rapper|musician|band|dj|composer|vocalist|artist|record producer|pop|rock|hip.?hop|r&b|jazz|folk|conductor|pianist|guitarist|drummer|ensemble|orchestra)\b/i;

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function titlesClose(artistName: string, title: string): boolean {
  const a = normalizeName(artistName);
  const t = normalizeName(title);
  return t === a || t.startsWith(`${a} `) || a.startsWith(`${t} `);
}

function isNoiseTitle(title: string): boolean {
  return (
    /^list of /i.test(title) ||
    /discography/i.test(title) ||
    /wedding of/i.test(title) ||
    /\((album|song|ep|film|tv series|book)\)/i.test(title)
  );
}

function isUsefulSummary(summary: WikiSummary | null, artistName: string): boolean {
  if (!summary || summary.type === "disambiguation") return false;
  const title = summary.title || "";
  if (isNoiseTitle(title)) return false;
  if (!titlesClose(artistName, title)) return false;
  const blob = `${summary.description || ""} ${summary.extract || ""}`;
  return MUSIC_HINT.test(blob) || /\bborn\b/i.test(blob);
}

async function wikiSummary(title: string): Promise<WikiSummary | null> {
  try {
    return await fetchJson<WikiSummary>(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      { headers: { "User-Agent": WIKI_UA }, timeoutMs: 8000 },
    );
  } catch {
    return null;
  }
}

async function resolveWikiTitle(artistName: string): Promise<string | null> {
  const primary = await wikiSummary(artistName);
  if (isUsefulSummary(primary, artistName)) return primary?.title || artistName;

  const qualified = await Promise.all(
    [
      `${artistName} (musician)`,
      `${artistName} (singer)`,
      `${artistName} (rapper)`,
      `${artistName} (band)`,
      `${artistName} (singer-songwriter)`,
    ].map((title) => wikiSummary(title)),
  );
  const qualifiedHit = qualified.find((s) => isUsefulSummary(s, artistName));
  if (qualifiedHit?.title) return qualifiedHit.title;

  try {
    const data = await fetchJson<WikiSearch>(
      "https://en.wikipedia.org/w/api.php?" +
        new URLSearchParams({
          action: "query",
          list: "search",
          srsearch: `"${artistName}"`,
          srlimit: "8",
          format: "json",
          origin: "*",
        }).toString(),
      { headers: { "User-Agent": WIKI_UA }, timeoutMs: 8000 },
    );
    for (const row of data.query?.search ?? []) {
      if (isNoiseTitle(row.title)) continue;
      const summary = await wikiSummary(row.title);
      if (isUsefulSummary(summary, artistName)) return summary?.title || row.title;
    }
  } catch {
    /* fall through */
  }

  if (primary && primary.type !== "disambiguation" && titlesClose(artistName, primary.title || "")) {
    return primary.title || artistName;
  }
  return null;
}

async function wikiSectionParagraphs(
  title: string,
  sectionIndex: string,
  limit = 6,
): Promise<string[]> {
  const url =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "parse",
      page: title,
      prop: "text",
      section: sectionIndex,
      format: "json",
      disableeditsection: "1",
      origin: "*",
    }).toString();
  const data = await fetchJson<{ parse?: { text?: { "*": string } } }>(url, {
    headers: { "User-Agent": WIKI_UA },
    timeoutMs: 10000,
  });
  const html = data.parse?.text?.["*"] ?? "";
  return htmlToParagraphs(html, limit);
}

function pickSection(
  sections: { index: string; line: string }[],
  patterns: RegExp[],
): { index: string; line: string } | null {
  const stripped = (s: string) => s.replace(/<[^>]+>/g, "");
  for (const re of patterns) {
    const hit = sections.find((s) => re.test(stripped(s.line)));
    if (hit) return hit;
  }
  return null;
}

type WikiBundle = {
  biography: WikiSection | null;
  earlyLife: WikiSection | null;
  achievements: WikiSection | null;
  description: string;
  wikipediaUrl: string | null;
  qid: string | null;
};

async function loadWikiBundle(artistName: string): Promise<WikiBundle> {
  const empty: WikiBundle = {
    biography: null,
    earlyLife: null,
    achievements: null,
    description: "",
    wikipediaUrl: null,
    qid: null,
  };
  try {
    const title = await resolveWikiTitle(artistName);
    if (!title) return empty;

    const [summary, sectionsRes] = await Promise.all([
      wikiSummary(title),
      fetchJson<WikiSections>(
        "https://en.wikipedia.org/w/api.php?" +
          new URLSearchParams({
            action: "parse",
            page: title,
            prop: "sections",
            format: "json",
            origin: "*",
          }).toString(),
        { headers: { "User-Agent": WIKI_UA }, timeoutMs: 8000 },
      ).catch(() => null),
    ]);

    if (summary?.type === "disambiguation") return empty;

    const pageTitle = summary?.title || title;
    const pageUrl =
      summary?.content_urls?.desktop?.page ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`;
    const extract = (summary?.extract || "").trim();
    const biography: WikiSection | null = extract
      ? {
          title: "Biography",
          paragraphs: extract.split(/\n+/).map((p) => p.trim()).filter(Boolean),
          sourceTitle: pageTitle,
          sourceUrl: pageUrl,
        }
      : null;

    const sections = sectionsRes?.parse?.sections ?? [];
    const early = pickSection(sections, [
      /^early life$/i,
      /^early years$/i,
      /^childhood$/i,
      /^background$/i,
      /^life and career$/i,
      /^biography$/i,
    ]);
    const awards = pickSection(sections, [
      /^awards/i,
      /^achievements$/i,
      /^accolades$/i,
      /^honou?rs$/i,
      /^recognition$/i,
    ]);

    const [earlyParas, awardParas] = await Promise.all([
      early ? wikiSectionParagraphs(pageTitle, early.index, 6) : Promise.resolve([]),
      awards ? wikiSectionParagraphs(pageTitle, awards.index, 4) : Promise.resolve([]),
    ]);

    return {
      biography,
      earlyLife:
        earlyParas.length > 0
          ? {
              title: early?.line.replace(/<[^>]+>/g, "") || "Early life",
              paragraphs: earlyParas,
              sourceTitle: pageTitle,
              sourceUrl: pageUrl,
            }
          : null,
      achievements:
        awardParas.length > 0
          ? {
              title: awards?.line.replace(/<[^>]+>/g, "") || "Achievements",
              paragraphs: awardParas,
              sourceTitle: pageTitle,
              sourceUrl: pageUrl,
            }
          : null,
      description: summary?.description || "",
      wikipediaUrl: pageUrl,
      qid: summary?.wikibase_item || null,
    };
  } catch {
    return empty;
  }
}

type WikiEntity = {
  claims?: Record<string, Claim[]>;
  labels?: { en?: { value: string } };
};

type Claim = {
  mainsnak?: {
    datavalue?: {
      value?:
        | { id?: string; time?: string; precision?: number; text?: string }
        | string;
      type?: string;
    };
  };
  qualifiers?: Record<string, Claim[]>;
};

function claimIds(claims: Claim[] | undefined): string[] {
  if (!claims) return [];
  const ids: string[] = [];
  for (const c of claims) {
    const v = c.mainsnak?.datavalue?.value;
    if (v && typeof v === "object" && typeof v.id === "string") ids.push(v.id);
  }
  return ids;
}

function claimTime(claim: Claim): string | null {
  const q =
    claim.qualifiers?.P585?.[0]?.mainsnak?.datavalue?.value ??
    claim.qualifiers?.P580?.[0]?.mainsnak?.datavalue?.value;
  const raw = q && typeof q === "object" ? q.time : undefined;
  if (!raw || typeof raw !== "string") return null;
  const m = raw.match(/[+-]?(\d{4})/);
  return m ? m[1] : null;
}

function formatWikiTime(time: string, precision?: number): string {
  const m = time.match(/[+-]?(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const year = m[1];
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (precision != null && precision <= 9) return year;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  if (precision === 10 || day === 0) return `${months[month - 1] ?? ""} ${year}`.trim();
  return `${months[month - 1] ?? ""} ${day}, ${year}`;
}

async function loadWikidata(
  qid: string,
): Promise<{ awards: AwardRecord[]; facts: LifeFact[] }> {
  try {
    const entityRes = await fetchJson<{ entities?: Record<string, WikiEntity> }>(
      "https://www.wikidata.org/w/api.php?" +
        new URLSearchParams({
          action: "wbgetentities",
          ids: qid,
          props: "claims",
          languages: "en",
          format: "json",
          origin: "*",
        }).toString(),
      { headers: { "User-Agent": WIKI_UA }, timeoutMs: 8000 },
    );
    const entity = entityRes.entities?.[qid];
    if (!entity?.claims) return { awards: [], facts: [] };
    const claims = entity.claims;

    const needed = new Set<string>();
    for (const pid of ["P19", "P27", "P136", "P264", "P106", "P412"]) {
      for (const id of claimIds(claims[pid])) needed.add(id);
    }
    const awardClaims = (claims.P166 ?? []).slice(0, 80);
    for (const c of awardClaims) {
      const v = c.mainsnak?.datavalue?.value;
      if (v && typeof v === "object" && v.id) needed.add(v.id);
    }

    const ids = [...needed].slice(0, 90);
    const labels: Record<string, string> = {};
    if (ids.length) {
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 45) chunks.push(ids.slice(i, i + 45));
      const labelSets = await Promise.all(
        chunks.map((chunk) =>
          fetchJson<{ entities?: Record<string, WikiEntity> }>(
            "https://www.wikidata.org/w/api.php?" +
              new URLSearchParams({
                action: "wbgetentities",
                ids: chunk.join("|"),
                props: "labels",
                languages: "en",
                format: "json",
                origin: "*",
              }).toString(),
            { headers: { "User-Agent": WIKI_UA }, timeoutMs: 8000 },
          ).catch(() => ({ entities: {} })),
        ),
      );
      for (const set of labelSets) {
        for (const [id, ent] of Object.entries(set.entities ?? {})) {
          const label = (ent as WikiEntity).labels?.en?.value;
          if (label) labels[id] = label;
        }
      }
    }

    const labelList = (pid: string) =>
      claimIds(claims[pid])
        .map((id) => labels[id])
        .filter(Boolean);

    const facts: LifeFact[] = [];
    const bornClaim = claims.P569?.[0];
    const bornVal = bornClaim?.mainsnak?.datavalue?.value;
    if (bornVal && typeof bornVal === "object" && bornVal.time) {
      facts.push({
        label: "Born",
        value: formatWikiTime(bornVal.time, bornVal.precision),
      });
    }
    const place = labelList("P19")[0];
    if (place) facts.push({ label: "Birthplace", value: place });
    const citizen = labelList("P27").slice(0, 2).join(", ");
    if (citizen) facts.push({ label: "Nationality", value: citizen });
    const occupations = labelList("P106").slice(0, 3).join(", ");
    if (occupations) facts.push({ label: "Occupation", value: occupations });
    const genres = labelList("P136").slice(0, 4).join(", ");
    if (genres) facts.push({ label: "Genres", value: genres });
    const labelsRec = labelList("P264").slice(0, 3).join(", ");
    if (labelsRec) facts.push({ label: "Labels", value: labelsRec });
    const voice = labelList("P412")[0];
    if (voice) facts.push({ label: "Voice", value: voice });

    const grouped = new Map<string, AwardRecord>();
    for (const c of awardClaims) {
      const v = c.mainsnak?.datavalue?.value;
      const id = v && typeof v === "object" ? v.id : undefined;
      if (!id) continue;
      const name = labels[id];
      if (!name) continue;
      const year = claimTime(c);
      const rec = grouped.get(name) ?? { name, years: [], count: 0 };
      rec.count += 1;
      if (year && !rec.years.includes(year)) rec.years.push(year);
      grouped.set(name, rec);
    }
    const awards = [...grouped.values()].map((a) => ({
      ...a,
      years: a.years.sort((x, y) => y.localeCompare(x)),
    }));
    awards.sort((a, b) => {
      const ay = a.years[0] ?? "";
      const by = b.years[0] ?? "";
      if (ay !== by) return by.localeCompare(ay);
      return b.count - a.count;
    });

    return { awards, facts };
  } catch {
    return { awards: [], facts: [] };
  }
}

export async function loadArtistDossier(id: string): Promise<ArtistDossier> {
  return cacheGetOrSet(`artist:v3:${id}`, 10 * 60_000, async () => {
    const [artist, albumRows, topRows, relatedRows] = await Promise.all([
      loadDeezerArtist(id),
      loadDeezerList(`/artist/${encodeURIComponent(id)}/albums?limit=80`),
      loadDeezerList(`/artist/${encodeURIComponent(id)}/top?limit=50`),
      loadDeezerList(`/artist/${encodeURIComponent(id)}/related?limit=12`),
    ]);

    const allAlbums = uniqueById(albumRows.map(mapAlbum)).map((a) => ({
      ...a,
      artistId: a.artistId || artist.id,
      artistName: a.artistName || artist.name,
    }));
    const classified = classifyAlbums(allAlbums);
    const topTracks = uniqueById(topRows.map(mapTrack));
    const related = uniqueById(relatedRows.map(mapArtist));

    const guestTracks = topTracks.filter((t) =>
      t.contributors.some((c) => c.id !== artist.id && /feat/i.test(c.role)),
    );

    const [wiki, featuredOn] = await Promise.all([
      loadWikiBundle(artist.name),
      loadFeaturedOn(artist.id, artist.name),
    ]);

    const wikiData = wiki.qid ? await loadWikidata(wiki.qid) : { awards: [], facts: [] };

    return {
      artist,
      albums: classified.albums,
      singles: classified.singles,
      eps: classified.eps,
      topTracks,
      guestTracks,
      featuredOn,
      related,
      biography: wiki.biography,
      earlyLife: wiki.earlyLife,
      achievements: wiki.achievements,
      awards: wikiData.awards,
      facts: wikiData.facts,
      description: wiki.description,
      wikipediaUrl: wiki.wikipediaUrl,
      spotifyUrl: spotifySearchUrl(artist.name),
    };
  });
}

export async function loadAlbumDetail(id: string): Promise<AlbumDetail> {
  return cacheGetOrSet(`album:${id}`, 10 * 60_000, async () => {
    const raw = await fetchJson<Json>(`https://api.deezer.com/album/${encodeURIComponent(id)}`);
    if (raw.error || !raw.id) throw new Error("Album not found");
    const album = mapAlbum(raw);
    const tracks = uniqueById(
      ((raw.tracks as DeezerList<Json> | undefined)?.data ?? []).map(mapTrack),
    ).map((t) => ({
      ...t,
      albumId: album.id,
      albumTitle: album.title,
      albumCover: t.albumCover || album.cover,
      artistName: t.artistName || album.artistName,
    }));
    let artist: CatalogArtist | null = null;
    if (album.artistId) {
      try {
        artist = await loadDeezerArtist(album.artistId);
      } catch {
        artist = null;
      }
    }
    return { album, tracks, artist };
  });
}
