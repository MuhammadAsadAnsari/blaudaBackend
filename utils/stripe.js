const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');
const User = require('../models/userModel');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');

// creating customer account on signup
exports.customer = (email, description = null) => {
  if (!email) throw 'Email is required';
  return stripe.customers.create({
    email,
    description,
  });
};

// Stripe payment methods start
const paymentMethodList = async (cus) => {
  if (!cus) throw 'Email is required';

  return await stripe.paymentMethods.list({
    customer: cus,
    type: 'card',
  });
};

// CONTROLLER returns all attached(saved) payment cards including new one
exports.attachedPaymentMethod = catchAsync(async (req, res, next) => {
  const { pmId } = req.body;

  await stripe.paymentMethods.attach(pmId, {
    customer: req?.user?.cus,
  });

  const list = await paymentMethodList(req?.user?.cus);

  res.status(200).json({
    status: 'success',
    data: list?.data,
  });
});

// CONTROLLER returns all attached(saved) payment cards
exports.getPaymentMethods = catchAsync(async (req, res, next) => {
  const list = await paymentMethodList(req.user.cus);
  res.status(200).json({
    status: 'success',
    data: list?.data,
  });
});

// CONTROLLER returns all attached(saved) payment cards after removing the desired one
exports.deattachPaymentMethod = catchAsync(async (req, res, next) => {
  const { pmId } = req.body;

  await stripe.paymentMethods.detach(pmId);

  const list = await paymentMethodList(req.user.cus);

  res.status(200).json({
    status: 'success',
    data: list.data,
  });
});

const getproduct = async (prodId) => await stripe.products.retrieve(prodId);

// fetching all subscription plans from stripe and add descriptions from DB
exports.subscriptionPlans = catchAsync(async (req, res, next) => {
  // let product = await getproduct('prod_JIKCVAVOG1hMTS');
  const subscriptions = await stripe.plans.list();

  // getting all products from DB
  const _products = await Product.find({});

  const prom_arr = subscriptions.data.map(async (value, i) => {
    const product = await getproduct(value.product);
    subscriptions.data[i].product = product;
    return product;
  });

  await Promise.all(prom_arr);

  // adding description here
  const rs = subscriptions.data.map((plan) => {
    _products.forEach((prd) => {
      if (plan?.product?.id == prd?.prodId) {
        plan.product.description = prd.description;
      }
    });
    return plan;
  });

  // sorting by price
  let plans = rs.sort((a, b) => a.amount - b.amount);

  res.status(200).json({
    status: 'success',
    results: plans.length,
    data: plans,
  });
});

exports.makePaymentIntent = async (amount, pmId, currency, cus_id, next) => {
  const params = {
    payment_method_types: ["card"],
    payment_method: pmId,
    customer: cus_id,
    amount,
    currency,
  };

  // for buying one time product
  let clientPaymentIntents = await stripe.paymentIntents.create(params);

  return clientPaymentIntents.id;
};

exports.confirmPaymentIntent = async (paymentIntentId, pmId) => {
  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: pmId,
  });

  return paymentIntent.status != "succeeded" ? false : true;
};