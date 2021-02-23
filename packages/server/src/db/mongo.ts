import {
  Severity,
  getModelForClass,
  index,
  mongoose,
  prop,
  setGlobalOptions,
} from '@typegoose/typegoose'
import { Ulid } from 'id128'
import { addDate } from 'native-duration'

import { srsMap } from './srs'

setGlobalOptions({ options: { allowMixed: Severity.ALLOW } })

mongoose.pluralize((null as unknown) as undefined)

@index({ ja: 'text', en: 'text' })
class WkSentence {
  @prop({ required: true, index: true }) ja!: string
  @prop({ required: true }) en!: string

  @prop({ index: true }) character?: string
  @prop({ index: true }) level?: number

  @prop({ index: true }) source!: 'wanikani' | 'tatoeba'

  @prop({ index: true, default: () => [] }) tag!: string[]
}

export const WkSentenceModel = getModelForClass(WkSentence, {
  schemaOptions: { timestamps: true },
})

@index({ english: 'text' })
class Dict {
  @prop({
    index: true,
    validate: (it: string[]) =>
      Array.isArray(it) &&
      it.length > 0 &&
      it.every((el) => typeof el === 'string'),
  })
  entry!: string[]

  @prop({ index: true, default: () => [] }) reading!: string[]

  @prop({
    validate: (it: string[]) =>
      Array.isArray(it) &&
      it.length > 0 &&
      it.every((el) => typeof el === 'string'),
  })
  english!: string[]

  @prop({ index: true }) level?: number
  @prop() audio?: Record<string, string>

  @prop({ index: true }) type!: 'kanji' | 'vocab'
  @prop({ index: true }) source!: 'wanikani' | 'edict' | 'kanjidic'

  @prop({ index: true, default: () => [] }) tag!: string[]
}

export const DictModel = getModelForClass(Dict, {
  schemaOptions: { timestamps: true },
})

class User {
  @prop({ required: true }) _id!: string
  @prop({ required: true }) username!: string
  @prop({ required: true }) level!: number
  @prop() voiceId?: number
  @prop() autoplayAudio?: boolean

  @prop({ default: () => [] }) isManual!: (
    | 'level'
    | 'username'
    | 'voiceId'
    | 'autoplayAudio'
  )[]

  @prop({ default: 1 }) levelMin!: number
}

export const UserModel = getModelForClass(User, {
  schemaOptions: { timestamps: true },
})

@index({ english: 'text' })
class Extra {
  @prop({ default: () => Ulid.generate().toCanonical() }) _id!: string

  @prop({
    index: true,
    validate: (it: string[]) =>
      Array.isArray(it) &&
      it.length > 0 &&
      it.every((el) => typeof el === 'string'),
  })
  userId!: string[]

  @prop({
    index: true,
    validate: (it: string[]) =>
      Array.isArray(it) &&
      it.length > 0 &&
      it.every((el) => typeof el === 'string'),
  })
  entry!: string[]

  @prop({ index: true, default: () => [] }) reading!: string[]

  @prop({
    validate: (it: string[]) =>
      Array.isArray(it) &&
      it.length > 0 &&
      it.every((el) => typeof el === 'string'),
  })
  english!: string[]

  @prop() audio?: Record<string, string>

  @prop({ index: true }) type!: 'kanji' | 'vocab' | 'sentence'
  @prop({ index: true, default: () => [] }) tag!: string[]
}

export const ExtraModel = getModelForClass(Extra, {
  schemaOptions: { timestamps: true },
})

@index({ entry: 1, type: 1, direction: 1 }, { unique: true })
class Quiz {
  @prop({ default: () => Ulid.generate().toCanonical() }) _id!: string

  @prop({ required: true, index: true }) userId!: string

  @prop({ required: true }) entry!: string
  @prop({ required: true }) type!: 'kanji' | 'vocab' | 'sentence'
  @prop({ required: true }) direction!: 'je' | 'ej'

  @prop({ index: true }) srsLevel?: number
  @prop({ index: true }) nextReview?: Date
  @prop({ index: true }) lastRight?: Date
  @prop({ index: true }) lastWrong?: Date
  @prop({ index: true }) rightStreak?: number
  @prop({ index: true }) wrongStreak?: number
  @prop({ index: true }) maxRight?: number
  @prop({ index: true }) maxWrong?: number

  updateSRSLevel(df: number) {
    const now = new Date()
    const getNextReview = (srsLevel: number) => {
      const dur = srsMap[srsLevel] || [1, 'h']
      return addDate(now)[dur[1]](dur[0])
    }

    this.rightStreak = this.rightStreak || 0
    this.wrongStreak = this.wrongStreak || 0
    this.maxRight = this.maxRight || 0
    this.maxWrong = this.maxWrong || 0

    if (df > 0) {
      this.lastRight = now

      this.rightStreak++
      this.wrongStreak = 0

      if (this.rightStreak > this.maxRight) {
        this.maxRight = this.rightStreak
      }
    } else if (df < 0) {
      this.lastWrong = now

      this.wrongStreak++
      this.rightStreak = 0

      if (this.wrongStreak > this.maxWrong) {
        this.maxWrong = this.wrongStreak
      }
    }

    this.srsLevel = this.srsLevel || 0
    this.srsLevel = this.srsLevel + df
    if (this.srsLevel < 0) {
      this.srsLevel = 0
    }
    if (this.srsLevel >= srsMap.length) {
      this.srsLevel = srsMap.length - 1
    }

    if (df) {
      this.nextReview = getNextReview(this.srsLevel)
    } else {
      this.nextReview = getNextReview(-1)
    }
  }
}

export const QuizModel = getModelForClass(Quiz, {
  schemaOptions: { timestamps: true },
})

export async function mongoConnect() {
  return mongoose.connect(process.env.MONGO_URI!, {
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}
