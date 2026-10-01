import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getHomeCatalogue } from "@/lib/catalog/functions";
import { SearchField } from "@/components/search-field";
import { AlbumCard, ArtistPortrait, TrackRow } from "@/components/media-cards";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { useRecentsStore } from "@/lib/recents-store";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  loader: () => getHomeCatalogue(),
  pendingComponent: HomePending,
  component: Home,
});

function issueLine() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Home() {
  const data = Route.useLoaderData();
  const recents = useRecentsStore((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const recentItems = mounted ? recents : [];

  return (
    <div className="min-h-dvh bg-bg pb-24 text-fg">
      <SiteHeader compact />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-subtle">
              Vol. XXVI · {issueLine()}
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl italic leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              The artist, in full.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg text-muted">
              Open a monograph for any recording artist — early life, honours,
              albums, and the songs they feature on. Search the streaming
              catalogue, then listen on Spotify.
            </p>
            <div className="mt-10 max-w-xl">
              <SearchField size="lg" autoFocus />
            </div>
          </div>
        </section>

        {recentItems.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-subtle">
              Recently opened
            </p>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {recentItems.slice(0, 6).map((r) => (
                <ArtistPortrait
                  key={r.id}
                  artist={{
                    id: r.id,
                    name: r.name,
                    picture: r.picture,
                    pictureXl: r.picture,
                    fans: 0,
                    albumCount: 0,
                  }}
                  size="sm"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
                On the catalogue
              </p>
              <h2 className="mt-2 font-display text-3xl italic">Artists in rotation</h2>
            </div>
            <Link
              to="/search"
              search={{ q: "" }}
              className="hidden text-sm text-muted hover:text-fg sm:inline"
            >
              Search the file
            </Link>
          </div>
          {data.artists.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {data.artists.slice(0, 8).map((artist) => (
                <ArtistPortrait key={artist.id} artist={artist} size="lg" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              The live chart is unavailable. Search any artist name to open a file.
            </p>
          )}
        </section>

        {data.albums.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
              Records
            </p>
            <h2 className="mt-2 font-display text-3xl italic">Albums of the moment</h2>
            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {data.albums.slice(0, 6).map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>
        ) : null}

        {data.tracks.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-subtle">
              Heard now
            </p>
            <div className="-mx-2">
              {data.tracks.map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} queue={data.tracks} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function HomePending() {
  return (
    <div className="min-h-dvh bg-bg px-4 py-20 text-fg sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-14 w-full max-w-xl" />
        <div className="grid grid-cols-2 gap-5 pt-10 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    </div>
  );
}
