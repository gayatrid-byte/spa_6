// /**
//  * ============================================
//  * PREMIUM BI TEMPLATE SHOWCASE MODULE
//  * Enterprise Dashboard Templates Marketplace
//  * ============================================
//  */

// export async function renderTemplateShowcase(container) {
//   const showcaseHTML = `
//     <!-- Template Showcase Section -->
//     <div class="template-showcase-section">
//       <div class="showcase-header">
//         <div class="showcase-header-content">
//           <h2 class="showcase-title">Explore More Dashboard Templates</h2>
//           <p class="showcase-subtitle">Discover premium enterprise dashboard modules designed for modern business analytics and reporting</p>
//         </div>
//       </div>

//       <!-- Filter Tabs -->
//       <div class="template-filters">
//         <button class="template-filter-btn active" data-category="all">All Templates</button>
//         <button class="template-filter-btn" data-category="revenue">Revenue</button>
//         <button class="template-filter-btn" data-category="customer">Customer</button>
//         <button class="template-filter-btn" data-category="operations">Operations</button>
//         <button class="template-filter-btn" data-category="advanced">Advanced</button>
//       </div>

//       <!-- Templates Grid -->
//       <div class="templates-grid">
//         <!-- Template 1: Revenue Intelligence Dashboard -->
//         <div class="template-card" data-category="revenue">
//           <div class="template-card-image">
//             <div class="template-thumbnail revenue-thumbnail">
//               <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
//                 <rect width="300" height="200" fill="#f8fafc"/>
//                 <rect x="20" y="20" width="260" height="30" fill="#2563eb" rx="4" opacity="0.1"/>
//                 <path d="M 30 80 Q 70 50 110 70 T 190 60" stroke="#10b981" stroke-width="2" fill="none" stroke-linecap="round"/>
//                 <circle cx="30" cy="80" r="3" fill="#10b981"/>
//                 <circle cx="110" cy="70" r="3" fill="#10b981"/>
//                 <circle cx="190" cy="60" r="3" fill="#10b981"/>
//                 <rect x="20" y="120" width="50" height="60" fill="#3b82f6" rx="2" opacity="0.8"/>
//                 <rect x="90" y="100" width="50" height="80" fill="#3b82f6" rx="2" opacity="0.6"/>
//                 <rect x="160" y="95" width="50" height="85" fill="#3b82f6" rx="2" opacity="0.4"/>
//               </svg>
//             </div>
//             <div class="template-badge">12 KPI Metrics</div>
//           </div>
          
//           <div class="template-card-content">
//             <h3>Revenue Intelligence Dashboard</h3>
//             <p>Track daily revenue, profit margins, payment methods, and growth trends with advanced financial analytics and real-time metrics.</p>
//             <div class="template-features">
//               <span class="feature-tag">Revenue Tracking</span>
//               <span class="feature-tag">Profit Analysis</span>
//               <span class="feature-tag">Trends</span>
//             </div>
//           </div>
          
//           <div class="template-card-footer">
//             <a href="#" class="template-demo-btn">See a live demo →</a>
//           </div>
//         </div>

//         <!-- Template 2: Booking Analytics Dashboard -->
//         <div class="template-card" data-category="operations">
//           <div class="template-card-image">
//             <div class="template-thumbnail bookings-thumbnail">
//               <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
//                 <rect width="300" height="200" fill="#f8fafc"/>
//                 <circle cx="60" cy="80" r="40" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" stroke-width="2"/>
//                 <circle cx="60" cy="80" r="25" fill="none" stroke="#f59e0b" stroke-width="2"/>
//                 <circle cx="150" cy="80" r="40" fill="#10b981" opacity="0.2" stroke="#10b981" stroke-width="2"/>
//                 <circle cx="150" cy="80" r="25" fill="none" stroke="#10b981" stroke-width="2"/>
//                 <circle cx="240" cy="80" r="40" fill="#ef4444" opacity="0.2" stroke="#ef4444" stroke-width="2"/>
//                 <circle cx="240" cy="80" r="25" fill="none" stroke="#ef4444" stroke-width="2"/>
//                 <line x1="30" y1="160" x2="270" y2="160" stroke="#e2e8f0" stroke-width="1"/>
//                 <line x1="60" y1="160" x2="60" y2="180" stroke="#f59e0b" stroke-width="2"/>
//                 <line x1="150" y1="160" x2="150" y2="180" stroke="#10b981" stroke-width="2"/>
//                 <line x1="240" y1="160" x2="240" y2="180" stroke="#ef4444" stroke-width="2"/>
//               </svg>
//             </div>
//             <div class="template-badge">8 Status Breakdowns</div>
//           </div>
          
