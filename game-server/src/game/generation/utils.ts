export function getRandomItems(items: any[], count: number) {
  const shuffled = shuffleArray(items);
  return shuffled.slice(0, count);
}

function shuffleArray<T>(array: T[]): T[] {
  // using fisher-yates algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
