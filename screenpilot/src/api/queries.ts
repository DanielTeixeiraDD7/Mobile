/** Champs communs : tout ce que l'app affiche ou utilise, rien de plus. */
export const MEDIA_FIELDS = `
  id type isAdult format status episodes duration chapters volumes
  title { romaji english native }
  coverImage { large color }
  genres
  tags { name rank isMediaSpoiler isAdult }
  season seasonYear startDate { year month day }
  averageScore siteUrl
  nextAiringEpisode { episode airingAt }
`;

export const SEARCH_QUERY = `
query Search($search: String!, $type: MediaType!, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(search: $search, type: $type, isAdult: false, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
  }
}`;

export const MEDIA_QUERY = `
query Media($id: Int!) {
  Media(id: $id) {
    ${MEDIA_FIELDS}
    description(asHtml: false)
    recommendations(sort: RATING_DESC, perPage: 12) {
      nodes { rating mediaRecommendation { ${MEDIA_FIELDS} } }
    }
  }
}`;

/** Rafraîchit en une requête les titres suivis (max 50 par page). */
export const MEDIA_BATCH_QUERY = `
query Batch($ids: [Int], $page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    media(id_in: $ids) { ${MEDIA_FIELDS} }
  }
}`;

export const AIRING_QUERY = `
query Airing($ids: [Int], $from: Int, $to: Int, $page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    airingSchedules(mediaId_in: $ids, airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
      id episode airingAt mediaId
    }
  }
}`;

/** Découverte : titres populaires de la saison (sert de candidats aux recommandations). */
export const TRENDING_QUERY = `
query Trending($type: MediaType!, $page: Int) {
  Page(page: $page, perPage: 30) {
    media(type: $type, isAdult: false, sort: TRENDING_DESC) { ${MEDIA_FIELDS} }
  }
}`;
