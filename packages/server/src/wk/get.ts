// import fs from 'fs'

// import yaml from 'js-yaml'

import { wkApi, ICollection, IResource } from './wanikani'

export async function getKanji () {
  const allData: any[] = []
  let nextUrl = '/subjects'

  while (true) {
    const r = await wkApi.get<ICollection<IResource<{
      slug: string
      characters: string
      level: number
    }>>>(nextUrl, {
      params: {
        types: 'kanji'
      }
    })

    console.log(r.data.url)

    nextUrl = r.data.pages.next_url || ''
    if (!nextUrl) {
      break
    }

    allData.push(
      ...r.data.data.map((d) => ({
        level: d.data.level,
        characters: d.data.characters,
        slug: d.data.slug
      }))
    )
  }

  return allData
}

export async function getVocab () {
  const allData: any[] = []
  const nextUrl = '/subjects'

  while (true) {
    const r = await wkApi.get<ICollection<IResource<{
      slug: string
      characters: string
      level: number,
      context_sentences: string
    }>>>(nextUrl, {
      params: {
        types: 'vocabulary'
      }
    })

    console.log(r.data.url)
    console.dir(r.data.data[0].data, { depth: null })

    break

    // nextUrl = r.data.pages.next_url || ''
    // if (!nextUrl) {
    //   break
    // }

    // allData.push(
    //   ...r.data.data.map((d) => ({
    //     level: d.data.level,
    //     characters: d.data.characters,
    //     slug: d.data.slug,
    //     sentences: d.data.context_sentences
    //   }))
    // )
  }

  return allData
}

if (require.main === module) {
  getVocab().then(_ => {
    // fs.writeFileSync('resources/vocabulary.yaml', yaml.safeDump(r))
  })
}
