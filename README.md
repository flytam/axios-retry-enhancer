## axios-retry-enhancer

Retry your http request easily when you need

#### Installation

```bash
npm install axios-retry-enhancer
```

#### Usage

```ts
import axiosRetryEnhancer from 'axios-retry-enhancer'
import axios from 'axios'

const client = axios.create()
axiosRetryEnhancer(client, {
  // same options with axios-retry. See https://github.com/softonic/axios-retry#options
})

interface Result<T = unknown> {
  code: number
  data: T
}

client.get<Result>('http://example.com/test', {
  retry: {
    // The request will retry when the code isn't 0 even the http code is 200
    shouldRetry: (res: Result) => res.code !== 0,
  },
})
```

#### The difference with axios-retry

`axios-retry` only can retry the request when the request fail. But sometimes there are some conditions that we decide to retry even the request success. `axios-retry-enhancer` wrap the `axios-retry` so that it support all the feature provided by `axios-retry`

#### Testing

```bash
npm run test
```

#### Relation

[axios-retry](https://github.com/softonic/axios-retry)
