/**
 * MYS Platform — Demo Seed  (fully audited v2)
 * Run: node src/database/seed.demo.js
 *
 * Creates a complete, realistic dataset covering EVERY feature:
 *   Admins, Departments, Expense requests, Global categories, Hostels,
 *   Past event (MYS2), Active event (MYS3) with days/speakers/schedule/
 *   ticket types (undergrad+graduate+VIP), 30 participants, mixed ticket
 *   assignments, 15 check-ins with tags+hostels, gallery, email campaign,
 *   event snapshots (for dashboard chart).
 */

import { createPool } from 'mysql2/promise';
import bcrypt         from 'bcrypt';
import { randomUUID } from 'crypto';
import dotenv         from 'dotenv';
dotenv.config();

const pool = createPool({
  host:               process.env.DB_HOST || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER || 'root',
  password:           process.env.DB_PASS || '',
  database:           process.env.DB_NAME || 'mys_platform',
  multipleStatements: true,
});

const q   = (...a) => pool.execute(...a);
const log  = (m)  => console.log(`  ${m}`);
const slug = (t)  => t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + Date.now();
const tNum = (ed, n) => `${ed}-${String(n).padStart(4,'0')}`;
const tag  = (n)     => `TAG-${String(n).padStart(3,'0')}`;

/* helper — re-fetch single row id after insert (handles ON DUPLICATE KEY) */
const insertAndGetId = async (sql, params, fetchSql, fetchParams) => {
  await q(sql, params);
  const [[row]] = await q(fetchSql, fetchParams);
  return row.id;
};

/* ── Nigerian participant names [name, email, phone, gender, occupation] ─ */
const PEOPLE = [
  ['Abdullahi Musa',   'abdullahi.musa@gmail.com',   '08011111111', 'male',   'Student'      ],
  ['Fatima Ibrahim',   'fatima.ibrahim@yahoo.com',    '08022222222', 'female', 'Nurse'        ],
  ['Usman Aliyu',      'usman.aliyu@outlook.com',     '08033333333', 'male',   'Engineer'     ],
  ['Aisha Suleiman',   'aisha.suleiman@gmail.com',    '08044444444', 'female', 'Teacher'      ],
  ['Ibrahim Garba',    'ibrahim.garba@gmail.com',     '08055555555', 'male',   'Doctor'       ],
  ['Khadijah Yusuf',   'khadijah.yusuf@hotmail.com',  '08066666666', 'female', 'Accountant'   ],
  ['Mukhtar Bello',    'mukhtar.bello@gmail.com',     '08077777777', 'male',   'Lawyer'       ],
  ['Maryam Salisu',    'maryam.salisu@gmail.com',     '08088888888', 'female', 'Entrepreneur' ],
  ['Sulaiman Ahmed',   'sulaiman.ahmed@gmail.com',    '08099999999', 'male',   'Student'      ],
  ['Hafsa Mohammed',   'hafsa.mohammed@yahoo.com',    '08011222333', 'female', 'Student'      ],
  ['Nurudeen Lawal',   'nurudeen.lawal@gmail.com',    '08022333444', 'male',   'Banker'       ],
  ['Zainab Tijjani',   'zainab.tijjani@gmail.com',    '08033444555', 'female', 'Pharmacist'   ],
  ['Ismail Umar',      'ismail.umar@outlook.com',     '08044555666', 'male',   'Student'      ],
  ['Ruqayyah Hassan',  'ruqayyah.hassan@gmail.com',   '08055666777', 'female', 'Doctor'       ],
  ['Aminu Sani',       'aminu.sani@gmail.com',        '08066777888', 'male',   'Engineer'     ],
  ['Bilqis Abdullahi', 'bilqis.abdullahi@yahoo.com',  '08077888999', 'female', 'Student'      ],
  ['Yusuf Danjuma',    'yusuf.danjuma@gmail.com',     '08088999000', 'male',   'Architect'    ],
  ['Nana Idris',       'nana.idris@gmail.com',        '08099000111', 'female', 'Researcher'   ],
  ['Tajudeen Olawale', 'tajudeen.olawale@gmail.com',  '08012345678', 'male',   'Student'      ],
  ['Firdausi Garba',   'firdausi.garba@gmail.com',    '08023456789', 'female', 'Civil Servant'],
  ['Haruna Yakubu',    'haruna.yakubu@outlook.com',   '08034567890', 'male',   'Teacher'      ],
  ['Safiya Bashir',    'safiya.bashir@gmail.com',     '08045678901', 'female', 'Student'      ],
  ['Tukur Abdulkadir', 'tukur.abdulkadir@gmail.com',  '08056789012', 'male',   'Consultant'   ],
  ['Umma Ibrahim',     'umma.ibrahim@yahoo.com',      '08067890123', 'female', 'Nurse'        ],
  ['Kamal Hassan',     'kamal.hassan@gmail.com',      '08078901234', 'male',   'Student'      ],
  ['Asiya Musa',       'asiya.musa@gmail.com',        '08089012345', 'female', 'Journalist'   ],
  ['Bashir Usman',     'bashir.usman@outlook.com',    '08090123456', 'male',   'IT Officer'   ],
  ['Halima Sani',      'halima.sani@gmail.com',       '08001234567', 'female', 'Student'      ],
  ['Jibril Adamu',     'jibril.adamu@gmail.com',      '08012340987', 'male',   'Researcher'   ],
  ['Munirat Lawan',    'munirat.lawan@yahoo.com',     '08023451098', 'female', 'Economist'    ],
];

