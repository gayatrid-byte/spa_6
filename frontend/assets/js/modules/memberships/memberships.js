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
    const [plans, myMembership, profile] = await Promise.all([
      api.memberships.getPlans().catch(err => { console.error('Plans load error', err); return []; }),
      api.memberships.getMy().catch(err => { console.warn('No active membership', err); return null; }),
      api.auth.getProfile().catch(() => null)
    ]);

    const currentUser = profile || auth.getCurrentUser();

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
                <p><strong>Period:</strong> ${myMembership.start_date} → ${myMembership.end_date}</p>
              </div>
              <div>
                <p><strong>Discount:</strong> ${Number(myMembership.discount_percentage)}%</p>
                <p><strong>Wallet:</strong> ${Number(myMembership.wallet_balance).toFixed(2)}</p>
                <p><strong>Free Services:</strong> ${myMembership.free_services_remaining}</p>
                <p><strong>Guest Passes:</strong> ${myMembership.guest_passes_remaining}</p>
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
              <p><strong>Duration:</strong> ${p.duration_days} days</p>
              <p><strong>Price:</strong> $${Number(p.price).toFixed(2)} ${p.is_recurring ? '(recurring)' : ''}</p>
              <p><strong>Discount:</strong> ${Number(p.discount_percentage)}%</p>
              <p><strong>Wallet Credits:</strong> $${Number(p.wallet_credits).toFixed(2)}</p>
            </div>
            <div>
              <p><strong>Free Services:</strong> ${p.free_services}</p>
              <p><strong>Guest Passes:</strong> ${p.guest_passes}</p>
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

    const createFormCard = `
      <div class="card">
        <div class="card-header">Add Membership Plan</div>
        <div class="card-body">
          <form id="createPlanForm" class="grid grid-3">
            <div><label>Name</label><input name="name" required /></div>
            <div><label>Tier</label><select name="tier"><option>silver</option><option>gold</option><option>platinum</option><option>diamond</option></select></div>
            <div><label>Duration (days)</label><input name="duration_days" type="number" min="1" required /></div>
            <div><label>Price</label><input name="price" type="number" step="0.01" required /></div>
            <div><label>Recurring</label><select name="is_recurring"><option value="false">No</option><option value="true">Yes</option></select></div>
            <div><label>Discount %</label><input name="discount_percentage" type="number" step="0.01" /></div>
            <div><label>Wallet Credits</label><input name="wallet_credits" type="number" step="0.01" /></div>
            <div><label>Free Services</label><input name="free_services" type="number" /></div>
            <div><label>Guest Passes</label><input name="guest_passes" type="number" /></div>
            <div><label>Priority</label><select name="priority_level"><option>standard</option><option>priority</option><option>vip</option></select></div>
            <div class="grid-col-span-3"><label>Description</label><textarea name="description"></textarea></div>
            <div class="grid-col-span-3"><button class="btn btn-primary" type="submit">Create Plan</button></div>
          </form>
        </div>
      </div>`;

    const addButton = canManage ? `
      <div class="card">
        <div class="card-body" style="display:flex;justify-content:flex-start;gap:8px;align-items:center;">
          <button id="addPlanBtn" class="btn btn-primary">+ Add Membership Plan</button>
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
                <div><label>Duration (days)</label><input id="editPlanDuration" type="number" min="1" required /></div>
                <div><label>Price</label><input id="editPlanPrice" type="number" step="0.01" required /></div>
                <div><label>Recurring</label>
                  <select id="editPlanRecurring">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div><label>Discount %</label><input id="editPlanDiscount" type="number" step="0.01" /></div>
                <div><label>Wallet Credits</label><input id="editPlanWallet" type="number" step="0.01" /></div>
                <div><label>Free Services</label><input id="editPlanFree" type="number" /></div>
                <div><label>Guest Passes</label><input id="editPlanGuest" type="number" /></div>
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

    if (canManage) {
      const addBtn = container.querySelector('#addPlanBtn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          // Redirect to dedicated add-membership module
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
            // Default start date to today
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
            // Reset fields
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
          if (!customerId || !planId || !startDate) {
            alert('Please select a customer and start date.');
            return;
          }
          try {
            await api.memberships.assign({ customer_id: Number(customerId), plan_id: Number(planId), start_date: startDate });
            alert('Membership assigned successfully.');
            const modal = container.querySelector('#assignMembershipModal');
            if (modal) modal.classList.remove('active');
            // Optionally refresh current membership if assigning to self, else just close
          } catch (err) {
            console.error('Assign membership failed', err);
            alert('Failed to assign membership: ' + (err.message || 'Unknown error'));
          }
        });
      }

      // Edit/Delete handlers for membership card
      container.addEventListener('click', async (e) => {
        const t = e.target;
        // Plan edit/delete actions
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
              container.querySelector('#editPlanDuration').value = Number(plan.duration_days) || 1;
              container.querySelector('#editPlanPrice').value = Number(plan.price) || 0;
              const recSel = container.querySelector('#editPlanRecurring');
              if (recSel) recSel.value = plan.is_recurring ? 'true' : 'false';
              container.querySelector('#editPlanDiscount').value = Number(plan.discount_percentage) || 0;
              container.querySelector('#editPlanWallet').value = Number(plan.wallet_credits) || 0;
              container.querySelector('#editPlanFree').value = Number(plan.free_services) || 0;
              container.querySelector('#editPlanGuest').value = Number(plan.guest_passes) || 0;
              const prioSel = container.querySelector('#editPlanPriority');
              if (prioSel) prioSel.value = plan.priority_level || 'standard';
              container.querySelector('#editPlanDescription').value = plan.description || '';
              const actSel = container.querySelector('#editPlanActive');
              if (actSel) actSel.value = plan.is_active ? 'true' : 'false';
            }
          }
        }
        if (t && t.dataset && t.dataset.action === 'close-plan-modal') {
          const modal = container.querySelector('#editPlanModal');
          if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
          }
        }
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
        if (t && t.dataset && t.dataset.action === 'edit-membership') {
          const id = t.dataset.membershipId;
          const modal = container.querySelector('#editMembershipModal');
          if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            container.querySelector('#editMembershipId').value = id;
            // Prefill existing values
            const statusSel = container.querySelector('#editStatus');
            const endInput = container.querySelector('#editEndDate');
            if (statusSel) statusSel.value = myMembership.status;
            if (endInput) endInput.value = myMembership.end_date;
          }
        }
        if (t && t.dataset && t.dataset.action === 'close-edit-modal') {
          const modal = container.querySelector('#editMembershipModal');
          if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
          }
        }
        if (t && t.dataset && t.dataset.action === 'delete-membership') {
          const id = Number(t.dataset.membershipId);
          if (confirm('Are you sure you want to delete this membership?')) {
            try {
              await api.memberships.delete(id);
              alert('Membership deleted');
              // Refresh page view
              render(container);
            } catch (err) {
              console.error('Delete membership failed', err);
              alert('Failed to delete membership: ' + (err.message || 'Unknown error'));
            }
          }
        }
      });

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
      const editPlanForm = container.querySelector('#editPlanForm');
      if (editPlanForm) {
        editPlanForm.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const id = Number(container.querySelector('#editPlanId').value);
          const payload = {
            name: container.querySelector('#editPlanName').value,
            tier: container.querySelector('#editPlanTier').value,
            duration_days: Number(container.querySelector('#editPlanDuration').value),
            price: Number(container.querySelector('#editPlanPrice').value),
            is_recurring: container.querySelector('#editPlanRecurring').value === 'true',
            discount_percentage: Number(container.querySelector('#editPlanDiscount').value || 0),
            wallet_credits: Number(container.querySelector('#editPlanWallet').value || 0),
            free_services: Number(container.querySelector('#editPlanFree').value || 0),
            guest_passes: Number(container.querySelector('#editPlanGuest').value || 0),
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
  } catch (error) {
    console.error('Memberships render error:', error);
    container.innerHTML = `<div class="card"><div class="card-body">Failed to load memberships.</div></div>`;
  }
}
