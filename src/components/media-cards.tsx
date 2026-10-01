import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import type { CatalogAlbum, CatalogArtist, CatalogTrack } from "@/lib/catalog/types";
import { formatDuration, formatFans } from "@/lib/format";
import { usePlayerStore } from "@/lib/player-store";
import { cn } from "@/lib/utils";

export function ArtistPortrait({
  artist,
  size = "md",
}: {
  artist: CatalogArtist;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Link
      to="/artist/$id"
      params={{ id: artist.id }}
      className="group flex flex-col gap-3"
      preload={false}
    >
      <div
        className={cn(
          "overflow-hidden bg-bg-subtle img-outline",
          size === "lg" ? "rounded-xl" : "rounded-lg",
        )}
      >
        <img
          src={size === "lg" ? artist.pictureXl || artist.picture : artist.picture}
          alt=""
          className="aspect-square w-full object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-fg">{artist.name}</p>
        {artist.fans > 0 ? (
          <p className="text-sm text-muted">{formatFans(artist.fans)} listeners</p>
        ) : (
          <p className="text-sm text-muted">Artist</p>
        )}
      </div>
    </Link>
  );
}

export function AlbumCard({ album }: { album: CatalogAlbum }) {
  const year = album.releaseDate.slice(0, 4);
  return (
    <Link
      to="/album/$id"
      params={{ id: album.id }}
      className="group flex flex-col gap-3"
      preload={false}
    >
      <div className="overflow-hidden rounded-lg bg-bg-subtle img-outline">
        <img
          src={album.coverXl || album.cover}
          alt=""
          className="aspect-square w-full object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-fg">{album.title}</p>
        <p className="truncate text-sm text-muted">
          {[year, album.recordType !== "album" ? album.recordType : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  );
}

export function TrackRow({
  track,
  index,
  queue,
}: {
  track: CatalogTrack;
  index: number;
  queue: CatalogTrack[];
}) {
  const current = usePlayerStore((s) => s.queue[s.index]);
  const playing = usePlayerStore((s) => s.playing);
  const play = usePlayerStore((s) => s.play);
  const toggle = usePlayerStore((s) => s.toggle);
  const isCurrent = current?.id === track.id;
  const canPlay = Boolean(track.preview);

  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md px-2 py-2 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,12rem)_4rem_2.75rem]",
        isCurrent && "bg-bg-subtle",
      )}
    >
      <span className="text-center text-sm tabular-nums text-subtle">{index + 1}</span>
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={track.albumCover}
          alt=""
          className="hidden size-10 rounded-sm object-cover img-outline sm:block"
        />
        <div className="min-w-0">
          <p className={cn("truncate text-sm", isCurrent ? "text-accent" : "text-fg")}>
            {track.title}
          </p>
          <p className="truncate text-xs text-muted sm:hidden">{track.artistName}</p>
        </div>
      </div>
      <p className="hidden truncate text-sm text-muted sm:block">{track.albumTitle}</p>
      <p className="hidden text-right text-sm tabular-nums text-muted sm:block">
        {formatDuration(track.duration)}
      </p>
      <button
        type="button"
        disabled={!canPlay}
        aria-label={isCurrent && playing ? "Pause" : "Play preview"}
        className="inline-flex size-11 items-center justify-center rounded-md text-fg hover:bg-bg-subtle disabled:text-subtle"
        onClick={() => {
          if (isCurrent) toggle();
          else play(queue, queue.findIndex((t) => t.id === track.id));
        }}
      >
        {isCurrent && playing ? (
          <Pause className="size-4" fill="currentColor" />
        ) : (
          <Play className="size-4 translate-x-px" fill="currentColor" />
        )}
      </button>
    </div>
  );
}
