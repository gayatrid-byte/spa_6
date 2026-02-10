
/**
 * CALENDAR MODULE - Appointment Management System
 * Version: 1.0.0
 * Standards Compliance: Level 3 (Defined) / Level 4 (Managed)
 * 
 * CODING STANDARDS FOLLOWED:
 * 1. Modular architecture with single responsibility
 * 2. Comprehensive error handling
 * 3. Async/await pattern for asynchronous operations
 * 4. Event-driven architecture
 * 5. Responsive design patterns
 * 6. Security headers implementation
 * 7. Performance optimization for large datasets
 * 8. FullCalendar integration standards
 * 
 * @author System Generated
 * @created 2024
 * @license Proprietary
 */

// ============================================================================
// MODULE: CalendarModule
// PURPOSE: Appointment scheduling and calendar management
// STANDARD: Level 3 (Defined) with Level 4 (Managed) practices
// ============================================================================

/**
 * Calendar configuration constants
 * @constant
 * @type {Object}
 */
const CALENDAR_CONFIG = {
    DEFAULT_VIEW: 'timeGridWeek',
    SLOT_DURATION: '00:30:00',
    MIN_TIME: '08:00:00',
    MAX_TIME: '21:00:00',
    SCROLL_TIME: '09:00:00',
    BUSINESS_DAYS: [1, 2, 3, 4, 5, 6],
    MOBILE_BREAKPOINT: 768,
    DEBOUNCE_TIMEOUT: 300,
    EVENT_STATUSES: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        IN_SERVICE: 'in_service',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        NO_SHOW: 'no_show'
    }
};

/**
 * DOM Element selectors for maintainability
 * @constant
 * @type {Object}
 */
const SELECTORS = {
    CONTENT_AREA: '#contentArea',
    CALENDAR: '#calendar',
    CURRENT_PERIOD: '#currentPeriod',
    SEARCH_INPUT: '#calendarSearch',
    BTN_NEW_BOOKING: '#btnNewBooking',
    BTN_ADD_CUSTOMER: '#btnAddCustomer',
    FILTER_STAFF: '#filterStaff',
    FILTER_ROOM: '#filterRoom',
    FILTER_STATUS: '#filterStatus',
    STAT_TOTAL: '#statTotal',
    STAT_CONFIRMED: '#statConfirmed',
    STAT_PENDING: '#statPending',
    STAT_COMPLETED: '#statCompleted',
    VIEW_BUTTONS: '.view-btn',
    BTN_PREV: '#btnPrev',
    BTN_TODAY: '#btnToday',
    BTN_NEXT: '#btnNext'
};

/**
 * Error messages for consistent error handling
 * @constant
 * @type {Object}
 */
const ERROR_MESSAGES = {
    INITIALIZATION_FAILED: 'Failed to initialize calendar module:',
    FULLCALENDAR_NOT_FOUND: 'FullCalendar library not loaded. Please include FullCalendar scripts.',
    DOM_ELEMENT_NOT_FOUND: 'Required DOM element not found:',
    API_REQUEST_FAILED: 'API request failed:',
    EVENT_UPDATE_FAILED: 'Failed to update appointment:',
    RESOURCES_LOAD_FAILED: 'Failed to load calendar resources:',
    STATS_LOAD_FAILED: 'Failed to load statistics:'
};

class CalendarModule {
    /**
     * Initialize Calendar Module with configuration options
     * @constructor
     * @param {Object} options - Configuration options
     * @param {string} options.apiUrl - API endpoint URL
     * @param {string} options.defaultView - Default calendar view
     * @param {string} options.slotDuration - Time slot duration
     * @param {Object} options.businessHours - Business hours configuration
     */
    constructor(options = {}) {
        this.validateOptions(options);
        
        this.options = {
            apiUrl: options.apiUrl || '/api/calendar',
            defaultView: options.defaultView || CALENDAR_CONFIG.DEFAULT_VIEW,
            slotDuration: options.slotDuration || CALENDAR_CONFIG.SLOT_DURATION,
            businessHours: options.businessHours || {
                start: '09:00',
                end: '19:00',
                daysOfWeek: CALENDAR_CONFIG.BUSINESS_DAYS
            },
            ...options
        };
        
        this.calendar = null;
        this.resources = {
            staff: [],
            rooms: [],
            services: [],
            customers: []
        };
        
        this.filters = {
            staff_id: null,
            room_id: null,
            status: null,
            event_type: null,
            search: ''
        };
        
        this.isMobile = window.innerWidth < CALENDAR_CONFIG.MOBILE_BREAKPOINT;
        this.currentView = this.options.defaultView;
        
        this.eventListeners = new Map();
        this.timeoutIds = new Set();
    }

