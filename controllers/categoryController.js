const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.getActive();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoriesWithProductCounts = async (req, res) => {
  try {
    const categories = await Category.getCategoriesWithProductCounts();
    res.json({
      success: true,
      data: categories,
      message: 'Categories with product counts retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to retrieve categories with product counts'
    });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.getById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, color, sort_order } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    const categoryData = {
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      icon: icon || 'fas fa-tag',
      color: color || '#3B82F6',
      sort_order: sort_order || 0
    };
    
    const insertId = await Category.create(categoryData);
    
    if (!insertId && insertId !== 0) {
      return res.status(500).json({ error: 'Failed to create category' });
    }
    
    const newCategory = await Category.getById(insertId);
    res.status(201).json(newCategory);
    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.getById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const { name, description, icon, color, sort_order, is_active } = req.body;
    
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
      // Update slug if name changes
      updateData.slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }
    
    if (description !== undefined) updateData.description = description.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    await Category.update(req.params.id, updateData);
    
    const updatedCategory = await Category.getById(req.params.id);
    res.json(updatedCategory);
    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.softDeleteCategory = async (req, res) => {
  try {
    const category = await Category.getById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = await Category.getProductCount(req.params.id);
    
    if (productCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category with ${productCount} products. Please reassign products first.` 
      });
    }
    
    await Category.softDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.getById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = await Category.getProductCount(req.params.id);
    
    if (productCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category with ${productCount} products. Please reassign products first.` 
      });
    }
    
    await Category.delete(req.params.id);
    res.json({ message: 'Category permanently deleted' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleCategoryStatus = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.toggleActive(categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({
      message: `Category ${category.is_active ? 'activated' : 'deactivated'} successfully`,
      category: category
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
