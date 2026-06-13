import { validate, rules } from '../middleware/validate.js';
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/db.js';
import { success } from '../utils/response.js';
import {
  getSchedule, createEntry, updateEntry,
  deleteEntry, reorderSchedule, cloneSchedule,
} from '../controllers/scheduleController.js';

const router = express.Router();

// Public: view schedule
router.get('/events/:eventId/schedule', getSchedule);

// Admin CRUD
const adm = authenticate, sup = authorize('super_admin','admin');

router.post  ('/events/:eventId/schedule',        adm, sup, validate(rules.createScheduleEntry), createEntry);
router.put   ('/schedule/:id',                    adm, sup, updateEntry);

/* PATCH — update only youtube_url (used by media team upload page) */
router.patch ('/schedule/:id/youtube', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { youtube_url } = req.body;
    await query('UPDATE lectures SET youtube_url = ? WHERE id = ?', [youtube_url || null, id]);
    success(res, null, youtube_url ? 'YouTube link saved.' : 'YouTube link removed.');
  } catch (e) { next(e); }
});
router.delete('/schedule/:id',                    adm, sup, deleteEntry);
router.post  ('/events/:eventId/schedule/reorder', adm, sup, reorderSchedule);
// Clone: both URL patterns (frontend uses the first)
router.post  ('/events/:eventId/schedule/clone',   adm, sup, cloneSchedule);
router.post  ('/events/schedule/clone',            adm, sup, cloneSchedule);

export default router;
