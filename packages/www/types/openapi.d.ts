import {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios'; 

declare namespace Paths {
  namespace CharacterGetOne {
    namespace Parameters {
      export type Entry = string;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
    }
    namespace Responses {
      export interface $200 {
        sub: string[];
        sup: string[];
        var: string[];
        reading: {
          type?: string;
          kana: string;
        }[];
        english: string[];
      }
    }
  }
  namespace CharacterQuery {
    namespace Parameters {
      export type Limit = number;
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
      limit?: Parameters.Limit;
    }
    namespace Responses {
      export interface $200 {
        result: string[];
      }
    }
  }
  namespace CharacterRandom {
    namespace Responses {
      export interface $200 {
        result: string;
        english: string;
        level: number;
      }
    }
  }
  namespace ExtraQuery {
    namespace Parameters {
      export type Limit = number;
      export type Page = number;
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
      page?: Parameters.Page;
      limit?: Parameters.Limit;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string[];
          reading: {
            type?: string;
            kana: string;
          }[];
          english: string[];
        }[];
      }
    }
  }
  namespace SentenceGetOne {
    namespace Parameters {
      export type Entry = string;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
    }
    namespace Responses {
      export interface $200 {
        ja: string;
        en: string;
      }
    }
  }
  namespace SentenceQuery {
    namespace Parameters {
      export type Limit = number;
      export type Page = number;
      export type Q = string;
    }
    export interface QueryParameters {
      q?: Parameters.Q;
      limit?: Parameters.Limit;
      page?: Parameters.Page;
    }
    namespace Responses {
      export interface $200 {
        result: {
          ja: string;
          en: string;
        }[];
      }
    }
  }
  namespace SentenceRandom {
    namespace Responses {
      export interface $200 {
        result: string;
        english: string;
        level: number;
      }
    }
  }
  namespace UtilReading {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
    namespace Responses {
      export interface $200 {
        result: string;
      }
    }
  }
  namespace UtilSpeak {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
  }
  namespace UtilTokenize {
    namespace Parameters {
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
    }
    namespace Responses {
      export interface $200 {
        result: {
          [name: string]: any;
          surface_form: string;
        }[];
      }
    }
  }
  namespace VocabularyGetOne {
    namespace Parameters {
      export type Entry = string;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
    }
    namespace Responses {
      export interface $200 {
        entry: string[];
        reading: {
          type?: string;
          kana: string;
        }[];
        english: string[];
      }
    }
  }
  namespace VocabularyQuery {
    namespace Parameters {
      export type Limit = number;
      export type Q = string;
    }
    export interface QueryParameters {
      q: Parameters.Q;
      limit?: Parameters.Limit;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string[];
          reading: {
            type?: string;
            kana: string;
          }[];
          english: string[];
        }[];
      }
    }
  }
  namespace VocabularyRandom {
    namespace Responses {
      export interface $200 {
        result: string;
        english: string;
        level: number;
      }
    }
  }
}

export interface OperationMethods {
  /**
   * settings
   */
  'settings'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * characterGetOne
   */
  'characterGetOne'(
    parameters?: Parameters<Paths.CharacterGetOne.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterGetOne.Responses.$200>
  /**
   * characterQuery
   */
  'characterQuery'(
    parameters?: Parameters<Paths.CharacterQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterQuery.Responses.$200>
  /**
   * characterRandom
   */
  'characterRandom'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterRandom.Responses.$200>
  /**
   * extraQuery
   */
  'extraQuery'(
    parameters?: Parameters<Paths.ExtraQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.ExtraQuery.Responses.$200>
  /**
   * sentenceGetOne
   */
  'sentenceGetOne'(
    parameters?: Parameters<Paths.SentenceGetOne.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.SentenceGetOne.Responses.$200>
  /**
   * sentenceQuery
   */
  'sentenceQuery'(
    parameters?: Parameters<Paths.SentenceQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.SentenceQuery.Responses.$200>
  /**
   * sentenceRandom
   */
  'sentenceRandom'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.SentenceRandom.Responses.$200>
  /**
   * utilTokenize
   */
  'utilTokenize'(
    parameters?: Parameters<Paths.UtilTokenize.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UtilTokenize.Responses.$200>
  /**
   * utilReading
   */
  'utilReading'(
    parameters?: Parameters<Paths.UtilReading.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UtilReading.Responses.$200>
  /**
   * utilSpeak
   */
  'utilSpeak'(
    parameters?: Parameters<Paths.UtilSpeak.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<any>
  /**
   * vocabularyGetOne
   */
  'vocabularyGetOne'(
    parameters?: Parameters<Paths.VocabularyGetOne.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.VocabularyGetOne.Responses.$200>
  /**
   * vocabularyQuery
   */
  'vocabularyQuery'(
    parameters?: Parameters<Paths.VocabularyQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.VocabularyQuery.Responses.$200>
  /**
   * vocabularyRandom
   */
  'vocabularyRandom'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.VocabularyRandom.Responses.$200>
}

export interface PathsDictionary {
  ['/api/settings']: {
    /**
     * settings
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/api/character/']: {
    /**
     * characterGetOne
     */
    'get'(
      parameters?: Parameters<Paths.CharacterGetOne.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterGetOne.Responses.$200>
  }
  ['/api/character/q']: {
    /**
     * characterQuery
     */
    'get'(
      parameters?: Parameters<Paths.CharacterQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterQuery.Responses.$200>
  }
  ['/api/character/random']: {
    /**
     * characterRandom
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterRandom.Responses.$200>
  }
  ['/api/extra/q']: {
    /**
     * extraQuery
     */
    'get'(
      parameters?: Parameters<Paths.ExtraQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.ExtraQuery.Responses.$200>
  }
  ['/api/sentence/']: {
    /**
     * sentenceGetOne
     */
    'get'(
      parameters?: Parameters<Paths.SentenceGetOne.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.SentenceGetOne.Responses.$200>
  }
  ['/api/sentence/q']: {
    /**
     * sentenceQuery
     */
    'get'(
      parameters?: Parameters<Paths.SentenceQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.SentenceQuery.Responses.$200>
  }
  ['/api/sentence/random']: {
    /**
     * sentenceRandom
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.SentenceRandom.Responses.$200>
  }
  ['/api/util/tokenize']: {
    /**
     * utilTokenize
     */
    'get'(
      parameters?: Parameters<Paths.UtilTokenize.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UtilTokenize.Responses.$200>
  }
  ['/api/util/reading']: {
    /**
     * utilReading
     */
    'get'(
      parameters?: Parameters<Paths.UtilReading.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UtilReading.Responses.$200>
  }
  ['/api/util/speak']: {
    /**
     * utilSpeak
     */
    'get'(
      parameters?: Parameters<Paths.UtilSpeak.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<any>
  }
  ['/api/vocabulary/']: {
    /**
     * vocabularyGetOne
     */
    'get'(
      parameters?: Parameters<Paths.VocabularyGetOne.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.VocabularyGetOne.Responses.$200>
  }
  ['/api/vocabulary/q']: {
    /**
     * vocabularyQuery
     */
    'get'(
      parameters?: Parameters<Paths.VocabularyQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.VocabularyQuery.Responses.$200>
  }
  ['/api/vocabulary/random']: {
    /**
     * vocabularyRandom
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.VocabularyRandom.Responses.$200>
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>
