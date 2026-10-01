import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { searchCatalog } from "@/lib/catalog/functions";
import type { CatalogArtist } from "@/lib/catalog/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchField({
  size = "md",
  autoFocus = false,
  initial = "",
  className,
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  initial?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<CatalogArtist[]>([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const inputId = useId();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void searchCatalog({ data: { q: term } }).then((rows) => {
        if (!cancelled) {
          setHits(rows.slice(0, 8));
          if (document.activeElement === inputRef.current) {
            setOpen(true);
            setActive(0);
          }
        }
      });
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function goSearch() {
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    void navigate({ to: "/search", search: { q: term } });
  }

  function goArtist(id: string) {
    setOpen(false);
    inputRef.current?.blur();
    void navigate({ to: "/artist/$id", params: { id } });
  }

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <label className="sr-only" htmlFor={inputId}>
        Search artists
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <Input
        id={inputId}
        ref={inputRef}
        value={q}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Search any artist"
        className={cn("pl-11", size === "lg" && "h-14 rounded-lg text-lg")}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (open && hits[active]) goArtist(hits[active].id);
            else goSearch();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && hits.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg bg-bg-elevated py-2 shadow-border"
        >
          {hits.map((hit, i) => (
            <li key={hit.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left",
                  i === active ? "bg-bg-subtle" : "hover:bg-bg-subtle/70",
                )}
                onMouseEnter={() => setActive(i)}
                onClick={() => goArtist(hit.id)}
              >
                <img
                  src={hit.picture}
                  alt=""
                  className="size-10 rounded-sm object-cover img-outline"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-fg">{hit.name}</span>
                  {hit.fans > 0 ? (
                    <span className="block text-xs text-muted">Artist</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
