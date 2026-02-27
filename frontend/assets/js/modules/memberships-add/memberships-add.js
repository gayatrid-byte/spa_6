export async function render(container) {

  container.innerHTML = `
  <div class="card shadow-lg">

    <!-- Header -->
    <div class="card-header d-flex justify-content-between align-items-center">
      <div>
        <h3 class="mb-0">Create Membership Plan</h3>
        <small class="text-muted">Configure pricing, duration and benefits</small>
      </div>
      <span class="badge badge-primary">Admin Panel</span>
    </div>

    <div class="card-body">

      <form id="createPlanForm">

        <!-- PLAN INFO -->
        <div class="section-card mb-3">
          <h4 class="section-title">📌 Plan Information</h4>

          <div class="grid grid-2 gap-3">

            <div class="form-group">
              <label>Plan Name</label>
              <input name="name" placeholder="Gold Plus" required />
            </div>

            <div class="form-group">
              <label>Tier</label>
              <select name="tier">
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="diamond">Diamond</option>
              </select>
            </div>

            <div class="form-group grid-col-span-2">
              <label>Description</label>
              <textarea name="description" placeholder="Short plan description"></textarea>
            </div>

          </div>
        </div>


        <!-- PRICING -->
        <div class="section-card mb-3">
          <h4 class="section-title">💰 Pricing & Duration</h4>

          <div class="grid grid-3 gap-3">

            <div class="form-group">
              <label>Duration (Months)</label>
              <select name="duration_months" required>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
            </div>

            <div class="form-group">
              <label>Price</label>
              <input name="price" type="number" step="0.01" placeholder="99.99" required />
            </div>

            

            <div class="form-group">
              <label>Discount (%)</label>
              <input name="discount_percentage" type="number" step="0.01" placeholder="15" value="15" />
            </div>

            <div class="form-group">
              <label>Priority Level</label>
              <select name="priority_level">
                <option value="standard">Standard</option>
                <option value="priority">Priority</option>
                <option value="vip">VIP</option>
              </select>
            </div>

          </div>
        </div>
        <!-- ACTION BAR -->
        <div class="form-actions">

          <button class="btn btn-primary" type="submit">
            ✅ Create Plan
          </button>

          <button id="cancelBtn" class="btn btn-outline" type="button">
            ❌ Cancel
          </button>

        </div>

      </form>

    </div>
  </div>
  `;

  // Wallet credits removed; backend will default to price.

  // Cancel: navigate back to memberships module
  const cancelBtn = container.querySelector('#cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.hash = 'memberships';
    });
  }

  // Handle form submission
  const createPlanForm = container.querySelector('#createPlanForm');
  if (createPlanForm) {
    createPlanForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(createPlanForm);
      const planData = {
        name: formData.get('name'),
        tier: formData.get('tier'),
        description: formData.get('description'),
        duration_months: parseInt(formData.get('duration_months')),
        price: parseFloat(formData.get('price')),
        discount_percentage: parseFloat(formData.get('discount_percentage')) || 0,
        priority_level: formData.get('priority_level')
      };

      try {
        const result = await api.memberships.createPlan(planData);
        utils.showToast('Membership plan created successfully!', 'success');
        window.location.hash = 'memberships';
      } catch (error) {
        console.error('Error creating membership plan:', error);
        utils.showToast('Error creating membership plan: ' + (error.message || 'Unknown error'), 'error');
      }
    });
  }
}
