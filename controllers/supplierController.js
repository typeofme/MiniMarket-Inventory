const Supplier = require('../models/Supplier');
const { logProductAction } = require('./logController');

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.getAll();
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

// Get supplier by ID
exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.getById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
};

// Create supplier
exports.createSupplier = async (req, res) => {
  try {
    const {
      name,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      category,
      status,
      notes
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    
    const supplierData = {
      name,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      category,
      status: status || 'Active',
      notes,
      product_count: 0
    };
    
    const [supplierId] = await Supplier.create(supplierData);
    const supplier = await Supplier.getById(supplierId);
    
    // Log supplier creation
    const userId = req.user?.userId;
    if (userId) {
      await logProductAction(
        'create',
        userId,
        'supplier',
        supplierId,
        null,
        supplierData,
        `Created supplier: ${name}`,
        req,
        name
      );
    }
    
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const supplier = await Supplier.getById(supplierId);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const {
      name,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      category,
      status,
      notes
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    
    const supplierData = {
      name,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      category,
      status,
      notes
    };
    
    await Supplier.update(supplierId, supplierData);
    const updatedSupplier = await Supplier.getById(supplierId);
    
    // Log supplier update
    const userId = req.user?.userId;
    if (userId) {
      await logProductAction(
        'update',
        userId,
        'supplier',
        supplierId,
        supplier,
        supplierData,
        `Updated supplier: ${name}`,
        req,
        name
      );
    }
    
    res.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const supplier = await Supplier.getById(supplierId);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    // Check if supplier has associated orders
    const supplierWithOrders = await Supplier.getWithOrderHistory(supplierId);
    if (supplierWithOrders.orders && supplierWithOrders.orders.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete supplier with associated orders',
        message: 'This supplier has existing orders. Please delete the orders first or deactivate the supplier instead.'
      });
    }
    
    await Supplier.delete(supplierId);
    
    // Log supplier deletion
    const userId = req.user?.userId;
    if (userId) {
      await logProductAction(
        'delete',
        userId,
        'supplier',
        supplierId,
        supplier,
        null,
        `Deleted supplier: ${supplier.name}`,
        req,
        supplier.name
      );
    }
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
};

// Get supplier with order history
exports.getSupplierWithOrders = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const supplierWithOrders = await Supplier.getWithOrderHistory(supplierId);
    
    if (!supplierWithOrders) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(supplierWithOrders);
  } catch (error) {
    console.error('Error fetching supplier with orders:', error);
    res.status(500).json({ error: 'Failed to fetch supplier with orders' });
  }
};

// Get supplier statistics
exports.getSupplierStats = async (req, res) => {
  try {
    const stats = await Supplier.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching supplier statistics:', error);
    res.status(500).json({ error: 'Failed to fetch supplier statistics' });
  }
};

// Search suppliers
exports.searchSuppliers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const suppliers = await Supplier.search(query);
    res.json(suppliers);
  } catch (error) {
    console.error('Error searching suppliers:', error);
    res.status(500).json({ error: 'Failed to search suppliers' });
  }
};

// Get suppliers by status
exports.getSuppliersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const suppliers = await Supplier.getByStatus(status);
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers by status:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers by status' });
  }
};

// Get suppliers by category
exports.getSuppliersByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const suppliers = await Supplier.getByCategory(category);
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers by category:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers by category' });
  }
}; 