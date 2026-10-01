import { createFileRoute } from "@tanstack/react-router";
import { getArtistDossier } from "@/lib/catalog/functions";
import { ArtistPending, ArtistView } from "@/components/artist-view";

export const Route = createFileRoute("/artist/$id")({
  loader: ({ params }) => getArtistDossier({ data: { id: params.id } }),
  pendingComponent: ArtistPending,
  pendingMs: 150,
  component: ArtistPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.artist.name
          ? `${loaderData.artist.name} — Monograph`
          : "Artist — Monograph",
      },
    ],
  }),
});

function ArtistPage() {
  const dossier = Route.useLoaderData();
  return <ArtistView dossier={dossier} />;
}
