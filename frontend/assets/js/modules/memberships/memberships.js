// export async function render(container) {
//   // Show loading state
//   container.innerHTML = `
//     <div class="card">
//       <div class="text-center p-5">
//         <div class="spinner"></div>
//         <p class="mt-3">Loading membership data...</p>
//       </div>
//     </div>
//   `;

//   try {
//     const [plans, myMembership, profile] = await Promise.all([
//       api.memberships.getPlans().catch(err => { console.error('Plans load error', err); return []; }),
//       api.memberships.getMy().catch(err => { console.warn('No active membership', err); return null; }),
//       api.auth.getProfile().catch(() => null)
//     ]);

//     const currentUser = profile || auth.getCurrentUser();

//       const membershipCard = myMembership ? `
//           <div class="card">
//             <div class="card-header d-flex justify-content-between align-items-center">
//               <span>My Membership</span>
//               ${['owner','center'].includes(currentUser?.role) ? `
//               <div class="d-flex gap-2">
//                 <button class="btn btn-outline btn-sm" data-action="edit-membership" data-membership-id="${myMembership.id}">Edit</button>
//                 <button class="btn btn-danger btn-sm" data-action="delete-membership" data-membership-id="${myMembership.id}">Delete</button>
//               </div>` : ''}
//             </div>
//             <div class="card-body">
//             <div class="grid grid-2">
//               <div>
//                 <p><strong>Plan:</strong> ${myMembership.plan_name} (${myMembership.tier})</p>
//                 <p><strong>Status:</strong> ${myMembership.status}</p>
//                 <p><strong>Period:</strong> ${myMembership.start_date} → ${myMembership.end_date}</p>
//               </div>
//               <div>
//                 <p><strong>Discount:</strong> ${Number(myMembership.discount_percentage)}%</p>
//                 <p><strong>Wallet:</strong> ${Number(myMembership.wallet_balance).toFixed(2)}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       ` : '';

//     const canManage = ['owner','center'].includes(currentUser?.role);
//     const plansList = plans.map(p => `
//       <div class="plan card">
//         <div class="card-header d-flex justify-content-between align-items-center">
//           <span>${p.name} <span class="badge">${p.tier}</span></span>
//           ${canManage ? `<div class="d-flex gap-2">
//             <button class="btn btn-outline btn-sm" data-action="edit-plan" data-plan-id="${p.id}">Edit</button>
//             <button class="btn btn-danger btn-sm" data-action="delete-plan" data-plan-id="${p.id}">Delete</button>
//           </div>` : ''}
//         </div>
//         <div class="card-body">
//           <div class="grid grid-2">
//             <div>
//               <p><strong>Duration:</strong> ${p.duration_months} months</p>
//               <p><strong>Price:</strong> $${Number(p.price).toFixed(2)}</p>
//               <p><strong>Discount:</strong> ${Number(p.discount_percentage)}%</p>
//               <p><strong>Wallet Credits:</strong> $${Number(p.wallet_credits).toFixed(2)}</p>
//             </div>
//             <div>
//               <p><strong>Priority:</strong> ${p.priority_level}</p>
//               <p><strong>Status:</strong> ${p.is_active ? 'Active' : 'Inactive'}</p>
//             </div>
//           </div>
//           ${canManage ? `
//           <div class="mt-2">
//             <button class="btn btn-primary btn-sm" data-action="assign-membership" data-plan-id="${p.id}">Add for Customer</button>
//           </div>` : ''}
//         </div>
//       </div>
//     `).join('');

//     const createFormCard = `
//       <div class="card">
//         <div class="card-header">Add Membership Plan</div>
//         <div class="card-body">
//           <form id="createPlanForm" class="grid grid-3">
//             <div><label>Name</label><input name="name" required /></div>
//             <div><label>Tier</label><select name="tier"><option>silver</option><option>gold</option><option>platinum</option><option>diamond</option></select></div>
//             <div>
//               <label>Duration (months)</label>
//               <select name="duration_months" required>
//                 <option value="3">3 months</option>
//                 <option value="6">6 months</option>
//                 <option value="12">12 months</option>
//               </select>
//             </div>
//             <div><label>Price</label><input name="price" type="number" step="0.01" required /></div>
//             <div><label>Discount %</label><input name="discount_percentage" type="number" step="0.01" /></div>
//             <div><label>Priority</label><select name="priority_level"><option>standard</option><option>priority</option><option>vip</option></select></div>
//             <div class="grid-col-span-3"><label>Description</label><textarea name="description"></textarea></div>
//             <div class="grid-col-span-3"><button class="btn btn-primary" type="submit">Create Plan</button></div>
//           </form>
//         </div>
//       </div>`;

//     const addButton = canManage ? `
//       <div class="card">
//         <div class="card-body" style="display:flex;justify-content:flex-start;gap:8px;align-items:center;">
//           <button id="addPlanBtn" class="btn btn-primary">+ Add Membership Plan</button>
//         </div>
//       </div>
//     ` : '';

