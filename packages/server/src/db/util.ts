export function isHan(s: string) {
  return /^\p{sc=Han}$/.test(s)
}

export function isJapanese(s: string) {
  return /[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}]/.test(s)
}
