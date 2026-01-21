import { defineAsyncComponent } from 'vue'
import type { Component } from 'vue'

export const tabComponentRegistry: Record<string, Component> = {
  DashboardWorkspace: defineAsyncComponent(() => import('../workspaces/DashboardWorkspace.vue')),
  CustomersListWorkspace: defineAsyncComponent(() => import('../workspaces/CustomersListWorkspace.vue')),
  VendorsListWorkspace: defineAsyncComponent(() => import('../workspaces/VendorsListWorkspace.vue')),
  ProductsListWorkspace: defineAsyncComponent(() => import('../workspaces/ProductsListWorkspace.vue')),
  WarehousesListWorkspace: defineAsyncComponent(() => import('../workspaces/WarehousesListWorkspace.vue')),
  SalesInvoiceListWorkspace: defineAsyncComponent(
    () => import('../workspaces/SalesInvoiceListWorkspace.vue'),
  ),
  SalesInvoiceFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/SalesInvoiceFormWorkspace.vue'),
  ),
}
