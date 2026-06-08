/**
 * MYS Platform — Demo Seed
 * Populates the database with realistic sample data for the MYS team.
 *
 * Run: node src/database/seed.demo.js
 *
 * Creates:
 *  - 1 super admin + 2 admins + 1 attendant
 *  - Global categories (Youth, Professionals, Sisters, Brothers)
 *  - 3 hostels (male, female, mixed)
 *  - 1 completed past event (MYS2) with gallery placeholder
 *  - 1 active event (MYS3) with days, speakers, schedule, ticket types
 *  - 30 demo participants with paid tickets
 *  - 15 check-ins with tag and hostel assignments
 *  - 1 draft email campaign
 */

import { createPool } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const pool = createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'mys_platform',
  multipleStatements: true,
});

const q = (...args) => pool.execute(...args);
const log = (msg) => console.log(`  ${msg}`);

/* ─── Helpers ─────────────────────────────────────────────── */
const slug = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

const ticketNum = (edition, seq) =>
  `${edition}-${String(seq).padStart(4, '0')}`;

const tagNum = (seq) => `TAG-${String(seq).padStart(3, '0')}`;

const nigerianNames = [
  ['Abdullahi Musa',      'abdullahi.musa@gmail.com',      '08011111111', 'male'],
  ['Fatima Ibrahim',      'fatima.ibrahim@yahoo.com',       '08022222222', 'female'],
  ['Usman Aliyu',         'usman.aliyu@outlook.com',        '08033333333', 'male'],
  ['Aisha Suleiman',      'aisha.suleiman@gmail.com',       '08044444444', 'female'],
  ['Ibrahim Garba',       'ibrahim.garba@gmail.com',        '08055555555', 'male'],
  ['Khadijah Yusuf',      'khadijah.yusuf@hotmail.com',     '08066666666', 'female'],
  ['Mukhtar Bello',       'mukhtar.bello@gmail.com',        '08077777777', 'male'],
  ['Maryam Salisu',       'maryam.salisu@gmail.com',        '08088888888', 'female'],
  ['Sulaiman Ahmed',      'sulaiman.ahmed@gmail.com',       '08099999999', 'male'],
  ['Hafsa Mohammed',      'hafsa.mohammed@yahoo.com',       '08011222333', 'female'],
  ['Nurudeen Lawal',      'nurudeen.lawal@gmail.com',       '08022333444', 'male'],
  ['Zainab Tijjani',      'zainab.tijjani@gmail.com',       '08033444555', 'female'],
  ['Ismail Umar',         'ismail.umar@outlook.com',        '08044555666', 'male'],
  ['Ruqayyah Hassan',     'ruqayyah.hassan@gmail.com',      '08055666777', 'female'],
  ['Aminu Sani',          'aminu.sani@gmail.com',           '08066777888', 'male'],
  ['Bilqis Abdullahi',    'bilqis.abdullahi@yahoo.com',     '08077888999', 'female'],
  ['Yusuf Danjuma',       'yusuf.danjuma@gmail.com',        '08088999000', 'male'],
  ['Nana Idris',          'nana.idris@gmail.com',           '08099000111', 'female'],
  ['Tajudeen Olawale',    'tajudeen.olawale@gmail.com',     '08012345678', 'male'],
  ['Firdausi Garba',      'firdausi.garba@gmail.com',       '08023456789', 'female'],
  ['Haruna Yakubu',       'haruna.yakubu@outlook.com',      '08034567890', 'male'],
  ['Safiya Bashir',       'safiya.bashir@gmail.com',        '08045678901', 'female'],
  ['Tukur Abdulkadir',    'tukur.abdulkadir@gmail.com',     '08056789012', 'male'],
  ['Umma Ibrahim',        'umma.ibrahim@yahoo.com',         '08067890123', 'female'],
  ['Kamal Hassan',        'kamal.hassan@gmail.com',         '08078901234', 'male'],
  ['Asiya Musa',          'asiya.musa@gmail.com',           '08089012345', 'female'],
  ['Bashir Usman',        'bashir.usman@outlook.com',       '08090123456', 'male'],
  ['Halima Sani',         'halima.sani@gmail.com',          '08001234567', 'female'],
  ['Jibril Adamu',        'jibril.adamu@gmail.com',         '08012340987', 'male'],
  ['Munirat Lawan',       'munirat.lawan@yahoo.com',        '08023451098', 'female'],
];

