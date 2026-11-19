import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Inventory.module.css';

export default class Inventory extends DCLogic {
  parseCsv(t) {
    const rows = []; let r = [], v = '', q = false;
    for (let i = 0; i < t.length; i++) { const c = t[i];
      if (q) { if (c === '"' && t[i + 1] === '"') { v += '"'; i++; } else if (c === '"') q = false; else v += c; }
      else if (c === '"') q = true; else if (c === ',') { r.push(v); v = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; r.push(v); rows.push(r); r = []; v = ''; } else v += c; }
    if (v || r.length) { r.push(v); rows.push(r); }
    const clean = rows.filter(x => x.some(c => c.trim()));
    const head = (clean.shift() || []).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'));
    return clean.map((x, n) => { const o = { _line: n + 2 }; head.forEach((h, k) => o[h] = (x[k] || '').trim()); return o; });
  }
  download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  readFile(e, cb) { const file = e.target.files && e.target.files[0]; if (!file) return; const fr = new FileReader(); fr.onload = () => cb(file.name, String(fr.result)); fr.readAsText(file); e.target.value = ''; }
  invSample() {
    return ['sku,item_name,category,cost,reorder_level,qty_t_nagar,qty_anna_nagar,qty_koramangala',
      'SC-ANK-104-M,Noor Anarkali Suit · M,Anarkali,3583,6,8,5,4',
      'SC-KUR-552-XL,Ira Cotton Kurti · XL,Kurti,671,6,12,9,10',
      'SC-SAR-401-FS,Mysore Crepe Saree · FS,Saree,4600,3,3,2,0'].join('\n');
  }
  analyseInv(rows) {
    const errs = [], ok = [], have = new Set(this.state.items.map(i => i.sku)); let add = 0, upd = 0;
    const Q = ['qty_t_nagar', 'qty_anna_nagar', 'qty_koramangala'];
    rows.forEach(r => {
      if (!r.sku) return errs.push('Row ' + r._line + ': missing sku');
      const bad = Q.filter(k => r[k] && !/^-?\d+$/.test(r[k]));
      if (bad.length) return errs.push('Row ' + r._line + ': ' + bad.join(', ') + ' must be whole numbers');
      if (!have.has(r.sku) && !r.item_name) return errs.push('Row ' + r._line + ': new SKU ' + r.sku + ' needs item_name');
      have.has(r.sku) ? upd++ : add++; ok.push({ ...r, qs: Q.map(k => r[k] === '' || r[k] == null ? null : +r[k]) });
    });
    return { ok, errs, add, upd };
  }
  applyInv() {
    const { res, mode } = this.state.imp; let pcs = 0;
    const items = this.state.items.map(i => ({ ...i, q: [...i.q] }));
    res.ok.forEach(r => {
      let it = items.find(i => i.sku === r.sku);
      if (!it) { it = { sku: r.sku, name: r.item_name, cat: r.category || 'Kurti', cost: +r.cost || 0, reorder: +r.reorder_level || 5, q: [0, 0, 0] }; items.push(it); }
      else { if (r.cost) it.cost = +r.cost; if (r.reorder_level) it.reorder = +r.reorder_level; }
      r.qs.forEach((n, b) => { if (n == null) return; const before = it.q[b]; it.q[b] = mode === 'add' ? before + n : n; pcs += it.q[b] - before; });
    });
    const mv = ['ph ph-upload-simple', 'Import · ' + (mode === 'add' ? 'stock added' : 'stock count'), res.ok.length + ' SKUs · ' + (this.state.imp.name || 'CSV') + ' · just now', pcs];
    this.setState({ items, imp: null, moves: [mv, ...this.state.moves] });
  }
  importVals() {
    const im = this.state.imp, res = im && im.res;
    return { impOpen: !!im, impOpenFn: () => this.setState({ imp: { name: '', res: null, mode: 'set' } }), impClose: () => this.setState({ imp: null }),
      impMode: im ? im.mode : 'set', impModeFn: e => this.setState({ imp: { ...im, mode: e.target.value } }),
      dlSample: () => this.download('inventory-sample.csv', this.invSample()),
      impPick: e => this.readFile(e, (name, text) => this.setState({ imp: { ...im, name, res: this.analyseInv(this.parseCsv(text)) } })),
      impFileLabel: im && im.name ? im.name + ' · choose another' : 'Choose a CSV file to import',
      impHasPreview: !!res, impHasErr: !!(res && res.errs.length), impErrs: res ? res.errs.slice(0, 50) : [],
      impStats: res ? [{ l: res.upd + ' SKUs updated', cls: 'tag-accent' }, { l: res.add + ' new SKUs', cls: 'tag-outline' }, ...(res.errs.length ? [{ l: res.errs.length + ' skipped', cls: 'tag-neutral' }] : [])] : [],
      impInvalid: !(res && res.ok.length), impCta: res && res.ok.length ? 'Import ' + res.ok.length + ' rows' : 'Import', impApply: () => this.applyInv() };
  }
  build() {
    const P = [['SC-ANK-104', 'Noor Anarkali Suit', 'Anarkali', ['S', 'M', 'L', 'XL'], 6890], ['SC-LHG-021', 'Mehr Bridal Lehenga', 'Lehenga', ['S', 'M', 'L'], 48500], ['SC-SAR-310', 'Kanjivaram Silk Saree', 'Saree', ['FS'], 18200], ['SC-KUR-552', 'Ira Cotton Kurti', 'Kurti', ['S', 'M', 'L', 'XL', 'XXL'], 1290], ['SC-GWN-077', 'Celeste Evening Gown', 'Gown', ['S', 'M', 'L'], 12400], ['SC-SAL-218', 'Phulkari Salwar Set', 'Salwar', ['M', 'L', 'XL'], 3450], ['SC-DUP-090', 'Banarasi Dupatta', 'Accessories', ['FS'], 2150], ['SC-KID-033', 'Tara Kids Lehenga', 'Kids', ['4Y', '6Y', '8Y'], 2490]];
    const out = [];
    P.forEach((p, i) => p[3].forEach((s, j) => out.push({ sku: p[0] + '-' + s, name: p[1] + ' · ' + s, cat: p[2], cost: Math.round(p[4] * 0.52), reorder: p[4] > 10000 ? 3 : 6, q: [(i * 7 + j * 3) % 11, (i * 5 + j * 2 + 3) % 9, (i * 3 + j * 5 + 1) % 10] })));
    return out;
  }
  state: any = { items: this.build(), q: '', cat: 'All', lowOnly: false, dlg: null, f: {}, imp: null,
    moves: [
      ['ph ph-shopping-bag', 'Sale · TNG/26-27/01042', 'SC-SAR-310-FS · T. Nagar · 2:41 pm', -1],
      ['ph ph-truck', 'Purchase GRN · PUR-0318', 'SC-KUR-552 (5 sizes) · T. Nagar · 11:05 am', 25],
      ['ph ph-arrows-left-right', 'Transfer to Koramangala', 'SC-GWN-077-M · from Anna Nagar · yesterday', -2],
      ['ph ph-arrow-u-up-left', 'Return · CN-0091', 'SC-ANK-104-L · T. Nagar · yesterday', 1],
      ['ph ph-sliders-horizontal', 'Adjustment · damaged', 'SC-DUP-090-FS · Anna Nagar · 16 Nov', -1],
    ] };
  renderVals() {
    const s = this.state, B = ['T. Nagar', 'Anna Nagar', 'Koramangala'];
    const tot = i => i.q.reduce((a, b) => a + b, 0);
    const rows = s.items.filter(i => (s.cat === 'All' || i.cat === s.cat) && (i.name + i.sku).toLowerCase().includes(s.q.toLowerCase()) && (!s.lowOnly || tot(i) <= i.reorder));
    const f = s.f, it = s.items.find(i => i.sku === f.sku) || s.items[0], avail = it.q[+f.b || 0];
    const qty = parseInt(f.qty, 10);
    const isT = s.dlg === 'transfer';
    const invalid = !qty || (isT ? (qty <= 0 || qty > avail || f.b === f.to) : (avail + qty < 0));
    const set = k => e => this.setState({ f: { ...f, [k]: e.target.value } });
    const value = s.items.reduce((a, i) => a + tot(i) * i.cost, 0);
    return { ...this.importVals(),
      stats: [['SKUs tracked', s.items.length], ['Pieces on hand', s.items.reduce((a, i) => a + tot(i), 0)], ['Stock value (cost)', '₹' + value.toLocaleString('en-IN')], ['Below reorder level', s.items.filter(i => tot(i) <= i.reorder).length]].map(([label, value]) => ({ label, value })),
      q: s.q, onQ: e => this.setState({ q: e.target.value }), cat: s.cat, onCat: e => this.setState({ cat: e.target.value }),
      cats: ['All', 'Anarkali', 'Lehenga', 'Saree', 'Kurti', 'Gown', 'Salwar', 'Accessories', 'Kids'],
      lowOnly: s.lowOnly, toggleLow: () => this.setState({ lowOnly: !s.lowOnly }),
      rows: rows.map(i => { const t = tot(i); const st = t === 0 ? 'Out of stock' : t <= i.reorder ? 'Reorder' : 'Healthy';
        return { name: i.name, sku: i.sku, b0: i.q[0], b1: i.q[1], b2: i.q[2], total: t, reorder: i.reorder, status: st, tagClass: st === 'Healthy' ? 'tag tag-neutral' : st === 'Reorder' ? 'tag tag-accent' : 'tag tag-outline' }; }),
      moves: s.moves.map(([icon, title, meta, q]) => ({ icon, title, meta, qty: (q > 0 ? '+' : '') + q, color: q > 0 ? 'var(--color-accent-300)' : 'var(--color-neutral-400)' })),
      openAdjust: () => this.setState({ dlg: 'adjust', f: { sku: s.items[0].sku, b: '0', qty: '', reason: 'Physical count correction' } }),
      openTransfer: () => this.setState({ dlg: 'transfer', f: { sku: s.items[0].sku, b: '0', to: '2', qty: '' } }),
      dlg: !!s.dlg, isTransfer: isT, isAdjust: !isT,
      dlgTitle: isT ? 'Transfer stock between branches' : 'Adjust stock', dlgCta: isT ? 'Create transfer' : 'Post adjustment',
      fromLabel: isT ? 'From branch' : 'Branch', qtyLabel: isT ? 'Quantity' : 'Change (+/−)', qtyPh: isT ? '2' : '−1 or +3',
      availNote: `Available at ${B[+f.b || 0]}: ${avail}`,
      f, fSku: set('sku'), fB: set('b'), fTo: set('to'), fQty: e => this.setState({ f: { ...f, qty: e.target.value.replace(/[^\d-]/g, '') } }), fReason: set('reason'),
      skuOpts: s.items.map(i => ({ v: i.sku, l: i.sku + ' — ' + i.name })), brOpts: B.map((l, v) => ({ v: String(v), l })),
      invalid, close: () => this.setState({ dlg: null }),
      submit: () => {
        const b = +f.b, to = +f.to;
        const items = s.items.map(i => { if (i.sku !== f.sku) return i; const q = [...i.q]; if (isT) { q[b] -= qty; q[to] += qty; } else q[b] += qty; return { ...i, q }; });
        const mv = isT ? ['ph ph-arrows-left-right', 'Transfer to ' + B[to], `${f.sku} · from ${B[b]} · just now`, -qty] : ['ph ph-sliders-horizontal', 'Adjustment · ' + f.reason.toLowerCase(), `${f.sku} · ${B[b]} · just now`, qty];
        this.setState({ items, dlg: null, moves: [mv, ...s.moves] });
      },
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header className={styles.header1}>
            <div>
              <div className={styles.box2}>Masters</div>
              <h1 className={styles.title1}>Inventory</h1>
            </div>
            <div className={styles.box3}>
              <button className="btn btn-secondary" onClick={$v.impOpenFn}>
                <i className="ph ph-upload-simple" />
                Import
              </button>
              <button className="btn btn-secondary" onClick={$v.openTransfer}>
                <i className="ph ph-arrows-left-right" />
                Branch transfer
              </button>
              <button className="btn btn-primary" onClick={$v.openAdjust}>
                <i className="ph ph-sliders-horizontal" />
                Adjust stock
              </button>
            </div>
          </header>
          <div className={styles.box4}>
            {($v.stats || []).map((k: any, $index: number) => (
              <React.Fragment key={$index}>
                <div className={`card ${styles.box5}`}>
                  <div className={styles.box6}>{k?.label}</div>
                  <div className={styles.box7}>{k?.value}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className={styles.box8}>
            <section className={styles.section1}>
              <div className={styles.box9}>
                <div className={styles.box10}>
                  <i className={`ph ph-magnifying-glass ${styles.icon1}`} />
                  <input className={styles.field1} value={$v.q} onChange={$v.onQ} placeholder="Search SKU or product" />
                </div>
                <select className={`input ${styles.select1}`} value={$v.cat} onChange={$v.onCat}>
                  {($v.cats || []).map((c: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <option value={c}>{c}</option>
                    </React.Fragment>
                  ))}
                </select>
                <label className={styles.label1}>
                  <input type="checkbox" checked={$v.lowOnly} onChange={$v.toggleLow} />
                  Low stock only
                </label>
              </div>
              <div className={styles.box11}>
                <table className={`table ${styles.table1}`}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className={styles.headCell1}>T. Nagar</th>
                      <th className={styles.headCell1}>Anna Nagar</th>
                      <th className={styles.headCell1}>Koramangala</th>
                      <th className={styles.headCell1}>Total</th>
                      <th className={styles.headCell1}>Reorder</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {($v.rows || []).map((r: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <tr>
                          <td>
                            <div>{r?.name}</div>
                            <div className={styles.box12}>{r?.sku}</div>
                          </td>
                          <td className={styles.headCell1}>{r?.b0}</td>
                          <td className={styles.headCell1}>{r?.b1}</td>
                          <td className={styles.headCell1}>{r?.b2}</td>
                          <td className={styles.cell1}>{r?.total}</td>
                          <td className={styles.cell2}>{r?.reorder}</td>
                          <td><span className={`${r?.tagClass ?? ''}`}>{r?.status}</span></td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <aside className={styles.aside1}>
              <div className={`card ${styles.box13}`}>
                <div className={`card-kicker ${styles.box14}`}>Stock movements</div>
                {($v.moves || []).map((m: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <div className={styles.box15}>
                      <i className={`${m?.icon ?? ''} ${styles.icon2}`} />
                      <div className={styles.box16}>
                        <div className={styles.box17}>{m?.title}</div>
                        <div className={styles.box18}>{m?.meta}</div>
                      </div>
                      <span className={styles.box17} style={{ color: m?.color }}>{m?.qty}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </aside>
          </div>
        </main>
      </div>
      {$v.dlg ? (
        <>
          <div className={`dialog-backdrop ${styles.box19}`}>
            <div className={`dialog ${styles.box20}`}>
              <div className="dialog-title">{$v.dlgTitle}</div>
              <div className={styles.box21}>
                <div className={`field ${styles.box22}`}>
                  <label>Item</label>
                  <select className="input" value={$v.f?.sku} onChange={$v.fSku}>
                    {($v.skuOpts || []).map((o: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <option value={o?.v}>{o?.l}</option>
                      </React.Fragment>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>{$v.fromLabel}</label>
                  <select className="input" value={$v.f?.b} onChange={$v.fB}>
                    {($v.brOpts || []).map((o: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <option value={o?.v}>{o?.l}</option>
                      </React.Fragment>
                    ))}
                  </select>
                </div>
                {$v.isTransfer ? (
                  <>
                    <div className="field">
                      <label>To branch</label>
                      <select className="input" value={$v.f?.to} onChange={$v.fTo}>
                        {($v.brOpts || []).map((o: any, $index: number) => (
                          <React.Fragment key={$index}>
                            <option value={o?.v}>{o?.l}</option>
                          </React.Fragment>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
                {$v.isAdjust ? (
                  <>
                    <div className="field">
                      <label>Reason</label>
                      <select className="input" value={$v.f?.reason} onChange={$v.fReason}>
                        <option>Physical count correction</option>
                        <option>Damaged / defective</option>
                        <option>Alteration sample</option>
                        <option>Found / recovered</option>
                      </select>
                    </div>
                  </>
                ) : null}
                <div className="field">
                  <label>{$v.qtyLabel}</label>
                  <input className="input" value={$v.f?.qty} onChange={$v.fQty} inputMode="numeric" placeholder={$v.qtyPh} />
                </div>
                <div className={styles.box23}>{$v.availNote}</div>
              </div>
              <div className="dialog-actions">
                <button className="btn btn-secondary" onClick={$v.close}>Cancel</button>
                <button className="btn btn-primary" onClick={$v.submit} disabled={$v.invalid}>{$v.dlgCta}</button>
              </div>
            </div>
          </div>
        </>
      ) : null}
      {$v.impOpen ? (
        <>
          <div className={`dialog-backdrop ${styles.box19}`}>
            <div className={`dialog ${styles.box24}`}>
              <div className="dialog-title">Import stock</div>
              <div className={styles.box25}>
                One row per SKU with quantities for each branch. Unknown SKUs are added as new stock lines; choose whether quantities replace or add to current stock.
              </div>
              <div className={styles.box26}>
                <i className={`ph ph-file-csv ${styles.icon3}`} />
                <div className={styles.box27}>
                  <div className={styles.box28}>Sample template (.csv)</div>
                  <div className={styles.box29}>
                    sku, item_name, category, cost, reorder_level, qty_t_nagar, qty_anna_nagar, qty_koramangala
                  </div>
                </div>
                <button className={`btn btn-secondary ${styles.button1}`} onClick={$v.dlSample}>
                  <i className="ph ph-download-simple" />
                  Download sample
                </button>
              </div>
              <label className={styles.label2}>
                <i className={`ph ph-upload-simple ${styles.icon4}`} />
                <span className={styles.text1}>{$v.impFileLabel}</span>
                <span className={styles.text2}>
                  CSV, comma-separated, first row as headers. Save Excel sheets as “CSV UTF-8”.
                </span>
                <input className={styles.field2} type="file" accept=".csv,text/csv" onChange={$v.impPick} />
              </label>
              <div className="field">
                <label>Quantities in file</label>
                <select className="input" value={$v.impMode} onChange={$v.impModeFn}>
                  <option value="set">Replace current stock (physical count)</option>
                  <option value="add">Add to current stock (new arrivals)</option>
                </select>
              </div>
              {$v.impHasPreview ? (
                <>
                  <div className={styles.box3}>
                    {($v.impStats || []).map((st: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <span className={`tag ${st?.cls ?? ''}`}>{st?.l}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  {$v.impHasErr ? (
                    <>
                      <div className={styles.box30}>
                        {($v.impErrs || []).map((er: any, $index: number) => (
                          <React.Fragment key={$index}>
                            <div className={styles.box31}>
                              <i className={`ph ph-warning ${styles.icon5}`} />
                              <span>{er}</span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
              <div className="dialog-actions">
                <button className="btn btn-secondary" onClick={$v.impClose}>Cancel</button>
                <button className="btn btn-primary" onClick={$v.impApply} disabled={$v.impInvalid}>{$v.impCta}</button>
              </div>
            </div>
          </div>
        </>
      ) : null}
      </>
    );
  }
}
