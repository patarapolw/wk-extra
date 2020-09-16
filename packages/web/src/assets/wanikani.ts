import axios from 'axios'

export const wk = {
  axios: axios.create({
    baseURL: 'https://api.wanikani.com/v2/'
  }),
  setApiKey (apiKey: string) {
    this.axios.defaults.headers = this.axios.defaults.headers || {}
    this.axios.defaults.headers.Authorization = `Bearer ${apiKey}`
  },
  unsetApiKey () {
    delete this.axios.defaults.headers.Authorization
  },
  getApiKey () {
    if (this.axios.defaults.headers?.Authorization) {
      return this.axios.defaults.headers.Authorization.split(' ')[1]
    }

    return null
  },
  validateApiKey (s: string) {
    const hex = '[0-9a-f]'
    return new RegExp(`^${hex}{8}-${hex}{4}-${hex}{4}-${hex}{4}-${hex}{12}$`).test(s)
  },
  async getUser (apiKey: string) {
    return (await this.axios.get<Omit<WkResource<{
      id: string;
      username: string;
      level: number;
      subscription: {
        // active: boolean;
        max_level_granted: number;
      };
    }>, 'id'>>('/user', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })).data
  }
}

export const wkMaxLevel = 60

export interface WkResource<T> {
  id: number;
  url: string;
  data_updated_at: string; // Date
  data: T;
}

export interface WkCollection<T> {
  object: string;
  url: string;
  pages: {
    next_url?: string;
    previous_url?: string;
    per_page: number;
  };
  total_count: number;
  data_updated_at: string; // Date
  data: T[];
}

export interface WkError {
  error: string;
  code: number;
}
