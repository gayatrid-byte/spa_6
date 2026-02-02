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
        
        <div class="d-flex gap-2 mt-2">
          <div class="form-group" style="flex: 1">
            <label for="taxRate">Tax Rate (%)</label>
            <input type="number" id="taxRate" name="taxRate" value="${savedSettings.billing?.taxRate || 0}" min="0" step="0.1">
          </div>
          <div class="form-group" style="flex: 1">
            <label for="currency">Currency</label>
            <select id="currency" name="currency">
              <option value="USD" ${(savedSettings.billing?.currency === 'USD' || !savedSettings.billing?.currency) ? 'selected' : ''}>USD ($)</option>
              <option value="INR" ${savedSettings.billing?.currency === 'INR' ? 'selected' : ''}>Indian Rupee ($)</option>
              <option value="EUR" ${savedSettings.billing?.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
              <option value="GBP" ${savedSettings.billing?.currency === 'GBP' ? 'selected' : ''}>British Pound (£)</option>
            </select>
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
          <th>Phone</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${usersList.map(user => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-info">${user.role}</span></td>
            <td>${user.phone || 'N/A'}</td>
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
          email: document.getElementById('salonEmail').value
        },
        billing: {
          taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
          currency: document.getElementById('currency').value,
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
      
      <div class="form-group">
        <label for="userPhone">Phone</label>
        <input type="tel" id="userPhone" name="phone" value="${user?.phone || ''}">
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
      role: document.getElementById('userRole').value,
      phone: document.getElementById('userPhone').value
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