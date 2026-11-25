// Cloudflare Pages Function: POST /api/contact
// Sends website form submissions by email through Resend (https://resend.com).
//
// Set these in Cloudflare Pages -> Settings -> Variables and Secrets (Production):
//   RESEND_API_KEY  (secret)  your Resend API key, e.g. re_xxx
//   CONTACT_TO                where submissions go, e.g. info@swmidland.com
//   CONTACT_FROM              a sender on a domain verified in Resend,
//                             e.g. "Still Water Website <website@stillwatercounselingmidland.com>"

const LABELS = {
  first: 'First name',
  last: 'Last name',
  phone_number: 'Phone number',
  email: 'Email',
  tell_us_what_table_top_role_playing_games_you_like_to_play: 'Why do you want to join a TTRPG therapy group?',
  counseling_for: 'Counseling is for',
  contact_method: 'Best way to reach you',
  message: 'How can we help?',
};
// Every form needs a name; the TTRPG form also requires phone and email (enforced in the page).
// The inquiry form needs a phone number or an email address.
const REQUIRED = ['first', 'last'];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.formData();
  } catch {
    return json({ error: 'Invalid form data.' }, 400);
  }

  // Honeypot: real visitors never fill this hidden field.
  if ((data.get('company_website') || '').toString().trim()) return json({ ok: true });

  const fields = {};
  for (const [k, v] of data.entries()) {
    if (k === 'company_website' || k === 'form_name' || typeof v !== 'string') continue;
    fields[k] = v.trim().slice(0, 5000);
  }
  for (const k of REQUIRED) {
    if (!fields[k]) return json({ error: `${LABELS[k] || k} is required.` }, 422);
  }
  if (!fields.email && !fields.phone_number) return json({ error: 'Please enter a phone number or an email address.' }, 422);
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return json({ error: 'Please enter a valid email address.' }, 422);

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return json({ error: 'The form is not configured yet.' }, 500);
  }

  const formName = (data.get('form_name') || 'Website form').toString().slice(0, 120);
  const rows = Object.entries(fields)
    .map(([k, v]) => `<tr><th align="left" valign="top" style="padding:6px 12px 6px 0">${esc(LABELS[k] || k)}</th><td style="padding:6px 0">${esc(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');
  const text = Object.entries(fields).map(([k, v]) => `${LABELS[k] || k}: ${v}`).join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO.split(',').map((s) => s.trim()),
      ...(fields.email ? { reply_to: fields.email } : {}),
      subject: `New ${formName} submission: ${fields.first} ${fields.last}`,
      html: `<h2>${esc(formName)}</h2><table>${rows}</table>`,
      text,
    }),
  });

  if (!res.ok) return json({ error: 'Email service error.' }, 502);
  return json({ ok: true });
}

export const onRequestGet = () => new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
