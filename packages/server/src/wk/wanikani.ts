/* eslint-disable camelcase */
import axios, { AxiosInstance } from 'axios'
import rateLimit from 'axios-rate-limit'

export const wkApi = rateLimit(
  axios.create({
    baseURL: 'https://api.wanikani.com/v2/',
    headers: {
      Authorization: `Bearer ${process.env.WANIKANI_API_KEY}`,
    },
    validateStatus: function () {
      return true
    },
  }),
  /**
   * https://docs.api.wanikani.com/20170710/#rate-limit
   * Requests per minute	60
   */
  {
    /**
     * Per second
     */
    maxRequests: 1,
    perMilliseconds: 1000,
  }
) as AxiosInstance

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
