/* =====================================================================
   Dangi Samaj Portal — app screens
   ===================================================================== */
(function () {
  const C = window.APP_CONFIG;
  const LEVELS = window.LEVELS;
  const app = document.getElementById('app');
  let data, me = null;

  /* ---------------------------------------------------------- helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => Number(n || 0).toLocaleString('en-IN');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };

  const LVL = { state: 'राज्य · State', district: 'जिला · District', block: 'प्रखंड · Block', panchayat: 'पंचायत · Panchayat', village: 'गाँव · Village' };
  const LVL_PL = { state: 'States', district: 'Districts', block: 'Blocks', panchayat: 'Panchayats', village: 'Villages' };
  const ROLE = { super_admin: 'Super admin', state: 'State coordinator', district: 'District coordinator', block: 'Block coordinator', panchayat: 'Panchayat coordinator' };
  const STATUS = { verified: 'Verified', pending: 'Pending', rejected: 'Rejected' };
  const GENDER = { M: 'Male · पुरुष', F: 'Female · महिला', O: 'Other · अन्य' };
  const EDU = ['Illiterate / निरक्षर', 'Primary', 'Middle (8th)', 'Matric (10th)', 'Inter (12th)', 'Diploma / ITI', 'Graduate', 'Post-graduate', 'Professional (Engg / Medical / Law)'];
  const OCC = ['Farmer / किसान', 'Business / व्यापार', 'Shopkeeper / दुकानदार', 'Govt job / सरकारी नौकरी', 'Private job / निजी नौकरी', 'Teacher / शिक्षक',
    'Doctor / डॉक्टर', 'Engineer / इंजीनियर', 'Lawyer / वकील', 'Police / Army / पुलिस / सेना', 'Contractor / ठेकेदार', 'Driver / ड्राइवर',
    'Self-employed / स्वरोज़गार', 'Working abroad / विदेश में काम', 'Social or political work / सामाजिक / राजनीतिक कार्य', 'Labour / मजदूर',
    'Student / छात्र', 'Homemaker / गृहिणी', 'Retired / सेवानिवृत्त', 'Unemployed / बेरोज़गार'];
  const MARITAL = { unmarried: 'अविवाहित · Unmarried', married: 'विवाहित · Married', widowed: 'विधुर / विधवा · Widowed', divorced: 'तलाकशुदा / अलग · Divorced or separated' };

  /* regions: India (states and UTs), Nepal (provinces), abroad (NRI: countries) */
  const REGIONS = ['india', 'nepal', 'abroad'];
  const REGION = { india: 'भारत · India', nepal: 'नेपाल · Nepal', abroad: 'विदेश · Abroad (NRI)' };
  const LVL_R = {
    nepal: { state: 'प्रदेश · Province', district: 'जिल्ला · District', block: 'नगरपालिका / गाउँपालिका · Municipality', panchayat: 'वडा · Ward', village: 'गाँव / टोल · Village or tole' },
    abroad: { state: 'विदेश · Abroad', district: 'देश · Country', block: 'राज्य / प्रांत · State or province', panchayat: 'शहर · City', village: 'इलाका · Area' }
  };
  const LVL_PL_R = {
    nepal: { state: 'Provinces', district: 'Districts', block: 'Municipalities', panchayat: 'Wards', village: 'Villages' },
    abroad: { state: 'Regions', district: 'Countries', block: 'States / provinces', panchayat: 'Cities', village: 'Areas' }
  };
  const lvl = (l, r) => (LVL_R[r] || LVL)[l];
  const lvlPl = (l, r) => (LVL_PL_R[r] || LVL_PL)[l];
  const lvlOne = (l, r) => lvlPl(l, r).toLowerCase().replace(/ies$/, 'y').replace(/s$/, '').replace(/ \/ provinces?$/, ' / province');

  /* phone numbers: India as 10 digits, others stored as +<code><number> */
  const W = window.WORLD_DATA || { india: '91', nepal: '977', countries: [] };
  const DIALS = (() => {
    const by = new Map([[W.india, ['India']], [W.nepal, ['Nepal']]]);
    W.countries.forEach(([n, d]) => { if (d) { if (!by.has(d)) by.set(d, []); by.get(d).push(n.replace(/ \((\w+)\)$/, ' $1').replace(/^United (Arab Emirates|Kingdom|States) /, '')); } });
    return [...by.entries()].map(([d, ns]) => [d, ns.length > 2 ? ns.slice(0, 2).join(', ') + '…' : ns.join(', ')]);
  })();
  const dialOf = country => (W.countries.find(c => c[0] === country) || [])[1] || '';
  const waDigits = p => (String(p || '').startsWith('+') ? String(p).slice(1) : C.COUNTRY_CODE + p);
  function splitPhone(p) {
    p = String(p || '');
    if (!p.startsWith('+')) return { cc: W.india, rest: p };
    const d = [...DIALS].map(x => x[0]).sort((a, b) => b.length - a.length).find(c => p.slice(1).startsWith(c));
    return d ? { cc: d, rest: p.slice(1 + d.length) } : { cc: '', rest: p };
  }
  function joinPhone(cc, raw) {
    raw = String(raw || '').trim();
    if (!raw) return '';
    if (/^(\+|00)/.test(raw)) return storePhone(raw);
    const d = raw.replace(/\D/g, '');
    if (!cc || cc === W.india) return d.slice(-10);
    return '+' + cc + d.replace(/^0+/, '');
  }

  function toast(msg, kind = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3700);
  }

  function confirmBox(text, okLabel = 'Confirm', danger = false) {
    return new Promise(res => {
      const d = document.createElement('div');
      d.className = 'modal-back';
      d.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><p>${esc(text)}</p>
        <div class="row end"><button class="btn ghost" data-v="0">Cancel</button>
        <button class="btn ${danger ? 'danger' : 'primary'}" data-v="1">${esc(okLabel)}</button></div></div>`;
      d.addEventListener('click', e => {
        const v = e.target.dataset.v;
        if (v != null || e.target === d) { d.remove(); res(v === '1'); }
      });
      document.body.appendChild(d);
      $('[data-v="1"]', d).focus();
    });
  }

  async function copyText(text, label) {
    try { await navigator.clipboard.writeText(text); toast(`${label} copied`); }
    catch {
      const d = document.createElement('div');
      d.className = 'modal-back';
      d.innerHTML = `<div class="modal"><p>Select all and copy:</p><textarea id="copy-fallback" rows="8">${esc(text)}</textarea>
        <div class="row end"><button class="btn primary">Done</button></div></div>`;
      d.querySelector('button').onclick = () => d.remove();
      document.body.appendChild(d);
      const ta = $('#copy-fallback', d); ta.focus(); ta.select();
    }
  }

  function download(filename, text, mime) {
    if (data.mode === 'demo' && window.self !== window.top) {
      toast('Downloads are turned off in this preview. They work in the real app.', 'warn');
      return;
    }
    const blob = new Blob([text], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  const busy = (btn, on, label) => {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'Please wait…'; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  };

  /* location name helpers */
  async function pathText(path, from = 'district') {
    const locs = await data.locations(path);
    const start = LEVELS.indexOf(from);
    return locs.filter(l => LEVELS.indexOf(l.level) >= start).reverse().map(l => l.name).join(' · ');
  }
  async function primeNames(rows) { await data.locations(rows.flatMap(r => r.location_path || [])); }

  /* ---------------------------------------------------------- location picker
     Cascading selects: State → District → Block → Panchayat → Village.
     locked: ids of a coordinator's own area (those levels are fixed). */
  async function locPicker(box, { upto = 'panchayat', locked = [], allowAll = false, required = false, value = null, typed = false, tabs = false, region = 'india', onChange = () => {} } = {}) {
    const lv = LEVELS.slice(0, LEVELS.indexOf(upto) + 1);
    const vals = Array(lv.length).fill(null);
    let preset = [];
    if (value) { const [v] = await data.locations([value]); if (v) { preset = v.path; region = v.region || region; } }
    if (locked[0]) { const [st] = await data.locations([locked[0]]); if (st) region = st.region || region; }
    let topItems = [];
    const regionOf = () => (tabs ? region : (topItems.find(t => t.id === vals[0])?.region || 'india'));
    box.classList.add('loc-grid');
    box.innerHTML = (tabs && !locked[0] ? `<div class="seg region-tabs" role="group" aria-label="Where do you live? · आप कहाँ रहते हैं?">${REGIONS.map(r =>
      `<button type="button" data-region="${r}" class="${r === region ? 'on' : ''}">${REGION[r]}</button>`).join('')}</div>` : '')
      + lv.map((l, i) => `<label class="field"><span data-lab="${i}">${LVL[l]}${required ? ' *' : ''}</span>
      <select data-i="${i}" autocomplete="off" ${required ? 'required' : ''}></select></label>`).join('');
    const sels = $$('select', box);
    const labels = () => {
      const r = regionOf();
      $$('[data-lab]', box).forEach(sp => { sp.textContent = lvl(lv[+sp.dataset.lab], r) + (required ? ' *' : ''); });
      // abroad has a single entry at the top: no need to show it
      if (tabs) sels[0].closest('label').hidden = r === 'abroad';
    };

    const deepest = () => { for (let i = vals.length - 1; i >= 0; i--) if (vals[i]) return { id: vals[i], level: lv[i], index: i }; return null; };
    let emptyAt = null;   // first level with no list (typed mode: those levels are typed by hand)

    async function fill(i) {
      if (emptyAt != null && emptyAt >= i) emptyAt = null;
      for (let j = i; j < sels.length; j++) {
        vals[j] = null; sels[j].innerHTML = `<option value="">${allowAll ? 'All · सभी' : '— चुनें · Select —'}</option>`; sels[j].disabled = true;
        sels[j].closest('label').hidden = false;
      }
      if (i >= sels.length) return;
      const parent = i === 0 ? null : vals[i - 1];
      if (i > 0 && !parent) return;
      let items = await data.children(parent);
      if (i === 0) { topItems = items; if (tabs) items = items.filter(it => (it.region || 'india') === region); }
      const sel = sels[i];
      const optHTML = it => `<option value="${it.id}">${esc(it.name)}${it.name_hi ? ' · ' + esc(it.name_hi) : ''}</option>`;
      if (i === 0 && !tabs && new Set(items.map(it => it.region || 'india')).size > 1) {
        // states grouped as India / Nepal / abroad
        sel.insertAdjacentHTML('beforeend', REGIONS.map(r => {
          const list = items.filter(it => (it.region || 'india') === r);
          return list.length ? `<optgroup label="${esc(REGION[r])}">${list.map(optHTML).join('')}</optgroup>` : '';
        }).join(''));
      } else if (items.some(it => it.subdivision)) {
        // blocks: group them under their subdivision (अनुमंडल)
        const groups = {};
        items.forEach(it => (groups[it.subdivision || 'Other'] ||= []).push(it));
        sel.insertAdjacentHTML('beforeend', Object.keys(groups).sort().map(g =>
          `<optgroup label="${esc(g)} अनुमंडल · subdivision">${groups[g].map(optHTML).join('')}</optgroup>`).join(''));
      } else sel.insertAdjacentHTML('beforeend', items.map(optHTML).join(''));
      if (!items.length) {
        sel.innerHTML = `<option value="">No ${lvlPl(lv[i], regionOf()).toLowerCase()} added yet</option>`;
        if (i >= 2) emptyAt = i;   // a district or block without a list below it
        if (typed && i >= 2) for (let j = i; j < sels.length; j++) sels[j].closest('label').hidden = true;
        return;
      }
      sel.disabled = false;
      let pick = locked[i] ?? preset[i] ?? null;
      if (pick == null && !allowAll && i <= 1 && region === 'india') {
        const want = i === 0 ? C.DEFAULT_STATE : C.DEFAULT_DISTRICT;
        const def = items.find(it => it.name === want) || (i === 0 && items.length === 1 ? items[0] : null);
        if (def) pick = def.id;
      }
      if (pick == null && !allowAll && i === 0 && items.length === 1) pick = items[0].id;
      if (pick != null && items.some(it => it.id === pick)) {
        sel.value = String(pick); vals[i] = pick;
        if (locked[i] != null) sel.disabled = true;
        if (i === 0) labels();
        await fill(i + 1);
      }
    }

    sels.forEach((sel, i) => sel.addEventListener('change', async () => {
      vals[i] = sel.value ? +sel.value : null;
      preset = [];
      if (i === 0) labels();
      await fill(i + 1);
      onChange(deepest(), regionOf());
    }));
    $$('[data-region]', box).forEach(b => b.addEventListener('click', async () => {
      if (b.dataset.region === region) return;
      region = b.dataset.region; preset = [];
      $$('[data-region]', box).forEach(x => x.classList.toggle('on', x === b));
      labels();
      await fill(0);
      onChange(deepest(), regionOf());
    }));
    labels();
    await fill(0);
    onChange(deepest(), regionOf());
    return { get: deepest, region: regionOf, panchayatId: () => vals[LEVELS.indexOf('panchayat')] || null, empty: () => (emptyAt == null ? null : lv[emptyAt]) };
  }

  const scopeLocked = () => (me && me.path ? me.path : []);

  /* ---------------------------------------------------------- offline queue (public form) */
  const QKEY = 'dangi-queue';
  async function flushQueue() {
    const q = store.get(QKEY, []);
    if (!q.length || !navigator.onLine) return;
    const left = [];
    for (const m of q) {
      try { await data.registerPublic(m); } catch (e) { if (e.offline) left.push(m); }
    }
    store.set(QKEY, left);
    if (q.length - left.length > 0) toast(`${q.length - left.length} saved registration(s) sent`);
  }

  /* ---------------------------------------------------------- shell */
  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'add', label: 'Add member' },
    { id: 'message', label: 'Send message' },
    { id: 'locations', label: 'Locations' },
    { id: 'coordinators', label: 'Coordinators', admin: true }
  ];
  let current = 'register';

  function shell(view) {
    const demo = data.mode === 'demo';
    const area = me ? (me.role === 'super_admin' ? 'All regions' : me.location_name) : '';
    app.innerHTML = `
      ${demo ? `<div class="demo-bar"><div class="wrap">Demo mode with sample data. Nothing here is real. Connect Supabase in <code>config.js</code> to go live.</div></div>` : ''}
      <header class="top"><div class="wrap top-in">
        <button class="brand" data-go="${me ? 'overview' : 'register'}" aria-label="Home">
          <span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="brand-text"><b>${esc(C.APP_NAME)}</b><small>${esc(C.APP_NAME_EN)}</small></span>
        </button>
        <div class="top-right">${me
          ? `<span class="who"><b>${esc(ROLE[me.role])}</b><small>${esc(area)}</small></span><button class="btn small on-dark" id="signout">Sign out</button>`
          : (view === 'login' ? `<button class="btn small on-dark" data-go="register">Registration form</button>` : `<button class="btn small on-dark" data-go="login">Coordinator login</button>`)}
        </div></div>
        ${me ? `<nav class="tabs" aria-label="Sections"><div class="wrap tabs-in">${TABS.filter(t => !t.admin || me.role === 'super_admin')
          .map(t => `<button class="tab ${t.id === view ? 'on' : ''}" data-go="${t.id}">${t.label}</button>`).join('')}</div></nav>` : ''}
      </header>
      <main class="wrap main" id="view"></main>
      <footer class="wrap foot">${esc(C.APP_NAME_EN)} · data is visible only to authorised coordinators of each area</footer>`;
    $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    const so = $('#signout');
    if (so) so.onclick = async () => { await data.signOut(); me = null; resetViews(); go('register'); };
    return $('#view');
  }

  async function go(view, opts = {}) {
    const priv = TABS.some(t => t.id === view);
    if (priv && !me) view = 'login';
    if (view === 'coordinators' && me?.role !== 'super_admin') view = 'overview';
    if (view === 'register' && me && !opts.force) view = 'overview';
    current = view;
    try { if (location.hash.slice(1) !== view) history.replaceState(null, '', '#' + view); } catch { /* sandboxed */ }
    const root = shell(view);
    root.innerHTML = '<div class="loading">Loading…</div>';
    try {
      await ({ register: viewRegister, login: viewLogin, overview: viewOverview, members: viewMembers, add: viewAdd,
        message: viewMessage, locations: viewLocations, coordinators: viewCoordinators }[view] || viewRegister)(root, opts);
    } catch (e) {
      root.innerHTML = `<div class="card error-card"><h2>Something went wrong</h2><p>${esc(e.message)}</p>
        <button class="btn primary" id="retry">Try again</button></div>`;
      $('#retry').onclick = () => go(view, opts);
    }
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------- member form (shared) */
  function memberFormHTML(m = {}, { coordinator = false } = {}) {
    const opt = (list, v) => list.map(x => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');
    const ph = m.phone ? splitPhone(m.phone) : { cc: W.india, rest: '' };
    const occOther = m.occupation && !OCC.includes(m.occupation);
    return `
      <fieldset class="group"><legend>स्थान · Location</legend><div id="loc"></div>
        <p class="hint" id="typed-hint" hidden></p>
        <div class="grid2" id="typed-wrap" hidden>
          <label class="field" id="tb-wrap"><span id="tb-lab">प्रखंड / तहसील · Block *</span>
            <input id="f-tblock" list="tblock-list" autocomplete="off" value="${esc(m.block_name)}" placeholder="प्रखंड का नाम लिखें · type block name"><datalist id="tblock-list"></datalist></label>
          <label class="field" id="tp-wrap"><span id="tp-lab">पंचायत · Panchayat *</span>
            <input id="f-tpanch" list="tpanch-list" autocomplete="off" value="${esc(m.panchayat_name)}" placeholder="पंचायत का नाम लिखें · type panchayat name"><datalist id="tpanch-list"></datalist></label>
        </div>
        <label class="field"><span id="v-lab">गाँव का नाम · Village name *</span>
          <input id="f-village" list="village-list" required autocomplete="off" value="${esc(m.village_name)}" placeholder="पंचायत चुनें, फिर गाँव लिखें · choose panchayat, then type village">
          <datalist id="village-list"></datalist></label>
        <p class="hint" id="village-hint" hidden></p>
        <label class="field" id="native-wrap" hidden><span>भारत / नेपाल में मूल गाँव और जिला · Native village and district in India or Nepal <small class="muted">(वैकल्पिक · optional)</small></span>
          <input id="f-native" value="${esc(m.native_place)}" placeholder="जैसे: Bikopur, Imamganj, Gaya"></label>
        <label class="field" id="booth-wrap" hidden><span>मतदान बूथ · Polling booth <small class="muted">(पता हो तो · if known)</small></span>
          <select id="f-booth"></select></label>
      </fieldset>
      <fieldset class="group"><legend>व्यक्तिगत जानकारी · Personal details</legend>
        <div class="grid2">
          <label class="field span2"><span>पूरा नाम · Full name *</span><input id="f-name" required minlength="2" autocomplete="name" value="${esc(m.full_name)}" placeholder="जैसे: Ramesh Kumar Dangi"></label>
          <label class="field span2"><span>पिता / पति का नाम · Father's / husband's name</span><input id="f-guardian" value="${esc(m.guardian_name)}"></label>
          <label class="field"><span>लिंग · Gender *</span><select id="f-gender" required><option value="">— Select —</option>
            ${Object.entries(GENDER).map(([k, v]) => `<option value="${k}" ${m.gender === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="field"><span>उम्र · Age</span><input id="f-age" type="number" inputmode="numeric" min="0" max="120" value="${esc(m.age)}"></label>
        </div>
      </fieldset>
      <fieldset class="group"><legend>संपर्क · Contact</legend>
        <div class="grid2">
          <label class="field span2"><span>मोबाइल नंबर · Mobile *</span><span class="phone-row">
            <select id="f-cc" aria-label="Country code · देश कोड">${DIALS.map(([d, n]) => `<option value="${d}" ${d === ph.cc ? 'selected' : ''}>+${d} ${esc(n)}</option>`).join('')}</select>
            <input id="f-phone" type="tel" inputmode="tel" required placeholder="10 अंक · 10 digits" value="${esc(ph.rest)}"></span></label>
          <label class="field span2"><span>व्हाट्सऐप नंबर · WhatsApp <small class="muted">(अगर अलग हो · if different; another country: start with +)</small></span><input id="f-wa" type="tel" inputmode="tel" value="${m.whatsapp && m.whatsapp !== m.phone ? esc(splitPhone(m.whatsapp).cc === ph.cc ? splitPhone(m.whatsapp).rest : m.whatsapp) : ''}"></label>
          <label class="field span2"><span>पता / टोला / वार्ड · Address, tola or ward</span><input id="f-address" value="${esc(m.address)}"></label>
        </div>
      </fieldset>
      <fieldset class="group"><legend>परिवार, विवाह और पेशा · Family, marriage and profession <small class="muted">(वैकल्पिक · optional)</small></legend>
        <div class="grid2">
          <label class="field"><span>वैवाहिक स्थिति · Marital status</span><select id="f-marital"><option value="">— Select —</option>
            ${Object.entries(MARITAL).map(([k, v]) => `<option value="${k}" ${m.marital_status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="field"><span>पेशा / व्यवसाय · Profession</span><select id="f-occ"><option value="">— Select —</option>${opt(OCC, m.occupation)}
            <option value="__other" ${occOther ? 'selected' : ''}>अन्य · Other (type below)</option></select></label>
          <label class="field span2" id="occ-other-wrap" ${occOther ? '' : 'hidden'}><span>पेशा लिखें · Type your profession</span><input id="f-occ-other" value="${occOther ? esc(m.occupation) : ''}" placeholder="जैसे: Architect, Pharmacist, Tailor"></label>
          <label class="field"><span>शिक्षा · Education</span><select id="f-edu"><option value="">— Select —</option>${opt(EDU, m.education)}</select></label>
          <label class="field"><span>परिवार के सदस्य · Family members</span><input id="f-family" type="number" inputmode="numeric" min="1" max="100" value="${esc(m.family_size)}"></label>
          ${coordinator ? `<label class="field"><span>स्थिति · Status</span><select id="f-status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(m.status || 'verified') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>` : ''}
          ${coordinator ? `<label class="field span2"><span>टिप्पणी · Notes (only coordinators see this)</span><input id="f-notes" value="${esc(m.notes)}"></label>` : ''}
        </div>
      </fieldset>
      <label class="consent"><input type="checkbox" id="f-consent" required ${m.consent ? 'checked' : ''}>
        <span>मैं सहमत हूँ कि मेरी जानकारी दांगी समाज के रिकॉर्ड में रखी जाए और समाज की सूचनाएँ मुझे SMS / WhatsApp पर भेजी जाएँ।
        <small>I agree that my details are kept in the Dangi Samaj records and that I may receive community messages on SMS or WhatsApp. I can ask a coordinator to remove my details at any time.</small></span></label>`;
  }

  /* the village part of a polling-station name: "Madhya Vidyalay, Hurmeth (Bayan Bhaag)" -> "Hurmeth" */
  function boothPlace(name) {
    if (!name || !name.includes(',')) return null;
    const v = name.split(',').pop().replace(/\(.*$/, '').replace(/\b(Awasthist|Isthit|Sthit)\b.*$/i, '').trim();
    return v.length >= 2 ? v : null;
  }
  const boothLabel = b => `${b.number} · ${b.name}`;

  /* location picker + village (typed, with suggestions) + polling booth.
     Where a district or block has no list below it yet, block / panchayat are typed too. */
  async function mountPlace(root, { locked = [], placeId = null, boothId = null, startRegion = 'india' } = {}) {
    let listed = [];            // official villages of this panchayat, if any were added
    let booths = [];
    let currentP;
    let typedBase = null;       // { id, level, name } when names are typed below this place
    const input = $('#f-village', root), dl = $('#village-list', root), hint = $('#village-hint', root);
    const bwrap = $('#booth-wrap', root), bsel = $('#f-booth', root);
    const twrap = $('#typed-wrap', root), thint = $('#typed-hint', root);
    const tb = $('#f-tblock', root), tp = $('#f-tpanch', root);
    const opts = list => list.map(v => `<option value="${esc(v)}">`).join('');
    const cc = $('#f-cc', root), phone = $('#f-phone', root);
    let ccTouched = !!phone.value;
    cc.addEventListener('change', () => { ccTouched = true; phone.placeholder = cc.value === W.india ? '10 अंक · 10 digits' : 'नंबर · number'; });
    const occ = $('#f-occ', root);
    occ.addEventListener('change', () => { $('#occ-other-wrap', root).hidden = occ.value !== '__other'; if (occ.value === '__other') $('#f-occ-other', root).focus(); });
    const TYPED_LAB = {
      india: ['प्रखंड / तहसील · Block *', 'पंचायत · Panchayat *', 'गाँव का नाम · Village name *', 'प्रखंड का नाम लिखें · type block name', 'पंचायत का नाम लिखें · type panchayat name', 'गाँव का नाम लिखें · type village name'],
      nepal: ['नगरपालिका / गाउँपालिका · Municipality or rural municipality *', 'वडा नं. · Ward no. *', 'गाँव / टोल · Village or tole *', 'जैसे: Birgunj Metropolitan City', 'जैसे: 5', 'गाँव या टोल का नाम · village or tole'],
      abroad: ['राज्य / प्रांत · State or province', 'शहर · City *', 'इलाका / मोहल्ला · Area or locality', 'वैकल्पिक · optional (e.g. Texas, Dubai)', 'शहर का नाम · city', 'वैकल्पिक · optional']
    };
    let region = 'india';
    function setRegion(r, country) {
      region = r || 'india';
      const t = TYPED_LAB[region];
      $('#tb-lab', root).textContent = t[0]; $('#tp-lab', root).textContent = t[1]; $('#v-lab', root).textContent = t[2];
      tb.placeholder = t[3]; tp.placeholder = t[4];
      $('#native-wrap', root).hidden = region !== 'abroad';
      if (!ccTouched) {
        const want = region === 'nepal' ? W.nepal : region === 'abroad' ? dialOf(country) : W.india;
        if (want && [...cc.options].some(o => o.value === want)) { cc.value = want; cc.dispatchEvent(new Event('change')); ccTouched = false; }
      }
    }

    async function onPanchayat(pid) {
      if (pid === currentP) return;
      currentP = pid; dl.innerHTML = ''; hint.hidden = true; listed = []; booths = []; bwrap.hidden = true; bsel.innerHTML = '';
      input.disabled = !pid && !typedBase;
      if (!pid) return;
      const [names, kids, [p], bs] = await Promise.all([data.villageNames(pid), data.children(pid), data.locations([pid]), data.booths(pid)]);
      if (pid !== currentP) return;
      listed = kids.filter(k => k.level === 'village');
      booths = bs;
      const sugg = new Map();
      names.forEach(n => sugg.set(n.village_name.toLowerCase(), n.village_name));
      bs.map(b => boothPlace(b.name)).filter(Boolean).forEach(v => { if (!sugg.has(v.toLowerCase())) sugg.set(v.toLowerCase(), v); });
      dl.innerHTML = opts([...sugg.values()].sort());
      const exp = p?.expected_villages;
      hint.innerHTML = `${esc(p.name)}${/nagar/i.test(p.name) ? '' : ' पंचायत'}${exp ? ` में ${exp} गाँव हैं · has ${exp} villages on record` : ''}${bs.length ? ` · ${bs.length} polling booths` : ''}.
        ${names.length ? `Already registered from: <b>${names.slice(0, 8).map(n => esc(n.village_name)).join(', ')}${names.length > 8 ? '…' : ''}</b>. Pick one if it is yours, or type your ${/nagar/i.test(p.name) ? 'ward or mohalla' : 'village'}.` : `Type your ${/nagar/i.test(p.name) ? 'ward or mohalla' : 'village name'}.`}`;
      hint.hidden = false;
      if (bs.length) {
        bsel.innerHTML = `<option value="">पता नहीं · Don't know</option>` + bs.map(b => `<option value="${b.id}">${esc(boothLabel(b))}</option>`).join('');
        if (boothId && bs.some(b => b.id === boothId)) bsel.value = String(boothId);
        bwrap.hidden = false;
      }
    }

    // typed mode: suggestions come from names other members already typed here
    const blockName = () => (typedBase && typedBase.level === 'block' ? typedBase.name : tb.value.trim());
    async function refreshTyped(level) {
      if (!typedBase) return;
      const base = typedBase.id;
      if (level === 'block' && typedBase.level === 'district') $('#tblock-list', root).innerHTML = opts(await data.typedNames(base));
      if (level !== 'village' && blockName()) $('#tpanch-list', root).innerHTML = opts(await data.typedNames(base, blockName()));
      if (blockName() && tp.value.trim()) dl.innerHTML = opts(await data.typedNames(base, blockName(), tp.value.trim()));
    }
    bsel.addEventListener('change', () => {
      const b = booths.find(x => x.id === +bsel.value);
      if (b && !input.value.trim()) { const v = boothPlace(b.name); if (v) input.value = v; }
    });
    tb.addEventListener('change', () => refreshTyped('panchayat'));
    tp.addEventListener('change', () => refreshTyped('village'));

    async function onPlace(d, r) {
      const empty = picker ? picker.empty() : null;
      const typedHere = d && empty && ((d.level === 'district' && empty === 'block') || (d.level === 'block' && empty === 'panchayat'));
      const [loc] = d ? await data.locations([d.id]) : [null];
      setRegion(loc ? loc.region : r, loc && loc.region === 'abroad' && loc.level === 'district' ? loc.name : null);
      if (typedHere) {
        typedBase = { id: d.id, level: d.level, name: loc.name, region };
        twrap.hidden = false; $('#tb-wrap', root).hidden = d.level !== 'district';
        thint.innerHTML = region === 'abroad'
          ? `कृपया शहर लिखें; राज्य / प्रांत और इलाका वैकल्पिक हैं। · Type the city you live in, in ${esc(loc.name)}. State or province and area are optional.`
          : region === 'nepal'
          ? `कृपया अपनी नगरपालिका / गाउँपालिका, वडा नं. और गाँव / टोल लिखें। · Please type your municipality, ward number and village or tole in ${esc(loc.name)}.`
          : d.level === 'district'
          ? `${esc(loc.name)} जिले की प्रखंड / पंचायत सूची अभी नहीं जुड़ी है — कृपया नाम लिखें। · Block and panchayat lists for ${esc(loc.name)} are not added yet, so please type them.`
          : `${esc(loc.name)} की पंचायत सूची अभी नहीं जुड़ी है — कृपया नाम लिखें। · The panchayat list for ${esc(loc.name)} is not added yet, so please type it.`;
        thint.hidden = false;
        currentP = undefined; await onPanchayat(null);
        input.disabled = false; dl.innerHTML = '';
        input.placeholder = TYPED_LAB[region][5];
        await refreshTyped('block');
      } else {
        typedBase = null; twrap.hidden = true; thint.hidden = true;
        input.placeholder = d && d.level === 'state' && region === 'abroad' ? 'पहले देश चुनें · choose the country first' : 'पंचायत चुनें, फिर गाँव लिखें · choose panchayat, then type village';
        await onPanchayat(d && d.level === 'panchayat' ? d.id : null);
      }
    }
    let picker = null;
    picker = await locPicker($('#loc', root), { required: true, typed: true, tabs: true, region: startRegion, locked, value: placeId, onChange: (d, r) => onPlace(d, r) });
    await onPlace(picker.get(), picker.region());

    return {
      get() {
        if (typedBase) {
          let b = tidyVillage(blockName()), p = tidyVillage(tp.value), v = tidyVillage(input.value);
          const r = typedBase.region;
          if (r === 'nepal' && /^\d+$/.test(p)) p = 'Ward ' + p;
          if (r === 'abroad') {
            if (p.length < 2) throw new Error('कृपया शहर का नाम लिखें · Please type your city.');
            return { place_id: typedBase.id, block_name: b || null, panchayat_name: p, village_name: v || p, booth_id: null,
              native_place: $('#f-native', root).value.trim() || null };
          }
          if (b.length < 2) throw new Error(r === 'nepal' ? 'कृपया नगरपालिका / गाउँपालिका लिखें · Please type your municipality.' : 'कृपया प्रखंड का नाम लिखें · Please type the block name.');
          if (p.length < 2) throw new Error(r === 'nepal' ? 'कृपया वडा नं. लिखें · Please type your ward number.' : 'कृपया पंचायत का नाम लिखें · Please type the panchayat name.');
          if (v.length < 2) throw new Error(r === 'nepal' ? 'कृपया गाँव / टोल लिखें · Please type your village or tole.' : 'कृपया गाँव का नाम लिखें · Please type the village name.');
          return { place_id: typedBase.id, block_name: b, panchayat_name: p, village_name: v, booth_id: null };
        }
        if (picker.region() === 'abroad') throw new Error('कृपया देश चुनें · Please choose the country.');
        const pid = picker.panchayatId();
        if (!pid) throw new Error('कृपया प्रखंड और पंचायत चुनें · Please choose the block and panchayat.');
        const name = tidyVillage(input.value);
        if (name.length < 2) throw new Error('कृपया गाँव का नाम लिखें · Please type the village name.');
        const official = listed.find(v => v.name.toLowerCase() === name.toLowerCase());
        return { place_id: official ? official.id : pid, village_name: official ? official.name : name,
          block_name: null, panchayat_name: null, booth_id: bsel.value && !bwrap.hidden ? +bsel.value : null };
      }
    };
  }

  function readMember(root, place) {
    const v = id => $(id, root)?.value.trim() ?? '';
    const n = id => (v(id) ? +v(id) : null);
    const cc = v('#f-cc');
    const occ = v('#f-occ') === '__other' ? v('#f-occ-other') : v('#f-occ');
    const m = {
      full_name: v('#f-name'), guardian_name: v('#f-guardian') || null, gender: v('#f-gender') || null,
      age: n('#f-age'), phone: joinPhone(cc, v('#f-phone')), whatsapp: joinPhone(cc, v('#f-wa')) || null,
      address: v('#f-address') || null, education: v('#f-edu') || null, occupation: occ || null,
      marital_status: v('#f-marital') || null, native_place: null,
      family_size: n('#f-family'), consent: $('#f-consent', root).checked,
      ...place.get()
    };
    if ($('#f-status', root)) m.status = v('#f-status');
    if ($('#f-notes', root)) m.notes = v('#f-notes') || null;
    if (!phoneOk(m.phone)) throw new Error(cc === W.india ? 'मोबाइल नंबर 10 अंकों का होना चाहिए · Enter a valid 10-digit mobile number.' : 'कृपया सही मोबाइल नंबर लिखें · Enter a valid mobile number for the chosen country code.');
    if (m.whatsapp && !phoneOk(m.whatsapp)) throw new Error('WhatsApp नंबर सही नहीं है · Check the WhatsApp number.');
    if (!m.consent) throw new Error('सहमति ज़रूरी है · Please tick the consent box.');
    return m;
  }

  /* ---------------------------------------------------------- PUBLIC: registration */
  async function viewRegister(root, { region = 'india' } = {}) {
    const queued = store.get(QKEY, []).length;
    root.innerHTML = `
      <section class="intro">
        <p class="eyebrow">सदस्य पंजीकरण · Member registration</p>
        <h1>दांगी समाज परिवार से जुड़ें</h1>
        <p class="lede">Fill this form once for each adult member. Your details reach only the coordinators of your own district, block and panchayat.
          Dangi families in <b>Nepal</b> and those living <b>abroad (NRI)</b> can register too: choose Nepal or Abroad below.</p>
      </section>
      ${queued ? `<div class="note warn">${queued} form(s) are saved on this phone and will be sent when the internet is back.</div>` : ''}
      <form class="card form" id="reg" novalidate>${memberFormHTML()}
        <div class="row end"><button class="btn primary big" type="submit">पंजीकरण करें · Register</button></div>
      </form>`;
    const picker = await mountPlace(root, { startRegion: region });
    $('#reg', root).addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.submitter || $('button[type=submit]', root);
      let m;
      try { m = readMember(root, picker); } catch (err) { toast(err.message, 'bad'); return; }
      busy(btn, true, 'Saving…');
      try {
        await data.registerPublic(m);
        done(m, false);
      } catch (err) {
        if (err.offline || !navigator.onLine) { store.set(QKEY, [...store.get(QKEY, []), m]); done(m, true); }
        else toast(err.message, 'bad');
      } finally { busy(btn, false); }
    });

    function done(m, offline) {
      root.innerHTML = `<div class="card success">
        <div class="tick" aria-hidden="true"></div>
        <h2>${offline ? 'फ़ॉर्म इस फ़ोन में सेव हो गया' : 'धन्यवाद! पंजीकरण हो गया'}</h2>
        <p>${offline ? 'There is no internet right now. The form is saved on this phone and will be sent automatically when you are back online. Keep this page open or open it again later.'
          : `${esc(m.full_name)} has been registered. A coordinator from your area will verify the details.`}</p>
        <div class="row center"><button class="btn primary" id="again">एक और सदस्य जोड़ें · Register another</button></div></div>`;
      $('#again').onclick = () => go('register', { force: true });
    }
  }

  /* ---------------------------------------------------------- PUBLIC: login */
  async function viewLogin(root) {
    const demo = data.mode === 'demo';
    root.innerHTML = `<div class="card narrow">
      <p class="eyebrow">Coordinators only</p><h1 class="h2">Coordinator login</h1>
      <p class="muted">Enter the email address the super admin registered for you. We'll email you a login link.</p>
      <form id="step1" class="stack"><label class="field"><span>Email</span><input id="l-email" type="email" required autocomplete="email"></label>
        <button class="btn primary" type="submit">Send code</button></form>
      <form id="step2" class="stack" hidden>
        <div class="note ok-note"><b>Check your email.</b> Open the message from Supabase on this phone or computer and tap <b>Log In</b> / <b>Confirm your mail</b>. You'll come straight back here, logged in. It can take a minute to arrive; look in Spam too.</div>
        <label class="field"><span>Or type the code, if your email shows one</span>
        <input id="l-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></label>
        <button class="btn primary" type="submit">Log in</button>
        <button class="btn ghost" type="button" id="l-back">Use a different email</button></form>
      ${demo ? `<div class="demo-logins"><p class="muted">Demo: log in as</p>${data.demoAccounts.map(a =>
        `<button class="btn" data-demo="${a.email}">${ROLE[a.role]}${a.area ? ' · ' + esc(a.area) : ''}</button>`).join('')}</div>` : ''}
    </div>`;
    let email = '';
    const finish = async () => {
      me = await data.me();
      if (!me) {
        toast('This email is not registered as a coordinator. Ask the super admin to add you.', 'bad');
        await data.signOut(); return;
      }
      resetViews(); await loadScope(); go('overview');
    };
    $('#step1').onsubmit = async e => {
      e.preventDefault(); email = $('#l-email').value.trim().toLowerCase();
      const b = e.submitter; busy(b, true, 'Sending…');
      try { await data.sendCode(email); $('#step1').hidden = true; $('#step2').hidden = false; $('#l-code').focus(); toast('Login link sent. Check your email.'); }
      catch (err) { toast(err.message, 'bad'); } finally { busy(b, false); }
    };
    $('#step2').onsubmit = async e => {
      e.preventDefault(); const b = e.submitter; busy(b, true, 'Checking…');
      try { await data.verifyCode(email, $('#l-code').value.trim()); await finish(); }
      catch (err) { toast(err.message, 'bad'); } finally { busy(b, false); }
    };
    $('#l-back').onclick = () => { $('#step1').hidden = false; $('#step2').hidden = true; };
    $$('[data-demo]').forEach(b => b.onclick = async () => { await data.verifyCode(b.dataset.demo); await finish(); });
  }

  function resetViews() { ['ov-node', 'ov-by', 'mem-filter', 'msg-filter'].forEach(k => store.set(k, null)); }

  async function loadScope() {
    if (me && me.location_id) { const [l] = await data.locations([me.location_id]); me.path = l ? l.path : []; }
    else if (me) me.path = [];
  }

  /* ---------------------------------------------------------- OVERVIEW (drill-down) */
  async function viewOverview(root, { node, by, tb, tp } = {}) {
    const scopeId = me.location_id ?? null;
    node = node ?? store.get('ov-node', null) ?? scopeId;
    // never go above the coordinator's own area
    let nodeLoc = node ? (await data.locations([node]))[0] : null;
    if (scopeId && (!nodeLoc || !nodeLoc.path.includes(scopeId))) { node = scopeId; nodeLoc = (await data.locations([node]))[0]; }
    store.set('ov-node', node);

    if (nodeLoc?.level === 'village') { node = nodeLoc.parent_id; nodeLoc = (await data.locations([node]))[0]; store.set('ov-node', node); }
    const atPanchayat = nodeLoc?.level === 'panchayat';
    const rows = atPanchayat ? [] : await data.counts(node);
    const vrows = atPanchayat ? await data.villageBreakdown(node) : [];
    // districts / blocks without a list below them: drill through the names members typed
    const typedMode = !atPanchayat && !rows.length && nodeLoc && ['district', 'block'].includes(nodeLoc.level);
    const effTb = typedMode ? (nodeLoc.level === 'block' ? nodeLoc.name : tb || null) : null;
    const effTp = effTb ? tp || null : null;
    const typedLevel = !effTb ? 'block' : !effTp ? 'panchayat' : 'village';
    const trows = typedMode ? await data.typedBreakdown(node, effTb, effTp) : [];
    const crumbs = [];
    if (!scopeId) crumbs.push({ id: null, name: 'All · सभी' });
    if (nodeLoc) {
      const anc = await data.locations(nodeLoc.path);
      anc.forEach(a => { if (!scopeId || a.path.includes(scopeId)) crumbs.push({ id: a.id, name: a.name }); });
    }
    if (typedMode && nodeLoc.level === 'district' && effTb) crumbs.push({ id: node, tb: effTb, name: effTb });
    if (effTp) crumbs.push({ id: node, tb: effTb, tp: effTp, name: effTp });
    const boothRows = nodeLoc && ['district', 'block', 'panchayat'].includes(nodeLoc.level) ? await data.boothBreakdown(node) : [];
    by = boothRows.length ? (by || store.get('ov-by', 'area')) : 'area';
    store.set('ov-by', by);
    const sum = list => list.reduce((a, r) => ({ total: a.total + r.total, verified: a.verified + r.verified, pending: a.pending + r.pending }), { total: 0, verified: 0, pending: 0 });
    let tot;
    if (atPanchayat) tot = sum(vrows);
    else if (rows.length) tot = sum(rows);
    else if (typedMode) tot = sum(trows);
    else {
      const f = { locationId: node || undefined, excludeRejected: true };
      const [all, ver, pen] = await Promise.all([data.listMembers(f, { limit: 1 }), data.listMembers({ ...f, status: 'verified' }, { limit: 1 }), data.listMembers({ ...f, status: 'pending' }, { limit: 1 })]);
      tot = { total: all.count, verified: ver.count, pending: pen.count };
    }
    const reached = atPanchayat ? vrows.length : typedMode ? (typedLevel === 'village' ? trows.length : null) : rows.reduce((a, r) => a + (r.villages_reached || 0), 0);
    const expected = atPanchayat ? nodeLoc.expected_villages : rows.reduce((a, r) => a + (r.expected_villages || 0), 0) || null;
    const childLevel = rows[0]?.level;
    const R = nodeLoc?.region || 'india';
    const max = Math.max(1, ...(atPanchayat ? vrows : rows).map(r => r.total));
    const bar = r => `<td class="bar-col"><span class="bar"><i style="width:${(r.total / max * 100).toFixed(1)}%"></i><i class="v" style="width:${(r.verified / max * 100).toFixed(1)}%"></i></span></td>`;
    const vr = r => (r.expected_villages ? `${num(r.villages_reached)}<small> / ${num(r.expected_villages)}</small>` : num(r.villages_reached));
    const rowHTML = r => `<tr data-node="${r.location_id}" tabindex="0" class="${r.total ? '' : 'zero'}">
      <td>${esc(r.name)}</td><td class="num">${num(r.total)}</td><td class="num hide-sm">${num(r.verified)}</td><td class="num hide-sm">${num(r.pending)}</td>
      <td class="num">${vr(r)}</td>${bar(r)}</tr>`;

    // blocks: show them under their subdivision with a subtotal line
    let body;
    if (!nodeLoc && rows.some(r => r.region && r.region !== 'india')) {
      // top level: India, Nepal and abroad shown separately
      body = REGIONS.map(g => {
        const list = rows.filter(r => (r.region || 'india') === g);
        if (!list.length) return '';
        const t = sum(list);
        const what = g === 'india' ? `${list.length} states and UTs` : g === 'nepal' ? `${list.length} provinces` : 'members living outside India and Nepal';
        return `<tr class="grp"><td colspan="6">${esc(REGION[g])} <span>${num(t.total)} members · ${what}</span></td></tr>${list.map(rowHTML).join('')}`;
      }).join('');
    } else if (rows.some(r => r.subdivision)) {
      const groups = {};
      rows.forEach(r => (groups[r.subdivision || 'Other'] ||= []).push(r));
      body = Object.entries(groups).sort((a, b) => sum(b[1]).total - sum(a[1]).total || a[0].localeCompare(b[0])).map(([g, list]) => {
        const t = sum(list);
        return `<tr class="grp"><td colspan="6">${esc(g)} अनुमंडल · subdivision <span>${num(t.total)} members · ${list.length} blocks</span></td></tr>${list.map(rowHTML).join('')}`;
      }).join('');
    } else body = rows.map(rowHTML).join('');

    const head = name => `<thead><tr><th>${name}</th><th class="num">Members</th><th class="num hide-sm">Verified</th><th class="num hide-sm">Pending</th>`;
    let table = '';
    if (rows.length) {
      table = `<section class="card flush">
        <div class="table-head"><h2 class="h3">By ${!nodeLoc ? 'state, province or region' : lvlOne(childLevel, R)}</h2><span class="muted small">Tap a row to open it</span></div>
        <div class="tbl-wrap"><table class="tbl drill">${head(nodeLoc ? lvl(childLevel, R) : 'State / province')}<th class="num">${R === 'abroad' ? 'Places' : 'Villages reached'}</th><th class="bar-col" aria-hidden="true"></th></tr></thead>
        <tbody>${body}</tbody></table></div></section>`;
    } else if (typedMode && trows.length) {
      const tmax = Math.max(1, ...trows.map(r => r.total));
      table = `<section class="card flush">
        <div class="table-head"><h2 class="h3">By ${lvlOne(typedLevel, R)}</h2><span class="muted small">Names as typed by members · tap a row to open it</span></div>
        <div class="tbl-wrap"><table class="tbl drill">${head(lvl(typedLevel, R))}<th class="bar-col" aria-hidden="true"></th></tr></thead>
        <tbody>${trows.map(r => `<tr data-typed="${esc(r.name)}" tabindex="0"><td>${esc(r.name)}</td><td class="num">${num(r.total)}</td>
          <td class="num hide-sm">${num(r.verified)}</td><td class="num hide-sm">${num(r.pending)}</td>
          <td class="bar-col"><span class="bar"><i style="width:${(r.total / tmax * 100).toFixed(1)}%"></i><i class="v" style="width:${(r.verified / tmax * 100).toFixed(1)}%"></i></span></td></tr>`).join('')}</tbody></table></div></section>
        <p class="muted small">${R === 'india' ? `The ${nodeLoc.level === 'district' ? 'block and panchayat lists for this district are' : 'panchayat list for this block is'} not added yet, so members` : 'Members'} typed these names. If one place appears under two spellings, correct it with Edit on the member list.</p>`;
    } else if (atPanchayat && vrows.length) {
      table = `<section class="card flush">
        <div class="table-head"><h2 class="h3">By village</h2><span class="muted small">Names as typed by members · tap to see who is registered</span></div>
        <div class="tbl-wrap"><table class="tbl drill">${head(LVL.village)}<th class="bar-col" aria-hidden="true"></th></tr></thead>
        <tbody>${vrows.map(r => `<tr data-village="${esc(r.village_name)}" tabindex="0"><td>${esc(r.village_name)}</td><td class="num">${num(r.total)}</td>
          <td class="num hide-sm">${num(r.verified)}</td><td class="num hide-sm">${num(r.pending)}</td>${bar(r)}</tr>`).join('')}</tbody></table></div></section>
        <p class="muted small">If one village appears under two spellings, open its members and correct the village name with Edit.</p>`;
    } else {
      table = `<div class="card empty"><p>${atPanchayat ? 'No one from this panchayat has registered yet. Share the registration link in its WhatsApp groups.'
        : typedMode ? `No one from ${esc(nodeLoc.name)} has registered yet. Members from here type their ${R === 'abroad' ? 'city' : R === 'nepal' ? 'municipality, ward and village' : 'block, panchayat and village'} on the form.` : 'No areas have been added below this one yet. Add them under Locations.'}</p></div>`;
    }

    if (by === 'booth') {
      const bmax = Math.max(1, ...boothRows.map(r => r.total));
      const showP = nodeLoc.level !== 'panchayat';
      const groups = {};
      boothRows.forEach(r => (groups[r.assembly] ||= []).push(r));
      const multi = Object.keys(groups).length > 1;
      table = `<section class="card flush">
        <div class="table-head"><h2 class="h3">By polling booth</h2><span class="muted small">${boothRows.length} booths · tap to see who is registered</span></div>
        <div class="tbl-wrap"><table class="tbl drill booths">
          <thead><tr><th class="num">No.</th><th>Polling station</th>${showP ? '<th class="hide-sm">Panchayat</th>' : ''}<th class="num">Members</th><th class="num hide-sm">Verified</th><th class="num hide-sm">Pending</th><th class="bar-col" aria-hidden="true"></th></tr></thead>
          <tbody>${Object.entries(groups).map(([a, list]) => `${multi ? `<tr class="grp"><td colspan="${showP ? 7 : 6}">${esc(a)} Vidhan Sabha</td></tr>` : ''}${list.map(r => `
            <tr data-booth="${r.booth_id}" tabindex="0" class="${r.total ? '' : 'zero'}"><td class="num mono">${r.number}</td><td>${esc(r.name)}</td>
            ${showP ? `<td class="hide-sm small">${esc(r.panchayat)}</td>` : ''}<td class="num">${num(r.total)}</td><td class="num hide-sm">${num(r.verified)}</td><td class="num hide-sm">${num(r.pending)}</td>
            <td class="bar-col"><span class="bar"><i style="width:${(r.total / bmax * 100).toFixed(1)}%"></i><i class="v" style="width:${(r.verified / bmax * 100).toFixed(1)}%"></i></span></td></tr>`).join('')}`).join('')}</tbody>
        </table></div></section>
        <p class="muted small">Booth counts include only members who chose their booth on the form. Coordinators can add the booth with Edit.</p>`;
    }
    const assemblies = [...new Set(boothRows.map(r => r.assembly))];
    const toggle = boothRows.length ? `<div class="seg" role="group" aria-label="Show">
        <button class="${by === 'area' ? 'on' : ''}" data-by="area">${atPanchayat ? 'By village' : 'By ' + (childLevel ? lvlOne(childLevel, R) : 'area')}</button>
        <button class="${by === 'booth' ? 'on' : ''}" data-by="booth">By polling booth</button></div>` : '';
    const boothsWith = boothRows.filter(r => r.total > 0).length;

    root.innerHTML = `
      <nav class="crumbs" aria-label="Area">${crumbs.map((c, i) => i === crumbs.length - 1
        ? `<span aria-current="page">${esc(c.name)}</span>`
        : `<button data-node="${c.id ?? ''}"${c.tb ? ` data-ctb="${esc(c.tb)}"` : ''}${c.tp ? ` data-ctp="${esc(c.tp)}"` : ''}>${esc(c.name)}</button><i>›</i>`).join('')}</nav>
      <div class="head-row"><div><h1 class="h2">${esc(effTp || (nodeLoc?.level === 'district' && effTb) || nodeLoc?.name || 'India, Nepal and NRI')}</h1>
        ${nodeLoc ? `<p class="muted small sub">${effTp ? lvl('panchayat', R) + ' · ' + esc(effTb) : effTb && nodeLoc.level === 'district' ? lvl('block', R) + ' · ' + esc(nodeLoc.name) : lvl(nodeLoc.level, R)}${nodeLoc.subdivision ? ` · ${esc(nodeLoc.subdivision)} subdivision` : ''}</p>` : ''}</div>
        <div class="row"><button class="btn" id="ov-members">View members</button><button class="btn primary" id="ov-msg">Message these members</button></div></div>
      ${assemblies.length ? `<p class="muted small sub">Polling booths: ${assemblies.map(a => esc(a) + ' Vidhan Sabha').join(', ')}</p>` : ''}
      <div class="stats">
        <div class="stat"><span>Registered members</span><b>${num(tot.total)}</b></div>
        <div class="stat ok"><span>Verified</span><b>${num(tot.verified)}</b></div>
        <div class="stat warn"><span>Waiting for verification</span><b>${num(tot.pending)}</b>${tot.pending ? '<button class="link" id="ov-pending">Review now →</button>' : ''}</div>
        ${reached != null && R !== 'abroad' ? `<div class="stat"><span>Villages reached</span><b>${num(reached)}${expected ? `<small> of ${num(expected)}</small>` : ''}</b>
          ${expected ? `<span class="meter" aria-hidden="true"><i style="width:${Math.min(100, reached / expected * 100).toFixed(1)}%"></i></span>` : ''}</div>` : ''}
        ${boothRows.length ? `<div class="stat"><span>Booths with members</span><b>${num(boothsWith)}<small> of ${num(boothRows.length)}</small></b>
          <span class="meter" aria-hidden="true"><i style="width:${(boothsWith / boothRows.length * 100).toFixed(1)}%"></i></span></div>` : ''}
      </div>
      ${toggle}
      ${table}`;
    $$('[data-by]', root).forEach(b => b.onclick = () => go('overview', { node, by: b.dataset.by }));
    $$('[data-booth]', root).forEach(el => {
      const openB = () => go('members', { filter: { locationId: node, boothId: +el.dataset.booth } });
      el.addEventListener('click', openB);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') openB(); });
    });
    $$('[data-village]', root).forEach(el => {
      const openV = () => go('members', { filter: { locationId: node, village: el.dataset.village } });
      el.addEventListener('click', openV);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') openV(); });
    });

    $$('[data-typed]', root).forEach(el => {
      const name = el.dataset.typed;
      const openT = () => typedLevel === 'village'
        ? go('members', { filter: { locationId: node, blockName: effTb, panchayatName: effTp, village: name } })
        : go('overview', { node, tb: effTb || name, tp: effTb ? name : null });
      el.addEventListener('click', openT);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') openT(); });
    });

    const open = el => go('overview', { node: el.dataset.node === '' ? null : +el.dataset.node, tb: el.dataset.ctb || null, tp: el.dataset.ctp || null });
    $$('[data-node]', root).forEach(el => {
      el.addEventListener('click', () => open(el));
      el.addEventListener('keydown', e => { if (e.key === 'Enter') open(el); });
    });
    const scope = { locationId: node, ...(typedMode && effTb ? { blockName: effTb } : {}), ...(effTp ? { panchayatName: effTp } : {}) };
    $('#ov-members').onclick = () => go('members', { filter: scope });
    $('#ov-msg').onclick = () => go('message', { filter: scope });
    const p = $('#ov-pending'); if (p) p.onclick = () => go('members', { filter: { ...scope, status: 'pending' } });
  }

  /* ---------------------------------------------------------- MEMBERS */
  async function filterBar(root, f, { showStatus = true, onApply }) {
    root.innerHTML = `<form class="card filters" id="flt">
      <div id="f-loc"></div>
      <div class="grid-auto">
        <label class="field"><span>Search name or mobile</span><input id="q" type="search" value="${esc(f.q)}"></label>
        <label class="field"><span>Village · गाँव</span><input id="vf" type="search" value="${esc(f.village)}"></label>
        <label class="field"><span>Block name · प्रखंड <small class="muted">(Nepal: municipality · abroad: state)</small></span><input id="bnf" type="search" value="${esc(f.blockName)}"></label>
        <label class="field"><span>Panchayat name · पंचायत <small class="muted">(Nepal: ward · abroad: city)</small></span><input id="pnf" type="search" value="${esc(f.panchayatName)}"></label>
        <label class="field"><span>Booth no. · बूथ</span><input id="bf" type="number" inputmode="numeric" min="1" value="${esc(f.boothNo)}"></label>
        ${showStatus ? `<label class="field"><span>Status</span><select id="st"><option value="">All except rejected</option>
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>` : ''}
        <label class="field"><span>Gender</span><select id="gd"><option value="">All</option>
          ${Object.entries(GENDER).map(([k, v]) => `<option value="${k}" ${f.gender === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Age from</span><input id="a1" type="number" min="0" max="120" value="${esc(f.ageMin)}"></label>
        <label class="field"><span>Age to</span><input id="a2" type="number" min="0" max="120" value="${esc(f.ageMax)}"></label>
        <label class="field"><span>Profession · पेशा</span><input id="oc" list="occ-list2" value="${esc(f.occupation)}" placeholder="All"><datalist id="occ-list2">${OCC.map(o => `<option value="${esc(o)}">`).join('')}</datalist></label>
        <label class="field"><span>Marital status · वैवाहिक स्थिति</span><select id="ms"><option value="">All</option>
          ${Object.entries(MARITAL).map(([k, v]) => `<option value="${k}" ${f.maritalStatus === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      </div>
      <div class="row end"><button type="button" class="btn ghost" id="clr">Clear</button><button class="btn primary" type="submit">Apply filters</button></div></form>`;
    const picker = await locPicker($('#f-loc', root), { allowAll: true, locked: scopeLocked(), value: f.locationId });
    $('#clr', root).onclick = () => onApply({ locationId: me.location_id || null });
    $('#flt', root).onsubmit = e => {
      e.preventDefault();
      const g = picker.get();
      const v = id => $(id, root)?.value.trim() || '';
      onApply({
        locationId: g ? g.id : (me.location_id || null), q: v('#q'), village: v('#vf'), blockName: v('#bnf'), panchayatName: v('#pnf'), boothNo: v('#bf') ? +v('#bf') : null, status: v('#st'), gender: v('#gd'),
        ageMin: v('#a1') ? +v('#a1') : null, ageMax: v('#a2') ? +v('#a2') : null, occupation: v('#oc'), maritalStatus: v('#ms')
      });
    };
  }

  async function viewMembers(root, { filter, page = 0 } = {}) {
    const f = filter || store.get('mem-filter', null) || { locationId: me.location_id || null };
    store.set('mem-filter', f);
    const q = { ...f, excludeRejected: !f.status };
    const size = 50;
    const { rows, count } = await data.listMembers(q, { offset: page * size, limit: size });
    await primeNames(rows);
    const dedupe = parts => parts.filter((x, i) => x && (i === 0 || x.toLowerCase() !== String(parts[i - 1] || '').toLowerCase()));
    const places = await Promise.all(rows.map(async r => dedupe([r.village_name, r.panchayat_name, r.block_name,
      r.location_path.length <= 3 ? await pathText(r.location_path.slice(0, 2), 'district') : null]).join(' · ')));
    const admin = me.role === 'super_admin';

    root.innerHTML = `<div class="head-row"><h1 class="h2">Members</h1>
      <div class="row"><span class="muted">${num(count)} found</span><button class="btn primary" id="m-msg">Message these</button></div></div>
      <div id="fbar"></div>
      ${rows.length ? `<ul class="mlist">${rows.map((m, i) => `<li class="mrow">
        <div class="m-main"><div class="m-name">${esc(m.full_name)} <span class="pill ${m.status}">${STATUS[m.status]}</span>${m.booth_no ? ` <span class="pill booth">Booth ${m.booth_no}</span>` : ''}</div>
          <div class="m-sub">${m.guardian_name ? `पिता/पति: ${esc(m.guardian_name)} · ` : ''}${[m.gender && GENDER[m.gender].split(' ·')[0], m.age && m.age + ' yrs', m.marital_status && MARITAL[m.marital_status].split(' · ')[1], m.occupation && m.occupation.split(' /')[0]].filter(Boolean).map(esc).join(' · ')}</div>
          <div class="m-place">${esc(places[i])}${m.native_place ? ` <span class="muted">· मूल स्थान / native: ${esc(m.native_place)}</span>` : ''}</div></div>
        <div class="m-phone"><span class="mono">${esc(m.phone)}</span>
          <a class="link small" href="https://wa.me/${esc(waDigits(m.whatsapp || m.phone))}" target="_blank" rel="noopener">WhatsApp</a></div>
        <div class="m-act">
          ${m.status !== 'verified' ? `<button class="btn small ok" data-act="verified" data-id="${m.id}">Verify</button>` : ''}
          ${m.status === 'pending' ? `<button class="btn small ghost" data-act="rejected" data-id="${m.id}">Reject</button>` : ''}
          <button class="btn small ghost" data-act="edit" data-id="${m.id}">Edit</button>
          ${admin ? `<button class="btn small ghost danger-text" data-act="delete" data-id="${m.id}">Delete</button>` : ''}
        </div></li>`).join('')}</ul>
        <div class="pager">${page > 0 ? '<button class="btn" id="prev">← Previous</button>' : '<span></span>'}
          <span class="muted">Page ${page + 1} of ${Math.max(1, Math.ceil(count / size))}</span>
          ${(page + 1) * size < count ? '<button class="btn" id="next">Next →</button>' : '<span></span>'}</div>`
        : `<div class="card empty"><p>No members match these filters.</p></div>`}`;

    await filterBar($('#fbar', root), f, { onApply: nf => go('members', { filter: nf }) });
    $('#m-msg').onclick = () => go('message', { filter: f });
    const pv = $('#prev', root), nx = $('#next', root);
    if (pv) pv.onclick = () => go('members', { filter: f, page: page - 1 });
    if (nx) nx.onclick = () => go('members', { filter: f, page: page + 1 });
    $$('[data-act]', root).forEach(b => b.onclick = async () => {
      const { act, id } = b.dataset;
      try {
        if (act === 'edit') return go('add', { editId: id });
        if (act === 'delete') {
          if (!(await confirmBox('Delete this member permanently? This cannot be undone.', 'Delete', true))) return;
          await data.deleteMember(id); toast('Member deleted');
        } else { await data.updateMember(id, { status: act }); toast(act === 'verified' ? 'Marked as verified' : 'Marked as rejected'); }
        go('members', { filter: f, page });
      } catch (err) { toast(err.message, 'bad'); }
    });
  }

  /* ---------------------------------------------------------- ADD / EDIT MEMBER */
  async function viewAdd(root, { editId } = {}) {
    const m = editId ? await data.getMember(editId) : { consent: false };
    root.innerHTML = `<div class="head-row"><h1 class="h2">${editId ? 'Edit member' : 'Add a member'}</h1></div>
      <p class="muted">${editId ? 'Correct the details and save.' : 'Use this when you collect details in person. Read the consent line aloud and tick it only if the person agrees.'}</p>
      <form class="card form" id="addf" novalidate>${memberFormHTML(m, { coordinator: true })}
        <div class="row end">${editId ? '<button type="button" class="btn ghost" id="cancel">Cancel</button>' : ''}
        <button class="btn primary big" type="submit">${editId ? 'Save changes' : 'Add member'}</button></div></form>`;
    const picker = await mountPlace(root, { locked: scopeLocked(), placeId: m.place_id, boothId: m.booth_id });
    const c = $('#cancel', root); if (c) c.onclick = () => go('members');
    $('#addf', root).onsubmit = async e => {
      e.preventDefault();
      let nm; try { nm = readMember(root, picker); } catch (err) { toast(err.message, 'bad'); return; }
      const b = e.submitter; busy(b, true, 'Saving…');
      try {
        if (editId) { await data.updateMember(editId, nm); toast('Changes saved'); go('members'); }
        else { await data.addMember(nm); toast(`${nm.full_name} added`); go('add'); }
      } catch (err) { toast(err.message, 'bad'); } finally { busy(b, false); }
    };
  }

  /* ---------------------------------------------------------- SEND MESSAGE */
  async function fetchAll(f) {
    const out = []; const size = 1000;
    for (let off = 0; off < 50000; off += size) {
      const { rows } = await data.listMembers(f, { offset: off, limit: size });
      out.push(...rows); if (rows.length < size) break;
    }
    return out;
  }

  async function viewMessage(root, { filter } = {}) {
    const f = filter || store.get('msg-filter', null) || { locationId: me.location_id || null, status: 'verified' };
    store.set('msg-filter', f);
    const q = { ...f, excludeRejected: !f.status };
    const list = await fetchAll(q);
    await primeNames(list);
    const seen = new Set();
    const contacts = list.filter(m => { const n = m.whatsapp || m.phone; if (seen.has(n)) return false; seen.add(n); return true; });
    const where = f.locationId ? (await data.locations([f.locationId]))[0]?.name : (me.location_name || 'All regions');
    const tpl = store.get('msg-tpl', 'नमस्कार {name} जी,\n\n');

    root.innerHTML = `<div class="head-row"><h1 class="h2">Send a message</h1></div>
      <div id="fbar"></div>
      <section class="card">
        <div class="msg-sum"><b>${num(contacts.length)}</b><span>unique numbers · ${esc(where)}${f.status ? ' · ' + STATUS[f.status].toLowerCase() : ''}${list.length !== contacts.length ? ` <small class="muted">(${num(list.length - contacts.length)} shared family numbers merged)</small>` : ''}</span></div>
        <label class="field"><span>Message · संदेश <small class="muted">— {name} is replaced with each member's name</small></span>
          <textarea id="tpl" rows="5">${esc(tpl)}</textarea></label>
        <div class="actions-grid">
          <div class="act-card"><h3>Copy numbers</h3><p>Paste into a bulk-SMS service or WhatsApp Business.</p>
            <div class="row"><button class="btn" id="c-comma">Copy with commas</button><button class="btn" id="c-lines">One per line</button></div></div>
          <div class="act-card"><h3>Download for Excel</h3><p>All details in a spreadsheet (Hindi text included).</p>
            <button class="btn" id="d-csv">Download .csv</button></div>
          <div class="act-card"><h3>Save to phone contacts</h3><p>Import this file into your phone, then make a WhatsApp broadcast list. Broadcasts reach only people who have saved your number.</p>
            <button class="btn" id="d-vcf">Download contacts .vcf</button></div>
          <div class="act-card"><h3>WhatsApp one by one</h3><p>Opens WhatsApp with the message already typed for each person. Good for small groups.</p>
            <button class="btn primary" id="one">Start</button></div>
        </div>
      </section>
      <div id="queue"></div>`;

    await filterBar($('#fbar', root), f, { onApply: nf => go('message', { filter: nf }) });
    const tplEl = $('#tpl', root);
    tplEl.oninput = () => store.set('msg-tpl', tplEl.value);
    const nums = sep => contacts.map(m => waDigits(m.whatsapp || m.phone)).join(sep);
    $('#c-comma').onclick = () => copyText(nums(','), `${contacts.length} numbers`);
    $('#c-lines').onclick = () => copyText(nums('\n'), `${contacts.length} numbers`);

    const placeOf = async m => {
      const locs = await data.locations(m.location_path);
      const by = Object.fromEntries(locs.map(l => [l.level, l.name]));
      by.region = locs[0]?.region || 'india';
      by.village = m.village_name;
      if (m.block_name) by.block = m.block_name;
      if (m.panchayat_name) by.panchayat = m.panchayat_name;
      return by;
    };
    $('#d-csv').onclick = async () => {
      const head = ['Name', 'Father/Husband', 'Gender', 'Age', 'Marital status', 'Mobile', 'WhatsApp', 'Education', 'Profession', 'Family members', 'Address',
        'Village / tole / area', 'Panchayat / ward / city', 'Block / municipality / state', 'District / country', 'State / province', 'Region', 'Native place (NRI)', 'Booth no', 'Booth name', 'Status', 'Registered on'];
      const bmap = new Map((await data.boothsByIds(list.map(m => m.booth_id))).map(b => [b.id, b]));
      const cell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const lines = [head.join(',')];
      for (const m of list) {
        const p = await placeOf(m);
        lines.push([m.full_name, m.guardian_name, m.gender, m.age, m.marital_status && MARITAL[m.marital_status].split(' · ')[1], m.phone, m.whatsapp, m.education, m.occupation, m.family_size, m.address,
          p.village, p.panchayat, p.block, p.district, p.state, { india: 'India', nepal: 'Nepal', abroad: 'Abroad (NRI)' }[p.region] || '', m.native_place, m.booth_no, bmap.get(m.booth_id)?.name, m.status, (m.created_at || '').slice(0, 10)].map(cell).join(','));
      }
      download(`dangi-members-${(where || 'all').replace(/\W+/g, '-')}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
    };
    $('#d-vcf').onclick = async () => {
      const out = [];
      for (const m of contacts) {
        const p = await placeOf(m);
        out.push(['BEGIN:VCARD', 'VERSION:3.0', `FN:${m.full_name} (${p.village || ''})`, `TEL;TYPE=CELL:+${waDigits(m.whatsapp || m.phone)}`,
          `ORG:Dangi Samaj - ${p.block || ''}`, 'END:VCARD'].join('\r\n'));
      }
      download(`dangi-contacts-${(where || 'all').replace(/\W+/g, '-')}.vcf`, out.join('\r\n'), 'text/vcard');
    };
    $('#one').onclick = () => {
      const sent = new Set();
      const msgFor = m => tplEl.value.replace(/\{name\}/g, m.full_name);
      $('#queue').innerHTML = `<section class="card flush"><div class="table-head"><h2 class="h3">Tap each person to open WhatsApp</h2>
        <span class="muted small" id="q-count">0 of ${contacts.length} opened</span></div>
        <ul class="queue">${contacts.map((m, i) => `<li><span><b>${esc(m.full_name)}</b><small class="mono">${esc(m.whatsapp || m.phone)}</small></span>
          <a class="btn small" data-q="${i}" target="_blank" rel="noopener" href="https://wa.me/${waDigits(m.whatsapp || m.phone)}?text=${encodeURIComponent(msgFor(m))}">Open WhatsApp</a></li>`).join('')}</ul></section>`;
      $$('[data-q]').forEach(a => {
        a.addEventListener('pointerdown', () => { a.href = `https://wa.me/${waDigits(contacts[+a.dataset.q].whatsapp || contacts[+a.dataset.q].phone)}?text=${encodeURIComponent(msgFor(contacts[+a.dataset.q]))}`; });
        a.addEventListener('click', () => { sent.add(a.dataset.q); a.classList.add('done'); a.textContent = 'Opened ✓'; $('#q-count').textContent = `${sent.size} of ${contacts.length} opened`; });
      });
      $('#queue').scrollIntoView({ behavior: 'smooth' });
    };
  }

  /* ---------------------------------------------------------- LOCATIONS */
  async function viewLocations(root, { node } = {}) {
    const admin = me.role === 'super_admin';
    const scopeId = me.location_id ?? null;
    node = node ?? scopeId;
    const nodeLoc = node ? (await data.locations([node]))[0] : null;
    const kids = await data.children(node);
    const childLevel = nodeLoc ? LEVELS[LEVELS.indexOf(nodeLoc.level) + 1] : 'state';
    const R = nodeLoc?.region || 'india';
    const crumbs = [];
    if (!scopeId) crumbs.push({ id: '', name: 'All · सभी' });
    if (nodeLoc) (await data.locations(nodeLoc.path)).forEach(a => { if (!scopeId || a.path.includes(scopeId)) crumbs.push({ id: a.id, name: a.name }); });
    const canAdd = childLevel && (admin || childLevel === 'village');
    const pBooths = nodeLoc?.level === 'panchayat' ? await data.booths(node) : [];

    root.innerHTML = `<nav class="crumbs">${crumbs.map((c, i) => i === crumbs.length - 1 ? `<span>${esc(c.name)}</span>` : `<button data-n="${c.id}">${esc(c.name)}</button><i>›</i>`).join('')}</nav>
      <div class="head-row"><h1 class="h2">${childLevel ? (nodeLoc ? lvlPl(childLevel, R) : 'States, provinces and regions') : 'Village'} ${nodeLoc ? 'in ' + esc(nodeLoc.name) : ''}</h1><span class="muted">${kids.length} listed</span></div>
      ${canAdd ? `<form class="card row wrap-row" id="addloc">
        <label class="field grow"><span>New ${childLevel} name (English)</span><input id="ln" required></label>
        <label class="field grow"><span>नाम (हिंदी) · optional</span><input id="lh"></label>
        <button class="btn primary" type="submit">Add ${childLevel}</button></form>` : ''}
      ${!admin && childLevel && childLevel !== 'village' ? `<p class="muted small">Only the super admin can add ${LVL_PL[childLevel].toLowerCase()}. Coordinators can add missing villages once they open a panchayat.</p>` : ''}
      ${kids.length && !nodeLoc ? REGIONS.map(g => { const list = kids.filter(k => (k.region || 'india') === g); return list.length ? `<h2 class="h3 chips-head">${esc(REGION[g])} <span class="muted small">· ${list.length}</span></h2><ul class="chips">${list.map(k =>
        `<li><button data-n="${k.id}">${esc(k.name)}${k.name_hi ? ` <small>${esc(k.name_hi)}</small>` : ''}</button></li>`).join('')}</ul>` : ''; }).join('')
      : kids.length ? `<ul class="chips">${kids.map(k => `<li><button data-n="${k.id}" ${childLevel === 'village' ? 'disabled' : ''}>${esc(k.name)}${k.name_hi ? ` <small>${esc(k.name_hi)}</small>` : ''}</button></li>`).join('')}</ul>`
        : `<div class="card empty"><p>${childLevel === 'village' ? 'No official village list here. Members type their village name on the form; add names here only if you want them fixed in the list.' : `Nothing listed here yet.${admin ? ' Add entries one by one above, or import the official LGD list (see README).' : ''}`}</p></div>`}
      ${pBooths.length ? `<section class="card"><h2 class="h3">Polling booths in ${esc(nodeLoc.name)} <span class="muted small">· ${esc(pBooths[0].assembly)} Vidhan Sabha · ${pBooths.length} booths</span></h2>
        <ul class="booth-list">${pBooths.map(b => `<li><b>${b.number}</b><span>${esc(b.name)}</span></li>`).join('')}</ul></section>` : ''}`;
    $$('[data-n]', root).forEach(b => b.onclick = () => go('locations', { node: b.dataset.n === '' ? null : +b.dataset.n }));
    const fm = $('#addloc', root);
    if (fm) fm.onsubmit = async e => {
      e.preventDefault();
      const name = $('#ln', root).value.trim(); if (!name) return;
      try { await data.addLocation({ level: childLevel, name, name_hi: $('#lh', root).value.trim() || null, parent_id: node }); toast(`${name} added`); go('locations', { node }); }
      catch (err) { toast(err.message, 'bad'); }
    };
  }

  /* ---------------------------------------------------------- COORDINATORS (super admin) */
  async function viewCoordinators(root) {
    const list = await data.coordinators();
    await data.locations(list.map(c => c.location_id).filter(Boolean));
    const area = async c => (c.location_id ? pathText((await data.locations([c.location_id]))[0]?.path || [], 'state') : 'Everywhere');
    const areas = await Promise.all(list.map(area));
    const order = ['super_admin', 'state', 'district', 'block', 'panchayat'];
    const idx = list.map((c, i) => i).sort((a, b) => order.indexOf(list[a].role) - order.indexOf(list[b].role));

    root.innerHTML = `<div class="head-row"><h1 class="h2">Coordinators</h1><span class="muted">${list.length} people</span></div>
      <form class="card form" id="cf"><h2 class="h3">Appoint a coordinator</h2>
        <p class="muted small">They log in with this email. Each coordinator sees and manages only the members inside their own area.</p>
        <div class="grid2">
          <label class="field"><span>Email *</span><input id="c-email" type="email" required></label>
          <label class="field"><span>Name</span><input id="c-name"></label>
          <label class="field"><span>Mobile</span><input id="c-phone" type="tel" inputmode="numeric"></label>
          <label class="field"><span>Level *</span><select id="c-role">${order.slice(1).map(r => `<option value="${r}" ${r === 'district' ? 'selected' : ''}>${ROLE[r]}</option>`).join('')}<option value="super_admin">Super admin (full access)</option></select></label>
        </div>
        <div id="c-area" class="group-inline"></div>
        <div class="row end"><button class="btn primary" type="submit">Save coordinator</button></div></form>
      <section class="card flush"><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Name</th><th>Level and area</th><th class="hide-sm">Email</th><th></th></tr></thead>
        <tbody>${idx.map(i => { const c = list[i]; return `<tr>
          <td><b>${esc(c.full_name || '—')}</b><div class="muted small mono">${esc(c.phone || '')}</div></td>
          <td><span class="pill role">${ROLE[c.role]}</span><div class="small">${esc(areas[i])}</div></td>
          <td class="hide-sm small">${esc(c.email)}${c.active ? '' : ' <span class="pill rejected">inactive</span>'}</td>
          <td class="end">${c.email === me.email ? '<span class="muted small">you</span>' : `
            <button class="btn small ghost" data-tog="${esc(c.email)}">${c.active ? 'Pause' : 'Activate'}</button>
            <button class="btn small ghost danger-text" data-rm="${esc(c.email)}">Remove</button>`}</td></tr>`; }).join('')}</tbody></table></div></section>`;

    let picker = null;
    const roleSel = $('#c-role', root);
    const mountArea = async () => {
      const r = roleSel.value;
      if (r === 'super_admin') { $('#c-area').innerHTML = '<p class="muted small">Super admins see everything everywhere.</p>'; picker = null; return; }
      picker = await locPicker($('#c-area'), { upto: r, required: true });
    };
    roleSel.onchange = mountArea; await mountArea();
    $('#cf', root).onsubmit = async e => {
      e.preventDefault();
      const role = roleSel.value;
      const g = picker && picker.get();
      if (role !== 'super_admin' && (!g || g.level !== role)) { toast(`Choose the ${role} this person will manage.`, 'bad'); return; }
      const c = { email: $('#c-email').value.trim().toLowerCase(), full_name: $('#c-name').value.trim() || null,
        phone: cleanPhone($('#c-phone').value) || null, role, location_id: role === 'super_admin' ? null : g.id, active: true };
      if (!c.email) { toast('Enter an email address.', 'bad'); return; }
      try { await data.saveCoordinator(c); toast(`${c.full_name || c.email} saved as ${ROLE[role].toLowerCase()}`); go('coordinators'); }
      catch (err) { toast(err.message, 'bad'); }
    };
    $$('[data-tog]', root).forEach(b => b.onclick = async () => {
      const c = list.find(x => x.email === b.dataset.tog);
      try { await data.saveCoordinator({ ...c, active: !c.active }); go('coordinators'); } catch (err) { toast(err.message, 'bad'); }
    });
    $$('[data-rm]', root).forEach(b => b.onclick = async () => {
      if (!(await confirmBox(`Remove ${b.dataset.rm}? They will lose access immediately.`, 'Remove', true))) return;
      try { await data.removeCoordinator(b.dataset.rm); toast('Coordinator removed'); go('coordinators'); } catch (err) { toast(err.message, 'bad'); }
    });
  }

  /* ---------------------------------------------------------- boot */
  async function boot() {
    try {
      data = window.createDataLayer(C);
    } catch (e) {
      app.innerHTML = `<div class="wrap main"><div class="card error-card"><h2>Could not start</h2><p>${esc(e.message)}</p></div></div>`; return;
    }
    if (data.mode === 'live') {
      const s = await data.session();
      if (s) { me = await data.me().catch(() => null); await loadScope(); }
      data.onAuth(async s2 => {
        if (s2 && !me) { me = await data.me().catch(() => null); if (me) { await loadScope(); go('overview'); } }
      });
    }
    window.addEventListener('online', flushQueue);
    // phones may reopen the page from memory with an old choice still selected: start the form fresh
    window.addEventListener('pageshow', e => { if (e.persisted && current === 'register') go('register', { force: true }); });
    window.addEventListener('hashchange', () => {
      const r = { nri: 'abroad', abroad: 'abroad', nepal: 'nepal', india: 'india' }[location.hash.slice(1).toLowerCase()];
      if (r && !me) go('register', { region: r });
    });
    flushQueue();
    const start = (location.hash || '').slice(1).toLowerCase();
    // shareable links: …/#nri opens the form on "Abroad", …/#nepal on Nepal
    const startRegion = { nri: 'abroad', abroad: 'abroad', nepal: 'nepal' }[start];
    go(TABS.some(t => t.id === start) || start === 'login' ? start : 'register', startRegion ? { region: startRegion } : {});

    if ('serviceWorker' in navigator && data.mode === 'live') {
      navigator.serviceWorker.register('sw.js').catch(() => { /* optional */ });
    }
  }
  boot();
})();
