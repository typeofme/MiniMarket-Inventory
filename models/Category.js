const db = require('../config/database');

class Category {
  // Get all categories
  static async getAll() {
    try {
      return await db('categories')
        .select('*')
        .orderBy('sort_order', 'asc');
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get active categories only
  static async getActive() {
    try {
      return await db('categories')
        .select('*')
        .where('is_active', true)
        .orderBy('sort_order', 'asc');
    } catch (error) {
      console.error('Error fetching active categories:', error);
      throw error;
    }
  }

  // Get category by ID
  static async findById(id) {
    try {
      return await db('categories')
        .where('id', id)
        .first();
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  static async getById(id) {
    return await this.findById(id);
  }

  // Get category by slug
  static async findBySlug(slug) {
    try {
      return await db('categories')
        .where('slug', slug)
        .first();
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      throw error;
    }
  }

  // Create new category
  static async create(categoryData) {
    try {
      const [id] = await db('categories').insert({
        ...categoryData,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      return id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Update category
  static async update(id, categoryData) {
    try {
      await db('categories')
        .where('id', id)
        .update({
          ...categoryData,
          updated_at: db.fn.now()
        });
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete category
  static async delete(id) {
    try {
      // Check if category has products
      const productCount = await db('products')
        .where('category_id', id)
        .count('* as count')
        .first();

      if (productCount.count > 0) {
        throw new Error('Cannot delete category with existing products');
      }

      await db('categories').where('id', id).del();
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Get categories with product counts
  static async getAllWithProductCounts() {
    try {
      return await db('categories')
        .leftJoin('products', 'categories.id', 'products.category_id')
        .select(
          'categories.*',
          db.raw('COUNT(products.id) as product_count')
        )
        .groupBy('categories.id')
        .orderBy('categories.sort_order', 'asc');
    } catch (error) {
      console.error('Error fetching categories with product counts:', error);
      throw error;
    }
  }

  // Alias method for controller consistency
  static async getCategoriesWithProductCounts() {
    return await this.getAllWithProductCounts();
  }

  // Get product count for a specific category
  static async getProductCount(categoryId) {
    try {
      const result = await db('products')
        .where('category_id', categoryId)
        .count('* as count')
        .first();
      return result.count;
    } catch (error) {
      console.error('Error getting product count:', error);
      throw error;
    }
  }

  // Soft delete category (set is_active to false)
  static async softDelete(id) {
    try {
      await db('categories')
        .where('id', id)
        .update({
          is_active: false,
          updated_at: db.fn.now()
        });
      return true;
    } catch (error) {
      console.error('Error soft deleting category:', error);
      throw error;
    }
  }

  // Get products for a specific category
  static async getProducts(categoryId, limit = null) {
    try {
      let query = db('products')
        .where('category_id', categoryId)
        .orderBy('name', 'asc');

      if (limit) {
        query = query.limit(limit);
      }

      return await query;
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw error;
    }
  }

  // Toggle category active status
  static async toggleActive(id) {
    try {
      const category = await this.findById(id);
      if (!category) {
        throw new Error('Category not found');
      }

      await db('categories')
        .where('id', id)
        .update({
          is_active: !category.is_active,
          updated_at: db.fn.now()
        });

      return await this.findById(id);
    } catch (error) {
      console.error('Error toggling category status:', error);
      throw error;
    }
  }

  // Update category sort order
  static async updateSortOrder(categoryIds) {
    try {
      const updates = categoryIds.map((id, index) => 
        db('categories')
          .where('id', id)
          .update({
            sort_order: index + 1,
            updated_at: db.fn.now()
          })
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error updating sort order:', error);
      throw error;
    }
  }
}

module.exports = Category;
