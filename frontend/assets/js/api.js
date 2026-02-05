/**
 * API Configuration Module
 * 
 * This module provides a centralized API client for the Salon/Spa Management System.
 * It handles authentication, request/response formatting, and provides methods for all API endpoints.
 * 
 * @module api
 * @version 1.0.0
 */

// API base configuration
const api = {
  /**
   * Base URL for all API requests
   * @type {string}
   */
  baseURL: window.location.origin + '/api',

  /**
   * Get authentication token from localStorage
   * @returns {string|null} The JWT token or null if not found
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Store authentication token in localStorage
   * @param {string} token - JWT token to store
   */
  setToken(token) {
    localStorage.setItem('token', token);
  },

  /**
   * Remove authentication token from localStorage
   */
  removeToken() {
    localStorage.removeItem('token');
  },

  /**
   * Make an API request with automatic error handling
   * 
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options (method, headers, body, etc.)
   * @returns {Promise<any>} Promise resolving to response data
   * @throws {Error} If request fails or returns error
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const debug = (typeof window !== 'undefined' && (window.DEBUG_API === true)) || (localStorage.getItem('debugApi') === 'true');
    
    // Handle query parameters for GET requests
    let url = `${this.baseURL}${endpoint}`;
    
    // If there's a body for GET request, convert it to query params
    if ((options.method === 'GET' || !options.method) && options.body) {
      try {
        const params = new URLSearchParams(JSON.parse(options.body)).toString();
        url += (url.includes('?') ? '&' : '?') + params;
        delete options.body; // Remove body for GET request
      } catch (e) {
        console.warn('Could not parse body as JSON for GET request');
      }
    }

    const defaultOptions = {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    
    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      defaultOptions.headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      if (debug) {
        let bodyPreview = undefined;
        if (config.body) {
          try { bodyPreview = JSON.parse(config.body); } catch (_) { bodyPreview = config.body; }
        }
        console.log('[API Request]', (config.method || 'GET'), url, bodyPreview);
      }
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      if (debug) {
        console.log('[API Response]', response.status, url, (contentType && contentType.includes('application/json')) ? data : '[non-json]');
      }
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (debug) console.error('[API Error]', url, error.message);
      console.error('API Error:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  },

  /**
   * Build URL with query parameters
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} filters - Query parameters object
   * @returns {string} Full URL with query string
   */
  buildUrl(endpoint, filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  },

  // ============================================
  // AUTHENTICATION MODULE
  // ============================================
  /**
   * Authentication API endpoints
   */
  auth: {
    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data and token
     */
    login(email, password) {
      return api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },

    /**
     * Logout user
     * @returns {Promise<Object>} Success message
     */
    logout() {
      return api.request('/auth/logout', { method: 'POST' });
    },

    /**
     * Get current user profile
     * @returns {Promise<Object>} User profile data
     */
    getProfile() {
      return api.request('/auth/profile');
    },

    /**
     * Update user profile
     * @param {Object} data - Profile data to update
     * @returns {Promise<Object>} Updated profile
     */
    updateProfile(data) {
      return api.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  // ============================================
  // DASHBOARD MODULE
  // ============================================
  /**
   * Dashboard API endpoints
   */
  dashboard: {
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} Dashboard stats
     */
    getStats() {
      return api.request('/dashboard/stats');
    }
  },

  // ============================================
  // CUSTOMERS MODULE
  // ============================================
  /**
   * Customer management API endpoints
   */
  customers: {
    /**
     * Get all customers with optional filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} List of customers
     */
    getAll(filters = {}) {
      const url = api.buildUrl('/customers', filters);
      return api.request(url);
    },

    /**
     * Get customer by ID
     * @param {number} id - Customer ID
     * @returns {Promise<Object>} Customer data
     */
    getById(id) {
      return api.request(`/customers/${id}`);
    },

    /**
     * Create new customer
     * @param {Object} data - Customer data
     * @returns {Promise<Object>} Created customer
     */
    create(data) {
      return api.request('/customers', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update customer
     * @param {number} id - Customer ID
     * @param {Object} data - Updated customer data
     * @returns {Promise<Object>} Updated customer
     */
    update(id, data) {
      return api.request(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Delete customer
     * @param {number} id - Customer ID
     * @returns {Promise<Object>} Success message
     */
    delete(id) {
      return api.request(`/customers/${id}`, { method: 'DELETE' });
    },

    /**
     * Search customers by name or phone
     * @param {string} query - Search query
     * @returns {Promise<Array>} Search results
     */
    search(query) {
      return api.request(`/customers/search?q=${encodeURIComponent(query)}`);
    }
  },

  // ============================================
  // SERVICES MODULE
  // ============================================
  /**
   * Services management API endpoints
   */
  services: {
    // ====================
    // BASIC SERVICES
    // ====================
    /**
     * Get all services with optional filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} List of services
     */
    getAll(filters = {}) {
      const url = api.buildUrl('/services', filters);
      return api.request(url);
    },
    
    /**
     * Get service by ID
     * @param {number} id - Service ID
     * @returns {Promise<Object>} Service data
     */
    getById(id) {
      return api.request(`/services/${id}`);
    },

    /**
     * Create new service
     * @param {Object} data - Service data
     * @returns {Promise<Object>} Created service
     */
    create(data) {
      return api.request('/services', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update service
     * @param {number} id - Service ID
     * @param {Object} data - Updated service data
     * @returns {Promise<Object>} Updated service
     */
    update(id, data) {
      return api.request(`/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Delete service
     * @param {number} id - Service ID
     * @returns {Promise<Object>} Success message
     */
    delete(id) {
      return api.request(`/services/${id}`, { method: 'DELETE' });
    },

    /**
     * Get services by category
     * @param {number} categoryId - Category ID
     * @returns {Promise<Array>} Services in category
     */
    getByCategory(categoryId) {
      return api.request(`/services/category/${categoryId}`);
    },

    // ====================
    // CATEGORIES
    // ====================
    /**
     * Get categories tree (main and sub categories)
     * @returns {Promise<Object>} Categories tree structure
     */
    getCategoriesTree() {
      return api.request('/services/categories/tree');
    },

    /**
     * Get main categories only
     * @returns {Promise<Array>} List of main categories
     */
    getMainCategories() {
      return api.request('/services/categories/main');
    },

    /**
     * Get sub-categories by parent ID
     * @param {number|null} parentId - Parent category ID
     * @returns {Promise<Array>} List of sub-categories
     */
    getSubCategories(parentId = null) {
      const url = parentId 
        ? `/services/categories/sub?parentId=${parentId}`
        : '/services/categories/sub';
      return api.request(url);
    },

    /**
     * Create new category
     * @param {Object} data - Category data
     * @returns {Promise<Object>} Created category
     */
    createCategory(data) {
      return api.request('/services/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update category
     * @param {number} id - Category ID
     * @param {Object} data - Updated category data
     * @returns {Promise<Object>} Updated category
     */
    updateCategory(id, data) {
      return api.request(`/services/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Delete category
     * @param {number} id - Category ID
     * @returns {Promise<Object>} Success message
     */
    deleteCategory(id) {
      return api.request(`/services/categories/${id}`, { method: 'DELETE' });
    },

    // ====================
    // ROOMS
    // ====================
    /**
     * Get all rooms
     * @returns {Promise<Array>} List of rooms
     */
    getRooms() {
  return api.request('/services/rooms');
},

    /**
     * Get room by ID
     * @param {number} id - Room ID
     * @returns {Promise<Object>} Room data
     */
    getRoomById(id) {
      return api.request(`/services/rooms/${id}`);
    },

    /**
     * Create new room
     * @param {Object} data - Room data
     * @returns {Promise<Object>} Created room
     */
    createRoom(data) {
      return api.request('/services/rooms', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update room
     * @param {number} id - Room ID
     * @param {Object} data - Updated room data
     * @returns {Promise<Object>} Updated room
     */
    updateRoom(id, data) {
      return api.request(`/services/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Delete room
     * @param {number} id - Room ID
     * @returns {Promise<Object>} Success message
     */
    deleteRoom(id) {
      return api.request(`/services/rooms/${id}`, { method: 'DELETE' });
    },

    /**
     * Get suitable rooms for a service
     * @param {number} serviceId - Service ID
     * @returns {Promise<Array>} List of suitable rooms
     */
    getSuitableRooms(serviceId) {
      return api.request(`/services/rooms/suitable/${serviceId}`);
    },

    // ====================
    // COMBOS
    // ====================
    /**
     * Get all service combos
     * @returns {Promise<Array>} List of combos
     */
    getCombos() {
      return api.request('/services/combos/all')
        .catch(error => {
          console.log('Combos endpoint not available:', error.message);
          return []; // Return empty array if endpoint fails
        });
    },

    /**
     * Get combo by ID
     * @param {number} id - Combo ID
     * @returns {Promise<Object>} Combo data
     */
    getComboById(id) {
      return api.request(`/services/combos/${id}`);
    },

    /**
     * Create new combo
     * @param {Object} data - Combo data
     * @returns {Promise<Object>} Created combo
     */
    createCombo(data) {
      return api.request('/services/combos', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update combo
     * @param {number} id - Combo ID
     * @param {Object} data - Updated combo data
     * @returns {Promise<Object>} Updated combo
     */
    updateCombo(id, data) {
      return api.request(`/services/combos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Delete combo
     * @param {number} id - Combo ID
     * @returns {Promise<Object>} Success message
     */
    deleteCombo(id) {
      return api.request(`/services/combos/${id}`, { method: 'DELETE' });
    },

    /**
     * Toggle combo active status
     * @param {number} id - Combo ID
     * @param {boolean} status - New status
     * @returns {Promise<Object>} Success message
     */
    toggleComboStatus(id, status) {
      return api.request(`/services/combos/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: status })
      });
    }
  },

  // ============================================
  // BOOKINGS MODULE (UPDATED)
  // ============================================
  /**
   * Bookings management API endpoints
   */
  bookings: {
    /**
     * Get all bookings with optional filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} List of bookings
     */
    getAll(filters = {}) {
      const url = api.buildUrl('/bookings', filters);
      return api.request(url);
    },

    /**
     * Get booking by ID
     * @param {number} id - Booking ID
     * @returns {Promise<Object>} Booking data with items
     */
    getById(id) {
      return api.request(`/bookings/${id}`);
    },

    /**
     * Create new booking
     * @param {Object} data - Booking data including items array
     * @returns {Promise<Object>} Created booking with ID
     */
    create(data) {
      return api.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update booking
     * @param {number} id - Booking ID
     * @param {Object} data - Updated booking data
     * @returns {Promise<Object>} Updated booking
     */
    update(id, data) {
      return api.request(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update booking status
     * @param {number} id - Booking ID
     * @param {string} status - New status (pending, confirmed, in_progress, completed, cancelled)
     * @returns {Promise<Object>} Success message
     */
    updateStatus(id, status) {
      return api.request(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    /**
     * Delete booking
     * @param {number} id - Booking ID
     * @returns {Promise<Object>} Success message
     */
    delete(id) {
      return api.request(`/bookings/${id}`, { method: 'DELETE' });
    },

    /**
     * Check time slot availability
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} time - Time in HH:MM format
     * @param {number} duration - Duration in minutes
     * @returns {Promise<Object>} Availability status
     */
    checkAvailability(date, time, duration) {
      const params = new URLSearchParams({
        date,
        time,
        duration: duration.toString()
      });
      return api.request(`/bookings/check-availability?${params.toString()}`);
    },

    /**
     * Get available time slots for a date
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {number} duration - Duration in minutes (default: 60)
     * @returns {Promise<Object>} Available slots
     */
    getAvailableSlots(date, duration = 60) {
      const params = new URLSearchParams({
        date,
        duration: duration.toString()
      });
      return api.request(`/bookings/available-slots?${params.toString()}`);
    },

    /**
     * Get booking dashboard statistics
     * @returns {Promise<Object>} Dashboard stats
     */
    stats() {
      return api.request('/bookings/stats');
    },

    /**
     * Customer search for bookings
     * @param {string} query - Search query (phone or name)
     * @returns {Promise<Array>} Search results
     */
    customers: {
      search(query) {
        const params = new URLSearchParams({ q: query });
        return api.request(`/bookings/customers/search?${params.toString()}`);
      }
    }
  },

  // ============================================
  // BILLING MODULE
  // ============================================
  /**
   * Billing management API endpoints
   */
  billing: {
    /**
     * Get all billing records with optional filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} List of billing records
     */
    getAll(filters = {}) {
      const url = api.buildUrl('/billing', filters);
      return api.request(url);
    },

    /**
     * Get billing record by ID
     * @param {number} id - Billing ID
     * @returns {Promise<Object>} Billing data
     */
    getById(id) {
      return api.request(`/billing/${id}`);
    },

    /**
     * Create new billing record
     * @param {Object} data - Billing data
     * @returns {Promise<Object>} Created billing record
     */
    create(data) {
      return api.request('/billing', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update billing record
     * @param {number} id - Billing ID
     * @param {Object} data - Updated billing data
     * @returns {Promise<Object>} Updated billing record
     */
    update(id, data) {
      return api.request(`/billing/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update billing status
     * @param {number} id - Billing ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Success message
     */
    updateStatus(id, status) {
      return api.request(`/billing/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    /**
     * Delete billing record
     * @param {number} id - Billing ID
     * @returns {Promise<Object>} Success message
     */
    delete(id) {
      return api.request(`/billing/${id}`, { method: 'DELETE' });
    }
    ,
    /**
     * Get auto-loaded invoice items and discounts for a customer/day
     * @param {Object} filters - { customer_id, date }
     * @returns {Promise<Object>} Suggested items and totals
     */
    getAutoItems(filters = {}) {
      const url = api.buildUrl('/billing/auto-items/by-day', filters);
      return api.request(url);
    }
  },

  // ============================================
  // EXPENSES MODULE
  // ============================================
  /**
   * Expenses management API endpoints
   */
  expenses: {
    /**
     * Get all expenses with optional filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} List of expenses
     */
    getAll(filters = {}) {
      const url = api.buildUrl('/expenses', filters);
      return api.request(url);
    },

    /**
     * Get expense by ID
     * @param {number} id - Expense ID
     * @returns {Promise<Object>} Expense data
     */
    getById(id) {
      return api.request(`/expenses/${id}`);
    },

    /**
     * Create new expense
     * @param {Object} data - Expense data
     * @returns {Promise<Object>} Created expense
     */
    create(data) {
      return api.request('/expenses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update expense
     * @param {number} id - Expense ID
     * @param {Object} data - Updated expense data
     * @returns {Promise<Object>} Updated expense
     */
    update(id, data) {
      return api.request(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Delete expense
     * @param {number} id - Expense ID
     * @returns {Promise<Object>} Success message
     */
    delete(id) {
      return api.request(`/expenses/${id}`, { method: 'DELETE' });
    },

    /**
     * Get expense report
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Object>} Expense report
     */
    getReport(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/expenses/report?${params.toString()}`);
    }
  },

  // ============================================
  // REPORTS MODULE
  // ============================================
  /**
   * Reports API endpoints
   */
  reports: {
    /**
     * Get revenue report
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Object>} Revenue report
     */
    getRevenue(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/revenue?${params.toString()}`);
    },

    /**
     * Get appointments report
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Object>} Appointments report
     */
    getAppointments(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/appointments?${params.toString()}`);
    },

    /**
     * Get profit report
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Object>} Profit report
     */
    getProfit(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/profit?${params.toString()}`);
    },

    /**
     * Get service performance report
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Object>} Service performance report
     */
    getServicePerformance(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/services?${params.toString()}`);
    }
  },

  

  // ============================================
  // SETTINGS MODULE
  // ============================================
  /**
   * Settings management API endpoints
   */
  settings: {
    /**
     * Get all settings
     * @returns {Promise<Object>} Settings data
     */
    get() {
      return api.request('/settings');
    },

    /**
     * Update settings
     * @param {Object} data - Settings data to update
     * @returns {Promise<Object>} Updated settings
     */
    update(data) {
      return api.request('/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Get all users
     * @returns {Promise<Array>} List of users
     */
    getAllUsers() {
      return api.request('/settings/users');
    },

    /**
     * Create new user
     * @param {Object} data - User data
     * @returns {Promise<Object>} Created user
     */
    createUser(data) {
      return api.request('/settings/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update user
     * @param {number} id - User ID
     * @param {Object} data - Updated user data
     * @returns {Promise<Object>} Updated user
     */
    updateUser(id, data) {
      return api.request(`/settings/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Delete user
     * @param {number} id - User ID
     * @returns {Promise<Object>} Success message
     */
    deleteUser(id) {
      return api.request(`/settings/users/${id}`, { method: 'DELETE' });
    }
  },

  // ============================================
  // MEMBERSHIPS MODULE
  // ============================================
  /**
   * Memberships API endpoints
   */
  memberships: {
    /**
     * Get active membership plans for current salon
     * @returns {Promise<Array>} List of plans
     */
    getPlans() {
      return api.request('/memberships/plans');
    },

    /**
     * Get current user's membership
     * @returns {Promise<Object|null>} Membership data
     */
    getMy() {
      return api.request('/memberships/me');
    },

    /**
     * Get membership for a specific customer
     * @param {number} customerId
     * @returns {Promise<Object|null>} Membership data
     */
    getForCustomer(customerId) {
      return api.request(`/memberships/customer/${customerId}`);
    },

    /**
     * Assign a membership to a customer (owner/center)
     * @param {{customer_id:number, plan_id:number, start_date:string}} payload
     * @returns {Promise<Object>} Result
     */
    assign(payload) {
      return api.request('/memberships/assign', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    ,
    /**
     * Create a membership plan (owner/center)
     * @param {Object} plan - Plan payload
     * @returns {Promise<Object>} Result with id
     */
    createPlan(plan) {
      return api.request('/memberships/plans', {
        method: 'POST',
        body: JSON.stringify(plan)
      });
    }
    ,
    /**
     * Update a membership plan (owner/center)
     * @param {number} id
     * @param {Object} plan
     */
    updatePlan(id, plan) {
      return api.request(`/memberships/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plan)
      });
    },
    /**
     * Delete a membership plan (owner/center)
     * @param {number} id
     */
    deletePlan(id) {
      return api.request(`/memberships/plans/${id}`, { method: 'DELETE' });
    },
    /**
     * Update a membership (owner/center)
     * @param {number} id
     * @param {Object} data
     */
    update(id, data) {
      return api.request(`/memberships/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    /**
     * Delete a membership (owner/center)
     * @param {number} id
     */
    delete(id) {
      return api.request(`/memberships/${id}`, { method: 'DELETE' });
    }
  },

  // ============================================
  // STAFF MODULE
  // ============================================
  /**
   * Staff management API endpoints
   */
  staff: {
    // ====================
    // STAFF MANAGEMENT
    // ====================
    /**
     * Get all staff with optional filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} List of staff members
     */
    getAll(filters = {}) {
      const url = api.buildUrl('/staff', filters);
      return api.request(url);
    },

    /**
     * Get staff by ID
     * @param {number} id - Staff ID
     * @returns {Promise<Object>} Staff data
     */
    getById(id) {
      return api.request(`/staff/${id}`);
    },

    /**
     * Create new staff member
     * @param {Object} data - Staff data
     * @returns {Promise<Object>} Created staff member
     */
    create(data) {
      return api.request('/staff', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update staff member
     * @param {number} id - Staff ID
     * @param {Object} data - Updated staff data
     * @returns {Promise<Object>} Updated staff member
     */
    update(id, data) {
      return api.request(`/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * Delete staff member
     * @param {number} id - Staff ID
     * @returns {Promise<Object>} Success message
     */
    delete(id) {
      return api.request(`/staff/${id}`, { method: 'DELETE' });
    },

    /**
     * Get staff dashboard
     * @returns {Promise<Object>} Staff dashboard data
     */
    getDashboard() {
      return api.request('/staff/dashboard');
    },

    // ====================
    // ATTENDANCE
    // ====================
    /**
     * Get all attendance records with filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Attendance records
     */
    getAttendance(filters = {}) {
      const url = api.buildUrl('/staff/attendance/all', filters);
      return api.request(url);
    },

    /**
     * Create attendance record
     * @param {Object} data - Attendance data
     * @returns {Promise<Object>} Created attendance record
     */
    createAttendance(data) {
      return api.request('/staff/attendance/record', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Staff clock in
     * @param {number} staffId - Staff ID
     * @param {Object} data - Clock-in data
     * @returns {Promise<Object>} Clock-in confirmation
     */
    clockIn(staffId, data) {
      return api.request(`/staff/attendance/${staffId}/clock-in`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Staff clock out
     * @param {number} staffId - Staff ID
     * @param {Object} data - Clock-out data
     * @returns {Promise<Object>} Clock-out confirmation
     */
    clockOut(staffId, data) {
      return api.request(`/staff/attendance/${staffId}/clock-out`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update attendance record
     * @param {number} id - Attendance record ID
     * @param {Object} data - Updated attendance data
     * @returns {Promise<Object>} Updated attendance record
     */
    updateAttendance(id, data) {
      return api.request(`/staff/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // ====================
    // LEAVES
    // ====================
    /**
     * Get all leave records with filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Leave records
     */
    getLeaves(filters = {}) {
      const url = api.buildUrl('/staff/leaves/all', filters);
      return api.request(url);
    },

    /**
     * Get staff on leave for a specific date
     * @param {string|null} date - Date in YYYY-MM-DD format
     * @returns {Promise<Array>} Staff on leave
     */
    getStaffOnLeave(date = null) {
      const url = date ? `/staff/leaves/on-leave?date=${date}` : '/staff/leaves/on-leave';
      return api.request(url);
    },

    /**
     * Apply for leave
     * @param {number} staffId - Staff ID
     * @param {Object} data - Leave application data
     * @returns {Promise<Object>} Leave application response
     */
    applyLeave(staffId, data) {
      return api.request(`/staff/leaves/${staffId}/apply`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update leave status
     * @param {number} id - Leave ID
     * @param {string} status - New status (approved, rejected, etc.)
     * @returns {Promise<Object>} Success message
     */
    updateLeaveStatus(id, status) {
      return api.request(`/staff/leaves/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    /**
     * Get leave balance
     * @param {number} staffId - Staff ID
     * @param {number|null} year - Year (optional)
     * @returns {Promise<Object>} Leave balance
     */
    getLeaveBalance(staffId, year) {
      const url = year ? `/staff/leaves/${staffId}/balance?year=${year}` : `/staff/leaves/${staffId}/balance`;
      return api.request(url);
    },

    // ====================
    // SCHEDULE
    // ====================
    /**
     * Get all schedules with filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Schedule records
     */
    getSchedule(filters = {}) {
      const url = api.buildUrl('/staff/schedule/all', filters);
      return api.request(url);
    },

    /**
     * Create schedule
     * @param {Object} data - Schedule data
     * @returns {Promise<Object>} Created schedule
     */
    createSchedule(data) {
      return api.request('/staff/schedule', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * Update schedule
     * @param {number} id - Schedule ID
     * @param {Object} data - Updated schedule data
     * @returns {Promise<Object>} Updated schedule
     */
    updateSchedule(id, data) {
      return api.request(`/staff/schedule/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // ====================
    // PERFORMANCE
    // ====================
    /**
     * Get staff performance
     * @param {number} staffId - Staff ID
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Object>} Performance data
     */
    getPerformance(staffId, filters = {}) {
      const url = api.buildUrl(`/staff/performance/${staffId}`, filters);
      return api.request(url);
    },

    /**
     * Update performance
     * @param {Object} data - Performance data
     * @returns {Promise<Object>} Success message
     */
    updatePerformance(data) {
      return api.request('/staff/performance', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    // ====================
    // COMMISSION
    // ====================
    /**
     * Get commission records
     * @param {number} staffId - Staff ID
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Object>} Commission data
     */
    getCommission(staffId, filters = {}) {
      const url = api.buildUrl(`/staff/commission/${staffId}`, filters);
      return api.request(url);
    },

    /**
     * Calculate commission
     * @param {number} staffId - Staff ID
     * @param {string} month - Month in YYYY-MM format
     * @returns {Promise<Object>} Calculated commission
     */
    calculateCommission(staffId, month) {
      return api.request(`/staff/commission/${staffId}/calculate`, {
        method: 'POST',
        body: JSON.stringify({ month })
      });
    },

    // ====================
    // SETTINGS
    // ====================
    /**
     * Get staff settings
     * @param {string|null} category - Setting category
     * @param {string|null} key - Setting key
     * @returns {Promise<Object>} Settings data
     */
    getSettings(category = null, key = null) {
      let url = '/staff/settings/all';
      if (category) {
        const params = new URLSearchParams({ category });
        if (key) params.append('key', key);
        url += `?${params.toString()}`;
      }
      return api.request(url);
    },

    /**
     * Update staff setting
     * @param {string} category - Setting category
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     * @returns {Promise<Object>} Success message
     */
    updateSetting(category, key, value) {
      return api.request(`/staff/settings/${category}/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      });
    },

    // ====================
    // REPORTS
    // ====================
    /**
     * Generate attendance report
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @param {string|null} department - Department filter
     * @returns {Promise<Object>} Attendance report
     */
    generateAttendanceReport(startDate, endDate, department = null) {
      const params = new URLSearchParams({ startDate, endDate });
      if (department) params.append('department', department);
      return api.request(`/staff/reports/attendance?${params.toString()}`);
    },

    /**
     * Export attendance report
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @param {string} format - Export format (excel, pdf, csv)
     * @param {string|null} department - Department filter
     * @returns {Promise<Blob>} Exported file
     */
    exportAttendanceReport(startDate, endDate, format = 'excel', department = null) {
      const params = new URLSearchParams({ startDate, endDate, format });
      if (department) params.append('department', department);
      return api.request(`/staff/reports/attendance/export?${params.toString()}`);
    },

    /**
     * Generate performance report
     * @param {string} periodType - Period type (daily, weekly, monthly)
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Object>} Performance report
     */
    generatePerformanceReport(periodType, startDate, endDate) {
      const params = new URLSearchParams({ periodType, startDate, endDate });
      return api.request(`/staff/reports/performance?${params.toString()}`);
    },

    /**
     * Generate payroll report
     * @param {string} month - Month in YYYY-MM format
     * @returns {Promise<Object>} Payroll report
     */
    generatePayrollReport(month) {
      const params = new URLSearchParams({ month });
      return api.request(`/staff/reports/payroll?${params.toString()}`);
    },

    // ====================
    // SELF-SERVICE
    // ====================
    /**
     * Get current staff profile
     * @returns {Promise<Object>} Staff profile
     */
    getMyProfile() {
      return api.request('/staff/my/profile');
    },

    /**
     * Get current staff attendance
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Attendance records
     */
    getMyAttendance(filters = {}) {
      const url = api.buildUrl('/staff/my/attendance', filters);
      return api.request(url);
    },

    /**
     * Get current staff leaves
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} Leave records
     */
    getMyLeaves(filters = {}) {
      const url = api.buildUrl('/staff/my/leaves', filters);
      return api.request(url);
    },

    /**
     * Get current staff commission
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Object>} Commission data
     */
    getMyCommission(filters = {}) {
      const url = api.buildUrl('/staff/my/commission', filters);
      return api.request(url);
    }
  },

  // ============================================
  // UTILITY METHODS
  // ============================================
  /**
   * Generic API call method (backward compatibility)
   * 
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
   * @param {Object|null} data - Request data
   * @returns {Promise<any>} Response data
   */
  async call(endpoint, method = 'GET', data = null) {
    const options = { method };
    
    // Handle query parameters for GET requests
    if (method === 'GET' && data) {
      // Convert data to query string
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString();
      endpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    } else if (data && method !== 'GET') {
      // Add body for non-GET requests
      options.body = JSON.stringify(data);
    }
    
    return this.request(endpoint, options);
  }
};

// Make API globally available
window.api = api;

// Export for ES modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

/**
 * API Module Documentation Summary:
 * 
 * 1. AUTHENTICATION MODULE
 *    - Login/Logout
 *    - Profile management
 * 
 * 2. DASHBOARD MODULE
 *    - Get statistics
 * 
 * 3. CUSTOMERS MODULE
 *    - CRUD operations
 *    - Search functionality
 * 
 * 4. SERVICES MODULE
 *    - Services management
 *    - Categories (main/sub)
 *    - Rooms management
 *    - Service combos
 * 
 * 5. BOOKINGS MODULE (UPDATED)
 *    - Walk-in and calling appointments
 *    - Customer search for bookings
 *    - Time slot availability
 *    - Booking dashboard stats
 * 
 * 6. BILLING MODULE
 *    - Billing records management
 * 
 * 7. EXPENSES MODULE
 *    - Expense tracking
 *    - Reports
 * 
 * 8. REPORTS MODULE
 *    - Various business reports
 * 
 * 9. SETTINGS MODULE
 *    - System settings
 *    - User management
 * 
 * 10. STAFF MODULE
 *     - Staff management
 *     - Attendance tracking
 *     - Leave management
 *     - Scheduling
 *     - Performance & commission
 *     - Reports
 *     - Self-service
 * 
 * 11. UTILITY METHODS
 *     - Generic API call
 *     - URL building
 *     - Request handling
 */