/* ═══════════════════════════════════════════════════════════ */
async function seed() {
  console.log('\n🌱  MYS Platform — Demo Seed v2\n');

  /* ─── 1. DEPARTMENTS ────────────────────────────────────── */
  console.log('🏢 Creating departments...');
  const deptData = [
    ['Kitchen & Catering', 'Responsible for all food preparation and serving',   'Mama Zainab',  0],
    ['Gate & Security',    'Entry management, ID verification and crowd control', 'Alhaji Bukar', 1],
    ['AV & Technical',     'Sound, projectors, recording and live streaming',     'Engr. Seun',   2],
    ['Transport',          'Participant transport and logistics coordination',     'Mallam Tunde', 3],
    ['Decoration',         'Venue decoration, signage and aesthetic setup',       'Sister Hafsa', 4],
  ];
  const deptIds = {};
  for (const [name, desc, head, sort] of deptData) {
    const id = await insertAndGetId(
      `INSERT INTO departments (name, description, head_name, sort_order)
       VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE head_name=VALUES(head_name)`,
      [name, desc, head, sort],
      'SELECT id FROM departments WHERE name=?', [name]
    );
    deptIds[name] = id;
    log(`✅ Dept: ${name}`);
  }

  /* ─── 2. ADMINS + DEPARTMENT STAFF ─────────────────────── */
  console.log('\n👤 Creating admin accounts...');
  const pwAdmin = await bcrypt.hash('MYS@Admin2024!', 12);
  const pwGate  = await bcrypt.hash('attend123', 12);
  const pwDept  = await bcrypt.hash('dept@123', 12);

  const adminAccounts = [
    ['MYS Super Admin',  'admin@muslimyouthsummit.com',   pwAdmin, 'super_admin', null],
    ['Coordinator Musa', 'musa@muslimyouthsummit.com',    pwAdmin, 'admin',       null],
    ['Sister Fatima',    'fatima@muslimyouthsummit.com',  pwAdmin, 'admin',       null],
    ['Gate Attendant',   'gate@muslimyouthsummit.com',    pwGate,  'attendant',   null],
    ['Kitchen Team',     'kitchen@muslimyouthsummit.com', pwDept,  'department',  'Kitchen & Catering'],
    ['AV Team',          'av@muslimyouthsummit.com',      pwDept,  'department',  'AV & Technical'],
  ];
  const adminIds = {};
  for (const [name, email, pw, role, deptName] of adminAccounts) {
    const deptId = deptName ? deptIds[deptName] : null;
    const id = await insertAndGetId(
      `INSERT INTO admins (name, email, password, role, department_id)
       VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [name, email, pw, role, deptId],
      'SELECT id FROM admins WHERE email=?', [email]
    );
    adminIds[email] = id;
    const pw_display = role === 'attendant' ? 'attend123' : role === 'department' ? 'dept@123' : 'MYS@Admin2024!';
    log(`✅ [${role}] ${email} / ${pw_display}`);
  }
  const superAdminId = adminIds['admin@muslimyouthsummit.com'];
  const admin1Id     = adminIds['musa@muslimyouthsummit.com'];
  const kitchenAdminId = adminIds['kitchen@muslimyouthsummit.com'];

  /* ─── 3. GLOBAL CATEGORIES ──────────────────────────────── */
  console.log('\n🏷  Creating global categories...');
  const catData = [
    ['Youth (Under 25)',   'Young participants aged 18–25',          '#6BBC01', 200, 0],
    ['Graduate',           'MSc, PhD and postgraduate students',      '#9333ea', 100, 1],
    ['Brothers (Seniors)', 'Male professionals and alumni 25+',       '#1a4fa0', 80,  2],
    ['Sisters (Seniors)',  'Female professionals and alumni 25+',     '#c94d8c', 80,  3],
  ];
  for (const [name, desc, color, cap, sort] of catData) {
    await q(
      `INSERT INTO event_categories (name, description, color, capacity, sort_order)
       VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE color=VALUES(color)`,
      [name, desc, color, cap, sort]
    );
    log(`✅ Category: ${name}`);
  }
  const [cats] = await q('SELECT id, name FROM event_categories ORDER BY sort_order');
  const catMap  = Object.fromEntries(cats.map(c => [c.name, c.id]));
  const catYouth = catMap['Youth (Under 25)'];
  const catGrad  = catMap['Graduate'];
  const catBro   = catMap['Brothers (Seniors)'];
  const catSis   = catMap['Sisters (Seniors)'];

  /* ─── 4. GLOBAL HOSTELS ─────────────────────────────────── */
  console.log('\n🏠 Creating hostels...');
  const hostelData = [
    ['Khadijah Hall', 'female', 60, 'Block A — Female Wing'],
    ['Umar Block',    'male',   60, 'Block B — Male Wing'],
    ['VIP Annex',     'mixed',  20, 'Main Building — Ground Floor'],
  ];
  const hostelIds = {};
  for (const [name, gender, cap, location] of hostelData) {
    const id = await insertAndGetId(
      `INSERT INTO hostels (name, gender, beds, location)
       VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE capacity=VALUES(capacity)`,
      [name, gender, cap, location],
      'SELECT id FROM hostels WHERE name=?', [name]
    );
    hostelIds[name] = id;
    log(`✅ Hostel: ${name} (${gender}, ${cap} beds)`);
  }
  const hostelFemale = hostelIds['Khadijah Hall'];
  const hostelMale   = hostelIds['Umar Block'];
  const hostelVIP    = hostelIds['VIP Annex'];

  /* ─── 5. PAST EVENT: MYS2 ───────────────────────────────── */
  console.log('\n📅 Creating MYS2 (completed past event)...');
  const mys2Id = await insertAndGetId(
    `INSERT INTO events
       (title, edition, slug, tagline, description, start_date, end_date,
        venue, venue_address, status, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE status='completed'`,
    [
      'Muslim Youth Summit 2.0', 'MYS2', slug('mys2'),
      'Faith in Action — Building Tomorrow\'s Leaders Today',
      'The second edition brought together over 300 young Muslim professionals and students for a day of learning, networking, and spiritual renewal.',
      '2024-03-15', '2024-03-16',
      'Abuja National Mosque Conference Centre', 'Airport Road, Abuja, FCT',
      'completed', superAdminId,
    ],
    'SELECT id FROM events WHERE edition=?', ['MYS2']
  );
  log(`✅ MYS2 created (completed)`);

  // MYS2 gallery
  const mys2Gallery = [
    ['https://picsum.photos/seed/mys2a/800/600', 'Opening keynote session'],
    ['https://picsum.photos/seed/mys2b/800/600', 'Networking break'],
    ['https://picsum.photos/seed/mys2c/800/600', 'Award ceremony'],
    ['https://picsum.photos/seed/mys2d/800/600', 'Group photo'],
    ['https://picsum.photos/seed/mys2e/800/600', 'Workshop session'],
    ['https://picsum.photos/seed/mys2f/800/600', 'Guest speaker panel'],
  ];
  for (const [url, caption] of mys2Gallery) {
    await q(
      `INSERT IGNORE INTO event_gallery (event_id, image_url, caption, uploaded_by)
       VALUES (?,?,?,?)`,
      [mys2Id, url, caption, superAdminId]
    );
  }
  log(`✅ MYS2 gallery: ${mys2Gallery.length} images`);

  /* ─── 6. ACTIVE EVENT: MYS3 ─────────────────────────────── */
  console.log('\n📅 Creating MYS3 (active event)...');
  const yr = new Date().getFullYear() + 1;
  const mys3Id = await insertAndGetId(
    `INSERT INTO events
       (title, edition, slug, tagline, description,
        start_date, end_date, venue, venue_address,
        early_bird_closes_at, status, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE status='active'`,
    [
      'Muslim Youth Summit 3.0', 'MYS3', slug('mys3'),
      'Rooted in Faith. Rising in Excellence.',
      'MYS3 is a 2-day intensive programme equipping Muslim youth with Islamic knowledge, career skills, and a strong sense of community. Featuring renowned scholars, industry leaders, and interactive workshops.',
      `${yr}-07-12`, `${yr}-07-13`,
      'Lagos City Hall', '25 Catholic Mission Street, Lagos Island, Lagos',
      `${yr}-06-30 23:59:59`,
      'active', superAdminId,
    ],
    'SELECT id FROM events WHERE edition=?', ['MYS3']
  );
  log(`✅ MYS3 created (active) — ${yr}-07-12 to ${yr}-07-13`);

  /* ─── 7. MYS3 EVENT DAYS ─────────────────────────────────── */
  await q(
    `INSERT INTO event_days (event_id, day_number, event_date, theme) VALUES
     (?,1,?,'Knowledge & Reformation'),
     (?,2,?,'Career & Leadership')
     ON DUPLICATE KEY UPDATE theme=VALUES(theme)`,
    [mys3Id, `${yr}-07-12`, mys3Id, `${yr}-07-13`]
  );
  const [days] = await q(
    'SELECT id, day_number FROM event_days WHERE event_id=? ORDER BY day_number', [mys3Id]
  );
  const [day1, day2] = days.map(d => d.id);
  log(`✅ Event days: Day 1 & Day 2`);

  /* ─── 8. MYS3 SPEAKERS ───────────────────────────────────── */
  console.log('\n🎤 Creating speakers...');
  const speakerData = [
    ['Sheikh Murtadha Gusau', 'Islamic Scholar & Jurist',
     'Renowned scholar specialising in Fiqh and contemporary Muslim affairs. Author of several books on Islamic jurisprudence and author of the popular "Khutbah Series."'],
    ['Dr. Aisha Mahmoud', 'Career Development Expert',
     'PhD in Organisational Psychology from University of Lagos. 15 years experience training young professionals across West Africa.'],
    ['Ustaz Ibrahim Aliyu', 'Youth Counsellor & Speaker',
     'Founder of the Muslim Professionals Network Nigeria. Passionate advocate for youth mental health and Islamic identity in the modern workplace.'],
    ['Engr. Bilal Okafor', 'Tech Entrepreneur',
     'CEO of PayLink, a Lagos-based fintech startup. Forbes Africa 30 Under 30 nominee. BEng Computer Engineering, OAU.'],
  ];
  const speakerIds = [];
  for (const [name, title, bio] of speakerData) {
    const [r] = await q(
      `INSERT INTO speakers (event_id, name, title, bio, sort_order) VALUES (?,?,?,?,?)`,
      [mys3Id, name, title, bio, speakerIds.length]
    );
    speakerIds.push(r.insertId);
    log(`✅ Speaker: ${name}`);
  }

  /* ─── 9. MYS3 SCHEDULE ───────────────────────────────────── */
  console.log('\n📋 Creating schedule...');
  const schedule = [
    //  day    sn start   end     title                                     type        speaker                   facilitators
    [day1,  1,'08:00','08:30','Registration & Welcome',                  'other',    null,                     'Gate Attendant, Coordinator Musa'],
    [day1,  2,'08:30','09:00','Fajr Prayer & Qur\'an Recitation',        'prayer',   null,                     'Ustaz Ibrahim Aliyu'],
    [day1,  3,'09:00','10:00','Opening Keynote: Rooted in Faith',        'keynote',  'Sheikh Murtadha Gusau',  'Coordinator Musa, Sister Fatima'],
    [day1,  4,'10:15','11:30','Fiqh of the Contemporary Muslim',         'lecture',  'Sheikh Murtadha Gusau',  'Coordinator Musa'],
    [day1,  5,'11:30','12:00','Networking Break',                        'break',    null,                     null],
    [day1,  6,'12:00','13:00','Women in Islam: Empowerment & Identity',  'lecture',  'Dr. Aisha Mahmoud',      'Sister Fatima'],
    [day1,  7,'13:00','14:00','Dhuhr Prayer & Lunch',                    'prayer',   null,                     null],
    [day1,  8,'14:00','15:30','Career Development Workshop',             'workshop', 'Dr. Aisha Mahmoud',      'Coordinator Musa, Sister Fatima'],
    [day1,  9,'15:30','16:00','Asr Prayer',                              'prayer',   null,                     'Ustaz Ibrahim Aliyu'],
    [day2, 10,'08:30','09:30','Morning Reflection & Motivation',         'lecture',  'Ustaz Ibrahim Aliyu',    'Gate Attendant'],
    [day2, 11,'09:45','11:00','Tech & Entrepreneurship in Nigeria',      'lecture',  'Engr. Bilal Okafor',     'Coordinator Musa'],
    [day2, 12,'11:15','12:30','Panel: Faith at the Workplace',           'panel',    'Dr. Aisha Mahmoud',      'Coordinator Musa, Sister Fatima'],
    [day2, 13,'12:30','13:30','Dhuhr Prayer & Lunch',                    'prayer',   null,                     null],
    [day2, 14,'13:30','15:00','Breakout Sessions (by Category)',         'workshop', null,                     'Coordinator Musa, Sister Fatima'],
    [day2, 15,'15:30','16:30','Closing Ceremony & Awards Night',         'other',    null,                     'Coordinator Musa'],
  ];
  for (const [dayId, sn, start, end, title, type, speaker, fac] of schedule) {
    await q(
      `INSERT INTO lectures
         (event_id, event_day_id, s_n, title, lecture_type,
          start_time, end_time, main_speaker_name, facilitators, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [mys3Id, dayId, sn, title, type, start, end, speaker, fac, sn]
    );
  }
  log(`✅ ${schedule.length} schedule entries (Day 1: 9, Day 2: 6)`);

  /* ─── 10. TICKET TYPES (Graduate, Undergraduate, VIP) ────── */
  console.log('\n🎟  Creating ticket types...');
  const ttRows = [];
  const ticketTypes = [
    ['Regular – Undergraduate', 'undergraduate', 'For 100–400 level university students',         3000, 2000, 200, 0],
    ['Regular – Graduate',      'graduate',       'For MSc, PhD and postgraduate students',        5000, 3500, 100, 1],
    ['Professional',            'professional',   'For working professionals and alumni',          7000, 5000, 80,  2],
    ['VIP – With Accommodation','all',            'Includes 2-night hostel + priority seating',  15000,12000, 40,  3],
  ];
  for (const [name, cat, desc, reg, eb, qty, sort] of ticketTypes) {
    await q(
      `INSERT INTO ticket_types
         (event_id, name, participant_category, description,
          regular_price, early_bird_price, quantity_available, sort_order)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE regular_price=VALUES(regular_price)`,
      [mys3Id, name, cat, desc, reg, eb, qty, sort]
    );
  }
  const [tts] = await q(
    'SELECT id, participant_category, name FROM ticket_types WHERE event_id=? ORDER BY sort_order',
    [mys3Id]
  );
  const ttUndergrad = tts.find(t => t.participant_category === 'undergraduate').id;
  const ttGrad      = tts.find(t => t.participant_category === 'graduate').id;
  const ttProf      = tts.find(t => t.participant_category === 'professional').id;
  const ttVIP       = tts.find(t => t.participant_category === 'all').id;
  log(`✅ 4 ticket types: Undergrad ₦3k/₦2k, Grad ₦5k/₦3.5k, Prof ₦7k/₦5k, VIP ₦15k/₦12k`);

  /* ─── 11. PARTICIPANTS & TICKETS ─────────────────────────── */
  console.log('\n👥 Creating 30 participants with tickets...');
  /*
   Ticket distribution (covers all 4 types):
     i 0–4   → VIP          (5 people, mixed gender)
     i 5–11  → Undergraduate (7 people)
     i 12–18 → Graduate     (7 people)
     i 19–25 → Professional  (7 people)
     i 26–29 → Undergraduate (4 more, total 11)
  */
  const getTicketType = (i) => {
    if (i < 5)  return [ttVIP,      15000, 12000]; // early bird
    if (i < 12) return [ttUndergrad, 3000,  2000];
    if (i < 19) return [ttGrad,      5000,  3500];
    if (i < 26) return [ttProf,      7000,  5000];
    return           [ttUndergrad,  3000,  2000];
  };
  const getCategory = (i, gender) => {
    if (i < 5)  return gender === 'female' ? catSis : catBro; // VIPs → seniors
    if (i < 12) return catYouth;
    if (i < 19) return catGrad;
    if (i < 26) return gender === 'female' ? catSis : catBro;
    return catYouth;
  };

  const partIds   = [];
  const ticketIds = [];
  const ticketSold = { [ttVIP]:0, [ttUndergrad]:0, [ttGrad]:0, [ttProf]:0 };

  for (let i = 0; i < PEOPLE.length; i++) {
    const [name, email, phone, gender, occupation] = PEOPLE[i];
    // Participant
    const partId = await insertAndGetId(
      `INSERT INTO participants (name, email, phone, gender, occupation)
       VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE phone=VALUES(phone)`,
      [name, email, phone, gender, occupation],
      'SELECT id FROM participants WHERE email=?', [email]
    );
    partIds.push(partId);

    const [ttId, , ebPrice] = getTicketType(i);
    const catId = getCategory(i, gender);
    const uniq  = tNum('MYS3', i + 1);
    const ref   = `DEMO-${randomUUID().slice(0,8).toUpperCase()}`;

    const [tRes] = await q(
      `INSERT INTO tickets
         (event_id, ticket_type_id, participant_id, category_id,
          unique_number, amount_paid, is_early_bird, status, purchased_at, paystack_reference)
       VALUES (?,?,?,?,?,?,1,'paid',NOW(),?)`,
      [mys3Id, ttId, partId, catId, uniq, ebPrice, ref]
    );
    ticketIds.push(tRes.insertId);
    ticketSold[ttId] = (ticketSold[ttId] || 0) + 1;
  }

  // Update quantity_sold for ALL ticket types
  for (const [ttId, sold] of Object.entries(ticketSold)) {
    if (sold > 0) await q('UPDATE ticket_types SET quantity_sold=? WHERE id=?', [sold, ttId]);
  }
  log(`✅ 30 participants + tickets (VIP:${ticketSold[ttVIP]}, Undergrad:${ticketSold[ttUndergrad]}, Grad:${ticketSold[ttGrad]}, Prof:${ticketSold[ttProf]})`);

  /* ─── 12. CHECK-INS (first 18 participants) ──────────────── */
  console.log('\n✅ Creating check-in records...');
  for (let i = 0; i < 18; i++) {
    const [,,,gender] = PEOPLE[i];
    const tId         = ticketIds[i];
    const tagNumber   = tag(i + 1);

    // Event tag
    const [etRes] = await q(
      `INSERT INTO event_tags (event_id, tag_number, ticket_id, participant_id, assigned_at, assigned_by)
       VALUES (?,?,?,?,NOW(),?)`,
      [mys3Id, tagNumber, tId, partIds[i], admin1Id]
    );
    const tagId = etRes.insertId;

    // checked_in_at: 1–18 hours ago
    const hoursAgo = i + 1;
    // First 6 also checked out (2–5 hrs ago)
    const checkedOut = i < 6;
    const checkoutHoursAgo = checkedOut ? Math.max(1, hoursAgo - 2) : null;

    await q(
      `INSERT INTO attendance
         (event_id, ticket_id, tag_id, checked_in_at, checked_out_at, check_in_by, check_out_by)
       VALUES (?,?,?,
         DATE_SUB(NOW(), INTERVAL ? HOUR),
         ${checkoutHoursAgo !== null ? 'DATE_SUB(NOW(), INTERVAL ? HOUR)' : 'NULL'},
         ?,?)`,
      checkoutHoursAgo !== null
        ? [mys3Id, tId, tagId, hoursAgo, checkoutHoursAgo, admin1Id, admin1Id]
        : [mys3Id, tId, tagId, hoursAgo, admin1Id, admin1Id]
    );

    // Hostel: VIP (i<5) → VIP Annex, female → Khadijah, male → Umar
    const hostelId = i < 5
      ? hostelVIP
      : gender === 'female' ? hostelFemale : hostelMale;

    await q(
      `INSERT INTO hostel_assignments
         (hostel_id, event_id, ticket_id, participant_id, room_number, assigned_by)
       VALUES (?,?,?,?,?,?)`,
      [hostelId, mys3Id, tId, partIds[i], `Room ${i + 1}`, admin1Id]
    );
  }
  log(`✅ 18 check-ins (6 also checked out), hostel assignments done`);

  /* ─── 13. EVENT SNAPSHOTS (dashboard trend chart) ────────── */
  console.log('\n📊 Creating event snapshots...');
  const today = new Date();
  const snapshotData = [
    [6, 2, 6000,  0,  0],
    [5, 5, 15000, 0,  0],
    [4, 8, 24000, 0,  0],
    [3, 14,42000, 0,  0],
    [2, 20,61000, 0,  0],
    [1, 26,79500, 0,  0],
    [0, 30,92000, 18, 6],
  ];
  for (const [daysAgo, sold, rev, cin, cout] of snapshotData) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().slice(0, 10);
    await q(
      `INSERT INTO event_snapshots
         (event_id, snapshot_date, tickets_sold, revenue, checked_in, checked_out)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE tickets_sold=VALUES(tickets_sold), revenue=VALUES(revenue)`,
      [mys3Id, dateStr, sold, rev, cin, cout]
    );
  }
  log(`✅ 7-day event snapshots (shows growth trend in dashboard)`);

  /* ─── 14. EMAIL CAMPAIGN ─────────────────────────────────── */
  console.log('\n✉  Creating email campaigns...');
  await q(
    `INSERT INTO email_campaigns
       (event_id, subject, body_html, recipient_type, status, created_by)
     VALUES (?,?,?,?,?,?)`,
    [
      mys3Id,
      'MYS3 is almost here — Final Reminder!',
      `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#FBF6E6;padding:32px 24px">
  <img src="https://muslimyouthsummit.com/logos/logo-black.png" alt="MYS" style="height:44px;margin-bottom:24px" />
  <h1 style="color:#02462E;font-size:28px;margin:0 0 16px">Assalamu Alaikum, {{name}}!</h1>
  <p style="color:#444;line-height:1.8;margin:0 0 16px">MYS3 is just around the corner and we cannot wait to see you!</p>
  <div style="background:#02462E;color:white;padding:20px 24px;margin:20px 0">
    <h2 style="margin:0 0 8px;color:#FEC700">Muslim Youth Summit 3.0</h2>
    <p style="margin:0;color:rgba(255,255,255,0.75)">July 12–13, ${yr} · Lagos City Hall</p>
  </div>
  <p style="color:#444;line-height:1.8">Please bring your ticket QR code for check-in at the gate.</p>
  <a href="#" style="display:inline-block;background:#FEC700;color:#02462E;padding:12px 28px;font-weight:bold;text-decoration:none;margin:16px 0">
    View My Ticket →
  </a>
  <p style="color:#888;font-size:13px;margin-top:24px">The MYS Team · Muslim Youth Summit</p>
</div>`,
      'all', 'draft', superAdminId,
    ]
  );
  // Also a "sent" campaign (MYS2 reminder that was already sent)
  await q(
    `INSERT INTO email_campaigns
       (event_id, subject, body_html, recipient_type, status,
        recipient_count, sent_count, sent_at, created_by)
     VALUES (?,?,?,?,?,?,?,DATE_SUB(NOW(), INTERVAL 14 DAY),?)`,
    [
      mys2Id,
      'MYS3 Registration is Now Open!',
      '<p>Registration for MYS3 is now open. Register now at muslimyouthsummit.com</p>',
      'past_attendees', 'sent', 120, 118, superAdminId,
    ]
  );
  log(`✅ 1 draft campaign + 1 sent campaign`);

  /* ─── 15. EXPENSE REQUESTS ───────────────────────────────── */
  console.log('\n💰 Creating expense requests...');
  const kitchenDeptId = deptIds['Kitchen & Catering'];
  const avDeptId      = deptIds['AV & Technical'];
  const transDeptId   = deptIds['Transport'];

  const expenses = [
    // [deptId, title, amount, priority, status, raiseNote, approveNote, payNote, daysAgo]
    [kitchenDeptId, 'Cooking gas — Day 1 & 2',        45000,  'urgent', 'paid',
     'We need 10 cylinders of cooking gas for both days of the event.',
     'Approved. Use vendor Alhaji Hassan Gas.', 'Paid via bank transfer. Ref: MYS3-KIT-001', 5],
    [kitchenDeptId, 'Food ingredients — Day 1',       120000, 'normal', 'approved',
     'Bulk purchase: rice, tomatoes, chicken and spices for 300 participants.',
     'Approved for ₦110,000. Source from MYS approved vendor.', null, 3],
    [kitchenDeptId, 'Serving equipment hire',          18000,  'low',   'pending',
     'Rental of serving trays, chafing dishes and cutlery for buffet setup.',
     null, null, 1],
    [avDeptId,     'Microphone & speaker hire',        75000,  'urgent', 'paid',
     'Professional PA system for main hall and two breakout rooms.',
     'Approved in full.', 'Paid cash to vendor. Receipt #2891.', 7],
    [avDeptId,     'Live streaming equipment',         55000,  'normal', 'approved',
     'Camera tripods, capture cards and HDMI cables for YouTube live stream.',
     'Approved for ₦50,000. Buy only essential items.', null, 4],
    [avDeptId,     'Backup generator fuel',            22000,  'normal', 'pending',
     '60 litres diesel for backup generator — main hall power backup.',
     null, null, 1],
    [transDeptId,  'Bus hire — airport pickups',       80000,  'urgent', 'approved',
     'Charter 2 buses for speaker airport pickups on July 11.',
     'Approved. Book from Royal Transport.', null, 4],
    [transDeptId,  'Fuel for coordination vehicles',   15000,  'low',   'rejected',
     'Petrol allowance for 3 coordination motorcycles during event days.',
     'Rejected — use existing vehicle allowance already budgeted.', null, 6],
  ];

  for (const [deptId, title, amount, priority, status, raiseNote, approveNote, payNote, daysAgo] of expenses) {
    const amtApproved = status === 'paid' || status === 'approved' ? amount : null;
    const amtPaid     = status === 'paid' ? amount : null;

    await q(
      `INSERT INTO expense_requests
         (department_id, event_id, title, amount_requested, amount_approved, amount_paid,
          priority, status, raised_by, approved_by, paid_by,
          raise_note, approve_note, pay_note,
          created_at, approved_at, paid_at)
       VALUES (?,?,?,?,?,?,?,?,?,
         ${status !== 'pending' ? '?' : 'NULL'},
         ${status === 'paid'    ? '?' : 'NULL'},
         ?,?,?,
         DATE_SUB(NOW(), INTERVAL ? DAY),
         ${status !== 'pending' ? 'DATE_SUB(NOW(), INTERVAL ? DAY)' : 'NULL'},
         ${status === 'paid'    ? 'DATE_SUB(NOW(), INTERVAL 1 DAY)' : 'NULL'})`,
      [
        deptId, mys3Id, title, amount, amtApproved, amtPaid,
        priority, status, kitchenAdminId,
        ...(status !== 'pending' ? [superAdminId] : []),
        ...(status === 'paid'    ? [superAdminId] : []),
        raiseNote, approveNote, payNote,
        daysAgo,
        ...(status !== 'pending' ? [Math.max(1, daysAgo - 1)] : []),
      ]
    );
    log(`✅ Expense [${status}]: ${title} — ₦${amount.toLocaleString()}`);
  }

  /* ─── 16. SUMMARY ────────────────────────────────────────── */
  console.log('\n' + '═'.repeat(58));
  console.log('🎉  Demo seed complete!\n');
  console.log('  ADMIN LOGINS:');
  console.log('  ┌──────────────────────────────────────────────────────┐');
  console.log('  │ super_admin  admin@muslimyouthsummit.com              │');
  console.log('  │ admin        musa@muslimyouthsummit.com               │');
  console.log('  │ admin        fatima@muslimyouthsummit.com             │');
  console.log('  │ attendant    gate@muslimyouthsummit.com   (attend123) │');
  console.log('  │ department   kitchen@muslimyouthsummit.com (dept@123) │');
  console.log('  │ department   av@muslimyouthsummit.com      (dept@123) │');
  console.log('  │ Default password: MYS@Admin2024!                      │');
  console.log('  └──────────────────────────────────────────────────────┘');
  console.log('\n  SEEDED DATA:');
  console.log('  • 5 departments (Kitchen, Gate, AV, Transport, Decoration)');
  console.log('  • 6 admin accounts (super_admin × 1, admin × 2, attendant × 1, dept × 2)');
  console.log('  • 4 global categories (Youth, Graduate, Brothers, Sisters)');
  console.log('  • 3 global hostels (Khadijah Hall F, Umar Block M, VIP Annex)');
  console.log('  • MYS2 — completed event with 6 gallery images');
  console.log('  • MYS3 — active event:');
  console.log('      - 2 event days, 4 speakers, 15 schedule entries');
  console.log('      - 4 ticket types: Undergrad ₦3k, Grad ₦5k, Prof ₦7k, VIP ₦15k');
  console.log('      - 30 participants with mixed ticket type assignments');
  console.log('      - 18 check-ins (6 checked out), hostel assignments');
  console.log('      - 7-day event snapshots for dashboard trend chart');
  console.log('  • Email: 1 draft campaign + 1 sent campaign');
  console.log('  • Expenses: 8 requests (paid × 2, approved × 3, pending × 2, rejected × 1)');
  console.log('═'.repeat(58) + '\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
