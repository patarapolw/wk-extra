export function isHan(s: string) {
  return /^\p{sc=Han}$/u.test(s)
}

export function isJapanese(s: string) {
  return /[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}]/u.test(s)
}
