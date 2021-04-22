export interface Executor {
  <T>(
    action: {
      index : string,
      type? : string,
      id?   : string,
      op?   : string,
      body? : unknown
    },
    options: ClientOptions
  ): Promise<T>
}

export const DEFAULT_EXECUTOR: Executor = async <T>(
  action: {
    index : string,
    type? : string,
    id?   : string,
    op?   : string,
    body? : unknown
  },
  options: ClientOptions
): Promise <T> => {
  const path = [ action.index, action.type, action.id, action.op ].filter(i => i).join('/')
  const url = `${options.node}/${path}`
  const result = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(action.body)
  })
  if (!result.ok) {
    throw new Error(await result.text())
  }
  return result.json()
}

export class Client {
  clientOptions: ClientOptions
  _exec: Executor

  constructor(options: ClientOptions) {
    this.clientOptions = options
    this._exec = options.executor || DEFAULT_EXECUTOR
  }

  search<T>(options: {
    index: string,
    type?: string,
    body: unknown
  }): Promise<SearchResult<T>> {
    return this._exec({ ...options, op: '_search' }, this.clientOptions)
  }

  get<T>(options: {
    index: string,
    type: string,
    id: string
  }): Promise<Hit<T>> {
    return this._exec(options, this.clientOptions)
  }
}

export interface ClientOptions {
  node: string
  executor?: Executor
}

export interface SearchResult<T> {
  hits: {
    total: number,
    hits: Hit<T>[]
  }
}

export interface Hit<T> {
  _index: string
  _type: string
  _id: string
  _version: number
  '_seq_no': number
  '_primary_term': number
  found: boolean
  _source: T
}
