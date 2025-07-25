// Supplier module for datasupply page modularization
// Handles supplier CRUD, rendering, and localStorage

(function() {
  // --- LocalStorage CRUD Utility ---
  const SUPPLIER_KEY = "minimarket_suppliers";

  function saveSupplier(supplierData) {
    const suppliers = getAllSuppliers();
    suppliers.push(supplierData);
    localStorage.setItem(SUPPLIER_KEY, JSON.stringify(suppliers));
  }

  function getAllSuppliers() {
    const data = localStorage.getItem(SUPPLIER_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  function getSupplierById(id) {
    return getAllSuppliers().find(s => s.id === id);
  }

  function updateSupplier(id, newData) {
    let suppliers = getAllSuppliers();
    suppliers = suppliers.map(s => s.id === id ? { ...s, ...newData } : s);
    localStorage.setItem(SUPPLIER_KEY, JSON.stringify(suppliers));
  }

  function deleteSupplier(id) {
    let suppliers = getAllSuppliers();
    suppliers = suppliers.filter(s => s.id !== id);
    localStorage.setItem(SUPPLIER_KEY, JSON.stringify(suppliers));
  }

  // --- Render & UI ---
  function getCategoryColor(category) {
    switch (category) {
      case 'Food & Beverage': return 'bg-green-100 text-green-800 border-green-300';
      case 'Instant Foods': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Electronics': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }
  function getStatusColor(status) {
    switch (status) {
      case 'Active': return 'bg-[#584df4]/10 text-[#584df4] border-[#584df4]';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'Inactive': return 'bg-gray-200 text-gray-500 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  function renderSuppliers(suppliers) {
    const supplierGrid = document.getElementById('supplierGrid');
    const noSuppliers = document.getElementById('noSuppliers');
    const supplierCount = document.getElementById('supplierCount');
    if (!suppliers.length) {
      supplierGrid.innerHTML = '';
      noSuppliers.classList.remove('hidden');
      supplierCount.textContent = '(0)';
      if (window.feather) feather.replace();
      return;
    }
    noSuppliers.classList.add('hidden');
    supplierCount.textContent = `(${suppliers.length})`;
    supplierGrid.innerHTML = suppliers.map(s => `
      <div class="supplier-card bg-white border rounded-2xl shadow hover:shadow-lg transition-all p-5 flex flex-col gap-3 group relative">
        <div class="flex items-center gap-3 mb-2">
          <div class="bg-[#584df4]/10 rounded-full p-3 flex items-center justify-center">
            ${s.logo ? `<img src="${s.logo}" alt="Logo" class="w-8 h-8 rounded-full object-cover">` : `<i data-feather="truck" class="w-6 h-6 text-[#584df4]"></i>`}
          </div>
          <div>
            <div class="font-bold text-lg text-[#584df4]">${s.name}</div>
            <div class="flex gap-2 mt-1">
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold border ${getCategoryColor(s.category)}">${s.category || '-'}</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(s.status)}">${s.status || '-'}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-1 text-sm">
          <div><i data-feather="user" class="inline w-4 h-4 mr-1 text-gray-400"></i> <span class="font-medium">${s.contactPerson || '-'}</span></div>
          <div><i data-feather="phone" class="inline w-4 h-4 mr-1 text-gray-400"></i> ${s.phone || '-'}</div>
          <div><i data-feather="mail" class="inline w-4 h-4 mr-1 text-gray-400"></i> ${s.email || '-'}</div>
          <div><i data-feather="map-pin" class="inline w-4 h-4 mr-1 text-gray-400"></i> ${s.city || '-'}${s.address ? ', ' + s.address : ''}</div>
          <div><i data-feather="box" class="inline w-4 h-4 mr-1 text-gray-400"></i> <span class="font-medium">${s.productsCount || 0}</span> items</div>
          <div><i data-feather="clock" class="inline w-4 h-4 mr-1 text-gray-400"></i> Last order: <span class="font-medium">${s.lastOrder ? new Date(s.lastOrder).toLocaleDateString() : '-'}</span></div>
        </div>
        <div class="flex justify-between items-center mt-3 pt-3 border-t supplier-actions">
          <button class="flex items-center gap-1 text-[#584df4] hover:underline font-semibold text-sm" onclick="editSupplier('${s.id}')">
            <i data-feather="edit-2" class="w-4 h-4"></i>Edit
          </button>
          <button class="p-2 rounded-full hover:bg-red-100 transition" onclick="deleteSupplierConfirm('${s.id}')">
            <i data-feather="trash-2" class="w-5 h-5 text-red-500"></i>
          </button>
        </div>
      </div>
    `).join('');
    if (window.feather) feather.replace();
  }

  // --- Search & Filter ---
  function searchSuppliers(query, suppliers) {
    if (!query) return suppliers;
    query = query.toLowerCase();
    return suppliers.filter(s =>
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(query)) ||
      (s.phone && s.phone.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.city && s.city.toLowerCase().includes(query))
    );
  }
  function filterSuppliers({category, status, city}, suppliers) {
    return suppliers.filter(s =>
      (!category || s.category === category) &&
      (!status || s.status === status) &&
      (!city || (s.city && s.city === city))
    );
  }

  // --- CRUD Event Handlers ---
  function handleAddSupplier(e) {
    e.preventDefault();
    const form = e.target;
    // Simple validation
    const name = form.supplierName.value.trim();
    const category = form.category.value;
    const status = form.status.value;
    const contactPerson = form.contact.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email ? form.email.value.trim() : "";
    const address = form.address ? form.address.value.trim() : "";
    const city = form.location.value.trim();
    const productsCount = parseInt(form.productCount.value) || 0;
    const lastOrder = form.lastOrder.value ? new Date(form.lastOrder.value).toISOString() : null;
    const dateAdded = new Date().toISOString();
    const logo = form.logo && form.logo.files && form.logo.files[0] ? URL.createObjectURL(form.logo.files[0]) : null;

    if (!name || !category || !status || !contactPerson || !phone || !city) {
      alert("Please fill all required fields.");
      return;
    }

    const supplier = {
      id: Date.now().toString(),
      name, category, status, contactPerson, phone, email, address, city,
      productsCount, lastOrder, dateAdded, logo
    };
    saveSupplier(supplier);
    form.reset();
    loadAndRenderSuppliers();
    alert("Supplier berhasil ditambahkan!");
  }

  window.editSupplier = function(id) {
    const supplier = getSupplierById(id);
    if (!supplier) return alert("Supplier not found.");
    // Fill form with supplier data (simple implementation)
    const form = document.getElementById('supplierForm');
    form.supplierName.value = supplier.name;
    form.category.value = supplier.category;
    form.status.value = supplier.status;
    form.contact.value = supplier.contactPerson;
    form.phone.value = supplier.phone;
    if (form.email) form.email.value = supplier.email || "";
    if (form.address) form.address.value = supplier.address || "";
    form.location.value = supplier.city;
    form.productCount.value = supplier.productsCount || 0;
    form.lastOrder.value = supplier.lastOrder ? supplier.lastOrder.split('T')[0] : "";
    form.dataset.editId = id;
    form.scrollIntoView({behavior: "smooth"});
    // Change button text
    document.getElementById('submitBtn').textContent = "Update Supplier";
    document.getElementById('formTitle').textContent = "Edit Supplier";
  }

  window.deleteSupplierConfirm = function(id) {
    if (confirm("Yakin ingin menghapus supplier ini?")) {
      deleteSupplier(id);
      loadAndRenderSuppliers();
    }
  }

  function handleEditOrAddSupplier(e) {
    const form = e.target;
    if (form.dataset.editId) {
      // Update mode
      e.preventDefault();
      const id = form.dataset.editId;
      const updated = {
        name: form.supplierName.value.trim(),
        category: form.category.value,
        status: form.status.value,
        contactPerson: form.contact.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email ? form.email.value.trim() : "",
        address: form.address ? form.address.value.trim() : "",
        city: form.location.value.trim(),
        productsCount: parseInt(form.productCount.value) || 0,
        lastOrder: form.lastOrder.value ? new Date(form.lastOrder.value).toISOString() : null,
      };
      updateSupplier(id, updated);
      form.reset();
      form.removeAttribute('data-edit-id');
      document.getElementById('submitBtn').textContent = "Add Supplier";
      document.getElementById('formTitle').textContent = "Add New Supplier";
      loadAndRenderSuppliers();
      alert("Supplier berhasil diupdate!");
    } else {
      handleAddSupplier(e);
    }
  }

  function loadAndRenderSuppliers() {
    let suppliers = getAllSuppliers();
    // Search
    const search = document.getElementById('searchInput').value.trim();
    if (search) suppliers = searchSuppliers(search, suppliers);
    // Filter
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    const city = ""; // Add city filter if needed
    suppliers = filterSuppliers({category, status, city}, suppliers);
    renderSuppliers(suppliers);
  }

  function initSupplierPage() {
    // Event listeners
    const supplierForm = document.getElementById('supplierForm');
    if (supplierForm) {
      supplierForm.addEventListener('submit', handleEditOrAddSupplier);
    }
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', loadAndRenderSuppliers);
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) categoryFilter.addEventListener('change', loadAndRenderSuppliers);
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.addEventListener('change', loadAndRenderSuppliers);
    const addFirstSupplierBtn = document.getElementById('addFirstSupplierBtn');
    if (addFirstSupplierBtn) addFirstSupplierBtn.addEventListener('click', function() {
      document.getElementById('supplierForm').scrollIntoView({behavior: "smooth"});
    });
    loadAndRenderSuppliers();
  }

  document.addEventListener('DOMContentLoaded', initSupplierPage);
})();
