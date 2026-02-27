// // Settings module
// let users = [];

// export async function render(container) {
//   const currentUser = auth.getCurrentUser();
//   const userRole = currentUser?.role;
  
//   // Check permissions
//   if (!permissions.can(userRole, 'manageSettings')) {
//     container.innerHTML = `
//       <div class="card">
//         <h3>Access Denied</h3>
//         <p>You don't have permission to access settings.</p>
//       </div>
//     `;
//     return;
//   }
  
//   container.innerHTML = `
//     <div class="card mb-3">
//       <h3>Salon Settings</h3>
//       <form id="salonSettingsForm">
//         <div class="form-group">
//           <label for="salonName">Salon Name</label>
//           <input type="text" id="salonName" name="name" value="My Salon">
//         </div>
        
//         <div class="form-group">
//           <label for="salonAddress">Address</label>
//           <input type="text" id="salonAddress" name="address" value="">
//         </div>
        
//         <div class="form-group">
//           <label for="salonPhone">Phone</label>
//           <input type="tel" id="salonPhone" name="phone" value="">
//         </div>
        
//         <div class="form-group">
//           <label for="salonEmail">Email</label>
//           <input type="email" id="salonEmail" name="email" value="">
//         </div>
        
//         <div class="d-flex gap-2 mt-2">
//           <div class="form-group" style="flex: 1">
//             <label for="taxRate">Tax Rate (%)</label>
//             <input type="number" id="taxRate" name="taxRate" value="0" min="0" step="0.1">
//           </div>
//           <div class="form-group" style="flex: 1">
//             <label for="currency">Currency</label>
//             <select id="currency" name="currency">
//               <option value="USD">USD</option>
//               <option value="EUR">EUR</option>
//               <option value="GBP">GBP</option>
//             </select>
//           </div>
//         </div>
        
//         <button type="submit" class="btn btn-primary mt-2">Save Settings</button>
//       </form>
//     </div>
    
//     ${permissions.can(userRole, 'manageUsers') ? `
//       <div class="card">
//         <div class="table-header">
//           <h4>Users</h4>
//           <button id="addUserBtn" class="btn btn-primary btn-sm">Add User</button>
//         </div>
        
//         <div id="usersTable">
//           Loading...
//         </div>
//       </div>
//     ` : ''}
//   `;
  
//   // Attach event listeners
//   attachEventListeners(container);
  
//   // Load users if has permission
//   if (permissions.can(userRole, 'manageUsers')) {
//     loadUsers(container);
//   }
// }

// async function loadUsers(container) {
//   try {
//     users = await api.settings.getAllUsers();
//     container.querySelector('#usersTable').innerHTML = renderUsersTable(users);
//   } catch (error) {
//     console.error('Error loading users:', error);
//     container.querySelector('#usersTable').innerHTML = '<p class="text-center">Failed to load users</p>';
//   }
// }

// function renderUsersTable(usersList) {
//   if (usersList.length === 0) {
//     return '<p class="text-center">No users found</p>';
//   }
  
//   return `
//     <table>
//       <thead>
//         <tr>
//           <th>Name</th>
//           <th>Email</th>
//           <th>Role</th>
//           <th>Phone</th>
//           <th>Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//         ${usersList.map(user => `
//           <tr>
//             <td>${user.name}</td>
//             <td>${user.email}</td>
//             <td><span class="badge badge-info">${user.role}</span></td>
//             <td>${user.phone || 'N/A'}</td>
//             <td>
//               <button class="btn btn-sm btn-outline" onclick="window.settingsModule.editUser(${user.id})">Edit</button>
//               <button class="btn btn-sm btn-danger" onclick="window.settingsModule.deleteUser(${user.id})">Delete</button>
//             </td>
//           </tr>
//         `).join('')}
//       </tbody>
//     </table>
//   `;
// }

// function attachEventListeners(container) {
//   // Save salon settings
//   const settingsForm = container.querySelector('#salonSettingsForm');
//   if (settingsForm) {
//     settingsForm.addEventListener('submit', async function(e) {
//       e.preventDefault();
      
