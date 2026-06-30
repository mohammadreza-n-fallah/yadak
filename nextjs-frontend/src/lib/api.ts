import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fully clear the session: tokens AND the persisted auth store. Without this
// the store can stay `isAuthenticated: true` while the token is gone, so every
// request 401s with "Authentication credentials were not provided". The dynamic
// import avoids a circular dependency (store/* imports this module).
async function forceLogout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  try {
    const { useAuthStore } = await import('@/store/auth');
    useAuthStore.getState().logout();
  } catch { /* store unavailable (SSR) */ }
}

// Auto-refresh token on 401, and log out cleanly when the session is truly gone.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          await forceLogout();
        }
      } else {
        // 401 with no refresh token → the session is invalid; reset auth state
        // so the UI shows /login instead of looping on tokenless requests.
        await forceLogout();
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth
export const authApi = {
  register: (data: object) => api.post('/auth/register/', data),
  login: (username: string, password: string) => api.post('/auth/login/', { username, password }),
  googleLogin: (credential: string) => api.post('/auth/google/', { credential }),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data: object) => api.patch('/auth/profile/', data),
  changePassword: (data: object) => api.post('/auth/change-password/', data),
  addresses: () => api.get('/auth/addresses/'),
  addAddress: (data: object) => api.post('/auth/addresses/', data),
  updateAddress: (id: number, data: object) => api.patch(`/auth/addresses/${id}/`, data),
  deleteAddress: (id: number) => api.delete(`/auth/addresses/${id}/`),
};

// ── Vehicles
export const vehiclesApi = {
  brands: () => api.get('/vehicles/brands/'),
  models: (brandId: number) => api.get(`/vehicles/brands/${brandId}/models/`),
  trims: (modelId: number) => api.get(`/vehicles/models/${modelId}/trims/`),
};

// ── Shop
export const shopApi = {
  homepage: () => api.get('/shop/'),
  categories: () => api.get('/shop/categories/'),
  brands: () => api.get('/shop/brands/'),
  products: (params?: object) => api.get('/shop/products/', { params }),
  product: (slug: string) => api.get(`/shop/products/${slug}/`),
  addReview: (slug: string, data: object) => api.post(`/shop/products/${slug}/reviews/`, data),
  wishlist: () => api.get('/shop/wishlist/'),
  toggleWishlist: (productId: number) => api.post('/shop/wishlist/', { product_id: productId }),
  banners: () => api.get('/shop/banners/'),
};

// ── Orders / Cart
export const cartApi = {
  get: () => api.get('/orders/cart/'),
  add: (productId: number, quantity: number) => api.post('/orders/cart/', { product_id: productId, quantity }),
  remove: (productId: number) => api.delete('/orders/cart/', { data: { product_id: productId } }),
  clear: () => api.delete('/orders/cart/clear/'),
  checkout: (data: object) => api.post('/orders/checkout/', data),
  orders: () => api.get('/orders/'),
  order: (orderNumber: string) => api.get(`/orders/${orderNumber}/`),
  track: (orderNumber: string, phone: string) =>
    api.get('/orders/track/', { params: { order_number: orderNumber, phone } }),
};

// ── Blog
export const blogApi = {
  posts: (params?: object) => api.get('/blog/', { params }),
  post: (slug: string) => api.get(`/blog/${slug}/`),
  categories: () => api.get('/blog/categories/'),
};

// ── Core
export const coreApi = {
  subscribe: (email: string) => api.post('/newsletter/', { email }),
  contact: (data: object) => api.post('/contact/', data),
  settings: () => api.get('/settings/'),
};

// ── AI Support Chatbot
export const supportApi = {
  config: () => api.get('/support/config/'),
  faqs: () => api.get('/support/faqs/'),
  history: (sessionKey: string) => api.get('/support/history/', { params: { session_key: sessionKey } }),
  chat: (message: string, sessionKey: string) => api.post('/support/chat/', { message, session_key: sessionKey }),
};

// ── Voice Call Center
export const callcenterApi = {
  start: (data: object = {}) => api.post('/callcenter/calls/start/', data),
  turn: (sessionKey: string, text: string) => api.post('/callcenter/calls/turn/', { session_key: sessionKey, text }),
  end: (sessionKey: string, data: object = {}) => api.post('/callcenter/calls/end/', { session_key: sessionKey, ...data }),
  callback: (data: object) => api.post('/callcenter/callback/', data),
  // staff
  stats: () => api.get('/callcenter/admin/stats/'),
  calls: (params?: object) => api.get('/callcenter/admin/calls/', { params }),
  call: (id: number) => api.get(`/callcenter/admin/calls/${id}/`),
  updateCall: (id: number, data: object) => api.patch(`/callcenter/admin/calls/${id}/`, data),
  callbacks: (params?: object) => api.get('/callcenter/admin/callbacks/', { params }),
  updateCallback: (id: number, data: object) => api.patch(`/callcenter/admin/callbacks/${id}/`, data),
};

