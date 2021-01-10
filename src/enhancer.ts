import { AxiosInstance, AxiosStatic } from 'axios'
import axiosRetry, { IAxiosRetryConfig } from 'axios-retry'
import createError from 'axios/lib/core/createError'

declare module 'axios' {
  export interface AxiosRequestConfig {
    retry?: {
      /**
       * whether to retry
       */
      needRetry?: boolean
      /**
       * whether to retry fn
       */
      shouldRetry?: (res: any) => boolean
    }
  }
}

const namespace = 'retry'

const enhancer = (
  instance: AxiosStatic | AxiosInstance,
  config: IAxiosRetryConfig = {}
) => {
  instance.interceptors.response.use((response) => {
    const { data, config, request } = response

    if (config?.[namespace]?.shouldRetry?.(data)) {
      config[namespace].needRetry = true
      return Promise.reject(
        createError(
          `Axios retry enhance error`,
          config,
          null,
          request,
          response
        )
      )
    }
    return response
  })
  axiosRetry(instance, {
    ...config,
    retryCondition: (error) => {
      const {
        retryCondition = axiosRetry.isNetworkOrIdempotentRequestError,
      } = config
      return retryCondition(error) || error.config?.[namespace]?.needRetry
    },
  })
}

export default enhancer
