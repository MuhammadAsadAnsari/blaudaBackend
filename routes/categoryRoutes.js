const express = require('express');
const categoryController = require('../controllers/categoryController');
const { uploadUserImage } = require('../utils/s3');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// user can get all categories
  /**
  * @swagger
  * /categories:
  *   get:
  *     tags: 
  *       - Category
  *     summary: Get a list of categories
  *     description: Retrieve a list of categories.
  *     responses:
  *       200:
  *         description: success
  */
router
  .route('/')
  .get(categoryController.getAllCategories)
  // admin create category
  /**
  * @swagger
  * /categories:
  *   post:
  *     tags: 
  *       - Category
  *     summary: Create a category
  *     description: creating category.
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               title:
  *                 type: string
  *               description:
  *                 type: string
  *               categoryType:
  *                 type: string
  *               icon:
  *                 type: string
  *     responses:
  *       201:
  *         description: success
  *         content:
  *           application/json:
  *             example:
  *               id: "1dfs34322421242"
  *               title: test category 1
  *               description: test description 1
  */
  .post(
    protect,
    restrictTo('admin'),
    uploadUserImage,
    categoryController.createCategory
  );

//middleware to restrict admin routes
router.use(protect, restrictTo('super-admin', 'admin'));

router.route('/admin/all').get(categoryController.getAllCategoriesForAdmin);

//admin can update and delete a package
router
  .route('/:id')
  .get(categoryController.getSingleCategory)
  // admin create category
  /**
  * @swagger
  * /categories/{id}:
  *   patch:
  *     tags: 
  *       - Category
  *     summary: Update a category
  *     description: updating category.
  *     parameters:
  *       - in: path
  *         name: id
  *         schema:
  *           type: string
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               title:
  *                 type: string
  *               description:
  *                 type: string
  *               categoryType:
  *                 type: string
  *               icon:
  *                 type: string
  *     responses:
  *       200:
  *         description: success
  *         content:
  *           application/json:
  *             example:
  *               id: "1dfs34322421242"
  *               title: test category 1
  *               description: test description 
  */
  .patch(uploadUserImage, categoryController.updateCategory)
  // admin create category
  /**
  * @swagger
  * /categories/{id}:
  *   delete:
  *     tags: 
  *       - Category
  *     summary: delete a category
  *     description: deleting category.
  *     parameters:
  *       - in: path
  *         name: id
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: success
  */
  .delete(categoryController.deleteCategory);

module.exports = router;
