declare module 'kuroshiro' {
  class Kuroshiro {
    init(analyzer: any): Promise<void>
    convert(text: string): Promise<string>
  }
  export = Kuroshiro
}
declare module 'kuroshiro-analyzer-kuromoji'