//           <div class="template-card-content">
//             <h3>Booking Analytics Dashboard</h3>
//             <p>Monitor booking completion rates, cancellations, no-shows, and customer engagement with hourly distribution analytics.</p>
//             <div class="template-features">
//               <span class="feature-tag">Completion Metrics</span>
//               <span class="feature-tag">Status Tracking</span>
//               <span class="feature-tag">Hourly Analysis</span>
//             </div>
//           </div>
          
//           <div class="template-card-footer">
//             <a href="#" class="template-demo-btn">See a live demo →</a>
//           </div>
//         </div>

//         <!-- Template 3: Customer Intelligence Dashboard -->
//         <div class="template-card" data-category="customer">
//           <div class="template-card-image">
//             <div class="template-thumbnail customer-thumbnail">
//               <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
//                 <rect width="300" height="200" fill="#f8fafc"/>
//                 <circle cx="50" cy="70" r="15" fill="#2563eb" opacity="0.8"/>
//                 <circle cx="110" cy="70" r="15" fill="#2563eb" opacity="0.6"/>
//                 <circle cx="170" cy="70" r="15" fill="#2563eb" opacity="0.4"/>
//                 <circle cx="230" cy="70" r="15" fill="#2563eb" opacity="0.2"/>
//                 <path d="M 30 110 Q 75 140 150 140 T 270 110" stroke="#10b981" stroke-width="2" fill="none"/>
//                 <rect x="20" y="160" width="260" height="20" fill="#e2e8f0" rx="2"/>
//                 <rect x="20" y="160" width="195" height="20" fill="#10b981" rx="2"/>
//               </svg>
//             </div>
//             <div class="template-badge">6 Segmentation Layers</div>
//           </div>
          
//           <div class="template-card-content">
//             <h3>Customer Intelligence Dashboard</h3>
//             <p>Analyze customer lifetime value, retention rates, churn prediction, and segment customers for targeted engagement campaigns.</p>
//             <div class="template-features">
//               <span class="feature-tag">CLV Analysis</span>
//               <span class="feature-tag">Segmentation</span>
//               <span class="feature-tag">Retention Metrics</span>
//             </div>
//           </div>
          
//           <div class="template-card-footer">
//             <a href="#" class="template-demo-btn">See a live demo →</a>
//           </div>
//         </div>

//         <!-- Template 4: Staff Performance Dashboard -->
//         <div class="template-card" data-category="operations">
//           <div class="template-card-image">
//             <div class="template-thumbnail staff-thumbnail">
//               <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
//                 <rect width="300" height="200" fill="#f8fafc"/>
//                 <g id="staff-bars">
//                   <rect x="20" y="80" width="35" height="80" fill="#2563eb" rx="2"/>
//                   <rect x="70" y="50" width="35" height="110" fill="#3b82f6" rx="2"/>
//                   <rect x="120" y="60" width="35" height="100" fill="#60a5fa" rx="2"/>
//                   <rect x="170" y="35" width="35" height="125" fill="#93c5fd" rx="2"/>
//                   <rect x="220" y="90" width="35" height="70" fill="#bfdbfe" rx="2"/>
//                 </g>
//                 <line x1="10" y1="160" x2="270" y2="160" stroke="#e2e8f0" stroke-width="1"/>
//               </svg>
//             </div>
//             <div class="template-badge">10 Performance Metrics</div>
//           </div>
          
