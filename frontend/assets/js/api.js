// /**
//  * API Configuration Module
//  * 
//  * This module provides a centralized API client for the Salon/Spa Management System.
//  * It handles authentication, request/response formatting, and provides methods for all API endpoints.
//  * 
//  * @module api
//  * @version 1.0.0
//  */

// // API base configuration
// const api = {
//   /**
//    * Base URL for all API requests
//    * @type {string}
//    */
//   baseURL: window.location.origin + '/api',

//   /**
//    * Get authentication token from localStorage
//    * @returns {string|null} The JWT token or null if not found
//    */
//   getToken() {
//     return localStorage.getItem('token');
//   },

//   /**
//    * Store authentication token in localStorage
//    * @param {string} token - JWT token to store
//    */
//   setToken(token) {
//     localStorage.setItem('token', token);
//   },

//   /**
//    * Remove authentication token from localStorage
//    */
//   removeToken() {
//     localStorage.removeItem('token');
//   },

//   /**
//    * Make an API request with automatic error handling
//    * 
//    * @param {string} endpoint - API endpoint path
//    * @param {Object} options - Fetch options (method, headers, body, etc.)
//    * @returns {Promise<any>} Promise resolving to response data
//    * @throws {Error} If request fails or returns error
//    */
//   async request(endpoint, options = {}) {
//     const token = this.getToken();
//     const debug = (typeof window !== 'undefined' && (window.DEBUG_API === true)) || (localStorage.getItem('debugApi') === 'true');

//     // Handle query parameters for GET requests
//     let url = `${this.baseURL}${endpoint}`;

//     // If there's a body for GET request, convert it to query params
//     if ((options.method === 'GET' || !options.method) && options.body) {
//       try {
//         const params = new URLSearchParams(JSON.parse(options.body)).toString();
//         url += (url.includes('?') ? '&' : '?') + params;
//         delete options.body; // Remove body for GET request
//       } catch (e) {
//         console.warn('Could not parse body as JSON for GET request');
//       }
//     }

//     const defaultOptions = {
//       headers: {
//         ...(token && { 'Authorization': `Bearer ${token}` })
//       }
//     };

//     // Only set Content-Type for non-FormData requests
//     if (!(options.body instanceof FormData)) {
//       defaultOptions.headers['Content-Type'] = 'application/json';
//     }

//     const config = {
//       ...defaultOptions,
//       ...options,
//       headers: {
//         ...defaultOptions.headers,
//         ...options.headers
//       }
//     };

//     try {
//       if (debug) {
//         let bodyPreview = undefined;
//         if (config.body) {
//           try { bodyPreview = JSON.parse(config.body); } catch (_) { bodyPreview = config.body; }
//         }
//         console.log('[API Request]', (config.method || 'GET'), url, bodyPreview);
//       }
//       const response = await fetch(url, config);

//       // Handle non-JSON responses
//       const contentType = response.headers.get('content-type');
//       let data;

//       if (contentType && contentType.includes('application/json')) {
//         data = await response.json();
//       } else if (contentType && contentType.includes('text/')) {
//         data = await response.text();
//       } else {
//         data = await response.blob();
//       }

//       if (debug) {
//         console.log('[API Response]', response.status, url, (contentType && contentType.includes('application/json')) ? data : '[non-json]');
//       }
//       if (!response.ok) {
//         throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
//       }

//       return data;
//     } catch (error) {
//       if (debug) console.error('[API Error]', url, error.message);
//       console.error('API Error:', error);

//       // Handle network errors
//       if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
//         throw new Error('Network error. Please check your internet connection.');
//       }

//       throw error;
//     }
//   },

//   /**
//    * Build URL with query parameters
//    * 
//    * @param {string} endpoint - API endpoint
//    * @param {Object} filters - Query parameters object
//    * @returns {string} Full URL with query string
//    */
//   buildUrl(endpoint, filters = {}) {
//     const params = new URLSearchParams();

//     Object.entries(filters).forEach(([key, value]) => {
//       if (value !== null && value !== undefined && value !== '') {
//         params.append(key, value);
//       }
//     });

//     const queryString = params.toString();
//     return queryString ? `${endpoint}?${queryString}` : endpoint;
//   },

//   // ============================================
//   // AUTHENTICATION MODULE
//   // ============================================
//   /**
//    * Authentication API endpoints
//    */
//   auth: {
//     /**
//      * Login user
//      * @param {string} email - User email
//      * @param {string} password - User password
//      * @returns {Promise<Object>} User data and token
//      */
//     login(email, password) {
//       return api.request('/auth/login', {
//         method: 'POST',
//         body: JSON.stringify({ email, password })
//       });
//     },

//     /**
//      * Logout user
//      * @returns {Promise<Object>} Success message
//      */
//     logout() {
//       return api.request('/auth/logout', { method: 'POST' });
//     },

//     /**
//      * Get current user profile
//      * @returns {Promise<Object>} User profile data
//      */
//     getProfile() {
//       return api.request('/auth/profile');
//     },

//     /**
//      * Update user profile
//      * @param {Object} data - Profile data to update
//      * @returns {Promise<Object>} Updated profile
//      */
//     updateProfile(data) {
//       return api.request('/auth/profile', {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     }
//   },

//   // ============================================
//   // DASHBOARD MODULE
//   // ============================================
//   /**
//    * Dashboard API endpoints
//    */
//   dashboard: {
//     /**
//      * Get dashboard statistics
//      * @returns {Promise<Object>} Dashboard stats
//      */
//     getStats() {
//       return api.request('/dashboard/stats');
//     }
//   },

//   // ============================================
//   // CUSTOMERS MODULE
//   // ============================================
//   /**
//    * Customer management API endpoints
//    */
//   customers: {
//     /**
//      * Get all customers with optional filters
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} List of customers
//      */
//     getAll(filters = {}) {
//       const url = api.buildUrl('/customers', filters);
//       return api.request(url);
//     },

//     /**
//      * Get customer by ID
//      * @param {number} id - Customer ID
//      * @returns {Promise<Object>} Customer data
//      */
//     getById(id) {
//       return api.request(`/customers/${id}`);
//     },

//     /**
//      * Create new customer
//      * @param {Object} data - Customer data
//      * @returns {Promise<Object>} Created customer
//      */
//     create(data) {
//       return api.request('/customers', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update customer
//      * @param {number} id - Customer ID
//      * @param {Object} data - Updated customer data
//      * @returns {Promise<Object>} Updated customer
//      */
//     update(id, data) {
//       return api.request(`/customers/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Delete customer
//      * @param {number} id - Customer ID
//      * @returns {Promise<Object>} Success message
//      */
//     delete(id) {
//       return api.request(`/customers/${id}`, { method: 'DELETE' });
//     },

//     /**
//      * Search customers by name or phone
//      * @param {string} query - Search query
//      * @returns {Promise<Array>} Search results
//      */
//     search(query) {
//       return api.request(`/customers/search?q=${encodeURIComponent(query)}`);
//     }
//   },

//   // ============================================
//   // SERVICES MODULE
//   // ============================================
//   /**
//    * Services management API endpoints
//    */
//   services: {
//     // ====================
//     // BASIC SERVICES
//     // ====================
//     /**
//      * Get all services with optional filters
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} List of services
//      */
//     getAll(filters = {}) {
//       const url = api.buildUrl('/services', filters);
//       return api.request(url);
//     },

//     /**
//      * Get service by ID
//      * @param {number} id - Service ID
//      * @returns {Promise<Object>} Service data
//      */
//     getById(id) {
//       return api.request(`/services/${id}`);
//     },

