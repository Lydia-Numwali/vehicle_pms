const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'user']
    );
    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      result.rows[0].id,
      'User registered',
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      user.id,
      'User logged in',
    ]);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };