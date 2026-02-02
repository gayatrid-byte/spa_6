/**
 * Calendar Module - Main Calendar Engine
 * Integrated with existing single-file frontend
 */

class CalendarModule {
    constructor() {
        this.currentView = 'day';
        this.currentDate = new Date();
        this.calendarData = null;
        this.settings = {};
        this.socket = null;
        this.initialize();
    }

    /**
     * Initialize calendar module
     */
    initialize() {
        this.loadSettings();
        this.setupEventListeners();
        this.initializeSocket();
        this.loadCalendarView();
    }

    /**
     * Load calendar settings from localStorage
     */
    loadSettings() {
        this.settings = JSON.parse(localStorage.getItem('calendar_settings') || '{}');
        
        // Default settings
        this.settings = {
            defaultView: 'day',
            timeSlotDuration: 15,
            startHour: '08:00',
            endHour: '21:00',
            showBreaks: true,
            colorBy: 'status',
            ...this.settings
        };
    }

    /**
     * Setup event listeners for calendar UI
     */
    setupEventListeners() {
        // View switcher
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-calendar-view]')) {
                const view = e.target.dataset.calendarView;
                this.switchView(view);
            }
            
            // Date navigation
            if (e.target.matches('[data-calendar-nav]')) {
                const direction = e.target.dataset.calendarNav;
                this.navigate(direction);
            }
            
            // Quick book button
            if (e.target.matches('#quickBookBtn')) {
                this.openQuickBookModal();
            }
            
            // Today button
            if (e.target.matches('#todayBtn')) {
                this.goToToday();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Left/Right: Navigate days
            if (e.ctrlKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigate('prev');
            }
            if (e.ctrlKey && e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigate('next');
            }
            
            // Ctrl+Shift+Left/Right: Navigate weeks
            if (e.ctrlKey && e.shiftKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigate('prev-week');
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigate('next-week');
            }
            
            // Ctrl+T: Go to today
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.goToToday();
            }
            
            // Ctrl+B: Quick book
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                this.openQuickBookModal();
            }
        });

        // Drag and drop for appointments
        this.setupDragAndDrop();
    }

    /**
     * Initialize WebSocket connection for real-time updates
     */
    initializeSocket() {
        // Check if socket.io is available
        if (typeof io === 'undefined') {
            console.warn('Socket.io not loaded, real-time features disabled');
            return;
        }

        this.socket = io();
        
        // Socket event handlers
        this.socket.on('connect', () => {
            console.log('Calendar WebSocket connected');
            this.socket.emit('calendar.subscribe', {
                salonId: window.currentUser?.salon_id,
                view: this.currentView
            });
        });

        this.socket.on('appointment.created', (data) => {
            this.handleAppointmentCreated(data);
        });

        this.socket.on('appointment.updated', (data) => {
            this.handleAppointmentUpdated(data);
        });

        this.socket.on('appointment.deleted', (data) => {
            this.handleAppointmentDeleted(data);
        });

        this.socket.on('staff.availability.changed', (data) => {
            this.handleStaffAvailabilityChanged(data);
        });

        this.socket.on('resource.status.changed', (data) => {
            this.handleResourceStatusChanged(data);
        });

        this.socket.on('conflict.detected', (data) => {
            this.showConflictWarning(data);
        });

        this.socket.on('waitlist.triggered', (data) => {
            this.showWaitlistNotification(data);
        });

        this.socket.on('disconnect', () => {
            console.log('Calendar WebSocket disconnected');
        });
    }

    /**
     * Load calendar view based on current settings
     */
    async loadCalendarView() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`/api/calendar/views/${this.currentView}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load calendar data');
            }

            const data = await response.json();
            this.calendarData = data.data;
            
            this.renderCalendar();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading calendar:', error);
            this.showError('Failed to load calendar data');
        }
    }

    /**
     * Switch between calendar views
     */
    switchView(view) {
        if (view === this.currentView) return;
        
        this.currentView = view;
        this.loadCalendarView();
        
        // Update UI
        document.querySelectorAll('[data-calendar-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.calendarView === view);
        });
        
        // Update view label
        document.getElementById('currentViewLabel').textContent = this.getViewLabel(view);
    }

    /**
     * Navigate calendar dates
     */
    navigate(direction) {
        switch (direction) {
            case 'prev':
                if (this.currentView === 'day') {
                    this.currentDate.setDate(this.currentDate.getDate() - 1);
                } else if (this.currentView === 'week') {
                    this.currentDate.setDate(this.currentDate.getDate() - 7);
                } else if (this.currentView === 'month') {
                    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                }
                break;
                
            case 'next':
                if (this.currentView === 'day') {
                    this.currentDate.setDate(this.currentDate.getDate() + 1);
                } else if (this.currentView === 'week') {
                    this.currentDate.setDate(this.currentDate.getDate() + 7);
                } else if (this.currentView === 'month') {
                    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                }
                break;
                
            case 'today':
                this.currentDate = new Date();
                break;
                
            case 'prev-week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
                
            case 'next-week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
        }
        
        this.loadCalendarView();
        this.updateDateDisplay();
    }

    /**
     * Go to today's date
     */
    goToToday() {
        this.currentDate = new Date();
        this.loadCalendarView();
        this.updateDateDisplay();
    }

    /**
     * Render calendar based on current view
     */
    renderCalendar() {
        const container = document.getElementById('calendarContainer');
        if (!container) return;

        container.innerHTML = '';
        
        switch (this.currentView) {
            case 'day':
                this.renderDayView(container);
                break;
            case 'week':
                this.renderWeekView(container);
                break;
            case 'month':
                this.renderMonthView(container);
                break;
            case 'staff':
                this.renderStaffView(container);
                break;
            case 'resource':
                this.renderResourceView(container);
                break;
            case 'list':
                this.renderListView(container);
                break;
        }
    }

    /**
     * Render Day View
     */
    renderDayView(container) {
        const dateStr = this.formatDate(this.currentDate);
        const appointments = this.calendarData?.appointments || [];
        const availableSlots = this.calendarData?.availableSlots || [];
        
        // Create timeline
        const timeline = document.createElement('div');
        timeline.className = 'calendar-timeline';
        
        // Time slots from 8 AM to 9 PM
        for (let hour = 8; hour <= 21; hour++) {
            for (let quarter = 0; quarter < 60; quarter += 15) {
                const time = `${hour.toString().padStart(2, '0')}:${quarter.toString().padStart(2, '0')}`;
                const slotTime = new Date(`${dateStr}T${time}:00`);
                
                // Check if slot has appointments
                const slotAppointments = appointments.filter(apt => {
                    const start = new Date(apt.start_time);
                    const end = new Date(apt.end_time);
                    return slotTime >= start && slotTime < end;
                });
                
                // Check if slot is available
                const isAvailable = availableSlots.some(slot => {
                    const slotStart = new Date(slot.start);
                    return slotTime >= slotStart && slotTime < slotStart;
                });
                
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.dataset.time = time;
                
                if (slotAppointments.length > 0) {
                    timeSlot.classList.add('booked');
                    this.renderAppointmentInSlot(timeSlot, slotAppointments[0]);
                } else if (isAvailable) {
                    timeSlot.classList.add('available');
                    timeSlot.innerHTML = `<div class="available-slot" data-time="${time}">
                        <span>Available</span>
                        <button onclick="calendar.bookAvailableSlot('${dateStr}', '${time}')">Book</button>
                    </div>`;
                } else {
                    timeSlot.classList.add('unavailable');
                }
                
                timeline.appendChild(timeSlot);
            }
        }
        
        container.appendChild(timeline);
    }

    /**
     * Render Week View
     */
    renderWeekView(container) {
        const weekStart = this.getWeekStart(this.currentDate);
        const appointments = this.calendarData?.appointments || [];
        
        // Create week grid
        const weekGrid = document.createElement('div');
        weekGrid.className = 'calendar-week-grid';
        
        // Header with days
        const header = document.createElement('div');
        header.className = 'week-header';
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'week-day-header';
            dayHeader.innerHTML = `
                <div class="day-name">${this.getDayName(day.getDay())}</div>
                <div class="day-date">${day.getDate()}</div>
            `;
            header.appendChild(dayHeader);
        }
        weekGrid.appendChild(header);
        
        // Time slots
        const timeSlots = document.createElement('div');
        timeSlots.className = 'week-time-slots';
        
        for (let hour = 8; hour <= 21; hour++) {
            const timeRow = document.createElement('div');
            timeRow.className = 'week-time-row';
            
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(day.getDate() + i);
                day.setHours(hour, 0, 0, 0);
                
                const dayCell = document.createElement('div');
                dayCell.className = 'week-day-cell';
                dayCell.dataset.date = this.formatDate(day);
                
                // Find appointments for this time
                const hourAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.start_time);
                    return aptDate.getDate() === day.getDate() && 
                           aptDate.getMonth() === day.getMonth() &&
                           aptDate.getFullYear() === day.getFullYear() &&
                           aptDate.getHours() === hour;
                });
                
                if (hourAppointments.length > 0) {
                    dayCell.classList.add('has-appointment');
                    this.renderAppointmentPreview(dayCell, hourAppointments);
                }
                
                timeRow.appendChild(dayCell);
            }
            
            timeSlots.appendChild(timeRow);
        }
        
        weekGrid.appendChild(timeSlots);
        container.appendChild(weekGrid);
    }

    /**
     * Render Month View
     */
    renderMonthView(container) {
        const monthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const monthEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const appointments = this.calendarData?.appointments || [];
        
        // Create month grid
        const monthGrid = document.createElement('div');
        monthGrid.className = 'calendar-month-grid';
        
        // Month header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.innerHTML = `
            <h3>${this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <div class="month-stats">
                <span>${appointments.length} appointments</span>
                <span>Revenue: ₹${this.calculateMonthRevenue(appointments)}</span>
            </div>
        `;
        monthGrid.appendChild(monthHeader);
        
        // Weekday headers
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekdayRow = document.createElement('div');
        weekdayRow.className = 'month-weekdays';
        
        weekdays.forEach(day => {
            const dayCell = document.createElement('div');
            dayCell.className = 'month-weekday';
            dayCell.textContent = day;
            weekdayRow.appendChild(dayCell);
        });
        monthGrid.appendChild(weekdayRow);
        
        // Days grid
        const firstDay = monthStart.getDay();
        const daysInMonth = monthEnd.getDate();
        
        const daysGrid = document.createElement('div');
        daysGrid.className = 'month-days';
        
        // Empty cells for days before month start
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'month-day empty';
            daysGrid.appendChild(emptyCell);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dayAppointments = appointments.filter(apt => {
                const aptDate = new Date(apt.start_time);
                return aptDate.getDate() === day && 
                       aptDate.getMonth() === this.currentDate.getMonth();
            });
            
            const dayCell = document.createElement('div');
            dayCell.className = 'month-day';
            dayCell.dataset.date = this.formatDate(dayDate);
            
            if (this.isToday(dayDate)) {
                dayCell.classList.add('today');
            }
            
            dayCell.innerHTML = `
                <div class="day-number">${day}</div>
                ${dayAppointments.length > 0 ? 
                    `<div class="day-appointments">
                        <span class="appointment-count">${dayAppointments.length}</span>
                        <span class="day-revenue">₹${this.calculateDayRevenue(dayAppointments)}</span>
                    </div>` : ''
                }
            `;
            
            if (dayAppointments.length > 0) {
                dayCell.classList.add('has-appointments');
                dayCell.addEventListener('click', () => {
                    this.currentDate = dayDate;
                    this.switchView('day');
                });
            }
            
            daysGrid.appendChild(dayCell);
        }
        
        monthGrid.appendChild(daysGrid);
        container.appendChild(monthGrid);
    }

    /**
     * Render Staff View
     */
    renderStaffView(container) {
        const staff = this.calendarData?.staffAvailability || [];
        const appointments = this.calendarData?.appointments || [];
        
        // Create staff grid
        const staffGrid = document.createElement('div');
        staffGrid.className = 'calendar-staff-grid';
        
        // Staff headers
        const headerRow = document.createElement('div');
        headerRow.className = 'staff-header-row';
        
        // Time column
        const timeHeader = document.createElement('div');
        timeHeader.className = 'staff-time-header';
        timeHeader.textContent = 'Time';
        headerRow.appendChild(timeHeader);
        
        // Staff columns
        staff.forEach(staffMember => {
            const staffHeader = document.createElement('div');
            staffHeader.className = 'staff-column-header';
            staffHeader.innerHTML = `
                <div class="staff-name">${staffMember.staff_name}</div>
                <div class="staff-role">${staffMember.qualification || 'Staff'}</div>
            `;
            headerRow.appendChild(staffHeader);
        });
        
        staffGrid.appendChild(headerRow);
        
        // Time slots
        for (let hour = 8; hour <= 21; hour++) {
            const timeRow = document.createElement('div');
            timeRow.className = 'staff-time-row';
            
            // Time label
            const timeLabel = document.createElement('div');
            timeLabel.className = 'staff-time-label';
            timeLabel.textContent = `${hour}:00`;
            timeRow.appendChild(timeLabel);
            
            // Staff columns
            staff.forEach(staffMember => {
                const staffCell = document.createElement('div');
                staffCell.className = 'staff-time-cell';
                staffCell.dataset.staffId = staffMember.staff_id;
                staffCell.dataset.hour = hour;
                
                // Find appointments for this staff member at this hour
                const hourAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.start_time);
                    return apt.staff_id === staffMember.staff_id &&
                           aptDate.getHours() === hour;
                });
                
                if (hourAppointments.length > 0) {
                    staffCell.classList.add('busy');
                    this.renderStaffAppointment(staffCell, hourAppointments[0]);
                } else {
                    // Check availability
                    const isAvailable = this.isStaffAvailable(staffMember, hour);
                    staffCell.classList.add(isAvailable ? 'available' : 'unavailable');
                    
                    if (isAvailable) {
                        staffCell.innerHTML = `<div class="staff-available">Available</div>`;
                    }
                }
                
                timeRow.appendChild(staffCell);
            });
            
            staffGrid.appendChild(timeRow);
        }
        
        container.appendChild(staffGrid);
    }

    /**
     * Render Resource View
     */
    renderResourceView(container) {
        const resources = this.calendarData?.resources || [];
        const appointments = this.calendarData?.appointments || [];
        
        // Similar to staff view but for resources
        const resourceGrid = document.createElement('div');
        resourceGrid.className = 'calendar-resource-grid';
        
        // Create resource columns
        const timeSlots = document.createElement('div');
        timeSlots.className = 'resource-time-slots';
        
        for (let hour = 8; hour <= 21; hour++) {
            const timeRow = document.createElement('div');
            timeRow.className = 'resource-time-row';
            
            resources.forEach(resource => {
                const resourceCell = document.createElement('div');
                resourceCell.className = 'resource-time-cell';
                resourceCell.dataset.resourceId = resource.id;
                
                // Find appointments for this resource
                const resourceAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.start_time);
                    return apt.resource_id === resource.id &&
                           aptDate.getHours() === hour;
                });
                
                if (resourceAppointments.length > 0) {
                    resourceCell.classList.add('in-use');
                    resourceCell.innerHTML = `
                        <div class="resource-booking">
                            <strong>${resourceAppointments[0].service_names}</strong>
                            <div>${resourceAppointments[0].customer_name}</div>
                        </div>
                    `;
                } else if (resource.status === 'maintenance') {
                    resourceCell.classList.add('maintenance');
                    resourceCell.innerHTML = '<div class="resource-maintenance">Maintenance</div>';
                } else {
                    resourceCell.classList.add('available');
                    resourceCell.innerHTML = '<div class="resource-available">Available</div>';
                }
                
                timeRow.appendChild(resourceCell);
            });
            
            timeSlots.appendChild(timeRow);
        }
        
        resourceGrid.appendChild(timeSlots);
        container.appendChild(resourceGrid);
    }

    /**
     * Render List View (Agenda style)
     */
    renderListView(container) {
        const appointments = this.calendarData?.appointments || [];
        
        const listContainer = document.createElement('div');
        listContainer.className = 'calendar-list-view';
        
        if (appointments.length === 0) {
            listContainer.innerHTML = '<div class="empty-list">No appointments found</div>';
            container.appendChild(listContainer);
            return;
        }
        
        // Group appointments by date
        const groupedByDate = this.groupAppointmentsByDate(appointments);
        
        Object.keys(groupedByDate).forEach(date => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'list-date-group';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'list-date-header';
            dateHeader.innerHTML = `
                <h4>${this.formatDateDisplay(date)}</h4>
                <span class="appointment-count">${groupedByDate[date].length} appointments</span>
            `;
            dateGroup.appendChild(dateHeader);
            
            const appointmentsList = document.createElement('div');
            appointmentsList.className = 'list-appointments';
            
            groupedByDate[date].forEach(appointment => {
                const appointmentItem = this.createAppointmentListItem(appointment);
                appointmentsList.appendChild(appointmentItem);
            });
            
            dateGroup.appendChild(appointmentsList);
            listContainer.appendChild(dateGroup);
        });
        
        container.appendChild(listContainer);
    }

    /**
     * Create appointment list item
     */
    createAppointmentListItem(appointment) {
        const item = document.createElement('div');
        item.className = 'list-appointment-item';
        item.dataset.appointmentId = appointment.id;
        
        const startTime = new Date(appointment.start_time);
        const endTime = new Date(appointment.end_time);
        
        item.innerHTML = `
            <div class="appointment-time">
                <span class="start-time">${this.formatTime(startTime)}</span>
                <span class="end-time">- ${this.formatTime(endTime)}</span>
            </div>
            <div class="appointment-details">
                <div class="customer-name">${appointment.customer_name}</div>
                <div class="service-names">${appointment.service_names}</div>
                <div class="staff-name">${appointment.staff_name || 'Unassigned'}</div>
            </div>
            <div class="appointment-status">
                <span class="status-badge ${appointment.status}">${appointment.status}</span>
            </div>
            <div class="appointment-actions">
                <button class="btn-action" onclick="calendar.viewAppointment(${appointment.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="calendar.editAppointment(${appointment.id})">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
        
        return item;
    }

    /**
     * Open Quick Book Modal
     */
    async openQuickBookModal() {
        // Create modal HTML
        const modalHTML = `
            <div class="modal quick-book-modal" id="quickBookModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Quick Booking</h3>
                        <button class="close-modal" onclick="calendar.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="quick-book-steps">
                            <!-- Steps will be loaded dynamically -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="calendar.prevStep()">Previous</button>
                        <button class="btn btn-primary" onclick="calendar.nextStep()">Next</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Initialize quick booking flow
        await this.initializeQuickBooking();
    }

    /**
     * Initialize Quick Booking Flow
     */
    async initializeQuickBooking() {
        this.quickBookState = {
            currentStep: 1,
            totalSteps: 5,
            data: {}
        };
        
        await this.loadQuickBookStep(1);
    }

    /**
     * Load Quick Booking Step
     */
    async loadQuickBookStep(step) {
        const stepsContainer = document.querySelector('.quick-book-steps');
        if (!stepsContainer) return;
        
        switch (step) {
            case 1:
                await this.loadCustomerStep(stepsContainer);
                break;
            case 2:
                await this.loadServicesStep(stepsContainer);
                break;
            case 3:
                await this.loadDateTimeStep(stepsContainer);
                break;
            case 4:
                await this.loadStaffResourceStep(stepsContainer);
                break;
            case 5:
                await this.loadConfirmationStep(stepsContainer);
                break;
        }
        
        // Update UI
        this.updateQuickBookProgress(step);
    }

    /**
     * Load Customer Selection Step
     */
    async loadCustomerStep(container) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/customers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            const customers = data.data || [];
            
            container.innerHTML = `
                <div class="quick-book-step step-1">
                    <h4>Step 1: Select Customer</h4>
                    <div class="customer-search">
                        <input type="text" id="customerSearch" placeholder="Search by name or phone..." 
                               onkeyup="calendar.searchCustomers(event)">
                        <div class="search-results" id="customerResults"></div>
                    </div>
                    <div class="customer-type-selector">
                        <label>
                            <input type="radio" name="customerType" value="existing" checked>
                            Existing Customer
                        </label>
                        <label>
                            <input type="radio" name="customerType" value="new">
                            New Customer
                        </label>
                        <label>
                            <input type="radio" name="customerType" value="walkin">
                            Walk-in (No details)
                        </label>
                    </div>
                    <div class="selected-customer" id="selectedCustomer"></div>
                </div>
            `;
            
            // Store customers for search
            this.quickBookState.customers = customers;
            
        } catch (error) {
            console.error('Error loading customers:', error);
            container.innerHTML = `<div class="error">Failed to load customers</div>`;
        }
    }

    /**
     * Search customers
     */
    searchCustomers(event) {
        const searchTerm = event.target.value.toLowerCase();
        const resultsContainer = document.getElementById('customerResults');
        
        if (!searchTerm.trim()) {
            resultsContainer.innerHTML = '';
            return;
        }
        
        const filtered = this.quickBookState.customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm)
        ).slice(0, 10);
        
        resultsContainer.innerHTML = filtered.map(customer => `
            <div class="customer-result" onclick="calendar.selectCustomer(${customer.id})">
                <strong>${customer.name}</strong>
                <div>${customer.phone}</div>
                <small>Last visit: ${customer.last_visit || 'Never'}</small>
            </div>
        `).join('');
    }

    /**
     * Select customer
     */
    selectCustomer(customerId) {
        const customer = this.quickBookState.customers.find(c => c.id === customerId);
        if (!customer) return;
        
        this.quickBookState.data.customerId = customerId;
        this.quickBookState.data.customerName = customer.name;
        
        const selectedContainer = document.getElementById('selectedCustomer');
        selectedContainer.innerHTML = `
            <div class="customer-selected">
                <strong>Selected:</strong> ${customer.name} (${customer.phone})
                <div class="customer-info">
                    ${customer.last_visit ? `Last visit: ${customer.last_visit}` : 'New customer'}
                </div>
            </div>
        `;
        
        // Clear search results
        document.getElementById('customerResults').innerHTML = '';
        document.getElementById('customerSearch').value = '';
    }

    /**
     * Load Services Selection Step
     */
    async loadServicesStep(container) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/services', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            const services = data.data || [];
            
            container.innerHTML = `
                <div class="quick-book-step step-2">
                    <h4>Step 2: Select Services</h4>
                    <div class="services-grid">
                        ${services.map(service => `
                            <div class="service-card" onclick="calendar.toggleService(${service.id})" 
                                 data-service-id="${service.id}">
                                <div class="service-name">${service.name}</div>
                                <div class="service-duration">${service.duration} min</div>
                                <div class="service-price">₹${service.price}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="selected-services" id="selectedServices">
                        <h5>Selected Services:</h5>
                        <div class="services-list"></div>
                        <div class="services-summary">
                            Total Duration: <span id="totalDuration">0</span> min
                            Total Price: ₹<span id="totalPrice">0</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Store services
            this.quickBookState.services = services;
            this.quickBookState.data.selectedServices = [];
            
        } catch (error) {
            console.error('Error loading services:', error);
            container.innerHTML = `<div class="error">Failed to load services</div>`;
        }
    }

    /**
     * Toggle service selection
     */
    toggleService(serviceId) {
        const service = this.quickBookState.services.find(s => s.id === serviceId);
        if (!service) return;
        
        const selectedIndex = this.quickBookState.data.selectedServices.findIndex(s => s.id === serviceId);
        
        if (selectedIndex === -1) {
            // Add service
            this.quickBookState.data.selectedServices.push(service);
        } else {
            // Remove service
            this.quickBookState.data.selectedServices.splice(selectedIndex, 1);
        }
        
        // Update UI
        this.updateSelectedServices();
        
        // Update card appearance
        const serviceCard = document.querySelector(`[data-service-id="${serviceId}"]`);
        if (serviceCard) {
            serviceCard.classList.toggle('selected', selectedIndex === -1);
        }
    }

    /**
     * Update selected services display
     */
    updateSelectedServices() {
        const servicesList = document.querySelector('.services-list');
        const totalDuration = document.getElementById('totalDuration');
        const totalPrice = document.getElementById('totalPrice');
        
        if (!servicesList) return;
        
        servicesList.innerHTML = this.quickBookState.data.selectedServices.map(service => `
            <div class="selected-service-item">
                <span>${service.name}</span>
                <span>${service.duration} min</span>
                <span>₹${service.price}</span>
            </div>
        `).join('');
        
        const total = this.quickBookState.data.selectedServices.reduce((sum, service) => {
            return {
                duration: sum.duration + service.duration,
                price: sum.price + parseFloat(service.price)
            };
        }, { duration: 0, price: 0 });
        
        totalDuration.textContent = total.duration;
        totalPrice.textContent = total.price.toFixed(2);
    }

    /**
     * Load Date & Time Step
     */
    async loadDateTimeStep(container) {
        const totalDuration = this.quickBookState.data.selectedServices.reduce((sum, service) => 
            sum + service.duration, 0
        );
        
        container.innerHTML = `
            <div class="quick-book-step step-3">
                <h4>Step 3: Select Date & Time</h4>
                <div class="date-selection">
                    <input type="date" id="bookingDate" value="${this.formatDate(new Date())}" 
                           onchange="calendar.loadAvailableSlots()">
                </div>
                <div class="duration-display">
                    Required Duration: <strong>${totalDuration} minutes</strong>
                </div>
                <div class="available-slots" id="availableSlots">
                    Loading available slots...
                </div>
                <div class="selected-slot" id="selectedSlot"></div>
            </div>
        `;
        
        await this.loadAvailableSlots();
    }

    /**
     * Load available time slots
     */
    async loadAvailableSlots() {
        const dateInput = document.getElementById('bookingDate');
        const selectedDate = dateInput.value;
        const totalDuration = this.quickBookState.data.selectedServices.reduce((sum, service) => 
            sum + service.duration, 0
        );
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/calendar/availability?date=${selectedDate}&duration=${totalDuration}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            const slotsContainer = document.getElementById('availableSlots');
            
            if (data.success && data.data.availableSlots.length > 0) {
                slotsContainer.innerHTML = `
                    <h5>Available Time Slots:</h5>
                    <div class="slots-grid">
                        ${data.data.availableSlots.map(slot => `
                            <div class="time-slot-option ${slot.isPeak ? 'peak' : ''} ${slot.recommended ? 'recommended' : ''}" 
                                 onclick="calendar.selectTimeSlot('${slot.start}', '${slot.end}')">
                                <div class="slot-time">${this.formatTime(new Date(slot.start))}</div>
                                <div class="slot-type">${slot.isPeak ? 'Peak' : 'Normal'}</div>
                                ${slot.recommended ? '<div class="slot-recommended">Recommended</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                slotsContainer.innerHTML = '<div class="no-slots">No available slots for this date</div>';
            }
            
        } catch (error) {
            console.error('Error loading slots:', error);
            document.getElementById('availableSlots').innerHTML = '<div class="error">Failed to load available slots</div>';
        }
    }

    /**
     * Select time slot
     */
    selectTimeSlot(startTime, endTime) {
        this.quickBookState.data.startTime = startTime;
        this.quickBookState.data.endTime = endTime;
        
        const selectedContainer = document.getElementById('selectedSlot');
        selectedContainer.innerHTML = `
            <div class="slot-selected">
                <strong>Selected:</strong> ${this.formatTime(new Date(startTime))} - ${this.formatTime(new Date(endTime))}
            </div>
        `;
    }

    /**
     * Load Staff & Resource Assignment Step
     */
    async loadStaffResourceStep(container) {
        if (!this.quickBookState.data.startTime) {
            container.innerHTML = '<div class="error">Please select a time slot first</div>';
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            
            // Get available staff
            const staffResponse = await fetch('/api/staff/available', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Get available resources
            const resourcesResponse = await fetch('/api/calendar/resources?type=available', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const staffData = await staffResponse.json();
            const resourcesData = await resourcesResponse.json();
            
            container.innerHTML = `
                <div class="quick-book-step step-4">
                    <h4>Step 4: Assign Staff & Resources</h4>
                    
                    <div class="staff-selection">
                        <h5>Select Staff:</h5>
                        <div class="staff-options">
                            ${staffData.data.map(staff => `
                                <div class="staff-option" onclick="calendar.selectStaff(${staff.id})">
                                    <div class="staff-name">${staff.name}</div>
                                    <div class="staff-role">${staff.role}</div>
                                    <div class="staff-availability">Available</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="selected-staff" id="selectedStaff"></div>
                    </div>
                    
                    <div class="resource-selection">
                        <h5>Select Resource (if required):</h5>
                        <div class="resource-options">
                            ${resourcesData.data.map(resource => `
                                <div class="resource-option" onclick="calendar.selectResource(${resource.id})">
                                    <div class="resource-name">${resource.name}</div>
                                    <div class="resource-type">${resource.type}</div>
                                    <div class="resource-status">${resource.status}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="selected-resource" id="selectedResource"></div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading staff/resources:', error);
            container.innerHTML = '<div class="error">Failed to load assignment options</div>';
        }
    }

    /**
     * Load Confirmation Step
     */
    async loadConfirmationStep(container) {
        const customerName = this.quickBookState.data.customerName || 'Walk-in Customer';
        const services = this.quickBookState.data.selectedServices || [];
        const startTime = this.quickBookState.data.startTime;
        const endTime = this.quickBookState.data.endTime;
        
        const totalPrice = services.reduce((sum, service) => sum + parseFloat(service.price), 0);
        
        container.innerHTML = `
            <div class="quick-book-step step-5">
                <h4>Step 5: Confirm Booking</h4>
                
                <div class="confirmation-summary">
                    <h5>Booking Summary:</h5>
                    
                    <div class="summary-item">
                        <strong>Customer:</strong> ${customerName}
                    </div>
                    
                    <div class="summary-item">
                        <strong>Services:</strong>
                        <ul class="services-list">
                            ${services.map(service => `
                                <li>${service.name} (${service.duration} min) - ₹${service.price}</li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="summary-item">
                        <strong>Date & Time:</strong> 
                        ${startTime ? `${this.formatDate(new Date(startTime))} ${this.formatTime(new Date(startTime))} - ${this.formatTime(new Date(endTime))}` : 'Not selected'}
                    </div>
                    
                    <div class="summary-item">
                        <strong>Total Duration:</strong> ${services.reduce((sum, s) => sum + s.duration, 0)} minutes
                    </div>
                    
                    <div class="summary-item">
                        <strong>Total Price:</strong> ₹${totalPrice.toFixed(2)}
                    </div>
                    
                    <div class="notes-section">
                        <label for="bookingNotes">Notes:</label>
                        <textarea id="bookingNotes" rows="3" placeholder="Add any notes..."></textarea>
                    </div>
                    
                    <div class="notifications-section">
                        <label>
                            <input type="checkbox" id="sendNotifications" checked>
                            Send SMS/Email notifications to customer
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Previous step in quick booking
     */
    prevStep() {
        if (this.quickBookState.currentStep > 1) {
            this.quickBookState.currentStep--;
            this.loadQuickBookStep(this.quickBookState.currentStep);
        }
    }

    /**
     * Next step in quick booking
     */
    nextStep() {
        if (this.quickBookState.currentStep < this.quickBookState.totalSteps) {
            // Validate current step
            if (!this.validateCurrentStep()) {
                return;
            }
            
            this.quickBookState.currentStep++;
            this.loadQuickBookStep(this.quickBookState.currentStep);
        } else {
            // Final step - confirm booking
            this.confirmBooking();
        }
    }

    /**
     * Validate current step
     */
    validateCurrentStep() {
        switch (this.quickBookState.currentStep) {
            case 1: // Customer
                if (!this.quickBookState.data.customerId && 
                    document.querySelector('input[name="customerType"]:checked').value !== 'walkin') {
                    this.showError('Please select a customer');
                    return false;
                }
                break;
                
            case 2: // Services
                if (!this.quickBookState.data.selectedServices?.length) {
                    this.showError('Please select at least one service');
                    return false;
                }
                break;
                
            case 3: // Date & Time
                if (!this.quickBookState.data.startTime) {
                    this.showError('Please select a time slot');
                    return false;
                }
                break;
                
            case 4: // Staff & Resource
                // Staff is optional, but check if services require specific resources
                break;
        }
        
        return true;
    }

    /**
     * Confirm and create booking
     */
    async confirmBooking() {
        try {
            const bookingData = {
                customerId: this.quickBookState.data.customerId,
                serviceIds: this.quickBookState.data.selectedServices.map(s => s.id),
                startTime: this.quickBookState.data.startTime,
                endTime: this.quickBookState.data.endTime,
                staffId: this.quickBookState.data.staffId,
                resourceId: this.quickBookState.data.resourceId,
                notes: document.getElementById('bookingNotes')?.value || '',
                sendNotifications: document.getElementById('sendNotifications')?.checked || false
            };
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/calendar/quick-book', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Booking created successfully!');
                this.closeModal();
                this.loadCalendarView(); // Refresh calendar
            } else {
                this.showError(data.error || 'Failed to create booking');
            }
            
        } catch (error) {
            console.error('Error creating booking:', error);
            this.showError('Failed to create booking');
        }
    }

    /**
     * Update quick booking progress
     */
    updateQuickBookProgress(step) {
        const steps = document.querySelectorAll('.quick-book-step');
        steps.forEach((s, index) => {
            s.style.display = index + 1 === step ? 'block' : 'none';
        });
        
        // Update footer buttons
        const prevBtn = document.querySelector('.modal-footer .btn-secondary');
        const nextBtn = document.querySelector('.modal-footer .btn-primary');
        
        if (step === 1) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-block';
            prevBtn.textContent = 'Previous';
        }
        
        if (step === this.quickBookState.totalSteps) {
            nextBtn.textContent = 'Confirm Booking';
            nextBtn.classList.add('btn-success');
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.classList.remove('btn-success');
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('quickBookModal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Calculate month revenue
     */
    calculateMonthRevenue(appointments) {
        // This is a simplified calculation
        // In real app, you would sum invoice amounts
        return appointments.length * 1000; // Example
    }

    /**
     * Calculate day revenue
     */
    calculateDayRevenue(appointments) {
        return appointments.length * 1000; // Example
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Format time for display
     */
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    /**
     * Format date for display
     */
    formatDateDisplay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    /**
     * Get day name
     */
    getDayName(dayIndex) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayIndex];
    }

    /**
     * Get week start date
     */
    getWeekStart(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    /**
     * Check if date is today
     */
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    /**
     * Get view label
     */
    getViewLabel(view) {
        const labels = {
            day: 'Day View',
            week: 'Week View',
            month: 'Month View',
            staff: 'Staff View',
            resource: 'Resource View',
            list: 'List View'
        };
        return labels[view] || view;
    }

    /**
     * Update date display
     */
    updateDateDisplay() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = this.currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    /**
     * Update stats display
     */
    updateStats() {
        const stats = this.calendarData?.metrics;
        if (!stats) return;
        
        const statsElement = document.getElementById('calendarStats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Today's Bookings:</span>
                    <span class="stat-value">${stats.total}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Revenue:</span>
                    <span class="stat-value">₹${stats.revenue}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">In Progress:</span>
                    <span class="stat-value">${stats.inProgress}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Utilization:</span>
                    <span class="stat-value">${stats.utilization}%</span>
                </div>
            `;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(`Error: ${message}`);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        alert(`Success: ${message}`);
    }

    /**
     * Setup drag and drop for appointments
     */
    setupDragAndDrop() {
        // This would be implemented with a drag-and-drop library
        // For simplicity, we're just outlining the structure
    }

    /**
     * Handle real-time events
     */
    handleAppointmentCreated(data) {
        // Update calendar in real-time
        this.loadCalendarView();
        
        // Show notification
        this.showNotification(`New appointment: ${data.customer_name} at ${this.formatTime(new Date(data.start_time))}`);
    }

    handleAppointmentUpdated(data) {
        this.loadCalendarView();
        this.showNotification(`Appointment updated: ${data.customer_name}`);
    }

    handleAppointmentDeleted(data) {
        this.loadCalendarView();
        this.showNotification(`Appointment cancelled: ${data.customer_name}`);
    }

    handleStaffAvailabilityChanged(data) {
        this.loadCalendarView();
        this.showNotification(`Staff availability changed: ${data.staff_name}`);
    }

    handleResourceStatusChanged(data) {
        this.loadCalendarView();
        this.showNotification(`Resource status changed: ${data.resource_name} is now ${data.status}`);
    }

    showConflictWarning(data) {
        const warning = `
            <div class="conflict-warning">
                <strong>Conflict Detected!</strong>
                <p>${data.message}</p>
                <button onclick="calendar.resolveConflict(${JSON.stringify(data)})">Resolve</button>
            </div>
        `;
        // Add to notification area
    }

    showWaitlistNotification(data) {
        const notification = `
            <div class="waitlist-notification">
                <strong>Waitlist Opportunity!</strong>
                <p>${data.customer_name} is waiting for ${data.service_name}</p>
                <button onclick="calendar.fillFromWaitlist(${data.waitlist_id})">Book Now</button>
            </div>
        `;
        // Add to notification area
    }

    /**
     * Show notification
     */
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'calendar-notification';
        notification.textContent = message;
        
        // Add to notification container
        const container = document.getElementById('notificationContainer') || 
                          this.createNotificationContainer();
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Create notification container
     */
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }
}

// Render entry for dynamic module loader
export async function render(container) {
    // Build calendar page skeleton
    container.innerHTML = `
        <div class="calendar-page">
            <div class="calendar-header">
                <div class="left-actions">
                    <button class="btn btn-outline" data-calendar-nav="prev">◄</button>
                    <span id="currentViewLabel">Day View</span>
                    <button class="btn btn-outline" data-calendar-nav="next">►</button>
                    <button class="btn btn-outline" id="todayBtn">Today</button>
                </div>
                <div class="right-actions">
                    <button class="btn btn-primary" id="quickBookBtn">Quick Book</button>
                    <div class="view-switch">
                        <button class="btn btn-outline active" data-calendar-view="day">Day</button>
                        <button class="btn btn-outline" data-calendar-view="week">Week</button>
                        <button class="btn btn-outline" data-calendar-view="month">Month</button>
                        <button class="btn btn-outline" data-calendar-view="list">List</button>
                    </div>
                </div>
            </div>
            <div id="calendarStats" class="calendar-stats"></div>
            <div id="calendarContainer" class="calendar-container"></div>
        </div>
    `;

    // Initialize calendar module instance
    if (!window.calendar) {
        window.calendar = new CalendarModule();
    } else {
        // If already exists, force a view reload
        window.calendar.renderCalendar();
        window.calendar.updateStats();
    }
}

// Initialize calendar when DOM is loaded (guarded)
document.addEventListener('DOMContentLoaded', function() {
    // Only auto-init if a calendar container exists on page
    if (window.currentUser && document.getElementById('calendarContainer')) {
        if (!window.calendar) {
            window.calendar = new CalendarModule();
        }
    }
});

// Export for global access
window.CalendarModule = CalendarModule;