//     /**
//      * Create new service
//      * @param {Object} data - Service data
//      * @returns {Promise<Object>} Created service
//      */
//     create(data) {
//       return api.request('/services', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update service
//      * @param {number} id - Service ID
//      * @param {Object} data - Updated service data
//      * @returns {Promise<Object>} Updated service
//      */
//     update(id, data) {
//       return api.request(`/services/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Delete service
//      * @param {number} id - Service ID
//      * @returns {Promise<Object>} Success message
//      */
//     delete(id) {
//       return api.request(`/services/${id}`, { method: 'DELETE' });
//     },

//     /**
//      * Get services by category
//      * @param {number} categoryId - Category ID
//      * @returns {Promise<Array>} Services in category
//      */
//     getByCategory(categoryId) {
//       return api.request(`/services/category/${categoryId}`);
//     },

//     // ====================
//     // CATEGORIES
//     // ====================
//     /**
//      * Get categories tree (main and sub categories)
//      * @returns {Promise<Object>} Categories tree structure
//      */
//     getCategoriesTree() {
//       return api.request('/services/categories/tree');
//     },

//     /**
//      * Get main categories only
//      * @returns {Promise<Array>} List of main categories
//      */
//     getMainCategories() {
//       return api.request('/services/categories/main');
//     },

//     /**
//      * Get sub-categories by parent ID
//      * @param {number|null} parentId - Parent category ID
//      * @returns {Promise<Array>} List of sub-categories
//      */
//     getSubCategories(parentId = null) {
//       const url = parentId
//         ? `/services/categories/sub?parentId=${parentId}`
//         : '/services/categories/sub';
//       return api.request(url);
//     },

//     /**
//      * Create new category
//      * @param {Object} data - Category data
//      * @returns {Promise<Object>} Created category
//      */
//     createCategory(data) {
//       return api.request('/services/categories', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update category
//      * @param {number} id - Category ID
//      * @param {Object} data - Updated category data
//      * @returns {Promise<Object>} Updated category
//      */
//     updateCategory(id, data) {
//       return api.request(`/services/categories/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Delete category
//      * @param {number} id - Category ID
//      * @returns {Promise<Object>} Success message
//      */
//     deleteCategory(id) {
//       return api.request(`/services/categories/${id}`, { method: 'DELETE' });
//     },

//     // ====================
//     // ROOMS
//     // ====================
//     /**
//      * Get all rooms
//      * @returns {Promise<Array>} List of rooms
//      */
//     getRooms() {
//       return api.request('/services/rooms');
//     },

//     /**
//      * Get room by ID
//      * @param {number} id - Room ID
//      * @returns {Promise<Object>} Room data
//      */
//     getRoomById(id) {
//       return api.request(`/services/rooms/${id}`);
//     },

//     /**
//      * Create new room
//      * @param {Object} data - Room data
//      * @returns {Promise<Object>} Created room
//      */
//     createRoom(data) {
//       return api.request('/services/rooms', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update room
//      * @param {number} id - Room ID
//      * @param {Object} data - Updated room data
//      * @returns {Promise<Object>} Updated room
//      */
//     updateRoom(id, data) {
//       return api.request(`/services/rooms/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Delete room
//      * @param {number} id - Room ID
//      * @returns {Promise<Object>} Success message
//      */
//     deleteRoom(id) {
//       return api.request(`/services/rooms/${id}`, { method: 'DELETE' });
//     },

//     /**
//      * Get suitable rooms for a service
//      * @param {number} serviceId - Service ID
//      * @returns {Promise<Array>} List of suitable rooms
//      */
//     getSuitableRooms(serviceId) {
//       return api.request(`/services/rooms/suitable/${serviceId}`);
//     },

//     // ====================
//     // COMBOS
//     // ====================
//     /**
//      * Get all service combos
//      * @returns {Promise<Array>} List of combos
//      */
//     getCombos() {
//       return api.request('/services/combos/all')
//         .catch(error => {
//           console.log('Combos endpoint not available:', error.message);
//           return []; // Return empty array if endpoint fails
//         });
//     },

//     /**
//      * Get combo by ID
//      * @param {number} id - Combo ID
//      * @returns {Promise<Object>} Combo data
//      */
//     getComboById(id) {
//       return api.request(`/services/combos/${id}`);
//     },

//     /**
//      * Create new combo
//      * @param {Object} data - Combo data
//      * @returns {Promise<Object>} Created combo
//      */
//     createCombo(data) {
//       return api.request('/services/combos', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update combo
//      * @param {number} id - Combo ID
//      * @param {Object} data - Updated combo data
//      * @returns {Promise<Object>} Updated combo
//      */
//     updateCombo(id, data) {
//       return api.request(`/services/combos/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Delete combo
//      * @param {number} id - Combo ID
//      * @returns {Promise<Object>} Success message
//      */
//     deleteCombo(id) {
//       return api.request(`/services/combos/${id}`, { method: 'DELETE' });
//     },

//     /**
//      * Toggle combo active status
//      * @param {number} id - Combo ID
//      * @param {boolean} status - New status
//      * @returns {Promise<Object>} Success message
//      */
//     toggleComboStatus(id, status) {
//       return api.request(`/services/combos/${id}/status`, {
//         method: 'PUT',
//         body: JSON.stringify({ is_active: status })
//       });
//     }
//   },

//   // ============================================
//   // BOOKINGS MODULE (UPDATED)
//   // ============================================
//   /**
//    * Bookings management API endpoints
//    */
//   bookings: {
//     /**
//      * Get all bookings with optional filters
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} List of bookings
//      */
//     getAll(filters = {}) {
//       const url = api.buildUrl('/bookings', filters);
//       return api.request(url);
//     },

//     /**
//      * Get booking by ID
//      * @param {number} id - Booking ID
//      * @returns {Promise<Object>} Booking data with items
//      */
//     getById(id) {
//       return api.request(`/bookings/${id}`);
//     },

//     /**
//      * Create new booking
//      * @param {Object} data - Booking data including items array
//      * @returns {Promise<Object>} Created booking with ID
//      */
//     create(data) {
//       return api.request('/bookings', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update booking
//      * @param {number} id - Booking ID
//      * @param {Object} data - Updated booking data
//      * @returns {Promise<Object>} Updated booking
//      */
//     update(id, data) {
//       return api.request(`/bookings/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update booking status
//      * @param {number} id - Booking ID
//      * @param {string} status - New status (pending, confirmed, in_progress, completed, cancelled)
//      * @returns {Promise<Object>} Success message
//      */
//     updateStatus(id, status) {
//       return api.request(`/bookings/${id}/status`, {
//         method: 'PATCH',
//         body: JSON.stringify({ status })
//       });
//     },

//     /**
//      * Delete booking
//      * @param {number} id - Booking ID
//      * @returns {Promise<Object>} Success message
//      */
//     delete(id) {
//       return api.request(`/bookings/${id}`, { method: 'DELETE' });
//     },

//     /**
//      * Check time slot availability
//      * @param {string} date - Date in YYYY-MM-DD format
//      * @param {string} time - Time in HH:MM format
//      * @param {number} duration - Duration in minutes
//      * @returns {Promise<Object>} Availability status
//      */
//     checkAvailability(date, time, duration) {
//       const params = new URLSearchParams({
//         date,
//         time,
//         duration: duration.toString()
//       });
//       return api.request(`/bookings/check-availability?${params.toString()}`);
//     },

//     /**
//      * Get available time slots for a date
//      * @param {string} date - Date in YYYY-MM-DD format
//      * @param {number} duration - Duration in minutes (default: 60)
//      * @returns {Promise<Object>} Available slots
//      */
//     getAvailableSlots(date, duration = 60) {
//       const params = new URLSearchParams({
//         date,
//         duration: duration.toString()
//       });
//       return api.request(`/bookings/available-slots?${params.toString()}`);
//     },

//     /**
//      * Get booking dashboard statistics
//      * @returns {Promise<Object>} Dashboard stats
//      */
//     stats() {
//       return api.request('/bookings/stats');
//     },

