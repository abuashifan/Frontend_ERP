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
    id: 'company-settings',
    title: 'Company Settings',
    showSubTabsBar: false,
    defaultChild: {
      localId: 'main',
      title: 'Company Settings',
      component: 'CompanySettingsWorkspace',
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
    id: 'product-categories',
    title: 'Product Categories',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Product Categories',
      component: 'ProductCategoriesListWorkspace',
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
    id: 'coa',
    title: 'Chart of Accounts',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Chart of Accounts',
      component: 'PlaceholderWorkspace',
      props: {
        title: 'Chart of Accounts',
        description: 'Planned: COA list/detail (read-only) for Phase 7.2.',
      },
      closable: false,
    },
  },

  {
    id: 'journals',
    title: 'Journals',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Journals',
      component: 'JournalsListWorkspace',
      closable: false,
    },
  },

  {
    id: 'accounting-periods',
    title: 'Accounting Periods',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Accounting Periods',
      component: 'PlaceholderWorkspace',
      props: {
        title: 'Accounting Periods',
        description: 'Planned: period list + close/open actions (later).',
      },
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

  {
    id: 'customer-payments',
    title: 'Customer Payments',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Customer Payments',
      component: 'CustomerPaymentsListWorkspace',
      closable: false,
    },
  },

  {
    id: 'sales-returns',
    title: 'Sales Returns',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Sales Returns',
      component: 'SalesReturnsListWorkspace',
      closable: false,
    },
  },

  {
    id: 'purchase-orders',
    title: 'Purchase Orders',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Purchase Orders',
      component: 'PurchaseOrdersListWorkspace',
      closable: false,
    },
  },

  {
    id: 'vendor-invoices',
    title: 'Vendor Invoices',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Vendor Invoices',
      component: 'VendorInvoicesListWorkspace',
      closable: false,
    },
  },

  {
    id: 'vendor-payments',
    title: 'Vendor Payments',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Vendor Payments',
      component: 'VendorPaymentsListWorkspace',
      closable: false,
    },
  },

  {
    id: 'purchase-returns',
    title: 'Purchase Returns',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Purchase Returns',
      component: 'PurchaseReturnsListWorkspace',
      closable: false,
    },
  },

  {
    id: 'inventory-movements',
    title: 'Inventory Movements',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Inventory Movements',
      component: 'InventoryMovementsListWorkspace',
      closable: false,
    },
  },

  {
    id: 'inventory-receivings',
    title: 'Inventory Receivings',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Inventory Receivings',
      component: 'InventoryReceivingsListWorkspace',
      closable: false,
    },
  },

  {
    id: 'warehouse-transfers',
    title: 'Warehouse Transfers',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'list',
      title: 'Warehouse Transfers',
      component: 'WarehouseTransfersListWorkspace',
      closable: false,
    },
  },

  {
    id: 'reports',
    title: 'Reports',
    showSubTabsBar: true,
    defaultChild: {
      localId: 'home',
      title: 'Reports',
      component: 'PlaceholderWorkspace',
      props: {
        title: 'Reports',
        description: 'Planned: Trial Balance, P&L, Balance Sheet, Budget reports.',
      },
      closable: false,
    },
  },

  {
    id: 'admin-settings',
    title: 'Admin Settings',
    showSubTabsBar: false,
    defaultChild: {
      localId: 'settings',
      title: 'Admin Settings',
      component: 'PlaceholderWorkspace',
      props: {
        title: 'Admin Settings',
        description: 'Planned: settings UI for budget control and system flags.',
      },
      closable: false,
    },
  },
]
