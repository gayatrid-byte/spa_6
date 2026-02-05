const Service = require('../models/service.model');

// Basic Services
async function getAllServices(req, res) {
  try {
    const salonId = req.user.salon_id;
    // Support filtering by category_id via query param
    const { category_id, main_category_id } = req.query;
    if (category_id) {
      const servicesByCat = await Service.getByCategory(salonId, category_id);
      return res.json(servicesByCat);
    }
    if (main_category_id) {
      const servicesByMain = await Service.getByMainCategory(salonId, main_category_id);
      return res.json(servicesByMain);
    }
    const services = await Service.getAll(salonId);
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const service = await Service.getById(id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createService(req, res) {
  try {
    const serviceData = {
      ...req.body,
      salon_id: req.user.salon_id
    };
    
    if (!serviceData.name || !serviceData.category_id || !serviceData.duration_minutes || !serviceData.base_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const serviceId = await Service.create(serviceData);
    const service = await Service.getById(serviceId);
    
    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateService(req, res) {
  try {
    const { id } = req.params;
    const serviceData = req.body;
    
    if (!serviceData.name || !serviceData.category_id || !serviceData.duration_minutes || !serviceData.base_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const updated = await Service.update(id, serviceData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const service = await Service.getById(id);
    
    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Service.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getServicesByCategory(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { categoryId } = req.params;
    
    const services = await Service.getByCategory(salonId, categoryId);
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Categories
async function getMainCategories(req, res) {
  try {
    const salonId = req.user.salon_id;
    const categories = await Service.getMainCategories(salonId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getSubCategories(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { parentId } = req.query;
    
    const categories = await Service.getSubCategories(salonId, parentId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getCategoriesTree(req, res) {
  try {
    const salonId = req.user.salon_id;
    const categories = await Service.getCategoriesTree(salonId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createCategory(req, res) {
  try {
    const salonId = req.user.salon_id;
    const categoryData = req.body;
    
    if (!categoryData.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    if (categoryData.parent_id) {
      try {
        const parentCategory = await Service.getCategoryById(categoryData.parent_id);
        
        if (!parentCategory) {
          return res.status(400).json({ error: 'Parent category not found' });
        }
        
        if (parentCategory.parent_id !== null) {
          return res.status(400).json({ 
            error: 'Parent category must be a main category. You cannot nest sub-categories.' 
          });
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid parent category' });
      }
    }
    
    const categoryId = await Service.createCategory(salonId, categoryData);
    
    res.status(201).json({
      message: 'Category created successfully',
      categoryId
    });
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    
    if (!categoryData.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const updated = await Service.updateCategory(id, categoryData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({
      message: 'Category updated successfully'
    });
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const salonId = req.user.salon_id;
    
    const deleted = await Service.deleteCategory(id, salonId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found or access denied' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    if (error.message.includes('associated active services') || error.message.includes('active sub-categories')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// Rooms
async function getRooms(req, res) {
  try {
    const salonId = req.user.salon_id;
    const rooms = await Service.getRooms(salonId);
    res.json(rooms);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getRoomById(req, res) {
  try {
    const { id } = req.params;
    const room = await Service.getRoomById(id);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createRoom(req, res) {
  try {
    const salonId = req.user.salon_id;
    const roomData = req.body;
    
    if (!roomData.name) {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    const roomId = await Service.createRoom(salonId, roomData);
    
    res.status(201).json({
      message: 'Room created successfully',
      roomId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const roomData = req.body;
    
    if (!roomData.name) {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    const updated = await Service.updateRoom(id, roomData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({
      message: 'Room updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    const salonId = req.user.salon_id;
    
    const deleted = await Service.deleteRoom(id, salonId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Room not found or access denied' });
    }
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    if (error.message.includes('scheduled appointments')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function getSuitableRooms(req, res) {
  try {
    const { serviceId } = req.params;
    const rooms = await Service.getSuitableRooms(serviceId);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Combos
async function getAllCombos(req, res) {
  try {
    const salonId = req.user.salon_id;
    const combos = await Service.getAllCombos(salonId);
    res.json(combos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getComboById(req, res) {
  try {
    const { id } = req.params;
    const combo = await Service.getComboById(id);
    
    if (!combo) {
      return res.status(404).json({ error: 'Combo not found' });
    }
    
    res.json(combo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createCombo(req, res) {
  try {
    const salonId = req.user.salon_id;
    const comboData = {
      ...req.body,
      salon_id: salonId
    };
    
    if (!comboData.name || !comboData.combo_price) {
      return res.status(400).json({ error: 'Name and combo price are required' });
    }
    
    if (comboData.service_ids && !Array.isArray(comboData.service_ids)) {
      return res.status(400).json({ error: 'service_ids must be an array' });
    }
    
    const comboId = await Service.createCombo(comboData);
    const combo = await Service.getComboById(comboId);
    
    res.status(201).json({
      message: 'Combo created successfully',
      combo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateCombo(req, res) {
  try {
    const { id } = req.params;
    const comboData = req.body;
    
    if (!comboData.name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const updated = await Service.updateCombo(id, comboData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Combo not found' });
    }
    
    const combo = await Service.getComboById(id);
    
    res.json({
      message: 'Combo updated successfully',
      combo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteCombo(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Service.deleteCombo(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Combo not found' });
    }
    
    res.json({ message: 'Combo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Offers
async function getAllOffers(req, res) {
  try {
    const salonId = req.user.salon_id;
    const offers = await Service.getAllOffers(salonId);
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getOfferById(req, res) {
  try {
    const { id } = req.params;
    const offer = await Service.getOfferById(id);
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createOffer(req, res) {
  try {
    const salonId = req.user.salon_id;
    const offerData = {
      ...req.body,
      salon_id: salonId
    };
    
    if (!offerData.title || !offerData.discount_type || !offerData.value || 
        !offerData.start_date || !offerData.end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const offerId = await Service.createOffer(offerData);
    
    res.status(201).json({
      message: 'Offer created successfully',
      offerId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateOffer(req, res) {
  try {
    const { id } = req.params;
    const offerData = req.body;
    
    if (!offerData.title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const updated = await Service.updateOffer(id, offerData);
    
    if (!updated) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json({
      message: 'Offer updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteOffer(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Service.deleteOffer(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByCategory,
  getMainCategories,
  getSubCategories,
  getCategoriesTree,
  createCategory,
  updateCategory,
  deleteCategory,
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getSuitableRooms,
  getAllCombos,
  getComboById,
  createCombo,
  updateCombo,
  deleteCombo,
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer
};