//     /**
//      * Customer search for bookings
//      * @param {string} query - Search query (phone or name)
//      * @returns {Promise<Array>} Search results
//      */
//     customers: {
//       search(query) {
//         const params = new URLSearchParams({ q: query });
//         return api.request(`/bookings/customers/search?${params.toString()}`);
//       }
//     }
//   },

//   // ============================================
//   // BILLING MODULE
//   // ============================================
//   /**
//    * Billing management API endpoints
//    */
//   billing: {
//     /**
//      * Get all billing records with optional filters
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} List of billing records
//      */
//     getAll(filters = {}) {
//       const url = api.buildUrl('/billing', filters);
//       return api.request(url);
//     },

//     /**
//      * Get billing record by ID
//      * @param {number} id - Billing ID
//      * @returns {Promise<Object>} Billing data
//      */
//     getById(id) {
//       return api.request(`/billing/${id}`);
//     },

//     /**
//      * Create new billing record
//      * @param {Object} data - Billing data
//      * @returns {Promise<Object>} Created billing record
//      */
//     create(data) {
//       return api.request('/billing', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update billing record
//      * @param {number} id - Billing ID
//      * @param {Object} data - Updated billing data
//      * @returns {Promise<Object>} Updated billing record
//      */
//     update(id, data) {
//       return api.request(`/billing/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update billing status
//      * @param {number} id - Billing ID
//      * @param {string} status - New status
//      * @returns {Promise<Object>} Success message
//      */
//     updateStatus(id, status) {
//       return api.request(`/billing/${id}/status`, {
//         method: 'PATCH',
//         body: JSON.stringify({ status })
//       });
//     },

//     /**
//      * Delete billing record
//      * @param {number} id - Billing ID
//      * @returns {Promise<Object>} Success message
//      */
//     delete(id) {
//       return api.request(`/billing/${id}`, { method: 'DELETE' });
//     }
//     ,
//     /**
//      * Get auto-loaded invoice items and discounts for a customer/day
//      * @param {Object} filters - { customer_id, date }
//      * @returns {Promise<Object>} Suggested items and totals
//      */
//     getAutoItems(filters = {}) {
//       const url = api.buildUrl('/billing/auto-items/by-day', filters);
//       return api.request(url);
//     }
//   },

//   // ============================================
//   // EXPENSES MODULE
//   // ============================================
//   /**
//    * Expenses management API endpoints
//    */
//   expenses: {
//     /**
//      * Get all expenses with optional filters
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} List of expenses
//      */
//     getAll(filters = {}) {
//       const url = api.buildUrl('/expenses', filters);
//       return api.request(url);
//     },

//     /**
//      * Get expense by ID
//      * @param {number} id - Expense ID
//      * @returns {Promise<Object>} Expense data
//      */
//     getById(id) {
//       return api.request(`/expenses/${id}`);
//     },

//     /**
//      * Create new expense
//      * @param {Object} data - Expense data
//      * @returns {Promise<Object>} Created expense
//      */
//     create(data) {
//       return api.request('/expenses', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update expense
//      * @param {number} id - Expense ID
//      * @param {Object} data - Updated expense data
//      * @returns {Promise<Object>} Updated expense
//      */
//     update(id, data) {
//       return api.request(`/expenses/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Delete expense
//      * @param {number} id - Expense ID
//      * @returns {Promise<Object>} Success message
//      */
//     delete(id) {
//       return api.request(`/expenses/${id}`, { method: 'DELETE' });
//     },

//     /**
//      * Get expense report
//      * @param {string} startDate - Start date in YYYY-MM-DD format
//      * @param {string} endDate - End date in YYYY-MM-DD format
//      * @returns {Promise<Object>} Expense report
//      */
//     getReport(startDate, endDate) {
//       const params = new URLSearchParams({ startDate, endDate });
//       return api.request(`/expenses/report?${params.toString()}`);
//     }
//   },

//   // ============================================
//   // REPORTS MODULE
//   // ============================================
//   /**
//    * Reports API endpoints
//    */
//   reports: {
//     /**
//      * Get revenue report
//      * @param {string} startDate - Start date in YYYY-MM-DD format
//      * @param {string} endDate - End date in YYYY-MM-DD format
//      * @returns {Promise<Object>} Revenue report
//      */
//     getRevenue(startDate, endDate) {
//       const params = new URLSearchParams({ startDate, endDate });
//       return api.request(`/reports/revenue?${params.toString()}`);
//     },

//     /**
//      * Get appointments report
//      * @param {string} startDate - Start date in YYYY-MM-DD format
//      * @param {string} endDate - End date in YYYY-MM-DD format
//      * @returns {Promise<Object>} Appointments report
//      */
//     getAppointments(startDate, endDate) {
//       const params = new URLSearchParams({ startDate, endDate });
//       return api.request(`/reports/appointments?${params.toString()}`);
//     },

//     /**
//      * Get profit report
//      * @param {string} startDate - Start date in YYYY-MM-DD format
//      * @param {string} endDate - End date in YYYY-MM-DD format
//      * @returns {Promise<Object>} Profit report
//      */
//     getProfit(startDate, endDate) {
//       const params = new URLSearchParams({ startDate, endDate });
//       return api.request(`/reports/profit?${params.toString()}`);
//     },

//     /**
//      * Get service performance report
//      * @param {string} startDate - Start date in YYYY-MM-DD format
//      * @param {string} endDate - End date in YYYY-MM-DD format
//      * @returns {Promise<Object>} Service performance report
//      */
//     getServicePerformance(startDate, endDate) {
//       const params = new URLSearchParams({ startDate, endDate });
//       return api.request(`/reports/services?${params.toString()}`);
//     }
//   },



//   // ============================================
//   // SETTINGS MODULE
//   // ============================================
//   /**
//    * Settings management API endpoints
//    */
//   settings: {
//     /**
//      * Get all settings
//      * @returns {Promise<Object>} Settings data
//      */
//     get() {
//       return api.request('/settings');
//     },

//     /**
//      * Update settings
//      * @param {Object} data - Settings data to update
//      * @returns {Promise<Object>} Updated settings
//      */
//     update(data) {
//       return api.request('/settings', {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Get all users
//      * @returns {Promise<Array>} List of users
//      */
//     getAllUsers() {
//       return api.request('/settings/users');
//     },

//     /**
//      * Create new user
//      * @param {Object} data - User data
//      * @returns {Promise<Object>} Created user
//      */
//     createUser(data) {
//       return api.request('/settings/users', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update user
//      * @param {number} id - User ID
//      * @param {Object} data - Updated user data
//      * @returns {Promise<Object>} Updated user
//      */
//     updateUser(id, data) {
//       return api.request(`/settings/users/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Delete user
//      * @param {number} id - User ID
//      * @returns {Promise<Object>} Success message
//      */
//     deleteUser(id) {
//       return api.request(`/settings/users/${id}`, { method: 'DELETE' });
//     }
//   },

//   // ============================================
//   // MEMBERSHIPS MODULE
//   // ============================================
//   /**
//    * Memberships API endpoints
//    */
//   memberships: {
//     /**
//      * Get active membership plans for current salon
//      * @returns {Promise<Array>} List of plans
//      */
//     getPlans() {
//       return api.request('/memberships/plans');
//     },

//     /**
//      * Get current user's membership
//      * @returns {Promise<Object|null>} Membership data
//      */
//     getMy() {
//       return api.request('/memberships/me');
//     },

//     /**
//      * Get membership for a specific customer
//      * @param {number} customerId
//      * @returns {Promise<Object|null>} Membership data
//      */
//     getForCustomer(customerId) {
//       return api.request(`/memberships/customer/${customerId}`);
//     },

