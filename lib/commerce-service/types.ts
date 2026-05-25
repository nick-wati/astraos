export type CommerceServiceTenant = {
  id: string;
  externalTenantId?: string;
  name: string;
  plan: string;
  region: string;
  defaultCurrency: string;
  storeProvider: "shopify" | "woocommerce" | "custom" | "unknown";
  catalogFreshnessAt?: Date;
};

export type CommerceOrder = {
  id: string;
  externalOrderId?: string;
  tenantId: string;
  customerId: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
  currency: string;
  value: number;
  itemCount: number;
  createdAt: Date;
  fulfilledAt?: Date;
};

export type CommerceCartEvent = {
  id: string;
  tenantId: string;
  customerId: string;
  cartId: string;
  status: "active" | "abandoned" | "recovered" | "expired";
  value: number;
  itemCount: number;
  lastActivityAt: Date;
  productIds: string[];
};

export type CommerceProduct = {
  id: string;
  externalProductId?: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  inventoryAvailable: number;
  marginBand: "low" | "medium" | "high";
};

export type CommerceCustomerSegment = {
  id: string;
  name: string;
  estimatedCustomers: number;
  purchaseSignals: string[];
  consentStatus: "eligible" | "partial" | "blocked";
};

export type CommerceContextRequest = {
  tenantId: string;
  objective: "cart_recovery" | "repeat_purchase" | "order_update" | "product_recommendation";
  windowDays?: number;
};

export type CommerceContext = {
  tenant: CommerceServiceTenant;
  recentOrders: CommerceOrder[];
  cartEvents: CommerceCartEvent[];
  products: CommerceProduct[];
  segments: CommerceCustomerSegment[];
};

export type CommerceMessageDraftRequest = {
  tenantId: string;
  requestId: string;
  customerSegmentId?: string;
  cartId?: string;
  productIds?: string[];
  templateBody: string;
  sendAt?: Date;
};

export type CommerceMessageDraftResponse = {
  draftMessageId: string;
  status: "draft_created" | "needs_review" | "failed";
  message: string;
};

export interface CommerceServicePort {
  name: string;
  getCommerceContext(request: CommerceContextRequest): Promise<CommerceContext>;
  listOrders(request: CommerceContextRequest): Promise<CommerceOrder[]>;
  getOrder(tenantId: string, orderId: string): Promise<CommerceOrder | null>;
  listCartEvents(request: CommerceContextRequest): Promise<CommerceCartEvent[]>;
  listProductCatalog(tenantId: string): Promise<CommerceProduct[]>;
  listInventory(tenantId: string, productIds?: string[]): Promise<CommerceProduct[]>;
  listCustomerSegments(request: CommerceContextRequest): Promise<CommerceCustomerSegment[]>;
  createMessageDraft?(request: CommerceMessageDraftRequest): Promise<CommerceMessageDraftResponse>;
}

export const COMMERCE_MCP_TOOLS = [
  "commerce.get_context",
  "commerce.list_orders",
  "commerce.get_order",
  "commerce.list_cart_events",
  "commerce.list_browse_events",
  "commerce.list_product_catalog",
  "commerce.list_inventory",
  "commerce.list_customer_segments",
  "commerce.get_customer_profile",
  "commerce.create_offer",
  "commerce.create_message_draft",
  "commerce.get_conversion_events",
  "commerce.record_conversion"
] as const;
