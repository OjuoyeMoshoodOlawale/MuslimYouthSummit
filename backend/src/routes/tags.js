import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateTags, listTags, assignTag, getPrintableTags, tagStats } from '../controllers/tagController.js';
import { validate, rules } from '../middleware/validate.js';
import { query } from '../database/db.js';
import { success } from '../utils/response.js';

const router = express.Router();
const adm = [authenticate, authorize('super_admin','admin')];

// Generate tags for a specific event: POST /tags/:eventId/generate
router.post('/:eventId/generate', ...adm, validate(rules.generateTags), (req, res, next) => {
  req.body.event_id = req.params.eventId;
  return generateTags(req, res, next);
});

router.post('/generate', ...adm, validate(rules.generateTags), generateTags);
router.get('/:eventId',       authenticate, listTags);
router.put('/:id/assign',     authenticate, assignTag);
router.patch('/:id/assign',   authenticate, assignTag);
router.get('/:eventId/print', ...adm, getPrintableTags);
router.get('/:eventId/stats', authenticate, tagStats);

// Mark tag as printed
router.patch('/:id/printed', authenticate, async (req, res, next) => {
  try {
    await query('UPDATE event_tags SET is_printed = 1 WHERE id = ?', [req.params.id]);
    success(res, null, 'Tag marked as printed.');
  } catch (e) { next(e); }
});

export default router;
