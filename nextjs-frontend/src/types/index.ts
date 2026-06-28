export interface VehicleBrand { id: number; name: string; slug: string; logo: string | null; }
export interface VehicleModel { id: number; name: string; slug: string; brand: number; }
export interface VehicleTrim { id: number; name: string; year_from: number | null; year_to: number | null; model: number; }

export interface Category {
  id: number; name: string; slug: string; image: string | null;
  description: string; parent: number | null; children: Category[];
  product_count?: number;
}

export interface Brand { id: number; name: string; slug: string; logo: string | null; }

export interface ProductImage { id: number; image: string; alt: string; is_main: boolean; order: number; }

export interface Product {
  id: number; name: string; slug: string; part_number: string;
  price: number; sale_price: number | null; effective_price: number;
  discount_percent: number; stock: number; is_in_stock: boolean;
  badge: string; main_image: ProductImage | null;
  average_rating: number; review_count: number;
  category_name: string; category_slug?: string;
  brand_name: string; brand_slug?: string;
  is_featured: boolean;
  description?: string; short_description?: string;
  images?: ProductImage[];
  reviews?: ProductReview[];
  compatible_vehicles?: VehicleTrim[];
}

export interface ProductReview {
  id: number; author_name: string; rating: number;
  title: string; body: string; created_at: string;
}

export interface CartItem {
  id: number; product: Product; quantity: number; subtotal: number;
}

export interface Cart {
  id: number; items: CartItem[]; total_price: number; total_items: number;
}

export interface Order {
  id: number; order_number: string; status: string; status_display: string;
  payment_status: string; payment_status_display: string;
  shipping_full_name: string; shipping_phone: string;
  shipping_province: string; shipping_city: string;
  shipping_address: string; shipping_postal_code: string;
  subtotal: number; shipping_cost: number; discount_amount: number; total: number;
  note: string; tracking_code: string; created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number; product_name: string; product_part_number: string;
  unit_price: number; quantity: number; subtotal: number;
}

export interface Post {
  id: number; title: string; slug: string; excerpt: string;
  image: string | null; author_name: string; category_name: string;
  published_at: string; views: number;
}

export interface PostDetail extends Post {
  body: string; category: { id: number; name: string; slug: string; };
}

export interface User {
  id: number; username: string; email: string;
  first_name: string; last_name: string; phone: string;
  birth_date: string | null; avatar: string | null;
  is_staff?: boolean;
}

export interface Address {
  id: number; user: number; full_name: string; phone: string;
  province: string; city: string; address: string;
  postal_code: string; is_default: boolean;
}

export interface SiteSettings {
  site_name: string; phone: string; email: string;
  address: string; working_hours: string;
  instagram: string; telegram: string; whatsapp: string;
  footer_text: string;
}

export interface PaginatedResponse<T> {
  count: number; next: string | null; previous: string | null; results: T[];
}

export interface Banner {
  id: number; title: string; subtitle: string; image: string; link: string;
}

export interface HomepageData {
  featured_products: Product[];
  on_sale_products: Product[];
  new_arrivals: Product[];
  categories: Category[];
  brands: Brand[];
  banners: Banner[];
  recent_posts: Post[];
}

export interface SupportConfig {
  enabled: boolean;
  ai_powered: boolean;
  bot_name: string;
  greeting: string;
  suggestions: string[];
}

export interface CallTurn {
  role: 'caller' | 'agent';
  role_display: string;
  text: string;
  created_at: string;
}

export interface Call {
  id: number;
  session_key: string;
  caller_name: string;
  caller_phone: string;
  status: string;
  status_display: string;
  ai_powered: boolean;
  rating: number | null;
  turn_count: number;
  user_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  summary?: string;
  staff_note?: string;
  turns?: CallTurn[];
}

export interface CallbackRequest {
  id: number;
  name: string;
  phone: string;
  topic: string;
  message: string;
  status: string;
  status_display: string;
  agent_note: string;
  call_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CallStats {
  active_calls: number;
  calls_today: number;
  total_calls: number;
  pending_callbacks: number;
  avg_duration: number;
}
