import {
  Severity,
  getModelForClass,
  index,
  mongoose,
  prop,
  setGlobalOptions,
} from '@typegoose/typegoose'
import { nanoid } from 'nanoid'
import { addDate } from 'native-duration'

import { srsMap } from './srs'

setGlobalOptions({ options: { allowMixed: Severity.ALLOW } })

mongoose.pluralize((null as unknown) as undefined)

class Radical {
  @prop({ required: true, index: true }) entry!: string
  @prop({ default: () => [], index: true }) sub!: string[]
  @prop({ default: () => [], index: true }) sup!: string[]
  @prop({ default: () => [], index: true }) var!: string[]
}

export const RadicalModel = getModelForClass(Radical)

class User {
  @prop({ required: true }) _id!: string
  @prop({ required: true }) username!: string
  @prop({ required: true }) level!: number
  @prop() voiceId?: number
  @prop() autoplayAudio?: boolean

  @prop({ default: () => [] }) isManual?: (
    | 'level'
    | 'username'
    | 'voiceId'
    | 'autoplayAudio'
  )[]

  @prop({ default: 1 }) levelMin?: number
}

export const UserModel = getModelForClass(User, {
  schemaOptions: { timestamps: true },
})

@index({ english: 'text', description: 'text' })
class Entry {
  @prop({ default: () => nanoid() }) _id?: string

  @prop({ index: true }) userId?: string

  @prop({
    index: true,
    default: () => [],
  })
  sharedId?: string[]

  @prop({
    index: true,
    validate: (it: string[]) =>
      Array.isArray(it) &&
      it.length > 0 &&
      it.every((el) => typeof el === 'string'),
  })
  entry!: string[]

  @prop({
    index: true,
    default: () => [],
  })
  segments!: string[]

  @prop({ index: true, default: () => [] }) reading!: {
    type?: string // 'kunyomi' | 'onyomi' | 'nanori'
    kana: string
    hidden?: boolean
  }[]

  @prop({
    default: () => [],
  })
  english!: string[]

  @prop() audio?: Record<string, string>

  @prop({ index: true }) level?: number
  @prop({ index: true }) type!: string // 'character' | 'vocabulary' | 'sentence'
  @prop({ index: true }) source?: string
  @prop({ default: '' }) description!: string
  @prop({ index: true, default: () => [] }) tag!: string[]
  @prop({ index: true }) frequency?: number
}

export const EntryModel = getModelForClass(Entry, {
  schemaOptions: { timestamps: true },
})

@index({ entry: 1, type: 1, direction: 1 }, { unique: true })
class Quiz {
  @prop({ default: () => nanoid() }) _id!: string

  @prop({ required: true, index: true }) userId!: string

  @prop({ required: true }) entry!: string
  @prop({
    required: true,
    validate: (v: string) =>
      ['character', 'vocabulary', 'sentence'].includes(v),
  })
  type!: string // 'character' | 'vocabulary' | 'sentence'
  @prop({ required: true }) direction!: string // 'je' | 'ej'

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

@index({ description: 'text' })
class Library {
  @prop({ default: () => nanoid() }) _id?: string
  @prop({ index: true }) userId?: string

  @prop({
    index: true,
    default: () => [],
  })
  sharedId?: string[]

  @prop({ required: true }) title!: string
  @prop({
    index: true,
    validate: (it: string[]) =>
      Array.isArray(it) &&
      it.length > 0 &&
      it.every((el) => typeof el === 'string'),
  })
  entries!: string[]
  @prop({
    required: true,
    validate: (v: string) =>
      ['character', 'vocabulary', 'sentence'].includes(v),
  })
  type!: string // 'character' | 'vocabulary' | 'sentence'

  @prop({ default: () => [], index: true }) tag!: string[]
  @prop({ default: '' }) description!: string
}

export const LibraryModel = getModelForClass(Library, {
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