//       container.innerHTML = `
//         ${addButton}
//         <div class="card"><div class="card-header">Available Plans</div></div>
//         <div class="grid grid-2">
//           ${plans.length ? plansList : '<div class="card"><div class="card-body"><p>No plans configured.</p></div></div>'}
//         </div>
//         ${membershipCard}
//           ${(['owner','center'].includes(currentUser?.role) && myMembership) ? `
//           <div id="editMembershipModal" class="modal" aria-hidden="true">
//             <div class="modal-content">
//               <div class="modal-header">
//                 <h3>Edit Membership</h3>
//                 <button class="modal-close" data-action="close-edit-modal">×</button>
//               </div>
//               <div class="modal-body">
//                 <form id="editMembershipForm">
//                   <div class="form-group">
//                     <label>Status</label>
//                     <select id="editStatus">
//                       <option value="active">Active</option>
//                       <option value="pending">Pending</option>
//                       <option value="suspended">Suspended</option>
//                       <option value="expired">Expired</option>
//                       <option value="cancelled">Cancelled</option>
//                     </select>
//                   </div>
//                   <div class="form-group">
//                     <label>End Date</label>
//                     <input type="date" id="editEndDate" />
//                   </div>
//                   <div class="mt-2 d-flex gap-2">
//                     <button type="submit" class="btn btn-primary btn-sm">Save</button>
//                     <button type="button" class="btn btn-outline btn-sm" data-action="close-edit-modal">Cancel</button>
//                   </div>
//                   <input type="hidden" id="editMembershipId" />
//                 </form>
//               </div>
//             </div>
//           </div>
//           ` : ''}
//         ${canManage ? `
//         <div id="assignMembershipModal" class="modal" aria-hidden="true">
//           <div class="modal-content">
//             <div class="modal-header">
//               <h3>Assign Membership</h3>
//               <button class="modal-close" data-action="close-modal">×</button>
//             </div>
//             <div class="modal-body">
//               <form id="assignMembershipForm">
//                 <div class="form-group">
//                   <label>Search Customer (name or phone)</label>
//                   <div class="customer-search">
//                     <input type="text" id="customerSearchInput" placeholder="Start typing..." autocomplete="off" />
//                     <div id="customerSearchResults" class="search-results" style="display:none"></div>
//                   </div>
//                 </div>
//                 <div id="selectedCustomer" class="card mt-2" style="display:none">
//                   <div class="card-body">
//                     <p><strong>Customer:</strong> <span id="selectedCustomerName"></span></p>
//                     <p><strong>Phone:</strong> <span id="selectedCustomerPhone"></span></p>
//                   </div>
//                 </div>
//                 <div class="form-group mt-2">
//                   <label>Start Date</label>
//                   <input type="date" id="membershipStartDate" required />
//                 </div>
//                 <div class="form-group mt-2">
//                   <label>Payment Method *</label>
//                   <select id="membershipPaymentMethod" required>
//                     <option value="">Select Payment Method</option>
//                     <option value="cash">Cash</option>
//                     <option value="upi">UPI</option>
//                     <option value="card">Card</option>
//                   </select>
//                 </div>
//                 <div class="mt-2 d-flex gap-2">
//                   <button type="submit" class="btn btn-primary btn-sm">Assign</button>
//                   <button type="button" class="btn btn-outline btn-sm" data-action="close-modal">Cancel</button>
//                 </div>
//                 <input type="hidden" id="assignPlanId" />
//                 <input type="hidden" id="assignCustomerId" />
//               </form>
//             </div>
//           </div>
//         </div>
//         ` : ''}
//         ${canManage ? `
//         <div id="editPlanModal" class="modal" aria-hidden="true">
//           <div class="modal-content">
//             <div class="modal-header">
//               <h3>Edit Membership Plan</h3>
//               <button class="modal-close" data-action="close-plan-modal">×</button>
//             </div>
//             <div class="modal-body">
//               <form id="editPlanForm" class="grid grid-3">
//                 <div><label>Name</label><input id="editPlanName" required /></div>
//                 <div><label>Tier</label>
//                   <select id="editPlanTier">
//                     <option>silver</option>
//                     <option>gold</option>
//                     <option>platinum</option>
//                     <option>diamond</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label>Duration (months)</label>
//                   <select id="editPlanDuration" required>
//                     <option value="3">3 months</option>
//                     <option value="6">6 months</option>
//                     <option value="12">12 months</option>
//                   </select>
//                 </div>
//                 <div><label>Price</label><input id="editPlanPrice" type="number" step="0.01" required /></div>
//                 <div><label>Discount %</label><input id="editPlanDiscount" type="number" step="0.01" /></div>
//                 <div><label>Wallet Credits</label><input id="editPlanWallet" type="number" step="0.01" /></div>
//                 <div><label>Priority</label>
//                   <select id="editPlanPriority">
//                     <option>standard</option>
//                     <option>priority</option>
//                     <option>vip</option>
//                   </select>
//                 </div>
//                 <div class="grid-col-span-3"><label>Description</label><textarea id="editPlanDescription"></textarea></div>
//                 <div><label>Active</label>
//                   <select id="editPlanActive">
//                     <option value="true">Active</option>
//                     <option value="false">Inactive</option>
//                   </select>
//                 </div>
//                 <div class="grid-col-span-3 mt-2 d-flex gap-2">
//                   <button type="submit" class="btn btn-primary btn-sm">Save</button>
//                   <button type="button" class="btn btn-outline btn-sm" data-action="close-plan-modal">Cancel</button>
//                 </div>
//                 <input type="hidden" id="editPlanId" />
//               </form>
//             </div>
//           </div>
//         </div>
//         ` : ''}
//       `;

//     if (canManage) {
//       const addBtn = container.querySelector('#addPlanBtn');
//       if (addBtn) {
//         addBtn.addEventListener('click', () => {
//           // Redirect to dedicated add-membership module
//           window.location.hash = 'memberships-add';
//         });
//       }

//       // Event delegation for "Add for Customer" buttons
//       container.addEventListener('click', async (e) => {
//         const target = e.target;
//         if (target && target.dataset && target.dataset.action === 'assign-membership') {
//           const planId = target.dataset.planId;
//           const modal = container.querySelector('#assignMembershipModal');
//           if (modal) {
//             modal.classList.add('active');
//             modal.setAttribute('aria-hidden', 'false');
//             container.querySelector('#assignPlanId').value = planId;
//             // Default start date to today
//             const today = new Date().toISOString().slice(0,10);
//             const startInput = container.querySelector('#membershipStartDate');
//             if (startInput) startInput.value = today;
//           }
//         }
//         if (target && target.dataset && target.dataset.action === 'close-modal') {
//           const modal = container.querySelector('#assignMembershipModal');
//           if (modal) {
//             modal.classList.remove('active');
//             modal.setAttribute('aria-hidden', 'true');
//             // Reset fields
//             container.querySelector('#customerSearchInput').value = '';
//             container.querySelector('#customerSearchResults').style.display = 'none';
//             const sel = container.querySelector('#selectedCustomer');
//             sel.style.display = 'none';
//             const hid = container.querySelector('#assignCustomerId');
//             if (hid) hid.value = '';
//           }
//         }
//       });

