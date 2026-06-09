/**
 * MYS Platform — Demo Seed v4 (schema v4 exact)
 * node src/database/seed.demo.js
 *
 * Schema changes from v3:
 *  - participants: NO unique on email (family registrations)
 *  - events: ticket_prefix column
 *  - speakers: email, phone columns
 *  - lectures: youtube_url column
 *  - hostels: beds (not capacity)
 *  - souvenirs + souvenir_orders tables
 *  - event_gallery: google_drive_id column
 */

import { createPool } from 'mysql2/promise';
import bcrypt         from 'bcrypt';
import { randomUUID } from 'crypto';
import dotenv         from 'dotenv';
dotenv.config();

const pool = createPool({
  host:               process.env.DB_HOST    || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER    || 'root',
  password:           process.env.DB_PASS    || '',
  database:           process.env.DB_NAME    || 'mys_platform',
  multipleStatements: true,
  waitForConnections: true,
});

const q    = (...a) => pool.execute(...a);
const log  = (m) => console.log(`  ${m}`);
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + Date.now();
const tNum = (ed, n) => `${ed.toUpperCase()}-${new Date().getFullYear().toString().slice(-2)}-${String(n).padStart(6,'0')}`;
const tagN = (n) => `TAG-${String(n).padStart(3,'0')}`;

const upsertId = async (ins, insP, sel, selP) => {
  await q(ins, insP);
  const [[row]] = await q(sel, selP);
  if (!row) throw new Error('Lookup failed: ' + sel);
  return row.id;
};

const PEOPLE = [
  ['Abdullahi Musa',   'abdullahi.musa@gmail.com',    '08011111111','male',   'Student'      ],
  ['Fatima Ibrahim',   'fatima.ibrahim@yahoo.com',     '08022222222','female', 'Nurse'        ],
  ['Usman Aliyu',      'usman.aliyu@outlook.com',      '08033333333','male',   'Engineer'     ],
  ['Aisha Suleiman',   'aisha.suleiman@gmail.com',     '08044444444','female', 'Teacher'      ],
  ['Ibrahim Garba',    'ibrahim.garba@gmail.com',      '08055555555','male',   'Doctor'       ],
  ['Khadijah Yusuf',   'khadijah.yusuf@hotmail.com',   '08066666666','female', 'Accountant'   ],
  ['Mukhtar Bello',    'mukhtar.bello@gmail.com',      '08077777777','male',   'Lawyer'       ],
  ['Maryam Salisu',    'maryam.salisu@gmail.com',      '08088888888','female', 'Entrepreneur' ],
  ['Sulaiman Ahmed',   'sulaiman.ahmed@gmail.com',     '08099999999','male',   'Student'      ],
  ['Hafsa Mohammed',   'hafsa.mohammed@yahoo.com',     '08011222333','female', 'Student'      ],
  ['Nurudeen Lawal',   'nurudeen.lawal@gmail.com',     '08022333444','male',   'Banker'       ],
  ['Zainab Tijjani',   'zainab.tijjani@gmail.com',     '08033444555','female', 'Pharmacist'   ],
  ['Ismail Umar',      'ismail.umar@outlook.com',      '08044555666','male',   'Student'      ],
  ['Ruqayyah Hassan',  'ruqayyah.hassan@gmail.com',    '08055666777','female', 'Doctor'       ],
  ['Aminu Sani',       'aminu.sani@gmail.com',         '08066777888','male',   'Engineer'     ],
  ['Bilqis Abdullahi', 'bilqis.abdullahi@yahoo.com',   '08077888999','female', 'Student'      ],
  ['Yusuf Danjuma',    'yusuf.danjuma@gmail.com',      '08088999000','male',   'Architect'    ],
  ['Nana Idris',       'nana.idris@gmail.com',         '08099000111','female', 'Researcher'   ],
  ['Tajudeen Olawale', 'tajudeen.olawale@gmail.com',   '08012345678','male',   'Student'      ],
  ['Firdausi Garba',   'firdausi.garba@gmail.com',     '08023456789','female', 'Civil Servant'],
  ['Haruna Yakubu',    'haruna.yakubu@outlook.com',    '08034567890','male',   'Teacher'      ],
  ['Safiya Bashir',    'safiya.bashir@gmail.com',      '08045678901','female', 'Student'      ],
  ['Tukur Abdulkadir', 'tukur.abdulkadir@gmail.com',   '08056789012','male',   'Consultant'   ],
  ['Umma Ibrahim',     'umma.ibrahim@yahoo.com',       '08067890123','female', 'Nurse'        ],
  ['Kamal Hassan',     'kamal.hassan@gmail.com',       '08078901234','male',   'Student'      ],
  ['Asiya Musa',       'asiya.musa@gmail.com',         '08089012345','female', 'Journalist'   ],
  ['Bashir Usman',     'bashir.usman@outlook.com',     '08090123456','male',   'IT Officer'   ],
  ['Halima Sani',      'halima.sani@gmail.com',        '08001234567','female', 'Student'      ],
  ['Jibril Adamu',     'jibril.adamu@gmail.com',       '08012340987','male',   'Researcher'   ],
  ['Munirat Lawan',    'munirat.lawan@yahoo.com',      '08023451098','female', 'Economist'    ],
];

