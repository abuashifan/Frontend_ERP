export type ModuleTabId = string

// Local ID within a module, e.g. 'list', 'invoice-INV-001'
export type ChildTabLocalId = string

// Globally unique ID for a child tab instance, used for KeepAlive keys + dirty tracking
export type ChildTabId = string

export type VirtualTabComponentKey = string

export type ChildTab = {
  id: ChildTabId
  localId: ChildTabLocalId
  title: string
  component: VirtualTabComponentKey
  props?: Record<string, unknown>
  dirty: boolean
  closable: boolean
  openedAt: number
  lastAccessedAt: number
}

export type ModuleTab = {
  id: ModuleTabId
  title: string
  closable: boolean
  showSubTabsBar: boolean
  openedAt: number
  lastAccessedAt: number

  tabs: ChildTab[]
  activeChildTabId: ChildTabId | null
}

export type OpenModulePayload = {
  id: ModuleTabId
  title: string
  closable?: boolean
  showSubTabsBar?: boolean
  defaultChild: OpenChildTabPayload
}

export type OpenChildTabPayload = {
  localId: ChildTabLocalId
  title: string
  component: VirtualTabComponentKey
  props?: Record<string, unknown>
  closable?: boolean
}