//     /**
//      * Assign a membership to a customer (owner/center)
//      * @param {{customer_id:number, plan_id:number, start_date:string}} payload
//      * @returns {Promise<Object>} Result
//      */
//     assign(payload) {
//       return api.request('/memberships/assign', {
//         method: 'POST',
//         body: JSON.stringify(payload)
//       });
//     }
//     ,
//     /**
//      * Create a membership plan (owner/center)
//      * @param {Object} plan - Plan payload
//      * @returns {Promise<Object>} Result with id
//      */
//     createPlan(plan) {
//       return api.request('/memberships/plans', {
//         method: 'POST',
//         body: JSON.stringify(plan)
//       });
//     }
//     ,
//     /**
//      * Update a membership plan (owner/center)
//      * @param {number} id
//      * @param {Object} plan
//      */
//     updatePlan(id, plan) {
//       return api.request(`/memberships/plans/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(plan)
//       });
//     },
//     /**
//      * Delete a membership plan (owner/center)
//      * @param {number} id
//      */
//     deletePlan(id) {
//       return api.request(`/memberships/plans/${id}`, { method: 'DELETE' });
//     },
//     /**
//      * Update a membership (owner/center)
//      * @param {number} id
//      * @param {Object} data
//      */
//     update(id, data) {
//       return api.request(`/memberships/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },
//     /**
//      * Delete a membership (owner/center)
//      * @param {number} id
//      */
//     delete(id) {
//       return api.request(`/memberships/${id}`, { method: 'DELETE' });
//     }
//   },

//   // ============================================
//   // STAFF MODULE
//   // ============================================
//   /**
//    * Staff management API endpoints
//    */
//   staff: {
//     // ====================
//     // STAFF MANAGEMENT
//     // ====================
//     /**
//      * Get all staff with optional filters
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} List of staff members
//      */
//     getAll(filters = {}) {
//       const url = api.buildUrl('/staff', filters);
//       return api.request(url);
//     },

//     /**
//      * Get staff by ID
//      * @param {number} id - Staff ID
//      * @returns {Promise<Object>} Staff data
//      */
//     getById(id) {
//       return api.request(`/staff/${id}`);
//     },

//     /**
//      * Create new staff member
//      * @param {Object} data - Staff data
//      * @returns {Promise<Object>} Created staff member
//      */
//     create(data) {
//       return api.request('/staff', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update staff member
//      * @param {number} id - Staff ID
//      * @param {Object} data - Updated staff data
//      * @returns {Promise<Object>} Updated staff member
//      */
//     update(id, data) {
//       return api.request(`/staff/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Delete staff member
//      * @param {number} id - Staff ID
//      * @returns {Promise<Object>} Success message
//      */
//     delete(id) {
//       return api.request(`/staff/${id}`, { method: 'DELETE' });
//     },

//     /**
//      * Get staff dashboard
//      * @returns {Promise<Object>} Staff dashboard data
//      */
//     getDashboard() {
//       return api.request('/staff/dashboard');
//     },

//     // ====================
//     // ATTENDANCE
//     // ====================
//     /**
//      * Get all attendance records with filters
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} Attendance records
//      */
//     getAttendance(filters = {}) {
//       const url = api.buildUrl('/staff/attendance/all', filters);
//       return api.request(url);
//     },

//     /**
//      * Create attendance record
//      * @param {Object} data - Attendance data
//      * @returns {Promise<Object>} Created attendance record
//      */
//     createAttendance(data) {
//       return api.request('/staff/attendance/record', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Staff clock in
//      * @param {number} staffId - Staff ID
//      * @param {Object} data - Clock-in data
//      * @returns {Promise<Object>} Clock-in confirmation
//      */
//     clockIn(staffId, data) {
//       return api.request(`/staff/attendance/${staffId}/clock-in`, {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Staff clock out
//      * @param {number} staffId - Staff ID
//      * @param {Object} data - Clock-out data
//      * @returns {Promise<Object>} Clock-out confirmation
//      */
//     clockOut(staffId, data) {
//       return api.request(`/staff/attendance/${staffId}/clock-out`, {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update attendance record
//      * @param {number} id - Attendance record ID
//      * @param {Object} data - Updated attendance data
//      * @returns {Promise<Object>} Updated attendance record
//      */
//     updateAttendance(id, data) {
//       return api.request(`/staff/attendance/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     // ====================
//     // LEAVES
//     // ====================
//     /**
//      * Get all leave records with filters
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} Leave records
//      */
//     getLeaves(filters = {}) {
//       const url = api.buildUrl('/staff/leaves/all', filters);
//       return api.request(url);
//     },

//     /**
//      * Get staff on leave for a specific date
//      * @param {string|null} date - Date in YYYY-MM-DD format
//      * @returns {Promise<Array>} Staff on leave
//      */
//     getStaffOnLeave(date = null) {
//       const url = date ? `/staff/leaves/on-leave?date=${date}` : '/staff/leaves/on-leave';
//       return api.request(url);
//     },

//     /**
//      * Apply for leave
//      * @param {number} staffId - Staff ID
//      * @param {Object} data - Leave application data
//      * @returns {Promise<Object>} Leave application response
//      */
//     applyLeave(staffId, data) {
//       return api.request(`/staff/leaves/${staffId}/apply`, {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update leave status
//      * @param {number} id - Leave ID
//      * @param {string} status - New status (approved, rejected, etc.)
//      * @returns {Promise<Object>} Success message
//      */
//     updateLeaveStatus(id, status) {
//       return api.request(`/staff/leaves/${id}/status`, {
//         method: 'PATCH',
//         body: JSON.stringify({ status })
//       });
//     },

//     /**
//      * Get leave balance
//      * @param {number} staffId - Staff ID
//      * @param {number|null} year - Year (optional)
//      * @returns {Promise<Object>} Leave balance
//      */
//     getLeaveBalance(staffId, year) {
//       const url = year ? `/staff/leaves/${staffId}/balance?year=${year}` : `/staff/leaves/${staffId}/balance`;
//       return api.request(url);
//     },

//     // ====================
//     // SCHEDULE
//     // ====================
//     /**
//      * Get all schedules with filters
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} Schedule records
//      */
//     getSchedule(filters = {}) {
//       const url = api.buildUrl('/staff/schedule/all', filters);
//       return api.request(url);
//     },

//     /**
//      * Create schedule
//      * @param {Object} data - Schedule data
//      * @returns {Promise<Object>} Created schedule
//      */
//     createSchedule(data) {
//       return api.request('/staff/schedule', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     /**
//      * Update schedule
//      * @param {number} id - Schedule ID
//      * @param {Object} data - Updated schedule data
//      * @returns {Promise<Object>} Updated schedule
//      */
//     updateSchedule(id, data) {
//       return api.request(`/staff/schedule/${id}`, {
//         method: 'PUT',
//         body: JSON.stringify(data)
//       });
//     },

//     // ====================
//     // PERFORMANCE
//     // ====================
//     /**
//      * Get staff performance
//      * @param {number} staffId - Staff ID
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Object>} Performance data
//      */
//     getPerformance(staffId, filters = {}) {
//       const url = api.buildUrl(`/staff/performance/${staffId}`, filters);
//       return api.request(url);
//     },

//     /**
//      * Update performance
//      * @param {Object} data - Performance data
//      * @returns {Promise<Object>} Success message
//      */
//     updatePerformance(data) {
//       return api.request('/staff/performance', {
//         method: 'POST',
//         body: JSON.stringify(data)
//       });
//     },

//     // ====================
//     // COMMISSION
//     // ====================
//     /**
//      * Get commission records
//      * @param {number} staffId - Staff ID
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Object>} Commission data
//      */
//     getCommission(staffId, filters = {}) {
//       const url = api.buildUrl(`/staff/commission/${staffId}`, filters);
//       return api.request(url);
//     },

