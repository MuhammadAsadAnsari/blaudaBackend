const mongoose = require('mongoose');
// const toJson = require('@meanie/mongoose-to-json');

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    vibeGuide: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    admin: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    bookingDate: {
      type: Date,
    },
    bookingTime: {
      type: String,
    },
    sessionLength: {
      type: String,
    },
    zoomStartUrl: {
      type: String,
      default:''
    },
    zoomJoinUrl: {
      type: String,
      default:''
    },
    bookingNumber: {
      type: Number,
      default: Math.floor(100000 + Math.random() * 9000),
    },
    status: {
      type: String,
      enum: ['pending', 'rejected','confirmed','cancelled', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// BookingSchema.plugin(toJson);
const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;