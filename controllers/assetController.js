const Asset = require('../models/Asset');

exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.getAll();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAsset = async (req, res) => {
  try {
    const asset = await Asset.getById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.createAsset = async (req, res) => {
  try {
    // Accept both camelCase and snake_case for compatibility
    let condition = req.body.condition;
    let status = req.body.status || req.body.assetStatus;
    // Biarkan sesuai input user, jangan diubah ke kapital/huruf kecil otomatis
    // (Jika ingin validasi, lakukan di frontend saja)
    const data = {
      name: req.body.name || req.body.assetName,
      type: req.body.type || req.body.assetType,
      placement_location: req.body.placement_location || req.body.placementLocation,
      purchase_date: req.body.purchase_date || req.body.purchaseDate,
      condition,
      status
    };
    const [id] = await Asset.create(data);
    const asset = await Asset.getById(id);
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateAsset = async (req, res) => {
  try {
    const id = req.params.id;
    let condition = req.body.condition;
    let status = req.body.status || req.body.assetStatus;
    // Biarkan sesuai input user, jangan diubah ke kapital/huruf kecil otomatis
    // (Jika ingin validasi, lakukan di frontend saja)
    const data = {
      name: req.body.name || req.body.assetName,
      type: req.body.type || req.body.assetType,
      placement_location: req.body.placement_location || req.body.placementLocation,
      purchase_date: req.body.purchase_date || req.body.purchaseDate,
      condition,
      status
    };
    await Asset.update(id, data);
    const asset = await Asset.getById(id);
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const id = req.params.id;
    await Asset.delete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Statistik asset (dashboard)
exports.getAssetStats = async (req, res) => {
  try {
    const stats = await Asset.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Filter asset by status
exports.getAssetsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const assets = await Asset.getByStatus(status);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Filter asset by condition
exports.getAssetsByCondition = async (req, res) => {
  try {
    const { condition } = req.params;
    const assets = await Asset.getByCondition(condition);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};