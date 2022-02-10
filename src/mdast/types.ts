import type Token from 'markdown-it/lib/token'

export type { Token }

export type GenericText = {
  type: string
  value: string
}

export type GenericNode = {
  type: string
  children?: GenericNode[]
  value?: string
}

export type Spec = {
  type: string
  getAttrs?: (token: Token, tokens: Token[], index: number) => Record<string, any>
  attrs?: Record<string, any>
  noCloseToken?: boolean
  isText?: boolean
  isLeaf?: boolean
}
