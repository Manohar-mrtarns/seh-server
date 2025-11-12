import XLSX from 'xlsx';
import QRCode from 'qrcode';
import Student from '../models/Student.js';
import Room from '../models/Room.js';

// Upload students from Excel
export const uploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const students = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Validate required fields
        if (!row.rollNumber || !row.name || !row.class || !row.dob || !row.examName || !row.examDate) {
          errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ rollNumber: row.rollNumber });
        if (existingStudent) {
          errors.push(`Row ${i + 2}: Student with roll number ${row.rollNumber} already exists`);
          continue;
        }

        const student = new Student({
          rollNumber: row.rollNumber.toString(),
          name: row.name,
          class: row.class,
          dob: row.dob.toString(),
          examName: row.examName,
          examDate: row.examDate.toString()
        });

        await student.save();
        students.push(student);
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${students.length} students`,
      studentsUploaded: students.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Upload students error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('room').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unassigned students
export const getUnassignedStudents = async (req, res) => {
  try {
    const { examName } = req.query;
    
    const query = { room: null };
    if (examName) {
      query.examName = examName;
    }
    
    const students = await Student.find(query).sort({ rollNumber: 1 });
    
    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get unassigned students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student by ID
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('room');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Remove student from room if assigned
    if (student.room) {
      await Room.findByIdAndUpdate(student.room, {
        $pull: { students: student._id }
      });
    }

    await Student.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate QR Code for student
export const generateQRCode = async (studentId) => {
  try {
    const student = await Student.findById(studentId).populate('room');
    
    if (!student) {
      throw new Error('Student not found');
    }

    const qrData = {
      studentId: student._id,
      rollNumber: student.rollNumber,
      name: student.name,
      room: student.room?.roomNumber || 'Not Assigned',
      seatPosition: student.seatPosition,
      examName: student.examName
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
    
    student.qrCode = qrCodeDataURL;
    await student.save();

    return qrCodeDataURL;
  } catch (error) {
    throw error;
  }
};
