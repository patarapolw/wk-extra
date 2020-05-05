import { getModelForClass, prop } from '@typegoose/typegoose'

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