//       // Customer search with simple debounce
//       const searchInput = container.querySelector('#customerSearchInput');
//       const resultsEl = container.querySelector('#customerSearchResults');
//       const selectedEl = container.querySelector('#selectedCustomer');
//       const selectedNameEl = container.querySelector('#selectedCustomerName');
//       const selectedPhoneEl = container.querySelector('#selectedCustomerPhone');
//       let debounceTimer;
//       if (searchInput) {
//         searchInput.addEventListener('input', () => {
//           const q = searchInput.value.trim();
//           clearTimeout(debounceTimer);
//           if (q.length < 1) {
//             resultsEl.style.display = 'none';
//             resultsEl.innerHTML = '';
//             return;
//           }
//           debounceTimer = setTimeout(async () => {
//             try {
//               const results = await api.customers.search(q);
//               if (!Array.isArray(results) || results.length === 0) {
//                 resultsEl.innerHTML = '<div class="customer-result">No matches</div>';
//               } else {
//                 resultsEl.innerHTML = results.map(r => `
//                   <div class="customer-result" data-customer-id="${r.id}" data-name="${r.name || (r.first_name ? (r.first_name + ' ' + (r.last_name||'')) : 'Unknown')}" data-phone="${r.phone || r.mobile || ''}">
//                     <strong>${r.name || (r.first_name ? (r.first_name + ' ' + (r.last_name||'')) : 'Unknown')}</strong><br/>
//                     <small>${r.phone || r.mobile || ''}</small>
//                   </div>
//                 `).join('');
//               }
//               resultsEl.style.display = 'block';
//             } catch (err) {
//               console.error('Customer search failed', err);
//             }
//           }, 300);
//         });
//       }

//       // Select customer from results
//       if (resultsEl) {
//         resultsEl.addEventListener('click', (ev) => {
//           const item = ev.target.closest('.customer-result');
//           if (!item) return;
//           const customerId = item.dataset.customerId;
//           const name = item.dataset.name;
//           const phone = item.dataset.phone;
//           container.querySelector('#assignCustomerId').value = customerId;
//           selectedNameEl.textContent = name;
//           selectedPhoneEl.textContent = phone;
//           selectedEl.style.display = 'block';
//           resultsEl.style.display = 'none';
//         });
//       }

//       // Submit assignment
//       const form = container.querySelector('#assignMembershipForm');
//       if (form) {
//         form.addEventListener('submit', async (ev) => {
//           ev.preventDefault();
//           const customerId = container.querySelector('#assignCustomerId').value;
//           const planId = container.querySelector('#assignPlanId').value;
//           const startDate = container.querySelector('#membershipStartDate').value;
//           const paymentMethod = container.querySelector('#membershipPaymentMethod').value;
//           if (!customerId || !planId || !startDate) {
//             alert('Please select a customer and start date.');
//             return;
//           }
//           if (!paymentMethod) {
//             alert('Please select payment method.');
//             return;
//           }
//           try {
//             await api.memberships.assign({ customer_id: Number(customerId), plan_id: Number(planId), start_date: startDate, payment_method: paymentMethod });
//             alert('Membership assigned successfully.');
//             const modal = container.querySelector('#assignMembershipModal');
//             if (modal) modal.classList.remove('active');
//             // Optionally refresh current membership if assigning to self, else just close
//           } catch (err) {
//             console.error('Assign membership failed', err);
//             alert('Failed to assign membership: ' + (err.message || 'Unknown error'));
//           }
//         });
//       }

//       // Edit/Delete handlers for membership card
//       container.addEventListener('click', async (e) => {
//         const t = e.target;
//         // Plan edit/delete actions
//         if (t && t.dataset && t.dataset.action === 'edit-plan') {
//           const planId = Number(t.dataset.planId);
//           const plan = plans.find(x => Number(x.id) === planId);
//           if (plan) {
//             const modal = container.querySelector('#editPlanModal');
//             if (modal) {
//               modal.classList.add('active');
//               modal.setAttribute('aria-hidden', 'false');
//               container.querySelector('#editPlanId').value = String(planId);
//               container.querySelector('#editPlanName').value = plan.name || '';
//               const tierSel = container.querySelector('#editPlanTier');
//               if (tierSel) tierSel.value = plan.tier || 'silver';
//               container.querySelector('#editPlanDuration').value = Number(plan.duration_months) || 1;
//               container.querySelector('#editPlanPrice').value = Number(plan.price) || 0;
//               container.querySelector('#editPlanDiscount').value = (plan.discount_percentage ?? 15);
//               container.querySelector('#editPlanWallet').value = Number(plan.wallet_credits ?? plan.price) || 0;
//               // Auto-fill wallet credits from price on change
//               const priceInput = container.querySelector('#editPlanPrice');
//               const walletInput = container.querySelector('#editPlanWallet');
//               if (priceInput && walletInput) {
//                 priceInput.addEventListener('input', () => {
//                   walletInput.value = priceInput.value || '0';
//                 });
//               }
//               const prioSel = container.querySelector('#editPlanPriority');
//               if (prioSel) prioSel.value = plan.priority_level || 'standard';
//               container.querySelector('#editPlanDescription').value = plan.description || '';
//               const actSel = container.querySelector('#editPlanActive');
//               if (actSel) actSel.value = plan.is_active ? 'true' : 'false';
//             }
//           }
//         }
//         if (t && t.dataset && t.dataset.action === 'close-plan-modal') {
//           const modal = container.querySelector('#editPlanModal');
//           if (modal) {
//             modal.classList.remove('active');
//             modal.setAttribute('aria-hidden', 'true');
//           }
//         }
//         if (t && t.dataset && t.dataset.action === 'delete-plan') {
//           const id = Number(t.dataset.planId);
//           if (confirm('Delete this plan?')) {
//             try {
//               await api.memberships.deletePlan(id);
//               alert('Plan deleted');
//               render(container);
//             } catch (err) {
//               console.error('Delete plan failed', err);
//               alert('Failed to delete plan: ' + (err.message || 'Unknown error'));
//             }
//           }
//         }
//         if (t && t.dataset && t.dataset.action === 'edit-membership') {
//           const id = t.dataset.membershipId;
//           const modal = container.querySelector('#editMembershipModal');
//           if (modal) {
//             modal.classList.add('active');
//             modal.setAttribute('aria-hidden', 'false');
//             container.querySelector('#editMembershipId').value = id;
//             // Prefill existing values
//             const statusSel = container.querySelector('#editStatus');
//             const endInput = container.querySelector('#editEndDate');
//             if (statusSel) statusSel.value = myMembership.status;
//             if (endInput) endInput.value = myMembership.end_date;
//           }
//         }
//         if (t && t.dataset && t.dataset.action === 'close-edit-modal') {
//           const modal = container.querySelector('#editMembershipModal');
//           if (modal) {
//             modal.classList.remove('active');
//             modal.setAttribute('aria-hidden', 'true');
//           }
//         }
//         if (t && t.dataset && t.dataset.action === 'delete-membership') {
//           const id = Number(t.dataset.membershipId);
//           if (confirm('Are you sure you want to delete this membership?')) {
//             try {
//               await api.memberships.delete(id);
//               alert('Membership deleted');
//               // Refresh page view
//               render(container);
//             } catch (err) {
//               console.error('Delete membership failed', err);
//               alert('Failed to delete membership: ' + (err.message || 'Unknown error'));
//             }
//           }
//         }
//       });

