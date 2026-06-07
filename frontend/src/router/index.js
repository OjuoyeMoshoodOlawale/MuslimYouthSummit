import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore.js';

/* ── Lazy-loaded views ──────────────────────────────────── */
const Landing        = () => import('@/views/Landing.vue');
const RegisterTicket = () => import('@/views/RegisterTicket.vue');
const TicketView     = () => import('@/views/TicketView.vue');
const CheckIn        = () => import('@/views/CheckIn.vue');
const PastEvents     = () => import('@/views/PastEvents.vue');

// Admin
const AdminLogin     = () => import('@/views/admin/AdminLogin.vue');
const AdminLayout    = () => import('@/views/admin/AdminLayout.vue');
const AdminDashboard = () => import('@/views/admin/AdminDashboard.vue');
const AdminEvents    = () => import('@/views/admin/AdminEvents.vue');
const CreateEvent    = () => import('@/views/admin/CreateEvent.vue');
const EventDetail    = () => import('@/views/admin/EventDetail.vue');
const AdminAttendance= () => import('@/views/admin/AdminAttendance.vue');
const AdminGallery   = () => import('@/views/admin/AdminGallery.vue');
const AdminParticipants = () => import('@/views/admin/AdminParticipants.vue');
const AdminEmail     = () => import('@/views/admin/AdminEmail.vue');
const AdminTags      = () => import('@/views/admin/AdminTags.vue');
const AdminAdmins    = () => import('@/views/admin/AdminAdmins.vue');

const routes = [
  /* ─ Public ─────────────────────────────────────────── */
  { path: '/',              name: 'home',     component: Landing },
  { path: '/register',      name: 'register', component: RegisterTicket },
  { path: '/ticket/:ref',   name: 'ticket',   component: TicketView },
  { path: '/check-in',      name: 'checkin',  component: CheckIn,
    meta: { requiresAuth: true, roles: ['super_admin','admin','attendant'] } },
  { path: '/past-events',   name: 'past',     component: PastEvents },

  /* ─ Admin auth ─────────────────────────────────────── */
  { path: '/admin/login',   name: 'admin-login', component: AdminLogin,
    meta: { guestOnly: true } },

  /* ─ Admin (protected) ──────────────────────────────── */
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['super_admin','admin','attendant'] },
    children: [
      { path: '',             redirect: '/admin/dashboard' },
      { path: 'dashboard',    name: 'admin-dashboard',    component: AdminDashboard },
      { path: 'events',       name: 'admin-events',       component: AdminEvents,
        meta: { roles: ['super_admin','admin'] } },
      { path: 'events/new',   name: 'admin-event-create', component: CreateEvent,
        meta: { roles: ['super_admin','admin'] } },
      { path: 'events/:id',   name: 'admin-event-detail', component: EventDetail,
        meta: { roles: ['super_admin','admin'] } },
      { path: 'attendance',   name: 'admin-attendance',   component: AdminAttendance },
      { path: 'gallery',      name: 'admin-gallery',      component: AdminGallery,
        meta: { roles: ['super_admin','admin'] } },
      { path: 'participants', name: 'admin-participants',  component: AdminParticipants,
        meta: { roles: ['super_admin','admin'] } },
      { path: 'email',        name: 'admin-email',        component: AdminEmail,
        meta: { roles: ['super_admin','admin'] } },
      { path: 'tags',         name: 'admin-tags',         component: AdminTags,
        meta: { roles: ['super_admin','admin'] } },
      { path: 'admins',       name: 'admin-admins',       component: AdminAdmins,
        meta: { roles: ['super_admin'] } },
    ],
  },

  /* ─ Catch-all ──────────────────────────────────────── */
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPos) {
    if (savedPos) return savedPos;
    if (to.hash)  return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  },
});

/* ── Navigation guards ──────────────────────────────────── */
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return next('/admin/dashboard');
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'admin-login', query: { redirect: to.fullPath } });
  }

  if (to.meta.roles && auth.isAuthenticated) {
    const allowed = to.meta.roles;
    if (!allowed.includes(auth.admin?.role)) {
      return next('/admin/dashboard');
    }
  }

  next();
});

export default router;