//       const settingsData = {
//         salon: {
//           name: document.getElementById('salonName').value,
//           address: document.getElementById('salonAddress').value,
//           phone: document.getElementById('salonPhone').value,
//           email: document.getElementById('salonEmail').value
//         },
//         billing: {
//           taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
//           currency: document.getElementById('currency').value
//         }
//       };
      
//       try {
//         await api.settings.update(settingsData);
//         utils.showToast('Settings saved successfully', 'success');
//       } catch (error) {
//         utils.showToast(error.message || 'Failed to save settings', 'error');
//       }
//     });
//   }
  
//   // Add user button
//   const addUserBtn = container.querySelector('#addUserBtn');
//   if (addUserBtn) {
//     addUserBtn.addEventListener('click', () => showUserForm());
//   }
// }

// function showUserForm(user = null) {
//   const isEdit = !!user;
//   const currentUser = auth.getCurrentUser();
  
//   const formHTML = `
//     <form id="userForm">
//       <div class="form-group">
//         <label for="userName">Name *</label>
//         <input type="text" id="userName" name="name" value="${user?.name || ''}" required>
//       </div>
      
//       <div class="form-group">
//         <label for="userEmail">Email *</label>
//         <input type="email" id="userEmail" name="email" value="${user?.email || ''}" required>
//       </div>
      
//       <div class="form-group">
//         <label for="userPassword">Password ${isEdit ? '(leave blank to keep current)' : '*'}</label>
//         <input type="password" id="userPassword" name="password" ${!isEdit ? 'required' : ''}>
//       </div>
      
//       <div class="form-group">
//         <label for="userRole">Role *</label>
//         <select id="userRole" name="role" required>
//           <option value="">Select role</option>
//           <option value="owner" ${user?.role === 'owner' ? 'selected' : ''}>Owner</option>
//           <option value="center" ${user?.role === 'center' ? 'selected' : ''}>Center Manager</option>
//           <option value="staff" ${user?.role === 'staff' ? 'selected' : ''}>Staff</option>
//         </select>
//       </div>
      
//       <div class="form-group">
//         <label for="userPhone">Phone</label>
//         <input type="tel" id="userPhone" name="phone" value="${user?.phone || ''}">
//       </div>
      
//       <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} User</button>
//     </form>
//   `;
  
//   window.appUtils.showModal(isEdit ? 'Edit User' : 'Add User', formHTML);
  
//   // Attach form submit handler
//   document.getElementById('userForm').addEventListener('submit', async function(e) {
//     e.preventDefault();
    
//     const formData = {
//       name: document.getElementById('userName').value,
//       email: document.getElementById('userEmail').value,
//       role: document.getElementById('userRole').value,
//       phone: document.getElementById('userPhone').value
//     };
    
//     // Add password only if provided or creating new user
//     const password = document.getElementById('userPassword').value;
//     if (password) {
//       formData.password = password;
//     }
    
//     try {
//       if (isEdit) {
//         await api.settings.updateUser(user.id, formData);
//         utils.showToast('User updated successfully', 'success');
//       } else {
//         await api.settings.createUser(formData);
//         utils.showToast('User created successfully', 'success');
//       }
      
//       window.appUtils.closeModal();
//       const contentArea = document.getElementById('contentArea');
//       await render(contentArea);
//     } catch (error) {
//       utils.showToast(error.message || 'Operation failed', 'error');
//     }
//   });
// }

// // Export functions for global access
// window.settingsModule = {
//   editUser: async function(id) {
//     const user = await api.settings.getAllUsers().then(users => users.find(u => u.id === id));
//     showUserForm(user);
//   },
  
//   deleteUser: async function(id) {
//     if (confirm('Are you sure you want to delete this user?')) {
//       try {
//         await api.settings.deleteUser(id);
//         utils.showToast('User deleted successfully', 'success');
//         const contentArea = document.getElementById('contentArea');
//         await render(contentArea);
//       } catch (error) {
//         utils.showToast(error.message || 'Delete failed', 'error');
//       }
//     }
//   }
// };


