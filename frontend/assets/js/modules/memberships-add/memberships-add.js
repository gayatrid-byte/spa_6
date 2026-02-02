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
              <label>Duration (Days)</label>
              <input name="duration_days" type="number" min="1" placeholder="30" required />
            </div>

            <div class="form-group">
              <label>Price</label>
              <input name="price" type="number" step="0.01" placeholder="99.99" required />
            </div>

            <div class="form-group">
              <label>Recurring</label>
              <select name="is_recurring">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>

            <div class="form-group">
              <label>Discount (%)</label>
              <input name="discount_percentage" type="number" step="0.01" placeholder="10" />
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


        <!-- BENEFITS -->
        <div class="section-card mb-3">
          <h4 class="section-title">🎁 Plan Benefits</h4>

          <div class="grid grid-3 gap-3">

            <div class="form-group">
              <label>Wallet Credits</label>
              <input name="wallet_credits" type="number" step="0.01" placeholder="50" />
            </div>

            <div class="form-group">
              <label>Free Services</label>
              <input name="free_services" type="number" placeholder="5" />
            </div>

            <div class="form-group">
              <label>Guest Passes</label>
              <input name="guest_passes" type="number" placeholder="2" />
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
}
