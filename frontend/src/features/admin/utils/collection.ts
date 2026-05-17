export type AlphabetSection<T> = {
  letter: string;
  items: T[];
};

export const sortByLabel = <T,>(items: T[], getLabel: (item: T) => string) =>
  [...items].sort((left, right) =>
    getLabel(left).localeCompare(getLabel(right), undefined, {
      sensitivity: "base",
    }),
  );

export const sectionByLetter = <T,>(
  items: T[],
  getLabel: (item: T) => string,
): AlphabetSection<T>[] => {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const trimmed = getLabel(item).trim();
    const letter = /^[A-Za-z]/.test(trimmed) ? trimmed[0].toUpperCase() : "#";
    grouped.set(letter, [...(grouped.get(letter) || []), item]);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([letter, groupedItems]) => ({
      letter,
      items: sortByLabel(groupedItems, getLabel),
    }));
};
