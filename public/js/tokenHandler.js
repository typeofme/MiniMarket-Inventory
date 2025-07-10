// Token injection for web pages
(function() {
    // Function to get token from storage
    function getToken() {
        return localStorage.getItem('minimarket_token') || sessionStorage.getItem('authToken');
    }
    
    // Function to inject token into fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const token = getToken();
        if (token && args[1]) {
            args[1].headers = args[1].headers || {};
            args[1].headers['Authorization'] = `Bearer ${token}`;
        } else if (token) {
            args[1] = {
                ...args[1],
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...(args[1] && args[1].headers)
                }
            };
        }
        return originalFetch.apply(this, args);
    };
    
    // Function to inject token into XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._method = method;
        this._url = url;
        return originalOpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
        const token = getToken();
        if (token) {
            this.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        return originalSend.apply(this, args);
    };
    
    // For page navigation, add token to headers if possible
    if (getToken()) {
        // Store token for server-side authentication
        sessionStorage.setItem('authToken', getToken());
    }
})();

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('minimarket_token') || sessionStorage.getItem('authToken');
    const currentPath = window.location.pathname;
    
    // If we're on login page, don't do any checks to avoid redirect loops
    if (currentPath === '/login') {
        return;
    }
    
    // If no token and not on login page, redirect to login
    if (!token) {
        localStorage.setItem('redirectAfterLogin', currentPath);
        window.location.href = '/login';
        return;
    }
    
    // If token exists, let the server-side middleware handle validation
    // This avoids double-checking and redirect loops
});
