import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore.js';

/* ─── Lazy views ─────────────────────────────────────────── */
const Landing             = () => import('@/views/Landing.vue');
const RegisterTicket      = () => import('@/views/RegisterTicket.vue');
const TicketView          = () => import('@/views/TicketView.vue');
const CheckIn             = () => import('@/views/CheckIn.vue');
const PastEvents          = () => import('@/views/PastEvents.vue');

const AdminLogin          = () => import('@/views/admin/AdminLogin.vue');
const AdminLayout         = () => import('@/views/admin/AdminLayout.vue');
const AdminDashboard      = () => import('@/views/admin/AdminDashboard.vue');
const AdminEventDashboard = () => import('@/views/admin/AdminEventDashboard.vue');
const AdminEvents         = () => import('@/views/admin/AdminEvents.vue');
const CreateEvent         = () => import('@/views/admin/CreateEvent.vue');
const EventDetail         = () => import('@/views/admin/EventDetail.vue');
const AdminSchedule       = () => import('@/views/admin/AdminSchedule.vue');
const AdminTicketTypes    = () => import('@/views/admin/AdminTicketTypes.vue');
const AdminCategories     = () => import('@/views/admin/AdminCategories.vue');
const AdminAttendance     = () => import('@/views/admin/AdminAttendance.vue');
const AdminGallery        = () => import('@/views/admin/AdminGallery.vue');
const AdminParticipants   = () => import('@/views/admin/AdminParticipants.vue');
const AdminEmail          = () => import('@/views/admin/AdminEmail.vue');
const AdminTags           = () => import('@/views/admin/AdminTags.vue');
const AdminReports        = () => import('@/views/admin/AdminReports.vue');
const AdminAdmins         = () => import('@/views/admin/AdminAdmins.vue');
const AdminManualRegister = () => import('@/views/admin/AdminManualRegister.vue');
const AdminHostels        = () => import('@/views/admin/AdminHostels.vue');
const AdminDepartments    = () => import('@/views/admin/AdminDepartments.vue');
const AdminExpenses       = () => import('@/views/admin/AdminExpenses.vue');
const AdminSettings       = () => import('@/views/admin/AdminSettings.vue');
const AdminSouvenirs      = () => import('@/views/admin/AdminSouvenirs.vue');
const AdminSponsors       = () => import('@/views/admin/AdminSponsors.vue');
const AdminMediaUpload    = () => import('@/views/admin/AdminMediaUpload.vue');
const Souvenirs           = () => import('@/views/SouvenirShop.vue');

/* ─── Roles shorthand ────────────────────────────────────── */
const ALL_ADMIN  = ['super_admin','admin','attendant','department'];
const ADMIN_ONLY = ['super_admin','admin'];
const SUPER_ONLY = ['super_admin'];
const DEPT_PLUS  = ['super_admin','admin','department'];