//       const editForm = container.querySelector('#editMembershipForm');
//       if (editForm) {
//         editForm.addEventListener('submit', async (ev) => {
//           ev.preventDefault();
//           const id = Number(container.querySelector('#editMembershipId').value);
//           const status = container.querySelector('#editStatus').value;
//           const endDate = container.querySelector('#editEndDate').value;
//           try {
//             const payload = { status };
//             if (endDate) payload.end_date = endDate;
//             await api.memberships.update(id, payload);
//             alert('Membership updated');
//             const modal = container.querySelector('#editMembershipModal');
//             if (modal) modal.classList.remove('active');
//             render(container);
//           } catch (err) {
//             console.error('Update membership failed', err);
//             alert('Failed to update membership: ' + (err.message || 'Unknown error'));
//           }
//         });
//       }
//       const editPlanForm = container.querySelector('#editPlanForm');
//       if (editPlanForm) {
//         editPlanForm.addEventListener('submit', async (ev) => {
//           ev.preventDefault();
//           const id = Number(container.querySelector('#editPlanId').value);
//           const payload = {
//             name: container.querySelector('#editPlanName').value,
//             tier: container.querySelector('#editPlanTier').value,
//             duration_months: Number(container.querySelector('#editPlanDuration').value),
//             price: Number(container.querySelector('#editPlanPrice').value),
//             discount_percentage: Number(container.querySelector('#editPlanDiscount').value || 0),
//             wallet_credits: Number(container.querySelector('#editPlanWallet').value || 0),
//             priority_level: container.querySelector('#editPlanPriority').value,
//             description: container.querySelector('#editPlanDescription').value || '',
//             is_active: container.querySelector('#editPlanActive').value === 'true'
//           };
//           try {
//             await api.memberships.updatePlan(id, payload);
//             alert('Plan updated');
//             const modal = container.querySelector('#editPlanModal');
//             if (modal) modal.classList.remove('active');
//             render(container);
//           } catch (err) {
//             console.error('Update plan failed', err);
//             alert('Failed to update plan: ' + (err.message || 'Unknown error'));
//           }
//         });
//       }
//     }
//   } catch (error) {
//     console.error('Memberships render error:', error);
//     container.innerHTML = `<div class="card"><div class="card-body">Failed to load memberships.</div></div>`;
//   }
// }
// memberships.js - Complete Membership Management with Professional Billing

let membershipInvoices = [];
let customers = [];
let salonSettings = {};
let currentUser = null;
let plans = [];
let myMembership = null;

export async function render(container) {
  // Show loading state
  container.innerHTML = `
    <div class="card">
      <div class="text-center p-5">
        <div class="spinner"></div>
        <p class="mt-3">Loading membership data...</p>
      </div>
    </div>
  `;

  try {
    // Check which view to show based on URL hash
    const hash = window.location.hash.substring(1);
    
    if (hash === 'membership-billing') {
      await renderBillingView(container);
    } else {
      await renderManagementView(container);
    }
  } catch (error) {
    console.error('Memberships render error:', error);
    container.innerHTML = `<div class="card"><div class="card-body">Failed to load memberships.</div></div>`;
  }
}

