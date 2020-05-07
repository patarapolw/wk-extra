import { getModelForClass, prop, index } from '@typegoose/typegoose'

class WkSentence {
  @prop({ required: true, unique: true }) ja!: string
  @prop({ required: true }) en!: string
  @prop({ default: () => [] }) vocab!: number[]
}

export const WkSentenceModel = getModelForClass(WkSentence, { schemaOptions: { timestamps: true } })

class WkVocab {
  @prop() _id!: number
  @prop({ required: true }) entry!: string
  @prop({ required: true }) level!: number
}

export const WkVocabModel = getModelForClass(WkVocab, { schemaOptions: { timestamps: true } })

class WkKanji {
  @prop() _id!: number
  @prop({ required: true }) entry!: string
  @prop({ required: true }) level!: number
}

export const WkKanjiModel = getModelForClass(WkKanji, { schemaOptions: { timestamps: true } })

class Character {
  @prop({ unique: true, required: true }) entry!: string
  @prop({ default: () => [], index: true }) sub!: string[]
  @prop({ default: () => [], index: true }) sup!: string[]
  @prop({ default: () => [], index: true }) var!: string[]
}

export const CharacterModel = getModelForClass(Character)

class Hanzi {
  @prop() _id!: number
  @prop({ unique: true, required: true }) character!: string
  @prop() rawFrequency!: number
  @prop() percentile!: number
  @prop({ required: true }) pinyin!: string
  @prop() english?: string
}

export const HanziModel = getModelForClass(Hanzi)

@index({ simplified: 1, traditional: 1, pinyin: 1 }, { unique: true })
class ZhDict {
  @prop({ required: true }) simplified!: string
  @prop() traditional?: string
  @prop({ required: true }) pinyin!: string
  @prop({ required: true }) english!: string
  @prop() rating?: number
}

export const ZhDictModel = getModelForClass(ZhDict)

class Kanji {
  @prop({ unique: true }) kanji!: string
  @prop({ default: () => [] }) readings!: string[]
  @prop({ default: () => [] }) info!: string[]
  @prop({ default: () => [] }) meanings!: string[]
}

export const KanjiModel = getModelForClass(Kanji)

class JaDict {
  @prop({ default: () => [] }) kanji!: string[]
  @prop({ default: () => [] }) readings!: string[]
  @prop({ default: () => [] }) info!: string[]
  @prop({ default: () => [] }) meanings!: string[]
  @prop({ unique: true }) ent_seq!: string
}

export const JaDictModel = getModelForClass(JaDict)