async function seed() {
  console.log('\n🌱  MYS Demo Seed v4\n');

  /* 1. DEPARTMENTS */
  console.log('🏢 Departments...');
  const deptId = {};
  for (const [name, description, head_name, sort_order] of [
    ['Kitchen & Catering','Food preparation and serving',         'Mama Zainab',  0],
    ['Gate & Security',   'Entry management and crowd control',   'Alhaji Bukar', 1],
    ['AV & Technical',    'Sound, projectors, live streaming',    'Engr. Seun',   2],
    ['Transport',         'Logistics and participant transport',   'Mallam Tunde', 3],
    ['Decoration',        'Venue decoration and signage',         'Sister Hafsa', 4],
  ]) {
    deptId[name] = await upsertId(
      'INSERT INTO departments (name,description,head_name,sort_order) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE head_name=VALUES(head_name)',
      [name,description,head_name,sort_order],
      'SELECT id FROM departments WHERE name=?',[name]
    );
    log(`✅ ${name}`);
  }

  /* 2. ADMINS */
  console.log('\n👤 Admins...');
  const pwA = await bcrypt.hash('MYS@Admin2024!',12);
  const pwG = await bcrypt.hash('attend123',12);
  const pwD = await bcrypt.hash('dept@123',12);
  const adminId = {};
  for (const [name,email,pw,role,deptName] of [
    ['MYS Super Admin', 'admin@muslimyouthsummit.com',   pwA,'super_admin',null              ],
    ['Coordinator Musa','musa@muslimyouthsummit.com',    pwA,'admin',      null              ],
    ['Sister Fatima',   'fatima@muslimyouthsummit.com',  pwA,'admin',      null              ],
    ['Gate Attendant',  'gate@muslimyouthsummit.com',    pwG,'attendant',  null              ],
    ['Kitchen Team',    'kitchen@muslimyouthsummit.com', pwD,'department', 'Kitchen & Catering'],
    ['AV Team',         'av@muslimyouthsummit.com',      pwD,'department', 'AV & Technical'  ],
  ]) {
    adminId[email] = await upsertId(
      'INSERT INTO admins (name,email,password,role,department_id) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
      [name,email,pw,role,deptName?deptId[deptName]:null],
      'SELECT id FROM admins WHERE email=?',[email]
    );
    const hint = role==='attendant'?'attend123':role==='department'?'dept@123':'MYS@Admin2024!';
    log(`✅ [${role}] ${email} / ${hint}`);
  }
  const SA = adminId['admin@muslimyouthsummit.com'];
  const A1 = adminId['musa@muslimyouthsummit.com'];

  /* 3. GLOBAL CATEGORIES */
  console.log('\n🏷  Categories...');
  for (const [name,description,color,capacity,sort_order] of [
    ['Youth (Under 25)',  'Young participants 18–25',    '#6BBC01',200,0],
    ['Graduate',          'MSc/PhD/postgraduate',        '#9333ea',100,1],
    ['Brothers (Seniors)','Male professionals 25+',      '#1a4fa0', 80,2],
    ['Sisters (Seniors)', 'Female professionals 25+',    '#c94d8c', 80,3],
  ]) {
    await q('INSERT INTO event_categories (name,description,color,capacity,sort_order) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE color=VALUES(color)',
      [name,description,color,capacity,sort_order]);
    log(`✅ ${name}`);
  }
  const [catRows] = await q('SELECT id,name FROM event_categories ORDER BY sort_order');
  const cMap={};for(const c of catRows)cMap[c.name]=c.id;
  const catYouth=cMap['Youth (Under 25)'],catGrad=cMap['Graduate'],catBro=cMap['Brothers (Seniors)'],catSis=cMap['Sisters (Seniors)'];

  /* 4. HOSTELS (beds column) */
  console.log('\n🏠 Hostels...');
  const hostelId={};
  for (const [name,gender,beds,location] of [
    ['Khadijah Hall','female',60,'Block A — Female Wing'],
    ['Umar Block',   'male',  60,'Block B — Male Wing'  ],
    ['VIP Annex',    'mixed', 20,'Main Building — Ground Floor'],
  ]) {
    hostelId[name] = await upsertId(
      'INSERT INTO hostels (name,gender,beds,location) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE beds=VALUES(beds)',
      [name,gender,beds,location],
      'SELECT id FROM hostels WHERE name=?',[name]
    );
    log(`✅ ${name} (${gender}, ${beds} beds)`);
  }
  const hostelF=hostelId['Khadijah Hall'],hostelM=hostelId['Umar Block'],hostelVIP=hostelId['VIP Annex'];

  /* 5. MYS2 — COMPLETED */
  console.log('\n📅 MYS2 (completed)...');
  const mys2Id = await upsertId(
    `INSERT INTO events (title,edition,slug,tagline,description,start_date,end_date,venue,venue_address,status,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status='completed'`,
    ['Muslim Youth Summit 2.0','MYS2',slug('mys2'),
     "Faith in Action — Building Tomorrow's Leaders Today",
     'The second edition brought together over 300 young Muslims for Islamic learning, career development, and spiritual renewal.',
     '2024-03-15','2024-03-16','Abuja National Mosque Conference Centre','Airport Road, Abuja, FCT','completed',SA],
    'SELECT id FROM events WHERE edition=?',['MYS2']
  );
  let s=0;
  for (const [url,cap] of [
    ['https://picsum.photos/seed/mys2a/800/600','Opening keynote session'],
    ['https://picsum.photos/seed/mys2b/800/600','Networking break'],
    ['https://picsum.photos/seed/mys2c/800/600','Award ceremony'],
    ['https://picsum.photos/seed/mys2d/800/600','Group photo'],
    ['https://picsum.photos/seed/mys2e/800/600','Workshop session'],
    ['https://picsum.photos/seed/mys2f/800/600','Guest speaker panel'],
  ]) { await q('INSERT IGNORE INTO event_gallery (event_id,image_url,caption,sort_order,uploaded_by) VALUES (?,?,?,?,?)',[mys2Id,url,cap,s++,SA]); }
  log(`✅ MYS2 + gallery`);

  /* 6. MYS3 — ACTIVE (with ticket_prefix) */
  console.log('\n📅 MYS3 (active)...');
  const yr=new Date().getFullYear()+1;
  const mys3Id = await upsertId(
    `INSERT INTO events (title,edition,ticket_prefix,slug,tagline,description,start_date,end_date,venue,venue_address,early_bird_closes_at,status,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status='active'`,
    ['Muslim Youth Summit 3.0','MYS3','MYS3',slug('mys3'),
     'Rooted in Faith. Rising in Excellence.',
     'MYS3 is a 2-day intensive programme equipping Muslim youth with Islamic knowledge, career skills, and a strong sense of community. Featuring renowned scholars, industry leaders, and interactive workshops.',
     `${yr}-07-12`,`${yr}-07-13`,'Lagos City Hall','25 Catholic Mission Street, Lagos Island, Lagos',
     `${yr}-06-30 23:59:59`,'active',SA],
    'SELECT id FROM events WHERE edition=?',['MYS3']
  );
  log(`✅ MYS3 id=${mys3Id} — ${yr}-07-12 to ${yr}-07-13`);

  /* 7. EVENT DAYS */
  for (const [day_number,event_date,theme] of [[1,`${yr}-07-12`,'Knowledge & Reformation'],[2,`${yr}-07-13`,'Career & Leadership']]) {
    await q('INSERT INTO event_days (event_id,day_number,event_date,theme) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE theme=VALUES(theme)',
      [mys3Id,day_number,event_date,theme]);
  }
  const [dayRows] = await q('SELECT id,day_number FROM event_days WHERE event_id=? ORDER BY day_number',[mys3Id]);
  const day1Id=dayRows[0].id, day2Id=dayRows[1]?.id||dayRows[0].id;
  log(`✅ Day1 id=${day1Id} Day2 id=${day2Id}`);

  /* 8. SPEAKERS (with email/phone) */
  console.log('\n🎤 Speakers...');
  const spkIds=[];
  for (const [name,title,bio,email,phone,sort_order] of [
    ['Sheikh Murtadha Gusau','Islamic Scholar & Jurist',   'Renowned scholar specialising in Fiqh and contemporary Muslim affairs.', 'sheikh.gusau@example.com','08011000001',0],
    ['Dr. Aisha Mahmoud',    'Career Development Expert',  'PhD in Organisational Psychology, University of Lagos. 15 years training professionals.','aisha.mahmoud@example.com','08022000002',1],
    ['Ustaz Ibrahim Aliyu',  'Youth Counsellor & Speaker', 'Founder Muslim Professionals Network Nigeria.','ustaz.aliyu@example.com','08033000003',2],
    ['Engr. Bilal Okafor',   'Tech Entrepreneur',          'CEO of PayLink fintech startup. Forbes Africa 30 Under 30.','bilal.okafor@example.com','08044000004',3],
  ]) {
    const [r] = await q('INSERT INTO speakers (event_id,name,title,bio,email,phone,sort_order) VALUES (?,?,?,?,?,?,?)',
      [mys3Id,name,title,bio,email,phone,sort_order]);
    spkIds.push(r.insertId);
    log(`✅ ${name}`);
  }
  const [spk0,spk1,spk2,spk3]=spkIds;

  /* 9. SCHEDULE (with youtube_url) */
  console.log('\n📋 Schedule...');
  const schedData=[
    [day1Id,1,'08:00','08:30','Registration & Welcome',                'other',  null,                    'Gate Attendant, Coordinator Musa',null,null],
    [day1Id,2,'08:30','09:00',"Fajr Prayer & Qur'an Recitation",       'prayer', null,                    'Ustaz Ibrahim Aliyu',             null,null],
    [day1Id,3,'09:00','10:00','Opening Keynote: Rooted in Faith',      'keynote','Sheikh Murtadha Gusau', 'Coordinator Musa, Sister Fatima', null,spk0],
    [day1Id,4,'10:15','11:30','Fiqh of the Contemporary Muslim',       'lecture','Sheikh Murtadha Gusau', 'Coordinator Musa',                'https://youtube.com/watch?v=demo1',spk0],
    [day1Id,5,'11:30','12:00','Networking Break',                      'break',  null,                    null,                              null,null],
    [day1Id,6,'12:00','13:00','Women in Islam: Empowerment & Identity','lecture','Dr. Aisha Mahmoud',     'Sister Fatima',                   null,spk1],
    [day1Id,7,'13:00','14:00','Dhuhr Prayer & Lunch',                  'prayer', null,                    null,                              null,null],
    [day1Id,8,'14:00','15:30','Career Development Workshop',           'workshop','Dr. Aisha Mahmoud',    'Coordinator Musa, Sister Fatima', null,spk1],
    [day1Id,9,'15:30','16:00','Asr Prayer',                            'prayer', null,                    'Ustaz Ibrahim Aliyu',             null,null],
    [day2Id,10,'08:30','09:30','Morning Reflection & Motivation',      'lecture','Ustaz Ibrahim Aliyu',   'Gate Attendant',                  null,spk2],
    [day2Id,11,'09:45','11:00','Tech & Entrepreneurship in Nigeria',   'lecture','Engr. Bilal Okafor',    'Coordinator Musa',                'https://youtube.com/watch?v=demo2',spk3],
    [day2Id,12,'11:15','12:30','Panel: Faith at the Workplace',        'panel',  'Dr. Aisha Mahmoud',    'Coordinator Musa, Sister Fatima', null,spk1],
    [day2Id,13,'12:30','13:30','Dhuhr Prayer & Lunch',                 'prayer', null,                    null,                              null,null],
    [day2Id,14,'13:30','15:00','Breakout Sessions by Category',        'workshop',null,                   'Coordinator Musa, Sister Fatima', null,null],
    [day2Id,15,'15:30','16:30','Closing Ceremony & Awards',            'other',  null,                    'Coordinator Musa',                null,null],
  ];
  for (const [event_day_id,s_n,st,et,title,ltype,speaker,fac,yt,spkId] of schedData) {
    const [r] = await q(
      `INSERT INTO lectures (event_id,event_day_id,s_n,title,lecture_type,main_speaker_name,facilitators,start_time,end_time,youtube_url,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [mys3Id,event_day_id,s_n,title,ltype,speaker,fac,st,et,yt,s_n]
    );
    if (spkId) await q('INSERT IGNORE INTO lecture_speakers (lecture_id,speaker_id,sort_order) VALUES (?,?,0)',[r.insertId,spkId]);
  }
  log(`✅ ${schedData.length} sessions`);

  /* 10. TICKET TYPES */
  console.log('\n🎟  Ticket types...');
  for (const [name,pc,desc,reg,eb,qty,sort] of [
    ['Regular – Undergraduate','undergraduate','For 100–400 level university students',3000,2000,200,0],
    ['Regular – Graduate',     'graduate',    'For MSc, PhD and postgraduate students',5000,3500,100,1],
    ['Professional',           'professional','For working professionals and alumni',   7000,5000, 80,2],
    ['VIP – With Accommodation','all',        'Includes 2-night hostel + priority seating',15000,12000,40,3],
  ]) {
    await q(`INSERT INTO ticket_types (event_id,name,participant_category,description,regular_price,early_bird_price,quantity_available,sort_order) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE regular_price=VALUES(regular_price)`,
      [mys3Id,name,pc,desc,reg,eb,qty,sort]);
  }
  const [ttRows] = await q('SELECT id,participant_category FROM ticket_types WHERE event_id=? ORDER BY sort_order',[mys3Id]);
  const ttUG=ttRows.find(t=>t.participant_category==='undergraduate')?.id;
  const ttGR=ttRows.find(t=>t.participant_category==='graduate')?.id;
  const ttPR=ttRows.find(t=>t.participant_category==='professional')?.id;
  const ttVIP=ttRows.find(t=>t.participant_category==='all')?.id;
  log(`✅ UG:${ttUG} Grad:${ttGR} Prof:${ttPR} VIP:${ttVIP}`);

  /* 11. PARTICIPANTS & TICKETS (no unique email constraint) */
  console.log('\n👥 Participants & tickets...');
  const getTT=(i)=>{
    if(i<5)  return{ttId:ttVIP, price:12000,isEB:1};
    if(i<12) return{ttId:ttUG,  price: 2000,isEB:1};
    if(i<19) return{ttId:ttGR,  price: 3500,isEB:1};
    if(i<26) return{ttId:ttPR,  price: 5000,isEB:1};
    return          {ttId:ttUG,  price: 3000,isEB:0};
  };
  const getCat=(i,g)=>{
    if(i<5)  return g==='female'?catSis:catBro;
    if(i<12) return catYouth;
    if(i<19) return catGrad;
    if(i<26) return g==='female'?catSis:catBro;
    return catYouth;
  };

  const partIds=[],ticketIds=[],sold={[ttVIP]:0,[ttUG]:0,[ttGR]:0,[ttPR]:0};

  for(let i=0;i<PEOPLE.length;i++){
    const [name,email,phone,gender,occupation]=PEOPLE[i];
    // Allow multiple per email — lookup by email+name
    const [ex] = await q('SELECT id FROM participants WHERE email=? AND name=?',[email.toLowerCase(),name.trim()]);
    let pId;
    if(ex.length){ pId=ex[0].id; await q('UPDATE participants SET phone=? WHERE id=?',[phone,pId]); }
    else{
      const [ins]=await q('INSERT INTO participants (name,email,phone,gender,occupation,email_subscribed) VALUES (?,?,?,?,?,1)',
        [name.trim(),email.toLowerCase(),phone,gender,occupation]);
      pId=ins.insertId;
    }
    partIds.push(pId);
    const{ttId,price,isEB}=getTT(i);
    const catId=getCat(i,gender);
    const uniqueNum=tNum('MYS3',i+1);
    const ref=`DEMO-${randomUUID().slice(0,8).toUpperCase()}`;
    const amtPaid=i>=25?Math.round(price*0.5):price;
    const balDue=price-amtPaid;
    const [tr]=await q(
      `INSERT INTO tickets (event_id,ticket_type_id,participant_id,category_id,unique_number,amount_paid,balance_due,payment_method,is_early_bird,status,purchased_at,paystack_reference)
       VALUES (?,?,?,?,?,?,?,'cash',?,'paid',NOW(),?)`,
      [mys3Id,ttId,pId,catId,uniqueNum,amtPaid,balDue,isEB,ref]
    );
    ticketIds.push(tr.insertId);
    sold[ttId]=(sold[ttId]||0)+1;
  }
  for(const [id,cnt] of Object.entries(sold)) if(cnt>0) await q('UPDATE ticket_types SET quantity_sold=? WHERE id=?',[cnt,id]);
  log(`✅ 30 tickets — VIP:${sold[ttVIP]} UG:${sold[ttUG]} Grad:${sold[ttGR]} Prof:${sold[ttPR]}`);

  /* 12. CHECK-INS & HOSTEL ASSIGNMENTS */
  console.log('\n✅ Check-ins...');
  for(let i=0;i<18;i++){
    const[,,, gender]=PEOPLE[i];
    const tId=ticketIds[i],pId=partIds[i],inHrs=18-i;
    const[et]=await q(`INSERT INTO event_tags (event_id,tag_number,ticket_id,participant_id,assigned_at,assigned_by) VALUES (?,?,?,?,DATE_SUB(NOW(),INTERVAL ? HOUR),?)`,
      [mys3Id,tagN(i+1),tId,pId,inHrs,A1]);
    const tagId=et.insertId;
    if(i<6){
      const outHrs=Math.max(1,Math.floor(inHrs/2));
      await q(`INSERT INTO attendance (event_id,ticket_id,tag_id,checked_in_at,checked_out_at,check_in_by) VALUES (?,?,?,DATE_SUB(NOW(),INTERVAL ? HOUR),DATE_SUB(NOW(),INTERVAL ? HOUR),?)`,
        [mys3Id,tId,tagId,inHrs,outHrs,A1]);
    } else {
      await q(`INSERT INTO attendance (event_id,ticket_id,tag_id,checked_in_at,checked_out_at,check_in_by) VALUES (?,?,?,DATE_SUB(NOW(),INTERVAL ? HOUR),NULL,?)`,
        [mys3Id,tId,tagId,inHrs,A1]);
    }
    const hId=i<5?hostelVIP:gender==='female'?hostelF:hostelM;
    await q(`INSERT INTO hostel_assignments (hostel_id,event_id,ticket_id,participant_id,room_number,assigned_by) VALUES (?,?,?,?,?,?)`,
      [hId,mys3Id,tId,pId,`Room ${i+1}`,A1]);
  }
  log(`✅ 18 check-ins (6 out), 18 hostel assignments`);

  /* 13. SNAPSHOTS */
  const today=new Date();
  for(const [dAgo,sold_,rev,cin,cout] of [[6,3,9000,0,0],[5,7,21000,0,0],[4,12,36000,0,0],[3,18,54500,0,0],[2,24,73000,0,0],[1,28,85500,0,0],[0,30,92000,18,6]]){
    const d=new Date(today);d.setDate(d.getDate()-dAgo);
    await q(`INSERT INTO event_snapshots (event_id,snapshot_date,tickets_sold,revenue,checked_in,checked_out) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE tickets_sold=VALUES(tickets_sold)`,
      [mys3Id,d.toISOString().slice(0,10),sold_,rev,cin,cout]);
  }
  log(`✅ 7 snapshots`);

  /* 14. EMAIL CAMPAIGNS */
  await q(`INSERT INTO email_campaigns (event_id,subject,body_html,recipient_type,status,created_by) VALUES (?,?,?,?,?,?)`,
    [mys3Id,'MYS3 Final Reminder!','<p>See you at MYS3!</p>','all','draft',SA]);
  await q(`INSERT INTO email_campaigns (event_id,subject,body_html,recipient_type,status,recipient_count,sent_count,failed_count,sent_at,created_by) VALUES (?,?,?,?,?,?,?,?,DATE_SUB(NOW(),INTERVAL 14 DAY),?)`,
    [mys2Id,'MYS3 Registration Open!','<p>Register now!</p>','past_attendees','sent',145,143,2,SA]);
  log(`✅ 2 email campaigns`);

  /* 15. EXPENSE REQUESTS */
  console.log('\n💰 Expenses...');
  const kitA=adminId['kitchen@muslimyouthsummit.com'];
  const KIT=deptId['Kitchen & Catering'],AV=deptId['AV & Technical'],TRN=deptId['Transport'];
  for(const[dId,title,amt,priority,status,appAmt,paidAmt,dAgo] of [
    [KIT,'Cooking gas — Day 1 & 2',45000,'urgent','paid',45000,45000,7],
    [KIT,'Food ingredients — Day 1',120000,'normal','approved',110000,null,4],
    [KIT,'Serving equipment hire',18000,'low','pending',null,null,2],
    [AV,'PA System & microphone hire',75000,'urgent','paid',75000,75000,8],
    [AV,'Live streaming equipment',55000,'normal','approved',50000,null,5],
    [AV,'Backup generator diesel',22000,'normal','pending',null,null,1],
    [TRN,'Bus hire — speaker pickups',80000,'urgent','approved',80000,null,4],
    [KIT,'Extra water dispensers',8000,'low','rejected',null,null,6],
  ]){
    const isApp=['approved','paid'].includes(status);
    const isPaid=status==='paid';
    await q(
      `INSERT INTO expense_requests (department_id,event_id,title,amount_requested,amount_approved,amount_paid,status,priority,raised_by,approved_by,paid_by,raise_note,approve_note,pay_note,created_at,approved_at,paid_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,DATE_SUB(NOW(),INTERVAL ? DAY),${isApp?'DATE_SUB(NOW(),INTERVAL ? DAY)':'NULL'},${isPaid?'DATE_SUB(NOW(),INTERVAL 1 DAY)':'NULL'})`,
      [dId,mys3Id,title,amt,appAmt||null,paidAmt||null,status,priority,kitA,isApp?SA:null,isPaid?SA:null,`Request: ${title}`,isApp&&status!=='rejected'?'Approved.':status==='rejected'?'Use existing budget.':null,isPaid?`MYS3-EXP-${Math.floor(Math.random()*9000+1000)}`:null,dAgo,...(isApp?[Math.max(1,dAgo-1)]:[])]
    );
    log(`✅ [${status}] ${title}`);
  }

  /* 16. SPONSORS */
  console.log('\n⭐ Sponsors...');
  const sponsorData = [
    // [event_id, name, logo_url, website_url, tier, sort_order]
    [mys3Id, 'Jaiz Bank', null, 'https://www.jaizbank.com', 'title',   0],
    [mys3Id, 'Lotus Bank', null, 'https://www.lotusbank.com', 'gold',  1],
    [mys3Id, 'Hayat Holdings', null, null, 'gold',   2],
    [mys3Id, 'Muslim News Nigeria', null, 'https://www.muslimnews.ng', 'media', 3],
    [null,   'TechMuslim Foundation', null, null, 'partner', 4],
  ];
  for (const [eventId_, name, logo_url, website_url, tier, sort_order] of sponsorData) {
    await q(
      'INSERT INTO sponsors (event_id,name,logo_url,website_url,tier,is_active,sort_order) VALUES (?,?,?,?,?,1,?) ON DUPLICATE KEY UPDATE tier=VALUES(tier)',
      [eventId_||null, name, logo_url||null, website_url||null, tier, sort_order]
    );
    log('✅ ' + tier.toUpperCase() + ': ' + name);
  }

  /* 17. SOUVENIRS */
  console.log('\n🛍  Souvenirs...');
  for(const [name,description,price,available_qty,sort_order] of [
    ['MYS3 T-Shirt','Premium cotton T-shirt with MYS3 design. Available in S, M, L, XL.',5000,100,0],
    ['MYS3 Notebook','A5 hardcover notebook with Islamic geometric design.',2500,200,1],
    ['MYS3 Tote Bag','Eco-friendly canvas tote bag with MYS logo.',3500,150,2],
    ['MYS3 Mug','Ceramic mug with MYS3 design and hadith inscription.',2000,80,3],
  ]){
    await q(`INSERT INTO souvenirs (event_id,name,description,price,available_qty,sort_order) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE price=VALUES(price)`,
      [mys3Id,name,description,price,available_qty,sort_order]);
    log(`✅ ${name} — ₦${price.toLocaleString()}`);
  }

  const D='═'.repeat(62);
  console.log('\n'+D+'\n🎉  MYS Demo Seed v4 — Complete!\n');
  console.log('  LOGINS:');
  console.log('  super_admin  admin@muslimyouthsummit.com  MYS@Admin2024!');
  console.log('  admin        musa@muslimyouthsummit.com   MYS@Admin2024!');
  console.log('  admin        fatima@muslimyouthsummit.com MYS@Admin2024!');
  console.log('  attendant    gate@muslimyouthsummit.com   attend123');
  console.log('  department   kitchen@/av@muslimyouthsummit.com  dept@123');
  console.log('\n  DATA: 5 depts, 6 admins, 4 categories, 3 hostels,');
  console.log('  MYS2 (completed+gallery), MYS3 (active, full data),');
  console.log('  30 participants, 15 session schedule, 4 souvenirs,');
  console.log('  8 expense requests, 2 email campaigns');
  console.log(D+'\n');

  await pool.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
