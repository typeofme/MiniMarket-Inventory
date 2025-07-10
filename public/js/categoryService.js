class CategoryService {
  constructor(baseUrl = '/api/categories') {
    this.baseUrl = baseUrl;
  }
  
  log(...args) {
    
  }
  
  error(...args) {
    
  }
  
  async getCategories() {
    try {
      this.log('Fetching all categories...');
      const response = await fetch(this.baseUrl);
      
      if (!response.ok) {
        this.error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      this.log(`Fetched ${data.length} categories`);
      return data;
    } catch (error) {
      this.error('Error fetching categories:', error);
      throw error;
    }
  }
  
  async getActiveCategories() {
    try {
      this.log('Fetching active categories...');
      const response = await fetch(`${this.baseUrl}/active`);
      
      if (!response.ok) {
        this.error(`Failed to fetch active categories: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch active categories');
      }
      
      const data = await response.json();
      this.log(`Fetched ${data.length} active categories`);
      return data;
    } catch (error) {
      this.error('Error fetching active categories:', error);
      throw error;
    }
  }
  
  async getCategoriesWithCounts() {
    try {
      this.log('Fetching categories with product counts...');
      const response = await fetch(`${this.baseUrl}/with-counts`);
      
      if (!response.ok) {
        this.error(`Failed to fetch categories with counts: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch categories with counts');
      }
      
      const result = await response.json();
      const data = result.data || result; // Handle both wrapped and unwrapped responses
      this.log(`Fetched ${data.length} categories with counts`);
      return data;
    } catch (error) {
      this.error('Error fetching categories with counts:', error);
      throw error;
    }
  }
  
  async getCategory(id) {
    try {
      this.log(`Fetching category with ID: ${id}`);
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          this.error(`Category not found: ${id}`);
          throw new Error('Category not found');
        }
        this.error(`Failed to fetch category: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch category');
      }
      
      const data = await response.json();
      this.log('Category fetched successfully:', data);
      return data;
    } catch (error) {
      this.error('Error fetching category:', error);
      throw error;
    }
  }
  
  async createCategory(categoryData) {
    try {
      this.log('Creating category with data:', categoryData);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });
      
      this.log(`Server response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          this.error('Error response data:', errorData);
          throw new Error(errorData.error || 'Failed to create category');
        } catch (parseError) {
          this.error('Failed to parse error response:', parseError);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      try {
        const data = await response.json();
        this.log('Category created successfully:', data);
        return data;
      } catch (parseError) {
        this.error('Failed to parse response data:', parseError);
        throw new Error('Received invalid data from server');
      }
    } catch (error) {
      this.error('Category creation error:', error);
      throw error;
    }
  }
  
  async updateCategory(id, categoryData) {
    try {
      this.log(`Updating category ${id} with data:`, categoryData);
      
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });
      
      this.log(`Server response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          this.error('Error response data:', errorData);
          throw new Error(errorData.error || 'Failed to update category');
        } catch (parseError) {
          this.error('Failed to parse error response:', parseError);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      try {
        const data = await response.json();
        this.log('Category updated successfully:', data);
        return data;
      } catch (parseError) {
        this.error('Failed to parse response data:', parseError);
        throw new Error('Received invalid data from server');
      }
    } catch (error) {
      this.error('Category update error:', error);
      throw error;
    }
  }
  
  async deleteCategory(id, soft = false) {
    try {
      this.log(`${soft ? 'Soft ' : ''}Deleting category with ID: ${id}`);
      
      const endpoint = soft ? `${this.baseUrl}/${id}/soft` : `${this.baseUrl}/${id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      
      this.log(`Server response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          this.error('Error response data:', errorData);
          throw new Error(errorData.error || 'Failed to delete category');
        } catch (parseError) {
          this.error('Failed to parse error response:', parseError);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      try {
        const data = await response.json();
        this.log('Category deleted successfully:', data);
        return data;
      } catch (parseError) {
        this.error('Failed to parse response data:', parseError);
        throw new Error('Received invalid data from server');
      }
    } catch (error) {
      this.error('Category deletion error:', error);
      throw error;
    }
  }

  async toggleActive(id) {
    try {
      this.log(`Toggling active status for category ID: ${id}`);
      
      const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
        method: 'PATCH'
      });
      
      this.log(`Server response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          this.error('Error response data:', errorData);
          throw new Error(errorData.error || 'Failed to toggle category status');
        } catch (parseError) {
          this.error('Failed to parse error response:', parseError);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      try {
        const data = await response.json();
        this.log('Category status toggled successfully:', data);
        return data;
      } catch (parseError) {
        this.error('Failed to parse response data:', parseError);
        throw new Error('Received invalid data from server');
      }
    } catch (error) {
      this.error('Category toggle error:', error);
      throw error;
    }
  }
}

// Make CategoryService available globally
if (typeof window !== 'undefined') {
  window.CategoryService = CategoryService;
}