//           <div class="template-card-content">
//             <h3>Staff Performance Dashboard</h3>
//             <p>Track revenue per staff member, utilization rates, customer satisfaction, and identify top performers with commission tracking.</p>
//             <div class="template-features">
//               <span class="feature-tag">Revenue/Staff</span>
//               <span class="feature-tag">Rankings</span>
//               <span class="feature-tag">Utilization</span>
//             </div>
//           </div>
          
//           <div class="template-card-footer">
//             <a href="#" class="template-demo-btn">See a live demo →</a>
//           </div>
//         </div>

//         <!-- Template 5: Membership Analytics Dashboard -->
//         <div class="template-card" data-category="revenue">
//           <div class="template-card-image">
//             <div class="template-thumbnail membership-thumbnail">
//               <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
//                 <rect width="300" height="200" fill="#f8fafc"/>
//                 <circle cx="150" cy="100" r="70" fill="none" stroke="#2563eb" stroke-width="15" stroke-dasharray="200 300"/>
//                 <circle cx="150" cy="100" r="70" fill="none" stroke="#10b981" stroke-width="15" stroke-dasharray="100 300" stroke-dashoffset="-200"/>
//                 <circle cx="150" cy="100" r="45" fill="#f8fafc"/>
//                 <text x="150" y="110" text-anchor="middle" font-size="24" font-weight="bold" fill="#2563eb">35%</text>
//               </svg>
//             </div>
//             <div class="template-badge">MRR Forecast</div>
//           </div>
          
//           <div class="template-card-content">
//             <h3>Membership Analytics Dashboard</h3>
//             <p>Monitor active memberships, monthly recurring revenue, renewal rates, and predict churn with membership lifecycle tracking.</p>
//             <div class="template-features">
//               <span class="feature-tag">MRR Tracking</span>
//               <span class="feature-tag">Renewal Rates</span>
//               <span class="feature-tag">Forecasting</span>
//             </div>
//           </div>
          
//           <div class="template-card-footer">
//             <a href="#" class="template-demo-btn">See a live demo →</a>
//           </div>
//         </div>

//         <!-- Template 6: Expense & Profit Dashboard -->
//         <div class="template-card" data-category="revenue">
//           <div class="template-card-image">
//             <div class="template-thumbnail expense-thumbnail">
//               <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
//                 <rect width="300" height="200" fill="#f8fafc"/>
//                 <circle cx="150" cy="100" r="50" fill="none" stroke="#10b981" stroke-width="8"/>
//                 <path d="M 150 50 A 50 50 0 0 1 200 93" fill="none" stroke="#f59e0b" stroke-width="8"/>
//                 <path d="M 200 93 A 50 50 0 0 1 150 150" fill="none" stroke="#ef4444" stroke-width="8"/>
//                 <text x="150" y="110" text-anchor="middle" font-size="20" font-weight="bold" fill="#0f172a">72%</text>
//               </svg>
//             </div>
//             <div class="template-badge">P&L Analysis</div>
//           </div>
          
//           <div class="template-card-content">
//             <h3>Expense & Profit Dashboard</h3>
//             <p>Analyze expense categories, calculate profit margins, identify cost optimization opportunities, and track operating ratios.</p>
//             <div class="template-features">
//               <span class="feature-tag">Expense Tracking</span>
//               <span class="feature-tag">Margins</span>
//               <span class="feature-tag">Cost Analysis</span>
//             </div>
//           </div>
          
//           <div class="template-card-footer">
//             <a href="#" class="template-demo-btn">See a live demo →</a>
//           </div>
//         </div>

