import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useNowPlaying, usePlayerStore } from "@/lib/player-store";
import { Button } from "@/components/ui/button";

export function NowPlayingBar() {
  const track = useNowPlaying();
  const playing = usePlayerStore((s) => s.playing);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track?.preview) return;
    if (audio.src !== track.preview) {
      audio.src = track.preview;
    }
    if (playing) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [track, playing, setPlaying]);

  if (!track) return <audio ref={audioRef} className="hidden" />;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg-elevated/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <audio
        ref={audioRef}
        onEnded={next}
        onPause={() => {
          if (!audioRef.current?.ended) setPlaying(false);
        }}
        onPlay={() => setPlaying(true)}
      />
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center gap-3 px-4 sm:px-6">
        <img
          src={track.albumCover}
          alt=""
          className="size-12 shrink-0 rounded-sm object-cover img-outline"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg">{track.title}</p>
          <Link
            to="/artist/$id"
            params={{ id: track.artistId }}
            className="truncate text-xs text-muted hover:text-fg"
          >
            {track.artistName}
          </Link>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Previous preview"
            onClick={prev}
          >
            <SkipBack className="size-4" />
          </Button>
          <Button
            variant="primary"
            size="icon"
            className="size-11 rounded-full"
            aria-label={playing ? "Pause" : "Play preview"}
            onClick={toggle}
          >
            {playing ? (
              <Pause className="size-4" fill="currentColor" />
            ) : (
              <Play className="size-4 translate-x-px" fill="currentColor" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Next preview"
            onClick={next}
          >
            <SkipForward className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
