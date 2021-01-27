import { ICollection, IResource, wkApi } from '@/wk/wanikani'

async function main() {
  const allData: {
    id: number
    meaning_synonyms: string[]
  }[] = []
  let nextUrl = '/study_materials'

  while (true) {
    const r = await wkApi.get<
      ICollection<
        IResource<{
          meaning_synonyms: string[]
        }>
      >
    >(nextUrl)

    allData.push(
      ...r.data.data
        .filter(
          ({ data: { meaning_synonyms } }) =>
            meaning_synonyms && meaning_synonyms.length
        )
        .map((d) => ({
          id: d.id,
          meaning_synonyms: d.data.meaning_synonyms,
        }))
    )

    console.log(r.data.url)

    nextUrl = r.data.pages.next_url || ''
    if (!nextUrl) {
      break
    }
  }

  console.log(allData.map((d) => d.id))

  await Promise.all(
    allData.map(async (d) => {
      return wkApi
        .put(`/study_materials/${d.id}`, {
          meaning_synonyms: [],
        })
        .then((r) => console.log(r.data))
    })
  )
}

if (require.main === module) {
  main()
}