//     /**
//      * Calculate commission
//      * @param {number} staffId - Staff ID
//      * @param {string} month - Month in YYYY-MM format
//      * @returns {Promise<Object>} Calculated commission
//      */
//     calculateCommission(staffId, month) {
//       return api.request(`/staff/commission/${staffId}/calculate`, {
//         method: 'POST',
//         body: JSON.stringify({ month })
//       });
//     },

//     // ====================
//     // SETTINGS
//     // ====================
//     /**
//      * Get staff settings
//      * @param {string|null} category - Setting category
//      * @param {string|null} key - Setting key
//      * @returns {Promise<Object>} Settings data
//      */
//     getSettings(category = null, key = null) {
//       let url = '/staff/settings/all';
//       if (category) {
//         const params = new URLSearchParams({ category });
//         if (key) params.append('key', key);
//         url += `?${params.toString()}`;
//       }
//       return api.request(url);
//     },

//     /**
//      * Update staff setting
//      * @param {string} category - Setting category
//      * @param {string} key - Setting key
//      * @param {any} value - Setting value
//      * @returns {Promise<Object>} Success message
//      */
//     updateSetting(category, key, value) {
//       return api.request(`/staff/settings/${category}/${key}`, {
//         method: 'PUT',
//         body: JSON.stringify({ value })
//       });
//     },

//     // ====================
//     // REPORTS
//     // ====================
//     /**
//      * Generate attendance report
//      * @param {string} startDate - Start date in YYYY-MM-DD format
//      * @param {string} endDate - End date in YYYY-MM-DD format
//      * @param {string|null} department - Department filter
//      * @returns {Promise<Object>} Attendance report
//      */
//     generateAttendanceReport(startDate, endDate, department = null) {
//       const params = new URLSearchParams({ startDate, endDate });
//       if (department) params.append('department', department);
//       return api.request(`/staff/reports/attendance?${params.toString()}`);
//     },

//     /**
//      * Export attendance report
//      * @param {string} startDate - Start date in YYYY-MM-DD format
//      * @param {string} endDate - End date in YYYY-MM-DD format
//      * @param {string} format - Export format (excel, pdf, csv)
//      * @param {string|null} department - Department filter
//      * @returns {Promise<Blob>} Exported file
//      */
//     exportAttendanceReport(startDate, endDate, format = 'excel', department = null) {
//       const params = new URLSearchParams({ startDate, endDate, format });
//       if (department) params.append('department', department);
//       return api.request(`/staff/reports/attendance/export?${params.toString()}`);
//     },

//     /**
//      * Generate performance report
//      * @param {string} periodType - Period type (daily, weekly, monthly)
//      * @param {string} startDate - Start date in YYYY-MM-DD format
//      * @param {string} endDate - End date in YYYY-MM-DD format
//      * @returns {Promise<Object>} Performance report
//      */
//     generatePerformanceReport(periodType, startDate, endDate) {
//       const params = new URLSearchParams({ periodType, startDate, endDate });
//       return api.request(`/staff/reports/performance?${params.toString()}`);
//     },

//     /**
//      * Generate payroll report
//      * @param {string} month - Month in YYYY-MM format
//      * @returns {Promise<Object>} Payroll report
//      */
//     generatePayrollReport(month) {
//       const params = new URLSearchParams({ month });
//       return api.request(`/staff/reports/payroll?${params.toString()}`);
//     },

//     // ====================
//     // SELF-SERVICE
//     // ====================
//     /**
//      * Get current staff profile
//      * @returns {Promise<Object>} Staff profile
//      */
//     getMyProfile() {
//       return api.request('/staff/my/profile');
//     },

//     /**
//      * Get current staff attendance
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} Attendance records
//      */
//     getMyAttendance(filters = {}) {
//       const url = api.buildUrl('/staff/my/attendance', filters);
//       return api.request(url);
//     },

//     /**
//      * Get current staff leaves
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Array>} Leave records
//      */
//     getMyLeaves(filters = {}) {
//       const url = api.buildUrl('/staff/my/leaves', filters);
//       return api.request(url);
//     },

//     /**
//      * Get current staff commission
//      * @param {Object} filters - Filter parameters
//      * @returns {Promise<Object>} Commission data
//      */
//     getMyCommission(filters = {}) {
//       const url = api.buildUrl('/staff/my/commission', filters);
//       return api.request(url);
//     }
//   },

//   // ============================================
//   // UTILITY METHODS
//   // ============================================
//   /**
//    * Generic API call method (backward compatibility)
//    * 
//    * @param {string} endpoint - API endpoint
//    * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
//    * @param {Object|null} data - Request data
//    * @returns {Promise<any>} Response data
//    */
//   async call(endpoint, method = 'GET', data = null) {
//     const options = { method };

//     // Handle query parameters for GET requests
//     if (method === 'GET' && data) {
//       // Convert data to query string
//       const params = new URLSearchParams();
//       Object.entries(data).forEach(([key, value]) => {
//         if (value !== null && value !== undefined && value !== '') {
//           params.append(key, value);
//         }
//       });

//       const queryString = params.toString();
//       endpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
//     } else if (data && method !== 'GET') {
//       // Add body for non-GET requests
//       options.body = JSON.stringify(data);
//     }

//     return this.request(endpoint, options);
//   }
// };

// // =========================================================
// // GLOBAL MODULE EVENT BRIDGE (ONLY ONCE)
// // =========================================================

// if (!window.__globalFormEventsRegistered) {

//   // 📘 Booking form (Calendar / Anywhere)
//   document.addEventListener('open-booking-form', () => {
//     if (window.bookingsModule?.showBookingForm) {
//       window.bookingsModule.showBookingForm();
//     } else {
//       console.warn('Bookings module not loaded');
//     }
//   });

//   // 👤 Customer form (Calendar / Anywhere)
//   document.addEventListener('open-customer-form', () => {
//     if (window.customersModule?.showCustomerForm) {
//       window.customersModule.showCustomerForm();
//     } else {
//       console.warn('Customers module not loaded');
//     }
//   });

//   window.__globalFormEventsRegistered = true;
// }


// // Make API globally available
// window.api = api;

// // Export for ES modules (if needed)
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = api;
// }

// /**
//  * API Module Documentation Summary:
//  * 
//  * 1. AUTHENTICATION MODULE
//  *    - Login/Logout
//  *    - Profile management
//  * 
//  * 2. DASHBOARD MODULE
//  *    - Get statistics
//  * 
//  * 3. CUSTOMERS MODULE
//  *    - CRUD operations
//  *    - Search functionality
//  * 
//  * 4. SERVICES MODULE
//  *    - Services management
//  *    - Categories (main/sub)
//  *    - Rooms management
//  *    - Service combos
//  * 
//  * 5. BOOKINGS MODULE (UPDATED)
//  *    - Walk-in and calling appointments
//  *    - Customer search for bookings
//  *    - Time slot availability
//  *    - Booking dashboard stats
//  * 
//  * 6. BILLING MODULE
//  *    - Billing records management
//  * 
//  * 7. EXPENSES MODULE
//  *    - Expense tracking
//  *    - Reports
//  * 
//  * 8. REPORTS MODULE
//  *    - Various business reports
//  * 
//  * 9. SETTINGS MODULE
//  *    - System settings
//  *    - User management
//  * 
//  * 10. STAFF MODULE
//  *     - Staff management
//  *     - Attendance tracking
//  *     - Leave management
//  *     - Scheduling
//  *     - Performance & commission
//  *     - Reports
//  *     - Self-service
//  * 
//  * 11. UTILITY METHODS
//  *     - Generic API call
//  *     - URL building
//  *     - Request handling
//  */


