// Authentication Service for MiniMarket
(function() {
  'use strict';
  
  // Prevent multiple declarations
  if (typeof window.authService !== 'undefined') {
    return;
  }

  class AuthService {
    constructor() {
      this.baseUrl = '/api/auth';
      this.tokenKey = 'minimarket_token';
      this.userKey = 'minimarket_user';
    }

    // Login
    async login(username, password) {
      try {
        const response = await fetch(`${this.baseUrl}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        // Check if login was successful (either data.success is true OR response is ok with token)
        if (response.ok && (data.success || data.token)) {
          // Store token and user info
          this.setToken(data.token);
          if (data.user) {
            this.setUser(data.user);
          }
          return { success: true, user: data.user, token: data.token };
        } else {
          return { success: false, message: data.message || 'Login failed' };
        }
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error' };
      }
    }

    // Register
    async register(userData) {
      try {
        const response = await fetch(`${this.baseUrl}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Store token and user info
          this.setToken(data.token);
          if (data.user) {
            this.setUser(data.user);
          }
          return { success: true, user: data.user };
        } else {
          return { success: false, message: data.message || 'Registration failed' };
        }
      } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Network error' };
      }
    }

    // Logout
    async logout() {
      try {
        const token = this.getToken();
        if (token) {
          await fetch(`${this.baseUrl}/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Always clear local storage
        this.clearToken();
        this.clearUser();
      }
    }

    // Get user profile
    async getProfile() {
      try {
        const token = this.getToken();
        if (!token) {
          throw new Error('No token available');
        }

        const response = await fetch(`${this.baseUrl}/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            this.setUser(data.user);
            return data.user;
          }
        }
        
        throw new Error('Failed to fetch profile');
      } catch (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
    }

    // Update user profile
    async updateProfile(updateData) {
      try {
        const token = this.getToken();
        if (!token) {
          throw new Error('No token available');
        }

        const response = await fetch(`${this.baseUrl}/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (data.user) {
            this.setUser(data.user);
          }
          return { success: true, user: data.user };
        } else {
          return { success: false, message: data.message || 'Update failed' };
        }
      } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, message: 'Network error' };
      }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
      try {
        const token = this.getToken();
        if (!token) {
          throw new Error('No token available');
        }

        const response = await fetch(`${this.baseUrl}/change-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        return {
          success: response.ok && data.success,
          message: data.message || (response.ok ? 'Password changed successfully' : 'Password change failed')
        };
      } catch (error) {
        console.error('Password change error:', error);
        return { success: false, message: 'Network error' };
      }
    }

    // Token management
    setToken(token) {
      localStorage.setItem(this.tokenKey, token);
    }

    getToken() {
      return localStorage.getItem(this.tokenKey);
    }

    clearToken() {
      localStorage.removeItem(this.tokenKey);
    }

    // User management
    setUser(user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    getUser() {
      const userStr = localStorage.getItem(this.userKey);
      return userStr ? JSON.parse(userStr) : null;
    }

    clearUser() {
      localStorage.removeItem(this.userKey);
    }

    // Check if user is authenticated
    isAuthenticated() {
      const token = this.getToken();
      if (!token) return false;

      try {
        // Basic token format validation (JWT has 3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        // Decode the payload to check expiration
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        return payload.exp > now;
      } catch (error) {
        console.error('Token validation error:', error);
        return false;
      }
    }

    // Get current user role
    getUserRole() {
      const user = this.getUser();
      return user ? user.role : null;
    }

    // Check if user has specific role
    hasRole(role) {
      const userRole = this.getUserRole();
      if (!userRole) return false;

      const roles = ['user', 'manager', 'admin'];
      const userRoleIndex = roles.indexOf(userRole);
      const requiredRoleIndex = roles.indexOf(role);
      
      return userRoleIndex >= requiredRoleIndex;
    }

    // Get current user profile
    async getCurrentUser() {
      try {
        const response = await fetch(`${this.baseUrl}/profile`, {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            this.setUser(data.user);
            return data.user;
          } else if (data.user) {
            // Handle case where response doesn't have success flag
            this.setUser(data.user);
            return data.user;
          }
        }
        
        throw new Error('Failed to fetch profile');
      } catch (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
    }

    // Setup automatic token injection for fetch requests
    setupTokenInjection() {
      const originalFetch = window.fetch;
      const self = this;
      
      window.fetch = function(url, options = {}) {
        const token = self.getToken();
        
        // Only add auth header to API requests
        if (token && (url.startsWith('/api/') || url.includes('/api/'))) {
          options.headers = options.headers || {};
          if (!options.headers.Authorization) {
            options.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        return originalFetch(url, options);
      };
    }
  }

  // Create global instance
  window.authService = new AuthService();
  window.AuthService = window.authService; // Create alias for consistency
  
  // Setup automatic token injection
  window.authService.setupTokenInjection();
})();
