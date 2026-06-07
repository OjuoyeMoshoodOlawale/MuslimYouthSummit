import { validate, rules } from '../middleware/validate.js';
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  listCategories, createCategory, updateCategory,
  deleteCategory, assignCategory,
} from '../controllers/categoriesController.js';

const router = express.Router({ mergeParams: true });

// Public: list active categories for an event (used on registration form)
router.get('/events/:eventId/categories', listCategories);

// Admin CRUD
router.post('/events/:eventId/categories',
  authenticate, authorize('super_admin','admin'), createCategory);
router.put('/categories/:id',
  authenticate, authorize('super_admin','admin'), updateCategory);
router.delete('/categories/:id',
  authenticate, authorize('super_admin','admin'), deleteCategory);

// Assign at registration / check-in (all authenticated roles)
router.patch('/tickets/:ticketId/category', authenticate, assignCategory);

export default router;