const api = {
  baseURL: window.location.origin + '/api',

  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    localStorage.setItem('token', token);
  },

  removeToken() {
    localStorage.removeItem('token');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const debug = (typeof window !== 'undefined' && (window.DEBUG_API === true)) || (localStorage.getItem('debugApi') === 'true');

    let url = `${this.baseURL}${endpoint}`;

    if ((options.method === 'GET' || !options.method) && options.body) {
      try {
        const params = new URLSearchParams(JSON.parse(options.body)).toString();
        url += (url.includes('?') ? '&' : '?') + params;
        delete options.body;
      } catch (e) {
        console.warn('Could not parse body as JSON for GET request');
      }
    }

    const defaultOptions = {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

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

      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your internet connection.');
      }

      throw error;
    }
  },

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

  /////////////////////////////// Core API Methods ///////////////////////////////
  async call(endpoint, method = 'GET', data = null) {
    const options = { method };

    if (method === 'GET' && data) {
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      endpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    } else if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    return this.request(endpoint, options);
  },

  /////////////////////////////// Authentication Module ///////////////////////////////
  auth: {
    login(email, password) {
      return api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },

    logout() {
      return api.request('/auth/logout', { method: 'POST' });
    },

    getProfile() {
      return api.request('/auth/profile');
    },

    updateProfile(data) {
      return api.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  /////////////////////////////// Dashboard Module ///////////////////////////////
  dashboard: {
    getStats() {
      return api.request('/dashboard/stats');
    }
  },

  /////////////////////////////// Customers Module ///////////////////////////////
  customers: {
    getAll(filters = {}) {
      const url = api.buildUrl('/customers', filters);
      return api.request(url);
    },

    getById(id) {
      return api.request(`/customers/${id}`);
    },

    create(data) {
      return api.request('/customers', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update(id, data) {
      return api.request(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete(id) {
      return api.request(`/customers/${id}`, { method: 'DELETE' });
    },

    search(query) {
      return api.request(`/customers/search?q=${encodeURIComponent(query)}`);
    }
  },

  /////////////////////////////// Services Module ///////////////////////////////
  services: {
    getAll(filters = {}) {
      const url = api.buildUrl('/services', filters);
      return api.request(url);
    },

    getById(id) {
      return api.request(`/services/${id}`);
    },

    create(data) {
      return api.request('/services', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update(id, data) {
      return api.request(`/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete(id) {
      return api.request(`/services/${id}`, { method: 'DELETE' });
    },

    getByCategory(categoryId) {
      return api.request(`/services/category/${categoryId}`);
    },

    // Categories
    getCategoriesTree() {
      return api.request('/services/categories/tree');
    },

    getMainCategories() {
      return api.request('/services/categories/main');
    },

    getSubCategories(parentId = null) {
      const url = parentId
        ? `/services/categories/sub?parentId=${parentId}`
        : '/services/categories/sub';
      return api.request(url);
    },

    createCategory(data) {
      return api.request('/services/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateCategory(id, data) {
      return api.request(`/services/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteCategory(id) {
      return api.request(`/services/categories/${id}`, { method: 'DELETE' });
    },

    // Rooms
    getRooms() {
      return api.request('/services/rooms');
    },

    getRoomById(id) {
      return api.request(`/services/rooms/${id}`);
    },

    createRoom(data) {
      return api.request('/services/rooms', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateRoom(id, data) {
      return api.request(`/services/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteRoom(id) {
      return api.request(`/services/rooms/${id}`, { method: 'DELETE' });
    },

    getSuitableRooms(serviceId) {
      return api.request(`/services/rooms/suitable/${serviceId}`);
    },

    // Combos
    getCombos() {
      return api.request('/services/combos/all')
        .catch(error => {
          console.log('Combos endpoint not available:', error.message);
          return [];
        });
    },

    getComboById(id) {
      return api.request(`/services/combos/${id}`);
    },

    createCombo(data) {
      return api.request('/services/combos', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateCombo(id, data) {
      return api.request(`/services/combos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteCombo(id) {
      return api.request(`/services/combos/${id}`, { method: 'DELETE' });
    },

    toggleComboStatus(id, status) {
      return api.request(`/services/combos/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: status })
      });
    }
  },

  /////////////////////////////// Bookings Module ///////////////////////////////
  bookings: {
    getAll(filters = {}) {
      const url = api.buildUrl('/bookings', filters);
      return api.request(url);
    },

    getById(id) {
      return api.request(`/bookings/${id}`);
    },

    create(data) {
      return api.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update(id, data) {
      return api.request(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    updateStatus(id, status) {
      return api.request(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    delete(id) {
      return api.request(`/bookings/${id}`, { method: 'DELETE' });
    },

    checkAvailability(date, time, duration) {
      const params = new URLSearchParams({
        date,
        time,
        duration: duration.toString()
      });
      return api.request(`/bookings/check-availability?${params.toString()}`);
    },

    getAvailableSlots(date, duration = 60) {
      const params = new URLSearchParams({
        date,
        duration: duration.toString()
      });
      return api.request(`/bookings/available-slots?${params.toString()}`);
    },

    stats() {
      return api.request('/bookings/stats');
    },

    customers: {
      search(query) {
        const params = new URLSearchParams({ q: query });
        return api.request(`/bookings/customers/search?${params.toString()}`);
      }
    }
  },
  /////////////////////////////// Calendar Module ///////////////////////////////
  calendar: {
    getAll(filters = {}) {
      const url = api.buildUrl('/calendar/events', filters);
      return api.request(url);
    },

    getEvents(start, end, filters = {}) {
      const params = new URLSearchParams({ start, end });
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      return api.request(`/calendar/events?${params.toString()}`);
    },

    getById(id) {
      return api.request(`/calendar/events/${id}`);
    },

    create(data) {
      return api.request('/calendar/events', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update(id, data) {
      return api.request(`/calendar/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete(id) {
      return api.request(`/calendar/events/${id}`, { method: 'DELETE' });
    },

    updateBookingTime(id, data) {
      return api.request(`/calendar/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    getResources() {
      return api.request('/calendar/resources');
    },

    getStaffSchedule(staffId, start, end) {
      const params = new URLSearchParams({ start, end });
      return api.request(`/calendar/staff/${staffId}/schedule?${params.toString()}`);
    },

    getRoomAvailability(roomId, start, end) {
      const params = new URLSearchParams({ start, end });
      return api.request(`/calendar/rooms/${roomId}/availability?${params.toString()}`);
    },

    getHolidays(year = null) {
      const url = year ? `/calendar/holidays?year=${year}` : '/calendar/holidays';
      return api.request(url);
    },

    createHoliday(data) {
      return api.request('/calendar/holidays', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateHoliday(id, data) {
      return api.request(`/calendar/holidays/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteHoliday(id) {
      return api.request(`/calendar/holidays/${id}`, { method: 'DELETE' });
    },

    getSettings() {
      return api.request('/calendar/settings');
    },

    updateSettings(data) {
      return api.request('/calendar/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },
  /////////////////////////////// Billing Module ///////////////////////////////
  billing: {
    getAll(filters = {}) {
      const url = api.buildUrl('/billing', filters);
      return api.request(url);
    },

    getById(id) {
      return api.request(`/billing/${id}`);
    },

    create(data) {
      return api.request('/billing', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update(id, data) {
      return api.request(`/billing/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    updateStatus(id, status) {
      return api.request(`/billing/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    delete(id, options = {}) {
      // options.params can be an object of query params
      let endpoint = `/billing/${id}`;
      if (options.params) {
        endpoint = api.buildUrl(endpoint, options.params);
      }
      return api.request(endpoint, { method: 'DELETE' });
    },

    getAutoItems(filters = {}) {
      const url = api.buildUrl('/billing/auto-items/by-day', filters);
      return api.request(url);
    }
  },

  /////////////////////////////// Expenses Module ///////////////////////////////
  expenses: {
    getAll(filters = {}) {
      const url = api.buildUrl('/expenses', filters);
      return api.request(url);
    },

    getById(id) {
      return api.request(`/expenses/${id}`);
    },

    create(data) {
      return api.request('/expenses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update(id, data) {
      return api.request(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete(id) {
      return api.request(`/expenses/${id}`, { method: 'DELETE' });
    },

    getReport(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/expenses/report?${params.toString()}`);
    }
  },

  /////////////////////////////// Reports Module ///////////////////////////////
  reports: {
    getRevenue(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/revenue?${params.toString()}`);
    },

    getAppointments(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/appointments?${params.toString()}`);
    },

    getProfit(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/profit?${params.toString()}`);
    },

    getServicePerformance(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/services?${params.toString()}`);
    },

    getCustomerReports(filters = {}) {
      const url = api.buildUrl('/reports/customers', filters);
      return api.request(url);
    },

    getStaffPerformance(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/staff-performance?${params.toString()}`);
    },

    getInventoryReport(startDate, endDate) {
      const params = new URLSearchParams({ startDate, endDate });
      return api.request(`/reports/inventory?${params.toString()}`);
    },

    getFinancialSummary(period) {
      const params = new URLSearchParams({ period });
      return api.request(`/reports/financial-summary?${params.toString()}`);
    },

    exportReport(type, startDate, endDate, format = 'pdf') {
      const params = new URLSearchParams({
        type,
        startDate,
        endDate,
        format
      });
      return api.request(`/reports/export?${params.toString()}`);
    },

    getRealTimeStats() {
      return api.request('/reports/real-time-stats');
    }
  },

  /////////////////////////////// Settings Module ///////////////////////////////
  settings: {
    get() {
      return api.request('/settings');
    },

    update(data) {
      return api.request('/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    getAllUsers() {
      return api.request('/settings/users');
    },

    createUser(data) {
      return api.request('/settings/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateUser(id, data) {
      return api.request(`/settings/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteUser(id) {
      return api.request(`/settings/users/${id}`, { method: 'DELETE' });
    },

    // Business settings
    getBusinessSettings() {
      return api.request('/settings/business');
    },

    updateBusinessSettings(data) {
      return api.request('/settings/business', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // Notification settings
    getNotificationSettings() {
      return api.request('/settings/notifications');
    },

    updateNotificationSettings(data) {
      return api.request('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  /////////////////////////////// Memberships Module ///////////////////////////////
  memberships: {
    getPlans() {
      return api.request('/memberships/plans');
    },

    getMy() {
      return api.request('/memberships/me');
    },

    getForCustomer(customerId) {
      return api.request(`/memberships/customer/${customerId}`);
    },

    assign(payload) {
      return api.request('/memberships/assign', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    createPlan(plan) {
      return api.request('/memberships/plans', {
        method: 'POST',
        body: JSON.stringify(plan)
      });
    },

    updatePlan(id, plan) {
      return api.request(`/memberships/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plan)
      });
    },

    deletePlan(id) {
      return api.request(`/memberships/plans/${id}`, { method: 'DELETE' });
    },

    update(id, data) {
      return api.request(`/memberships/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete(id) {
      return api.request(`/memberships/${id}`, { method: 'DELETE' });
    },

    // Payments / Invoices
    getPayments() {
      return api.request('/memberships/payments');
    },

    getPaymentById(id) {
      return api.request(`/memberships/payments/${id}`);
    },

    createMembershipWithPayment(data) {
      return api.request('/memberships/create-with-payment', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },

  /////////////////////////////// Staff Module ///////////////////////////////
  staff: {
    getAll(filters = {}) {
      const url = api.buildUrl('/staff', filters);
      return api.request(url);
    },

    getById(id) {
      return api.request(`/staff/${id}`);
    },

    create(data) {
      return api.request('/staff', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update(id, data) {
      return api.request(`/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete(id) {
      return api.request(`/staff/${id}`, { method: 'DELETE' });
    },

    getDashboard() {
      return api.request('/staff/dashboard');
    },

    // Attendance
    getAttendance(filters = {}) {
      const url = api.buildUrl('/staff/attendance/all', filters);
      return api.request(url);
    },

    createAttendance(data) {
      return api.request('/staff/attendance/record', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    clockIn(staffId, data) {
      return api.request(`/staff/attendance/${staffId}/clock-in`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    clockOut(staffId, data) {
      return api.request(`/staff/attendance/${staffId}/clock-out`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateAttendance(id, data) {
      return api.request(`/staff/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // Leaves
    getLeaves(filters = {}) {
      const url = api.buildUrl('/staff/leaves/all', filters);
      return api.request(url);
    },

    getStaffOnLeave(date = null) {
      const url = date ? `/staff/leaves/on-leave?date=${date}` : '/staff/leaves/on-leave';
      return api.request(url);
    },

    applyLeave(staffId, data) {
      return api.request(`/staff/leaves/${staffId}/apply`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateLeaveStatus(id, status) {
      return api.request(`/staff/leaves/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    getLeaveBalance(staffId, year) {
      const url = year ? `/staff/leaves/${staffId}/balance?year=${year}` : `/staff/leaves/${staffId}/balance`;
      return api.request(url);
    },

    // Schedule
    getSchedule(filters = {}) {
      const url = api.buildUrl('/staff/schedule/all', filters);
      return api.request(url);
    },

    createSchedule(data) {
      return api.request('/staff/schedule', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateSchedule(id, data) {
      return api.request(`/staff/schedule/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // Performance
    getPerformance(staffId, filters = {}) {
      const url = api.buildUrl(`/staff/performance/${staffId}`, filters);
      return api.request(url);
    },

    updatePerformance(data) {
      return api.request('/staff/performance', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    // Commission
    getCommission(staffId, filters = {}) {
      const url = api.buildUrl(`/staff/commission/${staffId}`, filters);
      return api.request(url);
    },

    calculateCommission(staffId, month) {
      return api.request(`/staff/commission/${staffId}/calculate`, {
        method: 'POST',
        body: JSON.stringify({ month })
      });
    },

    // Settings
    getSettings(category = null, key = null) {
      let url = '/staff/settings/all';
      if (category) {
        const params = new URLSearchParams({ category });
        if (key) params.append('key', key);
        url += `?${params.toString()}`;
      }
      return api.request(url);
    },

    updateSetting(category, key, value) {
      return api.request(`/staff/settings/${category}/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      });
    },

    // Reports
    generateAttendanceReport(startDate, endDate, department = null) {
      const params = new URLSearchParams({ startDate, endDate });
      if (department) params.append('department', department);
      return api.request(`/staff/reports/attendance?${params.toString()}`);
    },

    exportAttendanceReport(startDate, endDate, format = 'excel', department = null) {
      const params = new URLSearchParams({ startDate, endDate, format });
      if (department) params.append('department', department);
      return api.request(`/staff/reports/attendance/export?${params.toString()}`);
    },

    generatePerformanceReport(periodType, startDate, endDate) {
      const params = new URLSearchParams({ periodType, startDate, endDate });
      return api.request(`/staff/reports/performance?${params.toString()}`);
    },

    generatePayrollReport(month) {
      const params = new URLSearchParams({ month });
      return api.request(`/staff/reports/payroll?${params.toString()}`);
    },

    // My profile
    getMyProfile() {
      return api.request('/staff/my/profile');
    },

    getMyAttendance(filters = {}) {
      const url = api.buildUrl('/staff/my/attendance', filters);
      return api.request(url);
    },

    getMyLeaves(filters = {}) {
      const url = api.buildUrl('/staff/my/leaves', filters);
      return api.request(url);
    },

    getMyCommission(filters = {}) {
      const url = api.buildUrl('/staff/my/commission', filters);
      return api.request(url);
    }
  },

  /////////////////////////////// Chat Module ///////////////////////////////
  chat: {
    // Conversations
    getConversations(filters = {}) {
      const url = api.buildUrl('/chat/conversations', filters);
      return api.request(url);
    },

    getConversation(id) {
      return api.request(`/chat/conversations/${id}`);
    },

    createConversation(data) {
      return api.request('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateConversation(id, data) {
      return api.request(`/chat/conversations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteConversation(id) {
      return api.request(`/chat/conversations/${id}`, { method: 'DELETE' });
    },

    // Messages
    getMessages(conversationId, filters = {}) {
      const url = api.buildUrl(`/chat/conversations/${conversationId}/messages`, filters);
      return api.request(url);
    },

    sendMessage(conversationId, message) {
      return api.request(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: message })
      });
    },

    deleteMessage(messageId) {
      return api.request(`/chat/messages/${messageId}`, { method: 'DELETE' });
    },

    markAsRead(conversationId) {
      return api.request(`/chat/conversations/${conversationId}/read`, {
        method: 'PUT'
      });
    },

    // Notifications
    getUnreadCount() {
      return api.request('/chat/notifications/unread-count');
    },

    getNotifications(filters = {}) {
      const url = api.buildUrl('/chat/notifications', filters);
      return api.request(url);
    },

    markNotificationAsRead(id) {
      return api.request(`/chat/notifications/${id}/read`, {
        method: 'PUT'
      });
    },

    markAllNotificationsAsRead() {
      return api.request('/chat/notifications/mark-all-read', {
        method: 'PUT'
      });
    },

    // Chat with AI/Customer Support
    sendChatMessage(data) {
      return api.request('/chat/ai/message', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    getChatHistory(filters = {}) {
      const url = api.buildUrl('/chat/ai/history', filters);
      return api.request(url);
    },

    clearChatHistory() {
      return api.request('/chat/ai/history', {
        method: 'DELETE'
      });
    },

    // Live chat with customers
    getCustomerChats(customerId) {
      return api.request(`/chat/customer/${customerId}`);
    },

    sendToCustomer(customerId, message) {
      return api.request(`/chat/customer/${customerId}/send`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },

    // Chat settings
    getChatSettings() {
      return api.request('/chat/settings');
    },

    updateChatSettings(data) {
      return api.request('/chat/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // Chat bots
    getChatBots() {
      return api.request('/chat/bots');
    },

    createChatBot(data) {
      return api.request('/chat/bots', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateChatBot(id, data) {
      return api.request(`/chat/bots/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteChatBot(id) {
      return api.request(`/chat/bots/${id}`, { method: 'DELETE' });
    }
  },

  /////////////////////////////// End Module ///////////////////////////////
  end: {
    // Session management
    endSession() {
      return api.request('/end/session', {
        method: 'POST',
        body: JSON.stringify({ timestamp: new Date().toISOString() })
      });
    },

    getSessionStats() {
      return api.request('/end/session/stats');
    },

    // Data cleanup
    cleanupOldData(days = 30) {
      return api.request(`/end/cleanup?days=${days}`);
    },

    // Backup and restore
    createBackup() {
      return api.request('/end/backup', { method: 'POST' });
    },

    getBackups() {
      return api.request('/end/backups');
    },

    restoreBackup(id) {
      return api.request(`/end/backup/${id}/restore`, { method: 'POST' });
    },

    deleteBackup(id) {
      return api.request(`/end/backup/${id}`, { method: 'DELETE' });
    },

    // System health
    getSystemHealth() {
      return api.request('/end/health');
    },

    getLogs(filters = {}) {
      const url = api.buildUrl('/end/logs', filters);
      return api.request(url);
    },

    // Database operations
    optimizeDatabase() {
      return api.request('/end/database/optimize', { method: 'POST' });
    },

    getDatabaseStats() {
      return api.request('/end/database/stats');
    },

    // Cache operations
    clearCache() {
      return api.request('/end/cache/clear', { method: 'POST' });
    },

    getCacheStats() {
      return api.request('/end/cache/stats');
    },

    // Maintenance
    startMaintenance() {
      return api.request('/end/maintenance/start', { method: 'POST' });
    },

    endMaintenance() {
      return api.request('/end/maintenance/end', { method: 'POST' });
    },

    getMaintenanceStatus() {
      return api.request('/end/maintenance/status');
    },

    // System settings
    getSystemSettings() {
      return api.request('/end/settings');
    },

    updateSystemSettings(data) {
      return api.request('/end/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    // Version control
    getVersionInfo() {
      return api.request('/end/version');
    },

    checkForUpdates() {
      return api.request('/end/updates/check');
    },

    applyUpdate() {
      return api.request('/end/updates/apply', { method: 'POST' });
    },

    // Emergency operations
    emergencyShutdown() {
      return api.request('/end/emergency/shutdown', { method: 'POST' });
    },

    restartSystem() {
      return api.request('/end/restart', { method: 'POST' });
    },

    // API management
    getApiKeys() {
      return api.request('/end/api/keys');
    },

    createApiKey(data) {
      return api.request('/end/api/keys', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    revokeApiKey(id) {
      return api.request(`/end/api/keys/${id}/revoke`, { method: 'POST' });
    }
  },

  /////////////////////////////// Utility Methods ///////////////////////////////
  upload: {
    file(file, onProgress = null) {
      const formData = new FormData();
      formData.append('file', file);

      return api.request('/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: onProgress
      });
    },

    image(file, onProgress = null) {
      const formData = new FormData();
      formData.append('image', file);

      return api.request('/upload/image', {
        method: 'POST',
        body: formData,
        onUploadProgress: onProgress
      });
    },

    multiple(files, onProgress = null) {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files[]', file);
      });

      return api.request('/upload/multiple', {
        method: 'POST',
        body: formData,
        onUploadProgress: onProgress
      });
    }
  },

  notifications: {
    get(filters = {}) {
      const url = api.buildUrl('/notifications', filters);
      return api.request(url);
    },

    markAsRead(id) {
      return api.request(`/notifications/${id}/read`, {
        method: 'PUT'
      });
    },

    markAllAsRead() {
      return api.request('/notifications/mark-all-read', {
        method: 'PUT'
      });
    },

    getUnreadCount() {
      return api.request('/notifications/unread-count');
    },

    delete(id) {
      return api.request(`/notifications/${id}`, { method: 'DELETE' });
    }
  },

  search: {
    global(query, filters = {}) {
      const url = api.buildUrl('/search', { q: query, ...filters });
      return api.request(url);
    },

    advanced(criteria) {
      return api.request('/search/advanced', {
        method: 'POST',
        body: JSON.stringify(criteria)
      });
    }
  },

  export: {
    csv(data, type) {
      return api.request('/export/csv', {
        method: 'POST',
        body: JSON.stringify({ data, type })
      });
    },

    excel(data, type, options = {}) {
      return api.request('/export/excel', {
        method: 'POST',
        body: JSON.stringify({ data, type, options })
      });
    },

    pdf(data, type, template = null) {
      return api.request('/export/pdf', {
        method: 'POST',
        body: JSON.stringify({ data, type, template })
      });
    }
  },

  import: {
    csv(file, mapping) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      return api.request('/import/csv', {
        method: 'POST',
        body: formData
      });
    },

    excel(file, mapping) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      return api.request('/import/excel', {
        method: 'POST',
        body: formData
      });
    }
  }
};

// Event listeners for form interactions
if (!window.__globalFormEventsRegistered) {
  document.addEventListener('open-booking-form', () => {
    if (window.bookingsModule?.showBookingForm) {
      window.bookingsModule.showBookingForm();
    } else {
      console.warn('Bookings module not loaded');
    }
  });

  document.addEventListener('open-customer-form', () => {
    if (window.customersModule?.showCustomerForm) {
      window.customersModule.showCustomerForm();
    } else {
      console.warn('Customers module not loaded');
    }
  });

  window.__globalFormEventsRegistered = true;
}

// Make API available globally
window.api = api;

// Export for Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}