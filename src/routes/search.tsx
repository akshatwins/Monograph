import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { searchCatalog } from "@/lib/catalog/functions";
import { SearchField } from "@/components/search-field";
import { ArtistPortrait } from "@/components/media-cards";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = { q: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const term = q.trim();
  const query = useQuery({
    queryKey: ["search", term],
    queryFn: () => searchCatalog({ data: { q: term } }),
    enabled: term.length > 0,
  });

  return (
    <div className="min-h-dvh bg-bg pb-24 text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
          Catalogue search
        </p>
        <h1 className="mt-3 font-display text-4xl italic sm:text-5xl">Find an artist</h1>
        <div className="mt-8 max-w-xl md:hidden">
          <SearchField initial={term} />
        </div>
        {term ? (
          <p className="mt-6 text-sm text-muted">
            Results for <span className="text-fg">{term}</span>
          </p>
        ) : (
          <p className="mt-6 max-w-lg text-pretty text-muted">
            Type any name in the streaming catalogue — from global headliners to
            independent acts — and open their monograph.
          </p>
        )}

        {query.isFetching ? (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : null}

        {query.data && query.data.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {query.data.map((artist) => (
              <ArtistPortrait key={artist.id} artist={artist} />
            ))}
          </div>
        ) : null}

        {term && query.isFetched && query.data?.length === 0 ? (
          <p className="mt-10 text-sm text-muted">
            No artists matched that spelling. Try the name as it appears on
            Spotify.
          </p>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
