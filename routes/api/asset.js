const express = require('express');
const router = express.Router();
const assetController = require('../../controllers/assetController');
const db = require('../../config/database');


// Statistik dan filter
router.get('/stats', assetController.getAssetStats);
router.get('/status/:status', assetController.getAssetsByStatus);
router.get('/condition/:condition', assetController.getAssetsByCondition);

// CRUD utama
router.get('/', assetController.getAssets);
router.get('/:id', assetController.getAsset);
router.post('/', assetController.createAsset);
router.put('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

module.exports = router;
