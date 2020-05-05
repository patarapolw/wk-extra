import axios from 'axios'

export const wkApi = axios.create({
  baseURL: 'https://api.wanikani.com/v2/',
  headers: {
    Authorization: `Bearer ${process.env.WANIKANI_API_KEY}`
  }
})

export interface IResource<T = any> {
  id: number
  integer: string
  url: string
  data_updated_at: string // Date
  data: T
}

export interface ICollection<T = any> {
  object: string
  url: string
  pages: {
    next_url?: string
    previous_url?: string
    per_page: number
  }
  total_count: number
  data_updated_at: string // Date
  data: T[]
}

export interface IError {
  error: string
  code: number
}
