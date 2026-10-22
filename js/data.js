/* =====================================================================
   Data layer — one interface, two backends:
   • live  : Supabase (when SUPABASE_URL is set in config.js)
   • demo  : sample members on the real Gaya blocks and panchayats — for trying the app
   ===================================================================== */
(function () {
  const LEVELS = ['state', 'district', 'block', 'panchayat', 'village'];
  window.LEVELS = LEVELS;
  const LOC_COLS = 'id,level,name,name_hi,parent_id,path,subdivision,expected_villages';

  function friendlyError(e) {
    const code = e && (e.code || e.status);
    const msg = (e && e.message) || String(e);
    if (code === '23505' || /duplicate key/i.test(msg))
      return new Error('यह सदस्य पहले से पंजीकृत है। This person is already registered with this mobile number.');
    if (code === '42501' || /row-level security|permission denied/i.test(msg))
      return new Error("You don't have permission to change data outside your area.");
    if (/Failed to fetch|NetworkError|network/i.test(msg)) {
      const err = new Error('No internet connection.'); err.offline = true; return err;
    }
    return new Error(msg.replace(/^.*?ERROR:\s*/, ''));
  }

  function cleanPhone(p) {
    const d = String(p || '').replace(/\D/g, '');
    return d ? d.slice(-10) : '';
  }
  window.cleanPhone = cleanPhone;

  // same tidy-up the database does: trim, single spaces, Title Case
  function tidyVillage(v) {
    return String(v || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|[\s(-])\S/g, c => c.toUpperCase());
  }
  window.tidyVillage = tidyVillage;

  function matches(m, f) {
    if (f.locationId && !m.location_path.includes(f.locationId)) return false;
    if (f.status && m.status !== f.status) return false;
    if (f.excludeRejected && m.status === 'rejected') return false;
    if (f.gender && m.gender !== f.gender) return false;
    if (f.ageMin && !(m.age >= f.ageMin)) return false;
    if (f.ageMax && !(m.age <= f.ageMax)) return false;
    if (f.occupation && !(m.occupation || '').toLowerCase().includes(f.occupation.toLowerCase())) return false;
    if (f.village && !(m.village_name || '').toLowerCase().includes(f.village.toLowerCase())) return false;
    if (f.boothNo && m.booth_no !== +f.boothNo) return false;
    if (f.blockName && (m.block_name || '').toLowerCase() !== f.blockName.toLowerCase()) return false;
    if (f.panchayatName && (m.panchayat_name || '').toLowerCase() !== f.panchayatName.toLowerCase()) return false;
    if (f.boothId && m.booth_id !== +f.boothId) return false;
    if (f.q) {
      const s = f.q.toLowerCase();
      if (![m.full_name, m.phone, m.guardian_name].some(v => (v || '').toLowerCase().includes(s))) return false;
    }
    return true;
  }

  /* ------------------------------------------------------------------ LIVE */
  function createLive(cfg) {
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const cache = new Map();
    const remember = rows => (rows || []).forEach(r => cache.set(r.id, r));
    const chk = ({ data, error, count }) => { if (error) throw friendlyError(error); return { data, count }; };
    const clean = s => s.replace(/[%_,()*]/g, ' ').trim();

    function filtered(q, f) {
      if (f.locationId) q = q.contains('location_path', [f.locationId]);
      if (f.status) q = q.eq('status', f.status);
      if (f.excludeRejected) q = q.neq('status', 'rejected');
      if (f.gender) q = q.eq('gender', f.gender);
      if (f.ageMin) q = q.gte('age', f.ageMin);
      if (f.ageMax) q = q.lte('age', f.ageMax);
      if (f.occupation) q = q.ilike('occupation', `%${clean(f.occupation)}%`);
      if (f.village) q = q.ilike('village_name', `%${clean(f.village)}%`);
      if (f.boothNo) q = q.eq('booth_no', +f.boothNo);
      if (f.blockName) q = q.ilike('block_name', clean(f.blockName));
      if (f.panchayatName) q = q.ilike('panchayat_name', clean(f.panchayatName));
      if (f.boothId) q = q.eq('booth_id', +f.boothId);
      if (f.q) {
        const s = clean(f.q);
        if (s) q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,guardian_name.ilike.%${s}%`);
      }
      return q;
    }

    return {
      mode: 'live',
      async session() { return (await sb.auth.getSession()).data.session; },
      onAuth(cb) { sb.auth.onAuthStateChange((_ev, s) => cb(s)); },
      async sendCode(email) {
        chk(await sb.auth.signInWithOtp({
          email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname }
        }));
      },
      async verifyCode(email, token) { chk(await sb.auth.verifyOtp({ email, token, type: 'email' })); },
      async signOut() { await sb.auth.signOut(); },
      async me() { const { data } = chk(await sb.rpc('me')); return (data && data[0]) || null; },

      async children(parentId) {
        let q = sb.from('locations').select(LOC_COLS).order('name').limit(5000);
        q = parentId == null ? q.is('parent_id', null) : q.eq('parent_id', parentId);
        const { data } = chk(await q); remember(data); return data;
      },
      async locations(ids) {
        ids = [...new Set(ids.filter(Boolean))];
        const need = ids.filter(i => !cache.has(i));
        for (let i = 0; i < need.length; i += 150) {
          const { data } = chk(await sb.from('locations').select(LOC_COLS).in('id', need.slice(i, i + 150)));
          remember(data);
        }
        return ids.map(i => cache.get(i)).filter(Boolean);
      },
      async addLocation(loc) {
        const { data } = chk(await sb.from('locations').insert(loc).select(LOC_COLS).single());
        remember([data]); return data;
      },
      async typedNames(locId, block, panchayat) {
        const { data } = chk(await sb.rpc('typed_names', { p_location: locId, p_block: block || null, p_panchayat: panchayat || null }));
        return (data || []).map(r => r.name).filter(Boolean);
      },
      async typedBreakdown(locId, block, panchayat) {
        const { data } = chk(await sb.rpc('typed_breakdown', { p_location: locId, p_block: block || null, p_panchayat: panchayat || null }));
        return (data || []).map(r => ({ ...r, total: +r.total, verified: +r.verified, pending: +r.pending }));
      },
      async villageNames(panchayatId) {
        const { data } = chk(await sb.rpc('village_names', { p_panchayat: panchayatId }));
        return data || [];
      },

      async booths(panchayatId) {
        const { data } = chk(await sb.from('booths').select('id,assembly,number,name,panchayat_id').eq('panchayat_id', panchayatId).order('number'));
        return data || [];
      },
      async boothsByIds(ids) {
        ids = [...new Set(ids.filter(Boolean))]; if (!ids.length) return [];
        const { data } = chk(await sb.from('booths').select('id,assembly,number,name,panchayat_id').in('id', ids));
        return data || [];
      },
      async boothBreakdown(locId) {
        const { data } = chk(await sb.rpc('booth_breakdown', { p_location: locId }));
        return (data || []).map(r => ({ ...r, total: +r.total, verified: +r.verified, pending: +r.pending }));
      },

      async registerPublic(m) {
        chk(await sb.from('members').insert({ ...m, status: 'pending', source: 'self', created_by: null }));
      },
      async addMember(m) {
        const s = await this.session();
        chk(await sb.from('members').insert({ ...m, source: 'coordinator', status: m.status || 'verified', created_by: s && s.user.id }));
      },
      async updateMember(id, patch) { chk(await sb.from('members').update(patch).eq('id', id)); },
      async deleteMember(id) { chk(await sb.from('members').delete().eq('id', id)); },
      async getMember(id) { const { data } = chk(await sb.from('members').select('*').eq('id', id).single()); return data; },
      async listMembers(f, { offset = 0, limit = 50 } = {}) {
        let q = filtered(sb.from('members').select('*', { count: 'exact' }), f);
        q = q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
        const { data, count } = chk(await q);
        return { rows: data, count: count || 0 };
      },
      async counts(parentId) {
        const { data } = chk(await sb.rpc('member_counts', { p_parent: parentId ?? null }));
        return (data || []).map(r => ({ ...r, total: +r.total, verified: +r.verified, pending: +r.pending,
          villages_reached: +r.villages_reached, expected_villages: r.expected_villages == null ? null : +r.expected_villages }));
      },
      async villageBreakdown(panchayatId) {
        const { data } = chk(await sb.rpc('village_breakdown', { p_panchayat: panchayatId }));
        return (data || []).map(r => ({ ...r, total: +r.total, verified: +r.verified, pending: +r.pending }));
      },

      async coordinators() { const { data } = chk(await sb.from('coordinators').select('*').order('role')); return data; },
      async saveCoordinator(c) { chk(await sb.from('coordinators').upsert(c)); },
      async removeCoordinator(email) { chk(await sb.from('coordinators').delete().eq('email', email)); }
    };
  }

  /* ------------------------------------------------------------------ DEMO */
  function createDemo() {
    let nextId = 1;
    const locs = new Map();
    const add = (level, name, parent, extra = {}) => {
      const id = nextId++;
      const path = parent ? [...locs.get(parent).path, id] : [id];
      const l = { id, level, name, name_hi: null, parent_id: parent || null, path, subdivision: null, expected_villages: null, ...extra };
      locs.set(id, l); return id;
    };
    const bihar = add('state', 'Bihar', null, { name_hi: 'बिहार' });
    const D = {};
    ['Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Darbhanga',
      'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj',
      'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia',
      'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul',
      'Vaishali', 'West Champaran'].forEach(n => { D[n] = add('district', n, bihar); });
    for (const [st, info] of Object.entries(window.STATE_DATA || {})) {
      const sid = add('state', st, null, { name_hi: info.hi });
      info.d.forEach(([n, hi]) => { D[n] = add('district', n, sid, { name_hi: hi }); });
    }

    // real Gaya blocks and panchayats (js/gaya-data.js)
    const panchayats = []; const blockId = {}; const panchId = {};
    for (const [block, info] of Object.entries(window.GAYA_DATA || {})) {
      const bid = add('block', block, D.Gaya, { subdivision: info.s }); blockId[block] = bid;
      for (const [p, v] of info.p) {
        const pid = add('panchayat', p, bid, { expected_villages: v }); panchId[block + '/' + p] = pid;
        panchayats.push({ id: pid, name: p, w: block === 'Imamganj' ? 4 : ['Sherghati', 'Dumaria', 'Gurua', 'Banke Bazar', 'Amas'].includes(block) ? 2 : 1 });
      }
    }

    // Imamganj town area and the 227-Imamganj polling booths (js/booth-data.js)
    if (blockId.Imamganj) {
      const np = add('panchayat', 'Imamganj Nagar Panchayat', blockId.Imamganj); panchId['Imamganj/Imamganj Nagar Panchayat'] = np;
      panchayats.push({ id: np, name: 'Imamganj', w: 4, town: true });
    }
    const booths = [];
    const BD = window.BOOTH_DATA;
    if (BD) for (const [number, name, block, panch] of BD.booths) {
      const pid = panchId[block + '/' + panch];
      if (pid) booths.push({ id: booths.length + 1, assembly: BD.assembly, number, name, panchayat_id: pid, path: locs.get(pid).path });
    }
    const boothsOf = pid => booths.filter(b => b.panchayat_id === pid);

    // deterministic sample members (names and numbers are made up)
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pick = a => a[Math.floor(rnd() * a.length)];
    const male = ['Ramesh', 'Suresh', 'Rajesh', 'Mukesh', 'Dinesh', 'Anil', 'Sunil', 'Vijay', 'Ajay', 'Santosh', 'Manoj', 'Pankaj', 'Ravi', 'Amit', 'Rakesh', 'Umesh', 'Naresh', 'Shankar', 'Arvind', 'Pramod'];
    const female = ['Sunita', 'Anita', 'Rekha', 'Kiran', 'Pooja', 'Priya', 'Savita', 'Geeta', 'Meena', 'Rinku'];
    const elders = ['Ramdeo', 'Shivnandan', 'Jagdish', 'Ramashray', 'Kameshwar', 'Baleshwar', 'Rajendra', 'Mahendra', 'Lalan', 'Shiv Shankar'];
    const occ = ['Farmer / किसान', 'Business / व्यापार', 'Govt job / सरकारी नौकरी', 'Private job / निजी नौकरी', 'Student / छात्र', 'Labour / मजदूर', 'Homemaker / गृहिणी', 'Teacher / शिक्षक'];
    const edu = ['Primary', 'Matric (10th)', 'Inter (12th)', 'Graduate', 'Post-graduate', 'Illiterate / निरक्षर'];
    const weighted = panchayats.flatMap(p => Array(p.w).fill(p));
    const members = [];
    for (let i = 0; i < 420; i++) {
      const g = rnd() < 0.68 ? 'M' : 'F';
      const p = pick(weighted);
      const r = rnd();
      const vr = rnd();
      const phone = '90000' + String(10000 + i * 37).slice(-5);
      members.push({
        id: 'demo-' + i,
        full_name: `${pick(g === 'M' ? male : female)} ${rnd() < 0.5 ? (g === 'F' ? 'Kumari ' : 'Kumar ') : ''}Dangi`,
        guardian_name: `${pick(elders)} Dangi`,
        gender: g, age: 18 + Math.floor(rnd() * 55),
        phone, whatsapp: phone,
        education: pick(edu), occupation: pick(occ), family_size: 2 + Math.floor(rnd() * 8),
        address: 'Ward ' + (1 + Math.floor(rnd() * 12)), notes: '',
        ...(() => { const bs = boothsOf(p.id); const b = bs.length && rnd() < 0.8 ? pick(bs) : null; return { booth_id: b ? b.id : null, booth_no: b ? b.number : null }; })(),
        place_id: p.id, village_name: p.town ? 'Ward ' + (1 + Math.floor(vr * 15)) : vr < 0.55 ? p.name : vr < 0.8 ? `${p.name} Khurd` : `${p.name} Kalan`,
        location_path: locs.get(p.id).path, consent: true,
        status: r < 0.7 ? 'verified' : r < 0.95 ? 'pending' : 'rejected',
        source: rnd() < 0.6 ? 'self' : 'coordinator',
        created_at: new Date(Date.now() - rnd() * 60 * 864e5).toISOString()
      });
    }
    // a few sample members from districts with no block list (typed block / panchayat)
    const typedSamples = [['Indore', 'Mhow', 'Kodariya', 'Kodariya'], ['Indore', 'Mhow', 'Kodariya', 'Simrol'], ['Indore', 'Sanwer', 'Dharawara', 'Dharawara'],
      ['Jaipur', 'Chaksu', 'Kotkhawda', 'Kotkhawda'], ['Jaipur', 'Phagi', 'Mandawari', 'Mandawari'], ['Kota', 'Ladpura', 'Kansua', 'Kansua']];
    typedSamples.forEach(([d, b, p, v], i) => {
      if (!D[d]) return;
      for (let k = 0; k < 3; k++) {
        const phone = '91100' + String(10000 + i * 10 + k).slice(-5);
        members.push({ id: `demo-t${i}-${k}`, full_name: `${pick(male)} Dangi`, guardian_name: `${pick(elders)} Dangi`, gender: 'M', age: 25 + k * 9,
          phone, whatsapp: phone, education: pick(edu), occupation: pick(occ), family_size: 4, address: '', notes: '', booth_id: null, booth_no: null,
          place_id: D[d], block_name: b, panchayat_name: p, village_name: v, location_path: locs.get(D[d]).path, consent: true,
          status: k ? 'verified' : 'pending', source: 'self', created_at: new Date(Date.now() - (i * 3 + k) * 864e5).toISOString() });
      }
    });
    // fill block / panchayat names from the list, as the database does
    members.forEach(m => {
      const path = locs.get(m.place_id).path;
      if (path[2]) m.block_name = locs.get(path[2]).name;
      if (path[3]) m.panchayat_name = locs.get(path[3]).name;
    });
    members.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const coords = [
      { email: 'admin@demo.in', full_name: 'Sidharth (you)', phone: '9000000001', role: 'super_admin', location_id: null, active: true },
      { email: 'gaya@demo.in', full_name: 'Sample District Coordinator', phone: '9000000002', role: 'district', location_id: D.Gaya, active: true },
      { email: 'imamganj@demo.in', full_name: 'Sample Block Coordinator', phone: '9000000003', role: 'block', location_id: blockId.Imamganj, active: true },
      { email: 'bikopur@demo.in', full_name: 'Sample Panchayat Coordinator', phone: '9000000004', role: 'panchayat', location_id: panchId['Imamganj/Bikopur'], active: true }
    ];

    let current = null;
    const meRow = () => coords.find(c => c.email === current && c.active);
    const can = path => { const c = meRow(); return !!c && (c.role === 'super_admin' || path.includes(c.location_id)); };
    const isAdmin = () => meRow()?.role === 'super_admin';
    const deny = () => { throw friendlyError({ code: '42501' }); };
    const later = v => new Promise(r => setTimeout(() => r(v), 100));
    const validate = m => {
      m.phone = cleanPhone(m.phone); m.whatsapp = cleanPhone(m.whatsapp) || m.phone;
      if (!/^[6-9]\d{9}$/.test(m.phone)) throw new Error('Mobile number must be a valid 10-digit Indian number');
      const pl = locs.get(+m.place_id);
      if (!pl || pl.level === 'state') throw new Error('Choose at least the district where the member lives');
      if (['district', 'block'].includes(pl.level) && [...locs.values()].some(l => l.parent_id === pl.id))
        throw new Error(`Choose the ${pl.level === 'district' ? 'block' : 'panchayat'} from the list`);
      if (pl.level === 'village') m.village_name = pl.name;
      if (pl.path[2]) m.block_name = locs.get(pl.path[2]).name;
      if (pl.path[3]) m.panchayat_name = locs.get(pl.path[3]).name;
      m.block_name = tidyVillage(m.block_name); m.panchayat_name = tidyVillage(m.panchayat_name);
      m.village_name = tidyVillage(m.village_name);
      if (m.block_name.length < 2) throw new Error('Enter the block name');
      if (m.panchayat_name.length < 2) throw new Error('Enter the panchayat name');
      if (m.village_name.length < 2) throw new Error('Enter the village name');
      m.location_path = pl.path;
      if (m.booth_id) {
        const b = booths.find(x => x.id === +m.booth_id);
        if (!b || b.panchayat_id !== pl.path[3]) throw new Error('This booth is not in the chosen panchayat');
        m.booth_id = b.id; m.booth_no = b.number;
      } else { m.booth_id = null; m.booth_no = null; }
      if (members.some(x => x.id !== m.id && x.phone === m.phone && x.full_name.trim().toLowerCase() === m.full_name.trim().toLowerCase()))
        throw friendlyError({ code: '23505' });
    };
    const notRejected = () => members.filter(m => m.status !== 'rejected');

    return {
      mode: 'demo',
      demoAccounts: coords.map(c => ({ email: c.email, role: c.role, area: c.location_id ? locs.get(c.location_id).name : null })),
      async session() { return current ? { user: { email: current } } : null; },
      onAuth() {},
      async sendCode(email) { if (!coords.some(c => c.email === email)) throw new Error('In the demo, use one of the sample logins below.'); return later(); },
      async verifyCode(email) { current = email; return later(); },
      async signOut() { current = null; },
      async me() {
        const c = meRow(); if (!c) return null;
        const l = c.location_id ? locs.get(c.location_id) : null;
        return later({ ...c, location_name: l?.name || null, location_level: l?.level || null });
      },

      async children(parentId) {
        return later([...locs.values()].filter(l => l.parent_id === (parentId ?? null)).sort((a, b) => a.name.localeCompare(b.name)));
      },
      async locations(ids) { return ids.map(i => locs.get(i)).filter(Boolean); },
      async addLocation(loc) {
        const parent = loc.parent_id ? locs.get(+loc.parent_id) : null;
        const path = parent ? [...parent.path, nextId] : [nextId];
        if (!(isAdmin() || (loc.level === 'village' && can(path)))) deny();
        const exp = { district: 'state', block: 'district', panchayat: 'block', village: 'panchayat' }[loc.level];
        if ((parent?.level || null) !== (exp || null)) throw new Error(`A ${loc.level} must be inside a ${exp}`);
        if ([...locs.values()].some(l => l.parent_id === (parent?.id ?? null) && l.name.toLowerCase() === loc.name.trim().toLowerCase()))
          throw new Error(`${loc.name} is already listed here`);
        const id = add(loc.level, loc.name.trim(), parent?.id, { name_hi: loc.name_hi || null });
        return later(locs.get(id));
      },
      async typedNames(locId, block, panchayat) {
        const key = m => (!block ? m.block_name : !panchayat ? m.panchayat_name : m.village_name);
        const set = new Map();
        notRejected().filter(m => m.location_path.includes(locId)
          && (!block || m.block_name.toLowerCase() === block.toLowerCase())
          && (!panchayat || m.panchayat_name.toLowerCase() === panchayat.toLowerCase()))
          .forEach(m => { const k = key(m); if (k && !set.has(k.toLowerCase())) set.set(k.toLowerCase(), k); });
        return later([...set.values()].sort());
      },
      async typedBreakdown(locId, block, panchayat) {
        const key = m => (!block ? m.block_name : !panchayat ? m.panchayat_name : m.village_name);
        const groups = new Map();
        notRejected().filter(m => can(m.location_path) && m.location_path.includes(locId)
          && (!block || m.block_name.toLowerCase() === block.toLowerCase())
          && (!panchayat || m.panchayat_name.toLowerCase() === panchayat.toLowerCase()))
          .forEach(m => {
            const k = key(m).toLowerCase();
            const g = groups.get(k) || { name: key(m), total: 0, verified: 0, pending: 0 };
            g.total++; if (m.status === 'verified') g.verified++; if (m.status === 'pending') g.pending++;
            groups.set(k, g);
          });
        return later([...groups.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)));
      },
      async villageNames(pid) {
        const listed = [...locs.values()].filter(l => l.parent_id === pid && l.level === 'village').map(l => l.name);
        const typed = notRejected().filter(m => m.location_path.includes(pid)).map(m => m.village_name);
        const seen = new Set(listed.map(n => n.toLowerCase()));
        const out = listed.map(n => ({ village_name: n, listed: true }));
        for (const n of typed) if (!seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); out.push({ village_name: n, listed: false }); }
        return later(out.sort((a, b) => a.village_name.localeCompare(b.village_name)));
      },

      async booths(pid) { return later(boothsOf(pid).map(({ path, ...b }) => b)); },
      async boothsByIds(ids) { return ids.map(i => booths.find(b => b.id === i)).filter(Boolean); },
      async boothBreakdown(locId) {
        const vis = notRejected().filter(m => can(m.location_path) && m.booth_id);
        const pname = id => locs.get(id).name;
        return later(booths.filter(b => b.path.includes(locId)).map(b => {
          const ms = vis.filter(m => m.booth_id === b.id);
          return { booth_id: b.id, number: b.number, name: b.name, assembly: b.assembly, panchayat: pname(b.panchayat_id),
            total: ms.length, verified: ms.filter(m => m.status === 'verified').length, pending: ms.filter(m => m.status === 'pending').length };
        }));
      },

      async registerPublic(m) {
        m = { ...m, id: 'demo-' + Math.random().toString(36).slice(2), status: 'pending', source: 'self', created_at: new Date().toISOString() };
        validate(m); members.unshift(m); return later();
      },
      async addMember(m) {
        m = { ...m, id: 'demo-' + Math.random().toString(36).slice(2), status: m.status || 'verified', source: 'coordinator', created_at: new Date().toISOString() };
        validate(m); if (!can(m.location_path)) deny(); members.unshift(m); return later();
      },
      async updateMember(id, patch) {
        const m = members.find(x => x.id === id); if (!m || !can(m.location_path)) deny();
        const next = { ...m, ...patch }; validate(next); if (!can(next.location_path)) deny();
        Object.assign(m, next); return later();
      },
      async deleteMember(id) {
        if (!isAdmin()) deny();
        const i = members.findIndex(x => x.id === id); if (i >= 0) members.splice(i, 1); return later();
      },
      async getMember(id) { return { ...members.find(x => x.id === id) }; },
      async listMembers(f, { offset = 0, limit = 50 } = {}) {
        const all = members.filter(m => can(m.location_path) && matches(m, f));
        return later({ rows: all.slice(offset, offset + limit).map(m => ({ ...m })), count: all.length });
      },
      async counts(parentId) {
        const kids = [...locs.values()].filter(l => l.parent_id === (parentId ?? null));
        const vis = notRejected().filter(m => can(m.location_path));
        const allPanch = [...locs.values()].filter(l => l.level === 'panchayat');
        return later(kids.map(l => {
          const ms = vis.filter(m => m.location_path.includes(l.id));
          const exp = allPanch.filter(p => p.path.includes(l.id)).reduce((a, p) => a + (p.expected_villages || 0), 0);
          return { location_id: l.id, name: l.name, level: l.level, subdivision: l.subdivision, total: ms.length,
            verified: ms.filter(m => m.status === 'verified').length, pending: ms.filter(m => m.status === 'pending').length,
            villages_reached: new Set(ms.map(m => `${m.block_name}/${m.panchayat_name}:${m.village_name}`.toLowerCase())).size,
            expected_villages: exp || null };
        }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)));
      },
      async villageBreakdown(pid) {
        const groups = new Map();
        for (const m of notRejected().filter(x => can(x.location_path) && x.location_path.includes(pid))) {
          const k = m.village_name.toLowerCase();
          const g = groups.get(k) || { village_name: m.village_name, total: 0, verified: 0, pending: 0 };
          g.total++; if (m.status === 'verified') g.verified++; if (m.status === 'pending') g.pending++;
          groups.set(k, g);
        }
        return later([...groups.values()].sort((a, b) => b.total - a.total || a.village_name.localeCompare(b.village_name)));
      },

      async coordinators() { return later(isAdmin() ? coords.map(c => ({ ...c })) : coords.filter(c => c.email === current)); },
      async saveCoordinator(c) {
        if (!isAdmin()) deny();
        c = { ...c, email: c.email.trim().toLowerCase() };
        if (c.role !== 'super_admin') {
          const l = locs.get(+c.location_id);
          if (!l || l.level !== c.role) throw new Error(`A ${c.role} coordinator must be assigned a ${c.role}`);
        } else c.location_id = null;
        const i = coords.findIndex(x => x.email === c.email);
        if (i >= 0) coords[i] = { ...coords[i], ...c }; else coords.push({ active: true, ...c });
        return later();
      },
      async removeCoordinator(email) {
        if (!isAdmin()) deny();
        const i = coords.findIndex(x => x.email === email); if (i >= 0) coords.splice(i, 1); return later();
      }
    };
  }

  window.createDataLayer = cfg => (cfg.SUPABASE_URL ? createLive(cfg) : createDemo());
})();