export interface StreamHandlers {
  onStart?: (sessionKey: string) => void;
  onDelta?: (chunk: string) => void;
  onDone?: (sessionKey: string) => void;
  onError?: (message: string) => void;
}

/**
 * Stream a support reply via Server-Sent Events. Falls back gracefully:
 * the caller should catch a throw (network / unsupported) and use supportApi.chat().
 */
export async function streamSupport(
  message: string,
  sessionKey: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/support/chat/stream/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_key: sessionKey }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep).trim();
      buffer = buffer.slice(sep + 2);
      if (!frame.startsWith('data:')) continue;
      try {
        const evt = JSON.parse(frame.slice(5).trim());
        if (evt.type === 'start') handlers.onStart?.(evt.session_key);
        else if (evt.type === 'delta') handlers.onDelta?.(evt.content);
        else if (evt.type === 'done') handlers.onDone?.(evt.session_key);
        else if (evt.type === 'error') handlers.onError?.(evt.content);
      } catch {
        /* ignore malformed/partial frame */
      }
    }
  }
}

// ── Admin Panel
export const adminApi = {
  stats: () => api.get('/admin-panel/stats/'),

  // Categories
  categories: (params?: object) => api.get('/admin-panel/categories/', { params }),
  category: (id: number) => api.get(`/admin-panel/categories/${id}/`),
  createCategory: (data: FormData) => api.post('/admin-panel/categories/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id: number, data: FormData | object) => api.patch(`/admin-panel/categories/${id}/`, data, { headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' } }),
  deleteCategory: (id: number) => api.delete(`/admin-panel/categories/${id}/`),

  // Brands
  brands: (params?: object) => api.get('/admin-panel/brands/', { params }),
  brand: (id: number) => api.get(`/admin-panel/brands/${id}/`),
  createBrand: (data: FormData) => api.post('/admin-panel/brands/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBrand: (id: number, data: FormData | object) => api.patch(`/admin-panel/brands/${id}/`, data, { headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' } }),
  deleteBrand: (id: number) => api.delete(`/admin-panel/brands/${id}/`),

  // Products
  products: (params?: object) => api.get('/admin-panel/products/', { params }),
  product: (id: number) => api.get(`/admin-panel/products/${id}/`),
  createProduct: (data: object) => api.post('/admin-panel/products/', data),
  updateProduct: (id: number, data: object) => api.patch(`/admin-panel/products/${id}/`, data),
  deleteProduct: (id: number) => api.delete(`/admin-panel/products/${id}/`),
  uploadProductImage: (id: number, data: FormData) => api.post(`/admin-panel/products/${id}/images/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  setMainProductImage: (id: number, imageId: number) => api.patch(`/admin-panel/products/${id}/images/`, { image_id: imageId }),
  deleteProductImage: (id: number, imageId: number) => api.delete(`/admin-panel/products/${id}/images/`, { data: { image_id: imageId } }),

  // Orders
  orders: (params?: object) => api.get('/admin-panel/orders/', { params }),
  order: (id: number) => api.get(`/admin-panel/orders/${id}/`),
  updateOrder: (id: number, data: object) => api.patch(`/admin-panel/orders/${id}/`, data),

  // Users
  users: (params?: object) => api.get('/admin-panel/users/', { params }),
  user: (id: number) => api.get(`/admin-panel/users/${id}/`),
  updateUser: (id: number, data: object) => api.patch(`/admin-panel/users/${id}/`, data),

  // Blog
  posts: (params?: object) => api.get('/admin-panel/posts/', { params }),
  post: (id: number) => api.get(`/admin-panel/posts/${id}/`),
  createPost: (data: FormData) => api.post('/admin-panel/posts/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (id: number, data: FormData | object) => api.patch(`/admin-panel/posts/${id}/`, data, { headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' } }),
  deletePost: (id: number) => api.delete(`/admin-panel/posts/${id}/`),
  postCategories: () => api.get('/admin-panel/post-categories/'),
  createPostCategory: (data: object) => api.post('/admin-panel/post-categories/', data),

  // Banners
  banners: () => api.get('/admin-panel/banners/'),
  createBanner: (data: FormData) => api.post('/admin-panel/banners/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBanner: (id: number, data: FormData | object) => api.patch(`/admin-panel/banners/${id}/`, data, { headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' } }),
  deleteBanner: (id: number) => api.delete(`/admin-panel/banners/${id}/`),

  // Reviews
  reviews: (params?: object) => api.get('/admin-panel/reviews/', { params }),
  approveReview: (id: number, approved: boolean) => api.patch(`/admin-panel/reviews/${id}/`, { is_approved: approved }),
  deleteReview: (id: number) => api.delete(`/admin-panel/reviews/${id}/delete/`),
};

export const mediaUrl = (path: string | null | undefined) => {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path.replace(/https?:\/\/(127\.0\.0\.1|localhost):8000/, API_BASE);
  return `${API_BASE}${path}`;
};

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('fa-IR').format(price) + ' ریال';
