const ComponentLoader = (function() {
  const loadedComponents = new Set();
  const componentsToLoad = new Set();
  const callbacks = [];
  const loadingAttempts = new Map(); // Track loading attempts
  const maxRetries = 5; // Increased from 3 to 5
  let isDebugMode = false;

  // Enable debug mode for mobile or when needed
  if (typeof window !== 'undefined' && window.innerWidth <= 640) {
    isDebugMode = true;
  }

  function debugLog(...args) {
    if (isDebugMode) {
    }
  }

  function runCallbacks() {
    callbacks.forEach((callback, index) => {
      try {
        callback();
      } catch (err) {
      }
    });
  }

  function checkAllLoaded() {
    const allComponentsArray = [...componentsToLoad];
    const loadedArray = [...loadedComponents];
    
    if (componentsToLoad.size > 0 && allComponentsArray.every(comp => loadedComponents.has(comp))) {
      runCallbacks();
    }
  }

  function showFallback(targetElement, componentName, error) {
    if (targetElement) {
      targetElement.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div class="text-gray-400 mb-2"><i class="fas fa-exclamation-circle text-xl"></i></div>
          <h4 class="text-gray-700 font-medium mb-2">Component Unavailable</h4>
          <p class="text-gray-500 text-sm">Failed to load: ${componentName}</p>
          <button onclick="location.reload()" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
            Retry
          </button>
        </div>
      `;
    }
  }

  // Function to ensure a component is fully loaded
  function ensureComponentLoaded(componentName, targetId, callback) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
      if (callback) callback(false);
      return;
    }
    
    // Check if component is already loaded
    if (loadedComponents.has(componentName)) {
      if (callback) callback(true);
      return;
    }
    
    // Set a timeout to check if component loaded properly
    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element && element.children.length > 0) {
        loadedComponents.add(componentName);
        if (callback) callback(true);
      } else {
        // Try to reload the component
        load(componentName, targetId, callback);
      }
    }, 300);
  }

  function load(componentName, targetId, callback) {
    // Check if target element exists
    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
      if (callback) callback(false);
      return;
    }
    
    // Track loading attempts
    const attempts = loadingAttempts.get(componentName) || 0;
    if (attempts >= maxRetries) {
      showFallback(targetElement, componentName, 'Max retries exceeded');
      loadedComponents.add(componentName);
      checkAllLoaded();
      if (callback) callback(false);
      return;
    }
    
    loadingAttempts.set(componentName, attempts + 1);
    componentsToLoad.add(componentName);
    
    fetch(`/components/${componentName}.html`, {
      method: 'GET',
      cache: 'no-cache', // Prevent caching issues on mobile
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to load component: ${componentName}`);
        }
        return response.text();
      })
      .then(html => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.innerHTML = html;
          
          // Execute scripts
          const scriptTags = targetElement.querySelectorAll('script');
          if (scriptTags.length > 0) {
            Array.from(scriptTags).forEach((oldScript, index) => {
              try {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                  newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
              } catch (scriptError) {
                // ...removed error log...
              }
            });
          }
          
          // Ensure component is properly rendered
          setTimeout(() => {
            loadedComponents.add(componentName);
            checkAllLoaded();
            if (callback) callback(true);
          }, 50);
        } else {
          // ...removed error log...
          if (callback) callback(false);
        }
      })
      .catch(error => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          // Retry logic for mobile
          if (attempts < maxRetries) {
            setTimeout(() => {
              load(componentName, targetId, callback);
            }, 1000 * Math.min(attempts + 1, 3)); // Progressive backoff
            return;
          } else {
            showFallback(targetElement, componentName, error.message);
          }
        }
        loadedComponents.add(componentName);
        checkAllLoaded();
        if (callback) callback(false);
      });
  }

  return {
    load: function(componentName, targetId, callback) {
      load(componentName, targetId, callback);
    },
    ensureLoaded: function(componentName, targetId, callback) {
      ensureComponentLoaded(componentName, targetId, callback);
    },
    onAllLoaded: function(callback) {
      callbacks.push(callback);
      checkAllLoaded(); // Check if already loaded
    },
    // Utility methods for debugging
    getLoadedComponents: function() {
      return [...loadedComponents];
    },
    getComponentsToLoad: function() {
      return [...componentsToLoad];
    },
    isComponentLoaded: function(componentName) {
      return loadedComponents.has(componentName);
    },
    reset: function() {
      loadedComponents.clear();
      componentsToLoad.clear();
      loadingAttempts.clear();
      callbacks.length = 0;
    },
    enableDebug: function() {
      isDebugMode = true;
    }
  };
})();

// Make it globally accessible for debugging
if (typeof window !== 'undefined') {
  window.ComponentLoader = ComponentLoader;
}