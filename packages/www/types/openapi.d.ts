import {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios'; 

declare namespace Paths {
  namespace BrowseGetOne {
    namespace Parameters {
      export type Entry = string;
      export type Type = "character" | "vocabulary" | "sentence";
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
      type: Parameters.Type;
    }
    namespace Responses {
      export interface $200 {
        entry: string;
        alt: string[];
        reading: {
          type?: string;
          kana: string;
        }[];
        english: string[];
      }
    }
  }
  namespace BrowseQuery {
    namespace Parameters {
      export type All = boolean;
      export type Limit = number;
      export type Page = number;
      export type Q = string;
      export type Type = "character" | "vocabulary" | "sentence";
    }
    export interface QueryParameters {
      q: Parameters.Q;
      page?: Parameters.Page;
      limit?: Parameters.Limit;
      all?: Parameters.All;
      type?: Parameters.Type;
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
          type: string;
          source?: string;
        }[];
      }
    }
  }
  namespace BrowseRandom {
    namespace Parameters {
      export type Type = "character" | "vocabulary" | "sentence";
    }
    export interface QueryParameters {
      type: Parameters.Type;
    }
    namespace Responses {
      export interface $200 {
        result: string;
        english: string;
        level: number;
      }
    }
  }
  namespace CharacterRadical {
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
      }
    }
  }
  namespace CharacterSentence {
    namespace Parameters {
      export type Entry = string;
      export type Limit = number;
      export type Page = number;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
      limit?: Parameters.Limit;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string;
          english: string;
        }[];
      }
    }
  }
  namespace CharacterVocabulary {
    namespace Parameters {
      export type Entry = string;
      export type Limit = number;
    }
    export interface QueryParameters {
      entry: Parameters.Entry;
      limit?: Parameters.Limit;
    }
    namespace Responses {
      export interface $200 {
        result: {
          entry: string;
        }[];
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
   * browseGetOne
   */
  'browseGetOne'(
    parameters?: Parameters<Paths.BrowseGetOne.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.BrowseGetOne.Responses.$200>
  /**
   * browseQuery
   */
  'browseQuery'(
    parameters?: Parameters<Paths.BrowseQuery.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.BrowseQuery.Responses.$200>
  /**
   * browseRandom
   */
  'browseRandom'(
    parameters?: Parameters<Paths.BrowseRandom.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.BrowseRandom.Responses.$200>
  /**
   * characterRadical
   */
  'characterRadical'(
    parameters?: Parameters<Paths.CharacterRadical.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterRadical.Responses.$200>
  /**
   * characterVocabulary
   */
  'characterVocabulary'(
    parameters?: Parameters<Paths.CharacterVocabulary.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterVocabulary.Responses.$200>
  /**
   * characterSentence
   */
  'characterSentence'(
    parameters?: Parameters<Paths.CharacterSentence.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterSentence.Responses.$200>
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
   * characterSentence
   */
  'characterSentence'(
    parameters?: Parameters<Paths.CharacterSentence.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CharacterSentence.Responses.$200>
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
  ['/api/browse/']: {
    /**
     * browseGetOne
     */
    'get'(
      parameters?: Parameters<Paths.BrowseGetOne.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.BrowseGetOne.Responses.$200>
  }
  ['/api/browse/q']: {
    /**
     * browseQuery
     */
    'get'(
      parameters?: Parameters<Paths.BrowseQuery.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.BrowseQuery.Responses.$200>
  }
  ['/api/browse/random']: {
    /**
     * browseRandom
     */
    'get'(
      parameters?: Parameters<Paths.BrowseRandom.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.BrowseRandom.Responses.$200>
  }
  ['/api/character/radical']: {
    /**
     * characterRadical
     */
    'get'(
      parameters?: Parameters<Paths.CharacterRadical.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterRadical.Responses.$200>
  }
  ['/api/character/vocabulary']: {
    /**
     * characterVocabulary
     */
    'get'(
      parameters?: Parameters<Paths.CharacterVocabulary.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterVocabulary.Responses.$200>
  }
  ['/api/character/sentence']: {
    /**
     * characterSentence
     */
    'get'(
      parameters?: Parameters<Paths.CharacterSentence.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterSentence.Responses.$200>
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
  ['/api/vocabulary/sentence']: {
    /**
     * characterSentence
     */
    'get'(
      parameters?: Parameters<Paths.CharacterSentence.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CharacterSentence.Responses.$200>
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>
