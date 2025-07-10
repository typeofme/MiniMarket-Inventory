class AssetService {
  constructor(baseUrl = '/api/asset') {
    this.baseUrl = baseUrl;
    console.log('AssetService initialized with baseUrl:', this.baseUrl);
  }

  async getAssets() {
    console.log('Fetching assets from:', this.baseUrl);
    const res = await fetch(this.baseUrl);
    console.log('Response status:', res.status);
    if (!res.ok) throw new Error('Failed to fetch assets');
    const data = await res.json();
    console.log('Assets data:', data);
    return data;
  }

  async getAsset(id) {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch asset');
    return res.json();
  }

  async createAsset(data) {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create asset');
    return res.json();
  }

  async updateAsset(id, data) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update asset');
    return res.json();
  }

  async deleteAsset(id) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete asset');
    return res.json();
  }

  async getAssetStats() {
    const res = await fetch(`${this.baseUrl}/stats`);
    if (!res.ok) throw new Error('Failed to fetch asset statistics');
    return res.json();
  }

  async getAssetsByStatus(status) {
    const res = await fetch(`${this.baseUrl}/status/${status}`);
    if (!res.ok) throw new Error('Failed to fetch assets by status');
    return res.json();
  }

  async getAssetsByCondition(condition) {
    const res = await fetch(`${this.baseUrl}/condition/${condition}`);
    if (!res.ok) throw new Error('Failed to fetch assets by condition');
    return res.json();
  }
}

window.assetService = new AssetService();