import { defineAsyncComponent } from 'vue'
import type { Component } from 'vue'

export const tabComponentRegistry: Record<string, Component> = {
  DashboardWorkspace: defineAsyncComponent(() => import('../workspaces/DashboardWorkspace.vue')),
  CustomersListWorkspace: defineAsyncComponent(() => import('../workspaces/CustomersListWorkspace.vue')),
  CustomerFormWorkspace: defineAsyncComponent(() => import('../workspaces/CustomerFormWorkspace.vue')),
  VendorsListWorkspace: defineAsyncComponent(() => import('../workspaces/VendorsListWorkspace.vue')),
  VendorFormWorkspace: defineAsyncComponent(() => import('../workspaces/VendorFormWorkspace.vue')),
  ProductsListWorkspace: defineAsyncComponent(() => import('../workspaces/ProductsListWorkspace.vue')),
  ProductFormWorkspace: defineAsyncComponent(() => import('../workspaces/ProductFormWorkspace.vue')),
  WarehousesListWorkspace: defineAsyncComponent(() => import('../workspaces/WarehousesListWorkspace.vue')),
  WarehouseFormWorkspace: defineAsyncComponent(() => import('../workspaces/WarehouseFormWorkspace.vue')),
  SalesInvoiceListWorkspace: defineAsyncComponent(
    () => import('../workspaces/SalesInvoiceListWorkspace.vue'),
  ),
  SalesInvoiceFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/SalesInvoiceFormWorkspace.vue'),
  ),
}
