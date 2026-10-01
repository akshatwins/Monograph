import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Play } from "lucide-react";
import type { ArtistDossier, WikiSection } from "@/lib/catalog/types";
import { formatFans } from "@/lib/format";
import { usePlayerStore } from "@/lib/player-store";
import { useRecentsStore } from "@/lib/recents-store";
import { AlbumCard, ArtistPortrait, TrackRow } from "@/components/media-cards";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-subtle">
      {children}
    </p>
  );
}

function ProseBlock({ section }: { section: WikiSection }) {
  return (
    <div className="max-w-2xl">
      {section.paragraphs.map((p) => (
        <p key={p.slice(0, 48)} className="mt-4 text-pretty text-base leading-relaxed text-fg/90">
          {p}
        </p>
      ))}
      <a
        href={section.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        Source: {section.sourceTitle}
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}

function EmptyNote({ children }: { children: string }) {
  return <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted">{children}</p>;
}

export function ArtistView({ dossier }: { dossier: ArtistDossier }) {
  const { artist } = dossier;
  const play = usePlayerStore((s) => s.play);
  const remember = useRecentsStore((s) => s.remember);

  useEffect(() => {
    remember({ id: artist.id, name: artist.name, picture: artist.picture });
  }, [artist.id, artist.name, artist.picture, remember]);

  const firstPreview = dossier.topTracks.findIndex((t) => t.preview);

  return (
    <div className="min-h-dvh bg-bg pb-24 text-fg">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0">
            {artist.pictureXl ? (
              <img
                src={artist.pictureXl}
                alt=""
                className="h-full w-full object-cover opacity-[0.18] blur-2xl scale-125"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/80 to-bg" />
          </div>
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-end">
            <img
              src={artist.pictureXl || artist.picture}
              alt={artist.name}
              className="mx-auto aspect-square w-56 rounded-xl object-cover img-outline sm:w-64 lg:w-full"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
                Artist file
              </p>
              <h1 className="mt-2 font-display text-5xl italic leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
                {artist.name}
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-muted">
                {dossier.description ||
                  (artist.fans
                    ? `${formatFans(artist.fans)} listeners in the streaming catalogue.`
                    : "A recording artist in the global catalogue.")}
              </p>
              <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {dossier.facts.slice(0, 4).map((f) => (
                  <div key={f.label}>
                    <dt className="text-subtle">{f.label}</dt>
                    <dd className="text-fg">{f.value}</dd>
                  </div>
                ))}
                {artist.fans > 0 ? (
                  <div>
                    <dt className="text-subtle">Listeners</dt>
                    <dd className="text-fg">{formatFans(artist.fans)}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  disabled={firstPreview < 0}
                  onClick={() => play(dossier.topTracks, Math.max(firstPreview, 0))}
                >
                  <Play className="size-4 translate-x-px" fill="currentColor" />
                  Play previews
                </Button>
                <Button variant="secondary" asChild>
                  <a href={dossier.spotifyUrl} target="_blank" rel="noreferrer">
                    Listen on Spotify
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <nav className="border-b border-border">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4">
            {[
              ["#life", "Life"],
              ["#awards", "Awards"],
              ["#albums", "Albums"],
              ["#songs", "Songs"],
              ["#features", "Features"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="inline-flex h-12 shrink-0 items-center px-3 text-sm text-muted hover:text-fg"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6">
          <section id="life" className="scroll-mt-24">
            <SectionLabel>Early life</SectionLabel>
            {dossier.earlyLife ? (
              <ProseBlock section={dossier.earlyLife} />
            ) : dossier.biography ? (
              <>
                <p className="mb-2 text-sm text-muted">
                  A dedicated early-life chapter was not filed; the lead encyclopedic
                  entry follows.
                </p>
                <ProseBlock section={dossier.biography} />
              </>
            ) : (
              <EmptyNote>
                No public encyclopedic biography was found under this name. Discography
                and recordings are listed below.
              </EmptyNote>
            )}
          </section>

          <section id="awards" className="scroll-mt-24">
            <SectionLabel>Awards and honours</SectionLabel>
            {dossier.awards.length > 0 ? (
              <ul className="divide-y divide-border border-y border-border">
                {dossier.awards.slice(0, 18).map((award) => (
                  <li
                    key={award.name}
                    className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                  >
                    <p className="text-fg">{award.name}</p>
                    <p className="shrink-0 text-sm tabular-nums text-muted">
                      {award.years.length
                        ? award.years.slice(0, 6).join(" · ")
                        : award.count > 1
                          ? `×${award.count}`
                          : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : dossier.achievements ? (
              <ProseBlock section={dossier.achievements} />
            ) : (
              <EmptyNote>
                No published award record was found in public encyclopedic sources for
                this artist.
              </EmptyNote>
            )}
            {dossier.awards.length > 0 && dossier.achievements ? (
              <div className="mt-8">
                <SectionLabel>On the record</SectionLabel>
                <ProseBlock section={dossier.achievements} />
              </div>
            ) : null}
          </section>

          <section id="albums" className="scroll-mt-24">
            <SectionLabel>Albums</SectionLabel>
            {dossier.albums.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {dossier.albums.slice(0, 16).map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            ) : (
              <EmptyNote>No studio albums were returned for this artist.</EmptyNote>
            )}
            {dossier.eps.length > 0 ? (
              <div className="mt-12">
                <SectionLabel>EPs</SectionLabel>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                  {dossier.eps.slice(0, 8).map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section id="songs" className="scroll-mt-24">
            <div className="mb-4 flex items-end justify-between gap-4">
              <SectionLabel>Songs</SectionLabel>
              <span className="mb-4 text-xs text-subtle">Thirty-second previews</span>
            </div>
            {dossier.topTracks.length > 0 ? (
              <div className="-mx-2">
                {dossier.topTracks.slice(0, 12).map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i}
                    queue={dossier.topTracks}
                  />
                ))}
              </div>
            ) : (
              <EmptyNote>No playable recordings were returned.</EmptyNote>
            )}
          </section>

          <section id="features" className="scroll-mt-24">
            <SectionLabel>Featured on</SectionLabel>
            {dossier.featuredOn.length > 0 ? (
              <div className="-mx-2">
                {dossier.featuredOn.slice(0, 12).map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i}
                    queue={dossier.featuredOn}
                  />
                ))}
              </div>
            ) : dossier.guestTracks.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-muted">
                  Guest verses and featured credits on their own catalogue.
                </p>
                <div className="-mx-2">
                  {dossier.guestTracks.slice(0, 10).map((track, i) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={i}
                      queue={dossier.guestTracks}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyNote>
                No guest appearances were indexed under a featured-artist credit.
              </EmptyNote>
            )}
          </section>

          {dossier.related.length > 0 ? (
            <section>
              <SectionLabel>Adjacent artists</SectionLabel>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
                {dossier.related.map((rel) => (
                  <ArtistPortrait key={rel.id} artist={rel} size="sm" />
                ))}
              </div>
            </section>
          ) : null}

          {dossier.wikipediaUrl ? (
            <p className="text-sm text-subtle">
              Encyclopedic text from{" "}
              <a
                href={dossier.wikipediaUrl}
                className="text-muted hover:text-fg"
                target="_blank"
                rel="noreferrer"
              >
                Wikipedia
              </a>
              , available under CC BY-SA.
            </p>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function ArtistPending() {
  return (
    <div className="min-h-dvh bg-bg pb-24 text-fg">
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[18rem_1fr]">
        <div className="aspect-square rounded-xl bg-bg-subtle skeleton-pulse" />
        <div className="space-y-4 pt-8">
          <div className="h-4 w-24 rounded-sm bg-bg-subtle skeleton-pulse" />
          <div className="h-16 w-2/3 rounded-md bg-bg-subtle skeleton-pulse" />
          <div className="h-4 w-1/2 rounded-sm bg-bg-subtle skeleton-pulse" />
        </div>
      </div>
    </div>
  );
}

export function AlbumView({
  album,
  tracks,
  artist,
}: {
  album: ArtistDossier["albums"][number];
  tracks: ArtistDossier["topTracks"];
  artist: ArtistDossier["artist"] | null;
}) {
  const play = usePlayerStore((s) => s.play);
  const year = album.releaseDate.slice(0, 4);
  const firstPreview = tracks.findIndex((t) => t.preview);

  return (
    <div className="min-h-dvh bg-bg pb-24 text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-end">
          <img
            src={album.coverXl || album.cover}
            alt={album.title}
            className="mx-auto aspect-square w-56 rounded-xl object-cover img-outline sm:w-72 lg:w-full"
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
              {album.recordType || "Album"}
            </p>
            <h1 className="mt-2 font-display text-4xl italic leading-tight tracking-tight sm:text-5xl">
              {album.title}
            </h1>
            <p className="mt-3 text-muted">
              {artist ? (
                <Link
                  to="/artist/$id"
                  params={{ id: artist.id }}
                  className="text-fg hover:underline"
                >
                  {artist.name}
                </Link>
              ) : (
                album.artistName
              )}
              {year ? ` · ${year}` : ""}
              {album.explicit ? " · Explicit" : ""}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                disabled={firstPreview < 0}
                onClick={() => play(tracks, Math.max(firstPreview, 0))}
              >
                <Play className="size-4 translate-x-px" fill="currentColor" />
                Play previews
              </Button>
              <Button variant="secondary" asChild>
                <a
                  href={`https://open.spotify.com/search/${encodeURIComponent(`${album.artistName} ${album.title}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Find on Spotify
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-12 -mx-2">
          {tracks.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} queue={tracks} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
