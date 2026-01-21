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

  {
    id: 'customers',
    title: 'Customers',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Customers',
      component: 'CustomersListWorkspace',
      closable: false,
    },
  },

  {
    id: 'vendors',
    title: 'Vendors',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Vendors',
      component: 'VendorsListWorkspace',
      closable: false,
    },
  },

  {
    id: 'products',
    title: 'Products',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Products',
      component: 'ProductsListWorkspace',
      closable: false,
    },
  },

  {
    id: 'warehouses',
    title: 'Warehouses',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Warehouses',
      component: 'WarehousesListWorkspace',
      closable: false,
    },
  },

  {
    id: 'sales-invoices',
    title: 'Sales Invoices',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Sales Invoices',
      component: 'SalesInvoiceListWorkspace',
      closable: false,
    },
  },
]