// Settings module
let users = [];

export async function render(container) {
  const currentUser = auth.getCurrentUser();
  const userRole = currentUser?.role;
  
  // Check permissions
  if (!permissions.can(userRole, 'manageSettings')) {
    container.innerHTML = `
      <div class="card">
        <h3>Access Denied</h3>
        <p>You don't have permission to access settings.</p>
      </div>
    `;
    return;
  }
  
  // Try to load saved settings
  let savedSettings = {};
  try {
    savedSettings = await api.settings.get();
  } catch (error) {
    console.log('Using default settings');
  }
  
  container.innerHTML = `
    <div class="card mb-3">
      <h3>Salon Settings</h3>
      <form id="salonSettingsForm">
        <div class="form-group">
          <label for="salonName">Salon Name</label>
          <input type="text" id="salonName" name="name" value="${savedSettings.salon?.name || 'My Salon'}">
        </div>
        
        <div class="form-group">
          <label for="salonAddress">Address</label>
          <input type="text" id="salonAddress" name="address" value="${savedSettings.salon?.address || ''}">
        </div>
        
        <div class="form-group">
          <label for="salonPhone">Phone</label>
          <input type="tel" id="salonPhone" name="phone" value="${savedSettings.salon?.phone || ''}">
        </div>
        
        <div class="form-group">
          <label for="salonEmail">Email</label>
          <input type="email" id="salonEmail" name="email" value="${savedSettings.salon?.email || ''}">
        </div>
        
        <div class="form-group">
          <label for="salonGstin">GSTIN Number</label>
          <input type="text" id="salonGstin" name="gstin" value="${savedSettings.salon?.gstin || ''}" 
                 placeholder="e.g. 27AAAAA0000A1Z5" pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}">
          <small class="text-muted">15-character alphanumeric code for tax identification</small>
        </div>
        
        <div class="form-group">
          <label for="companyLogo">Company Logo</label>
          <div class="logo-upload-container">
            <input type="file" id="companyLogo" name="logo" accept="image/*" style="display: none;">
            <div class="logo-preview" id="logoPreview">
              ${savedSettings.salon?.logo ? `<img src="${savedSettings.salon.logo}" alt="Company Logo" style="max-width: 150px; max-height: 100px; object-fit: contain;">` : '<div class="no-logo-placeholder">No logo uploaded</div>'}
            </div>
            <div class="logo-actions mt-2">
              <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('companyLogo').click()">Choose Logo</button>
              ${savedSettings.salon?.logo ? '<button type="button" class="btn btn-sm btn-danger" id="removeLogo">Remove Logo</button>' : ''}
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>GST Configuration</label>

          <div style="margin-bottom:8px;">
            <label>
              <input type="checkbox" id="gstEnabled" ${savedSettings.billing?.gst_enabled ? 'checked' : ''}>
              Enable GST
            </label>
          </div>

          <div style="display:flex; gap:10px;">
            <div style="flex:1;">
              <label>GST Type</label>
              <select id="gstType">
                <option value="intra" ${savedSettings.billing?.gst_type === 'intra' ? 'selected' : ''}>Intra State (CGST + SGST)</option>
                <option value="inter" ${savedSettings.billing?.gst_type === 'inter' ? 'selected' : ''}>Inter State (IGST)</option>
              </select>
            </div>

            <div style="flex:1;">
              <label>Total GST %</label>
              <input type="number" id="gstRate" value="${savedSettings.billing?.gst_rate || 18}" step="0.1">
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="invoicePrefix">Invoice Prefix</label>
          <input type="text" id="invoicePrefix" name="invoicePrefix" value="${savedSettings.billing?.invoicePrefix || 'INV'}" maxlength="10">
        </div>
        
        <div class="form-group">
          <label for="nextInvoiceNumber">Next Invoice Number</label>
          <input type="number" id="nextInvoiceNumber" name="nextInvoiceNumber" value="${savedSettings.billing?.nextInvoiceNumber || 1001}" min="1">
        </div>
        
        <button type="submit" class="btn btn-primary mt-2">Save Settings</button>
      </form>
    </div>
    
    ${permissions.can(userRole, 'manageUsers') ? `
      <div class="card">
        <div class="table-header">
          <h4>Users</h4>
          <button id="addUserBtn" class="btn btn-primary btn-sm">Add User</button>
        </div>
        
        <div id="usersTable">
          Loading...
        </div>
      </div>
    ` : ''}
  `;
  
  // Attach event listeners
  attachEventListeners(container);
  
  // Load users if has permission
  if (permissions.can(userRole, 'manageUsers')) {
    loadUsers(container);
  }
}

