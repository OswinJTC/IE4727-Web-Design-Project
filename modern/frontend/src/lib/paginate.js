// Anything that is not a positive whole number means page 1
export const normalizePage = (v) => (/^[1-9]\d{0,5}$/.test(String(v ?? '')) ? Number(v) : 1);

// One page of a list. A page past the end shows the last page.
export function paginate(list, requested, size) {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const page = Math.min(normalizePage(requested), pages);
  return { items: list.slice((page - 1) * size, page * size), page, pages, total: list.length };
}