    /**
     * Validate constructor options
     * @private
     * @param {Object} options - Options to validate
     * @throws {Error} If options are invalid
     */
    validateOptions(options) {
        if (options.slotDuration && !/^\d{2}:\d{2}:\d{2}$/.test(options.slotDuration)) {
            throw new Error('Invalid slotDuration format. Use HH:mm:ss');
        }
    }

    /**
     * Get authentication headers for API requests
     * @private
     * @returns {Object} HTTP headers with authentication
     */
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    /**
     * Initialize the calendar module
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        try {
            this.validateEnvironment();
            
            this.addCalendarStyles();
            this.renderCalendar();
            await this.loadResources();
            this.populateFilterSelects();
            this.initializeFullCalendar();
            this.attachEventListeners();
            this.loadTodayStats();
            await this.refreshEvents();
            
            this.setupResponsiveBehavior();
            
            console.info('Calendar module initialized successfully');
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    /**
     * Validate required environment dependencies
     * @private
     * @throws {Error} If dependencies are missing
     */
    validateEnvironment() {
        const contentArea = document.querySelector(SELECTORS.CONTENT_AREA);
        if (!contentArea) {
            throw new Error(`${ERROR_MESSAGES.DOM_ELEMENT_NOT_FOUND} contentArea`);
        }
        
        if (typeof FullCalendar === 'undefined') {
            throw new Error(ERROR_MESSAGES.FULLCALENDAR_NOT_FOUND);
        }
    }

    /**
     * Render calendar HTML structure
     * @private
     */
    renderCalendar() {
        const contentArea = document.querySelector(SELECTORS.CONTENT_AREA);
        
        contentArea.innerHTML = `
            <div class="calendar-page">
                <div class="calendar-top">
                    <div class="calendar-title">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Appointment Calendar</span>
                        <small id="currentPeriod"></small>
                    </div>
                    
                    <div class="calendar-actions">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="calendarSearch" placeholder="Search appointments...">
                        </div>
                        <button class="btn-primary" id="btnNewBooking">
                            <i class="fas fa-plus"></i> New Booking
                        </button>
                        <button class="btn-secondary" id="btnAddCustomer">
                            <i class="fas fa-user-plus"></i> Add Customer
                        </button>
                    </div>
                </div>
                
                <div class="calendar-controls">
                    <div class="left-controls">
                        <div class="view-buttons">
                            <button class="view-btn ${this.options.defaultView === 'timeGridDay' ? 'active' : ''}" data-view="timeGridDay">Day</button>
                            <button class="view-btn ${this.options.defaultView === 'timeGridWeek' ? 'active' : ''}" data-view="timeGridWeek">Week</button>
                            <button class="view-btn ${this.options.defaultView === 'dayGridMonth' ? 'active' : ''}" data-view="dayGridMonth">Month</button>
                        </div>
                        
                        <div class="nav-buttons">
                            <button class="nav-btn" id="btnPrev"><i class="fas fa-chevron-left"></i></button>
                            <button class="nav-btn" id="btnToday">Today</button>
                            <button class="nav-btn" id="btnNext"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                    
                    <div class="right-controls">
                        <select class="filter-select" id="filterStaff"><option value="">All Staff</option></select>
                        <select class="filter-select" id="filterRoom"><option value="">All Rooms</option></select>
                        <select class="filter-select" id="filterStatus"><option value="">All Status</option></select>
                    </div>
                </div>
                
                <div class="calendar-stats">
                    <div class="stat"><div class="stat-number" id="statTotal">0</div><span>Total Today</span></div>
                    <div class="stat"><div class="stat-number" id="statConfirmed">0</div><span>Confirmed</span></div>
                    <div class="stat"><div class="stat-number" id="statPending">0</div><span>Pending</span></div>
                    <div class="stat"><div class="stat-number" id="statCompleted">0</div><span>Completed</span></div>
                </div>
                
                <div class="calendar-body"><div id="calendar"></div></div>
            </div>
        `;
    }

