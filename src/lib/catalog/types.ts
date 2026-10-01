export type CatalogArtist = {
  id: string;
  name: string;
  picture: string;
  pictureXl: string;
  fans: number;
  albumCount: number;
};

export type CatalogAlbum = {
  id: string;
  title: string;
  cover: string;
  coverXl: string;
  artistId: string;
  artistName: string;
  releaseDate: string;
  recordType: string;
  explicit: boolean;
  trackCount?: number;
};

export type CatalogTrack = {
  id: string;
  title: string;
  duration: number;
  preview: string | null;
  explicit: boolean;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  albumCover: string;
  rank?: number;
  contributors: { id: string; name: string; role: string }[];
};

export type AwardRecord = {
  name: string;
  years: string[];
  count: number;
};

export type LifeFact = {
  label: string;
  value: string;
};

export type WikiSection = {
  title: string;
  paragraphs: string[];
  sourceTitle: string;
  sourceUrl: string;
};

export type ArtistDossier = {
  artist: CatalogArtist;
  albums: CatalogAlbum[];
  singles: CatalogAlbum[];
  eps: CatalogAlbum[];
  topTracks: CatalogTrack[];
  guestTracks: CatalogTrack[];
  featuredOn: CatalogTrack[];
  related: CatalogArtist[];
  biography: WikiSection | null;
  earlyLife: WikiSection | null;
  achievements: WikiSection | null;
  awards: AwardRecord[];
  facts: LifeFact[];
  description: string;
  wikipediaUrl: string | null;
  spotifyUrl: string;
};

export type AlbumDetail = {
  album: CatalogAlbum;
  tracks: CatalogTrack[];
  artist: CatalogArtist | null;
};

export type HomeCatalogue = {
  artists: CatalogArtist[];
  albums: CatalogAlbum[];
  tracks: CatalogTrack[];
};
