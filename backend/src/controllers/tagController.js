import { query, transaction } from '../database/db.js';
import { success, created, error, notFound as notFoundRes } from '../utils/response.js';
import { generateQRCodeSVG, tagQRData } from '../services/qrcodeService.js';
import { generateTagNumber } from '../utils/helpers.js';

/* ── Generate tags ──────────────────────────────────────────── */
export const generateTags = async (req, res, next) => {
  try {
    const { event_id, count } = req.body;
    if (!count || count < 1 || count > 2000)
      return error(res, 'Count must be between 1 and 2000.');

    const [events] = await query('SELECT id FROM events WHERE id = ?', [event_id]);
    if (!events.length) return notFoundRes(res, 'Event');

    const [[{ currentCount }]] = await query(
      'SELECT COUNT(*) AS currentCount FROM event_tags WHERE event_id = ?', [event_id]
    );

    const tags = [];
    await transaction(async (conn) => {
      for (let i = 0; i < count; i++) {
        const tagNumber = generateTagNumber(currentCount + i + 1);
        const qrSvg     = await generateQRCodeSVG(tagQRData(tagNumber, event_id));
        const [r] = await conn.execute(
          'INSERT INTO event_tags (event_id, tag_number, qr_code_svg) VALUES (?, ?, ?)',
          [event_id, tagNumber, qrSvg]
        );
        tags.push({ id: r.insertId, tag_number: tagNumber });
      }
    });

    created(res, { generated: count, tags }, `${count} tags generated.`);
  } catch (e) { next(e); }
};

/* ── List tags ──────────────────────────────────────────────── */
export const listTags = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const [rows] = await query(
      `SELECT t.*, p.name AS participant_name, p.email AS participant_email,
              c.name AS category_name, c.color AS category_color
       FROM event_tags t
       LEFT JOIN participants p  ON p.id = t.participant_id
       LEFT JOIN tickets tk      ON tk.id = t.ticket_id
       LEFT JOIN event_categories c ON c.id = tk.category_id
       WHERE t.event_id = ?
       ORDER BY t.tag_number`,
      [eventId]
    );
    success(res, rows);
  } catch (e) { next(e); }
};

/* ── Assign tag to participant ──────────────────────────────── */
export const assignTag = async (req, res, next) => {
  try {
    const { tag_number, ticket_id, event_id } = req.body;
    if (!tag_number || !ticket_id)
      return error(res, 'tag_number and ticket_id are required.');

    // Find the tag
    const [tags] = await query(
      'SELECT * FROM event_tags WHERE tag_number = ? AND event_id = ?',
      [tag_number.toUpperCase(), event_id]
    );
    if (!tags.length) return notFoundRes(res, 'Tag');
    if (tags[0].ticket_id) return error(res, `Tag ${tag_number} is already assigned.`, 409);

    const [[ticket]] = await query('SELECT participant_id FROM tickets WHERE id=?', [ticket_id]);
    if (!ticket) return notFoundRes(res, 'Ticket');

    await query(
      `UPDATE event_tags SET ticket_id=?, participant_id=?, assigned_at=NOW(), assigned_by=?
       WHERE id=?`,
      [ticket_id, ticket.participant_id, req.admin?.id || null, tags[0].id]
    );
    success(res, null, `Tag ${tag_number} assigned successfully.`);
  } catch (e) { next(e); }
};

/* ── Tag stats ──────────────────────────────────────────────── */
export const tagStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const [[stats]] = await query(
      `SELECT
         COUNT(*)                              AS total,
         SUM(ticket_id IS NOT NULL)            AS assigned,
         SUM(ticket_id IS NULL)                AS unassigned,
         SUM(is_printed = 1)                   AS printed
       FROM event_tags WHERE event_id = ?`,
      [eventId]
    );
    success(res, stats);
  } catch (e) { next(e); }
};

