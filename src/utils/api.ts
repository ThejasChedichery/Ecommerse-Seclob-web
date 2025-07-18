import axios from 'axios';
import { store } from '../store';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch({ type: 'auth/logout' });
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/user/login', credentials);
    return response.data;
  },
  
  register: async (userData: { userName: string; email: string; password: string; role?: string }) => {
    const response = await api.post('/user/register', userData);
    return response.data;
  },
};

// Category API functions
export const categoryAPI = {
  createCategory: async (categoryData: { name: string; description: string }) => {
    const response = await api.post('/category', categoryData);
    return response.data;
  },
  
  getAllCategories: async () => {
    const response = await api.get('/category');
    return response.data;
  },
  
  getCategoryById: async (id: string) => {
    const response = await api.get(`/category/${id}`);
    return response.data;
  },
};

// SubCategory API functions
export const subCategoryAPI = {
  createSubCategory: async (subCategoryData: { name: string; description: string; categoryId: string }) => {
    const response = await api.post('/subCategory', subCategoryData);
    return response.data;
  },
  
  getAllSubCategories: async () => {
    const response = await api.get('/subCategory');
    return response.data;
  },
  
  getSubCategoriesByCategory: async (categoryId: string) => {
    const response = await api.get(`/subCategory/${categoryId}`);
    return response.data;
  },
};

// Product API functions
export const productAPI = {
  createProduct: async (productData: {
    name: string;
    description: string;
    subCategoryId: string;
    variants: Array<{ ram: string; price: number; quantity: number }>;
    images: string[];
  }) => {
    const response = await api.post('/product', productData);
    return response.data;
  },
  
  getAllProducts: async (filters?: {
    search?: string;
    category?: string;
    subCategory?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.subCategory) params.append('subCategory', filters.subCategory);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `/product?${params.toString()}`;

    
    const response = await api.get(url);
    return response.data;
  },
  
  getProductById: async (id: string) => {
    const response = await api.get(`/product/${id}`);
    return response.data;
  },
  
  updateProduct: async (id: string, productData: any) => {
    const response = await api.put(`/product/${id}`, productData);
    return response.data;
  },
};

// Wishlist API functions
export const wishlistAPI = {
  addToWishlist: async (wishlistData: { userId: string; productId: string }) => {
    const response = await api.post('/wishlist', wishlistData);
    return response.data;
  },
  
  getWishlistByUser: async (userId: string) => {
    const response = await api.get(`/wishlist/${userId}`);
    return response.data;
  },
  
  removeFromWishlist: async (userId: string, productId: string) => {
    const response = await api.delete(`/wishlist/${userId}/${productId}`);
    return response.data;
  },
};

export default api;