//         <!-- Template 7: Service Performance Dashboard -->
//         <div class="template-card" data-category="operations">
//           <div class="template-card-image">
//             <div class="template-thumbnail service-thumbnail">
//               <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
//                 <rect width="300" height="200" fill="#f8fafc"/>
//                 <rect x="20" y="30" width="50" height="130" fill="#2563eb" opacity="0.9" rx="2"/>
//                 <rect x="80" y="50" width="50" height="110" fill="#2563eb" opacity="0.7" rx="2"/>
//                 <rect x="140" y="70" width="50" height="90" fill="#2563eb" opacity="0.5" rx="2"/>
//                 <rect x="200" y="80" width="50" height="80" fill="#2563eb" opacity="0.3" rx="2"/>
//                 <line x1="10" y1="160" x2="260" y2="160" stroke="#e2e8f0" stroke-width="1"/>
//               </svg>
//             </div>
//             <div class="template-badge">Service Mix Analytics</div>
//           </div>
          
//           <div class="template-card-content">
//             <h3>Service Performance Dashboard</h3>
//             <p>Track service popularity, revenue contribution, customer ratings, and identify growth opportunities for each service offering.</p>
//             <div class="template-features">
//               <span class="feature-tag">Service Mix</span>
//               <span class="feature-tag">Revenue Share</span>
//               <span class="feature-tag">Ratings</span>
//             </div>
//           </div>
          
//           <div class="template-card-footer">
//             <a href="#" class="template-demo-btn">See a live demo →</a>
//           </div>
//         </div>

//         <!-- Template 8: Smart AI Analytics Dashboard -->
//         <div class="template-card" data-category="advanced">
//           <div class="template-card-image">
//             <div class="template-thumbnail ai-thumbnail">
//               <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
//                 <rect width="300" height="200" fill="#f8fafc"/>
//                 <circle cx="75" cy="75" r="30" fill="none" stroke="#8b5cf6" stroke-width="2"/>
//                 <circle cx="75" cy="75" r="20" fill="none" stroke="#8b5cf6" stroke-width="1" opacity="0.5"/>
//                 <circle cx="225" cy="75" r="30" fill="none" stroke="#8b5cf6" stroke-width="2"/>
//                 <circle cx="225" cy="75" r="20" fill="none" stroke="#8b5cf6" stroke-width="1" opacity="0.5"/>
//                 <line x1="105" y1="75" x2="195" y2="75" stroke="#8b5cf6" stroke-width="2"/>
//                 <circle cx="150" cy="150" r="35" fill="none" stroke="#2563eb" stroke-width="2"/>
//                 <circle cx="150" cy="150" r="22" fill="none" stroke="#2563eb" stroke-width="1" opacity="0.5"/>
//               </svg>
//             </div>
//             <div class="template-badge">AI Predictions</div>
//           </div>
          
//           <div class="template-card-content">
//             <h3>Smart AI Analytics Dashboard</h3>
//             <p>Leverage predictive analytics for churn prediction, revenue forecasting, anomaly detection, and AI-powered actionable insights.</p>
//             <div class="template-features">
//               <span class="feature-tag">Churn Prediction</span>
//               <span class="feature-tag">Forecasting</span>
//               <span class="feature-tag">Anomalies</span>
//             </div>
//           </div>
          
//           <div class="template-card-footer">
//             <a href="#" class="template-demo-btn">See a live demo →</a>
//           </div>
//         </div>
//       </div>

//       <!-- View All Button -->
//       <div class="showcase-footer">
//         <a href="#" class="view-all-templates-btn">View All Templates →</a>
//       </div>
//     </div>
//   `;

//   container.insertAdjacentHTML('beforeend', showcaseHTML);
//   attachShowcaseEventListeners();
// }

// function attachShowcaseEventListeners() {
//   const filterBtns = document.querySelectorAll('.template-filter-btn');
//   const templateCards = document.querySelectorAll('.template-card');