const routes = [
  /* Public ──────────────────────────────────────────────── */
  { path: '/',             name: 'home',     component: Landing },
  { path: '/register',     name: 'register', component: RegisterTicket },
  { path: '/ticket/:ref',  name: 'ticket',   component: TicketView },
  { path: '/check-in',     name: 'checkin',  component: CheckIn,
    meta: { requiresAuth: true, roles: ALL_ADMIN } },
  { path: '/past-events',  name: 'past',     component: PastEvents },
  { path: '/shop',          name: 'shop',     component: Souvenirs },
  { path: '/shop/verify',   name: 'shop-verify', component: Souvenirs },

  /* Admin login ─────────────────────────────────────────── */
  { path: '/admin/login',  name: 'admin-login', component: AdminLogin,
    meta: { guestOnly: true } },

  /* Admin (all protected) ───────────────────────────────── */
  {
    path: '/admin',
    component: AdminLayout,
    /* 
      requiresAuth on the PARENT is checked via to.matched.some() in the guard.
      All child routes inherit it automatically through matched records.
    */
    meta: { requiresAuth: true, roles: ALL_ADMIN },
    children: [
      { path: '',                    redirect: '/admin/dashboard' },

      /* Overview */
      { path: 'dashboard',           name: 'admin-dashboard',       component: AdminDashboard,
        meta: { roles: ALL_ADMIN } },
      { path: 'event-dashboard',     name: 'admin-event-dashboard', component: AdminEventDashboard,
        meta: { roles: ADMIN_ONLY } },
      { path: 'reports',             name: 'admin-reports',         component: AdminReports,
        meta: { roles: ADMIN_ONLY } },

      /* Events */
      { path: 'events',              name: 'admin-events',          component: AdminEvents,
        meta: { roles: ADMIN_ONLY } },
      { path: 'events/new',          name: 'admin-event-create',    component: CreateEvent,
        meta: { roles: ADMIN_ONLY } },
      { path: 'events/:id',          name: 'admin-event-detail',    component: EventDetail,
        meta: { roles: ADMIN_ONLY } },
      { path: 'events/:id/schedule', name: 'admin-schedule',        component: AdminSchedule,
        meta: { roles: ADMIN_ONLY } },
      { path: 'events/:id/ticket-types', name: 'admin-ticket-types', component: AdminTicketTypes,
        meta: { roles: ADMIN_ONLY } },

      /* Operations */
      { path: 'categories',          name: 'admin-categories',      component: AdminCategories,
        meta: { roles: ADMIN_ONLY } },
      { path: 'attendance',          name: 'admin-attendance',      component: AdminAttendance,
        meta: { roles: ALL_ADMIN } },
      { path: 'tags',                name: 'admin-tags',            component: AdminTags,
        meta: { roles: ADMIN_ONLY } },
      { path: 'hostels',             name: 'admin-hostels',         component: AdminHostels,
        meta: { roles: ADMIN_ONLY } },
      { path: 'gallery',             name: 'admin-gallery',         component: AdminGallery,
        meta: { roles: ADMIN_ONLY } },

      /* Participants */
      { path: 'participants',        name: 'admin-participants',    component: AdminParticipants,
        meta: { roles: ADMIN_ONLY } },
      { path: 'register',            name: 'admin-manual-register', component: AdminManualRegister,
        meta: { roles: ADMIN_ONLY } },
      { path: 'email',               name: 'admin-email',           component: AdminEmail,
        meta: { roles: ADMIN_ONLY } },

      /* Finance */
      { path: 'departments',         name: 'admin-departments',     component: AdminDepartments,
        meta: { roles: ADMIN_ONLY } },
      { path: 'expenses',            name: 'admin-expenses',        component: AdminExpenses,
        meta: { roles: DEPT_PLUS } },

      /* System */
      { path: 'admins',              name: 'admin-admins',          component: AdminAdmins,
        meta: { roles: SUPER_ONLY } },
      { path: 'settings',            name: 'admin-settings',        component: AdminSettings,
        meta: { roles: ALL_ADMIN } },
      { path: 'souvenirs',           name: 'admin-souvenirs',       component: AdminSouvenirs,
        meta: { roles: ADMIN_ONLY } },
      { path: 'sponsors',            name: 'admin-sponsors',        component: AdminSponsors,
        meta: { roles: ADMIN_ONLY } },
      { path: 'media',               name: 'admin-media',           component: AdminMediaUpload,
        meta: { roles: ALL_ADMIN } },
        meta: { roles: ADMIN_ONLY } },
    ],
  },

  /* Catch-all — must be last */
  { path: '/:pathMatch(.*)*', name: 'not-found', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    // Hash navigation — let the landing page handle smooth scroll
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 };
    return { top: 0, behavior: 'smooth' };
  },
});

/* ─── Navigation guard ───────────────────────────────────── */
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();

  // Guest-only pages (login): redirect authenticated users away
  if (to.meta.guestOnly && auth.isAuthenticated) {
    const dest = auth.admin?.role === 'department' ? '/admin/expenses' : '/admin/dashboard';
    return next(dest);
  }

  // Check requiresAuth on this route OR any parent route
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth);
  if (requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'admin-login', query: { redirect: to.fullPath } });
  }

  // Role check: use the most specific (deepest) route's roles
  const roleMeta = [...to.matched].reverse().find(r => r.meta.roles);
  if (roleMeta && auth.isAuthenticated) {
    const allowed = roleMeta.meta.roles;
    if (!allowed.includes(auth.admin?.role)) {
      const fallback = auth.admin?.role === 'department' ? '/admin/expenses' : '/admin/dashboard';
      return next(fallback);
    }
  }

  next();
});

export default router;
