import Kuromoji from 'kuromoji'
import Kuroshiro from 'kuroshiro'
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji'

export const kuroshiro = new Kuroshiro()

export async function initKuroshiro() {
  await kuroshiro.init(new KuromojiAnalyzer())
}

export let kuromoji: Kuromoji.Tokenizer<Kuromoji.IpadicFeatures>

export async function initKuromoji() {
  kuromoji =
    kuromoji ||
    (await new Promise((resolve, reject) => {
      Kuromoji.builder({
        dicPath: './kuromoji.js/dict',
      }).build((e, t) => (e ? reject(e) : resolve(t)))
    }))
}
