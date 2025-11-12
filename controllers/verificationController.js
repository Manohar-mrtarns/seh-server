import Student from '../models/Student.js';

// Verify student QR code
export const verifyStudent = async (req, res) => {
  try {
    const { qrData, roomId } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }

    let studentData;
    try {
      studentData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const student = await Student.findById(studentData.studentId).populate('room');
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        allowed: false,
        message: 'Student not found',
        reason: 'Invalid QR Code'
      });
    }

    // Check if student is already verified
    if (student.isVerified) {
      return res.json({
        success: false,
        allowed: false,
        message: 'Student already entered',
        reason: 'Already Verified',
        student: {
          rollNumber: student.rollNumber,
          name: student.name,
          verifiedAt: student.verifiedAt
        }
      });
    }

    // Check if student belongs to the correct room
    if (roomId && student.room && student.room._id.toString() !== roomId) {
      return res.json({
        success: false,
        allowed: false,
        message: 'Wrong room',
        reason: `Student assigned to Room ${student.room.roomNumber}`,
        student: {
          rollNumber: student.rollNumber,
          name: student.name,
          assignedRoom: student.room.roomNumber
        }
      });
    }

    // Check if student has been assigned a seat
    if (!student.room || !student.seatPosition.row || !student.seatPosition.column) {
      return res.json({
        success: false,
        allowed: false,
        message: 'Seat not assigned',
        reason: 'No seat allocation found',
        student: {
          rollNumber: student.rollNumber,
          name: student.name
        }
      });
    }

    // Mark student as verified
    student.isVerified = true;
    student.verifiedAt = new Date();
    student.verifiedBy = req.userId;
    await student.save();

    res.json({
      success: true,
      allowed: true,
      message: 'Student verified successfully',
      student: {
        rollNumber: student.rollNumber,
        name: student.name,
        class: student.class,
        room: student.room.roomNumber,
        seatPosition: `Row ${student.seatPosition.row}, Column ${student.seatPosition.column}`,
        examName: student.examName,
        examDate: student.examDate
      }
    });
  } catch (error) {
    console.error('Verify student error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// Get verification statistics
export const getVerificationStats = async (req, res) => {
  try {
    const { roomId } = req.query;

    const query = roomId ? { room: roomId } : {};

    const totalStudents = await Student.countDocuments(query);
    const verifiedStudents = await Student.countDocuments({ ...query, isVerified: true });
    const pendingStudents = totalStudents - verifiedStudents;

    res.json({
      success: true,
      stats: {
        total: totalStudents,
        verified: verifiedStudents,
        pending: pendingStudents,
        percentage: totalStudents > 0 ? ((verifiedStudents / totalStudents) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset verification status (for testing)
export const resetVerification = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.isVerified = false;
    student.verifiedAt = null;
    student.verifiedBy = null;
    await student.save();

    res.json({
      success: true,
      message: 'Verification status reset successfully'
    });
  } catch (error) {
    console.error('Reset verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
