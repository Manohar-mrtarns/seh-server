import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  roomName: {
    type: String,
    required: true,
    trim: true
  },
  rows: {
    type: Number,
    required: true,
    min: 1
  },
  columns: {
    type: Number,
    required: true,
    min: 1
  },
  capacity: {
    type: Number,
    required: true
  },
  examName: {
    type: String,
    required: true
  },
  examDate: {
    type: String,
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate capacity before saving
roomSchema.pre('save', function(next) {
  this.capacity = this.rows * this.columns;
  next();
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
