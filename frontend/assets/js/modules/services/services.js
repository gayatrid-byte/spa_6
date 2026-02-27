////////////////////////////

// Enhanced Services module with Main/Sub Categories, Rooms, and Service Combos
let services = [];
let mainCategories = [];
let subCategories = [];
let rooms = [];
let serviceCombos = [];
let currentView = 'services'; // services, categories, rooms, combos
let currentCategoryView = 'main'; // main, sub

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// API HELPER FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Helper function for API fallbacks
const apiHelper = {
  async getCategoriesWithFallback() {
    try {
      // First try to get categories tree
      const categories = await api.services.getCategoriesTree();
      // Transform the response if needed
      if (categories && categories.length > 0) {
        return categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          display_order: cat.display_order,
          is_active: cat.is_active,
          sub_categories: cat.sub_categories || []
        }));
      }
      return categories || [];
    } catch (error) {
      console.log('Categories tree not available, using fallback:', error);
      try {
        // Fallback to main categories
        const mainCats = await api.services.getMainCategories();
        // Populate sub_categories for each main when tree API isn't available
        const withSubs = await Promise.all(mainCats.map(async (cat) => {
          try {
            const subs = await api.services.getSubCategories(cat.id);
            return { ...cat, sub_categories: Array.isArray(subs) ? subs : [] };
          } catch (e) {
            return { ...cat, sub_categories: [] };
          }
        }));
        return withSubs;
      } catch (error2) {
        console.error('Both category methods failed:', error2);
        return [];
      }
    }
  },
  
  async getSubCategoriesWithFallback(parentId = null) {
    try {
      if (parentId) {
        return await api.services.getSubCategories(parentId);
      } else {
        // Get all sub-categories from the tree
        const categories = await this.getCategoriesWithFallback();
        let allSubs = [];
        categories.forEach(cat => {
          if (cat.sub_categories && Array.isArray(cat.sub_categories)) {
            // Add parent_name to each sub-category
            const subsWithParent = cat.sub_categories.map(sc => ({
              ...sc,
              parent_name: cat.name,
              parent_id: cat.id
            }));
            allSubs.push(...subsWithParent);
          }
        });
        return allSubs;
      }
    } catch (error) {
      console.log('getSubCategories failed, using empty array:', error);
      return [];
    }
  },
  
  async getCombosWithFallback() {
    try {
      // Try services.getCombos directly
      return await api.services.getCombos();
    } catch (error) {
      console.log('Combos API not available:', error);
      return [];
    }
  },
  
  async createComboWithFallback(data) {
    try {
      return await api.services.createCombo(data);
    } catch (error) {
      console.log('Combo create API not available:', error);
      throw new Error('Combo API not available: ' + error.message);
    }
  },
  
  async updateComboWithFallback(comboId, data) {
    try {
      return await api.services.updateCombo(comboId, data);
    } catch (error) {
      console.log('Combo update API not available:', error);
      throw new Error('Combo API not available: ' + error.message);
    }
  },
  
  async deleteComboWithFallback(comboId) {
    try {
      return await api.services.deleteCombo(comboId);
    } catch (error) {
      console.log('Combo delete API not available:', error);
      throw new Error('Combo API not available: ' + error.message);
    }
  },
  
  async getComboByIdWithFallback(comboId) {
    try {
      return await api.services.getComboById(comboId);
    } catch (error) {
      console.log('Combo getById API not available:', error);
      throw new Error('Combo API not available: ' + error.message);
    }
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MAIN RENDER FUNCTION
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function render(container) {
  try {
    // Show loading state
    container.innerHTML = `
      <div class="card">
        <div class="text-center p-5">
          <div class="spinner"></div>
          <p class="mt-3">Loading services data...</p>
        </div>
      </div>
    `;
    
    // Load all necessary data with helper
    let servicesData = [];
    let mainCategoriesData = [];
    let roomsData = [];
    let combosData = [];
    
    try {
      servicesData = await api.services.getAll();
      console.log('Services loaded:', servicesData);
      console.log('Sample service:', servicesData[0]);
    } catch (error) {
      console.error('Error loading services:', error);
      utils.showToast('Failed to load services', 'error');
    }
    
    try {
      mainCategoriesData = await apiHelper.getCategoriesWithFallback();
    } catch (error) {
      console.error('Error loading categories:', error);
      utils.showToast('Failed to load categories', 'error');
    }
    
    try {
      roomsData = await api.services.getRooms();
    } catch (error) {
      console.error('Error loading rooms:', error);
      utils.showToast('Failed to load rooms', 'error');
    }
    
    try {
      combosData = await apiHelper.getCombosWithFallback();
    } catch (error) {
      console.log('Combos feature might not be implemented yet:', error);
      // Continue without combos - this is expected if backend doesn't have the endpoint yet
    }
    
    services = servicesData;
    mainCategories = mainCategoriesData || [];
    rooms = roomsData;
    serviceCombos = combosData || [];
    
    // Extract all sub-categories from tree
    subCategories = [];
    mainCategories.forEach(mainCat => {
      if (mainCat.sub_categories && Array.isArray(mainCat.sub_categories)) {
        subCategories.push(...mainCat.sub_categories.map(sc => ({
          ...sc,
          parent_name: mainCat.name
        })));
      }
    });
    
    // Render the main view
    container.innerHTML = `
      <div class="card mb-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3><i class="fas fa-spa"></i> Spa Services Management</h3>
          <div class="d-flex gap-2">
            <button id="viewServicesBtn" class="btn ${currentView === 'services' ? 'btn-primary' : 'btn-outline'}">
              <i class="fas fa-concierge-bell"></i> Services
            </button>
            <button id="viewCategoriesBtn" class="btn ${currentView === 'categories' ? 'btn-primary' : 'btn-outline'}">
              <i class="fas fa-tags"></i> Categories
            </button>
            <button id="viewRoomsBtn" class="btn ${currentView === 'rooms' ? 'btn-primary' : 'btn-outline'}">
              <i class="fas fa-door-closed"></i> Rooms
            </button>
            <button id="viewCombosBtn" class="btn ${currentView === 'combos' ? 'btn-primary' : 'btn-outline'}">
              <i class="fas fa-gift"></i> Combos
            </button>
          </div>
        </div>
        
        <div id="servicesContentArea">
          ${currentView === 'services' ? renderServicesView() : 
            currentView === 'categories' ? renderCategoriesView() : 
            currentView === 'rooms' ? renderRoomsView() :
            renderCombosView()}
        </div>
      </div>
    `;
    
    // Attach event listeners
    attachEventListeners(container);
    
  } catch (error) {
    console.error('Error loading services module:', error);
    container.innerHTML = `
      <div class="card">
        <h3>Error Loading Module</h3>
        <p>Failed to load services data: ${error.message}</p>
        <button class="btn btn-primary mt-2" onclick="window.location.hash='services'; window.location.reload();">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>
    `;
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SERVICES VIEW FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function renderServicesView() {
  const activeServices = services.filter(s => s.is_active == 1 || s.is_active === true);
  const inactiveServices = services.filter(s => s.is_active == 0 || s.is_active === false);
  
  return `
    <div class="table-container">
      <div class="table-header">
        <h2 class="table-title">Spa Services</h2>
        <div class="d-flex gap-2">
          <select id="filterMainCategory" class="form-control" style="min-width: 180px;">
            <option value="">All Main Categories</option>
            ${mainCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
          </select>
          <select id="filterCategory" class="form-control" style="min-width: 200px;">
            <option value="">All Categories</option>
            ${mainCategories.map(cat => `
              <optgroup label="${cat.name}">
                ${(cat.sub_categories || []).filter(sc => sc.is_active !== false).map(sc => `
                  <option value="${sc.id}">${sc.name}</option>
                `).join('')}
              </optgroup>
            `).join('')}
          </select>
          <select id="filterStatus" class="form-control">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button id="addServiceBtn" class="btn btn-primary">
            <i class="fas fa-plus"></i> Add Service
          </button>
        </div>
      </div>
      
      <div class="tabs">
        <div class="tab-header">
                </div>
        <div class="tab-content">
          <div class="tab-pane active" id="tab-active">
            ${renderServicesTable(activeServices)}
          </div>
          <div class="tab-pane" id="tab-inactive">
            ${renderServicesTable(inactiveServices)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderServicesTable(servicesList) {
  if (servicesList.length === 0) {
    return '<p class="text-center">No services found</p>';
  }
  
  return `
    <table class="services-table">
      <thead>
        <tr>
          <th>Service Name</th>
          <th>Category</th>
          <th>Duration</th>
          <th>Price</th>
          <th>Rooms</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${servicesList.map(service => {
          // Find category info
          let categoryName = 'N/A';
          let mainCategoryName = 'N/A';
          
          // First try to find in sub-categories
          const subCat = subCategories.find(sc => sc.id === service.category_id);
          if (subCat) {
            categoryName = subCat.name;
            mainCategoryName = subCat.parent_name || 'N/A';
          } else {
            // Fallback to main category
            const mainCat = mainCategories.find(mc => mc.id === service.main_category_id);
            if (mainCat) {
              categoryName = mainCat.name;
              mainCategoryName = mainCat.name;
            }
          }
          
          // Get rooms for this service
          const serviceRooms = service.room_ids ? 
            rooms.filter(r => service.room_ids.includes(r.id)) : [];
          
          console.log(`Service ${service.name}:`, {
            room_ids: service.room_ids,
            rooms: service.rooms,
            serviceRooms: serviceRooms,
            availableRooms: rooms
          });
          
          return `
            <tr>
              <td>
                <strong><i class="fas fa-spa"></i> ${service.name}</strong><br>
                <small class="text-muted">${service.short_description || ''}</small>
              </td>
              <td>
                <small>${categoryName}</small><br>
                <small class="text-muted">${mainCategoryName}</small>
              </td>
              <td>${service.duration_minutes || service.duration || 0} min</td>
              <td>${utils.formatCurrency(service.base_price || service.price || 0)}</td>
              <td>
                ${serviceRooms.length > 0 ? 
                  serviceRooms.slice(0, 2).map(r => `
                    <span class="badge badge-secondary mb-1">${r.name}</span>
                  `).join('') : 
                  '<small class="text-muted">No rooms</small>'
                }
                ${serviceRooms.length > 2 ? `<small>+${serviceRooms.length - 2} more</small>` : ''}
              </td>
              <td>
                <span class="badge badge-${service.is_active ? 'success' : 'danger'}">
                  ${service.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline" onclick="servicesModule.editService(${service.id})" 
                    title="Edit service">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-info" onclick="servicesModule.viewServiceDetails(${service.id})"
                    title="View service details">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="servicesModule.deleteService(${service.id})"
                    title="Delete service">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CATEGORIES VIEW FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function renderCategoriesView() {
  return `
    <div class="table-container">
      <div class="table-header">
        <h2 class="table-title">Service Categories</h2>
        <div class="d-flex gap-2">
          <div class="btn-group" role="group">
            <button type="button" id="viewMainCategories" class="btn ${currentCategoryView === 'main' ? 'btn-primary' : 'btn-outline'}">
              <i class="fas fa-layer-group"></i> Main Categories
            </button>
            <button type="button" id="viewSubCategories" class="btn ${currentCategoryView === 'sub' ? 'btn-primary' : 'btn-outline'}">
              <i class="fas fa-list"></i> Sub-Categories
            </button>
          </div>
          <button id="addMainCategoryBtn" class="btn btn-primary">
            <i class="fas fa-plus"></i> Add Main Category
          </button>
          <button id="addSubCategoryBtn" class="btn btn-success">
            <i class="fas fa-plus-circle"></i> Add Sub-Category
          </button>
        </div>
      </div>
      
      <div id="categoriesContent" class="mt-3">
        ${currentCategoryView === 'main' ? renderMainCategoriesTable() : renderSubCategoriesTable()}
      </div>
    </div>
  `;
}

function renderMainCategoriesTable() {
  if (mainCategories.length === 0) {
    return '<p class="text-center">No main categories found. Add your first main category!</p>';
  }
  
  return `
    <table class="categories-table">
      <thead>
        <tr>
          <th>Category Name</th>
          <th>Description</th>
          <th>Display Order</th>
          <th>Sub-Categories</th>
          <th>Services</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${mainCategories.map(category => {
          const subCatCount = category.sub_categories ? category.sub_categories.length : 0;
          const serviceCount = services.filter(s => s.main_category_id === category.id).length;
          
          return `
            <tr>
              <td>
                <strong><i class="fas fa-folder"></i> ${category.name}</strong>
              </td>
              <td>${category.description || 'No description'}</td>
              <td>${category.display_order || 0}</td>
              <td>
                <span class="badge badge-info">${subCatCount} sub-categories</span>
              </td>
              <td>
                <span class="badge badge-primary">${serviceCount} services</span>
              </td>
              <td>
                <span class="badge badge-${category.is_active ? 'success' : 'danger'}">
                  ${category.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline" onclick="servicesModule.editMainCategory(${category.id})" 
                    title="Edit main category">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-info" onclick="servicesModule.viewCategoryDetails(${category.id})"
                    title="View category details">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="servicesModule.deleteMainCategory(${category.id})"
                    title="Delete category" ${subCatCount > 0 ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                ${subCatCount > 0 ? '<small class="text-muted d-block">Remove sub-categories first</small>' : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderSubCategoriesTable() {
  if (subCategories.length === 0) {
    return '<p class="text-center">No sub-categories found. Add your first sub-category!</p>';
  }
  
  return `
    <table class="categories-table">
      <thead>
        <tr>
          <th>Sub-Category Name</th>
          <th>Parent Category</th>
          <th>Description</th>
          <th>Display Order</th>
          <th>Services</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${subCategories.map(subCat => {
          const serviceCount = services.filter(s => s.category_id === subCat.id).length;
          
          return `
            <tr>
              <td>
                <strong><i class="fas fa-list"></i> ${subCat.name}</strong>
              </td>
              <td>
                <span class="badge badge-secondary">${subCat.parent_name || 'N/A'}</span>
              </td>
              <td>${subCat.description || 'No description'}</td>
              <td>${subCat.display_order || 0}</td>
              <td>
                <span class="badge badge-primary">${serviceCount} services</span>
              </td>
              <td>
                <span class="badge badge-${subCat.is_active ? 'success' : 'danger'}">
                  ${subCat.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline" onclick="servicesModule.editSubCategory(${subCat.id})" 
                    title="Edit sub-category">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-info" onclick="servicesModule.viewSubCategoryServices(${subCat.id})"
                    title="View services in this sub-category">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="servicesModule.deleteSubCategory(${subCat.id})"
                    title="Delete sub-category" ${serviceCount > 0 ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                ${serviceCount > 0 ? '<small class="text-muted d-block">Remove services first</small>' : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ROOMS VIEW FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function renderRoomsView() {
  return `
    <div class="table-container">
      <div class="table-header">
        <h2 class="table-title">Treatment Rooms & Specifications</h2>
        <div class="d-flex gap-2">
          <select id="filterRoomType" class="form-control">
            <option value="">All Room Types</option>
            <option value="massage">Massage Room</option>
            <option value="spa">Spa Room</option>
            <option value="facial">Facial Room</option>
            <option value="hair">Hair Station</option>
            <option value="nails">Nail Studio</option>
            <option value="multi_purpose">Multi-Purpose Room</option>
            <option value="therapy">Therapy Room</option>
          </select>
          <select id="filterRoomStatus" class="form-control">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button id="addRoomBtn" class="btn btn-primary">
            <i class="fas fa-plus"></i> Add Room
          </button>
        </div>
      </div>
      
      <div id="roomsTable" class="mt-3">
        ${renderRoomsTable(rooms)}
      </div>
    </div>
  `;
}

function renderRoomsTable(roomsList) {
  if (roomsList.length === 0) {
    return '<p class="text-center">No rooms found. Add your first room!</p>';
  }
  
  return `
    <table class="rooms-table">
      <thead>
        <tr>
          <th>Room Details</th>
          <th>Specifications</th>
          <th>Facilities</th>
          <th>Capacity</th>
          <th>Services</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${roomsList.map(room => {
          const serviceCount = services.filter(s => 
            s.room_ids && s.room_ids.includes(room.id)
          ).length;
          
          // Get facility icons
          const facilities = [];
          if (room.shower_available) facilities.push('<i class="fas fa-shower" title="Shower Available"></i>');
          if (room.steam_sauna_available) facilities.push('<i class="fas fa-temperature-high" title="Steam/Sauna"></i>');
          if (room.jacuzzi_available) facilities.push('<i class="fas fa-hot-tub" title="Jacuzzi"></i>');
          if (room.music_system) facilities.push('<i class="fas fa-music" title="Music System"></i>');
          
          return `
            <tr>
              <td>
                <strong><i class="fas fa-door-closed"></i> ${room.name}</strong><br>
                <small class="text-muted">${room.description || 'No description'}</small><br>
                <span class="badge badge-${getRoomTypeClass(room.room_type)} mt-1">
                  ${formatRoomType(room.room_type)}
                </span>
              </td>
              <td>
                <div class="room-specs">
                  <small><strong>Bed:</strong> ${formatBedType(room.bed_type)}</small><br>
                  <small><strong>AC:</strong> ${room.ac_type?.toUpperCase() || 'N/A'}</small><br>
                  <small><strong>Lighting:</strong> ${room.lighting_type || 'N/A'}</small>
                </div>
              </td>
              <td>
                <div class="facilities">
                  ${facilities.join(' ')}
                  ${room.special_equipment ? '<i class="fas fa-tools" title="Special Equipment"></i>' : ''}
                </div>
              </td>
              <td>
                <span class="badge badge-info">
                  ${room.capacity || 1} ${room.capacity === 1 ? 'person' : 'people'}
                </span>
              </td>
              <td>
                <span class="badge badge-primary">${serviceCount} services</span>
              </td>
              <td>
                <span class="badge badge-${room.is_active ? 'success' : 'danger'}">
                  ${room.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline" onclick="servicesModule.editRoom(${room.id})" 
                    title="Edit room">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-info" onclick="servicesModule.viewRoomDetails(${room.id})"
                    title="View room details">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-success" onclick="servicesModule.viewRoomServices(${room.id})"
                    title="View services in this room">
                    <i class="fas fa-concierge-bell"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="servicesModule.deleteRoom(${room.id})"
                    title="Delete room">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// COMBOS VIEW FUNCTIONS - ENHANCED WITH BETTER UI
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function renderCombosView() {
  const activeCombos = serviceCombos.filter(c => c.is_active == 1 || c.is_active === true);
  const inactiveCombos = serviceCombos.filter(c => c.is_active == 0 || c.is_active === false);
  
  return `
    <div class="table-container">
      <div class="table-header">
        <h2 class="table-title"><i class="fas fa-gift"></i> Service Combos & Offers</h2>
        <div class="d-flex gap-2">
          <select id="filterComboCategory" class="form-control" style="min-width: 200px;">
            <option value="">All Categories</option>
            ${mainCategories.map(cat => `
              <optgroup label="${cat.name}">
                ${(cat.sub_categories || []).filter(sc => sc.is_active !== false).map(sc => `
                  <option value="${sc.id}">${sc.name}</option>
                `).join('')}
              </optgroup>
            `).join('')}
          </select>
          <select id="filterComboStatus" class="form-control">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
          <button id="addComboBtn" class="btn btn-primary" onclick="servicesModule.showComboModal()">
            <i class="fas fa-plus"></i> Create Combo
          </button>
        </div>
      </div>
      
      <div class="tabs">
      
        <div class="tab-content">
          <div class="tab-pane active" id="tab-combo-active">
            ${renderCombosTable(activeCombos)}
          </div>
          <div class="tab-pane" id="tab-combo-inactive">
            ${renderCombosTable(inactiveCombos)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCombosTable(combosList) {
  if (combosList.length === 0) {
    return '<p class="text-center">No combos found. Create your first combo offer!</p>';
  }
  
  return `
    <div class="combos-grid">
      ${combosList.map(combo => {
        const today = new Date();
        const validFrom = new Date(combo.valid_from);
        const validTill = combo.valid_till ? new Date(combo.valid_till) : null;
        const isExpired = validTill && validTill < today;
        const isUpcoming = validFrom > today;
        
        // Calculate original total price
        let originalPrice = combo.original_price || combo.computed_original_price || 0;
        if (!originalPrice && combo.services && combo.services.length > 0) {
          originalPrice = combo.services.reduce((sum, service) => 
            sum + (service.base_price || service.price || 0), 0);
        }
        
        const savings = originalPrice - (combo.combo_price || 0);
        const discountPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
        const serviceCount = combo.services ? combo.services.length : combo.service_count || 0;
        
        return `
          <div class="combo-card ${isExpired ? 'expired' : ''} ${isUpcoming ? 'upcoming' : ''}">
            <div class="combo-header">
              <div class="combo-status">
                <span class="badge badge-${combo.is_active ? 'success' : 'danger'}">
                  ${combo.is_active ? 'Active' : 'Inactive'}
                </span>
                ${isExpired ? '<span class="badge badge-warning ml-2">Expired</span>' : ''}
                ${isUpcoming ? '<span class="badge badge-info ml-2">Upcoming</span>' : ''}
              </div>
              <h4 class="combo-title">${escapeHtml(combo.name)}</h4>
            </div>
            
            <div class="combo-body">
              ${combo.description ? `<p class="combo-description">${escapeHtml(combo.description)}</p>` : ''}
              
              <div class="combo-services">
                <strong><i class="fas fa-list"></i> Services Included (${serviceCount}):</strong>
                ${combo.services && combo.services.length > 0 ? `
                  <ul>
                    ${combo.services.slice(0, 3).map(service => `
                      <li>${escapeHtml(service.name)} - ${utils.formatCurrency(service.base_price || service.price || 0)}</li>
                    `).join('')}
                    ${combo.services.length > 3 ? 
                      `<li><small>+${combo.services.length - 3} more services</small></li>` : ''}
                  </ul>
                ` : `<p><small>${serviceCount} services</small></p>`}
              </div>
              
              <div class="combo-pricing">
                <div class="price-row">
                  <span>Original Price:</span>
                  <span class="original-price">${utils.formatCurrency(originalPrice)}</span>
                </div>
                <div class="price-row">
                  <span>Combo Price:</span>
                  <span class="combo-price">${utils.formatCurrency(combo.combo_price || 0)}</span>
                </div>
                <div class="price-row">
                  <span>You Save:</span>
                  <span class="savings">${utils.formatCurrency(savings)} (${discountPercentage}%)</span>
                </div>
              </div>
              
              <div class="combo-validity">
                <small><i class="fas fa-calendar-alt"></i> 
                  ${formatDate(combo.valid_from)} 
                  ${combo.valid_till ? ` - ${formatDate(combo.valid_till)}` : ''}
                </small>
              </div>
            </div>
            
            <div class="combo-footer">
              <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline" onclick="servicesModule.editCombo(${combo.id})" 
                  title="Edit combo">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="servicesModule.viewComboDetails(${combo.id})"
                  title="View combo details">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="servicesModule.deleteCombo(${combo.id})"
                  title="Delete combo">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// COMBO MANAGEMENT FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const comboManager = {
  // Show combo modal
  async showComboModal(combo = null) {
    console.log('[Combo] showComboModal called with:', combo);
    const isEdit = !!combo;
    
    // Load fresh data
    let freshServices = [];
    try {
      freshServices = await api.services.getAll();
    } catch (error) {
      console.error('Error loading services:', error);
      utils.showToast('Failed to load services', 'error');
      return;
    }
    
    // Format date for input fields
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    // Get selected service IDs
    const selectedServiceIds = combo?.service_ids || (combo?.services ? combo.services.map(s => s.id) : []);
    
    // Group services by category for better organization
    const servicesByCategory = {};
    freshServices.forEach(service => {
      // Find category for this service
      let categoryName = 'Uncategorized';
      const category = subCategories.find(sc => sc.id === service.category_id);
      if (category) {
        categoryName = category.parent_name || category.name;
      } else {
        const mainCat = mainCategories.find(mc => mc.id === service.main_category_id);
        if (mainCat) {
          categoryName = mainCat.name;
        }
      }
      
      if (!servicesByCategory[categoryName]) {
        servicesByCategory[categoryName] = [];
      }
      
      servicesByCategory[categoryName].push(service);
    });
    
    const formHTML = `
      <div class="combo-form-container" style="max-width: 900px;">
        <h4 class="mb-3"><i class="fas fa-gift"></i> ${isEdit ? 'Edit Combo' : '➕ CREATE COMBO'}</h4>
        
        <form id="comboForm">
          <!-- Basic Information -->
          <div class="form-section">
            <h5><i class="fas fa-info-circle"></i> Basic Information</h5>
            <div class="row">
              <div class="col-md-8">
                <div class="form-group">
                  <label for="comboName"><i class="fas fa-tag"></i> Combo Name *</label>
                  <input type="text" id="comboName" class="form-control" 
                    value="${combo?.name || ''}" required 
                    placeholder="Enter combo package name">
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label for="comboPrice"><i class="fas fa-rupee-sign"></i> Combo Price *</label>
                  <input type="number" id="comboPrice" class="form-control" 
                    value="${combo?.combo_price || 0}" min="0" step="0.01" required
                    placeholder="Total combo price">
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="comboDescription"><i class="fas fa-align-left"></i> Description</label>
              <textarea id="comboDescription" class="form-control" rows="3" 
                placeholder="Describe this combo package">${combo?.description || ''}</textarea>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="displaySection"><i class="fas fa-columns"></i> Display Section</label>
                  <select id="displaySection" class="form-control">
                    <option value="combo" ${combo?.display_section === 'combo' ? 'selected' : ''}>Combo</option>
                    <option value="offer" ${combo?.display_section === 'offer' ? 'selected' : ''}>Special Offer</option>
                    <option value="both" ${combo?.display_section === 'both' ? 'selected' : ''}>Both</option>
                    <option value="featured" ${combo?.display_section === 'featured' ? 'selected' : ''}>Featured</option>
                    <option value="popular" ${combo?.display_section === 'popular' ? 'selected' : ''}>Popular</option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="originalPrice"><i class="fas fa-tag"></i> Original Price (Optional)</label>
                  <input type="number" id="originalPrice" class="form-control" 
                    value="${combo?.original_price || ''}" min="0" step="0.01"
                    placeholder="Total original price">
                  <small class="form-text text-muted">Leave empty to auto-calculate from services</small>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Validity Period -->
          <div class="form-section">
            <h5><i class="fas fa-calendar-alt"></i> Validity Period</h5>
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="validFrom"><i class="fas fa-calendar-plus"></i> Valid From *</label>
                  <input type="date" id="validFrom" class="form-control" 
                    value="${formatDateForInput(combo?.valid_from || new Date())}" required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="validTill"><i class="fas fa-calendar-minus"></i> Valid Till</label>
                  <input type="date" id="validTill" class="form-control" 
                    value="${formatDateForInput(combo?.valid_till)}">
                  <small class="form-text text-muted">Leave empty for no expiry</small>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Services Selection -->
          <div class="form-section">
            <h5><i class="fas fa-list-check"></i> Select Services</h5>
            
            <div class="mb-3">
              <div class="input-group">
                <input type="text" id="searchServices" class="form-control" 
                  placeholder="Search services...">
                <div class="input-group-append">
                  <button class="btn btn-outline" type="button" id="clearSearch">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Services List -->
            <div class="available-services">
              <div class="services-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px;">
                ${Object.keys(servicesByCategory).map(categoryName => {
                  const categoryServices = servicesByCategory[categoryName];
                  return `
                    <div class="category-section mb-3">
                      <h6 class="category-title">${categoryName}</h6>
                      ${categoryServices.map(service => {
                        const isSelected = selectedServiceIds.includes(service.id);
                        return `
                          <div class="service-item">
                            <div class="form-check">
                              <input class="form-check-input service-checkbox" 
                                type="checkbox" 
                                id="service_${service.id}" 
                                value="${service.id}"
                                data-name="${escapeHtml(service.name)}"
                                data-price="${service.base_price || service.price || 0}"
                                ${isSelected ? 'checked' : ''}>
                              <label class="form-check-label" for="service_${service.id}">
                                <i class="fas fa-spa"></i> ${escapeHtml(service.name)}
                                <span class="text-muted ml-2">(${service.duration_minutes || service.duration || 0} min)</span>
                                <span class="service-price ml-2">${utils.formatCurrency(service.base_price || service.price || 0)}</span>
                              </label>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                }).join('')}
                
                ${freshServices.length === 0 ? 
                  '<p class="text-center text-muted">No services found. Please add services first.</p>' : ''}
              </div>
            </div>
            
            <!-- Selected Services -->
            <div class="selected-services mt-3">
              <h6><i class="fas fa-check-circle text-success"></i> Selected Services</h6>
              <div id="selectedServicesContainer" class="selected-services-list" 
                style="min-height: 100px; max-height: 200px; overflow-y: auto; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                ${selectedServiceIds.map(serviceId => {
                  const service = freshServices.find(s => s.id === serviceId);
                  if (!service) return '';
                  return `
                    <div class="selected-service-item" data-id="${service.id}">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>${escapeHtml(service.name)}</strong>
                          <small class="text-muted ml-2">(${service.duration_minutes || service.duration || 0} min)</small>
                          <span class="service-price ml-2">${utils.formatCurrency(service.base_price || service.price || 0)}</span>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger remove-service" data-id="${service.id}">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
                
                ${selectedServiceIds.length === 0 ? 
                  '<p class="text-center text-muted">No services selected yet</p>' : ''}
              </div>
              
              <div class="selected-summary mt-2">
                <p><strong>Selected:</strong> <span id="selectedCount">${selectedServiceIds.length}</span> services</p>
                <p><strong>Auto-calculated Original Price:</strong> <span id="autoOriginalPrice">${utils.formatCurrency(0)}</span></p>
              </div>
            </div>
          </div>
          
          <!-- Applicable Days -->
          <div class="form-section">
            <h5><i class="fas fa-calendar-week"></i> Applicable Days</h5>
            <div class="row">
              ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                const dayValue = day.toLowerCase().substring(0, 3);
                const isApplicable = combo?.applicable_days ? 
                  (Array.isArray(combo.applicable_days) ? combo.applicable_days.includes(dayValue) : 
                   combo.applicable_days.split(',').includes(dayValue)) : true;
                return `
                  <div class="col-md-3">
                    <div class="form-check">
                      <input class="form-check-input day-checkbox" 
                        type="checkbox" 
                        id="day_${index}" 
                        value="${dayValue}"
                        ${isApplicable ? 'checked' : ''}>
                      <label class="form-check-label" for="day_${index}">${day.substring(0, 3)}</label>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <!-- Display Settings -->
          <div class="form-section">
            <h5><i class="fas fa-eye"></i> Display Settings</h5>
            <div class="row">
              <div class="col-md-4">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="showOnWebsite" 
                    ${combo?.show_on_website !== false ? 'checked' : ''}>
                  <label class="form-check-label" for="showOnWebsite">
                    <i class="fas fa-globe"></i> Show on Website
                  </label>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="showOnPos" 
                    ${combo?.show_on_pos !== false ? 'checked' : ''}>
                  <label class="form-check-label" for="showOnPos">
                    <i class="fas fa-cash-register"></i> Show on POS
                  </label>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="showOnBooking" 
                    ${combo?.show_on_booking !== false ? 'checked' : ''}>
                  <label class="form-check-label" for="showOnBooking">
                    <i class="fas fa-calendar-check"></i> Show on Booking
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Status -->
          <div class="form-section">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="comboActive" 
                ${combo?.is_active !== false ? 'checked' : ''}>
              <label class="form-check-label" for="comboActive">
                <i class="fas fa-toggle-on"></i> Active Combo
              </label>
              <div>
                <small class="form-text text-muted">Inactive combos won't be available for purchase</small>
              </div>
            </div>
          </div>
          
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i> <strong>Notes:</strong>
            <ul class="mb-0 mt-2">
              <li>Select at least 2 services to create a meaningful combo</li>
              <li>Combo price should be less than the sum of individual service prices</li>
              <li>Check validity dates to ensure combo is available when needed</li>
            </ul>
          </div>
          
          <div class="form-actions mt-4">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> ${isEdit ? 'Update Combo' : 'Create Combo'}
            </button>
            <button type="button" class="btn btn-outline" onclick="window.appUtils.closeModal()">
              <i class="fas fa-times"></i> Cancel
            </button>
          </div>
        </form>
      </div>
    `;
    
    window.appUtils.showModal(isEdit ? 'Edit Combo' : 'Create Combo', formHTML);

    const form = document.getElementById('comboForm');
    if (form) {
      form.dataset.comboId = combo?.id ? String(combo.id) : '';
      form.dataset.isEdit = isEdit ? 'true' : 'false';
    }
    
    // Setup event listeners
    this.setupComboFormListeners.call(this);
    
    // Initialize with selected services
    if (selectedServiceIds.length > 0) {
      this.updateOriginalPriceCalculation();
      this.updateSelectedCount();
    }
  },

  // Setup combo form event listeners
  setupComboFormListeners() {
    const self = this; // Capture context for proper binding
    
    // Service checkbox handler
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('service-checkbox')) {
        self.handleServiceCheckbox(e.target);
      }
    });

    // Remove service button
    const selectedContainer = document.getElementById('selectedServicesContainer');
    if (selectedContainer) {
      selectedContainer.addEventListener('click', (e) => {
        if (e.target.closest('.remove-service')) {
          const button = e.target.closest('.remove-service');
          const serviceId = button.getAttribute('data-id');
          self.removeSelectedService(serviceId);
        }
      });
    }

    // Search functionality
    const searchInput = document.getElementById('searchServices');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.service-item').forEach(item => {
          const serviceName = item.querySelector('.form-check-label').textContent.toLowerCase();
          item.style.display = serviceName.includes(searchTerm) ? 'block' : 'none';
        });
      });
    }

    // Clear search
    const clearButton = document.getElementById('clearSearch');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        const searchInput = document.getElementById('searchServices');
        if (searchInput) {
          searchInput.value = '';
          document.querySelectorAll('.service-item').forEach(item => {
            item.style.display = 'block';
          });
        }
      });
    }

    // Form submission
    const form = document.getElementById('comboForm');
    if (form) {
      // Remove any existing listeners first
      const existingHandler = form._comboSaveHandler;
      if (existingHandler) {
        form.removeEventListener('submit', existingHandler);
      }
      
      // Create new handler with proper context binding
      const handler = (e) => {
        e.preventDefault();
        self.saveCombo();
      };
      
      // Store reference for cleanup
      form._comboSaveHandler = handler;
      form.addEventListener('submit', handler);
    }

    // Update original price calculation
    self.updateOriginalPriceCalculation();
  },

  // Handle service checkbox selection
  handleServiceCheckbox(checkbox) {
    const serviceId = checkbox.value;
    const serviceName = checkbox.getAttribute('data-name');
    const servicePrice = parseFloat(checkbox.getAttribute('data-price')) || 0;

    if (checkbox.checked) {
      this.addSelectedService(serviceId, serviceName, servicePrice);
    } else {
      this.removeSelectedService(serviceId);
    }
  },

  // Add service to selected list
  addSelectedService(serviceId, serviceName, servicePrice) {
    const container = document.getElementById('selectedServicesContainer');
    if (!container) return;

    // Check if already added
    const existing = container.querySelector(`[data-id="${serviceId}"]`);
    if (existing) return;

    const serviceItem = document.createElement('div');
    serviceItem.className = 'selected-service-item';
    serviceItem.setAttribute('data-id', serviceId);
    serviceItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${serviceName}</strong>
          <small class="text-muted ml-2"></small>
          <span class="service-price ml-2">${utils.formatCurrency(servicePrice)}</span>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger remove-service" data-id="${serviceId}">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Remove the "no services" message if present
    const noServicesMsg = container.querySelector('p.text-center');
    if (noServicesMsg) {
      noServicesMsg.remove();
    }

    container.appendChild(serviceItem);
    this.updateSelectedCount();
    this.updateOriginalPriceCalculation();
  },

  // Remove service from selected list
  removeSelectedService(serviceId) {
    const container = document.getElementById('selectedServicesContainer');
    if (!container) return;

    const serviceItem = container.querySelector(`[data-id="${serviceId}"]`);
    if (serviceItem) {
      serviceItem.remove();
      
      // Uncheck the corresponding checkbox
      const checkbox = document.getElementById(`service_${serviceId}`);
      if (checkbox) {
        checkbox.checked = false;
      }
    }

    // Show "no services" message if empty
    if (container.children.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No services selected yet</p>';
    }

    this.updateSelectedCount();
    this.updateOriginalPriceCalculation();
  },

  // Update selected count
  updateSelectedCount() {
    const container = document.getElementById('selectedServicesContainer');
    const selectedItems = container?.querySelectorAll('.selected-service-item') || [];
    const count = selectedItems.length;
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
      countElement.textContent = count;
    }
  },

  // Update original price calculation
  updateOriginalPriceCalculation() {
    const container = document.getElementById('selectedServicesContainer');
    const selectedItems = container?.querySelectorAll('.selected-service-item') || [];
    
    let total = 0;
    selectedItems.forEach(item => {
      const priceText = item.querySelector('.service-price')?.textContent || '0';
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      total += price;
    });

    const autoPriceElement = document.getElementById('autoOriginalPrice');
    if (autoPriceElement) {
      autoPriceElement.textContent = utils.formatCurrency(total);
    }

    // If original price input is empty, update it with calculated value
    const originalPriceInput = document.getElementById('originalPrice');
    if (originalPriceInput && !originalPriceInput.value && selectedItems.length > 0) {
      originalPriceInput.value = total.toFixed(2);
    }
  },

  // Save combo
  async saveCombo() {
    console.log('[Combo] saveCombo called');
    const form = document.getElementById('comboForm');
    if (!form) {
      console.error('[Combo] Form not found');
      return;
    }

    const comboId = form.dataset.comboId ? parseInt(form.dataset.comboId, 10) : null;
    const isEdit = form.dataset.isEdit === 'true';
    
    console.log('[Combo] Form data:', { comboId, isEdit });

    // Get selected service IDs
    const selectedItems = document.querySelectorAll('.selected-service-item');
    const serviceIds = Array.from(selectedItems).map(item => 
      parseInt(item.getAttribute('data-id'))
    );

    // Get selected days
    const selectedDays = Array.from(document.querySelectorAll('.day-checkbox:checked'))
      .map(cb => cb.value);

    console.log('[Combo] Selected services:', serviceIds);
    console.log('[Combo] Selected days:', selectedDays);

    // Validate
    if (serviceIds.length < 2) {
      utils.showToast('Please select at least 2 services for the combo', 'error');
      return;
    }

    const comboData = {
      name: document.getElementById('comboName').value.trim(),
      description: document.getElementById('comboDescription').value.trim() || null,
      combo_price: parseFloat(document.getElementById('comboPrice').value) || 0,
      original_price: parseFloat(document.getElementById('originalPrice').value) || null,
      valid_from: document.getElementById('validFrom').value,
      valid_till: document.getElementById('validTill').value || null,
      display_section: document.getElementById('displaySection').value,
      applicable_days: selectedDays,
      service_ids: serviceIds,
      show_on_website: document.getElementById('showOnWebsite').checked,
      show_on_pos: document.getElementById('showOnPos').checked,
      show_on_booking: document.getElementById('showOnBooking').checked,
      is_active: document.getElementById('comboActive').checked
    };

    console.log('[Combo] Combo data:', comboData);

    // Validate required fields
    if (!comboData.name || comboData.name.length < 2) {
      utils.showToast('Combo name must be at least 2 characters', 'error');
      return;
    }

    if (comboData.combo_price <= 0) {
      utils.showToast('Combo price must be greater than 0', 'error');
      return;
    }

    try {
      if (isEdit && comboId) {
        console.log('[Combo] Updating combo:', comboId);
        await apiHelper.updateComboWithFallback(comboId, comboData);
        utils.showToast('Combo updated successfully', 'success');
      } else {
        console.log('[Combo] Creating new combo');
        await apiHelper.createComboWithFallback(comboData);
        utils.showToast('Combo created successfully', 'success');
      }

      // Close modal and refresh view
      window.appUtils.closeModal();
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);

    } catch (error) {
      console.error('Error saving combo:', error);
      utils.showToast(`Error: ${error.message}`, 'error');
    }
  },

  // Edit combo
  async editCombo(comboId) {
    try {
      const combo = await apiHelper.getComboByIdWithFallback(comboId);
      if (combo) {
        await this.showComboModal(combo);
      }
    } catch (error) {
      console.error('Error loading combo:', error);
      utils.showToast('Failed to load combo details', 'error');
    }
  },

  // Delete combo
  async deleteCombo(comboId) {
    if (!confirm('Are you sure you want to delete this combo? This action cannot be undone.')) {
      return;
    }

    try {
      await apiHelper.deleteComboWithFallback(comboId);
      utils.showToast('Combo deleted successfully', 'success');
      
      // Refresh the view
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
      
    } catch (error) {
      console.error('Error deleting combo:', error);
      utils.showToast(`Error: ${error.message}`, 'error');
    }
  },

  // Toggle combo status
  async toggleComboStatus(comboId, status) {
    try {
      await apiHelper.updateComboWithFallback(comboId, { is_active: status });
      utils.showToast(`Combo ${status ? 'activated' : 'deactivated'} successfully`, 'success');
      
      // Refresh the view
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
      
    } catch (error) {
      console.error('Error toggling combo status:', error);
      utils.showToast(`Error: ${error.message}`, 'error');
    }
  },

  // View combo details
  async viewComboDetails(comboId) {
    try {
      const combo = await apiHelper.getComboByIdWithFallback(comboId);
      if (!combo) {
        utils.showToast('Combo not found', 'error');
        return;
      }

      const today = new Date();
      const validFrom = new Date(combo.valid_from);
      const validTill = combo.valid_till ? new Date(combo.valid_till) : null;
      const isExpired = validTill && validTill < today;
      const isUpcoming = validFrom > today;

      // Calculate prices
      let originalPrice = combo.original_price || 0;
      if (!originalPrice && combo.services && combo.services.length > 0) {
        originalPrice = combo.services.reduce((sum, service) => 
          sum + (service.base_price || service.price || 0), 0);
      }
      
      const savings = originalPrice - (combo.combo_price || 0);
      const discountPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
      const serviceCount = combo.services ? combo.services.length : 0;

      let html = `
        <h4><i class="fas fa-gift"></i> ${escapeHtml(combo.name)} - Combo Details</h4>
        
        <div class="row">
          <div class="col-md-8">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-info-circle"></i> Basic Information</h5>
              </div>
              <div class="card-body">
                ${combo.description ? `<p><strong>Description:</strong> ${escapeHtml(combo.description)}</p>` : ''}
                <p><strong>Display Section:</strong> 
                  <span class="badge badge-info">${combo.display_section || 'combo'}</span>
                </p>
                <p><strong>Status:</strong> 
                  <span class="badge badge-${combo.is_active ? 'success' : 'danger'}">
                    ${combo.is_active ? 'Active' : 'Inactive'}
                  </span>
                  ${isExpired ? '<span class="badge badge-warning ml-2">Expired</span>' : ''}
                  ${isUpcoming ? '<span class="badge badge-info ml-2">Upcoming</span>' : ''}
                </p>
                <p><strong>Valid From:</strong> ${formatDate(combo.valid_from)}</p>
                ${combo.valid_till ? `<p><strong>Valid Till:</strong> ${formatDate(combo.valid_till)}</p>` : ''}
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-chart-pie"></i> Pricing Summary</h5>
              </div>
              <div class="card-body">
                <div class="price-summary">
                  <div class="price-row">
                    <span>Original Price:</span>
                    <span class="text-muted text-decoration-line-through">${utils.formatCurrency(originalPrice)}</span>
                  </div>
                  <div class="price-row">
                    <span>Combo Price:</span>
                    <span class="text-success font-weight-bold">${utils.formatCurrency(combo.combo_price || 0)}</span>
                  </div>
                  <div class="price-row">
                    <span>You Save:</span>
                    <span class="text-danger font-weight-bold">${utils.formatCurrency(savings)} (${discountPercentage}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      if (combo.services && combo.services.length > 0) {
        html += `
          <div class="card mb-3">
            <div class="card-header">
              <h5><i class="fas fa-list-check"></i> Services Included (${serviceCount})</h5>
            </div>
            <div class="card-body">
              <div style="max-height: 300px; overflow-y: auto;">
                <table class="services-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Category</th>
                      <th>Duration</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${combo.services.map(service => {
                      let categoryName = 'N/A';
                      const subCat = subCategories.find(sc => sc.id === service.category_id);
                      if (subCat) {
                        categoryName = subCat.parent_name || subCat.name;
                      }
                      
                      return `
                        <tr>
                          <td><strong>${escapeHtml(service.name)}</strong></td>
                          <td>${categoryName}</td>
                          <td>${service.duration_minutes || service.duration || 0} min</td>
                          <td>${utils.formatCurrency(service.base_price || service.price || 0)}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      }

      window.appUtils.showModal('Combo Details', html);
    } catch (error) {
      console.error('Error loading combo details:', error);
      utils.showToast('Failed to load combo details', 'error');
    }
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FORM FUNCTIONS (ADDED BACK)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Room Form Function
async function showRoomForm(room = null) {
  const isEdit = !!room;
  
  const formHTML = `
    <div class="room-form-container" style="max-width: 800px;">
      <h4 class="mb-3"><i class="fas fa-door-open"></i> ${isEdit ? 'Edit Room' : '➕ ADD ROOM'}</h4>
      <p class="text-muted mb-3">Define rooms where services are performed, along with their specifications.</p>
      
      <form id="roomForm">
        <!-- Basic Information -->
        <div class="form-section">
          <h5><i class="fas fa-info-circle"></i> Basic Information</h5>
          
          <div class="row">
            <div class="col-md-8">
              <div class="form-group">
                <label for="roomName"><i class="fas fa-door-closed"></i> Room Name *</label>
                <input type="text" id="roomName" class="form-control" 
                  value="${room?.name || ''}" required 
                  placeholder="Unique name or number (e.g., Therapy Room 1, Couple Room)">
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="roomType"><i class="fas fa-th-large"></i> Room Type *</label>
                <select id="roomType" class="form-control" required>
                  <option value="massage" ${room?.room_type === 'massage' ? 'selected' : ''}>Massage Room</option>
                  <option value="spa" ${room?.room_type === 'spa' ? 'selected' : ''}>Spa Room</option>
                  <option value="facial" ${room?.room_type === 'facial' ? 'selected' : ''}>Facial Room</option>
                  <option value="hair" ${room?.room_type === 'hair' ? 'selected' : ''}>Hair Station</option>
                  <option value="nails" ${room?.room_type === 'nails' ? 'selected' : ''}>Nail Studio</option>
                  <option value="multi_purpose" ${room?.room_type === 'multi_purpose' ? 'selected' : ''}>Multi-Purpose Room</option>
                  <option value="therapy" ${room?.room_type === 'therapy' ? 'selected' : ''}>Therapy Room</option>
                  <option value="other" ${room?.room_type === 'other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-4">
              <div class="form-group">
                <label for="roomCapacity"><i class="fas fa-users"></i> Capacity</label>
                <input type="number" id="roomCapacity" class="form-control" 
                  value="${room?.capacity || 1}" min="1" max="10"
                  placeholder="Number of clients">
                <small class="form-text text-muted">Number of clients that can be served simultaneously</small>
              </div>
            </div>
            <div class="col-md-8">
              <div class="form-group">
                <label for="roomDescription"><i class="fas fa-align-left"></i> Description</label>
                <textarea id="roomDescription" class="form-control" rows="2" 
                  placeholder="General details about the room">${room?.description || ''}</textarea>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Room Specifications -->
        <div class="form-section">
          <h5><i class="fas fa-clipboard-list"></i> Room Specifications</h5>
          <p class="text-muted">Capture detailed information about room facilities and equipment.</p>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="bedType"><i class="fas fa-bed"></i> Bed Type</label>
                <select id="bedType" class="form-control">
                  <option value="">Select Bed Type</option>
                  <option value="massage_table" ${room?.bed_type === 'massage_table' ? 'selected' : ''}>Massage Table</option>
                  <option value="single" ${room?.bed_type === 'single' ? 'selected' : ''}>Single Bed</option>
                  <option value="double" ${room?.bed_type === 'double' ? 'selected' : ''}>Double Bed</option>
                  <option value="adjustable" ${room?.bed_type === 'adjustable' ? 'selected' : ''}>Adjustable Bed</option>
                  <option value="none" ${room?.bed_type === 'none' ? 'selected' : ''}>No Bed</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="acType"><i class="fas fa-snowflake"></i> AC / Ventilation</label>
                <select id="acType" class="form-control">
                  <option value="">Select AC Type</option>
                  <option value="ac" ${room?.ac_type === 'ac' ? 'selected' : ''}>AC</option>
                  <option value="non_ac" ${room?.ac_type === 'non_ac' ? 'selected' : ''}>Non-AC</option>
                  <option value="both" ${room?.ac_type === 'both' ? 'selected' : ''}>Both Available</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="lightingType"><i class="fas fa-lightbulb"></i> Lighting Type</label>
                <select id="lightingType" class="form-control">
                  <option value="">Select Lighting</option>
                  <option value="adjustable" ${room?.lighting_type === 'adjustable' ? 'selected' : ''}>Adjustable</option>
                  <option value="warm" ${room?.lighting_type === 'warm' ? 'selected' : ''}>Warm</option>
                  <option value="ambient" ${room?.lighting_type === 'ambient' ? 'selected' : ''}>Ambient</option>
                  <option value="dim" ${room?.lighting_type === 'dim' ? 'selected' : ''}>Dim</option>
                  <option value="bright" ${room?.lighting_type === 'bright' ? 'selected' : ''}>Bright</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="specialEquipment"><i class="fas fa-tools"></i> Special Equipment</label>
                <input type="text" id="specialEquipment" class="form-control" 
                  value="${room?.special_equipment || ''}"
                  placeholder="e.g., Hot Stone Kit, Steam Unit, UV Lamp">
              </div>
            </div>
          </div>
          
          <!-- Facilities Checkboxes -->
          <div class="facilities-section mt-3">
            <label class="d-block mb-2"><i class="fas fa-check-circle"></i> Facilities Available:</label>
            <div class="row">
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="showerAvailable" 
                    ${room?.shower_available ? 'checked' : ''}>
                  <label class="form-check-label" for="showerAvailable">
                    <i class="fas fa-shower"></i> Shower
                  </label>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="steamSaunaAvailable" 
                    ${room?.steam_sauna_available ? 'checked' : ''}>
                  <label class="form-check-label" for="steamSaunaAvailable">
                    <i class="fas fa-temperature-high"></i> Steam/Sauna
                  </label>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="jacuzziAvailable" 
                    ${room?.jacuzzi_available ? 'checked' : ''}>
                  <label class="form-check-label" for="jacuzziAvailable">
                    <i class="fas fa-hot-tub"></i> Jacuzzi
                  </label>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="musicSystem" 
                    ${room?.music_system ? 'checked' : ''}>
                  <label class="form-check-label" for="musicSystem">
                    <i class="fas fa-music"></i> Music System
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Status -->
        <div class="form-section">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="roomActive" 
              ${room?.is_active !== false ? 'checked' : ''}>
            <label class="form-check-label" for="roomActive">
              <i class="fas fa-toggle-on"></i> Active Room
            </label>
            <div>
              <small class="form-text text-muted">Inactive rooms won't be available for booking</small>
            </div>
          </div>
        </div>
        
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i> <strong>Notes:</strong>
          <ul class="mb-0 mt-2">
            <li>One room can be used for multiple services</li>
            <li>Room specifications help staff select the right room later during booking</li>
            <li>Specifications are informational only in this module</li>
          </ul>
        </div>
        
        <div class="form-actions mt-4">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> ${isEdit ? 'Update Room' : 'Create Room'}
          </button>
          <button type="button" class="btn btn-outline" onclick="window.appUtils.closeModal()">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
      </form>
    </div>
  `;
  
  window.appUtils.showModal(isEdit ? 'Edit Room' : 'Add Room', formHTML);
  
  document.getElementById('roomForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const roomData = {
      name: document.getElementById('roomName').value.trim(),
      room_type: document.getElementById('roomType').value,
      capacity: parseInt(document.getElementById('roomCapacity').value) || 1,
      description: document.getElementById('roomDescription').value.trim() || null,
      bed_type: document.getElementById('bedType').value || null,
      ac_type: document.getElementById('acType').value || null,
      lighting_type: document.getElementById('lightingType').value || null,
      special_equipment: document.getElementById('specialEquipment').value.trim() || null,
      shower_available: document.getElementById('showerAvailable').checked,
      steam_sauna_available: document.getElementById('steamSaunaAvailable').checked,
      jacuzzi_available: document.getElementById('jacuzziAvailable').checked,
      music_system: document.getElementById('musicSystem').checked,
      is_active: document.getElementById('roomActive').checked
    };
    
    if (!roomData.name || roomData.name.length < 2) {
      utils.showToast('Room name must be at least 2 characters', 'error');
      return;
    }
    
    try {
      const contentArea = document.getElementById('contentArea');
      
      if (isEdit) {
        await api.services.updateRoom(room.id, roomData);
        utils.showToast('Room updated successfully', 'success');
      } else {
        await api.services.createRoom(roomData);
        utils.showToast('Room created successfully', 'success');
      }
      
      window.appUtils.closeModal();
      await render(contentArea);
      
    } catch (error) {
      console.error('Save error:', error);
      utils.showToast(`Error: ${error.message}`, 'error');
    }
  });
}

// Main Category Form Function
async function showMainCategoryForm(category = null) {
  const isEdit = !!category;
  
  const formHTML = `
    <div class="category-form-container" style="max-width: 600px;">
      <h4 class="mb-3"><i class="fas fa-folder-plus"></i> ${isEdit ? 'Edit Main Category' : '➕ ADD MAIN CATEGORY'}</h4>
      <p class="text-muted mb-3">Create and organize services using main categories for better structure and clarity.</p>
      
      <form id="mainCategoryForm">
        <div class="form-group">
          <label for="categoryName"><i class="fas fa-tag"></i> Category Name *</label>
          <input type="text" id="categoryName" class="form-control" 
            value="${category?.name || ''}" required 
            placeholder="Enter the primary category name (e.g., Spa, Hair, Facial)">
        </div>
        
        <div class="form-group">
          <label for="categoryDescription"><i class="fas fa-align-left"></i> Description</label>
          <textarea id="categoryDescription" class="form-control" rows="3" 
            placeholder="Short description of the category (optional)">${category?.description || ''}</textarea>
        </div>
        
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="displayOrder"><i class="fas fa-sort-numeric-down"></i> Display Order</label>
              <input type="number" id="displayOrder" class="form-control" 
                value="${category?.display_order || 0}" min="0"
                placeholder="Lower numbers show first">
              <small class="form-text text-muted">Set the order in which this category appears</small>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group mt-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="categoryActive" 
                  ${category?.is_active !== false ? 'checked' : ''}>
                <label class="form-check-label" for="categoryActive">
                  <i class="fas fa-toggle-on"></i> Active
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-actions mt-4">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> ${isEdit ? 'Update Category' : 'Create Main Category'}
          </button>
          <button type="button" class="btn btn-outline" onclick="window.appUtils.closeModal()">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
      </form>
    </div>
  `;
  
  window.appUtils.showModal(isEdit ? 'Edit Main Category' : 'Add Main Category', formHTML);
  
  document.getElementById('mainCategoryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const categoryData = {
      name: document.getElementById('categoryName').value.trim(),
      description: document.getElementById('categoryDescription').value.trim() || null,
      display_order: parseInt(document.getElementById('displayOrder').value) || 0,
      is_active: document.getElementById('categoryActive').checked
    };
    
    if (!categoryData.name || categoryData.name.length < 2) {
      utils.showToast('Category name must be at least 2 characters', 'error');
      return;
    }
    
    try {
      const contentArea = document.getElementById('contentArea');
      
      if (isEdit) {
        await api.services.updateCategory(category.id, categoryData);
        utils.showToast('Main category updated successfully', 'success');
      } else {
        await api.services.createCategory(categoryData);
        utils.showToast('Main category created successfully', 'success');
      }
      
      window.appUtils.closeModal();
      await render(contentArea);
      
    } catch (error) {
      console.error('Save error:', error);
      utils.showToast(`Error: ${error.message}`, 'error');
    }
  });
}

// Sub-Category Form Function
async function showSubCategoryForm(subCategory = null) {
  const isEdit = !!subCategory;
  
  // Get fresh main categories for dropdown
  let mainCats = [];
  try {
    mainCats = await api.services.getMainCategories();
  } catch (error) {
    console.error('Error loading main categories:', error);
    // Try alternative approach
    try {
      const categoriesTree = await apiHelper.getCategoriesWithFallback();
      mainCats = categoriesTree.filter(cat => !cat.parent_id);
    } catch (error2) {
      console.error('Alternative approach also failed:', error2);
      utils.showToast('Failed to load main categories', 'error');
      return;
    }
  }
  
  // Filter only active main categories
  const activeMainCats = mainCats.filter(cat => cat.is_active !== false);
  
  // If no active main categories found
  if (!activeMainCats || activeMainCats.length === 0) {
    const formHTML = `
      <div class="category-form-container" style="max-width: 600px;">
        <h4 class="mb-3"><i class="fas fa-exclamation-triangle text-warning"></i> No Active Main Categories Found</h4>
        <p class="text-muted mb-3">You need to create an active main category first before adding sub-categories.</p>
        <div class="alert alert-warning">
          <i class="fas fa-info-circle"></i> Please create an active main category first, then come back to add sub-categories.
        </div>
        <div class="form-actions mt-4">
          <button type="button" class="btn btn-primary" onclick="showMainCategoryForm()">
            <i class="fas fa-plus"></i> Create Main Category
          </button>
          <button type="button" class="btn btn-outline" onclick="window.appUtils.closeModal()">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
      </div>
    `;
    
    window.appUtils.showModal('Add Sub-Category', formHTML);
    return;
  }
  
  const formHTML = `
    <div class="category-form-container" style="max-width: 600px;">
      <h4 class="mb-3"><i class="fas fa-list-plus"></i> ${isEdit ? 'Edit Sub-Category' : '➕ ADD SUB-CATEGORY'}</h4>
      <p class="text-muted mb-3">Group similar services under a main category.</p>
      
      <form id="subCategoryForm">
        <div class="form-group">
          <label for="parentCategory"><i class="fas fa-layer-group"></i> Parent Category *</label>
          <select id="parentCategory" class="form-control" required ${isEdit ? 'disabled' : ''}>
            <option value="">Select Main Category</option>
            ${activeMainCats.map(cat => `
              <option value="${cat.id}" ${(isEdit && subCategory.parent_id == cat.id) ? 'selected' : ''}>
                ${cat.name}
              </option>
            `).join('')}
          </select>
          <small class="form-text text-muted">Select the main category this sub-category belongs to</small>
        </div>
        
        <div class="form-group">
          <label for="subCategoryName"><i class="fas fa-tag"></i> Sub-Category Name *</label>
          <input type="text" id="subCategoryName" class="form-control" 
            value="${subCategory?.name || ''}" required 
            placeholder="Enter sub-category name (e.g., Body Massage, Hair Coloring)">
        </div>
        
        <div class="form-group">
          <label for="subCategoryDescription"><i class="fas fa-align-left"></i> Description</label>
          <textarea id="subCategoryDescription" class="form-control" rows="3" 
            placeholder="Optional description for clarity">${subCategory?.description || ''}</textarea>
        </div>
        
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="subDisplayOrder"><i class="fas fa-sort-numeric-down"></i> Display Order</label>
              <input type="number" id="subDisplayOrder" class="form-control" 
                value="${subCategory?.display_order || 0}" min="0"
                placeholder="Order within parent category">
              <small class="form-text text-muted">Set the order in which this appears under parent</small>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group mt-4">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="subCategoryActive" 
                  ${subCategory?.is_active !== false ? 'checked' : ''}>
                <label class="form-check-label" for="subCategoryActive">
                  <i class="fas fa-toggle-on"></i> Active
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-actions mt-4">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> ${isEdit ? 'Update Sub-Category' : 'Create Sub-Category'}
          </button>
          <button type="button" class="btn btn-outline" onclick="window.appUtils.closeModal()">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
      </form>
    </div>
  `;
  
  window.appUtils.showModal(isEdit ? 'Edit Sub-Category' : 'Add Sub-Category', formHTML);
  
  document.getElementById('subCategoryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const parentId = document.getElementById('parentCategory').value;
    const subCategoryName = document.getElementById('subCategoryName').value.trim();
    
    if (!subCategoryName || subCategoryName.length < 2) {
      utils.showToast('Sub-category name must be at least 2 characters', 'error');
      return;
    }
    
    if (!parentId) {
      utils.showToast('Please select a parent category', 'error');
      return;
    }
    
    const categoryData = {
      name: subCategoryName,
      parent_id: parseInt(parentId),
      description: document.getElementById('subCategoryDescription').value.trim() || null,
      display_order: parseInt(document.getElementById('subDisplayOrder').value) || 0,
      is_active: document.getElementById('subCategoryActive').checked
    };
    
    try {
      const contentArea = document.getElementById('contentArea');
      
      if (isEdit) {
        await api.services.updateCategory(subCategory.id, categoryData);
        utils.showToast('Sub-category updated successfully', 'success');
      } else {
        await api.services.createCategory(categoryData);
        utils.showToast('Sub-category created successfully', 'success');
      }
      
      window.appUtils.closeModal();
      await render(contentArea);
      
    } catch (error) {
      console.error('Save error:', error);
      utils.showToast(`Error: ${error.message}`, 'error');
    }
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SERVICE FORM FUNCTIONS - UPDATED WITH FIXES
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function showServiceForm(service = null) {
  const isEdit = !!service;
  
  // Load fresh data
  let freshCategories = [];
  let freshRooms = [];
  
  try {
    freshCategories = await apiHelper.getCategoriesWithFallback();
  } catch (error) {
    console.error('Error loading categories:', error);
  }
  
  try {
    freshRooms = await api.services.getRooms();
  } catch (error) {
    console.error('Error loading rooms:', error);
  }
  
  // Get selected room IDs
  const selectedRoomIds = service?.room_ids || [];
  
  // Build category options for service form
  // Services should be linked to sub-categories
  let categoryOptions = '';
  if (freshCategories.length > 0) {
    freshCategories.forEach(mainCat => {
      if (mainCat.sub_categories && mainCat.sub_categories.length > 0) {
        categoryOptions += `<optgroup label="${mainCat.name}">`;
        mainCat.sub_categories.forEach(subCat => {
          if (subCat.is_active !== false) {
            categoryOptions += `
              <option value="${subCat.id}" ${service?.category_id == subCat.id ? 'selected' : ''}>
                ${subCat.name} (${mainCat.name})
              </option>
            `;
          }
        });
        categoryOptions += '</optgroup>';
      }
    });
  }
  
  // If no categories found, show message
  if (!categoryOptions) {
    categoryOptions = '<option value="">No categories available. Please add categories first.</option>';
  }
  
  const formHTML = `
    <div class="service-form-container" style="max-width: 700px;">
      <h4 class="mb-3"><i class="fas fa-spa"></i> ${isEdit ? 'Edit Service' : '➕ ADD SERVICE'}</h4>
      
      <form id="serviceForm">
        <!-- Basic Information -->
        <div class="form-section">
          <h5><i class="fas fa-info-circle"></i> Basic Information</h5>
          <div class="row">
            <div class="col-md-8">
              <div class="form-group">
                <label for="serviceName"><i class="fas fa-tag"></i> Service Name *</label>
                <input type="text" id="serviceName" class="form-control" 
                  value="${service?.name || ''}" required 
                  placeholder="Enter service name">
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="serviceCategory"><i class="fas fa-tags"></i> Category *</label>
                <select id="serviceCategory" class="form-control" required>
                  <option value="">Select Category</option>
                  ${categoryOptions}
                </select>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="shortDescription"><i class="fas fa-align-left"></i> Description</label>
            <textarea id="shortDescription" class="form-control" rows="2"
              placeholder="Brief service description">${service?.short_description || service?.description || ''}</textarea>
          </div>
        </div>
        
        <!-- Pricing & Duration -->
        <div class="form-section">
          <h5><i class="fas fa-clock"></i> Duration & Pricing</h5>
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="duration"><i class="fas fa-hourglass-half"></i> Duration (minutes) *</label>
                <input type="number" id="duration" class="form-control" 
                  value="${service?.duration_minutes || service?.duration || 60}" min="5" max="480" required
                  placeholder="Service duration">
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="basePrice"><i class="fas fa-rupee-sign"></i> Base Price *</label>
                <input type="number" id="basePrice" class="form-control" 
                  value="${service?.base_price || service?.price || 0}" min="0" step="0.01" required
                  placeholder="Service price">
              </div>
            </div>
          </div>
        </div>
        
        <!-- Room Assignment -->
        <div class="form-section">
          <h5><i class="fas fa-door-closed"></i> Room Assignment</h5>
          <p class="text-muted">Select rooms where this service can be performed:</p>
          
          <div class="rooms-selection">
            <div class="form-check-group" style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
              ${freshRooms.length > 0 ? freshRooms.map(room => `
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" 
                    id="room_${room.id}" 
                    value="${room.id}"
                    ${selectedRoomIds.includes(room.id) ? 'checked' : ''}
                    ${room.is_active === false ? 'disabled' : ''}>
                  <label class="form-check-label" for="room_${room.id}">
                    <i class="fas fa-door-closed"></i> ${room.name}
                    <small class="text-muted ml-2">(${formatRoomType(room.room_type)})</small>
                    ${room.is_active === false ? '<span class="badge badge-danger ml-2">Inactive</span>' : ''}
                  </label>
                </div>
              `).join('') : '<p class="text-muted">No rooms available. Please create rooms first.</p>'}
            </div>
          </div>
        </div>
        
        <!-- Status & Settings -->
        <div class="form-section">
          <div class="row">
            <div class="col-md-6">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="serviceActive" 
                  ${service?.is_active !== false ? 'checked' : ''}>
                <label class="form-check-label" for="serviceActive">
                  <i class="fas fa-toggle-on"></i> Active Service
                </label>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="displayOrder"><i class="fas fa-sort-numeric-down"></i> Display Order</label>
                <input type="number" id="displayOrder" class="form-control" 
                  value="${service?.display_order || 0}" min="0"
                  placeholder="Sort order">
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-actions mt-4">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> ${isEdit ? 'Update Service' : 'Create Service'}
          </button>
          <button type="button" class="btn btn-outline" onclick="window.appUtils.closeModal()">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
      </form>
    </div>
  `;
  
  window.appUtils.showModal(isEdit ? 'Edit Service' : 'Add Service', formHTML);
  
  // UPDATED FORM SUBMISSION HANDLER WITH FIXES
  document.getElementById('serviceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
      // Collect form data
      const formData = {
        name: document.getElementById('serviceName').value.trim(),
        category_id: document.getElementById('serviceCategory').value,
        short_description: document.getElementById('shortDescription').value.trim() || null,
        duration_minutes: document.getElementById('duration').value,
        base_price: document.getElementById('basePrice').value,
        is_active: document.getElementById('serviceActive').checked,
        display_order: document.getElementById('displayOrder').value || 0
      };
      
      // Collect room IDs
      const roomCheckboxes = document.querySelectorAll('.rooms-selection input[type="checkbox"]:checked');
      const roomIds = Array.from(roomCheckboxes).map(cb => cb.value);
      
      // Add room_ids to formData if any are selected
      if (roomIds.length > 0) {
        formData.room_ids = roomIds;
      }
      
      // Validate required fields
      if (!formData.name || formData.name.length < 2) {
        throw new Error('Service name must be at least 2 characters');
      }
      
      if (!formData.category_id) {
        throw new Error('Please select a category');
      }
      
      if (!formData.duration_minutes || formData.duration_minutes < 5) {
        throw new Error('Duration must be at least 5 minutes');
      }
      
      if (!formData.base_price || formData.base_price <= 0) {
        throw new Error('Base price must be greater than 0');
      }
      
      // Convert numeric fields
      formData.category_id = parseInt(formData.category_id);
      formData.duration_minutes = parseInt(formData.duration_minutes);
      formData.base_price = parseFloat(formData.base_price);
      formData.display_order = parseInt(formData.display_order);
      
      // Convert room_ids to integers if they exist
      if (formData.room_ids) {
        formData.room_ids = formData.room_ids.map(id => parseInt(id));
      }
      
      console.log('Submitting service data:', formData);
      
      // Make API call
      let result;
      if (isEdit && service && service.id) {
        result = await api.services.update(service.id, formData);
        utils.showToast('Service updated successfully', 'success');
      } else {
        result = await api.services.create(formData);
        utils.showToast('Service created successfully', 'success');
      }
      
      console.log('API Response:', result);
      
      // Close modal and refresh
      window.appUtils.closeModal();
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
      
    } catch (error) {
      console.error('Service form error:', error);
      utils.showToast(error.message || 'Failed to save service', 'error');
    }
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getRoomTypeClass(roomType) {
  const classMap = {
    'massage': 'info',
    'spa': 'success',
    'facial': 'warning',
    'hair': 'primary',
    'nails': 'danger',
    'multi_purpose': 'secondary',
    'therapy': 'info',
    'other': 'dark'
  };
  return classMap[roomType] || 'secondary';
}

function formatRoomType(roomType) {
  const typeMap = {
    'massage': 'Massage Room',
    'spa': 'Spa Room',
    'facial': 'Facial Room',
    'hair': 'Hair Station',
    'nails': 'Nail Studio',
    'multi_purpose': 'Multi-Purpose Room',
    'therapy': 'Therapy Room',
    'other': 'Other'
  };
  return typeMap[roomType] || roomType;
}

function formatBedType(bedType) {
  const typeMap = {
    'single': 'Single Bed',
    'double': 'Double Bed',
    'adjustable': 'Adjustable Bed',
    'massage_table': 'Massage Table',
    'none': 'No Bed'
  };
  return typeMap[bedType] || bedType;
}

function formatDate(dateString) {
  if (!dateString) return 'No expiry';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function attachEventListeners(container) {
  // View switchers
  document.getElementById('viewServicesBtn')?.addEventListener('click', async () => {
    currentView = 'services';
    await render(container);
  });
  
  document.getElementById('viewCategoriesBtn')?.addEventListener('click', async () => {
    currentView = 'categories';
    await render(container);
  });
  
  document.getElementById('viewRoomsBtn')?.addEventListener('click', async () => {
    currentView = 'rooms';
    await render(container);
  });
  
  document.getElementById('viewCombosBtn')?.addEventListener('click', async () => {
    currentView = 'combos';
    await render(container);
  });
  
  // Category view switchers
  document.getElementById('viewMainCategories')?.addEventListener('click', async () => {
    currentCategoryView = 'main';
    container.querySelector('#categoriesContent').innerHTML = renderMainCategoriesTable();
  });
  
  document.getElementById('viewSubCategories')?.addEventListener('click', async () => {
    currentCategoryView = 'sub';
    container.querySelector('#categoriesContent').innerHTML = renderSubCategoriesTable();
  });
  
  // Add buttons
  document.getElementById('addServiceBtn')?.addEventListener('click', () => showServiceForm());
  document.getElementById('addMainCategoryBtn')?.addEventListener('click', () => showMainCategoryForm());
  document.getElementById('addSubCategoryBtn')?.addEventListener('click', () => showSubCategoryForm());
  document.getElementById('addRoomBtn')?.addEventListener('click', () => showRoomForm());
  document.getElementById('addComboBtn')?.addEventListener('click', () => comboManager.showComboModal());
  
  // Service filters
  const filterMainCategory = container.querySelector('#filterMainCategory');
  const filterCategory = container.querySelector('#filterCategory');
  const filterStatus = container.querySelector('#filterStatus');
  
  const applyServiceFilters = async () => {
    const mainCategoryId = filterMainCategory?.value;
    const categoryId = filterCategory?.value;
    const status = filterStatus?.value;
    const tabActive = container.querySelector('#tab-active');
    const tabInactive = container.querySelector('#tab-inactive');
    const tabBtnActive = container.querySelector('.tab-btn[data-tab="active"]');
    const tabBtnInactive = container.querySelector('.tab-btn[data-tab="inactive"]');
    
    try {
      if (tabActive) tabActive.innerHTML = '<p class="text-center">Loading...</p>';
      if (tabInactive) tabInactive.innerHTML = '<p class="text-center">Loading...</p>';
      
      // Fetch from server when category filter is set; else get all
      let fetched = [];
      if (categoryId) {
        fetched = await api.services.getAll({ category_id: categoryId });
      } else if (mainCategoryId) {
        fetched = await api.services.getAll({ main_category_id: mainCategoryId });
      } else {
        fetched = await api.services.getAll();
      }
      
      // Apply status filter and show/hide tabs accordingly
      if (status === 'active') {
        // Show only active services
        const activeServices = fetched.filter(s => s.is_active == 1 || s.is_active === true);
        if (tabActive) tabActive.innerHTML = renderServicesTable(activeServices);
        if (tabInactive) tabInactive.innerHTML = '';
        if (tabBtnActive) {
          tabBtnActive.style.display = 'block';
          tabBtnActive.textContent = `Active Services (${activeServices.length})`;
          tabBtnActive.click(); // Switch to active tab
        }
        if (tabBtnInactive) tabBtnInactive.style.display = 'none';
      } else if (status === 'inactive') {
        // Show only inactive services
        const inactiveServices = fetched.filter(s => s.is_active == 0 || s.is_active === false);
        if (tabActive) tabActive.innerHTML = '';
        if (tabInactive) tabInactive.innerHTML = renderServicesTable(inactiveServices);
        if (tabBtnActive) tabBtnActive.style.display = 'none';
        if (tabBtnInactive) {
          tabBtnInactive.style.display = 'block';
          tabBtnInactive.textContent = `Inactive Services (${inactiveServices.length})`;
          tabBtnInactive.click(); // Switch to inactive tab
        }
      } else {
        // Show both tabs (default behavior)
        const activeServices = fetched.filter(s => s.is_active == 1 || s.is_active === true);
        const inactiveServices = fetched.filter(s => s.is_active == 0 || s.is_active === false);
        if (tabActive) tabActive.innerHTML = renderServicesTable(activeServices);
        if (tabInactive) tabInactive.innerHTML = renderServicesTable(inactiveServices);
        if (tabBtnActive) {
          tabBtnActive.style.display = 'block';
          tabBtnActive.textContent = `Active Services (${activeServices.length})`;
        }
        if (tabBtnInactive) {
          tabBtnInactive.style.display = 'block';
          tabBtnInactive.textContent = `Inactive Services (${inactiveServices.length})`;
        }
      }
    } catch (error) {
      console.error('Filter error:', error);
      if (tabActive) tabActive.innerHTML = '<p class="text-error text-center">Failed to load services</p>';
      if (tabInactive) tabInactive.innerHTML = '<p class="text-error text-center">Failed to load services</p>';
    }
  };

  // When main category changes, repopulate subcategory select and re-apply filters
  if (filterMainCategory) {
    filterMainCategory.addEventListener('change', async function() {
      const mainId = this.value;
      const subSelect = filterCategory;
      if (subSelect) {
        // Build options; if main selected, limit subs to that parent
        let optionsHtml = '<option value="">All Categories</option>';
        const mains = mainCategories.filter(mc => !mainId || String(mc.id) === String(mainId));
        optionsHtml += mains.map(cat => `
          <optgroup label="${cat.name}">
            ${(cat.sub_categories || []).filter(sc => sc.is_active !== false).map(sc => `
              <option value="${sc.id}">${sc.name}</option>
            `).join('')}
          </optgroup>
        `).join('');
        subSelect.innerHTML = optionsHtml;
        // Reset subcategory filter on main change
        subSelect.value = '';
      }
      await applyServiceFilters();
    });
  }

  if (filterCategory) filterCategory.addEventListener('change', applyServiceFilters);
  
  if (filterStatus) filterStatus.addEventListener('change', applyServiceFilters);
  
  // Tab switching for services
  const tabButtons = container.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Show corresponding tab content
      const tabPanes = container.querySelectorAll('.tab-pane');
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `tab-${tabName}`) {
          pane.classList.add('active');
        }
      });
    });
  });
  
  // Room filters
  const filterRoomType = container.querySelector('#filterRoomType');
  const filterRoomStatus = container.querySelector('#filterRoomStatus');
  
  const applyRoomFilters = async () => {
    const roomType = filterRoomType?.value;
    const roomStatus = filterRoomStatus?.value;
    
    try {
      let filteredRooms = rooms;
      
      if (roomType) {
        filteredRooms = filteredRooms.filter(r => r.room_type === roomType);
      }
      
      if (roomStatus) {
        filteredRooms = filteredRooms.filter(r => 
          roomStatus === 'active' ? r.is_active : !r.is_active
        );
      }
      
      container.querySelector('#roomsTable').innerHTML = renderRoomsTable(filteredRooms);
    } catch (error) {
      console.error('Filter error:', error);
    }
  };
  
  if (filterRoomType) filterRoomType.addEventListener('change', applyRoomFilters);
  if (filterRoomStatus) filterRoomStatus.addEventListener('change', applyRoomFilters);
  
  // Combo filters
  const filterComboStatus = container.querySelector('#filterComboStatus');
  const filterComboCategory = container.querySelector('#filterComboCategory');
  
  if (filterComboStatus) {
    filterComboStatus.addEventListener('change', function() {
      const status = this.value;
      let filteredCombos = serviceCombos;
      
      if (status === 'active') {
        filteredCombos = filteredCombos.filter(c => c.is_active == 1 || c.is_active === true);
      } else if (status === 'inactive') {
        filteredCombos = filteredCombos.filter(c => c.is_active == 0 || c.is_active === false);
      } else if (status === 'expired') {
        const today = new Date();
        filteredCombos = filteredCombos.filter(c => {
          if (!c.valid_till) return false;
          const validTill = new Date(c.valid_till);
          return validTill < today;
        });
      }
      // Apply category filter if set
      const categoryId = filterComboCategory?.value;
      if (categoryId) {
        filteredCombos = filteredCombos.filter(c => {
          if (!c.service_category_ids) return false;
          const ids = String(c.service_category_ids).split(',').map(s => s.trim());
          return ids.includes(String(categoryId));
        });
      }
      
      const activeCombos = filteredCombos.filter(c => c.is_active == 1 || c.is_active === true);
      const inactiveCombos = filteredCombos.filter(c => c.is_active == 0 || c.is_active === false);
      
      const tabActive = container.querySelector('#tab-combo-active');
      const tabInactive = container.querySelector('#tab-combo-inactive');
      
      if (tabActive) tabActive.innerHTML = renderCombosTable(activeCombos);
      if (tabInactive) tabInactive.innerHTML = renderCombosTable(inactiveCombos);
    });
  }

  if (filterComboCategory) {
    filterComboCategory.addEventListener('change', function() {
      // Reuse status filter logic to refresh with category filter applied
      filterComboStatus?.dispatchEvent(new Event('change'));
    });
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EXPORT FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.servicesModule = {
  // Service functions
  editService: async function(id) {
    try {
      const service = await api.services.getById(id);
      showServiceForm(service);
    } catch (error) {
      utils.showToast('Failed to load service details', 'error');
    }
  },
  
  deleteService: async function(id) {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      try {
        await api.services.delete(id);
        utils.showToast('Service deleted successfully', 'success');
        const contentArea = document.getElementById('contentArea');
        await render(contentArea);
      } catch (error) {
        utils.showToast(error.message || 'Delete failed', 'error');
      }
    }
  },
  
  viewServiceDetails: async function(id) {
    try {
      const service = await api.services.getById(id);
      if (!service) {
        utils.showToast('Service not found', 'error');
        return;
      }
      
      // Find category info
      let categoryName = 'N/A';
      let mainCategoryName = 'N/A';
      const subCat = subCategories.find(sc => sc.id === service.category_id);
      if (subCat) {
        categoryName = subCat.name;
        mainCategoryName = subCat.parent_name || 'N/A';
      }
      
      // Get rooms for this service
      const serviceRooms = service.room_ids ? 
        rooms.filter(r => service.room_ids.includes(r.id)) : [];
      
      let html = `
        <h4><i class="fas fa-spa"></i> ${service.name} - Service Details</h4>
        
        <div class="row">
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-info-circle"></i> Basic Information</h5>
              </div>
              <div class="card-body">
                <p><strong>Category:</strong> ${categoryName} (${mainCategoryName})</p>
                <p><strong>Duration:</strong> ${service.duration_minutes || service.duration || 0} minutes</p>
                <p><strong>Code:</strong> ${service.code || 'N/A'}</p>
                <p><strong>Status:</strong> 
                  <span class="badge badge-${service.is_active ? 'success' : 'danger'}">
                    ${service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-money-bill-wave"></i> Pricing</h5>
              </div>
              <div class="card-body">
                <p><strong>Base Price:</strong> ${utils.formatCurrency(service.base_price || service.price || 0)}</p>
                <p><strong>Tax Rate:</strong> ${service.tax_rate || 0}%</p>
                <p><strong>Final Price:</strong> 
                  ${utils.formatCurrency((service.base_price || service.price || 0) * (1 + (service.tax_rate || 0) / 100))}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        ${serviceRooms.length > 0 ? `
          <div class="card mb-3">
            <div class="card-header">
              <h5><i class="fas fa-door-closed"></i> Available Rooms</h5>
            </div>
            <div class="card-body">
              <div class="d-flex flex-wrap gap-2">
                ${serviceRooms.map(room => `
                  <span class="badge badge-info p-2">
                    <i class="fas fa-door-closed"></i> ${room.name}
                    <small class="ml-2">(${formatRoomType(room.room_type)})</small>
                  </span>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
        
        ${service.full_description || service.description ? `
          <div class="card mb-3">
            <div class="card-header">
              <h5><i class="fas fa-align-left"></i> Description</h5>
            </div>
            <div class="card-body">
              <p>${service.full_description || service.description || ''}</p>
            </div>
          </div>
        ` : ''}
        
        ${service.preparation_notes || service.aftercare_notes ? `
          <div class="row">
            ${service.preparation_notes ? `
              <div class="col-md-6">
                <div class="card mb-3">
                  <div class="card-header">
                    <h5><i class="fas fa-clipboard-list"></i> Preparation Notes</h5>
                  </div>
                  <div class="card-body">
                    <p>${service.preparation_notes}</p>
                  </div>
                </div>
              </div>
            ` : ''}
            ${service.aftercare_notes ? `
              <div class="col-md-6">
                <div class="card mb-3">
                  <div class="card-header">
                    <h5><i class="fas fa-heart"></i> Aftercare Notes</h5>
                  </div>
                  <div class="card-body">
                    <p>${service.aftercare_notes}</p>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      `;
      
      window.appUtils.showModal('Service Details', html);
    } catch (error) {
      utils.showToast('Failed to load service details', 'error');
    }
  },
  
  // Category functions
  editMainCategory: async function(id) {
    try {
      const mainCategories = await apiHelper.getCategoriesWithFallback();
      const category = mainCategories.find(c => c.id === id);
      if (category) {
        showMainCategoryForm(category);
      }
    } catch (error) {
      utils.showToast('Failed to load category details', 'error');
    }
  },
  
  editSubCategory: async function(id) {
    try {
      const allSubs = await apiHelper.getSubCategoriesWithFallback();
      const category = allSubs.find(c => c.id === id);
      if (category) {
        showSubCategoryForm(category);
      }
    } catch (error) {
      utils.showToast('Failed to load sub-category details', 'error');
    }
  },
  
  deleteMainCategory: async function(id) {
    if (confirm('Are you sure you want to delete this main category? This action cannot be undone.')) {
      try {
        await api.services.deleteCategory(id);
        utils.showToast('Main category deleted successfully', 'success');
        const contentArea = document.getElementById('contentArea');
        await render(contentArea);
      } catch (error) {
        utils.showToast(error.message || 'Delete failed', 'error');
      }
    }
  },
  
  deleteSubCategory: async function(id) {
    if (confirm('Are you sure you want to delete this sub-category? This action cannot be undone.')) {
      try {
        await api.services.deleteCategory(id);
        utils.showToast('Sub-category deleted successfully', 'success');
        const contentArea = document.getElementById('contentArea');
        await render(contentArea);
      } catch (error) {
        utils.showToast(error.message || 'Delete failed', 'error');
      }
    }
  },
  
  viewCategoryDetails: async function(id) {
    try {
      const mainCategories = await apiHelper.getCategoriesWithFallback();
      const category = mainCategories.find(c => c.id === id);
      
      if (!category) {
        utils.showToast('Category not found', 'error');
        return;
      }
      
      const subCategories = category.sub_categories || [];
      const categoryServices = services.filter(s => s.main_category_id === id);
      
      let html = `
        <h4><i class="fas fa-folder"></i> ${category.name} - Details</h4>
        <div class="row">
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-info-circle"></i> Category Information</h5>
              </div>
              <div class="card-body">
                <p><strong>Description:</strong> ${category.description || 'No description'}</p>
                <p><strong>Display Order:</strong> ${category.display_order || 0}</p>
                <p><strong>Status:</strong> 
                  <span class="badge badge-${category.is_active ? 'success' : 'danger'}">
                    ${category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-chart-pie"></i> Statistics</h5>
              </div>
              <div class="card-body">
                <p><strong>Sub-Categories:</strong> 
                  <span class="badge badge-info">${subCategories.length}</span>
                </p>
                <p><strong>Total Services:</strong> 
                  <span class="badge badge-primary">${categoryServices.length}</span>
                </p>
                <p><strong>Active Services:</strong> 
                  <span class="badge badge-success">${categoryServices.filter(s => s.is_active).length}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      if (subCategories.length > 0) {
        html += `
          <div class="card">
            <div class="card-header">
              <h5><i class="fas fa-list"></i> Sub-Categories</h5>
            </div>
            <div class="card-body">
              <div class="d-flex flex-wrap gap-2">
                ${subCategories.map(sub => `
                  <span class="badge badge-secondary p-2">
                    <i class="fas fa-list"></i> ${sub.name}
                    <small class="ml-2">(${services.filter(s => s.category_id === sub.id).length} services)</small>
                  </span>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }
      
      window.appUtils.showModal('Category Details', html);
    } catch (error) {
      utils.showToast('Failed to load category details', 'error');
    }
  },
  
  viewSubCategoryServices: async function(categoryId) {
    try {
      const servicesList = await api.services.getByCategory(categoryId);
      const category = subCategories.find(c => c.id === categoryId);
      const parentCategory = mainCategories.find(mc => 
        mc.sub_categories && mc.sub_categories.some(sc => sc.id === categoryId)
      );
      
      let html = `<h4><i class="fas fa-list"></i> Services in "${category?.name || 'Sub-Category'}"</h4>`;
      
      if (parentCategory) {
        html += `<p class="text-muted">Under: <strong>${parentCategory.name}</strong></p>`;
      }
      
      if (servicesList.length === 0) {
        html += '<p class="text-center">No services in this sub-category</p>';
      } else {
        html += `
          <div style="max-height: 400px; overflow-y: auto;">
            <table class="services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Rooms</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${servicesList.map(s => {
                  const serviceRooms = s.room_ids ? 
                    rooms.filter(r => s.room_ids.includes(r.id)) : [];
                  
                  return `
                    <tr>
                      <td><strong>${s.name}</strong></td>
                      <td>${s.duration_minutes || s.duration} min</td>
                      <td>${utils.formatCurrency(s.base_price || s.price)}</td>
                      <td>
                        ${serviceRooms.slice(0, 2).map(r => r.name).join(', ')}
                        ${serviceRooms.length > 2 ? ` +${serviceRooms.length - 2} more` : ''}
                      </td>
                      <td>
                        <span class="badge badge-${s.is_active ? 'success' : 'danger'}">
                          ${s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      
      window.appUtils.showModal('Sub-Category Services', html);
    } catch (error) {
      utils.showToast('Failed to load category services', 'error');
    }
  },
  
  // Room functions
  editRoom: async function(id) {
    try {
      const room = await api.services.getRoomById(id);
      if (room) {
        showRoomForm(room);
      }
    } catch (error) {
      utils.showToast('Failed to load room details', 'error');
    }
  },
  
  deleteRoom: async function(id) {
    if (confirm('Delete this room? It will be removed from any linked services. This action cannot be undone.')) {
      try {
        await api.services.deleteRoom(id);
        utils.showToast('Room deleted successfully', 'success');
        const contentArea = document.getElementById('contentArea');
        await render(contentArea);
      } catch (error) {
        utils.showToast(error.message || 'Delete failed', 'error');
      }
    }
  },
  
  viewRoomDetails: async function(id) {
    try {
      const room = await api.services.getRoomById(id);
      
      if (!room) {
        utils.showToast('Room not found', 'error');
        return;
      }
      
      const roomServices = services.filter(s => 
        s.room_ids && s.room_ids.includes(room.id)
      );
      
      let html = `
        <h4><i class="fas fa-door-closed"></i> ${room.name} - Room Details</h4>
        
        <div class="row">
          <div class="col-md-8">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-info-circle"></i> Basic Information</h5>
              </div>
              <div class="card-body">
                <p><strong>Room Type:</strong> 
                  <span class="badge badge-${getRoomTypeClass(room.room_type)}">
                    ${formatRoomType(room.room_type)}
                  </span>
                </p>
                <p><strong>Capacity:</strong> ${room.capacity} ${room.capacity === 1 ? 'person' : 'people'}</p>
                <p><strong>Description:</strong> ${room.description || 'No description'}</p>
                <p><strong>Status:</strong> 
                  <span class="badge badge-${room.is_active ? 'success' : 'danger'}">
                    ${room.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-chart-pie"></i> Statistics</h5>
              </div>
              <div class="card-body">
                <p class="text-center">
                  <span class="display-4 text-primary">${roomServices.length}</span><br>
                  <small>Services in this room</small>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-clipboard-list"></i> Specifications</h5>
              </div>
              <div class="card-body">
                <p><strong>Bed Type:</strong> ${formatBedType(room.bed_type) || 'N/A'}</p>
                <p><strong>AC Type:</strong> ${room.ac_type?.toUpperCase() || 'N/A'}</p>
                <p><strong>Lighting:</strong> ${room.lighting_type || 'N/A'}</p>
                ${room.special_equipment ? `
                  <p><strong>Special Equipment:</strong> ${room.special_equipment}</p>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header">
                <h5><i class="fas fa-check-circle"></i> Facilities</h5>
              </div>
              <div class="card-body">
                <div class="facilities-grid">
                  ${room.shower_available ? `
                    <div class="facility-item">
                      <i class="fas fa-shower text-success"></i> Shower Available
                    </div>
                  ` : ''}
                  ${room.steam_sauna_available ? `
                    <div class="facility-item">
                      <i class="fas fa-temperature-high text-success"></i> Steam/Sauna
                    </div>
                  ` : ''}
                  ${room.jacuzzi_available ? `
                    <div class="facility-item">
                      <i class="fas fa-hot-tub text-success"></i> Jacuzzi
                    </div>
                  ` : ''}
                  ${room.music_system ? `
                    <div class="facility-item">
                      <i class="fas fa-music text-success"></i> Music System
                    </div>
                  ` : ''}
                  ${!room.shower_available && !room.steam_sauna_available && !room.jacuzzi_available && !room.music_system ? `
                    <p class="text-muted">No special facilities</p>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      window.appUtils.showModal('Room Details', html);
    } catch (error) {
      utils.showToast('Failed to load room details', 'error');
    }
  },
  
  viewRoomServices: async function(roomId) {
    try {
      const room = rooms.find(r => r.id === parseInt(roomId));
      const roomServices = services.filter(s => 
        s.room_ids && s.room_ids.includes(parseInt(roomId))
      );
      
      let html = `<h4><i class="fas fa-door-closed"></i> Services in "${room?.name || 'Room'}"</h4>`;
      
      if (roomServices.length === 0) {
        html += '<p class="text-center">No services assigned to this room</p>';
      } else {
        html += `
          <div style="max-height: 400px; overflow-y: auto;">
            <table class="services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${roomServices.map(s => {
                  // Find category for this service
                  let categoryName = 'N/A';
                  const subCat = subCategories.find(sc => sc.id === s.category_id);
                  if (subCat) {
                    categoryName = subCat.name;
                  }
                  
                  return `
                    <tr>
                      <td><strong>${s.name}</strong></td>
                      <td>${categoryName}</td>
                      <td>${s.duration_minutes || s.duration} min</td>
                      <td>${utils.formatCurrency(s.base_price || s.price)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      
      window.appUtils.showModal('Room Services', html);
    } catch (error) {
      utils.showToast('Failed to load room services', 'error');
    }
  },
  
  // Combo functions - integrated from comboManager
  showComboModal: async function(combo = null) {
    await comboManager.showComboModal(combo);
  },
  
  editCombo: async function(id) {
    await comboManager.editCombo(id);
  },
  
  deleteCombo: async function(id) {
    await comboManager.deleteCombo(id);
  },
  
  toggleComboStatus: async function(id, status) {
    await comboManager.toggleComboStatus(id, status);
  },
  
  viewComboDetails: async function(id) {
    await comboManager.viewComboDetails(id);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CSS STYLES
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    /* Existing styles... */
    .combos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .combo-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.3s, box-shadow 0.3s;
      border: 1px solid #dee2e6;
    }
    
    .combo-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }
    
    .combo-card.expired {
      opacity: 0.7;
      border-color: #ffc107;
    }
    
    .combo-card.upcoming {
      border-color: #17a2b8;
    }
    
    .combo-header {
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      position: relative;
    }
    
    .combo-status {
      position: absolute;
      top: 10px;
      right: 10px;
    }
    
    .combo-title {
      margin: 0;
      font-size: 1.2rem;
      color: white;
    }
    
    .combo-body {
      padding: 15px;
    }
    
    .combo-description {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 15px;
    }
    
    .combo-services ul {
      list-style: none;
      padding: 0;
      margin: 0 0 15px 0;
      font-size: 0.85rem;
    }
    
    .combo-services li {
      padding: 5px 0;
      border-bottom: 1px dashed #eee;
    }
    
    .combo-services li:last-child {
      border-bottom: none;
    }
    
    .combo-pricing {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }
    
    .original-price {
      text-decoration: line-through;
      color: #999;
    }
    
    .combo-price {
      font-weight: bold;
      color: #28a745;
      font-size: 1.1rem;
    }
    
    .savings {
      color: #dc3545;
      font-weight: bold;
    }
    
    .combo-validity {
      color: #666;
      font-size: 0.85rem;
      text-align: center;
    }
    
    .combo-footer {
      padding: 10px 15px;
      border-top: 1px solid #dee2e6;
      background: #f8f9fa;
    }
    
    /* Combo Form Styles */
    .selected-services-list {
      background: #f8f9fa;
    }
    
    .selected-service-item {
      padding: 10px;
      margin-bottom: 8px;
      background: white;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }
    
    .selected-service-item .service-price {
      color: #28a745;
      font-weight: bold;
      margin-left: 10px;
    }
    
    .remove-service {
      padding: 2px 6px;
    }
    
    .selected-summary {
      padding: 10px;
      background: #e9ecef;
      border-radius: 4px;
      margin-top: 10px;
    }
    
    .service-checkbox:checked + label {
      background-color: #e8f5e9;
    }
    
    .service-item {
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 5px;
      transition: background-color 0.2s;
    }
    
    .service-item:hover {
      background-color: #f8f9fa;
    }
    
    .service-price {
      float: right;
      color: #28a745;
      font-weight: bold;
    }
    
    .category-title {
      color: #008080;
      font-weight: 600;
      border-bottom: 2px solid #008080;
      padding-bottom: 5px;
      margin-bottom: 10px;
      font-size: 0.95rem;
    }
    
    .applicable-days {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
    }
    
    .form-check-inline {
      margin-right: 20px;
    }
    
    .text-decoration-line-through {
      text-decoration: line-through;
    }
    
    .font-weight-bold {
      font-weight: bold;
    }
    
    /* Loading state */
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 2s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Debug styles */
    .debug-info {
      background: #f8f9fa;
      border-left: 4px solid #007bff;
      padding: 10px;
      margin: 10px 0;
      font-size: 0.85rem
    }
    
    .debug-info pre {
      background: white;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 10px 0;
    }
  `;
  document.head.appendChild(style);
});