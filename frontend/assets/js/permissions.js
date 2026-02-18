// Role-based permissions
const permissions = {
  roles: {
    owner: {
      can: {
        viewDashboard: true,
        viewStaff: true,
        manageStaff: true,
        deleteStaff: true,  // Add delete permission
        addStaff: true,     // Add staff permission
        editStaff: true,    // Edit staff permission
        manageCustomers: true,
        manageServices: true,
        manageBookings: true,
        manageCalendar: true,
        manageBilling: true,
        manageExpenses: true,
        viewReports: true,
        manageSettings: true,
        manageUsers: true,
        takeAttendance: true,
        viewAttendance: true,
        manageSchedule: true,
        generateReports: true
      }
    },
    center: {
      can: {
        viewDashboard: true,
        viewStaff: true,
        manageStaff: true,
        deleteStaff: true,  // Add delete permission for center
        addStaff: true,     // Add staff permission for center
        editStaff: true,    // Edit staff permission for center
        manageCustomers: true,
        manageServices: true,
        manageBookings: true,
        manageCalendar: true,
        manageBilling: true,
        manageExpenses: true,
        viewReports: true,
        manageSettings: true,
        manageUsers: false,
        takeAttendance: true,
        viewAttendance: true,
        manageSchedule: true,
        generateReports: true
      }
    },
    staff: {
      can: {
        viewDashboard: true,
        viewStaff: false,    // Staff cannot view all staff
        manageStaff: false,  // Staff cannot manage staff
        deleteStaff: false,  // Staff cannot delete staff
        addStaff: false,     // Staff cannot add staff
        editStaff: false,    // Staff cannot edit staff
        manageCustomers: true,
        manageServices: false,
        manageBookings: true,
        manageCalendar: false,
        manageBilling: false,
        manageExpenses: false,
        viewReports: true,
        manageSettings: false,
        manageUsers: false,
        takeAttendance: false,  // Staff cannot take attendance
        viewAttendance: false,  // Staff cannot view attendance
        manageSchedule: false,  // Staff cannot manage schedule
        generateReports: false  // Staff cannot generate reports
      }
    }
  },

  // Check if user has permission
  can(userRole, permission) {
    if (!this.roles[userRole]) {
      return false;
    }
    return this.roles[userRole].can[permission] || false;
  },

  // Get available modules for role
  getAvailableModules(userRole) {
    const modules = {
      owner: [
        'dashboard',
        'staff',
        'customers',
        'services',
        'bookings',
        'calendar',
        'billing',
        'expenses',
        'reports',
        'memberships',
        'memberships-add',
        'membership-billing',
        'settings'
      ],
      center: [
        'dashboard',
        'staff',
        'customers',
        'services',
        'bookings',
        'calendar',
        'billing',
        'expenses',
        'reports',
        'memberships',
        'memberships-add',
        'membership-billing',
        'settings'
      ],
      staff: ['dashboard', 'customers', 'bookings', 'reports', 'memberships', 'membership-billing']
    };
    return modules[userRole] || [];
  },

  // Check if user can access module
  canAccessModule(userRole, module) {
    return this.getAvailableModules(userRole).includes(module);
  }
};


// For backward compatibility with existing code
window.permissions = permissions;