//   filterBtns.forEach(btn => {
//     btn.addEventListener('click', () => {
//       // Remove active from all buttons
//       filterBtns.forEach(b => b.classList.remove('active'));
//       btn.classList.add('active');

//       const category = btn.dataset.category;

//       // Filter cards
//       templateCards.forEach(card => {
//         if (category === 'all' || card.dataset.category === category) {
//           card.style.display = '';
//           setTimeout(() => card.classList.add('visible'), 10);
//         } else {
//           card.classList.remove('visible');
//           setTimeout(() => card.style.display = 'none', 300);
//         }
//       });
//     });
//   });

//   // Demo button click handlers
//   document.querySelectorAll('.template-demo-btn').forEach(btn => {
//     btn.addEventListener('click', (e) => {
//       e.preventDefault();
//       const templateName = btn.closest('.template-card').querySelector('h3').textContent;
//       console.log(`Viewing demo for: ${templateName}`);
//       // TODO: Implement navigation to specific template view
//     });
//   });
// }

/**
 * ============================================
 * PREMIUM BI TEMPLATE SHOWCASE MODULE
 * Enterprise Dashboard Templates Marketplace
 * ============================================
 */

export async function renderTemplateShowcase(container) {
  const showcaseHTML = `
    <!-- Template Showcase Section -->
    <div class="template-showcase-section">
      <div class="showcase-header">
        <div class="showcase-header-content">
          <h2 class="showcase-title">Explore More Dashboard Templates</h2>
          <p class="showcase-subtitle">Discover premium enterprise dashboard modules designed for modern business analytics and reporting</p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="template-filters">
        <button class="template-filter-btn active" data-category="all">All Templates</button>
        <button class="template-filter-btn" data-category="revenue">Revenue</button>
        <button class="template-filter-btn" data-category="customer">Customer</button>
        <button class="template-filter-btn" data-category="operations">Operations</button>
        <button class="template-filter-btn" data-category="advanced">Advanced</button>
      </div>

      <!-- Templates Grid -->
      <div class="templates-grid">
        <!-- Template 1: Revenue Intelligence Dashboard -->
        <div class="template-card" data-category="revenue">
          <div class="template-card-image">
            <div class="template-thumbnail revenue-thumbnail">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f8fafc"/>
                <rect x="20" y="20" width="260" height="30" fill="#2563eb" rx="4" opacity="0.1"/>
                <path d="M 30 80 Q 70 50 110 70 T 190 60" stroke="#10b981" stroke-width="2" fill="none" stroke-linecap="round"/>
                <circle cx="30" cy="80" r="3" fill="#10b981"/>
                <circle cx="110" cy="70" r="3" fill="#10b981"/>
                <circle cx="190" cy="60" r="3" fill="#10b981"/>
                <rect x="20" y="120" width="50" height="60" fill="#3b82f6" rx="2" opacity="0.8"/>
                <rect x="90" y="100" width="50" height="80" fill="#3b82f6" rx="2" opacity="0.6"/>
                <rect x="160" y="95" width="50" height="85" fill="#3b82f6" rx="2" opacity="0.4"/>
              </svg>
            </div>
            <div class="template-badge">12 KPI Metrics</div>
          </div>
          
          <div class="template-card-content">
            <h3>Revenue Intelligence Dashboard</h3>
            <p>Track daily revenue, profit margins, payment methods, and growth trends with advanced financial analytics and real-time metrics.</p>
            <div class="template-features">
              <span class="feature-tag">Revenue Tracking</span>
              <span class="feature-tag">Profit Analysis</span>
              <span class="feature-tag">Trends</span>
            </div>
          </div>
          
          <div class="template-card-footer">
            <a href="#" class="template-demo-btn">See a live demo →</a>
          </div>
        </div>

        <!-- Template 2: Booking Analytics Dashboard -->
        <div class="template-card" data-category="operations">
          <div class="template-card-image">
            <div class="template-thumbnail bookings-thumbnail">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f8fafc"/>
                <circle cx="60" cy="80" r="40" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" stroke-width="2"/>
                <circle cx="60" cy="80" r="25" fill="none" stroke="#f59e0b" stroke-width="2"/>
                <circle cx="150" cy="80" r="40" fill="#10b981" opacity="0.2" stroke="#10b981" stroke-width="2"/>
                <circle cx="150" cy="80" r="25" fill="none" stroke="#10b981" stroke-width="2"/>
                <circle cx="240" cy="80" r="40" fill="#ef4444" opacity="0.2" stroke="#ef4444" stroke-width="2"/>
                <circle cx="240" cy="80" r="25" fill="none" stroke="#ef4444" stroke-width="2"/>
                <line x1="30" y1="160" x2="270" y2="160" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="60" y1="160" x2="60" y2="180" stroke="#f59e0b" stroke-width="2"/>
                <line x1="150" y1="160" x2="150" y2="180" stroke="#10b981" stroke-width="2"/>
                <line x1="240" y1="160" x2="240" y2="180" stroke="#ef4444" stroke-width="2"/>
              </svg>
            </div>
            <div class="template-badge">8 Status Breakdowns</div>
          </div>
          
          <div class="template-card-content">
            <h3>Booking Analytics Dashboard</h3>
            <p>Monitor booking completion rates, cancellations, no-shows, and customer engagement with hourly distribution analytics.</p>
            <div class="template-features">
              <span class="feature-tag">Completion Metrics</span>
              <span class="feature-tag">Status Tracking</span>
              <span class="feature-tag">Hourly Analysis</span>
            </div>
          </div>
          
          <div class="template-card-footer">
            <a href="#" class="template-demo-btn">See a live demo →</a>
          </div>
        </div>

        <!-- Template 3: Customer Intelligence Dashboard -->
        <div class="template-card" data-category="customer">
          <div class="template-card-image">
            <div class="template-thumbnail customer-thumbnail">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f8fafc"/>
                <circle cx="50" cy="70" r="15" fill="#2563eb" opacity="0.8"/>
                <circle cx="110" cy="70" r="15" fill="#2563eb" opacity="0.6"/>
                <circle cx="170" cy="70" r="15" fill="#2563eb" opacity="0.4"/>
                <circle cx="230" cy="70" r="15" fill="#2563eb" opacity="0.2"/>
                <path d="M 30 110 Q 75 140 150 140 T 270 110" stroke="#10b981" stroke-width="2" fill="none"/>
                <rect x="20" y="160" width="260" height="20" fill="#e2e8f0" rx="2"/>
                <rect x="20" y="160" width="195" height="20" fill="#10b981" rx="2"/>
              </svg>
            </div>
            <div class="template-badge">6 Segmentation Layers</div>
          </div>
          
          <div class="template-card-content">
            <h3>Customer Intelligence Dashboard</h3>
            <p>Analyze customer lifetime value, retention rates, churn prediction, and segment customers for targeted engagement campaigns.</p>
            <div class="template-features">
              <span class="feature-tag">CLV Analysis</span>
              <span class="feature-tag">Segmentation</span>
              <span class="feature-tag">Retention Metrics</span>
            </div>
          </div>
          
          <div class="template-card-footer">
            <a href="#" class="template-demo-btn">See a live demo →</a>
          </div>
        </div>

        <!-- Template 4: Staff Performance Dashboard -->
        <div class="template-card" data-category="operations">
          <div class="template-card-image">
            <div class="template-thumbnail staff-thumbnail">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f8fafc"/>
                <g id="staff-bars">
                  <rect x="20" y="80" width="35" height="80" fill="#2563eb" rx="2"/>
                  <rect x="70" y="50" width="35" height="110" fill="#3b82f6" rx="2"/>
                  <rect x="120" y="60" width="35" height="100" fill="#60a5fa" rx="2"/>
                  <rect x="170" y="35" width="35" height="125" fill="#93c5fd" rx="2"/>
                  <rect x="220" y="90" width="35" height="70" fill="#bfdbfe" rx="2"/>
                </g>
                <line x1="10" y1="160" x2="270" y2="160" stroke="#e2e8f0" stroke-width="1"/>
              </svg>
            </div>
            <div class="template-badge">10 Performance Metrics</div>
          </div>
          
          <div class="template-card-content">
            <h3>Staff Performance Dashboard</h3>
            <p>Track revenue per staff member, utilization rates, customer satisfaction, and identify top performers with commission tracking.</p>
            <div class="template-features">
              <span class="feature-tag">Revenue/Staff</span>
              <span class="feature-tag">Rankings</span>
              <span class="feature-tag">Utilization</span>
            </div>
          </div>
          
          <div class="template-card-footer">
            <a href="#" class="template-demo-btn">See a live demo →</a>
          </div>
        </div>

        <!-- Template 5: Membership Analytics Dashboard -->
        <div class="template-card" data-category="revenue">
          <div class="template-card-image">
            <div class="template-thumbnail membership-thumbnail">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f8fafc"/>
                <circle cx="150" cy="100" r="70" fill="none" stroke="#2563eb" stroke-width="15" stroke-dasharray="200 300"/>
                <circle cx="150" cy="100" r="70" fill="none" stroke="#10b981" stroke-width="15" stroke-dasharray="100 300" stroke-dashoffset="-200"/>
                <circle cx="150" cy="100" r="45" fill="#f8fafc"/>
                <text x="150" y="110" text-anchor="middle" font-size="24" font-weight="bold" fill="#2563eb">35%</text>
              </svg>
            </div>
            <div class="template-badge">MRR Forecast</div>
          </div>
          
          <div class="template-card-content">
            <h3>Membership Analytics Dashboard</h3>
            <p>Monitor active memberships, monthly recurring revenue, renewal rates, and predict churn with membership lifecycle tracking.</p>
            <div class="template-features">
              <span class="feature-tag">MRR Tracking</span>
              <span class="feature-tag">Renewal Rates</span>
              <span class="feature-tag">Forecasting</span>
            </div>
          </div>
          
          <div class="template-card-footer">
            <a href="#" class="template-demo-btn">See a live demo →</a>
          </div>
        </div>

        <!-- Template 6: Expense & Profit Dashboard -->
        <div class="template-card" data-category="revenue">
          <div class="template-card-image">
            <div class="template-thumbnail expense-thumbnail">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f8fafc"/>
                <circle cx="150" cy="100" r="50" fill="none" stroke="#10b981" stroke-width="8"/>
                <path d="M 150 50 A 50 50 0 0 1 200 93" fill="none" stroke="#f59e0b" stroke-width="8"/>
                <path d="M 200 93 A 50 50 0 0 1 150 150" fill="none" stroke="#ef4444" stroke-width="8"/>
                <text x="150" y="110" text-anchor="middle" font-size="20" font-weight="bold" fill="#0f172a">72%</text>
              </svg>
            </div>
            <div class="template-badge">P&L Analysis</div>
          </div>
          
          <div class="template-card-content">
            <h3>Expense & Profit Dashboard</h3>
            <p>Analyze expense categories, calculate profit margins, identify cost optimization opportunities, and track operating ratios.</p>
            <div class="template-features">
              <span class="feature-tag">Expense Tracking</span>
              <span class="feature-tag">Margins</span>
              <span class="feature-tag">Cost Analysis</span>
            </div>
          </div>
          
          <div class="template-card-footer">
            <a href="#" class="template-demo-btn">See a live demo →</a>
          </div>
        </div>

        <!-- Template 7: Service Performance Dashboard -->
        <div class="template-card" data-category="operations">
          <div class="template-card-image">
            <div class="template-thumbnail service-thumbnail">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f8fafc"/>
                <rect x="20" y="30" width="50" height="130" fill="#2563eb" opacity="0.9" rx="2"/>
                <rect x="80" y="50" width="50" height="110" fill="#2563eb" opacity="0.7" rx="2"/>
                <rect x="140" y="70" width="50" height="90" fill="#2563eb" opacity="0.5" rx="2"/>
                <rect x="200" y="80" width="50" height="80" fill="#2563eb" opacity="0.3" rx="2"/>
                <line x1="10" y1="160" x2="260" y2="160" stroke="#e2e8f0" stroke-width="1"/>
              </svg>
            </div>
            <div class="template-badge">Service Mix Analytics</div>
          </div>
          
          <div class="template-card-content">
            <h3>Service Performance Dashboard</h3>
            <p>Track service popularity, revenue contribution, customer ratings, and identify growth opportunities for each service offering.</p>
            <div class="template-features">
              <span class="feature-tag">Service Mix</span>
              <span class="feature-tag">Revenue Share</span>
              <span class="feature-tag">Ratings</span>
            </div>
          </div>
          
          <div class="template-card-footer">
            <a href="#" class="template-demo-btn">See a live demo →</a>
          </div>
        </div>

        <!-- Template 8: Smart AI Analytics Dashboard -->
        <div class="template-card" data-category="advanced">
          <div class="template-card-image">
            <div class="template-thumbnail ai-thumbnail">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f8fafc"/>
                <circle cx="75" cy="75" r="30" fill="none" stroke="#8b5cf6" stroke-width="2"/>
                <circle cx="75" cy="75" r="20" fill="none" stroke="#8b5cf6" stroke-width="1" opacity="0.5"/>
                <circle cx="225" cy="75" r="30" fill="none" stroke="#8b5cf6" stroke-width="2"/>
                <circle cx="225" cy="75" r="20" fill="none" stroke="#8b5cf6" stroke-width="1" opacity="0.5"/>
                <line x1="105" y1="75" x2="195" y2="75" stroke="#8b5cf6" stroke-width="2"/>
                <circle cx="150" cy="150" r="35" fill="none" stroke="#2563eb" stroke-width="2"/>
                <circle cx="150" cy="150" r="22" fill="none" stroke="#2563eb" stroke-width="1" opacity="0.5"/>
              </svg>
            </div>
            <div class="template-badge">AI Predictions</div>
          </div>
          
          <div class="template-card-content">
            <h3>Smart AI Analytics Dashboard</h3>
            <p>Leverage predictive analytics for churn prediction, revenue forecasting, anomaly detection, and AI-powered actionable insights.</p>
            <div class="template-features">
              <span class="feature-tag">Churn Prediction</span>
              <span class="feature-tag">Forecasting</span>
              <span class="feature-tag">Anomalies</span>
            </div>
          </div>
          
          <div class="template-card-footer">
            <a href="#" class="template-demo-btn">See a live demo →</a>
          </div>
        </div>
      </div>

      <!-- View All Button -->
      <div class="showcase-footer">
        <a href="#" class="view-all-templates-btn">View All Templates →</a>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', showcaseHTML);
  attachShowcaseEventListeners();
}

function attachShowcaseEventListeners() {
  const filterBtns = document.querySelectorAll('.template-filter-btn');
  const templateCards = document.querySelectorAll('.template-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;

      // Filter cards
      templateCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = '';
          setTimeout(() => card.classList.add('visible'), 10);
        } else {
          card.classList.remove('visible');
          setTimeout(() => card.style.display = 'none', 300);
        }
      });
    });
  });

  // Demo button click handlers
  document.querySelectorAll('.template-demo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const templateName = btn.closest('.template-card').querySelector('h3').textContent;
      console.log(`Viewing demo for: ${templateName}`);
      // TODO: Implement navigation to specific template view
    });
  });
}