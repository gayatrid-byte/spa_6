const { pool } = require('../config/database');

class Service {
  // Basic Services
  static async getAll(salonId) {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, 
                sc.name as sub_category_name,
                mc.name as main_category_name,
                mc.id as main_category_id
         FROM services s
         LEFT JOIN categories sc ON s.category_id = sc.id
         LEFT JOIN categories mc ON sc.parent_id = mc.id
         WHERE s.salon_id = ? 
         ORDER BY mc.display_order, sc.display_order, s.name`,
        [salonId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting services: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, 
                sc.name as sub_category_name,
                sc.id as sub_category_id,
                mc.name as main_category_name,
                mc.id as main_category_id
         FROM services s
         LEFT JOIN categories sc ON s.category_id = sc.id
         LEFT JOIN categories mc ON sc.parent_id = mc.id
         WHERE s.id = ?`,
        [id]
      );
      
      const service = rows[0];
      if (!service) return null;
      
      const [rooms] = await pool.query(
        `SELECT r.* FROM rooms r
         INNER JOIN service_rooms sr ON r.id = sr.room_id
         WHERE sr.service_id = ? AND r.is_active = true`,
        [id]
      );
      
      service.rooms = rooms;
      service.room_ids = rooms.map(r => r.id);
      
      return service;
    } catch (error) {
      throw new Error(`Error getting service: ${error.message}`);
    }
  }

  static async create(serviceData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `INSERT INTO services 
         (salon_id, name, category_id, duration_minutes, base_price, description, allow_in_combo, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serviceData.salon_id,
          serviceData.name,
          serviceData.category_id,
          serviceData.duration_minutes,
          serviceData.base_price,
          serviceData.description,
          serviceData.allow_in_combo !== false,
          serviceData.is_active !== false
        ]
      );
      
      const serviceId = result.insertId;
      
      if (serviceData.room_ids && serviceData.room_ids.length > 0) {
        const roomValues = serviceData.room_ids.map(roomId => [serviceId, roomId]);
        await connection.query(
          'INSERT INTO service_rooms (service_id, room_id) VALUES ?',
          [roomValues]
        );
      }
      
      await connection.commit();
      return serviceId;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creating service: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async update(id, serviceData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `UPDATE services SET 
         name = ?, category_id = ?, duration_minutes = ?, base_price = ?, 
         description = ?, allow_in_combo = ?, is_active = ? 
         WHERE id = ?`,
        [
          serviceData.name,
          serviceData.category_id,
          serviceData.duration_minutes,
          serviceData.base_price,
          serviceData.description,
          serviceData.allow_in_combo !== false,
          serviceData.is_active !== false,
          id
        ]
      );
      
      await connection.query(
        'DELETE FROM service_rooms WHERE service_id = ?',
        [id]
      );
      
      if (serviceData.room_ids && serviceData.room_ids.length > 0) {
        const roomValues = serviceData.room_ids.map(roomId => [id, roomId]);
        await connection.query(
          'INSERT INTO service_rooms (service_id, room_id) VALUES ?',
          [roomValues]
        );
      }
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error updating service: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query(
        'UPDATE services SET is_active = false WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting service: ${error.message}`);
    }
  }

  static async getByCategory(salonId, categoryId) {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, sc.name as sub_category_name, mc.name as main_category_name
         FROM services s
         LEFT JOIN categories sc ON s.category_id = sc.id
         LEFT JOIN categories mc ON sc.parent_id = mc.id
         WHERE s.salon_id = ? AND s.category_id = ? AND s.is_active = true 
         ORDER BY s.name`,
        [salonId, categoryId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting services by category: ${error.message}`);
    }
  }

  static async getByMainCategory(salonId, mainCategoryId) {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, 
                sc.name as sub_category_name, 
                sc.id as sub_category_id,
                mc.name as main_category_name,
                mc.id as main_category_id
         FROM services s
         LEFT JOIN categories sc ON s.category_id = sc.id
         LEFT JOIN categories mc ON sc.parent_id = mc.id
         WHERE s.salon_id = ? 
           AND sc.parent_id = ? 
           AND s.is_active = true
         ORDER BY s.name`,
        [salonId, mainCategoryId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting services by main category: ${error.message}`);
    }
  }

  // Categories
  static async getMainCategories(salonId) {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, 
                (SELECT COUNT(*) FROM categories sc WHERE sc.parent_id = c.id AND sc.is_active = true) as subcategory_count,
                (SELECT COUNT(*) FROM services s WHERE s.category_id IN (SELECT id FROM categories WHERE parent_id = c.id) AND s.is_active = true) as service_count
         FROM categories c 
         WHERE c.salon_id = ? AND c.level = 'main' 
         ORDER BY c.display_order, c.name`,
        [salonId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting main categories: ${error.message}`);
    }
  }

  static async getSubCategories(salonId, parentId = null) {
    try {
      let query = `SELECT sc.*, 
                          c.name as parent_name,
                          (SELECT COUNT(*) FROM services s WHERE s.category_id = sc.id AND s.is_active = true) as service_count
                   FROM categories sc
                   LEFT JOIN categories c ON sc.parent_id = c.id
                   WHERE sc.salon_id = ? AND sc.level = 'sub'`;
      
      const params = [salonId];
      
      if (parentId) {
        query += ' AND sc.parent_id = ?';
        params.push(parentId);
      }
      
      query += ' ORDER BY sc.display_order, sc.name';
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error getting sub-categories: ${error.message}`);
    }
  }

  static async getCategoriesTree(salonId) {
    try {
      const [mainCategories] = await pool.query(
        `SELECT * FROM categories 
         WHERE salon_id = ? AND level = 'main' AND is_active = true
         ORDER BY display_order, name`,
        [salonId]
      );
      
      const [subCategories] = await pool.query(
        `SELECT * FROM categories 
         WHERE salon_id = ? AND level = 'sub' AND is_active = true
         ORDER BY display_order, name`,
        [salonId]
      );
      
      const categoriesTree = mainCategories.map(mainCat => {
        const subCats = subCategories.filter(subCat => subCat.parent_id === mainCat.id);
        return {
          ...mainCat,
          sub_categories: subCats
        };
      });
      
      return categoriesTree;
    } catch (error) {
      throw new Error(`Error getting categories tree: ${error.message}`);
    }
  }

  static async getCategoryById(categoryId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting category by ID: ${error.message}`);
    }
  }

  static async createCategory(salonId, categoryData) {
    try {
      const level = categoryData.parent_id ? 'sub' : 'main';
      
      const [result] = await pool.query(
        'INSERT INTO categories (salon_id, name, parent_id, level, description, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          salonId,
          categoryData.name,
          categoryData.parent_id || null,
          level,
          categoryData.description || null,
          categoryData.display_order || 0,
          categoryData.is_active !== false
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating category: ${error.message}`);
    }
  }

  static async updateCategory(id, categoryData) {
    try {
      if (categoryData.parent_id !== undefined) {
        const level = categoryData.parent_id ? 'sub' : 'main';
        categoryData.level = level;
      }
      
      const [result] = await pool.query(
        'UPDATE categories SET name = ?, parent_id = ?, level = ?, description = ?, is_active = ?, display_order = ? WHERE id = ?',
        [
          categoryData.name,
          categoryData.parent_id || null,
          categoryData.level || 'main',
          categoryData.description || null,
          categoryData.is_active !== false,
          categoryData.display_order || 0,
          id
        ]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating category: ${error.message}`);
    }
  }

  static async deleteCategory(id, salonId) {
    try {
      const [services] = await pool.query(
        'SELECT COUNT(*) as count FROM services WHERE category_id = ? AND is_active = true',
        [id]
      );
      
      if (services[0].count > 0) {
        throw new Error('Category has associated active services. Delete or reassign services first.');
      }
      
      const [subCategories] = await pool.query(
        'SELECT COUNT(*) as count FROM categories WHERE parent_id = ? AND is_active = true',
        [id]
      );
      
      if (subCategories[0].count > 0) {
        throw new Error('Main category has active sub-categories. Delete sub-categories first.');
      }
      
      const [result] = await pool.query(
        'DELETE FROM categories WHERE id = ? AND salon_id = ?',
        [id, salonId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting category: ${error.message}`);
    }
  }

  // Rooms
  static async getRooms(salonId) {
    try {
      const [rows] = await pool.query(
        `SELECT r.*,
                (SELECT COUNT(*) FROM service_rooms sr WHERE sr.room_id = r.id) as service_count
         FROM rooms r 
         WHERE r.salon_id = ? 
         ORDER BY r.room_type, r.name`,
        [salonId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting rooms: ${error.message}`);
    }
  }

  static async getRoomById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM rooms WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting room: ${error.message}`);
    }
  }

  static async createRoom(salonId, roomData) {
    try {
      const [result] = await pool.query(
        `INSERT INTO rooms 
         (salon_id, name, room_type, capacity, description, 
          bed_type, shower_available, steam_sauna_available, jacuzzi_available,
          ac_type, lighting_type, music_system, special_equipment, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          salonId,
          roomData.name,
          roomData.room_type || 'massage',
          roomData.capacity || 1,
          roomData.description || null,
          roomData.bed_type || 'massage_table',
          roomData.shower_available || false,
          roomData.steam_sauna_available || false,
          roomData.jacuzzi_available || false,
          roomData.ac_type || 'ac',
          roomData.lighting_type || 'adjustable',
          roomData.music_system || false,
          roomData.special_equipment || null,
          roomData.is_active !== false
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating room: ${error.message}`);
    }
  }

  static async updateRoom(id, roomData) {
    try {
      const [result] = await pool.query(
        `UPDATE rooms SET 
         name = ?, room_type = ?, capacity = ?, description = ?,
         bed_type = ?, shower_available = ?, steam_sauna_available = ?, jacuzzi_available = ?,
         ac_type = ?, lighting_type = ?, music_system = ?, special_equipment = ?, is_active = ?
         WHERE id = ?`,
        [
          roomData.name,
          roomData.room_type || 'massage',
          roomData.capacity || 1,
          roomData.description || null,
          roomData.bed_type || 'massage_table',
          roomData.shower_available || false,
          roomData.steam_sauna_available || false,
          roomData.jacuzzi_available || false,
          roomData.ac_type || 'ac',
          roomData.lighting_type || 'adjustable',
          roomData.music_system || false,
          roomData.special_equipment || null,
          roomData.is_active !== false,
          id
        ]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating room: ${error.message}`);
    }
  }

  static async deleteRoom(id, salonId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [appointments] = await connection.query(
        `SELECT COUNT(*) as count FROM appointments 
         WHERE room_id = ? AND status != 'cancelled'`,
        [id]
      );
      
      if (appointments[0].count > 0) {
        throw new Error('Room has scheduled appointments. Cancel or reassign appointments first.');
      }
      
      await connection.query(
        'DELETE FROM service_rooms WHERE room_id = ?',
        [id]
      );
      
      const [result] = await connection.query(
        'DELETE FROM rooms WHERE id = ? AND salon_id = ?',
        [id, salonId]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error deleting room: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async getSuitableRooms(serviceId) {
    try {
      const [rooms] = await pool.query(
        `SELECT r.* FROM rooms r
         INNER JOIN service_rooms sr ON r.id = sr.room_id
         WHERE sr.service_id = ? AND r.is_active = true
         ORDER BY r.name`,
        [serviceId]
      );
      return rooms;
    } catch (error) {
      throw new Error(`Error getting suitable rooms: ${error.message}`);
    }
  }

  // Combos
  static async getAllCombos(salonId) {
    try {
      const [rows] = await pool.query(
        `SELECT sc.*, 
                GROUP_CONCAT(DISTINCT s.name) as service_names,
                GROUP_CONCAT(DISTINCT s.category_id) as service_category_ids,
                COUNT(DISTINCT cs.service_id) as service_count,
                SUM(s.base_price) as computed_original_price
         FROM service_combos sc
         LEFT JOIN combo_services cs ON sc.id = cs.combo_id
         LEFT JOIN services s ON cs.service_id = s.id
         WHERE sc.salon_id = ?
         GROUP BY sc.id
         ORDER BY sc.name`,
        [salonId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting all combos: ${error.message}`);
    }
  }

  static async getComboById(id) {
    try {
      const [comboRows] = await pool.query(
        `SELECT * FROM service_combos WHERE id = ?`,
        [id]
      );
      
      if (!comboRows[0]) return null;
      
      const combo = comboRows[0];
      
      const [serviceRows] = await pool.query(
        `SELECT s.* 
         FROM services s
         INNER JOIN combo_services cs ON s.id = cs.service_id
         WHERE cs.combo_id = ?`,
        [id]
      );
      
      combo.services = serviceRows;
      
      return combo;
    } catch (error) {
      throw new Error(`Error getting combo by ID: ${error.message}`);
    }
  }

  static async createCombo(comboData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `INSERT INTO service_combos SET ?`,
        [comboData]
      );
      
      const comboId = result.insertId;
      
      if (comboData.service_ids && comboData.service_ids.length > 0) {
        const serviceValues = comboData.service_ids.map(serviceId => [comboId, serviceId]);
        await connection.query(
          'INSERT INTO combo_services (combo_id, service_id) VALUES ?',
          [serviceValues]
        );
      }
      
      await connection.commit();
      return comboId;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creating combo: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async updateCombo(id, comboData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `UPDATE service_combos SET ? WHERE id = ?`,
        [comboData, id]
      );
      
      if (comboData.service_ids !== undefined) {
        await connection.query(
          'DELETE FROM combo_services WHERE combo_id = ?',
          [id]
        );
        
        if (comboData.service_ids && comboData.service_ids.length > 0) {
          const serviceValues = comboData.service_ids.map(serviceId => [id, serviceId]);
          await connection.query(
            'INSERT INTO combo_services (combo_id, service_id) VALUES ?',
            [serviceValues]
          );
        }
      }
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error updating combo: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async deleteCombo(id) {
    try {
      await pool.query(
        'DELETE FROM combo_services WHERE combo_id = ?',
        [id]
      );
      
      const [result] = await pool.query(
        'DELETE FROM service_combos WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting combo: ${error.message}`);
    }
  }

  // Offers
  static async getAllOffers(salonId) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM service_combos 
         WHERE salon_id = ? AND display_section IN ('offer', 'both')
         ORDER BY valid_from DESC`,
        [salonId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error getting all offers: ${error.message}`);
    }
  }

  static async getOfferById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM service_combos 
         WHERE id = ? AND display_section IN ('offer', 'both')`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error getting offer by ID: ${error.message}`);
    }
  }

  static async createOffer(offerData) {
    try {
      const offer = {
        ...offerData,
        display_section: offerData.display_section || 'offer'
      };
      
      const [result] = await pool.query(
        `INSERT INTO service_combos SET ?`,
        [offer]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating offer: ${error.message}`);
    }
  }

  static async updateOffer(id, offerData) {
    try {
      const [result] = await pool.query(
        `UPDATE service_combos SET ? WHERE id = ?`,
        [offerData, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating offer: ${error.message}`);
    }
  }

  static async deleteOffer(id) {
    try {
      await pool.query(
        'DELETE FROM combo_services WHERE combo_id = ?',
        [id]
      );
      
      const [result] = await pool.query(
        'DELETE FROM service_combos WHERE id = ? AND display_section IN ("offer", "both")',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting offer: ${error.message}`);
    }
  }
}

module.exports = Service;