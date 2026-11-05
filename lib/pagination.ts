export function pageWindow(requested: number, count: number) {
  const pages = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
  const page = Number.isFinite(requested) ? Math.max(1, Math.min(pages, Math.floor(requested))) : 1;
  return [...new Set([1, page - 1, page, page + 1, pages])]
    .filter(value => value >= 1 && value <= pages).sort((a, b) => a - b);
}
