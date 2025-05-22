const ComponentLoader = (function() {
  const loadedComponents = new Set();
  const componentsToLoad = new Set();
  const callbacks = [];

  function runCallbacks() {
    callbacks.forEach(callback => {
      try {
        callback();
      } catch (err) {}
    });
  }

  function checkAllLoaded() {
    if (componentsToLoad.size > 0 && [...componentsToLoad].every(comp => loadedComponents.has(comp))) {
      runCallbacks();
    }
  }

  function executeComponentScripts(targetElement) {
    const scriptTags = targetElement.querySelectorAll('script');
    scriptTags.forEach(oldScript => {
      const newScript = document.createElement('script');
      [...oldScript.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  function showFallback(targetElement) {
    if (targetElement) {
      targetElement.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div class="text-gray-400 mb-2"><i class="fas fa-exclamation-circle text-xl"></i></div>
          <h4 class="text-gray-700 font-medium mb-2">Widget Unavailable</h4>
          <p class="text-gray-500 text-sm">This component couldn't be loaded.</p>
        </div>
      `;
    }
  }

  return {
    load: function(componentName, targetId) {
      componentsToLoad.add(componentName);
      fetch(`/components/${componentName}.html`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load component: ${componentName}`);
          }
          return response.text();
        })
        .then(html => {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.innerHTML = html;
            const scriptTags = targetElement.querySelectorAll('script');
            if (scriptTags.length > 0) {
              Array.from(scriptTags).forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                  newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
              });
            }
          }
          loadedComponents.add(componentName);
          checkAllLoaded();
        })
        .catch(error => {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.innerHTML = `
              <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                <div class="text-gray-400 mb-2"><i class="fas fa-exclamation-circle text-xl"></i></div>
                <h4 class="text-gray-700 font-medium mb-2">Widget Unavailable</h4>
                <p class="text-gray-500 text-sm">This component couldn't be loaded.</p>
              </div>
            `;
          }
          loadedComponents.add(componentName);
          checkAllLoaded();
        });
    },
    onAllLoaded: function(callback) {
      callbacks.push(callback);
      checkAllLoaded();
    }
  };
})();