import Room from '../models/Room.js';
import Student from '../models/Student.js';
import { generateQRCode } from './studentController.js';

// Create a new room
export const createRoom = async (req, res) => {
  try {
    const { roomNumber, roomName, rows, columns, examName, examDate } = req.body;

    if (!roomNumber || !roomName || !rows || !columns || !examName || !examDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingRoom = await Room.findOne({ roomNumber });
    
    if (existingRoom) {
      return res.status(400).json({ message: 'Room with this number already exists' });
    }

    const room = new Room({
      roomNumber,
      roomName,
      rows: parseInt(rows),
      columns: parseInt(columns),
      examName,
      examDate
    });

    await room.save();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error during room creation' });
  }
};

// Get all rooms
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('students').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get room by ID
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('students');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Allocate seats to students in a room
export const allocateSeats = async (req, res) => {
  try {
    const { roomId, studentIds } = req.body;

    if (!roomId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'Please provide room ID and student IDs' });
    }

    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const availableSeats = room.capacity - room.students.length;
    
    if (studentIds.length > availableSeats) {
      return res.status(400).json({ 
        message: `Room has only ${availableSeats} available seats, but ${studentIds.length} students selected` 
      });
    }

    const students = await Student.find({ _id: { $in: studentIds } });

    // Check if any student is already assigned
    const alreadyAssigned = students.filter(s => s.room !== null);
    if (alreadyAssigned.length > 0) {
      return res.status(400).json({ 
        message: `Some students are already assigned to rooms` 
      });
    }

    // Auto-allocate seats in row-column format
    let currentRow = 1;
    let currentColumn = 1;
    
    // Get existing seat positions in this room
    const existingStudents = await Student.find({ room: roomId });
    const occupiedSeats = new Set(
      existingStudents.map(s => `${s.seatPosition.row}-${s.seatPosition.column}`)
    );

    // Find next available seat
    const findNextSeat = () => {
      while (occupiedSeats.has(`${currentRow}-${currentColumn}`)) {
        currentColumn++;
        if (currentColumn > room.columns) {
          currentColumn = 1;
          currentRow++;
        }
        if (currentRow > room.rows) {
          return null; // No more seats available
        }
      }
      return { row: currentRow, column: currentColumn };
    };

    // Assign seats to students
    for (const student of students) {
      const seat = findNextSeat();
      
      if (!seat) {
        return res.status(400).json({ message: 'Not enough seats available' });
      }

      student.room = roomId;
      student.seatPosition = seat;
      
      // Generate QR code for student
      await generateQRCode(student._id);
      await student.save();

      // Add student to room
      room.students.push(student._id);
      
      // Mark seat as occupied
      occupiedSeats.add(`${seat.row}-${seat.column}`);
      
      // Move to next position
      currentColumn++;
      if (currentColumn > room.columns) {
        currentColumn = 1;
        currentRow++;
      }
    }

    await room.save();

    res.json({
      success: true,
      message: `Successfully allocated ${students.length} students to room ${room.roomNumber}`,
      room
    });
  } catch (error) {
    console.error('Allocate seats error:', error);
    res.status(500).json({ message: 'Server error during seat allocation' });
  }
};

// Delete room
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Unassign all students from this room
    await Student.updateMany(
      { room: room._id },
      { $set: { room: null, seatPosition: { row: null, column: null }, qrCode: null } }
    );

    await Room.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
