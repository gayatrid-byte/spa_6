// Calendar helper functions
const calendarHelpers = {
    // Get week number for a date
    getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    },
    
    // Get days in month
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },
    
    // Format time for display
    formatTimeForDisplay(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    },
    
    // Calculate working hours for a day
    getWorkingHours(date) {
        // Default salon hours: 9 AM to 7 PM
        return {
            start: '09:00',
            end: '19:00',
            slots: [] // Will be populated with time slots
        };
    },
    
    // Generate time slots
    generateTimeSlots(startTime, endTime, interval = 15) {
        const slots = [];
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMin = startMin;
        
        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
            slots.push(timeStr);
            
            currentMin += interval;
            if (currentMin >= 60) {
                currentHour += Math.floor(currentMin / 60);
                currentMin = currentMin % 60;
            }
        }
        
        return slots;
    },
    
    // Get color based on status
    getStatusColor(status) {
        const colors = {
            'scheduled': '#3498db',
            'completed': '#2ecc71',
            'cancelled': '#e74c3c',
            'no-show': '#f39c12'
        };
        return colors[status] || '#95a5a6';
    },
    
    // Calculate end time
    calculateEndTime(startTime, durationMinutes) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const start = new Date();
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        
        return {
            time: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
            timestamp: end
        };
    },
    
    // Check if time is in working hours
    isWithinWorkingHours(time, workingHours) {
        const [hour, minute] = time.split(':').map(Number);
        const [startHour, startMinute] = workingHours.start.split(':').map(Number);
        const [endHour, endMinute] = workingHours.end.split(':').map(Number);
        
        const timeInMinutes = hour * 60 + minute;
        const startInMinutes = startHour * 60 + startMinute;
        const endInMinutes = endHour * 60 + endMinute;
        
        return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
    }
};

module.exports = calendarHelpers;