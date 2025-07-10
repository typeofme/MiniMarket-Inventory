// Authentication guard for protected pages
class AuthGuard {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication on page load
        this.checkAuthentication();
        
        // Set up periodic token validation
        this.setupTokenValidation();
        
        // Handle logout globally
        this.setupGlobalLogout();
    }

    checkAuthentication() {
        // Don't redirect if already on login page to avoid loops
        if (window.location.pathname === '/login') {
            return false;
        }
        
        // Check client-side authentication first
        if (!authService.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }
        
        // Load user info if authenticated
        this.loadUserInfo();
        return true;
    }

    async checkServerAuth() {
        // Only check server auth if not on login page
        if (window.location.pathname === '/login') {
            return false;
        }
        
        try {
            const response = await fetch('/api/auth/check', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    // Update client-side storage with server data
                    window.currentUser = data.user;
                    this.updateUserDisplay(data.user);
                    return true;
                }
            }
            
            this.redirectToLogin();
            return false;
        } catch (error) {
            console.error('Server auth check failed:', error);
            this.redirectToLogin();
            return false;
        }
    }

    redirectToLogin() {
        // Don't redirect if already on login page
        if (window.location.pathname === '/login') {
            return;
        }
        
        // Store current page for redirect after login
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/login';
    }

    async loadUserInfo() {
        try {
            const user = await authService.getProfile();
            if (user) {
                // Store user info globally
                window.currentUser = user;
                
                // Update any user display elements
                this.updateUserDisplay(user);
            }
        } catch (error) {
            console.error('Failed to load user info:', error);
            // If token is invalid, redirect to login
            if (error.message.includes('token') || error.message.includes('unauthorized')) {
                authService.logout();
                this.redirectToLogin();
            }
        }
    }

    updateUserDisplay(user) {
        // Update username displays
        const usernameElements = document.querySelectorAll('.username-display');
        usernameElements.forEach(el => {
            el.textContent = user.username;
        });

        // Update full name displays
        const nameElements = document.querySelectorAll('.user-fullname-display');
        nameElements.forEach(el => {
            el.textContent = `${user.first_name} ${user.last_name}`.trim() || user.username;
        });

        // Update email displays
        const emailElements = document.querySelectorAll('.user-email-display');
        emailElements.forEach(el => {
            el.textContent = user.email;
        });

        // Update role displays
        const roleElements = document.querySelectorAll('.user-role-display');
        roleElements.forEach(el => {
            el.textContent = user.role;
        });

        // Update avatar displays
        const avatarElements = document.querySelectorAll('.user-avatar-display');
        avatarElements.forEach(el => {
            if (user.avatar_url) {
                el.src = user.avatar_url;
            } else {
                // Default avatar or initials
                el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name + ' ' + user.last_name)}&background=1a73e8&color=fff`;
            }
        });
    }

    setupTokenValidation() {
        // Check token validity every 5 minutes
        setInterval(() => {
            if (!authService.isAuthenticated()) {
                this.redirectToLogin();
            }
        }, 5 * 60 * 1000);
    }

    setupGlobalLogout() {
        // Handle logout buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.logout-btn, .logout-button') || 
                e.target.closest('.logout-btn, .logout-button')) {
                e.preventDefault();
                this.handleLogout();
            }
        });

        // Handle logout from keyboard shortcut (Ctrl+L)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this.handleLogout();
            }
        });
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await authService.logout();
                // Clear session storage
                sessionStorage.removeItem('authToken');
                window.location.href = '/login';
            } catch (error) {
                console.error('Logout error:', error);
                // Force logout even if server request fails
                authService.clearToken();
                sessionStorage.removeItem('authToken');
                window.location.href = '/login';
            }
        }
    }

    // Check if user has required role
    hasRole(requiredRole) {
        if (!window.currentUser) {
            return false;
        }

        const roles = ['user', 'manager', 'admin'];
        const userRoleIndex = roles.indexOf(window.currentUser.role);
        const requiredRoleIndex = roles.indexOf(requiredRole);
        
        return userRoleIndex >= requiredRoleIndex;
    }

    // Hide elements based on role
    enforceRoleBasedAccess() {
        // Hide admin-only elements
        if (!this.hasRole('admin')) {
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => el.style.display = 'none');
        }

        // Hide manager-only elements
        if (!this.hasRole('manager')) {
            const managerElements = document.querySelectorAll('.manager-only');
            managerElements.forEach(el => el.style.display = 'none');
        }
    }
}

// Initialize auth guard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authGuard = new AuthGuard();
    
    // Enforce role-based access after user info is loaded
    if (window.currentUser) {
        window.authGuard.enforceRoleBasedAccess();
    } else {
        // Wait for user info to load
        setTimeout(() => {
            if (window.currentUser) {
                window.authGuard.enforceRoleBasedAccess();
            }
        }, 1000);
    }
});
