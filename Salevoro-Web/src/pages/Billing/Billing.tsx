import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Billing.module.css';

export default class Billing extends DCLogic {
  catalog = this.build();
  saveNewCust() {
    const nc = this.state.nc, m = nc.mobile.replace(/\D/g, '');
    let err = '';
    if (m.length !== 10) err = 'Enter a 10-digit mobile number.';
    else if (!nc.name.trim()) err = 'Enter the customer name.';
    else if (this.customers.some(c => c.mobile === m)) err = 'This mobile is already registered — use Find instead.';
    if (err) return this.setState({ nc: { ...nc, err, tried: true } });
    const stored = JSON.parse(db.getItem('sc_customers_new') || '[]');
    const id = 9 + stored.length;
    const rec = { id, code: 'CUS-' + (1000 + id), name: nc.name.trim(), mobile: m, email: '', city: '', state: 'Tamil Nadu', dob: nc.dob, anniv: '', size: 'M', spend: 0, points: 0, since: new Date().toISOString().slice(0, 10), gstin: '', address: '', optin: nc.optin };
    db.setItem('sc_customers_new', JSON.stringify([...stored, rec]));
    const c = { mobile: m, name: rec.name, state: 'Tamil Nadu', tier: 'Silver', points: 0 };
    this.customers.push(c);
    this.setState({ nc: null, cust: c, custQ: '', custMsg: 'Try 98400 12345 · or continue as walk-in' });
  }
  customers = [
    { mobile: '9840012345', name: 'Ananya Iyer', state: 'Tamil Nadu', tier: 'Gold', points: 1840 },
    { mobile: '9876543210', name: 'Kavya Reddy', state: 'Karnataka', tier: 'Silver', points: 620 },
    { mobile: '9444455566', name: 'Lakshmi Narayan', state: 'Tamil Nadu', tier: 'Platinum', points: 5210 },
    ...JSON.parse(db.getItem('sc_customers_new') || '[]').map(c => ({ mobile: c.mobile, name: c.name, state: c.state, tier: 'Silver', points: c.points || 0 })),
  ];
  state: any = { q: '', cart: [], cust: null, custQ: '', custMsg: 'Try 98400 12345 · or continue as walk-in', redeem: false, pay: { cash: '', card: '', upi: '' }, ref: { card: '', upi: '' }, sp: 'Meena K', inv: null, branch: db.getItem('sc_branch') || 'Chennai · T. Nagar', seq: +(db.getItem('sc_inv_seq') || 1043), wa: {}, nc: null, narrow: window.innerWidth < 640 };

  componentDidMount() {
    this.onBr = e => this.setState({ branch: e.detail }); window.addEventListener('sc-branch', this.onBr);
    this.onRs = () => { const w = window.innerWidth; if ((w < 640) !== this.state.narrow) this.setState({ narrow: w < 640 }); }; window.addEventListener('resize', this.onRs);
    this.onTh = () => this.forceUpdate(); window.addEventListener('sc-theme', this.onTh);
  }
  componentWillUnmount() { window.removeEventListener('sc-branch', this.onBr); window.removeEventListener('resize', this.onRs); window.removeEventListener('sc-theme', this.onTh); }

