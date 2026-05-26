// API client for Food Service Management Backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type UserRole = 'ADMIN' | 'MANAGER' | 'WAITER' | 'COOK';
export type TableStatus = 'FREE' | 'RESERVED' | 'OCCUPIED';
export type OrderStatus = 'NEW' | 'COOKING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentType = 'CASH' | 'CARD' | 'QR';
export type EstablishmentType = 'RESTAURANT' | 'CAFE' | 'CANTEEN' | 'COFFEE_SHOP' | 'BAKERY' | 'FAST_FOOD' | 'PUB' | 'OTHER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  establishmentId?: string;
  createdAt: string;
}

export interface Establishment {
  id: string;
  name: string;
  type: EstablishmentType;
  address: string;
  phone: string;
  createdAt: string;
}

export const ESTABLISHMENT_TYPES = [
  { value: 'RESTAURANT' as const, label: 'Ресторан', icon: '🍽️', description: 'Полноценный ресторан с залами и столами' },
  { value: 'CAFE' as const, label: 'Кафе', icon: '☕', description: 'Уютное кафе с небольшим меню' },
  { value: 'CANTEEN' as const, label: 'Столовая', icon: '🍲', description: 'Столовая с комплексными обедами' },
  { value: 'COFFEE_SHOP' as const, label: 'Кофейня', icon: '☕', description: 'Кофейня с десертами и напитками' },
  { value: 'BAKERY' as const, label: 'Пекарня', icon: '🥐', description: 'Пекарня с выпечкой и хлебом' },
  { value: 'FAST_FOOD' as const, label: 'Фастфуд', icon: '🍔', description: 'Быстрое питание' },
  { value: 'PUB' as const, label: 'Бар/Паб', icon: '🍺', description: 'Бар с закусками и напитками' },
  { value: 'OTHER' as const, label: 'Другое', icon: '🏪', description: 'Другой тип заведения' },
];

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  _count?: { menuItems: number };
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string | null;
  imageUrl: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
  category?: MenuCategory;
}

export interface Order {
  id: string;
  tableId: string | null;
  waiterId: string | null;
  status: OrderStatus;
  notes: string;
  total: number;
  paymentType?: PaymentType;
  paid: boolean;
  createdAt: string;
  updatedAt: string;
  table?: Table;
  waiter?: User;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  notes: string;
  createdAt: string;
  menuItem?: MenuItem;
}

export interface Reservation {
  id: string;
  tableId: string | null;
  customerName: string;
  customerPhone: string;
  reservedAt: string;
  partySize: number;
  notes: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  table?: Table;
  user?: User;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  fullName: string;
  role?: UserRole;
}

// API Client class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(data.token);
    return data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const { fullName, role, ...credentials } = data;
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...credentials, fullName, role }),
    });
    this.setToken(response.token);
    return response;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  logout() {
    this.setToken(null);
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(data: Partial<User> & { password: string }): Promise<{ user: User }> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<{ user: User }> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return this.request<Table[]>('/tables');
  }

  async createTable(data: Partial<Table>): Promise<{ table: Table }> {
    return this.request('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTable(id: string, data: Partial<Table>): Promise<{ table: Table }> {
    return this.request(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTable(id: string): Promise<{ message: string }> {
    return this.request(`/tables/${id}`, { method: 'DELETE' });
  }

  async getTableStats(): Promise<any> {
    return this.request('/tables/stats');
  }

  // Menu
  async getCategories(): Promise<MenuCategory[]> {
    return this.request<MenuCategory[]>('/menu/categories');
  }

  async createCategory(data: Partial<MenuCategory>): Promise<{ category: MenuCategory }> {
    return this.request('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: Partial<MenuCategory>): Promise<{ category: MenuCategory }> {
    return this.request(`/menu/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    return this.request(`/menu/categories/${id}`, { method: 'DELETE' });
  }

  async getMenuItems(available?: boolean, categoryId?: string): Promise<MenuItem[]> {
    let query = '/menu/items';
    const params = new URLSearchParams();
    if (available !== undefined) params.append('available', String(available));
    if (categoryId) params.append('categoryId', categoryId);
    if (params.toString()) query += `?${params.toString()}`;
    return this.request<MenuItem[]>(query);
  }

  async createMenuItem(data: Partial<MenuItem>): Promise<{ menuItem: MenuItem }> {
    return this.request('/menu/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(id: string, data: Partial<MenuItem>): Promise<{ menuItem: MenuItem }> {
    return this.request(`/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuItem(id: string): Promise<{ message: string }> {
    return this.request(`/menu/items/${id}`, { method: 'DELETE' });
  }

  // Orders
  async getOrders(status?: string, limit?: number): Promise<Order[]> {
    let query = '/orders';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', String(limit));
    if (params.toString()) query += `?${params.toString()}`;
    return this.request<Order[]>(query);
  }

  async createOrder(data: Partial<Order> & { items: any[] }): Promise<{ order: Order }> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async updateOrderStatus(id: string, data: { status?: string; paymentType?: string }): Promise<{ order: Order }> {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getDashboardStats(): Promise<any> {
    return this.request('/orders/stats');
  }

  // Reservations
  async getReservations(status?: string): Promise<Reservation[]> {
    let query = '/reservations';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (params.toString()) query += `?${params.toString()}`;
    return this.request<Reservation[]>(query);
  }

  async getTodayReservations(): Promise<Reservation[]> {
    return this.request<Reservation[]>('/reservations/today');
  }

  async createReservation(data: Partial<Reservation>): Promise<{ reservation: Reservation }> {
    return this.request('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReservation(id: string, data: Partial<Reservation>): Promise<{ reservation: Reservation }> {
    return this.request(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReservation(id: string): Promise<{ message: string }> {
    return this.request(`/reservations/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
