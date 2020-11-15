import nock from 'nock'
import axios, { AxiosError, AxiosInstance } from 'axios'

import axiosRetryEnhancer from '../src'

interface Result<T = unknown> {
  code: number
  data: T
}

function setupResponses(
  client: AxiosInstance,
  responses: (() => nock.Scope)[]
) {
  const configureResponse = () => {
    const response = responses.shift()
    if (response) {
      response()
    }
  }
  client.interceptors.response.use(
    (result) => {
      configureResponse()
      return result
    },
    (error) => {
      configureResponse()
      return Promise.reject(error)
    }
  )
  configureResponse()
}

describe('axiosRetryEnhancer', () => {
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
  test('success ', (done) => {
    const client = axios.create()
    setupResponses(client, [
      () => nock('http://example.com').get('/test').reply(200, { code: 0 }),
    ])

    axiosRetryEnhancer(client)

    client
      .get<Result>('http://example.com/test', {
        retry: {
          shouldRetry: (res: Result) => res.code !== 0,
        },
      })
      .then((res) => {
        expect(res.data.code).toBe(0)
        expect(res.status).toBe(200)
        done()
      })
  })

  test('http code 200: first unexpect;second expect', (done) => {
    const client = axios.create()

    setupResponses(client, [
      () =>
        nock('http://example.com')
          .get('/test')
          .reply(200, { code: 1, data: null }),
      () =>
        nock('http://example.com')
          .get('/test')
          .reply(200, { code: 0, data: 'good' }),
    ])

    axiosRetryEnhancer(client)

    client
      .get<Result>('http://example.com/test', {
        retry: {
          shouldRetry: (res: Result) => res.code !== 0,
        },
      })
      .then((res) => {
        expect(res.data.code).toBe(0)
        expect(res.data.data).toBe('good')
        expect(res.status).toBe(200)
        done()
      })
  })

  test('http code 200: first unexpect;second unexpect;third unexpect;fourth error', (done) => {
    const client = axios.create()

    setupResponses(client, [
      () =>
        nock('http://example.com')
          .get('/test')
          .reply(200, { code: 1, data: null }),
      () =>
        nock('http://example.com')
          .get('/test')
          .reply(200, { code: 1, data: null }),
      () =>
        nock('http://example.com')
          .get('/test')
          .reply(200, { code: 1, data: null }),
      () =>
        nock('http://example.com')
          .get('/test')
          .reply(200, { code: 1, data: null }),
    ])

    axiosRetryEnhancer(client)

    client
      .get<Result>('http://example.com/test', {
        retry: {
          shouldRetry: (res: Result) => res.code !== 0,
        },
      })
      .then(
        // @ts-ignore
        (res, reject) => {
          reject('err')
        },
        (e: AxiosError) => {
          expect(e.response.data.code).toBe(1)
          done()
        }
      )
  })
})
