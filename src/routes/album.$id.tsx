import { createFileRoute } from "@tanstack/react-router";
import { getAlbumDetail } from "@/lib/catalog/functions";
import { AlbumView, ArtistPending } from "@/components/artist-view";

export const Route = createFileRoute("/album/$id")({
  loader: ({ params }) => getAlbumDetail({ data: { id: params.id } }),
  pendingComponent: ArtistPending,
  pendingMs: 150,
  component: AlbumPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.album.title
          ? `${loaderData.album.title} — Monograph`
          : "Album — Monograph",
      },
    ],
  }),
});

function AlbumPage() {
  const data = Route.useLoaderData();
  return (
    <AlbumView album={data.album} tracks={data.tracks} artist={data.artist} />
  );
}
