// Authentication utilities
const auth = {
  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Set current user
  setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Clear user session
  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Redirect based on auth status
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/';
    }
  },

  // Redirect if already authenticated
  requireGuest() {
    if (this.isAuthenticated()) {
      window.location.href = '/app.html';
    }
  },

  // Get user role
  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  },

  // Check if user has role
  hasRole(role) {
    const userRole = this.getUserRole();
    return userRole === role;
  },

  // Check if user has any of the roles
  hasAnyRole(...roles) {
    const userRole = this.getUserRole();
    return roles.includes(userRole);
  }
};