/* ─── Main seed ──────────────────────────────────────────── */
async function seed() {
  console.log('\n🌱 MYS Demo Seed — Starting...\n');

  /* ── 1. Admins ──────────────────────────────────────────── */
  console.log('👤 Creating admin accounts...');
  const pwHash = await bcrypt.hash('MYS@Admin2024!', 12);
  const attHash = await bcrypt.hash('attend123', 12);

  const admins = [
    ['MYS Super Admin',   'admin@muslimyouthsummit.com',   pwHash,  'super_admin'],
    ['Coordinator Musa',  'musa@muslimyouthsummit.com',    pwHash,  'admin'],
    ['Sister Fatima',     'fatima@muslimyouthsummit.com',  pwHash,  'admin'],
    ['Gate Attendant',    'gate@muslimyouthsummit.com',    attHash, 'attendant'],
  ];

  const adminIds = [];
  for (const [name, email, pw, role] of admins) {
    const [r] = await q(
      `INSERT INTO admins (name, email, password, role) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role)`,
      [name, email, pw, role]
    );
    adminIds.push(r.insertId || r.insertId);
    log(`✅ ${role}: ${email} / ${role === 'attendant' ? 'attend123' : 'MYS@Admin2024!'}`);
  }

  // Re-fetch admin IDs to be safe
  const [[superAdmin]] = await q("SELECT id FROM admins WHERE email='admin@muslimyouthsummit.com'");
  const [[admin1]]     = await q("SELECT id FROM admins WHERE email='musa@muslimyouthsummit.com'");
  const superAdminId = superAdmin.id;
  const admin1Id     = admin1.id;

  /* ── 2. Global categories ───────────────────────────────── */
  console.log('\n🏷  Creating categories...');
  const categoryData = [
    ['Youth (Under 25)',    'Young participants aged 18-25',              '#6BBC01', 150, 0],
    ['Professionals',       'Working professionals and graduates',         '#02462E', 100, 1],
    ['Brothers (Seniors)',  'Male participants 26 and above',             '#1a4fa0', 80,  2],
    ['Sisters (Seniors)',   'Female participants 26 and above',           '#c94d8c', 80,  3],
  ];
  const catIds = [];
  for (const [name, description, color, capacity, sort] of categoryData) {
    const [r] = await q(
      `INSERT INTO event_categories (name, description, color, capacity, sort_order)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE description=VALUES(description)`,
      [name, description, color, capacity, sort]
    );
    catIds.push(r.insertId);
    log(`✅ Category: ${name}`);
  }
  // Re-fetch
  const [cats] = await q('SELECT id FROM event_categories ORDER BY sort_order');
  const [catYouth, catProf, catBro, catSis] = cats.map(c => c.id);

  /* ── 3. Hostels ─────────────────────────────────────────── */
  console.log('\n🏠 Creating hostels...');
  const hostelData = [
    ['Khadijah Hall',   'female', 60, 'Block A — Female Wing'],
    ['Umar Block',      'male',   60, 'Block B — Male Wing'],
    ['VIP Annex',       'mixed',  20, 'Main Building — Ground Floor'],
  ];
  const hostelIds = [];
  for (const [name, gender, capacity, location] of hostelData) {
    const [r] = await q(
      `INSERT INTO hostels (name, gender, capacity, location, sort_order)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE capacity=VALUES(capacity)`,
      [name, gender, capacity, location, hostelIds.length]
    );
    hostelIds.push(r.insertId);
    log(`✅ Hostel: ${name} (${gender}, ${capacity} beds)`);
  }
  const [hostelFemale, hostelMale, hostelVIP] = hostelIds;

  /* ── 4. Past event: MYS2 ────────────────────────────────── */
  console.log('\n📅 Creating MYS2 (completed past event)...');
  const [mys2Res] = await q(
    `INSERT INTO events
       (title, edition, slug, tagline, description, start_date, end_date,
        venue, venue_address, status, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE status='completed'`,
    [
      'Muslim Youth Summit 2.0', 'MYS2',
      slug('mys2-muslim-youth-summit'),
      'Faith in Action — Building Tomorrow\'s Leaders Today',
      'The second edition of the annual Muslim Youth Summit brought together over 300 young Muslim professionals and students for a day of learning, networking, and spiritual renewal.',
      '2024-03-15', '2024-03-16',
      'Abuja National Mosque Conference Centre', 'Airport Road, Abuja, FCT',
      'completed', superAdminId,
    ]
  );
  const mys2Id = mys2Res.insertId;
  log(`✅ MYS2 created (completed)`);

  /* ── 5. Active event: MYS3 ──────────────────────────────── */
  console.log('\n📅 Creating MYS3 (active event)...');
  const nextYear = new Date().getFullYear() + 1;
  const [mys3Res] = await q(
    `INSERT INTO events
       (title, edition, slug, tagline, description, start_date, end_date,
        venue, venue_address, early_bird_closes_at, status, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE status='active'`,
    [
      'Muslim Youth Summit 3.0', 'MYS3',
      slug('mys3-muslim-youth-summit'),
      'Rooted in Faith. Rising in Excellence.',
      'MYS3 is a full-day programme designed to equip Muslim youth with Islamic knowledge, career skills, and a strong sense of community. Featuring renowned scholars, industry leaders, and interactive workshops.',
      `${nextYear}-07-12`, `${nextYear}-07-13`,
      'Lagos City Hall', '25 Catholic Mission Street, Lagos Island, Lagos',
      `${nextYear}-06-30 23:59:59`,
      'active', superAdminId,
    ]
  );
  const mys3Id = mys3Res.insertId;
  log(`✅ MYS3 created (active) — ${nextYear}-07-12 to ${nextYear}-07-13`);

  /* ── 6. Event days for MYS3 ─────────────────────────────── */
  await q(
    `INSERT INTO event_days (event_id, day_number, event_date, theme) VALUES
     (?, 1, ?, 'Knowledge & Reformation'),
     (?, 2, ?, 'Career & Leadership')
     ON DUPLICATE KEY UPDATE theme=VALUES(theme)`,
    [mys3Id, `${nextYear}-07-12`, mys3Id, `${nextYear}-07-13`]
  );
  const [days] = await q('SELECT id, day_number FROM event_days WHERE event_id=? ORDER BY day_number', [mys3Id]);
  const [day1, day2] = days.map(d => d.id);
  log(`✅ Event days created`);

  /* ── 7. Speakers ─────────────────────────────────────────── */
  console.log('\n🎤 Creating speakers...');
  const speakerData = [
    ['Sheikh Murtadha Gusau',    'Islamic Scholar', 'Renowned scholar specialising in Fiqh and contemporary Muslim affairs. Author of several books on Islamic jurisprudence.', null],
    ['Dr. Aisha Mahmoud',        'Career Development Expert', 'PhD in Organisational Psychology. 15 years experience training young professionals across West Africa.', null],
    ['Ustaz Ibrahim Aliyu',      'Motivational Speaker', 'Youth counsellor and founder of the Muslim Professionals Network Nigeria.', null],
    ['Engr. Bilal Okafor',       'Tech Entrepreneur', 'CEO of a Lagos-based fintech startup. Forbes Africa 30 Under 30 nominee.', null],
  ];
  const speakerIds = [];
  for (const [name, title, bio, photo] of speakerData) {
    const [r] = await q(
      `INSERT INTO speakers (event_id, name, title, bio, photo_url, sort_order) VALUES (?,?,?,?,?,?)`,
      [mys3Id, name, title, bio, photo, speakerIds.length]
    );
    speakerIds.push(r.insertId);
    log(`✅ Speaker: ${name}`);
  }

  /* ── 8. Schedule ─────────────────────────────────────────── */
  console.log('\n📋 Creating schedule...');
  const scheduleData = [
    // [day_id, s_n, start, end, title, type, speaker, facilitators]
    [day1, 1, '08:00', '08:30', 'Registration & Welcome',           'other',    null,                        'Gate Attendant, Coordinator Musa'],
    [day1, 2, '08:30', '09:00', 'Fajr Prayer & Recitation',          'prayer',   null,                        'Ustaz Ibrahim Aliyu'],
    [day1, 3, '09:00', '10:00', 'Opening Keynote: Rooted in Faith',  'keynote',  'Sheikh Murtadha Gusau',     'Coordinator Musa, Sister Fatima'],
    [day1, 4, '10:15', '11:30', 'Islamic Jurisprudence in Modern Life', 'lecture', 'Sheikh Murtadha Gusau',   'Coordinator Musa'],
    [day1, 5, '11:30', '12:00', 'Networking Break',                  'break',    null,                        null],
    [day1, 6, '12:00', '13:00', 'Women in Islam: Empowerment & Identity', 'lecture', 'Dr. Aisha Mahmoud',   'Sister Fatima'],
    [day1, 7, '13:00', '14:00', 'Dhuhr Prayer & Lunch Break',        'prayer',   null,                        null],
    [day1, 8, '14:00', '15:30', 'Career Development Workshop',       'workshop', 'Dr. Aisha Mahmoud',         'Coordinator Musa, Sister Fatima'],
    [day2, 9, '08:00', '09:00', 'Morning Session: Asr Reflections',  'lecture',  'Ustaz Ibrahim Aliyu',       'Gate Attendant'],
    [day2, 10,'09:15', '10:30', 'Tech & Entrepreneurship in Nigeria', 'lecture', 'Engr. Bilal Okafor',       'Coordinator Musa'],
    [day2, 11,'10:30', '11:30', 'Panel: Faith at the Workplace',     'panel',    'Dr. Aisha Mahmoud',         'Coordinator Musa, Sister Fatima'],
    [day2, 12,'12:00', '13:00', 'Closing Ceremony & Awards',         'other',    null,                        'Coordinator Musa'],
  ];

  for (const [dayId, sn, start, end, title, type, speaker, fac] of scheduleData) {
    await q(
      `INSERT INTO lectures
         (event_id, event_day_id, title, lecture_type, start_time, end_time,
          main_speaker_name, facilitators, s_n, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [mys3Id, dayId, title, type, start, end, speaker, fac, sn, sn]
    );
  }
  log(`✅ ${scheduleData.length} schedule entries created`);

  /* ── 9. Ticket types ─────────────────────────────────────── */
  console.log('\n🎟  Creating ticket types...');
  const [regTT] = await q(
    `INSERT INTO ticket_types (event_id, name, participant_category, description, regular_price, early_bird_price, quantity_available, sort_order)
     VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE regular_price=VALUES(regular_price)`,
    [mys3Id, 'Regular – Undergraduate', 'undergraduate', 'For 100–400 level university students', 3000, 2000, 150, 0]
  );
  const [regGrad] = await q(
    `INSERT INTO ticket_types (event_id, name, participant_category, description, regular_price, early_bird_price, quantity_available, sort_order)
     VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE regular_price=VALUES(regular_price)`,
    [mys3Id, 'Regular – Graduate', 'graduate', 'For postgraduate students and recent graduates', 5000, 3500, 100, 1]
  );
  const [vipTT] = await q(
    `INSERT INTO ticket_types (event_id, name, participant_category, description, regular_price, early_bird_price, quantity_available, sort_order)
     VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE regular_price=VALUES(regular_price)`,
    [mys3Id, 'VIP – With Accommodation', 'all', 'Includes 2-night hostel accommodation', 15000, 12000, 40, 2]
  );
  const [ttRows] = await q('SELECT id FROM ticket_types WHERE event_id=? ORDER BY sort_order', [mys3Id]);
  const [regularTT, gradTT, vipTTId] = ttRows.map(t => t.id);
  log(`✅ Ticket types: Regular (₦5,000 / EB ₦3,500) + VIP (₦15,000 / EB ₦12,000)`);

  /* ── 10. Participants & Tickets ──────────────────────────── */
  console.log('\n👥 Creating 30 participants with tickets...');
  const partIds = [];
  const ticketIds = [];

  for (let i = 0; i < nigerianNames.length; i++) {
    const [name, email, phone, gender] = nigerianNames[i];
    const occupations = ['Student', 'Engineer', 'Teacher', 'Doctor', 'Accountant', 'Lawyer', 'Banker', 'Entrepreneur'];
    const occupation  = occupations[i % occupations.length];

    // Participant
    const [pRes] = await q(
      `INSERT INTO participants (name, email, phone, gender, occupation)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [name, email, phone, gender, occupation]
    );
    const partId = pRes.insertId;
    partIds.push(partId);

    // Ticket type: first 5 get VIP, rest get regular
    const isVIP    = i < 5;
    const ttId     = isVIP ? vipTTId : regularTT;
    const price    = isVIP ? 12000 : 3500; // early bird pricing
    const uniqNum  = ticketNum('MYS3', i + 1);
    const catId    = gender === 'female'
      ? (i < 10 ? catSis : catYouth)
      : (i < 10 ? catBro : catProf);

    const [tRes] = await q(
      `INSERT INTO tickets
         (event_id, ticket_type_id, participant_id, category_id,
          unique_number, amount_paid, is_early_bird, status, purchased_at,
          paystack_reference)
       VALUES (?,?,?,?,?,?,1,'paid',NOW(),?)`,
      [mys3Id, ttId, partId, catId, uniqNum, price, `DEMO-${randomUUID().slice(0,8).toUpperCase()}`]
    );
    ticketIds.push(tRes.insertId);
  }

  // Update quantity_sold
  await q(
    'UPDATE ticket_types SET quantity_sold=? WHERE id=?', [5, vipTTId]
  );
  await q(
    'UPDATE ticket_types SET quantity_sold=? WHERE id=?', [25, regularTT]
  );
  log(`✅ 30 participants + tickets created`);

  /* ── 11. Check-ins (first 15 participants) ───────────────── */
  console.log('\n✅ Creating check-in records...');
  for (let i = 0; i < 15; i++) {
    const tagNumber = tagNum(i + 1);
    const tId = ticketIds[i];
    const [name,,, gender] = nigerianNames[i];

    // Create/assign event tag
    const [etRes] = await q(
      `INSERT INTO event_tags (event_id, tag_number, ticket_id, participant_id, assigned_at, assigned_by)
       VALUES (?,?,?,?,NOW(),?)`,
      [mys3Id, tagNumber, tId, partIds[i], admin1Id]
    );
    const tagId = etRes.insertId;

    // Attendance record
    const checkedOut = i < 5; // first 5 also checked out
    await q(
      `INSERT INTO attendance
         (event_id, ticket_id, tag_id, checked_in_at, checked_out_at, check_in_by)
       VALUES (?,?,?,DATE_SUB(NOW(), INTERVAL ? HOUR),?,?)`,
      [mys3Id, tId, tagId, i + 1,
       checkedOut ? `DATE_SUB(NOW(), INTERVAL ${i} HOUR)` : null,
       admin1Id]
    );

    // Hostel assignment (VIP → VIP Annex, male → Umar, female → Khadijah)
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
  log(`✅ 15 check-ins created (5 also checked out)`);

  /* ── 12. Draft email campaign ────────────────────────────── */
  console.log('\n✉  Creating draft email campaign...');
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
  <p style="color:#444;line-height:1.7">MYS3 is just around the corner and we cannot wait to see you!</p>
  <div style="background:#02462E;color:white;padding:20px;margin:20px 0">
    <h2 style="margin:0 0 8px;color:#FEC700">Muslim Youth Summit 3.0</h2>
    <p style="margin:0;color:rgba(255,255,255,0.8)">July 12–13 · Lagos City Hall</p>
  </div>
  <p style="color:#444">Please remember to bring your ticket QR code for check-in. We look forward to a memorable experience together.</p>
  <p style="color:#888;font-size:13px;margin-top:24px">The MYS Team · Muslim Youth Summit</p>
</div>`,
      'all',
      'draft',
      superAdminId,
    ]
  );
  log(`✅ Draft email campaign created`);

  /* ── 13. Summary ─────────────────────────────────────────── */
  console.log('\n' + '═'.repeat(55));
  console.log('🎉  Demo seed complete!\n');
  console.log('  Admin logins:');
  console.log('  ┌─────────────────────────────────────────────────┐');
  console.log('  │ Super Admin  admin@muslimyouthsummit.com         │');
  console.log('  │ Admin        musa@muslimyouthsummit.com          │');
  console.log('  │ Admin        fatima@muslimyouthsummit.com        │');
  console.log('  │ Attendant    gate@muslimyouthsummit.com          │');
  console.log('  │ Password     MYS@Admin2024! (all except gate)    │');
  console.log('  │ Gate pass    attend123                           │');
  console.log('  └─────────────────────────────────────────────────┘');
  console.log('\n  Data summary:');
  console.log('  • 4 admin/attendant accounts');
  console.log('  • 4 global categories');
  console.log('  • 3 hostels (male, female, VIP)');
  console.log('  • MYS2 (completed past event)');
  console.log('  • MYS3 (active event with full programme)');
  console.log('    - 4 speakers, 12 schedule entries');
  console.log('    - 3 ticket types: Undergrad ₦3k/₦2k, Grad ₦5k/₦3.5k, VIP ₦15k/₦12k');
  console.log('    - 30 participants with paid tickets');
  console.log('    - 15 check-ins, hostel assignments');
  console.log('  • 1 draft email campaign');
  console.log('═'.repeat(55) + '\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Demo seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
