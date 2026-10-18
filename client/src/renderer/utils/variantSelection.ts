// Product attachments must contain only items from the selected variant group.
export function filterVariantPrices(
  items: ReadonlyArray<{ id: string }>,
  prices: Record<string, number>,
): Record<string, number> {
  return Object.fromEntries(items.map(({ id }) => [id, prices[id] ?? 0]));
}