    /**
     * Initialize FullCalendar instance
     * @private
     */
    initializeFullCalendar() {
        const calendarEl = document.querySelector(SELECTORS.CALENDAR);
        if (!calendarEl) {
            throw new Error(`${ERROR_MESSAGES.DOM_ELEMENT_NOT_FOUND} calendar`);
        }

        try {
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: this.currentView,
                headerToolbar: false,
                allDaySlot: false,
                slotDuration: this.options.slotDuration,
                slotMinTime: CALENDAR_CONFIG.MIN_TIME,
                slotMaxTime: CALENDAR_CONFIG.MAX_TIME,
                slotLabelInterval: '01:00',
                businessHours: this.options.businessHours,
                selectable: true,
                editable: true,
                eventResizableFromStart: true,
                dragScroll: true,
                dayMaxEvents: true,
                navLinks: true,
                nowIndicator: true,
                expandRows: true,
                height: '100%',
                scrollTime: CALENDAR_CONFIG.SCROLL_TIME,
                scrollTimeReset: false,
                
                eventDisplay: 'block',
                displayEventTime: true,
                displayEventEnd: true,
                eventTimeFormat: {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                },
                
                datesSet: (info) => this.onDatesSet(info),
                select: (info) => this.handleCalendarClick(info),
                eventClick: (info) => this.handleEventClick(info),
                eventDrop: (info) => this.handleEventMove(info),
                eventResize: (info) => this.handleEventResize(info),
                
                windowResize: () => this.calendar.updateSize(),
                eventClassNames: (info) => this.getEventClassNames(info),
                eventContent: (info) => this.formatEventContent(info),
                dayCellDidMount: (info) => {
                    if (info.isToday) info.el.classList.add('fc-day-today');
                    info.el.addEventListener('click', (e) => {
                        if (e.button === 0) this.handleDateCellClick(info);
                    });
                }
            });
            
