/** Public URL for a catalog collection id. */
export function collectionHref(id: string) {
  if (id === "large") return "/kollektion/gross";
  if (id === "small") return "/kollektion/klein";
  return `/kollektion/${encodeURIComponent(id)}`;
}
