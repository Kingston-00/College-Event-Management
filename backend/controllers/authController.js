const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { httpError } = require('../middleware/errorHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  year: u.year,
  rollNumber: u.rollNumber,
  phone: u.phone,
});

// Public sign-up always creates a student; admins come from the seed script.
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, department, year, rollNumber, phone } = req.body;
    if (await User.findOne({ email })) throw httpError(409, 'Email already registered');
    const user = await User.create({ name, email, password, department, year, rollNumber, phone, role: 'student' });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) throw httpError(401, 'Invalid email or password');
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.me = (req, res) => res.json({ user: publicUser(req.user) });
