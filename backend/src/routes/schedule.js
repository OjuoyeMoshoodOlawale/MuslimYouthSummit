import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getSchedule, createEntry, updateEntry,
  deleteEntry, reorderSchedule, cloneSchedule,
} from '../controllers/scheduleController.js';

const router = express.Router();

// Public: view schedule
router.get('/events/:eventId/schedule', getSchedule);

// Admin CRUD
const adm = authenticate, sup = authorize('super_admin','admin');

router.post  ('/events/:eventId/schedule',        adm, sup, createEntry);
router.put   ('/schedule/:id',                    adm, sup, updateEntry);
router.delete('/schedule/:id',                    adm, sup, deleteEntry);
router.post  ('/events/:eventId/schedule/reorder',adm, sup, reorderSchedule);
router.post  ('/events/schedule/clone',           adm, sup, cloneSchedule);

export default router;
