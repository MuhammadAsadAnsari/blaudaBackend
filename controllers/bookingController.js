const moment = require('moment');
const catchAsync = require('./../utils/catchAsync');
const Booking = require('./../models/bookingModel');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const { createNotification } = require('./notificationController');
const { zoomLinkGenerator, createMeeting, getAccessToken } = require('../utils/fn');
const axios = require('axios')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getBookings = catchAsync(async (req, res, next) => {
    // for pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 400;
    const skip = (page - 1) * limit;
    const { _id, role } = req.user;
    const { status } = req.query;

    let query = {
        ...(role == 'vibe-guide' ? { vibeGuide: _id } : { user: _id }),
    };

    if (['pending', 'rejected', 'active', 'cancelled', 'completed'].includes(status)) {
        query = {
            ...query,
            status
        }
    }


    if (status == 'all') delete query.status;

    const bookings = await Booking.find(query)
        .populate([
            { path: 'vibe-guide' },
            { path: 'user' },
        ])
        .sort('-createdAt -updatedAt')
        .skip(skip)
        .limit(limit)

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: bookings,
    });
});

exports.getVibeGuideBookings = catchAsync(async (req, res, next) => {
    // for pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 400;
    const skip = (page - 1) * limit;
    const { id } = req.params;

    const bookings = await Booking.find({ vibeGuide: id, status: { $in: ["pending", "confirmed"] } })
        .populate([
            { path: 'vibeGuide' },
            { path: 'user', populate: { path: "avatar" } },
        ])
        .sort('-createdAt -updatedAt')
        .skip(skip)
        .limit(limit)

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: bookings,
    });
});

exports.updateBooking = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) return next(new AppError("Booking not found", 400));

    const updatedBooking = await Booking.findByIdAndUpdate(id, req.body, { new: true })

    res.status(200).json({
        status: 'success',
        data: updatedBooking,
    });
});

exports.getMyClasses = catchAsync(async (req, res, next) => {
    // for pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 400;
    const skip = (page - 1) * limit;
    const { user } = req;
    const { status } = req.query;

    const admin = await User.findOne({ role: 'admin' });
    let query = {
        user: user?._id,
        admin: admin?._id
    };

    if (['pending', 'rejected', 'active', 'cancelled', 'completed'].includes(status)) {
        query = {
            ...query,
            status
        }
    }

    if (status == 'all') delete query.status;

    const bookings = await Booking.find(query)
        .populate([
            { path: 'admin' },
            { path: 'user' },
        ])
        .sort('-createdAt -updatedAt')
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: bookings,
    });
});

exports.bookVibeGuide = catchAsync(async (req, res, next) => {
    const { user } = req;
    const { pmId, sessionLength } = req.body;

    const foundVibeGuide = await User.findById(req.body.vibeGuide);

    // STRIPE charge CODE HERE
    const payment = await stripe.paymentIntents.create({
        amount: sessionLength == "30 Minutes" ? foundVibeGuide?.
            thirtyMinSession * 100 : foundVibeGuide?.
            sixtyMinSession * 100,
        currency: 'usd',
        payment_method: pmId,
        payment_method_types: ['card'],
        customer: user?.cus,
    });

    // confirming the payment intent
    const paymentConfirm = await stripe.paymentIntents.confirm(payment.id);

    if (paymentConfirm.status !== 'succeeded')
        return next(new AppError('Stripe payment error.', 400));

    // const session = await stripe.checkout.sessions.create({
    //     success_url: 'https://vibe-garden-web-xi.vercel.app/payment-success',
    //     cancel_url: 'https://vibe-garden-web-xi.vercel.app/payment-failure',
    //     line_items: [
    //       {price:sessionLength =="30 Minutes"? 75*100:130*100, quantity: 1},
    //     ],
    //     mode: 'payment',
    //   });

    // const splitDate=req.body.booking_time.split('-')
    // const bookingDate=splitDate[0];
    // const bookingTime=splitDate[1];


    req.body.user = user._id;
    // req.body.bookingDate=bookingDate;
    // req.body.bookingTime=bookingTime;

    const data = await Booking.create(req.body);

    const createdBooking = await Booking.findById(data._id).populate([
        { path: 'user' },
        { path: 'vibeGuide' },
    ]);

    res.status(201).json({
        status: 'success',
        data: createdBooking
    });
});

exports.getBookingDetail = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate([{ path: 'vibeGuide' }, { path: 'user' }]);

    res.status(200).json({
        status: 'success',
        data: booking,
    });
});

