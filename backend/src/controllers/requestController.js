const pool = require('../config/db');
const { sendApprovalEmail } = require('../utils/email');

const createRequest = async (req, res) => {
  const userId = req.user.id;
  const { vehicle_id } = req.body;
  try {
    const vehicleResult = await pool.query('SELECT * FROM vehicles WHERE id = $1 AND user_id = $2', [
      vehicle_id,
      userId,
    ]);
    if (vehicleResult.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const result = await pool.query(
      'INSERT INTO slot_requests (user_id, vehicle_id, request_status) VALUES ($1, $2, $3) RETURNING *',
      [userId, vehicle_id, 'pending']
    );
    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      `Slot request created for vehicle ${vehicle_id}`,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getRequests = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;
  const isAdmin = req.user.role === 'admin';
  try {
    const searchQuery = `%${search}%`;
    let query = `
      SELECT sr.*, v.plate_number, v.vehicle_type
      FROM slot_requests sr
      JOIN vehicles v ON sr.vehicle_id = v.id
      WHERE (v.plate_number ILIKE $1 OR sr.request_status ILIKE $1)
    `;
    let countQuery = `
      SELECT COUNT(*)
      FROM slot_requests sr
      JOIN vehicles v ON sr.vehicle_id = v.id
      WHERE (v.plate_number ILIKE $1 OR sr.request_status ILIKE $1)
    `;
    const params = [searchQuery];

    if (!isAdmin) {
      query += ' AND sr.user_id = $2';
      countQuery += ' AND sr.user_id = $2';
      params.push(userId);
    }

    query += ' ORDER BY sr.id LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalItems = parseInt(countResult.rows[0].count);

    const result = await pool.query(query, params);

    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      'Slot requests list viewed',
    ]);
    res.json({
      data: result.rows,
      meta: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateRequest = async (

 req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { vehicle_id } = req.body;
  try {
    const vehicleResult = await pool.query('SELECT * FROM vehicles WHERE id = $1 AND user_id = $2', [
      vehicle_id,
      userId,
    ]);
    if (vehicleResult.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const result = await pool.query(
      'UPDATE slot_requests SET vehicle_id = $1 WHERE id = $2 AND user_id = $3 AND request_status = $4 RETURNING *',
      [vehicle_id, id, userId, 'pending']
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Request not found or not editable' });
    }
    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      `Slot request ${id} updated`,
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteRequest = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM slot_requests WHERE id = $1 AND user_id = $2 AND request_status = $3 RETURNING *',
      [id, userId, 'pending']
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Request not found or not deletable' });
    }
    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      `Slot request ${id} deleted`,
    ]);
    res.json({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const approveRequest = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const requestResult = await pool.query(
      'SELECT sr.*, v.vehicle_type, v.size, v.plate_number, u.email FROM slot_requests sr JOIN vehicles v ON sr.vehicle_id = v.id JOIN users u ON sr.user_id = u.id WHERE sr.id = $1 AND sr.request_status = $2',
      [id, 'pending']
    );
    if (requestResult.rowCount === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }
    const { vehicle_type, size, plate_number, user_id, email } = requestResult.rows[0];

    const slotResult = await pool.query(
      'SELECT * FROM parking_slots WHERE vehicle_type = $1 AND size = $2 AND status = $3 LIMIT 1',
      [vehicle_type, size, 'available']
    );
    if (slotResult.rowCount === 0) {
      return res.status(400).json({ error: 'No compatible slots available' });
    }
    const slot = slotResult.rows[0];

    await pool.query(
      'UPDATE slot_requests SET request_status = $1, slot_id = $2, slot_number = $3, approved_at = CURRENT_TIMESTAMP WHERE id = $4',
      ['approved', slot.id, slot.slot_number, id]
    );
    await pool.query('UPDATE parking_slots SET status = $1 WHERE id = $2', ['unavailable', slot.id]);

    await sendApprovalEmail(email, slot.slot_number, { plate_number });

    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      `Slot request ${id} approved, assigned slot ${slot.slot_number}`,
    ]);
    res.json({ message: 'Request approved', slot });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const rejectRequest = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE slot_requests SET request_status = $1 WHERE id = $2 AND request_status = $3 RETURNING *',
      ['rejected', id, 'pending']
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }
    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      `Slot request ${id} rejected`,
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createRequest, getRequests, updateRequest, deleteRequest, approveRequest, rejectRequest };