export function getRandomItems(items: any[], count: number) {
  const shuffled = items.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
