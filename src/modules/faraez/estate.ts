/** Largest-remainder proportional split of `totalScaled` across positive weights. */
function allocateProportional(weights: readonly bigint[], totalScaled: bigint): bigint[] {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0n);
  if (weightSum <= 0n || totalScaled <= 0n) return weights.map(() => 0n);

  const rows = weights.map((weight, index) => {
    const numerator = totalScaled * weight;
    const base = numerator / weightSum;
    const remainder = numerator % weightSum;
    return { index, base, remainder };
  });

  const assigned = rows.reduce((sum, row) => sum + row.base, 0n);
  let leftover = totalScaled - assigned;

  [...rows]
    .sort((a, b) =>
      b.remainder > a.remainder ? 1 : b.remainder < a.remainder ? -1 : a.index - b.index,
    )
    .forEach((row) => {
      if (leftover > 0n) {
        row.base += 1n;
        leftover -= 1n;
      }
    });

  return rows.sort((a, b) => a.index - b.index).map((row) => row.base);
}
