


/* =========================================================
   CALENDAR MODULE (FINAL FIXED PRODUCTION VERSION)
   ========================================================= */

window.calendarBookingPayload = null;
window.calendarInstance = null;

/* =========================================================
   RENDER
   ========================================================= */
export async function render(container) {
  try {
    auth.requireAuth();

    const currentUser = auth.getCurrentUser();
    const role = currentUser?.role;

    if (!permissions.can(role, 'manageCalendar')) {
      container.innerHTML = `
        <div class="card">
          <h3>Access Denied</h3>
          <p>You do not have permission to access Calendar.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h3>Customer Calendar</h3>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">

            <select id="staffFilter" class="form-control form-control-sm">
              <option value="">All Staff</option>
            </select>

            <select id="roomFilter" class="form-control form-control-sm">
              <option value="">All Room</option>
            </select>

            <button id="addBookingBtn" class="btn btn-primary btn-sm" style="margin-top: 16px; margin-bottom: 16px;">
              ➕ Add New Booking
            </button>

            <button id="addCustomerBtn" class="btn btn-secondary btn-sm" style="margin-top: 16px; margin-bottom: 16px;">
              👤 Add New Customer
            </button>

          </div>
        </div>

        <div class="card-body" style="padding:0;">
          <div id="calendarWrapper" style="
              height:750px;
              border:1px solid #dee2e6;
              overflow:hidden;
              background:#fff;
          ">
            <div id="calendar"></div>
          </div>
        </div>
      </div>
    `;

    attachEventListeners(container);
    await loadCalendarFilters();
    initCalendar();

  } catch (error) {
    console.error('Calendar render error:', error);
  }
}

/* =========================================================
   LOAD FILTERS
   ========================================================= */
async function loadCalendarFilters() {
  try {
    const staff = await api.staff.getAll();
    const rooms = await api.services.getRooms();


    const staffSelect = document.getElementById('staffFilter');
    const roomSelect = document.getElementById('roomFilter');

    if (staffSelect) {
      staffSelect.innerHTML =
        '<option value="">All Staff</option>' +
        staff.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

      staffSelect.addEventListener('change', () => {
        window.calendarInstance?.refetchEvents();
      });
    }

    if (roomSelect) {
      roomSelect.innerHTML =
        '<option value="">All Room</option>' +
        rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

      roomSelect.addEventListener('change', () => {
        window.calendarInstance?.refetchEvents();
      });
    }

  } catch (err) {
    console.error("Filter load error:", err);
  }
}

/* =========================================================
   INIT CALENDAR
   ========================================================= */
async function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  // Fetch working hours from settings
  let working_hours_start = '08:00';
  let working_hours_end = '22:00';
  try {
    const settings = await api.settings.get();
    if (settings && settings.salon) {
      if (settings.salon.working_hours_start) working_hours_start = settings.salon.working_hours_start;
      if (settings.salon.working_hours_end) working_hours_end = settings.salon.working_hours_end;
    }
  } catch (e) {
    // fallback to defaults
  }

  if (window.calendarInstance) {
    window.calendarInstance.destroy();
    window.calendarInstance = null;
  }

  window.calendarInstance = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridDay',
    selectable: true,
    editable: true,
    nowIndicator: true,
    height: 750,
    contentHeight: 750,
    expandRows: true,
    stickyHeaderDates: true,
    handleWindowResize: false,
    slotMinTime: working_hours_start,
    slotMaxTime: working_hours_end,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: async (info, successCallback) => {
      try {
        const staffId = document.getElementById('staffFilter')?.value || '';
        const roomId = document.getElementById('roomFilter')?.value || '';
        const params = new URLSearchParams({
          start: info.startStr.slice(0, 10),
          end: info.endStr.slice(0, 10)
        });
        if (staffId) params.append('staff_id', staffId);
        if (roomId) params.append('room_id', roomId);
        const events = await api.request(`/calendar/events?${params.toString()}`);
        successCallback(events);
      } catch (err) {
        console.error('Calendar load error:', err);
        successCallback([]);
      }
    },
    eventDrop: async function (info) {
      try {
        await api.request(`/calendar/events/${info.event.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            booking_date: info.event.startStr.slice(0, 10),
            start_time: info.event.startStr.slice(11, 16),
            end_time: info.event.endStr.slice(11, 16)
          })
        });
        utils.showToast("Booking updated", "success");
      } catch (err) {
        info.revert();
        utils.showToast("Update failed", "error");
      }
    },
    eventResize: async function (info) {
      try {
        await api.request(`/calendar/events/${info.event.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            booking_date: info.event.startStr.slice(0, 10),
            start_time: info.event.startStr.slice(11, 16),
            end_time: info.event.endStr.slice(11, 16)
          })
        });
        utils.showToast("Duration updated", "success");
      } catch (err) {
        info.revert();
        utils.showToast("Resize failed", "error");
      }
    },
    eventDidMount: function (info) {
      const status = info.event.extendedProps.status;
      if (status === 'confirmed') {
        info.el.style.backgroundColor = '#dc3545';
      }
      else if (status === 'pending') {
        info.el.style.backgroundColor = '#ffc107';
      }
      else {
        info.el.style.backgroundColor = '#28a745';
      }
    },
    viewDidMount: function (info) {
      const wrapper = document.getElementById('calendarWrapper');
      if (info.view.type === 'dayGridMonth') {
        wrapper.style.overflowY = 'hidden';   // Month no scroll
      } else {
        wrapper.style.overflowY = 'auto';     // Week & Day scroll
      }
    },
    dateClick(info) {
      openBookingFromCalendar(info.date);
    },
    select(info) {
      openBookingFromCalendar(info.start);
    },
    eventClick(info) {
      openEventDetails(info.event);
    }
  });
  window.calendarInstance.render();
}

/* =========================================================
   OPEN BOOKING
   ========================================================= */
function openBookingFromCalendar(date) {

  if (!(date instanceof Date)) return;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  window.calendarBookingPayload = {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };

  import('../bookings/bookings.js')
    .then(module => {
      window.__calendarContext = true;
      module.showBookingForm(null);
    })
    .catch(err => {
      console.error('Failed to load booking module:', err);
    });
}


/* =========================================================
   EVENT DETAILS
   ========================================================= */
function openEventDetails(event) {

  const b = event.extendedProps || {};

  window.appUtils.showModal(
    'Appointment Details',
    `
      <p><strong>Customer:</strong> ${event.title}</p>
      <p><strong>Date:</strong> ${event.start.toLocaleString()}</p>
      <p><strong>Status:</strong> ${b.status || '—'}</p>
      <p><strong>Total:</strong> ₹${b.total_amount || 0}</p>
    `
  );
}

/* =========================================================
   BUTTON EVENTS
   ========================================================= */
function attachEventListeners(container) {

  container.querySelector('#addBookingBtn')
    ?.addEventListener('click', () => {

      window.calendarBookingPayload = null;

      import('../bookings/bookings.js')
        .then(module => {
          window.__calendarContext = true;
          module.showBookingForm(null);
        });

    });

  container.querySelector('#addCustomerBtn')
    ?.addEventListener('click', () => {

      import('../customers/customers.js')
        .then(module => {
          window.__calendarContext = true;
          module.showCustomerForm(null);
        });

    });
}
