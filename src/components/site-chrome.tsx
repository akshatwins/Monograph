import { Link } from "@tanstack/react-router";
import { SearchField } from "@/components/search-field";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="shrink-0 font-display text-xl italic tracking-tight text-fg"
        >
          Monograph
        </Link>
        <div className="hidden flex-1 md:block">
          <SearchField className="max-w-md" />
        </div>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            to="/search"
            search={{ q: "" }}
            className="inline-flex h-11 items-center px-3 text-muted hover:text-fg md:hidden"
          >
            Search
          </Link>
          {!compact ? (
            <Link
              to="/"
              className="hidden h-11 items-center px-3 text-muted hover:text-fg sm:inline-flex"
            >
              Catalogue
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-muted sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-lg italic text-fg">Monograph</p>
          <p className="mt-1 max-w-md text-pretty">
            Encyclopedic artist files drawn from public biography sources and the
            global streaming catalogue. Open any name in Spotify to listen in
            full.
          </p>
        </div>
        <p className="text-xs text-subtle">Text via Wikipedia and Wikidata.</p>
      </div>
    </footer>
  );
}