            this.calendar.render();
            this.updateCurrentPeriod();
            console.info('FullCalendar initialized successfully');
        } catch (error) {
            console.error('Error initializing FullCalendar:', error);
            throw error;
        }
    }

    /**
     * Load calendar resources from API
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async loadResources() {
        try {
            const response = await fetch(`${this.options.apiUrl}/resources`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success && result.data) {
                this.resources = result.data;
            } else {
                this.resources = { staff: [], rooms: [], services: [], customers: [] };
            }
        } catch (error) {
            console.error(`${ERROR_MESSAGES.RESOURCES_LOAD_FAILED}`, error);
            this.resources = { staff: [], rooms: [], services: [], customers: [] };
        }
    }

    /**
     * Populate filter dropdowns with options
     * @private
     */
    populateFilterSelects() {
        this.populateStaffFilter();
        this.populateRoomFilter();
        this.populateStatusFilter();
    }

    /**
     * Populate staff filter dropdown
     * @private
     */
    populateStaffFilter() {
        const staffSelect = document.querySelector(SELECTORS.FILTER_STAFF);
        if (!staffSelect || !this.resources.staff) return;

        this.resources.staff.forEach(staff => {
            const option = document.createElement('option');
            option.value = staff.id;
            option.textContent = staff.name;
            staffSelect.appendChild(option);
        });
    }

    /**
     * Populate room filter dropdown
     * @private
     */
    populateRoomFilter() {
        const roomSelect = document.querySelector(SELECTORS.FILTER_ROOM);
        if (!roomSelect || !this.resources.rooms) return;

        this.resources.rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.name;
            roomSelect.appendChild(option);
        });
    }

    /**
     * Populate status filter dropdown
     * @private
     */
    populateStatusFilter() {
        const statusSelect = document.querySelector(SELECTORS.FILTER_STATUS);
        if (!statusSelect) return;

        const statuses = [
            { value: CALENDAR_CONFIG.EVENT_STATUSES.PENDING, label: 'Pending' },
            { value: CALENDAR_CONFIG.EVENT_STATUSES.CONFIRMED, label: 'Confirmed' },
            { value: CALENDAR_CONFIG.EVENT_STATUSES.IN_SERVICE, label: 'In Service' },
            { value: CALENDAR_CONFIG.EVENT_STATUSES.COMPLETED, label: 'Completed' },
            { value: CALENDAR_CONFIG.EVENT_STATUSES.CANCELLED, label: 'Cancelled' },
            { value: CALENDAR_CONFIG.EVENT_STATUSES.NO_SHOW, label: 'No Show' }
        ];
        
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.value;
            option.textContent = status.label;
            statusSelect.appendChild(option);
        });
    }

    /**
     * Attach event listeners to UI elements
     * @private
     */
    attachEventListeners() {
        this.attachFilterListeners();
        this.attachSearchListener();
        this.attachButtonListeners();
        this.attachViewButtonListeners();
        this.attachNavigationListeners();
    }

    /**
     * Attach filter change listeners
     * @private
     */
    attachFilterListeners() {
        document.querySelector(SELECTORS.FILTER_STAFF)?.addEventListener('change', (e) => {
            this.filters.staff_id = e.target.value || null;
            this.refreshEvents();
        });
        
        document.querySelector(SELECTORS.FILTER_ROOM)?.addEventListener('change', (e) => {
            this.filters.room_id = e.target.value || null;
            this.refreshEvents();
        });
        
        document.querySelector(SELECTORS.FILTER_STATUS)?.addEventListener('change', (e) => {
            this.filters.status = e.target.value || null;
            this.refreshEvents();
        });
    }

    /**
     * Attach search input listener with debouncing
     * @private
     */
    attachSearchListener() {
        const searchInput = document.querySelector(SELECTORS.SEARCH_INPUT);
        if (!searchInput) return;

        let searchTimeout;
        
        const searchHandler = (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.refreshEvents();
            }, CALENDAR_CONFIG.DEBOUNCE_TIMEOUT);
        };

        searchInput.addEventListener('input', searchHandler);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchHandler(e);
            }
        });

        this.eventListeners.set('search', searchHandler);
    }

    /**
     * Attach button click listeners
     * @private
     */
    attachButtonListeners() {
        document.querySelector(SELECTORS.BTN_NEW_BOOKING)?.addEventListener('click', () => {
            this.openNewBookingForm();
        });

        document.querySelector(SELECTORS.BTN_ADD_CUSTOMER)?.addEventListener('click', () => {
            this.openAddCustomerForm();
        });
    }

    /**
     * Attach view button listeners
     * @private
     */
    attachViewButtonListeners() {
        document.querySelectorAll(SELECTORS.VIEW_BUTTONS).forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view) {
                    this.currentView = view;
                    this.calendar.changeView(view);
                    this.updateViewButtons();
                    this.updateCurrentPeriod();
                    setTimeout(() => this.calendar.updateSize(), 100);
                }
            });
        });
    }

    /**
     * Attach navigation button listeners
     * @private
     */
    attachNavigationListeners() {
        document.querySelector(SELECTORS.BTN_PREV)?.addEventListener('click', () => {
            this.calendar.prev();
            this.updateCurrentPeriod();
        });
        
        document.querySelector(SELECTORS.BTN_TODAY)?.addEventListener('click', () => {
            this.calendar.today();
            this.updateCurrentPeriod();
        });
        
        document.querySelector(SELECTORS.BTN_NEXT)?.addEventListener('click', () => {
            this.calendar.next();
            this.updateCurrentPeriod();
        });
    }

    /**
     * Update view button active states
     * @private
     */
    updateViewButtons() {
        document.querySelectorAll(SELECTORS.VIEW_BUTTONS).forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
    }

    /**
     * Load events from API for given date range
     * @private
     * @async
     * @param {Date} start - Start date
     * @param {Date} end - End date
     * @returns {Promise<Array>} Array of calendar events
     */
    async loadEvents(start, end) {
        try {
            const params = new URLSearchParams({
                start: this.formatDate(start),
                end: this.formatDate(end),
                ...Object.fromEntries(
                    Object.entries(this.filters).filter(([k, v]) => v !== null && v !== '')
                )
            });
            
            const response = await fetch(`${this.options.apiUrl}/events?${params}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                return result.data;
            }
            
            return [];
        } catch (error) {
            console.error('Error loading events:', error);
            return [];
        }
    }

    /**
     * Format date to YYYY-MM-DD
     * @private
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Refresh calendar events
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async refreshEvents() {
        try {
            const events = await this.loadEvents(
                this.calendar.view.currentStart,
                this.calendar.view.currentEnd
            );
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(events);
        } catch (error) {
            console.error('Error refreshing events:', error);
        }
    }

    /**
     * Load today's statistics
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async loadTodayStats() {
        try {
            const response = await fetch(`${this.options.apiUrl}/stats/today`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success && result.data) {
                this.updateStatsDisplay(result.data);
            }
        } catch (error) {
            console.error(`${ERROR_MESSAGES.STATS_LOAD_FAILED}`, error);
        }
    }

    /**
     * Update statistics display
     * @private
     * @param {Object} stats - Statistics data
     */
    updateStatsDisplay(stats) {
        const elements = {
            [SELECTORS.STAT_TOTAL]: stats.total_events || 0,
            [SELECTORS.STAT_CONFIRMED]: stats.confirmed_events || 0,
            [SELECTORS.STAT_PENDING]: stats.pending_events || 0,
            [SELECTORS.STAT_COMPLETED]: stats.completed_events || 0
        };
        
        Object.entries(elements).forEach(([selector, value]) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
            }
        });
    }

    /**
     * Update current period display
     * @private
     */
    updateCurrentPeriod() {
        const periodEl = document.querySelector(SELECTORS.CURRENT_PERIOD);
        if (!periodEl || !this.calendar) return;
        
        const view = this.calendar.view;
        let periodText = '';
        
        switch (view.type) {
            case 'timeGridDay':
                periodText = view.currentStart.toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });
                break;
            case 'timeGridWeek':
                const start = view.currentStart;
                const end = new Date(view.currentEnd);
                end.setDate(end.getDate() - 1);
                periodText = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                break;
            case 'dayGridMonth':
                periodText = view.currentStart.toLocaleDateString('en-US', {
                    month: 'long', year: 'numeric'
                });
                break;
        }
        
        periodEl.textContent = periodText;
    }

    /**
     * Handle calendar date range change
     * @private
     * @param {Object} info - Date set information
     */
    onDatesSet(info) {
        this.refreshEvents();
        this.updateCurrentPeriod();
    }

    /**
     * Handle calendar time slot click
     * @private
     * @param {Object} info - Click information
     */
    handleCalendarClick(info) {
        const bookingDate = info.startStr.split('T')[0];
        const bookingTime = info.startStr.split('T')[1]?.substring(0, 5);
        
        this.openBookingForm(null, bookingDate, bookingTime);
        this.calendar.unselect();
    }

    /**
     * Handle date cell click
     * @private
     * @param {Object} info - Cell information
     */
    handleDateCellClick(info) {
        const bookingDate = info.date.toISOString().split('T')[0];
        this.openBookingForm(null, bookingDate, null);
    }

    /**
     * Handle event click
     * @private
     * @param {Object} info - Event information
     */
    handleEventClick(info) {
        this.openBookingForm(info.event.id);
    }

    /**
     * Handle event move (drag and drop)
     * @private
     * @async
     * @param {Object} info - Event move information
     * @returns {Promise<void>}
     */
    async handleEventMove(info) {
        try {
            const event = info.event;
            
            const bookingDate = event.startStr.split('T')[0];
            const startTime = event.startStr.split('T')[1]?.substring(0, 8);
            const endTime = event.endStr 
                ? event.endStr.split('T')[1]?.substring(0, 8)
                : null;
            
            console.debug('Event moved:', { bookingDate, startTime, endTime });
            
            const response = await fetch(`${this.options.apiUrl}/events/${event.id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    booking_date: bookingDate,
                    start_time: startTime,
                    end_time: endTime
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                info.revert();
                this.showError(result.error || 'Failed to update appointment');
            } else {
                await this.refreshEvents();
            }
        } catch (error) {
            console.error('Error moving event:', error);
            info.revert();
            this.showError('Error updating appointment time');
        }
    }

    /**
     * Handle event resize
     * @private
     * @async
     * @param {Object} info - Event resize information
     * @returns {Promise<void>}
     */
    async handleEventResize(info) {
        await this.handleEventMove(info);
    }

    /**
     * Open new booking form
     * @private
     * @param {string|null} bookingId - Booking ID (null for new)
     * @param {string|null} bookingDate - Pre-selected date
     * @param {string|null} bookingTime - Pre-selected time
     */
    openBookingForm(bookingId = null, bookingDate = null, bookingTime = null) {
        document.dispatchEvent(new CustomEvent('open-booking-form', {
            detail: { bookingId, bookingDate, bookingTime }
        }));
    }

    /**
     * Open add customer form
     * @private
     */
    openAddCustomerForm() {
        document.dispatchEvent(new CustomEvent('open-customer-form'));
    }

    /**
     * Open new booking form from button
     * @private
     */
    openNewBookingForm() {
        document.dispatchEvent(new CustomEvent('open-booking-form', {
            detail: {
                bookingId: null,
                bookingDate: null,
                bookingTime: null
            }
        }));
    }

    /**
     * Get CSS class names for event
     * @private
     * @param {Object} info - Event information
     * @returns {Array} Array of CSS class names
     */
    getEventClassNames(info) {
        const props = info.event.extendedProps;
        const classes = ['calendar-event'];
        if (props.status) {
            classes.push(`event-status-${props.status}`);
        }
        return classes;
    }

    /**
     * Format event content for display
     * @private
     * @param {Object} info - Event information
     * @returns {Object} Formatted event content
     */
    formatEventContent(info) {
        const time = this.formatEventTime(info.event.start, info.event.end);
        const title = this.escapeHtml(info.event.title);
        const props = info.event.extendedProps;
        
        let statusIcon = '';
        switch(props.status) {
            case CALENDAR_CONFIG.EVENT_STATUSES.CONFIRMED:
                statusIcon = '<i class="fas fa-check-circle event-status-icon"></i>';
                break;
            case CALENDAR_CONFIG.EVENT_STATUSES.PENDING:
                statusIcon = '<i class="fas fa-clock event-status-icon"></i>';
                break;
            case CALENDAR_CONFIG.EVENT_STATUSES.COMPLETED:
                statusIcon = '<i class="fas fa-check-double event-status-icon"></i>';
                break;
            case CALENDAR_CONFIG.EVENT_STATUSES.CANCELLED:
                statusIcon = '<i class="fas fa-times-circle event-status-icon"></i>';
                break;
        }
        
        const staffName = props.staff_name ? this.escapeHtml(props.staff_name) : '';
        
        return {
            html: `
                <div class="event-content">
                    <div class="event-time">${time}</div>
                    <div class="event-title-row">
                        <span class="event-title">${title}</span>
                        ${statusIcon}
                    </div>
                    ${staffName ? `<div class="event-staff"><i class="fas fa-user"></i> ${staffName}</div>` : ''}
                </div>
            `
        };
    }

    /**
     * Format event time range
     * @private
     * @param {Date} start - Start time
     * @param {Date} end - End time
     * @returns {string} Formatted time range
     */
    formatEventTime(start, end) {
        const startTime = start.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
        
        if (!end) return startTime;
        
        const endTime = end.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
        
        return `${startTime} - ${endTime}`;
    }

    /**
     * Escape HTML special characters
     * @private
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Set up responsive behavior
     * @private
     */
    setupResponsiveBehavior() {
        const resizeHandler = () => {
            this.isMobile = window.innerWidth < CALENDAR_CONFIG.MOBILE_BREAKPOINT;
            if (this.calendar) {
                this.calendar.updateSize();
            }
        };
        
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.set('resize', resizeHandler);
    }

    /**
     * Show error message to user
     * @private
     * @param {string} message - Error message
     */
    showError(message) {
        // Implement error display logic
        console.error('User error:', message);
        alert(message); // Replace with better error UI
    }

    /**
     * Handle initialization error
     * @private
     * @param {Error} error - Error object
     */
    handleInitializationError(error) {
        console.error(`${ERROR_MESSAGES.INITIALIZATION_FAILED}`, error);
        const contentArea = document.querySelector(SELECTORS.CONTENT_AREA);
        if (contentArea) {
            contentArea.innerHTML = `
                <div style="padding: 20px; background: #fee; border-radius: 8px; margin: 20px;">
                    <h3>Error Initializing Calendar</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    /**
     * Clean up resources and event listeners
     * @public
     */
    destroy() {
        // Clear all timeouts
        this.timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
        this.timeoutIds.clear();
        
        // Remove event listeners
        this.eventListeners.forEach((handler, key) => {
            if (key === 'resize') {
                window.removeEventListener('resize', handler);
            }
        });
        
        // Destroy calendar instance
        if (this.calendar) {
            this.calendar.destroy();
            this.calendar = null;
        }
        
        console.info('Calendar module destroyed');
    }

    /**
     * Add calendar CSS styles
     * @private
     */
    addCalendarStyles() {
        const style = document.createElement('style');
        style.textContent = this.getCalendarStyles();
        document.head.appendChild(style);
    }

    /**
     * Get calendar CSS styles
     * @private
     * @returns {string} CSS styles
     */
    getCalendarStyles() {
        return `
            .calendar-page { 
                height: 100%; 
                display: flex; 
                flex-direction: column; 
                padding: 16px; 
                gap: 12px; 
                background: #f7f9fb; 
            }
            .calendar-top { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                flex-wrap: wrap; 
                gap: 12px; 
            }
            .calendar-title { 
                display: flex; 
                align-items: center; 
                gap: 10px; 
                font-size: 18px; 
                font-weight: 600; 
                color: #2d3748; 
            }
            .calendar-title i { 
                color: #4299e1; 
            }
            .calendar-title small { 
                font-weight: normal; 
                color: #718096; 
                font-size: 14px; 
                margin-left: 8px; 
                background: #edf2f7; 
                padding: 4px 8px; 
                border-radius: 6px; 
            }
            .calendar-actions { 
                display: flex; 
                gap: 10px; 
                align-items: center; 
            }
            .search-box { 
                position: relative; 
                min-width: 250px; 
            }
            .search-box input { 
                padding: 8px 10px 8px 32px; 
                border: 1px solid #e2e8f0; 
                border-radius: 6px; 
                width: 100%; 
                font-size: 14px; 
                transition: border-color 0.2s; 
            }
            .search-box input:focus { 
                outline: none; 
                border-color: #4299e1; 
                box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1); 
            }
            .search-box i { 
                position: absolute; 
                left: 10px; 
                top: 50%; 
                transform: translateY(-50%); 
                color: #a0aec0; 
                font-size: 14px; 
            }
            .btn-primary { 
                background: #4299e1; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 6px; 
                font-size: 14px; 
                font-weight: 500; 
                cursor: pointer; 
                display: flex; 
                align-items: center; 
                gap: 6px; 
                transition: background-color 0.2s; 
            }
            .btn-primary:hover { 
                background: #3182ce; 
            }
            .btn-secondary { 
                background: #718096; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 6px; 
                font-size: 14px; 
                font-weight: 500; 
                cursor: pointer; 
                display: flex; 
                align-items: center; 
                gap: 6px; 
                transition: background-color 0.2s; 
            }
            .btn-secondary:hover { 
                background: #4a5568; 
            }
            .calendar-controls { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                flex-wrap: wrap; 
                gap: 12px; 
                background: white; 
                padding: 12px; 
                border-radius: 8px; 
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); 
            }
            .left-controls, .right-controls { 
                display: flex; 
                gap: 8px; 
                align-items: center; 
                flex-wrap: wrap; 
            }
            .view-buttons { 
                display: flex; 
                background: #f7fafc; 
                border-radius: 6px; 
                padding: 2px; 
            }
            .view-btn { 
                padding: 6px 12px; 
                border: none; 
                background: none; 
                font-size: 14px; 
                color: #4a5568; 
                cursor: pointer; 
                border-radius: 4px; 
                transition: all 0.2s; 
            }
            .view-btn:hover { 
                background: white; 
            }
            .view-btn.active { 
                background: white; 
                color: #4299e1; 
                font-weight: 500; 
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); 
            }
            .nav-buttons { 
                display: flex; 
                align-items: center; 
                gap: 4px; 
                margin-left: 8px; 
            }
            .nav-btn { 
                padding: 6px 12px; 
                border: 1px solid #e2e8f0; 
                background: white; 
                border-radius: 4px; 
                cursor: pointer; 
                font-size: 14px; 
                transition: all 0.2s; 
            }
            .nav-btn:hover { 
                background: #f7fafc; 
                border-color: #cbd5e0; 
            }
            .filter-select { 
                padding: 6px 10px; 
                border: 1px solid #e2e8f0; 
                border-radius: 4px; 
                font-size: 14px; 
                background: white; 
                min-width: 120px; 
            }
            .filter-select:focus { 
                outline: none; 
                border-color: #4299e1; 
                box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1); 
            }
            .calendar-stats { 
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 10px; 
            }
            .stat { 
                background: white; 
                border-radius: 8px; 
                padding: 16px; 
                text-align: center; 
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); 
            }
            .stat-number { 
                font-size: 24px; 
                font-weight: bold; 
                color: #2d3748; 
                margin-bottom: 4px; 
            }
            .stat span { 
                font-size: 13px; 
                color: #718096; 
            }
            .calendar-body { 
                flex: 1; 
                background: white; 
                border-radius: 8px; 
                padding: 8px; 
                overflow: hidden; 
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); 
            }
            #calendar { 
                height: 100%; 
            }
            .calendar-event { 
                border: none !important; 
                border-radius: 6px !important; 
                padding: 8px !important; 
                margin: 2px !important; 
                font-size: 12px !important; 
                cursor: pointer !important; 
            }
            .calendar-event:hover { 
                opacity: 0.9 !important; 
            }
            .event-content { 
                overflow: hidden; 
            }
            .event-time { 
                font-weight: 600; 
                margin-bottom: 4px; 
                color: white; 
                font-size: 11px; 
            }
            .event-title-row { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                gap: 4px; 
            }
            .event-title { 
                flex: 1; 
                font-weight: 600; 
                color: white; 
                overflow: hidden; 
                text-overflow: ellipsis; 
                white-space: nowrap; 
                font-size: 12px; 
            }
            .event-status-icon { 
                font-size: 10px; 
                color: rgba(255, 255, 255, 0.8); 
            }
            .event-staff { 
                margin-top: 4px; 
                font-size: 10px; 
                color: rgba(255, 255, 255, 0.9); 
                display: flex; 
                align-items: center; 
                gap: 4px; 
            }
            .event-status-pending { 
                background: #ed8936 !important; 
            }
            .event-status-confirmed { 
                background: #48bb78 !important; 
            }
            .event-status-in_service { 
                background: #4299e1 !important; 
            }
            .event-status-completed { 
                background: #9f7aea !important; 
            }
            .event-status-cancelled { 
                background: #f56565 !important; 
                opacity: 0.8; 
            }
            .event-status-no_show { 
                background: #718096 !important; 
                opacity: 0.8; 
            }
            @media (max-width: 768px) {
                .calendar-top { 
                    flex-direction: column; 
                    align-items: flex-start; 
                }
                .calendar-actions { 
                    width: 100%; 
                }
                .search-box { 
                    flex: 1; 
                    min-width: auto; 
                }
                .calendar-controls { 
                    flex-direction: column; 
                    align-items: flex-start; 
                    gap: 12px; 
                }
                .left-controls, .right-controls { 
                    width: 100%; 
                }
                .right-controls { 
                    justify-content: flex-start; 
                }
                .calendar-stats { 
                    grid-template-columns: repeat(2, 1fr); 
                }
            }
            @media (max-width: 480px) {
                .calendar-stats { 
                    grid-template-columns: 1fr; 
                }
                .view-buttons { 
                    flex-wrap: wrap; 
                }
                .left-controls { 
                    flex-direction: column; 
                    align-items: flex-start; 
                }
                .nav-buttons { 
                    margin-left: 0; 
                }
            }
        `;
    }
}

/**
 * Module initialization function
 * @public
 * @async
 * @param {HTMLElement} container - Container element for the calendar
 * @returns {Promise<CalendarModule|null>} Calendar module instance
 */
async function render(container) {
    try {
        const calendarModule = new CalendarModule({
            apiUrl: '/api/calendar',
            defaultView: CALENDAR_CONFIG.DEFAULT_VIEW
        });
        
        await calendarModule.init();
        
        // Store reference for global access
        if (typeof window !== 'undefined') {
            window.calendarModuleInstance = calendarModule;
        }
        
        console.info('Calendar module loaded successfully');
        return calendarModule;
    } catch (error) {
        console.error('Error rendering calendar module:', error);
        
        const contentArea = container || document.querySelector(SELECTORS.CONTENT_AREA);
        if (contentArea) {
            contentArea.innerHTML = `
                <div style="padding: 20px; background: #fee; border-radius: 8px;">
                    <h3>Error Loading Calendar</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #4299e1; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
        
        return null;
    }
}

// Export module
export { CalendarModule, render };

document.addEventListener('open-customer-form', () => {
  showCustomerForm();
});