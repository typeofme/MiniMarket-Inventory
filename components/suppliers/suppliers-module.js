// Supplier module for datasupply page modularization
// Handles supplier CRUD, rendering, and localStorage

(function() {
  // --- LocalStorage CRUD Utility ---
  const SUPPLIER_KEY = "minimarket_suppliers";

  function saveSupplier(supplierData) {
    return fetch('/api/suppliers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(supplierData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to save supplier');
      }
      return response.json();
    });
  }

  function getAllSuppliers() {
    return fetch('/api/suppliers')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch suppliers');
        }
        return response.json();
      });
  }

  function getSupplierById(id) {
    return fetch(`/api/suppliers/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch supplier');
        }
        return response.json();
      });
  }

  function updateSupplier(id, newData) {
    return fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update supplier');
      }
      return response.json();
    });
  }

  function deleteSupplier(id) {
    return fetch(`/api/suppliers/${id}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete supplier');
      }
    });
  }

  // --- Render & UI ---
  function getCategoryColor(category) {
    switch (category) {
      case 'Food & Beverage': return 'bg-green-100 text-green-800 border-green-300';
      case 'Instant Foods': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Dairy Products': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Snacks & Confectionery': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Household Items': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Personal Care': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'Electronics': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Office Supplies': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Cleaning Supplies': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Frozen Foods': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'Fresh Produce': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Beverages': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }
  function getStatusColor(status) {
    const normalizedStatus = status ? status.toLowerCase() : '';
    switch (normalizedStatus) {
      case 'active': return 'bg-[#584df4]/10 text-[#584df4] border-[#584df4]';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'inactive': return 'bg-gray-200 text-gray-500 border-gray-300';
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
          <div><i data-feather="user" class="inline w-4 h-4 mr-1 text-gray-400"></i> <span class="font-medium">${s.contact_person || '-'}</span></div>
          <div><i data-feather="phone" class="inline w-4 h-4 mr-1 text-gray-400"></i> ${s.phone || '-'}</div>
          <div><i data-feather="mail" class="inline w-4 h-4 mr-1 text-gray-400"></i> ${s.email || '-'}</div>
          <div><i data-feather="map-pin" class="inline w-4 h-4 mr-1 text-gray-400"></i> ${s.city || '-'}${s.address ? ', ' + s.address : ''}</div>
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
      (s.contact_person && s.contact_person.toLowerCase().includes(query)) ||
      (s.phone && s.phone.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.city && s.city.toLowerCase().includes(query))
    );
  }
  function filterSuppliers({category, status, city}, suppliers) {
    return suppliers.filter(s => {
      const categoryMatch = !category || s.category === category;
      const statusMatch = !status || (s.status && s.status.toLowerCase() === status.toLowerCase());
      const cityMatch = !city || (s.city && s.city === city);
      return categoryMatch && statusMatch && cityMatch;
    });
  }

  // --- CRUD Event Handlers ---
  function handleAddSupplier(e) {
    e.preventDefault();
    const form = e.target;

    // Collect form data
    const supplierData = {
      name: form.supplierName.value.trim(),
      category: form.category.value,
      status: form.status.value,
      contact_person: form.contact.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email ? form.email.value.trim() : "",
      address: form.address ? form.address.value.trim() : "",
      city: form.location.value.trim()
    };

    // Send data to backend
    fetch('/api/suppliers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(supplierData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to add supplier');
      }
      return response.json();
    })
    .then(data => {
      alert('Supplier added successfully!');
      form.reset();
      loadAndRenderSuppliers();
    })
    .catch(error => {
      console.error(error);
      alert('An error occurred while adding the supplier.');
    });
  }

  function getSupplierById(id) {
    return fetch(`/api/suppliers/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch supplier');
        }
        return response.json();
      });
  }

  window.editSupplier = function(id) {
    getSupplierById(id)
      .then(supplier => {
        if (!supplier) {
          alert("Supplier not found.");
          return;
        }
        // Fill form with supplier data
        const form = document.getElementById('supplierForm');
        form.supplierName.value = supplier.name || '';
        form.category.value = supplier.category || '';
        form.status.value = supplier.status || '';
        form.contact.value = supplier.contact_person || '';
        form.phone.value = supplier.phone || '';
        form.email.value = supplier.email || '';
        form.address.value = supplier.address || '';
        form.location.value = supplier.city || '';
        form.dataset.editId = id;
        form.scrollIntoView({behavior: "smooth"});
        // Change button text
        document.getElementById('submitBtn').textContent = "Update Supplier";
        document.getElementById('formTitle').textContent = "Edit Supplier";
      })
      .catch(error => {
        console.error(error);
        alert("Failed to load supplier data.");
      });
  }

  window.deleteSupplierConfirm = function(id) {
    if (confirm("Are you sure you want to delete this supplier?")) {
      deleteSupplier(id)
        .then(() => {
          loadAndRenderSuppliers();
          alert("Supplier deleted successfully!");
        })
        .catch(error => {
          console.error(error);
          alert("Failed to delete supplier.");
        });
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
        contact_person: form.contact.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email ? form.email.value.trim() : "",
        address: form.address ? form.address.value.trim() : "",
        city: form.location.value.trim()
      };
      
      updateSupplier(id, updated)
        .then(() => {
          form.reset();
          form.removeAttribute('data-edit-id');
          document.getElementById('submitBtn').textContent = "Add Supplier";
          document.getElementById('formTitle').textContent = "Add New Supplier";
          loadAndRenderSuppliers();
          alert("Supplier updated successfully!");
        })
        .catch(error => {
          console.error(error);
          alert("Failed to update supplier.");
        });
    } else {
      handleAddSupplier(e);
    }
  }

  function loadAndRenderSuppliers() {
    getAllSuppliers()
      .then(suppliers => {
        // Search
        const search = document.getElementById('searchInput').value.trim();
        if (search) suppliers = searchSuppliers(search, suppliers);
        // Filter
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        const city = ""; // Add city filter if needed
        suppliers = filterSuppliers({category, status, city}, suppliers);
        renderSuppliers(suppliers);
      })
      .catch(error => {
        console.error(error);
        alert('Failed to load suppliers.');
      });
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