// Render the membership management view (plans and assignments)
async function renderManagementView(container) {
  const [plansData, myMembershipData, profile, settings] = await Promise.all([
    api.memberships.getPlans().catch(err => { console.error('Plans load error', err); return []; }),
    api.memberships.getMy().catch(err => { console.warn('No active membership', err); return null; }),
    api.auth.getProfile().catch(() => null),
    api.settings.get().catch(() => ({}))
  ]);

  plans = plansData;
  myMembership = myMembershipData;
  currentUser = profile || auth.getCurrentUser();
  salonSettings = settings;

  const membershipCard = myMembership ? `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>My Membership</span>
        ${['owner','center'].includes(currentUser?.role) ? `
        <div class="d-flex gap-2">
          <button class="btn btn-outline btn-sm" data-action="edit-membership" data-membership-id="${myMembership.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete-membership" data-membership-id="${myMembership.id}">Delete</button>
        </div>` : ''}
      </div>
      <div class="card-body">
        <div class="grid grid-2">
          <div>
            <p><strong>Plan:</strong> ${myMembership.plan_name} (${myMembership.tier})</p>
            <p><strong>Status:</strong> ${myMembership.status}</p>
            <p><strong>Period:</strong> ${utils.formatDate(myMembership.start_date)} → ${utils.formatDate(myMembership.end_date)}</p>
          </div>
          <div>
            <p><strong>Discount:</strong> ${Number(myMembership.discount_percentage)}%</p>
            <p><strong>Wallet:</strong> ${utils.formatCurrency(myMembership.wallet_balance, salonSettings.billing?.currency || 'INR')}</p>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  const canManage = ['owner','center'].includes(currentUser?.role);
  const plansList = plans.map(p => `
    <div class="plan card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>${p.name} <span class="badge">${p.tier}</span></span>
        ${canManage ? `<div class="d-flex gap-2">
          <button class="btn btn-outline btn-sm" data-action="edit-plan" data-plan-id="${p.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete-plan" data-plan-id="${p.id}">Delete</button>
        </div>` : ''}
      </div>
      <div class="card-body">
        <div class="grid grid-2">
          <div>
            <p><strong>Duration:</strong> ${p.duration_months} months</p>
            <p><strong>Price:</strong> ${utils.formatCurrency(p.price, salonSettings.billing?.currency || 'INR')}</p>
            <p><strong>Discount:</strong> ${Number(p.discount_percentage)}%</p>
            <p><strong>Wallet Credits:</strong> ${utils.formatCurrency(p.wallet_credits, salonSettings.billing?.currency || 'INR')}</p>
          </div>
          <div>
            <p><strong>Priority:</strong> ${p.priority_level}</p>
            <p><strong>Status:</strong> ${p.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
        ${canManage ? `
        <div class="mt-2">
          <button class="btn btn-primary btn-sm" data-action="assign-membership" data-plan-id="${p.id}">Add for Customer</button>
        </div>` : ''}
      </div>
    </div>
  `).join('');

  const addButton = canManage ? `
    <div class="card">
      <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;">
        <button id="addPlanBtn" class="btn btn-primary">+ Add Membership Plan</button>
        <div class="d-flex gap-2">
          <button id="customerInvoicesBtn" class="btn btn-outline btn-sm">Customer Invoices</button>
          <button id="membershipInvoicesBtn" class="btn btn-primary btn-sm">Membership Invoices</button>
        </div>
      </div>
    </div>
  ` : '';

  container.innerHTML = `
    ${addButton}
    <div class="card"><div class="card-header">Available Plans</div></div>
    <div class="grid grid-2">
      ${plans.length ? plansList : '<div class="card"><div class="card-body"><p>No plans configured.</p></div></div>'}
    </div>
    ${membershipCard}
    ${(['owner','center'].includes(currentUser?.role) && myMembership) ? `
    <div id="editMembershipModal" class="modal" aria-hidden="true">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Membership</h3>
          <button class="modal-close" data-action="close-edit-modal">×</button>
        </div>
        <div class="modal-body">
          <form id="editMembershipForm">
            <div class="form-group">
              <label>Status</label>
              <select id="editStatus">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" id="editEndDate" />
            </div>
            <div class="mt-2 d-flex gap-2">
              <button type="submit" class="btn btn-primary btn-sm">Save</button>
              <button type="button" class="btn btn-outline btn-sm" data-action="close-edit-modal">Cancel</button>
            </div>
            <input type="hidden" id="editMembershipId" />
          </form>
        </div>
      </div>
    </div>
    ` : ''}
    ${canManage ? `
    <div id="assignMembershipModal" class="modal" aria-hidden="true">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Assign Membership</h3>
          <button class="modal-close" data-action="close-modal">×</button>
        </div>
        <div class="modal-body">
          <form id="assignMembershipForm">
            <div class="form-group">
              <label>Search Customer (name or phone)</label>
              <div class="customer-search">
                <input type="text" id="customerSearchInput" placeholder="Start typing..." autocomplete="off" />
                <div id="customerSearchResults" class="search-results" style="display:none"></div>
              </div>
            </div>
            <div id="selectedCustomer" class="card mt-2" style="display:none">
              <div class="card-body">
                <p><strong>Customer:</strong> <span id="selectedCustomerName"></span></p>
                <p><strong>Phone:</strong> <span id="selectedCustomerPhone"></span></p>
              </div>
            </div>
            <div class="form-group mt-2">
              <label>Start Date</label>
              <input type="date" id="membershipStartDate" required />
            </div>
            <div class="form-group mt-2">
              <label>Payment Method *</label>
              <select id="membershipPaymentMethod" required>
                <option value="">Select Payment Method</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div class="mt-2 d-flex gap-2">
              <button type="submit" class="btn btn-primary btn-sm">Assign</button>
              <button type="button" class="btn btn-outline btn-sm" data-action="close-modal">Cancel</button>
            </div>
            <input type="hidden" id="assignPlanId" />
            <input type="hidden" id="assignCustomerId" />
          </form>
        </div>
      </div>
    </div>
    ` : ''}
    ${canManage ? `
    <div id="editPlanModal" class="modal" aria-hidden="true">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Membership Plan</h3>
          <button class="modal-close" data-action="close-plan-modal">×</button>
        </div>
        <div class="modal-body">
          <form id="editPlanForm" class="grid grid-3">
            <div><label>Name</label><input id="editPlanName" required /></div>
            <div><label>Tier</label>
              <select id="editPlanTier">
                <option>silver</option>
                <option>gold</option>
                <option>platinum</option>
                <option>diamond</option>
              </select>
            </div>
            <div>
              <label>Duration (months)</label>
              <select id="editPlanDuration" required>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
            </div>
            <div><label>Price</label><input id="editPlanPrice" type="number" step="0.01" required /></div>
            <div><label>Discount %</label><input id="editPlanDiscount" type="number" step="0.01" /></div>
            <div><label>Wallet Credits</label><input id="editPlanWallet" type="number" step="0.01" /></div>
            <div><label>Priority</label>
              <select id="editPlanPriority">
                <option>standard</option>
                <option>priority</option>
                <option>vip</option>
              </select>
            </div>
            <div class="grid-col-span-3"><label>Description</label><textarea id="editPlanDescription"></textarea></div>
            <div><label>Active</label>
              <select id="editPlanActive">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div class="grid-col-span-3 mt-2 d-flex gap-2">
              <button type="submit" class="btn btn-primary btn-sm">Save</button>
              <button type="button" class="btn btn-outline btn-sm" data-action="close-plan-modal">Cancel</button>
            </div>
            <input type="hidden" id="editPlanId" />
          </form>
        </div>
      </div>
    </div>
    ` : ''}
  `;

  // Add event listeners for view switching
  const customerBtn = container.querySelector('#customerInvoicesBtn');
  const membershipBtn = container.querySelector('#membershipInvoicesBtn');
  
  if (customerBtn) {
    customerBtn.addEventListener('click', () => {
      window.location.hash = 'billing';
    });
  }
  
  if (membershipBtn) {
    membershipBtn.addEventListener('click', () => {
      window.location.hash = 'membership-billing';
    });
  }

  if (canManage) {
    setupManagementEventListeners(container);
  }
}

// Render the membership billing view with proper calculations
async function renderBillingView(container) {
  try {
    const [payments, customersData, settings] = await Promise.all([
      api.memberships.getPayments ? api.memberships.getPayments() : Promise.resolve([]),
      api.customers.getAll().catch(() => []),
      api.settings.get().catch(() => ({}))
    ]);

    membershipInvoices = payments;
    customers = customersData;
    salonSettings = settings;

    container.innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <div class="d-flex justify-content-between align-items-center w-100">
            <h2>Membership Invoices</h2>
            <div class="d-flex gap-2">
              <button id="backToManagementBtn" class="btn btn-outline btn-sm">← Back to Management</button>
              <button id="customerInvoicesFromBillingBtn" class="btn btn-outline btn-sm">Customer Invoices</button>
              <button id="addMembershipInvoiceBtn" class="btn btn-primary btn-sm">
                Create Membership Invoice
              </button>
            </div>
          </div>
        </div>
        ${renderInvoiceTable()}
      </div>
    `;

    // Add event listeners
    document.getElementById('backToManagementBtn').addEventListener('click', () => {
      window.location.hash = 'memberships';
    });

    document.getElementById('customerInvoicesFromBillingBtn').addEventListener('click', () => {
      window.location.hash = 'billing';
    });

    document.getElementById('addMembershipInvoiceBtn').addEventListener('click', showMembershipForm);

  } catch (error) {
    console.error('Failed to load membership invoices:', error);
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <p>Failed to load membership invoices</p>
          <button id="backToManagementBtn" class="btn btn-primary btn-sm mt-2">Back to Management</button>
        </div>
      </div>
    `;
    document.getElementById('backToManagementBtn')?.addEventListener('click', () => {
      window.location.hash = 'memberships';
    });
  }
}

// Render membership invoices table with proper tax/discount calculations
function renderInvoiceTable() {
  const currency = salonSettings.billing?.currency || "INR";
  const taxRate = parseFloat(salonSettings.billing?.taxRate ?? 0);

  if (!membershipInvoices.length) {
    return '<p class="text-center p-4">No membership invoices found</p>';
  }

  return `
    <table class="table">
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Customer</th>
          <th>Subtotal</th>
          <th>Tax (${taxRate}%)</th>
          <th>Discount</th>
          <th>Total</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${membershipInvoices.map(inv => {
          const subtotal = parseFloat(inv.amount || 0);
          const tax = parseFloat((subtotal * (taxRate / 100)).toFixed(2));
          const discount = parseFloat(inv.discount || 0);
          const total = subtotal + tax - discount;

          return `
            <tr>
              <td>${inv.invoice_number || `MEM-${String(inv.id).padStart(6, '0')}`}</td>
              <td>${inv.customer_name || 'Unknown'}</td>
              <td>${utils.formatCurrency(subtotal, currency)}</td>
              <td>${utils.formatCurrency(tax, currency)}</td>
              <td>${utils.formatCurrency(discount, currency)}</td>
              <td>${utils.formatCurrency(total, currency)}</td>
              <td>
                <button onclick="window.membershipBilling.print(${inv.id})" 
                        class="btn btn-sm btn-success">
                  Print
                </button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Show membership invoice creation form
async function showMembershipForm() {
  try {
    const plans = await api.memberships.getPlans();

    const formHTML = `
      <form id="membershipInvoiceForm">
        <div class="form-group">
          <label>Customer</label>
          <select id="customerSelect" class="form-control" required>
            <option value="">Select Customer</option>
            ${customers.map(c =>
              `<option value="${c.id}">${c.name} (${c.phone || c.mobile || 'No phone'})</option>`
            ).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Membership Plan</label>
          <select id="planSelect" class="form-control" required>
            <option value="">Select Plan</option>
            ${plans.filter(p => p.is_active).map(p =>
              `<option value="${p.id}" data-price="${p.price}" data-discount="${p.discount_percentage || 0}">
                ${p.name} - ${utils.formatCurrency(p.price, salonSettings.billing?.currency || 'INR')}
                ${p.discount_percentage ? ` (${p.discount_percentage}% off)` : ''}
              </option>`
            ).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Payment Method</label>
          <select id="paymentMethod" class="form-control">
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>

        <div class="mt-3 d-flex gap-2">
          <button type="submit" class="btn btn-primary">
            Create & Activate Membership
          </button>
          <button type="button" class="btn btn-outline" onclick="window.appUtils.closeModal()">
            Cancel
          </button>
        </div>
      </form>
    `;

    window.appUtils.showModal('Create Membership Invoice', formHTML);

    document.getElementById('membershipInvoiceForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const planSelect = document.getElementById('planSelect');
      const planId = planSelect.value;
      const amount = parseFloat(planSelect.selectedOptions[0]?.dataset.price);
      const discount = parseFloat(planSelect.selectedOptions[0]?.dataset.discount);
      const customerId = document.getElementById('customerSelect').value;
      const paymentMethod = document.getElementById('paymentMethod').value;

      if (!customerId || !planId || !amount || !paymentMethod) {
        utils.showToast('Please fill all fields', 'error');
        return;
      }

      try {
        // Professional flow: Create payment, assign membership, activate in one API call
        await api.memberships.createMembershipWithPayment({
          customer_id: parseInt(customerId),
          plan_id: parseInt(planId),
          amount: amount,
          discount: discount,
          payment_method: paymentMethod,
          start_date: new Date().toISOString().split('T')[0]
        });

        utils.showToast('Membership created and activated successfully', 'success');
        window.appUtils.closeModal();
        window.location.hash = 'membership-billing';
      } catch (error) {
        console.error('Failed to create membership:', error);
        utils.showToast('Failed to create membership: ' + (error.message || 'Unknown error'), 'error');
      }
    });
  } catch (error) {
    console.error('Failed to load form data:', error);
    utils.showToast('Failed to load form data', 'error');
  }
}

// Print membership invoice with professional formatting
async function printInvoice(id) {
  try {
    const invoice = await api.memberships.getPaymentById(id);
    const currency = salonSettings.billing?.currency || 'INR';
    const taxRate = parseFloat(salonSettings.billing?.taxRate ?? 0);
    
    const subtotal = parseFloat(invoice.amount || 0);
    const tax = parseFloat((subtotal * (taxRate / 100)).toFixed(2));
    const discount = parseFloat(invoice.discount || 0);
    const total = subtotal + tax - discount;

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Membership Invoice ${invoice.invoice_number || `MEM-${String(invoice.id).padStart(6, '0')}`}</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 40px; color: #333; }
          .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .salon-name { font-size: 24px; font-weight: bold; color: #2c3e50; }
          .salon-details { color: #666; margin-top: 5px; }
          .invoice-title { font-size: 20px; margin-top: 20px; color: #34495e; }
          .invoice-details { margin: 30px 0; display: flex; justify-content: space-between; }
          .customer-details, .invoice-meta { flex: 1; }
          .invoice-meta { text-align: right; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .total-section { margin-top: 30px; text-align: right; font-size: 18px; }
          .grand-total { font-size: 22px; font-weight: bold; color: #2c3e50; margin-top: 10px; }
          .footer { margin-top: 50px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; }
          .badge { background: #27ae60; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="salon-name">${salonSettings.salon?.name || 'Salon'}</div>
          <div class="salon-details">
            ${salonSettings.salon?.address || ''}<br>
            Phone: ${salonSettings.salon?.phone || ''}
          </div>
          <div class="invoice-title">Membership Invoice</div>
        </div>
        
        <div class="invoice-details">
          <div class="customer-details">
            <strong>Bill To:</strong><br>
            ${invoice.customer_name}<br>
            ${invoice.customer_phone || ''}<br>
            ${invoice.customer_email || ''}
          </div>
          <div class="invoice-meta">
            <strong>Invoice:</strong> ${invoice.invoice_number || `MEM-${String(invoice.id).padStart(6, '0')}`}<br>
            <strong>Date:</strong> ${utils.formatDate(invoice.payment_date)}<br>
            <strong>Payment Method:</strong> ${invoice.payment_method}<br>
            <span class="badge">Paid</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Plan</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Membership Purchase</td>
              <td>${invoice.plan_name || 'Membership Plan'}</td>
              <td>${utils.formatCurrency(subtotal, currency)}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-section">
          <div>Subtotal: ${utils.formatCurrency(subtotal, currency)}</div>
          ${tax > 0 ? `<div>Tax (${taxRate}%): ${utils.formatCurrency(tax, currency)}</div>` : ''}
          ${discount > 0 ? `<div>Discount: -${utils.formatCurrency(discount, currency)}</div>` : ''}
          <div class="grand-total">Total: ${utils.formatCurrency(total, currency)}</div>
        </div>

        <div class="footer">
          <p>Thank you for choosing ${salonSettings.salon?.name || 'us'}!</p>
          <p>This membership is valid from ${utils.formatDate(invoice.start_date)} to ${utils.formatDate(invoice.end_date)}</p>
        </div>
      </body>
      </html>
    `;

    utils.printHTML(printHTML, `Membership-${invoice.invoice_number || invoice.id}`);
  } catch (error) {
    console.error('Failed to print invoice:', error);
    utils.showToast('Failed to print invoice', 'error');
  }
}

// Setup management view event listeners (unchanged from your original)
function setupManagementEventListeners(container) {
  const addBtn = container.querySelector('#addPlanBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      window.location.hash = 'memberships-add';
    });
  }

  // Event delegation for "Add for Customer" buttons
  container.addEventListener('click', async (e) => {
    const target = e.target;
    if (target && target.dataset && target.dataset.action === 'assign-membership') {
      const planId = target.dataset.planId;
      const modal = container.querySelector('#assignMembershipModal');
      if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        container.querySelector('#assignPlanId').value = planId;
        const today = new Date().toISOString().slice(0,10);
        const startInput = container.querySelector('#membershipStartDate');
        if (startInput) startInput.value = today;
      }
    }
    if (target && target.dataset && target.dataset.action === 'close-modal') {
      const modal = container.querySelector('#assignMembershipModal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        container.querySelector('#customerSearchInput').value = '';
        container.querySelector('#customerSearchResults').style.display = 'none';
        const sel = container.querySelector('#selectedCustomer');
        sel.style.display = 'none';
        const hid = container.querySelector('#assignCustomerId');
        if (hid) hid.value = '';
      }
    }
  });

  // Customer search with simple debounce
  const searchInput = container.querySelector('#customerSearchInput');
  const resultsEl = container.querySelector('#customerSearchResults');
  const selectedEl = container.querySelector('#selectedCustomer');
  const selectedNameEl = container.querySelector('#selectedCustomerName');
  const selectedPhoneEl = container.querySelector('#selectedCustomerPhone');
  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      clearTimeout(debounceTimer);
      if (q.length < 1) {
        resultsEl.style.display = 'none';
        resultsEl.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(async () => {
        try {
          const results = await api.customers.search(q);
          if (!Array.isArray(results) || results.length === 0) {
            resultsEl.innerHTML = '<div class="customer-result">No matches</div>';
          } else {
            resultsEl.innerHTML = results.map(r => `
              <div class="customer-result" data-customer-id="${r.id}" data-name="${r.name || (r.first_name ? (r.first_name + ' ' + (r.last_name||'')) : 'Unknown')}" data-phone="${r.phone || r.mobile || ''}">
                <strong>${r.name || (r.first_name ? (r.first_name + ' ' + (r.last_name||'')) : 'Unknown')}</strong><br/>
                <small>${r.phone || r.mobile || ''}</small>
              </div>
            `).join('');
          }
          resultsEl.style.display = 'block';
        } catch (err) {
          console.error('Customer search failed', err);
        }
      }, 300);
    });
  }

  // Select customer from results
  if (resultsEl) {
    resultsEl.addEventListener('click', (ev) => {
      const item = ev.target.closest('.customer-result');
      if (!item) return;
      const customerId = item.dataset.customerId;
      const name = item.dataset.name;
      const phone = item.dataset.phone;
      container.querySelector('#assignCustomerId').value = customerId;
      selectedNameEl.textContent = name;
      selectedPhoneEl.textContent = phone;
      selectedEl.style.display = 'block';
      resultsEl.style.display = 'none';
    });
  }

  // Submit assignment
  const form = container.querySelector('#assignMembershipForm');
  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const customerId = container.querySelector('#assignCustomerId').value;
      const planId = container.querySelector('#assignPlanId').value;
      const startDate = container.querySelector('#membershipStartDate').value;
      const paymentMethod = container.querySelector('#membershipPaymentMethod').value;
      if (!customerId || !planId || !startDate) {
        alert('Please select a customer and start date.');
        return;
      }
      if (!paymentMethod) {
        alert('Please select payment method.');
        return;
      }
      try {
        await api.memberships.assign({ 
          customer_id: Number(customerId), 
          plan_id: Number(planId), 
          start_date: startDate, 
          payment_method: paymentMethod 
        });
        alert('Membership assigned successfully.');
        const modal = container.querySelector('#assignMembershipModal');
        if (modal) modal.classList.remove('active');
        // Refresh the view
        render(container);
      } catch (err) {
        console.error('Assign membership failed', err);
        alert('Failed to assign membership: ' + (err.message || 'Unknown error'));
      }
    });
  }

  // Edit/Delete handlers for membership card and plans
  container.addEventListener('click', async (e) => {
    const t = e.target;
    
    // Plan edit
    if (t && t.dataset && t.dataset.action === 'edit-plan') {
      const planId = Number(t.dataset.planId);
      const plan = plans.find(x => Number(x.id) === planId);
      if (plan) {
        const modal = container.querySelector('#editPlanModal');
        if (modal) {
          modal.classList.add('active');
          modal.setAttribute('aria-hidden', 'false');
          container.querySelector('#editPlanId').value = String(planId);
          container.querySelector('#editPlanName').value = plan.name || '';
          const tierSel = container.querySelector('#editPlanTier');
          if (tierSel) tierSel.value = plan.tier || 'silver';
          container.querySelector('#editPlanDuration').value = Number(plan.duration_months) || 1;
          container.querySelector('#editPlanPrice').value = Number(plan.price) || 0;
          container.querySelector('#editPlanDiscount').value = (plan.discount_percentage ?? 15);
          container.querySelector('#editPlanWallet').value = Number(plan.wallet_credits ?? plan.price) || 0;
          
          // Auto-fill wallet credits from price on change
          const priceInput = container.querySelector('#editPlanPrice');
          const walletInput = container.querySelector('#editPlanWallet');
          if (priceInput && walletInput) {
            priceInput.addEventListener('input', () => {
              walletInput.value = priceInput.value || '0';
            });
          }
          
          const prioSel = container.querySelector('#editPlanPriority');
          if (prioSel) prioSel.value = plan.priority_level || 'standard';
          container.querySelector('#editPlanDescription').value = plan.description || '';
          const actSel = container.querySelector('#editPlanActive');
          if (actSel) actSel.value = plan.is_active ? 'true' : 'false';
        }
      }
    }
    
    // Close plan modal
    if (t && t.dataset && t.dataset.action === 'close-plan-modal') {
      const modal = container.querySelector('#editPlanModal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    }
    
    // Delete plan
    if (t && t.dataset && t.dataset.action === 'delete-plan') {
      const id = Number(t.dataset.planId);
      if (confirm('Delete this plan?')) {
        try {
          await api.memberships.deletePlan(id);
          alert('Plan deleted');
          render(container);
        } catch (err) {
          console.error('Delete plan failed', err);
          alert('Failed to delete plan: ' + (err.message || 'Unknown error'));
        }
      }
    }
    
    // Edit membership
    if (t && t.dataset && t.dataset.action === 'edit-membership') {
      const id = t.dataset.membershipId;
      const modal = container.querySelector('#editMembershipModal');
      if (modal && myMembership) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        container.querySelector('#editMembershipId').value = id;
        const statusSel = container.querySelector('#editStatus');
        const endInput = container.querySelector('#editEndDate');
        if (statusSel) statusSel.value = myMembership.status;
        if (endInput) endInput.value = myMembership.end_date;
      }
    }
    
    // Close edit modal
    if (t && t.dataset && t.dataset.action === 'close-edit-modal') {
      const modal = container.querySelector('#editMembershipModal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    }
    
    // Delete membership
    if (t && t.dataset && t.dataset.action === 'delete-membership') {
      const id = Number(t.dataset.membershipId);
      if (confirm('Are you sure you want to delete this membership?')) {
        try {
          await api.memberships.delete(id);
          alert('Membership deleted');
          render(container);
        } catch (err) {
          console.error('Delete membership failed', err);
          alert('Failed to delete membership: ' + (err.message || 'Unknown error'));
        }
      }
    }
  });

  // Edit membership form submit
  const editForm = container.querySelector('#editMembershipForm');
  if (editForm) {
    editForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const id = Number(container.querySelector('#editMembershipId').value);
      const status = container.querySelector('#editStatus').value;
      const endDate = container.querySelector('#editEndDate').value;
      try {
        const payload = { status };
        if (endDate) payload.end_date = endDate;
        await api.memberships.update(id, payload);
        alert('Membership updated');
        const modal = container.querySelector('#editMembershipModal');
        if (modal) modal.classList.remove('active');
        render(container);
      } catch (err) {
        console.error('Update membership failed', err);
        alert('Failed to update membership: ' + (err.message || 'Unknown error'));
      }
    });
  }

  // Edit plan form submit
  const editPlanForm = container.querySelector('#editPlanForm');
  if (editPlanForm) {
    editPlanForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const id = Number(container.querySelector('#editPlanId').value);
      const payload = {
        name: container.querySelector('#editPlanName').value,
        tier: container.querySelector('#editPlanTier').value,
        duration_months: Number(container.querySelector('#editPlanDuration').value),
        price: Number(container.querySelector('#editPlanPrice').value),
        discount_percentage: Number(container.querySelector('#editPlanDiscount').value || 0),
        wallet_credits: Number(container.querySelector('#editPlanWallet').value || 0),
        priority_level: container.querySelector('#editPlanPriority').value,
        description: container.querySelector('#editPlanDescription').value || '',
        is_active: container.querySelector('#editPlanActive').value === 'true'
      };
      try {
        await api.memberships.updatePlan(id, payload);
        alert('Plan updated');
        const modal = container.querySelector('#editPlanModal');
        if (modal) modal.classList.remove('active');
        render(container);
      } catch (err) {
        console.error('Update plan failed', err);
        alert('Failed to update plan: ' + (err.message || 'Unknown error'));
      }
    });
  }
}

// Initialize global print function
window.membershipBilling = {
  print: printInvoice
};