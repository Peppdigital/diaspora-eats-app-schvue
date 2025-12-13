
// Database Types for Jambalaya x Jerk x Jollof App

export type DiasporaSegment = 
  | "African American" 
  | "Caribbean" 
  | "African" 
  | "Pan-African" 
  | "Other";

export type UserRole = "customer" | "vendor" | "admin";

export type VendorType = "restaurant" | "grocery";

export type OnboardingStatus = "pending" | "invited" | "claimed" | "active";

export type PriceLevel = "$" | "$$" | "$$$";

export type OrderStatus = 
  | "pending" 
  | "accepted" 
  | "in_progress" 
  | "ready_for_pickup" 
  | "out_for_delivery" 
  | "completed" 
  | "cancelled";

export type OrderType = "pickup" | "delivery";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type SpicyLevel = "None" | "Mild" | "Medium" | "Hot" | "Extra Hot";

// ========================================
// USER
// ========================================
export interface User {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  diaspora_segment: DiasporaSegment[];
  favorite_cuisines: string[];
  default_location_state?: string;
  default_location_city?: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// VENDOR
// ========================================
export interface Vendor {
  id: string;
  owner_user_id: string;
  vendor_type: VendorType;
  name: string;
  tagline: string;
  description: string;
  diaspora_focus: DiasporaSegment[];
  cuisines: string[];
  phone: string;
  email: string;
  website_url?: string;
  instagram_handle?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  onboarding_status: OnboardingStatus;
  created_by_admin: boolean;
  logo_image?: string;
  cover_image?: string;
  opening_hours?: string; // JSON string
  offers_dine_in: boolean;
  offers_pickup: boolean;
  offers_delivery: boolean;
  delivery_partners: string[];
  min_order_amount?: number;
  avg_price_level: PriceLevel;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

// ========================================
// VENDOR INVITE CODES
// ========================================
export interface VendorInviteCode {
  id: string;
  vendor_id: string;
  invite_code: string;
  email_sent_to: string;
  is_used: boolean;
  expires_at?: string;
  created_at: string;
  used_at?: string;
}

// ========================================
// MENU CATEGORIES
// ========================================
export interface MenuCategory {
  id: string;
  vendor_id: string;
  name: string;
  sort_order: number;
}

// ========================================
// MENU ITEMS
// ========================================
export interface MenuItem {
  id: string;
  vendor_id: string;
  category_id: string;
  name: string;
  description: string;
  diaspora_segment_tag: DiasporaSegment;
  cuisine_tag: string;
  price: number;
  is_available: boolean;
  is_highlighted: boolean;
  item_image?: string;
  spicy_level: SpicyLevel;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================
// ORDERS
// ========================================
export interface Order {
  id: string;
  customer_id: string;
  vendor_id: string;
  order_number: string;
  order_status: OrderStatus;
  order_type: OrderType;
  subtotal_amount: number;
  tax_amount: number;
  delivery_fee: number;
  service_fee: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_provider?: string;
  payment_reference_id?: string;
  delivery_address_line1?: string;
  delivery_address_line2?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  delivery_instructions?: string;
  placed_at: string;
  updated_at: string;
  estimated_ready_time?: string;
  estimated_delivery_time?: string;
}

// ========================================
// ORDER ITEMS
// ========================================
export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  special_instructions?: string;
}

// ========================================
// REVIEWS
// ========================================
export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  vendor_id: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

// ========================================
// STATES AND CITIES
// ========================================
export interface StateAndCity {
  id: string;
  state_code: string;
  state_name: string;
  city_name: string;
  is_major_city: boolean;
  sort_order: number;
}

// ========================================
// HELPER TYPES
// ========================================
export interface VendorWithDetails extends Vendor {
  menu_categories?: MenuCategory[];
  menu_items?: MenuItem[];
  reviews?: Review[];
}

export interface OrderWithDetails extends Order {
  order_items?: OrderItem[];
  vendor?: Vendor;
  customer?: User;
}
