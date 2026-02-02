// Validation middleware for calendar operations
function validateCalendarRequest(req, res, next) {
    const { view, date } = req.query;
    
    // Validate view parameter
    const validViews = ['day', 'week', 'month', 'staff', 'resource'];
    if (view && !validViews.includes(view)) {
        return res.status(400).json({
            error: `Invalid view. Must be one of: ${validViews.join(', ')}`
        });
    }
    
    // Validate date format
    if (date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }
        
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                error: 'Invalid date'
            });
        }
    }
    
    next();
}

function validateBulkUpdate(req, res, next) {
    const { appointmentIds, updates } = req.body;
    
    if (!appointmentIds || !Array.isArray(appointmentIds)) {
        return res.status(400).json({
            error: 'appointmentIds must be an array'
        });
    }
    
    if (appointmentIds.length === 0) {
        return res.status(400).json({
            error: 'appointmentIds cannot be empty'
        });
    }
    
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
        return res.status(400).json({
            error: 'updates object is required with at least one field'
        });
    }
    
    // Validate allowed update fields
    const allowedFields = [
        'status', 'appointment_date', 'appointment_time', 
        'duration', 'notes', 'staff_id', 'service_id'
    ];
    
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        return res.status(400).json({
            error: `Invalid update fields: ${invalidFields.join(', ')}. Allowed: ${allowedFields.join(', ')}`
        });
    }
    
    next();
}

module.exports = {
    validateCalendarRequest,
    validateBulkUpdate
};