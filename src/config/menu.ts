export type MenuItemConfig = {
  id: string
  title: string
  closable?: boolean
  showSubTabsBar?: boolean
  defaultChild: {
    localId: string
    title: string
    component: string
    props?: Record<string, unknown>
    closable?: boolean
  }
}

// Sidebar menu configuration.
// Rule: menu click opens/activates a module tab (router must not drive tab lifecycle).
export const MENU_ITEMS: MenuItemConfig[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    closable: false,
    showSubTabsBar: false,
    defaultChild: {
      localId: 'home',
      title: 'Dashboard',
      component: 'DashboardWorkspace',
      closable: false,
    },
  },

  // Temporary duplicates to test module tab ordering (open order vs menu order).
  ...Array.from({ length: 5 }, (_, i) => {
    const n = i + 1
    const title = n === 1 ? 'Sales Invoices' : `Sales Invoices (${n})`

    return {
      id: `sales-invoices-${n}`,
      title,
      showSubTabsBar: true,
      defaultChild: {
        localId: 'list',
        title,
        component: 'SalesInvoiceListWorkspace',
        closable: false,
      },
    } satisfies MenuItemConfig
  }),
]
