import express from 'express';
import { login, getMe, createAdmin, listAdmins, updateAdmin, changePassword } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/admins', authenticate, authorize('super_admin'), createAdmin);
router.get('/admins', authenticate, authorize('super_admin'), listAdmins);
router.put('/admins/:id', authenticate, authorize('super_admin'), updateAdmin);
router.patch('/admins/:id/status', authenticate, authorize('super_admin'), async (req, res, next) => {
  try {
    const { is_active } = req.body;
    const { query } = await import('../database/db.js');
    const { success } = await import('../utils/response.js');
    await query('UPDATE admins SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
    success(res, null, `Admin ${is_active ? 'activated' : 'deactivated'}.`);
  } catch (e) { next(e); }
});
router.put('/change-password', authenticate, changePassword);

export default router;
