const VOWEL_LETTERS = ["A", "E", "I", "O", "U"];

export const isVowel = (letter: string): boolean =>
  VOWEL_LETTERS.includes(letter.toUpperCase());

export const isConsonant = (letter: string): boolean => {
  const upper = letter.toUpperCase();
  if (upper < "A" || upper > "Z") return false;
  return !VOWEL_LETTERS.includes(upper);
};

/** Fisher-Yates 洗牌 */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
