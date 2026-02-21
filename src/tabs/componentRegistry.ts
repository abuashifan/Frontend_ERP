import { defineAsyncComponent } from 'vue'
import type { Component } from 'vue'

export const tabComponentRegistry: Record<string, Component> = {
  DashboardWorkspace: defineAsyncComponent(() => import('../workspaces/DashboardWorkspace.vue')),
  PlaceholderWorkspace: defineAsyncComponent(() => import('../workspaces/PlaceholderWorkspace.vue')),
  CompanySettingsWorkspace: defineAsyncComponent(
    () => import('../workspaces/CompanySettingsWorkspace.vue'),
  ),
  ChartOfAccountsListWorkspace: defineAsyncComponent(
    () => import('../workspaces/ChartOfAccountsListWorkspace.vue'),
  ),
  ChartOfAccountFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/ChartOfAccountFormWorkspace.vue'),
  ),
  JournalFormWorkspace: defineAsyncComponent(() => import('../workspaces/JournalFormWorkspace.vue')),
  JournalsListWorkspace: defineAsyncComponent(() => import('../workspaces/JournalsListWorkspace.vue')),
  CustomersListWorkspace: defineAsyncComponent(() => import('../workspaces/CustomersListWorkspace.vue')),
  CustomerFormWorkspace: defineAsyncComponent(() => import('../workspaces/CustomerFormWorkspace.vue')),
  VendorsListWorkspace: defineAsyncComponent(() => import('../workspaces/VendorsListWorkspace.vue')),
  VendorFormWorkspace: defineAsyncComponent(() => import('../workspaces/VendorFormWorkspace.vue')),
  ProductsListWorkspace: defineAsyncComponent(() => import('../workspaces/ProductsListWorkspace.vue')),
  ProductDetailWorkspace: defineAsyncComponent(() => import('../workspaces/ProductDetailWorkspace.vue')),
  ProductSerialsListWorkspace: defineAsyncComponent(
    () => import('../workspaces/ProductSerialsListWorkspace.vue'),
  ),
  ProductFormWorkspace: defineAsyncComponent(() => import('../workspaces/ProductFormWorkspace.vue')),
  ProductCategoriesListWorkspace: defineAsyncComponent(
    () => import('../workspaces/ProductCategoriesListWorkspace.vue'),
  ),
  ProductCategoryFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/ProductCategoryFormWorkspace.vue'),
  ),
  WarehousesListWorkspace: defineAsyncComponent(() => import('../workspaces/WarehousesListWorkspace.vue')),
  WarehouseFormWorkspace: defineAsyncComponent(() => import('../workspaces/WarehouseFormWorkspace.vue')),
  SalesInvoiceListWorkspace: defineAsyncComponent(
    () => import('../workspaces/SalesInvoiceListWorkspace.vue'),
  ),
  SalesInvoiceFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/SalesInvoiceFormWorkspace.vue'),
  ),
  PurchaseOrdersListWorkspace: defineAsyncComponent(
    () => import('../workspaces/PurchaseOrdersListWorkspace.vue'),
  ),
  PurchaseOrderFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/PurchaseOrderFormWorkspace.vue'),
  ),
  VendorInvoicesListWorkspace: defineAsyncComponent(
    () => import('../workspaces/VendorInvoicesListWorkspace.vue'),
  ),
  VendorInvoiceFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/VendorInvoiceFormWorkspace.vue'),
  ),
  CustomerPaymentsListWorkspace: defineAsyncComponent(
    () => import('../workspaces/CustomerPaymentsListWorkspace.vue'),
  ),
  CustomerPaymentFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/CustomerPaymentFormWorkspace.vue'),
  ),

  SalesReturnsListWorkspace: defineAsyncComponent(
    () => import('../workspaces/SalesReturnsListWorkspace.vue'),
  ),
  SalesReturnFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/SalesReturnFormWorkspace.vue'),
  ),

  VendorPaymentsListWorkspace: defineAsyncComponent(
    () => import('../workspaces/VendorPaymentsListWorkspace.vue'),
  ),
  VendorPaymentFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/VendorPaymentFormWorkspace.vue'),
  ),

  PurchaseReturnsListWorkspace: defineAsyncComponent(
    () => import('../workspaces/PurchaseReturnsListWorkspace.vue'),
  ),
  PurchaseReturnFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/PurchaseReturnFormWorkspace.vue'),
  ),

  InventoryMovementsListWorkspace: defineAsyncComponent(
    () => import('../workspaces/InventoryMovementsListWorkspace.vue'),
  ),
  InventoryMovementFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/InventoryMovementFormWorkspace.vue'),
  ),

  InventoryReceivingsListWorkspace: defineAsyncComponent(
    () => import('../workspaces/InventoryReceivingsListWorkspace.vue'),
  ),
  InventoryReceivingFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/InventoryReceivingFormWorkspace.vue'),
  ),

  WarehouseTransfersListWorkspace: defineAsyncComponent(
    () => import('../workspaces/WarehouseTransfersListWorkspace.vue'),
  ),
  WarehouseTransferFormWorkspace: defineAsyncComponent(
    () => import('../workspaces/WarehouseTransferFormWorkspace.vue'),
  ),
}
