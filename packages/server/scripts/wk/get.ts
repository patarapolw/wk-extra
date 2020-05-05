import { wkApi, ICollection, IResource } from './wanikani'

export async function getKanji () {
  const allData: {
    id: number
    level: number
    characters: string
  }[] = []
  let nextUrl = '/subjects'

  while (true) {
    const r = await wkApi.get<ICollection<IResource<{
      characters: string
      level: number
    }>>>(nextUrl, {
      params: {
        types: 'kanji'
      }
    })

    allData.push(
      ...r.data.data.map((d) => ({
        id: d.id,
        level: d.data.level,
        characters: d.data.characters
      }))
    )

    console.log(r.data.url)

    nextUrl = r.data.pages.next_url || ''
    if (!nextUrl) {
      break
    }
  }

  return allData
}

export async function getVocab () {
  const allData: {
    id: number
    level: number
    characters: string
    sentences: {
      ja: string
      en: string
    }[]
  }[] = []
  let nextUrl = '/subjects'

  while (true) {
    const r = await wkApi.get<ICollection<IResource<{
      characters: string
      level: number,
      context_sentences: {
        ja: string
        en: string
      }[]
    }>>>(nextUrl, {
      params: {
        types: 'vocabulary'
      }
    })

    allData.push(
      ...r.data.data.map((d) => ({
        id: d.id,
        level: d.data.level,
        characters: d.data.characters,
        sentences: d.data.context_sentences
      }))
    )

    console.log(r.data.url)

    nextUrl = r.data.pages.next_url || ''
    if (!nextUrl) {
      break
    }
  }

  return allData
}

export async function getLearnt () {
  const allData: {
    id: number
    srsLevel: number
  }[] = []
  let nextUrl = '/assignments'

  while (true) {
    const r = await wkApi.get<ICollection<IResource<{
      subject_id: number
      srs_stage: number
    }>>>(nextUrl, {
      params: {
        unlocked: 'true'
      }
    })

    console.log(r.data.url)

    r.data.data.map((d) => {
      allData.push({
        id: d.data.subject_id,
        srsLevel: d.data.srs_stage
      })
    })

    nextUrl = r.data.pages.next_url || ''
    if (!nextUrl) {
      break
    }
  }

  return allData
}
