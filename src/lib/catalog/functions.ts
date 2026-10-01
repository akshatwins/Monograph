import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import {
  loadAlbumDetail,
  loadArtistDossier,
  loadHomeCatalogue,
  searchArtists,
} from "./catalog.server";

export const getHomeCatalogue = createServerFn({ method: "GET" }).handler(async () => {
  return loadHomeCatalogue();
});

export const searchCatalog = createServerFn({ method: "GET" })
  .validator(z.object({ q: z.string().max(80) }))
  .handler(async ({ data }) => {
    return searchArtists(data.q);
  });

export const getArtistDossier = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1).max(32) }))
  .handler(async ({ data }) => {
    try {
      return await loadArtistDossier(data.id);
    } catch {
      throw notFound();
    }
  });

export const getAlbumDetail = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1).max(32) }))
  .handler(async ({ data }) => {
    try {
      return await loadAlbumDetail(data.id);
    } catch {
      throw notFound();
    }
  });
