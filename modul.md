## Adding Navigation Components to Your Pages

### Prerequisites

Before you begin, ensure that:

1. You have included the required CSS files in your page's `<head>` section:
   - Main stylesheet: `/css/style.css`
   - Font Awesome: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`
   - Inter font: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap`

2. The ComponentLoader script is included in your page.

### Step 1: Add HTML Structure

First, add the following HTML structure to your page. This should be placed right after the opening `<body>` tag:

```html
<body class="bg-gray-50 flex">
  
  <!-- Sidebar overlay for mobile -->
  <div class="sidebar-overlay" id="sidebar-overlay"></div>
  
  <!-- Sidebar component container -->
  <div id="sidebar-component"></div>
  
  <!-- Main content wrapper -->
  <div class="content-wrapper flex-1">
    <!-- Topnav component container -->
    <div id="topnav-component"></div>
    
    <!-- Your page content goes here -->
    <main class="p-6">
      <!-- Page-specific content -->
    </main>
  </div>
</body>
```

### Step 2: Load the Components

At the bottom of your page, before the closing `</body>` tag, add the following JavaScript code to load the components:

```html
<script src="/components/componentLoader.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Load the sidebar and topnav components
    ComponentLoader.load('shared/sidebar', 'sidebar-component');
    ComponentLoader.load('shared/topnav', 'topnav-component');
    
    // Hide the loader when all components are loaded
    ComponentLoader.onAllLoaded(function() {
      const pageLoader = document.getElementById('page-loader');
      if (pageLoader) {
        pageLoader.classList.add('opacity-0');
        setTimeout(() => {
          pageLoader.style.display = 'none';
        }, 300);
      }
    });
  });
</script>
```

### Step 3: Initialize Mobile Navigation (Optional)

If you want to support mobile navigation toggling, add the following JavaScript:

```javascript
// Add this to your script
document.addEventListener('DOMContentLoaded', function() {
  // ... existing component loading code ...
  
  // Mobile sidebar toggle
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const toggleMobileNav = () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-active');
      sidebarOverlay.classList.toggle('active');
    }
  };
  
  // Setup event listeners
  document.addEventListener('click', function(event) {
    if (event.target.matches('#mobile-menu-button') || 
        event.target.closest('#mobile-menu-button')) {
      toggleMobileNav();
    }
    
    if (event.target.matches('#sidebar-overlay')) {
      toggleMobileNav();
    }
  });
});
```

### Step 4: Verify Implementation

1. Check that both the sidebar and topnav components are loaded correctly.
2. Verify that navigation works properly at different screen sizes.
3. Test that clicking on navigation items takes you to the correct pages.

### Important CSS Classes

The layout relies on these important CSS classes:

- `content-wrapper`: Contains the main content and positions it correctly relative to the sidebar
- `sidebar-closed`: Added to the body when the sidebar is closed
- `mobile-active`: Added to the sidebar when it's activated on mobile devices

### Example Page Structure

Here's a complete example of a minimal page with navigation components:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Page</title>
  <link href="/css/style.css" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-gray-50 flex">
  <div class="sidebar-overlay" id="sidebar-overlay"></div>
  <div id="sidebar-component"></div>
  <div class="content-wrapper flex-1">
    <div id="topnav-component"></div>
    <main class="p-6">
      <h1 class="text-2xl font-bold mb-6">My Page Content</h1>
      <!-- Your page content here -->
    </main>
  </div>
  
  <script src="/components/componentLoader.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      ComponentLoader.load('shared/sidebar', 'sidebar-component');
      ComponentLoader.load('shared/topnav', 'topnav-component');
    });
  </script>
</body>
</html>
```