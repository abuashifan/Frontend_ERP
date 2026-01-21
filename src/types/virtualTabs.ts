export type VirtualTabId = string

export type VirtualTabComponentKey = string

export type VirtualTab = {
  id: VirtualTabId
  title: string
  component: VirtualTabComponentKey
  props?: Record<string, unknown>
  dirty: boolean
  closable: boolean
  openedAt: number
  lastAccessedAt: number
}

export type OpenTabPayload = {
  id: VirtualTabId
  title: string
  component: VirtualTabComponentKey
  props?: Record<string, unknown>
  closable?: boolean
}