/* ── Printable tag badges — 4-up A4 layout ──────────────────── */
export const getPrintableTags = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { ids, unassigned_only } = req.query;

    // Get event info
    const [[event]] = await query(
      'SELECT title, edition, start_date, end_date, venue FROM events WHERE id = ?',
      [eventId]
    );
    if (!event) return notFoundRes(res, 'Event');

    // Build WHERE clause
    let where = 'WHERE t.event_id = ?';
    const params = [eventId];
    if (ids) {
      const idList = ids.split(',').map(Number).filter(Boolean);
      if (idList.length) { where += ` AND t.id IN (${idList.join(',')})`; }
    }
    if (unassigned_only === '1') where += ' AND t.ticket_id IS NULL';

    const [tags] = await query(
      `SELECT t.id, t.tag_number, t.qr_code_svg, t.is_printed,
              p.name AS participant_name, p.gender,
              c.name AS category_name, c.color AS category_color
       FROM event_tags t
       LEFT JOIN participants p  ON p.id  = t.participant_id
       LEFT JOIN tickets tk      ON tk.id = t.ticket_id
       LEFT JOIN event_categories c ON c.id = tk.category_id
       ${where}
       ORDER BY t.tag_number
       LIMIT 500`,
      params
    );

    if (!tags.length) {
      res.setHeader('Content-Type', 'text/html');
      return res.send('<html><body style="font-family:sans-serif;padding:40px"><h2>No tags found.</h2></body></html>');
    }

    const fmtDate = (d) => {
      if (!d) return '';
      try { return new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}); }
      catch { return String(d).slice(0,10); }
    };
    const eventDate = fmtDate(event.start_date);

    // Build tag cards HTML
    const tagCard = (tag) => `
      <div class="tag-card${tag.ticket_id ? '' : ' unassigned'}">
        <div class="tag-top-stripe" style="background:${tag.category_color || '#02462E'}"></div>
        <div class="tag-header">
          <div class="tag-event-name">${event.title}</div>
          <div class="tag-edition">${event.edition}</div>
        </div>
        <div class="tag-body">
          <div class="tag-left">
            <div class="tag-name">${tag.participant_name || 'UNASSIGNED'}</div>
            <div class="tag-number">${tag.tag_number}</div>
            ${tag.category_name
              ? `<div class="tag-category" style="background:${tag.category_color || '#02462E'}22;color:${tag.category_color || '#02462E'};border:1px solid ${tag.category_color || '#02462E'}50">${tag.category_name}</div>`
              : '<div class="tag-category-empty">Assign at gate</div>'}
            <div class="tag-event-date">${eventDate}${event.venue ? ' · ' + event.venue.split(',')[0] : ''}</div>
          </div>
          <div class="tag-qr">
            ${tag.qr_code_svg || `<div style="width:90px;height:90px;border:2px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999">${tag.tag_number}</div>`}
          </div>
        </div>
      </div>`;

    // Chunk tags into groups of 4 (2×2 per page)
    const pages = [];
    for (let i = 0; i < tags.length; i += 4) {
      pages.push(tags.slice(i, i + 4));
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Event Tags — ${event.title} ${event.edition}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #f5f5f5; }

    /* ── Print page setup ── */
    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    .print-page {
      width: 210mm;
      min-height: 297mm;
      background: white;
      margin: 0 auto 20px;
      padding: 8mm;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 0;
      page-break-after: always;
    }

    /* ── Cut line cell ── */
    .tag-cell {
      position: relative;
      padding: 4mm;
    }
    /* Horizontal cut line between rows */
    .tag-cell:nth-child(1),
    .tag-cell:nth-child(2) {
      border-bottom: 1.5px dashed #bbb;
    }
    /* Vertical cut line between columns */
    .tag-cell:nth-child(odd) {
      border-right: 1.5px dashed #bbb;
    }

    /* Cut corner markers */
    .tag-cell::before,
    .tag-cell::after {
      content: '✂';
      position: absolute;
      font-size: 12px;
      color: #ccc;
      line-height: 1;
    }
    .tag-cell:nth-child(1)::before  { top:  -10px; right: -8px; transform: rotate(180deg); }
    .tag-cell:nth-child(2)::before  { top:  -10px; left:  -8px; }
    .tag-cell:nth-child(1)::after   { bottom: -10px; right: -8px; transform: rotate(90deg); }
    .tag-cell:nth-child(2)::after   { bottom: -10px; left:  -8px; transform: rotate(270deg); }

    /* ── Tag card design ── */
    .tag-card {
      width: 100%;
      height: 100%;
      border: 1.5px solid #02462E;
      background: #FBF6E6;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 120mm;
    }
    .tag-card.unassigned {
      border-color: #ccc;
      background: #fafafa;
      opacity: 0.7;
    }

    .tag-top-stripe {
      height: 6px;
      flex-shrink: 0;
    }

    .tag-header {
      background: #02462E;
      color: white;
      padding: 6px 10px 4px;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .tag-event-name {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: -0.3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tag-edition {
      font-size: 9px;
      font-weight: 700;
      color: #FEC700;
      letter-spacing: 0.1em;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .tag-body {
      flex: 1;
      padding: 8px 10px;
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .tag-left {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tag-name {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 15px;
      color: #02462E;
      line-height: 1.15;
      word-break: break-word;
    }

    .tag-number {
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 13px;
      color: #555;
      letter-spacing: 0.1em;
      background: white;
      border: 1px solid #ddd;
      padding: 2px 6px;
      display: inline-block;
      margin-top: 2px;
    }

    .tag-category {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      padding: 2px 8px;
      border-radius: 2px;
      display: inline-block;
      margin-top: 2px;
    }
    .tag-category-empty {
      font-size: 9px;
      color: #aaa;
      font-style: italic;
      margin-top: 2px;
    }

    .tag-event-date {
      font-size: 9px;
      color: #888;
      margin-top: auto;
      padding-top: 6px;
    }

    .tag-qr {
      flex-shrink: 0;
      width: 90px;
    }
    .tag-qr svg {
      width: 90px !important;
      height: 90px !important;
    }

    /* ── Instructions bar ── */
    .tag-footer {
      background: #02462E;
      color: rgba(255,255,255,0.5);
      font-size: 8px;
      padding: 3px 10px;
      text-align: center;
      letter-spacing: 0.1em;
    }

    /* ── Screen-only ── */
    .no-print {
      text-align: center;
      padding: 24px;
      font-family: 'DM Sans', sans-serif;
    }
    .btn-print {
      background: #02462E; color: white; border: none;
      padding: 12px 32px; font-size: 16px; font-weight: 700;
      cursor: pointer; margin: 0 8px;
    }
    .btn-print:hover { background: #013a24; }
    .stats { color: #666; font-size: 14px; margin-bottom: 16px; }

    @media print {
      body { background: white; }
      .no-print { display: none !important; }
      .print-page { margin: 0; width: 100%; }
    }
  </style>
</head>
<body>

<div class="no-print">
  <p class="stats">
    <strong>${event.title} ${event.edition}</strong> — ${tags.length} tag${tags.length===1?'':'s'}
    · ${Math.ceil(tags.length/4)} page${Math.ceil(tags.length/4)===1?'':'s'}
  </p>
  <button class="btn-print" onclick="window.print()">🖨️ Print Tags</button>
  <button class="btn-print" style="background:#555" onclick="window.close()">✕ Close</button>
  <p style="color:#aaa;font-size:12px;margin-top:12px">
    4 tags per A4 page · Cut along dashed lines after printing
  </p>
</div>

${pages.map(page => `
<div class="print-page">
  ${page.map(tag => `
  <div class="tag-cell">
    ${tagCard(tag)}
  </div>`).join('')}
  ${page.length < 4 ? Array(4 - page.length).fill('<div class="tag-cell"><div class="tag-card" style="opacity:0.1;border-style:dashed"></div></div>').join('') : ''}
</div>`).join('')}

</body>
</html>`;

    // Mark printed
    const tagIds = tags.map(t => t.id);
    if (tagIds.length) {
      await query(`UPDATE event_tags SET is_printed=1 WHERE id IN (${tagIds.map(()=>'?').join(',')})`, tagIds);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) { next(e); }
};