  build() {
    const P = [
      ['SC-ANK-104', 'Noor Anarkali Suit', 6890, ['S', 'M', 'L', 'XL'], 'Teal', '6204'],
      ['SC-LHG-021', 'Mehr Bridal Lehenga', 48500, ['S', 'M', 'L'], 'Maroon', '6204'],
      ['SC-SAR-310', 'Kanjivaram Silk Saree', 18200, ['FS'], 'Mustard', '5007'],
      ['SC-KUR-552', 'Ira Cotton Kurti', 1290, ['S', 'M', 'L', 'XL', 'XXL'], 'Indigo', '6206'],
      ['SC-GWN-077', 'Celeste Evening Gown', 12400, ['S', 'M', 'L'], 'Midnight', '6204'],
      ['SC-SAL-218', 'Phulkari Salwar Set', 3450, ['M', 'L', 'XL'], 'Rose', '6204'],
      ['SC-DUP-090', 'Banarasi Dupatta', 2150, ['FS'], 'Gold', '6214'],
      ['SC-KID-033', 'Tara Kids Lehenga', 2490, ['4Y', '6Y', '8Y'], 'Peach', '6209'],
    ];
    const out = [];
    P.forEach((p, i) => p[3].forEach((s, j) => out.push({ sku: p[0] + '-' + s, barcode: '8901234' + String(100 + i * 10 + j).padStart(6, '0'), name: p[1], price: p[2], size: s, color: p[4], hsn: p[5], slab: p[5] === '5007' ? 'SLK' : p[5] === '6214' ? 'ACC' : 'APP', stock: 2 + ((i * 7 + j * 3) % 11) })));
    return out;
  }
  slabs = (() => { try { return JSON.parse(db.getItem('sc_gst_slabs')) || []; } catch (e) { return []; } })();
  rateOf(id, unit) { const s = this.slabs.find(x => x.id === id); if (!s) return unit <= 2500 ? 5 : 18; return s.type === 'fixed' ? +s.rate : unit <= +s.threshold ? +s.low : +s.high; }
  inr(n, d = 0) { return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  add(sku) {
    this.setState(s => {
      const cart = [...s.cart]; const i = cart.findIndex(l => l.sku === sku);
      const it = this.catalog.find(x => x.sku === sku) || {};
      let msg;
      if (i >= 0) { const qty = cart[i].qty + 1; cart[i] = { ...cart[i], qty }; msg = (it.name || sku) + ' · ' + (it.size || '') + ' — quantity ' + qty; }
      else { cart.push({ sku, qty: 1, disc: '' }); msg = (it.name || sku) + ' · ' + (it.size || '') + ' added'; }
      return { cart, q: '', scanMsg: msg, flash: sku };
    });
    clearTimeout(this.scanT); this.scanT = setTimeout(() => this.setState({ scanMsg: '', flash: '' }), 1800);
  }
  upd(i, patch) { this.setState(s => ({ cart: s.cart.map((l, k) => k === i ? { ...l, ...patch } : l) })); }
  findCust() {
    const m = this.state.custQ.replace(/\D/g, '');
    const c = this.customers.find(c => c.mobile === m);
    if (c) this.setState({ cust: c, custQ: '' });
    else this.setState({ custMsg: m.length === 10 ? 'No customer with this number.' : 'Enter a 10-digit mobile number.', notFound: m.length === 10 ? m : '' });
  }
  calc() {
    const s = this.state, by = Object.fromEntries(this.catalog.map(c => [c.sku, c]));
    const inter = s.cust && s.cust.state !== 'Tamil Nadu';
    const lines = s.cart.map((l, i) => {
      const it = by[l.sku], gross = it.price * l.qty, dp = Math.min(100, parseFloat(l.disc) || 0);
      const discAmt = gross * dp / 100, amt = gross - discAmt, rate = this.rateOf(it.slab, amt / l.qty);
      return { ...it, i, qty: l.qty, disc: l.disc, gross, discAmt, amt, rate, taxable: amt / (1 + rate / 100) };
    });
    const gross = lines.reduce((a, l) => a + l.gross, 0), disc = lines.reduce((a, l) => a + l.discAmt, 0), sub = gross - disc;
    const redeemable = s.cust ? Math.min(s.cust.points, Math.floor(sub * 0.2)) : 0, redeem = s.redeem ? redeemable : 0;
    const f = sub ? (sub - redeem) / sub : 1;
    const taxable = lines.reduce((a, l) => a + l.taxable, 0) * f, tax = (sub - redeem) - taxable;
    const raw = sub - redeem, net = Math.round(raw);
    return { lines, inter, gross, disc, redeemable, redeem, taxable, tax, round: net - raw, net };
  }
  renderVals() {
    const s = this.state, c = this.calc(), inr = this.inr.bind(this);
    const q = s.q.trim().toLowerCase();
    const sugg = q.length >= 2 ? this.catalog.filter(x => (x.name + ' ' + x.sku + ' ' + x.barcode).toLowerCase().includes(q)).slice(0, 6) : [];
    const num = v => parseFloat(v) || 0;
    const paid = num(s.pay.cash) + num(s.pay.card) + num(s.pay.upi);
    const bal = c.net - paid;
    const nonCash = num(s.pay.card) + num(s.pay.upi);
    const invNo = 'TNG/26-27/' + String(s.seq).padStart(5, '0');
    const sumRows = [
      { label: `Gross (${c.lines.reduce((a, l) => a + l.qty, 0)} pcs)`, value: inr(c.gross, 2) },
      { label: 'Item discount', value: '−' + inr(c.disc, 2) },
      ...(c.redeem ? [{ label: 'Loyalty redeemed', value: '−' + inr(c.redeem, 2) }] : []),
      { label: 'Taxable value', value: inr(c.taxable, 2) },
      ...(c.inter ? [{ label: 'IGST', value: inr(c.tax, 2) }] : [{ label: 'CGST', value: inr(c.tax / 2, 2) }, { label: 'SGST', value: inr(c.tax / 2, 2) }]),
      { label: 'Round off', value: (c.round >= 0 ? '+' : '−') + inr(Math.abs(c.round), 2) },
    ];
    const P = [['cash', 'Cash', 'ph ph-money', ''], ['card', 'Card', 'ph ph-credit-card', 'Card last 4 digits / approval code'], ['upi', 'UPI', 'ph ph-qr-code', 'UPI transaction ID']];
    const wa = (() => { try { return { connected: true, autoInvoice: true, ...(JSON.parse(db.getItem('sc_wa')) || {}) }; } catch (e) { return { connected: true, autoInvoice: true }; } })();
    const W = s.wa || {}, wm = (W.mobile || '').replace(/\D/g, '');
    const waMsg = s.inv ? `Hi ${s.inv.custName === 'Walk-in customer' ? 'there' : s.inv.custName.split(' ')[0]}, thank you for shopping at ${s.inv.storeName}! Your invoice ${s.inv.no} for ${s.inv.net} is attached.\nLoyalty points earned: ${s.inv.earned}. Exchange within 7 days with original tags.` : '';
    const pm = s.pm || { method: 'cash', received: '', ref: '' }, pmRecv = pm.received === '' ? c.net : num(pm.received), pmBal = pmRecv - c.net;
    const complete = () => {
      const M = { cash: 'Cash', card: 'Card', upi: 'UPI' };
      const pays = [{ label: M[pm.method], amount: inr(pm.method === 'cash' ? pmRecv : c.net, 2), ref: pm.method !== 'cash' && pm.ref ? '· ' + pm.ref : '' }];
      if (pm.method === 'cash' && pmBal > 0) pays.push({ label: 'Change returned', amount: inr(pmBal, 2), ref: '' });
      const inv = {
        no: invNo, date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), sp: s.sp,
        ...(() => { let st = {}; try { st = JSON.parse(db.getItem('sc_store')) || {}; } catch (e) {}
          const br = (st.branches || []).find(x => x.name === s.branch) || {};
          const mob = (br.mobile || st.mobile || '9844012345').replace(/\D/g, '').replace(/^(\d{5})(\d{5})$/, '$1 $2');
          return { storeName: st.name || 'Saanvi Couture', logo: st.logo || '', hasLogo: !!st.logo, gstin: st.gstin || '33ABCPS1234K1Z5', footer: st.footer || 'Exchange within 7 days with original tags and this invoice. No cash refunds on sale items.',
            storeContact: '+91 ' + mob + (st.email ? ' · ' + st.email : ''),
            branchAddr: br.address || (s.branch.startsWith('Bengaluru') ? '14, 80 Ft Road, Koramangala, Bengaluru 560034' : s.branch.includes('Anna') ? '2nd Ave, Anna Nagar, Chennai 600040' : '42, Usman Road, T. Nagar, Chennai 600017') }; })(),
        custName: s.cust ? s.cust.name : 'Walk-in customer', custLine: s.cust ? '+91 ' + s.cust.mobile : '—',
        pos: s.cust ? s.cust.state : 'Tamil Nadu',
        lines: c.lines.map((l, k) => ({ n: k + 1, name: l.name + ' · ' + l.size, sku: l.sku, hsn: l.hsn, qty: l.qty, mrp: inr(l.price, 2), discAmt: inr(l.discAmt, 2), rate: l.rate + '%', amount: inr(l.amt, 2) })),
        sum: sumRows, net: inr(c.net, 2), pays, earned: Math.floor(c.net / 100),
      };
      db.setItem('sc_inv_seq', s.seq + 1);
      const auto = wa.connected && wa.autoInvoice && s.cust;
      this.setState({ inv, pm: null, wa: { open: true, mobile: s.cust ? s.cust.mobile : '', status: auto ? 'sending' : '' } });
      if (auto) setTimeout(() => this.setState(st => st.wa.status === 'sending' ? { wa: { ...st.wa, status: 'delivered', auto: true } } : null), 1200);
    };
    return {
      branch: s.branch, invNo, today: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      sp: s.sp, onSp: e => this.setState({ sp: e.target.value }),
      q: s.q, onQ: e => this.setState({ q: e.target.value }),
      onScanKey: e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const v = (e.target.value || '').trim(), vl = v.toLowerCase();
        const exact = this.catalog.find(x => x.barcode === v || x.sku.toLowerCase() === vl);
        if (exact) this.add(exact.sku); else if (sugg.length === 1) this.add(sugg[0].sku);
        else if (v) { this.setState({ scanMsg: 'No item found for “' + v + '”', flash: '' }); clearTimeout(this.scanT); this.scanT = setTimeout(() => this.setState({ scanMsg: '' }), 2200); }
      },
      hasSugg: sugg.length > 0, hasScanMsg: !!s.scanMsg, scanMsg: s.scanMsg,
      sugg: sugg.map(x => ({ name: x.name + ' · ' + x.size, sku: x.sku, color: x.color, stock: x.stock, price: inr(x.price), add: () => this.add(x.sku) })),
      samples: ['SC-ANK-104-M', 'SC-SAR-310-FS', 'SC-KUR-552-L', 'SC-DUP-090-FS'].map(sku => ({ sku, add: () => this.add(sku) })),
      empty: c.lines.length === 0,
      lines: c.lines.map(l => ({
        name: l.name + ' · ' + l.size, sku: l.sku, color: l.color, rowBg: s.flash === l.sku ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent', mrp: inr(l.price), qty: l.qty, disc: l.disc, rate: l.rate + '%', amount: inr(l.amt, 2),
        inc: () => this.upd(l.i, { qty: l.qty + 1 }),
        dec: () => l.qty > 1 ? this.upd(l.i, { qty: l.qty - 1 }) : this.setState(st => ({ cart: st.cart.filter((_, k) => k !== l.i) })),
        onDisc: e => this.upd(l.i, { disc: e.target.value.replace(/[^\d.]/g, '') }),
        remove: () => this.setState(st => ({ cart: st.cart.filter((_, k) => k !== l.i) })),
      })),
      noCust: !s.cust, hasCust: !!s.cust,
      showAddFromSearch: !!s.notFound,
      openNewCust: () => this.setState({ nc: { mobile: s.notFound || (s.custQ.replace(/\D/g, '').length === 10 ? s.custQ : ''), name: '', dob: '', optin: true, err: '', tried: false } }),
      closeNewCust: () => this.setState({ nc: null }),
      ncBackdrop: e => { if (e.target === e.currentTarget) this.setState({ nc: null }); },
      ncOpen: !!s.nc, nc: s.nc || {},
      ncMobile: e => this.setState({ nc: { ...s.nc, mobile: e.target.value.replace(/[^\d ]/g, ''), err: '' } }),
      ncName: e => this.setState({ nc: { ...s.nc, name: e.target.value, err: '' } }),
      ncDob: e => this.setState({ nc: { ...s.nc, dob: e.target.value } }),
      ncOptin: () => this.setState({ nc: { ...s.nc, optin: !s.nc.optin } }),
      ncKey: e => { if (e.key === 'Enter') this.saveNewCust(); },
      ncMobileRing: s.nc && s.nc.tried && (s.nc.mobile || '').replace(/\D/g, '').length !== 10 ? 'inset 0 0 0 1px var(--color-accent-300)' : 'inset 0 0 0 1px var(--color-divider)',
      ncNameRing: s.nc && s.nc.tried && !(s.nc.name || '').trim() ? '0 0 0 1px var(--color-accent-300)' : 'none',
      ncHasErr: !!(s.nc && s.nc.err), ncErr: s.nc ? s.nc.err : '',
      saveNewCust: () => this.saveNewCust(), custQ: s.custQ, custMsg: s.custMsg,
      onCustQ: e => this.setState({ custQ: e.target.value, notFound: '' }),
      onCustKey: e => { if (e.key === 'Enter') this.findCust(); },
      findCust: () => this.findCust(),
      cust: s.cust ? { ...s.cust, initials: s.cust.name.split(' ').map(w => w[0]).join(''), mobile: s.cust.mobile.replace(/(\d{5})(\d{5})/, '$1 $2') } : {},
      clearCust: () => this.setState({ cust: null, redeem: false }),
      redeem: s.redeem, toggleRedeem: () => this.setState({ redeem: !s.redeem }),
      redeemable: c.redeemable, redeemValue: inr(c.redeemable),
      taxMode: c.inter ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)',
      sumRows, net: inr(c.net),
      payRows: P.map(([k, label, icon, refPh]) => ({
        label, icon, value: s.pay[k], refPh, ref: s.ref[k], showRef: !!refPh && num(s.pay[k]) > 0,
        onChange: e => this.setState({ pay: { ...s.pay, [k]: e.target.value.replace(/[^\d.]/g, '') } }),
        onRef: e => this.setState({ ref: { ...s.ref, [k]: e.target.value } }),
        fill: () => { const rest = Math.max(0, c.net - (paid - num(s.pay[k]))); this.setState({ pay: { ...s.pay, [k]: rest ? String(rest) : '' } }); },
      })),
      paid: inr(paid, 2),
      balLabel: !c.net ? '—' : bal > 0 ? 'Balance ' + inr(bal, 2) : bal < 0 ? 'Change ' + inr(-bal, 2) : 'Fully paid',
      balColor: bal > 0 ? 'var(--color-accent-300)' : 'var(--color-neutral-300)',
      cantComplete: !c.lines.length,
      complete,
      payOpen: !!s.pm, pm, openPay: () => this.setState({ pm: { method: 'cash', received: '', ref: '' } }), closePay: () => this.setState({ pm: null }),
      pmMethod: e => this.setState({ pm: { ...pm, method: e.target.value, ref: '' } }),
      pmReceived: e => this.setState({ pm: { ...pm, received: e.target.value.replace(/[^\d.]/g, '') } }),
      pmRef: e => this.setState({ pm: { ...pm, ref: e.target.value } }),
      pmIsCash: pm.method === 'cash', pmIsRef: pm.method !== 'cash', pmRefLabel: pm.method === 'card' ? 'Card last 4 digits / approval code' : 'UPI transaction ID',
      netPlain: String(c.net), pmChangeLabel: pmBal < 0 ? 'Short by' : 'Change to return', pmChange: inr(Math.abs(pmBal), 2), pmChangeColor: pmBal < 0 ? 'var(--color-accent-300)' : 'var(--color-text)',
      pmInvalid: !c.lines.length || (pm.method === 'cash' && pmBal < 0),
      confirmPay: () => complete(),
      clearAll: () => this.setState({ cart: [], cust: null, redeem: false, pay: { cash: '', card: '', upi: '' }, ref: { card: '', upi: '' } }),
      invLogo: (s.inv && s.inv.logo) ? React.createElement('img', { src: s.inv && s.inv.logo, alt: '', style: { width: 48, height: 48, objectFit: 'contain', flex: 'none' } }) : null, waOpen: !!W.open, toggleWa: () => this.setState({ wa: { ...W, open: !W.open, mobile: W.mobile || (s.cust ? s.cust.mobile : '') } }),
      waMobile: W.mobile || '', onWaMobile: e => this.setState({ wa: { ...W, mobile: e.target.value.replace(/[^\d ]/g, ''), status: '' } }),
      waStatus: { sending: 'Sending…', delivered: W.auto ? 'Sent automatically · delivered' : 'Delivered', opened: 'Opened in WhatsApp' }[W.status] || (wa.connected ? 'Not sent yet' : 'Business API not connected'),
      waIcon: W.status === 'delivered' ? 'ph ph-checks' : W.status === 'sending' ? 'ph ph-clock' : W.status === 'opened' ? 'ph ph-arrow-square-out' : 'ph ph-circle-dashed',
      waColor: W.status === 'delivered' ? 'var(--color-accent-300)' : 'var(--color-neutral-400)',
      waCantSend: wm.length !== 10 || W.status === 'sending',
      waBtn: !wa.connected ? 'Open WhatsApp' : W.status === 'delivered' ? 'Resend' : 'Send invoice',
      waPreview: (s.inv ? 'Invoice_' + s.inv.no.replace(/\//g, '-') + '.pdf\n' : '') + waMsg,
      waNote: wa.connected ? 'Sent from your WhatsApp Business number with the invoice_share template. The PDF link stays valid for 90 days.' : 'WhatsApp Business is not connected, so this opens WhatsApp with the message ready to send. Connect it under WhatsApp Business to send the PDF automatically.',
      sendWa: () => {
        if (!wa.connected) { window.open('https://wa.me/91' + wm + '?text=' + encodeURIComponent(waMsg), '_blank'); return this.setState({ wa: { ...W, status: 'opened' } }); }
        this.setState({ wa: { ...W, status: 'sending', auto: false } });
        setTimeout(() => this.setState(st => ({ wa: { ...st.wa, status: 'delivered' } })), 1200);
      },
      wide: !s.narrow,
      rowCols: s.narrow ? '88px 64px minmax(0,1fr) 92px 22px' : 'minmax(150px,1fr) 88px 58px 44px 92px 22px',
      rowAreas: s.narrow ? '"name name name name x" "qty disc gst amt amt"' : '"name qty disc gst amt x"',
      showBar: s.narrow && c.lines.length > 0 && !s.inv, itemCount: c.lines.reduce((a, l) => a + l.qty, 0) + ' pcs',
      goCheckout: () => { const el = document.getElementById('checkout'); if (el) { const m = scMain(); m.scrollTo({ top: el.getBoundingClientRect().top - m.getBoundingClientRect().top + m.scrollTop - 14, behavior: 'smooth' }); } },
      brightLabel: (window.scTheme && window.scTheme.get().brightBilling) ? 'Bright' : 'Theme',
      brightIcon: (window.scTheme && window.scTheme.get().brightBilling) ? 'ph ph-sun' : 'ph ph-moon',
      brightTitle: 'Bright screen for billing — click to toggle',
      toggleBright: () => { const T = window.scTheme; if (T) T.set({ brightBilling: !T.get().brightBilling }); },
      showInv: !!s.inv, inv: s.inv || { lines: [], sum: [], pays: [] },
      print: () => window.print(),
      newBill: () => this.setState({ wa: {}, inv: null, cart: [], cust: null, redeem: false, pay: { cash: '', card: '', upi: '' }, ref: { card: '', upi: '' }, seq: s.seq + 1 }),
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <section className={styles.section1}>
            <header className={styles.header1}>
              <div>
                <div className={styles.box2}>Sales · {$v.branch}</div>
                <h1 className={styles.title1}>New bill</h1>
              </div>
              <div className={styles.box3}>
                <button className={`btn btn-secondary ${styles.button1}`} onClick={$v.toggleBright} title={$v.brightTitle}>
                  <i className={`${$v.brightIcon ?? ''} ${styles.icon1}`} />
                  {$v.brightLabel}
                </button>
                <span className={`tag tag-outline ${styles.text1}`}>{$v.invNo}</span>
                <span className="tag tag-neutral">{$v.today}</span>
                <select className={`input ${styles.select1}`} value={$v.sp} onChange={$v.onSp}>
                  <option value="Meena K">Sales: Meena K</option>
                  <option value="Arjun S">Sales: Arjun S</option>
                  <option value="Divya P">Sales: Divya P</option>
                </select>
              </div>
            </header>
            <div className={styles.box4}>
              <div className={styles.box5}>
                <i className={`ph ph-barcode ${styles.icon2}`} />
                <input className={styles.field1} value={$v.q} onChange={$v.onQ} onKeyDown={$v.onScanKey} autoFocus={true} placeholder="Scan barcode, or search SKU / product name" />
                <span className={styles.text2}>Enter</span>
              </div>
              {$v.hasScanMsg ? (
                <>
                  <div className={styles.box6}>
                    <i className="ph ph-check-circle" />
                    {$v.scanMsg}
                  </div>
                </>
              ) : null}
              {$v.hasSugg ? (
                <>
                  <div className={styles.box7}>
                    {($v.sugg || []).map((s: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <button className={styles.button2} onClick={s?.add}>
                          <div className={styles.box8}>
                            <div className={styles.box9}>{s?.name}</div>
                            <div className={styles.box10}>{s?.sku} · {s?.color}</div>
                          </div>
                          <span className={styles.text3}>{s?.stock} in stock</span>
                          <span className={styles.box9}>{s?.price}</span>
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <div className={styles.box11}>
              <span>Quick add:</span>
              {($v.samples || []).map((s: any, $index: number) => (
                <React.Fragment key={$index}>
                  <button className={styles.button3} onClick={s?.add}>{s?.sku}</button>
                </React.Fragment>
              ))}
            </div>
            <div className={styles.box12}>
              {$v.wide ? (
                <>
                  <div className={styles.box13}>
                    <span>Item</span>
                    <span className={styles.text4}>Qty</span>
                    <span className={styles.text5}>Disc %</span>
                    <span className={styles.text4}>GST</span>
                    <span className={styles.text5}>Amount</span>
                    <span />
                  </div>
                </>
              ) : null}
              {$v.empty ? (
                <>
                  <div className={styles.box14}>
                    <i className={`ph ph-scan ${styles.icon3}`} />
                    <div className={styles.box15}>No items yet</div>
                    <div className={styles.box16}>Scan a tag or search above to start the bill.</div>
                  </div>
                </>
              ) : null}
              {($v.lines || []).map((l: any, $index: number) => (
                <React.Fragment key={$index}>
                  <div className={styles.box17} style={{ gridTemplateColumns: $v.rowCols, gridTemplateAreas: $v.rowAreas, background: l?.rowBg }}>
                    <div className={styles.box18}>
                      <div className={styles.box19}>{l?.name}</div>
                      <div className={styles.box20}>
                        <span className={styles.text6}>{l?.sku}</span>
                        {" "}· {l?.color} · MRP {l?.mrp}
                      </div>
                    </div>
                    <div className={styles.box21}>
                      <button className={styles.button4} onClick={l?.dec}>−</button>
                      <span className={styles.text7}>{l?.qty}</span>
                      <button className={styles.button4} onClick={l?.inc}>+</button>
                    </div>
                    <input className={`input ${styles.field2}`} value={l?.disc} onChange={l?.onDisc} inputMode="decimal" placeholder="Disc %" />
                    <span className={`tag tag-neutral ${styles.text8}`}>{l?.rate}</span>
                    <span className={styles.text9}>{l?.amount}</span>
                    <button className={styles.button5} onClick={l?.remove} title="Remove"><i className={`ph ph-x ${styles.icon1}`} /></button>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className={styles.box22}>
              Prices are GST-inclusive. Rates come from each product's GST slab —{" "}
              <A href="GST.dc.html">configure slabs</A>
              .
            </div>
          </section>
          <aside className={styles.aside1} id="checkout">
            <div className={`card ${styles.box23}`}>
              <div className={styles.box24}>
                <span className="card-kicker">Customer</span>
                <button className={styles.button6} onClick={$v.openNewCust}>+ New customer</button>
              </div>
              {$v.noCust ? (
                <>
                  <div className={styles.box25}>
                    <input className="input" placeholder="Mobile number" value={$v.custQ} onChange={$v.onCustQ} onKeyDown={$v.onCustKey} inputMode="numeric" />
                    <button className="btn btn-secondary" onClick={$v.findCust}>Find</button>
                  </div>
                  <div className={styles.box26}>
                    <span>{$v.custMsg}</span>
                    {$v.showAddFromSearch ? (
                      <>
                        <button className={`btn btn-ghost ${styles.button7}`} onClick={$v.openNewCust}>Add customer</button>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
              {$v.hasCust ? (
                <>
                  <div className={styles.box27}>
                    <div className={styles.box28}>{$v.cust?.initials}</div>
                    <div className={styles.box29}>
                      <div className={styles.icon1}>{$v.cust?.name}</div>
                      <div className={styles.box22}>{$v.cust?.mobile} · {$v.cust?.state}</div>
                    </div>
                    <span className="tag tag-accent">{$v.cust?.tier}</span>
                    <button className={styles.button8} onClick={$v.clearCust} title="Remove customer"><i className="ph ph-x" /></button>
                  </div>
                  <label className={styles.label1}>
                    <input type="checkbox" checked={$v.redeem} onChange={$v.toggleRedeem} />
                    <span className={styles.text10}>
                      Redeem{" "}
                      <b className={styles.bold1}>{$v.redeemable}</b>
                      {" "}of {$v.cust?.points} pts
                    </span>
                    <span className={styles.text11}>−{$v.redeemValue}</span>
                  </label>
                </>
              ) : null}
            </div>
            <div className={`card ${styles.box30}`}>
              <span className={`card-kicker ${styles.text12}`}>Summary · {$v.taxMode}</span>
              {($v.sumRows || []).map((r: any, $index: number) => (
                <React.Fragment key={$index}>
                  <div className={styles.box31}>
                    <span>{r?.label}</span>
                    <span>{r?.value}</span>
                  </div>
                </React.Fragment>
              ))}
              <div className={styles.box32} />
              <div className={styles.box33}>
                <span className={styles.box9}>Net payable</span>
                <span className={styles.text13}>{$v.net}</span>
              </div>
            </div>
            <button className={`btn btn-primary ${styles.button9}`} disabled={$v.cantComplete} onClick={$v.openPay}>
              <i className={`ph ph-printer ${styles.icon4}`} />
              Complete &amp; print invoice
            </button>
            <div className={styles.box25}>
              <button className={`btn btn-secondary ${styles.text10}`} onClick={$v.clearAll}>Clear bill</button>
              <A className={`btn btn-secondary ${styles.text10}`} href="Invoices.dc.html">Returns</A>
            </div>
          </aside>
        </main>
      </div>
      {$v.showBar ? (
        <>
          <div className={styles.box34} />
          <div className={styles.box35}>
            <div className={styles.box29}>
              <div className={styles.box20}>{$v.itemCount} · Net payable</div>
              <div className={styles.box36}>{$v.net}</div>
            </div>
            <button className={`btn btn-primary ${styles.button10}`} onClick={$v.openPay} disabled={$v.cantComplete}>
              Complete
              <i className="ph ph-printer" />
            </button>
          </div>
        </>
      ) : null}
      {$v.payOpen ? (
        <>
          <div className={`dialog-backdrop ${styles.box37}`}>
            <div className={`dialog ${styles.box38}`}>
              <div className="dialog-title">Payment</div>
              <div className={styles.box39}>
                <span className={styles.text14}>Net payable · {$v.itemCount}</span>
                <span className={styles.text15}>{$v.net}</span>
              </div>
              <div className="field">
                <label>Payment method</label>
                <select className="input" value={$v.pm?.method} onChange={$v.pmMethod}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              {$v.pmIsCash ? (
                <>
                  <div className="field">
                    <label>Amount received ₹</label>
                    <input className={`input ${styles.text5}`} value={$v.pm?.received} onChange={$v.pmReceived} inputMode="decimal" placeholder={$v.netPlain} />
                  </div>
                  <div className={styles.box40}>
                    <span className={styles.text16}>{$v.pmChangeLabel}</span>
                    <span style={{ color: $v.pmChangeColor }}>{$v.pmChange}</span>
                  </div>
                </>
              ) : null}
              {$v.pmIsRef ? (
                <>
                  <div className="field">
                    <label>{$v.pmRefLabel}</label>
                    <input className="input" value={$v.pm?.ref} onChange={$v.pmRef} placeholder="Optional" />
                  </div>
                </>
              ) : null}
              <div className="dialog-actions">
                <button className="btn btn-secondary" onClick={$v.closePay}>Cancel</button>
                <button className="btn btn-primary" onClick={$v.confirmPay} disabled={$v.pmInvalid}>
                  <i className="ph ph-printer" />
                  Complete &amp; print
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
      {$v.showInv ? (
        <>
          <div className={styles.box41}>
            <div className={styles.box42}>
              <div className={styles.box24}>
                <span className={styles.text17}>
                  <i className={`ph ph-check-circle ${styles.icon5}`} />
                  Invoice saved · {$v.inv?.no}
                </span>
                <div className={styles.box25}>
                  <button className="btn btn-secondary" onClick={$v.toggleWa}>
                    <i className="ph ph-whatsapp-logo" />
                    WhatsApp
                  </button>
                  <button className="btn btn-secondary" onClick={$v.print}>
                    <i className="ph ph-printer" />
                    Print
                  </button>
                  <button className="btn btn-primary" onClick={$v.newBill}>New bill</button>
                </div>
              </div>
              {$v.waOpen ? (
                <>
                  <div className={`card ${styles.box43}`}>
                    <div className={styles.box44}>
                      <span className={`card-kicker ${styles.text18}`}>
                        <i className={`ph ph-whatsapp-logo ${styles.box9}`} />
                        Send invoice on WhatsApp
                      </span>
                      <span className={styles.text19} style={{ color: $v.waColor }}>
                        <i className={`${$v.waIcon ?? ''}`} />
                        {$v.waStatus}
                      </span>
                    </div>
                    <div className={styles.box45}>
                      <div className={styles.box46}>
                        <span className={styles.text20}>+91</span>
                        <input className={styles.field3} value={$v.waMobile} onChange={$v.onWaMobile} inputMode="tel" placeholder="Customer mobile" />
                      </div>
                      <button className="btn btn-primary" onClick={$v.sendWa} disabled={$v.waCantSend}>
                        <i className="ph ph-paper-plane-tilt" />
                        {$v.waBtn}
                      </button>
                    </div>
                    <div className={styles.box47}>
                      <i className={`ph ph-file-pdf ${styles.icon6}`} />
                      <div className={styles.box48}>{$v.waPreview}</div>
                    </div>
                    <div className={styles.box20}>{$v.waNote}</div>
                  </div>
                </>
              ) : null}
              <div className={styles.box49} id="print-area" data-paper="1">
                <div className={styles.box50}>
                  <div>
                    <div className={styles.box51}>
                      {$v.inv?.hasLogo ? (
                        <>
                          {$v.invLogo}
                        </>
                      ) : null}
                      <div>
                        <div className={styles.box52}>{$v.inv?.storeName}</div>
                        <div className={styles.box53}>{$v.inv?.branchAddr}</div>
                        <div className={styles.box53}>GSTIN {$v.inv?.gstin} · {$v.inv?.storeContact}</div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.text5}>
                    <div className={styles.box54}>Tax invoice</div>
                    <div className={styles.box55}>{$v.inv?.no}</div>
                    <div className={styles.box53}>{$v.inv?.date}</div>
                  </div>
                </div>
                <div className={styles.box56}>
                  <div>
                    <div className={styles.box57}>Billed to</div>
                    <div className={styles.box9}>{$v.inv?.custName}</div>
                    <div className={styles.box53}>{$v.inv?.custLine}</div>
                  </div>
                  <div>
                    <div className={styles.box57}>Place of supply</div>
                    <div className={styles.box9}>{$v.inv?.pos}</div>
                    <div className={styles.box53}>Salesperson: {$v.inv?.sp}</div>
                  </div>
                </div>
                <table className={styles.table1}>
                  <thead>
                    <tr className={styles.row1}>
                      <th className={styles.headCell1}>#</th>
                      <th className={styles.headCell1}>Item</th>
                      <th className={styles.headCell1}>HSN</th>
                      <th className={styles.headCell2}>Qty</th>
                      <th className={styles.headCell2}>MRP</th>
                      <th className={styles.headCell2}>Disc</th>
                      <th className={styles.headCell2}>GST</th>
                      <th className={styles.headCell2}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {($v.inv?.lines || []).map((l: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <tr className={styles.row2}>
                          <td className={styles.cell1}>{l?.n}</td>
                          <td className={styles.cell1}>
                            {l?.name}
                            <div className={styles.box58}>{l?.sku}</div>
                          </td>
                          <td className={styles.cell1}>{l?.hsn}</td>
                          <td className={styles.cell2}>{l?.qty}</td>
                          <td className={styles.cell2}>{l?.mrp}</td>
                          <td className={styles.cell2}>{l?.discAmt}</td>
                          <td className={styles.cell2}>{l?.rate}</td>
                          <td className={styles.cell2}>{l?.amount}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                <div className={styles.box59}>
                  <div className={styles.box60}>
                    <div className={styles.box57}>Payments</div>
                    {($v.inv?.pays || []).map((p: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <div>
                          {p?.label} — {p?.amount}{" "}
                          <span className={styles.text21}>{p?.ref}</span>
                        </div>
                      </React.Fragment>
                    ))}
                    <div className={styles.box61}>Loyalty points earned: {$v.inv?.earned}</div>
                    <div className={styles.box62}>{$v.inv?.footer}</div>
                  </div>
                  <div className={styles.box63}>
                    {($v.inv?.sum || []).map((r: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <div className={styles.box64}>
                          <span className={styles.box53}>{r?.label}</span>
                          <span>{r?.value}</span>
                        </div>
                      </React.Fragment>
                    ))}
                    <div className={styles.box65}>
                      <span>Total</span>
                      <span>{$v.inv?.net}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
      {$v.ncOpen ? (
        <>
          <div className={`dialog-backdrop ${styles.box66}`} onClick={$v.ncBackdrop}>
            <div className={`dialog ${styles.box67}`}>
              <div className={styles.box24}>
                <div className="dialog-title">New customer</div>
                <button className={styles.button8} onClick={$v.closeNewCust}><i className={`ph ph-x ${styles.icon7}`} /></button>
              </div>
              <div className={styles.box68}>
                <div className="field">
                  <label>Mobile number *</label>
                  <div className={styles.box69} style={{ boxShadow: $v.ncMobileRing }}>
                    <span className={styles.text22}>+91</span>
                    <input className={styles.field3} value={$v.nc?.mobile} onChange={$v.ncMobile} inputMode="tel" placeholder="98400 12345" autoFocus={true} />
                  </div>
                </div>
                <div className="field">
                  <label>Name *</label>
                  <input className="input" value={$v.nc?.name} onChange={$v.ncName} onKeyDown={$v.ncKey} placeholder="Full name" style={{ boxShadow: $v.ncNameRing }} />
                </div>
                <div className="field">
                  <label>Date of birth</label>
                  <input className="input" type="date" value={$v.nc?.dob} onChange={$v.ncDob} />
                </div>
                <label className={styles.label2}>
                  <input type="checkbox" checked={$v.nc?.optin} onChange={$v.ncOptin} />
                  Send bills &amp; offers on WhatsApp
                </label>
              </div>
              {$v.ncHasErr ? (
                <>
                  <div className={styles.box70}>{$v.ncErr}</div>
                </>
              ) : null}
              <div className={styles.box20}>Add address, anniversary and size later from Customers.</div>
              <div className="dialog-actions">
                <button className="btn btn-secondary" onClick={$v.closeNewCust}>Cancel</button>
                <button className="btn btn-primary" onClick={$v.saveNewCust}>
                  <i className="ph ph-check" />
                  Add to bill
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
      </>
    );
  }
}
