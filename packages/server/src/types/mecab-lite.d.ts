declare module 'mecab-lite' {
  class Mecab {
    parse(text: string, cb: (out: string[]) => void): void
    parseSync(text: string): string[]

    wakatigaki(text: string, cb: (out: string[]) => void): void
    wakatigakiSync(text: string): string[]
  }

  export = Mecab
}
