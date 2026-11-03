/** Read every page before replacing the UI's previous complete snapshot. */
export async function loadAllRows<T>(query: (from: number, to: number) => PromiseLike<{
  data: T[] | null; error: { message: string } | null;
}>) {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query(offset, offset + 499);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < 500) return { data: rows, error: null };
  }
}