async function loadUsers(container) {
  try {
    users = await api.settings.getAllUsers();
    container.querySelector('#usersTable').innerHTML = renderUsersTable(users);
  } catch (error) {
    console.error('Error loading users:', error);
    container.querySelector('#usersTable').innerHTML = '<p class="text-center">Failed to load users</p>';
  }
}

function renderUsersTable(usersList) {
  if (usersList.length === 0) {
    return '<p class="text-center">No users found</p>';
  }
  
  return `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${usersList.map(user => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-info">${user.role}</span></td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="window.settingsModule.editUser(${user.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="window.settingsModule.deleteUser(${user.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function attachEventListeners(container) {
  // Logo file upload handling
  const logoInput = container.querySelector('#companyLogo');
  const logoPreview = container.querySelector('#logoPreview');
  const removeLogo = container.querySelector('#removeLogo');
  
  if (logoInput) {
    logoInput.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          utils.showToast('Please select an image file', 'error');
          return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          utils.showToast('Image file size should be less than 2MB', 'error');
          return;
        }
        
        try {
          // Upload the logo file
          const formData = new FormData();
          formData.append('logo', file);
          
          // Use api.request directly for file uploads to avoid JSON.stringify
          const uploadResult = await api.request('/settings/upload-logo', {
            method: 'POST',
            body: formData
          });
          
          // Store the uploaded file path
          window.currentLogoData = uploadResult.logoPath;
          
          // Update preview
          logoPreview.innerHTML = `<img src="${uploadResult.logoUrl}" alt="Company Logo" style="max-width: 150px; max-height: 100px; object-fit: contain;">`;
          
          // Add remove button if not exists
          const logoActions = container.querySelector('.logo-actions');
          if (logoActions && !logoActions.querySelector('#removeLogo')) {
            logoActions.innerHTML += '<button type="button" class="btn btn-sm btn-danger" id="removeLogo">Remove Logo</button>';
            // Re-attach remove event
            container.querySelector('#removeLogo').addEventListener('click', removeLogo);
          }
          
          // Update the main app logo
          const appLogo = document.getElementById('appLogo');
          if (appLogo) {
            // Get current salon name from the form
            const salonName = document.getElementById('salonName')?.value || 'Salon Manager';
            appLogo.innerHTML = `
              <img src="${uploadResult.logoUrl}" alt="Company Logo" style="max-height: 40px; max-width: 200px; object-fit: contain; display: block; margin: 0 auto;">
              <h3 style="margin: 5px 0 0 0; text-align: center; font-size: 14px; font-weight: 500;">${salonName}</h3>
            `;
          }
          
          utils.showToast('Logo uploaded successfully', 'success');
        } catch (error) {
          console.error('Logo upload error:', error);
          utils.showToast('Failed to upload logo: ' + error.message, 'error');
        }
      }
    });
  }
  
  if (removeLogo) {
    removeLogo.addEventListener('click', function() {
      if (confirm('Are you sure you want to remove the logo?')) {
        window.currentLogoData = '';
        logoPreview.innerHTML = '<div class="no-logo-placeholder">No logo uploaded</div>';
        
        // Clear the main app logo and restore salon name
        const appLogo = document.getElementById('appLogo');
        if (appLogo) {
          const salonName = document.getElementById('salonName')?.value || 'Salon Manager';
          appLogo.innerHTML = `<h2>${salonName}</h2>`;
        }
        
        this.remove();
        utils.showToast('Logo removed', 'info');
      }
    });
  }

  // Save salon settings
  const settingsForm = container.querySelector('#salonSettingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const settingsData = {
        salon: {
          name: document.getElementById('salonName').value,
          address: document.getElementById('salonAddress').value,
          phone: document.getElementById('salonPhone').value,
          email: document.getElementById('salonEmail').value,
          gstin: document.getElementById('salonGstin').value,
          logoUrl: window.currentLogoData || savedSettings.salon?.logoUrl || ''
        },
        billing: {
          gst_enabled: !!document.getElementById('gstEnabled')?.checked,
          gst_type: document.getElementById('gstType')?.value || 'intra',
          gst_rate: parseFloat(document.getElementById('gstRate')?.value) || 18,
          cgst_rate: 9,
          sgst_rate: 9,
          igst_rate: 18,
          currency: 'INR',
          invoicePrefix: document.getElementById('invoicePrefix').value,
          nextInvoiceNumber: parseInt(document.getElementById('nextInvoiceNumber').value) || 1001
        }
      };
      
      try {
        await api.settings.update(settingsData);
        utils.showToast('Settings saved successfully', 'success');
      } catch (error) {
        utils.showToast(error.message || 'Failed to save settings', 'error');
      }
    });
  }
  
  // Add user button
  const addUserBtn = container.querySelector('#addUserBtn');
  if (addUserBtn) {
    addUserBtn.addEventListener('click', () => showUserForm());
  }
}

function showUserForm(user = null) {
  const isEdit = !!user;
  const currentUser = auth.getCurrentUser();
  
  const formHTML = `
    <form id="userForm">
      <div class="form-group">
        <label for="userName">Name *</label>
        <input type="text" id="userName" name="name" value="${user?.name || ''}" required>
      </div>
      
      <div class="form-group">
        <label for="userEmail">Email *</label>
        <input type="email" id="userEmail" name="email" value="${user?.email || ''}" required>
      </div>
      
      <div class="form-group">
        <label for="userPassword">Password ${isEdit ? '(leave blank to keep current)' : '*'}</label>
        <input type="password" id="userPassword" name="password" ${!isEdit ? 'required' : ''}>
      </div>
      
      <div class="form-group">
        <label for="userRole">Role *</label>
        <select id="userRole" name="role" required>
          <option value="">Select role</option>
          <option value="owner" ${user?.role === 'owner' ? 'selected' : ''}>Owner</option>
          <option value="center" ${user?.role === 'center' ? 'selected' : ''}>Center Manager</option>
          <option value="staff" ${user?.role === 'staff' ? 'selected' : ''}>Staff</option>
        </select>
      </div>
      
      <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} User</button>
    </form>
  `;
  
  window.appUtils.showModal(isEdit ? 'Edit User' : 'Add User', formHTML);
  
  // Attach form submit handler
  document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('userName').value,
      email: document.getElementById('userEmail').value,
      role: document.getElementById('userRole').value
    };
    
    // Add password only if provided or creating new user
    const password = document.getElementById('userPassword').value;
    if (password) {
      formData.password = password;
    }
    
    try {
      if (isEdit) {
        await api.settings.updateUser(user.id, formData);
        utils.showToast('User updated successfully', 'success');
      } else {
        await api.settings.createUser(formData);
        utils.showToast('User created successfully', 'success');
      }
      
      window.appUtils.closeModal();
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
    } catch (error) {
      utils.showToast(error.message || 'Operation failed', 'error');
    }
  });
}

// Export functions for global access
window.settingsModule = {
  editUser: async function(id) {
    const user = await api.settings.getAllUsers().then(users => users.find(u => u.id === id));
    showUserForm(user);
  },
  
  deleteUser: async function(id) {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.settings.deleteUser(id);
        utils.showToast('User deleted successfully', 'success');
        const contentArea = document.getElementById('contentArea');
        await render(contentArea);
      } catch (error) {
        utils.showToast(error.message || 'Delete failed', 'error');
      }
    }
  }
};