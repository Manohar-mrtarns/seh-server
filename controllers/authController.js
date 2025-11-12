import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Admin/Teacher Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Student Login (Roll Number + DOB)
export const studentLogin = async (req, res) => {
  try {
    const { rollNumber, dob } = req.body;

    if (!rollNumber || !dob) {
      return res.status(400).json({ message: 'Please provide roll number and date of birth' });
    }

    const student = await Student.findOne({ rollNumber, dob }).populate('room');
    
    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials or student not found' });
    }

    // Generate a simple token for student (using student ID)
    const token = jwt.sign({ studentId: student._id, role: 'student' }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      success: true,
      token,
      student: {
        id: student._id,
        rollNumber: student.rollNumber,
        name: student.name,
        class: student.class,
        examName: student.examName,
        examDate: student.examDate,
        room: student.room,
        seatPosition: student.seatPosition,
        qrCode: student.qrCode,
        isVerified: student.isVerified
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error during student login' });
  }
};

// Register Admin/Teacher (for initial setup)
export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate role
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only admin and teacher can register here.' });
    }

    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({
      email,
      password,
      name,
      role
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Student Signup
export const studentSignup = async (req, res) => {
  try {
    const { rollNumber, name, dob, className, email, phone } = req.body;

    if (!rollNumber || !name || !dob) {
      return res.status(400).json({ message: 'Please provide roll number, name, and date of birth' });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ rollNumber });
    
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this roll number already exists' });
    }

    const student = new Student({
      rollNumber,
      name,
      dob,
      class: className || 'Not Assigned',
      email: email || '',
      phone: phone || '',
      examName: 'Pending Assignment',
      examDate: new Date(),
      isVerified: false
    });

    await student.save();

    // Generate token for student
    const token = jwt.sign({ studentId: student._id, role: 'student' }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      success: true,
      token,
      student: {
        id: student._id,
        rollNumber: student.rollNumber,
        name: student.name,
        class: student.class,
        email: student.email,
        phone: student.phone,
        examName: student.examName,
        examDate: student.examDate,
        isVerified: student.isVerified
      }
    });
  } catch (error) {
    console.error('Student signup error:', error);
    res.status(500).json({ message: 'Server error during student signup' });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
