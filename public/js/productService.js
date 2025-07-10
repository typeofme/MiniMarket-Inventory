class ProductService {
  constructor(baseUrl = '/api/products') {
    this.baseUrl = baseUrl;
    this.debug = true; // Set to true to enable debug logs
  }
  
  log(...args) {
    if (this.debug) {
      
    }
  }
  
  error(...args) {
    
  }
  
  async getProducts() {
    try {
      this.log('Fetching all products...');
      const response = await fetch(this.baseUrl);
      
      if (!response.ok) {
        this.error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      // Ensure IDs are strings for consistent comparison
      const processedData = data.map(product => {
        // Make a copy to avoid mutating the original
        const processedProduct = { ...product };
        
        // Ensure ID is a string
        if (processedProduct.id !== undefined) {
          processedProduct.id = String(processedProduct.id);
        }
        
        return processedProduct;
      });
      
      this.log(`Fetched ${processedData.length} products with normalized IDs`);
      return processedData;
    } catch (error) {
      this.error('Error fetching products:', error);
      throw error;
    }
  }
  
  async getProduct(id) {
    try {
      this.log(`Fetching product with ID: ${id}`);
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        this.error(`Failed to fetch product: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch product');
      }
      
      const data = await response.json();
      this.log('Product fetched:', data);
      return data;
    } catch (error) {
      this.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }
  
  async createProduct(productData) {
    try {
      let requestBody;
      let headers = {};
      
      if (productData instanceof FormData) {
        requestBody = productData;
        this.log('Creating product with FormData');
        // Log form data values
        for (const pair of productData.entries()) {
          this.log(`Form data: ${pair[0]}: ${pair[1]}`);
        }
      } else {
        requestBody = JSON.stringify(productData);
        headers = { 'Content-Type': 'application/json' };
        this.log('Creating product with JSON data:', productData);
      }
      
      this.log('Sending request to create product...');
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: headers,
        body: requestBody
      });
      
      this.log(`Server response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          this.error('Error response data:', errorData);
          throw new Error(errorData.error || 'Failed to create product');
        } catch (parseError) {
          this.error('Failed to parse error response:', parseError);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      try {
        const data = await response.json();
        this.log('Product created successfully:', data);
        return data;
      } catch (parseError) {
        this.error('Failed to parse response data:', parseError);
        throw new Error('Received invalid data from server');
      }
    } catch (error) {
      this.error('Product creation error:', error);
      throw error;
    }
  }
  
  async updateProduct(id, productData) {
    try {
      let requestBody;
      let headers = {};
      let url = `${this.baseUrl}/${id}`;
      
      if (productData instanceof FormData) {
        requestBody = productData;
      } else {
        requestBody = JSON.stringify(productData);
        headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: requestBody
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
  
  async deleteProduct(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to delete product (${response.status})`);
        } catch (jsonError) {
          // If we can't parse the error as JSON, use status text
          throw new Error(`Failed to delete product: ${response.status} ${response.statusText}`);
        }
      }
      
      return await response.json();
    } catch (error) {
      this.error('Error in deleteProduct:', error);
      throw error;
    }
  }
}

window.productService = new ProductService();