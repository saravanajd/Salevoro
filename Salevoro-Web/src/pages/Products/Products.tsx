import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Products.module.css';

export default class Products extends DCLogic {
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
  productSample() {
    const h = 'product_code,product_name,category,fabric,hsn,gst_slab,brand,supplier,size,colour,sku,barcode,mrp,cost,opening_stock';
    const r = [['SC-ANK-120','Zoya Georgette Anarkali','Anarkali','Georgette','6204','APP','Saanvi Signature','Rangrez Textiles','M','Wine','SC-ANK-120-M','8901234900101','5490','2850','6'],
      ['SC-ANK-120','Zoya Georgette Anarkali','Anarkali','Georgette','6204','APP','Saanvi Signature','Rangrez Textiles','L','Wine','SC-ANK-120-L','8901234900102','5490','2850','4'],
      ['SC-SAR-401','Mysore Crepe Saree','Saree','Crepe silk','5007','SLK','Saanvi Signature','Kanchi Weavers Co-op','FS','Bottle green','SC-SAR-401-FS','8901234900201','8900','4600','3']];
    return [h, ...r.map(x => x.map(c => /[",]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c).join(','))].join('\n');
  }
  analyseProducts(rows) {
    const errs = [], skus = new Set(this.state.products.flatMap(x => x.items.map(i => i.sku))), slabIds = new Set(this.slabs.map(x => x.id));
    let add = 0, upd = 0; const ok = [];
    rows.forEach(r => {
      const miss = ['product_code', 'product_name', 'size', 'mrp'].filter(k => !r[k]);
      if (miss.length) return errs.push('Row ' + r._line + ': missing ' + miss.join(', '));
      if (isNaN(+r.mrp) || (r.cost && isNaN(+r.cost))) return errs.push('Row ' + r._line + ': MRP / cost must be numbers');
      if (r.gst_slab && !slabIds.has(r.gst_slab)) errs.push('Row ' + r._line + ': GST slab "' + r.gst_slab + '" not found — product default used');
      const sku = r.sku || (r.product_code + '-' + r.size);
      skus.has(sku) ? upd++ : add++; ok.push({ ...r, sku });
    });
    return { ok, errs, add, upd, prods: new Set(ok.map(r => r.product_code)).size };
  }
  applyProducts() {
    const ok = this.state.imp.res.ok, slabIds = new Set(this.slabs.map(x => x.id));
    const products = this.state.products.map(x => ({ ...x, items: x.items.map(i => ({ ...i })) }));
    ok.forEach(r => {
      let pr = products.find(x => x.code === r.product_code);
      if (!pr) { pr = { code: r.product_code, name: r.product_name, cat: r.category || 'Kurti', fabric: r.fabric || '', hsn: r.hsn || '', mrp: +r.mrp, supplier: r.supplier || '', brand: r.brand || 'Saanvi Signature', season: 'Imported', slabId: slabIds.has(r.gst_slab) ? r.gst_slab : 'APP', items: [] }; products.push(pr); }
      const it = { sku: r.sku, size: r.size, color: r.colour || r.color || '', barcode: r.barcode || '', mrp: +r.mrp, cost: r.cost ? +r.cost : Math.round(+r.mrp * 0.52), stock: +r.opening_stock || 0, slab: '' };
      const ex = pr.items.findIndex(i => i.sku === r.sku);
      ex >= 0 ? pr.items[ex] = { ...pr.items[ex], ...it, stock: r.opening_stock ? it.stock : pr.items[ex].stock } : pr.items.push(it);
    });
    this.setState({ products, imp: null, sel: ok[0] ? ok[0].product_code : this.state.sel });
  }
  importVals() {
    const im = this.state.imp, res = im && im.res;
    return { impOpen: !!im, impOpenFn: () => this.setState({ imp: { name: '', res: null } }), impClose: () => this.setState({ imp: null }),
      dlSample: () => this.download('products-sample.csv', this.productSample()),
      impPick: e => this.readFile(e, (name, text) => this.setState({ imp: { name, res: this.analyseProducts(this.parseCsv(text)) } })),
      impFileLabel: im && im.name ? im.name + ' · choose another' : 'Choose a CSV file to import',
      impHasPreview: !!res, impHasErr: !!(res && res.errs.length), impErrs: res ? res.errs.slice(0, 50) : [],
      impStats: res ? [{ l: res.prods + ' products', cls: 'tag-neutral' }, { l: res.add + ' new items', cls: 'tag-accent' }, { l: res.upd + ' updates', cls: 'tag-outline' }, ...(res.errs.length ? [{ l: res.errs.length + ' warnings', cls: 'tag-neutral' }] : [])] : [],
      impInvalid: !(res && res.ok.length), impCta: res && res.ok.length ? 'Import ' + res.ok.length + ' rows' : 'Import', impApply: () => this.applyProducts() };
  }
  seed() {
    const P = [
      ['SC-ANK-104', 'Noor Anarkali Suit', 'Anarkali', 'Georgette', '6204', 6890, ['S', 'M', 'L', 'XL'], ['Teal'], 'Rangrez Textiles'],
      ['SC-LHG-021', 'Mehr Bridal Lehenga', 'Lehenga', 'Raw silk, zardozi', '6204', 48500, ['S', 'M', 'L'], ['Maroon', 'Ruby'], 'Jaipur Zari House'],
      ['SC-SAR-310', 'Kanjivaram Silk Saree', 'Saree', 'Pure silk', '5007', 18200, ['FS'], ['Mustard', 'Emerald'], 'Kanchi Weavers Co-op'],
      ['SC-KUR-552', 'Ira Cotton Kurti', 'Kurti', 'Cotton', '6206', 1290, ['S', 'M', 'L', 'XL', 'XXL'], ['Indigo'], 'Tiruppur Knits'],
      ['SC-GWN-077', 'Celeste Evening Gown', 'Gown', 'Satin', '6204', 12400, ['S', 'M', 'L'], ['Midnight'], 'Rangrez Textiles'],
      ['SC-SAL-218', 'Phulkari Salwar Set', 'Salwar', 'Cotton silk', '6204', 3450, ['M', 'L', 'XL'], ['Rose'], 'Amritsar Crafts'],
      ['SC-DUP-090', 'Banarasi Dupatta', 'Accessories', 'Banarasi silk', '6214', 2150, ['FS'], ['Gold'], 'Jaipur Zari House'],
      ['SC-KID-033', 'Tara Kids Lehenga', 'Kids', 'Net', '6209', 2490, ['4Y', '6Y', '8Y'], ['Peach'], 'Tiruppur Knits'],
    ];
    return P.map((p, i) => ({ slabId: p[4] === '5007' ? 'SLK' : p[4] === '6214' ? 'ACC' : 'APP', code: p[0], name: p[1], cat: p[2], fabric: p[3], hsn: p[4], mrp: p[5], supplier: p[8], brand: 'Saanvi Signature', season: 'Festive 2026',
      items: p[7].flatMap((c, ci) => p[6].map((s, j) => ({ sku: `${p[0]}-${s}${ci ? '-' + c.slice(0, 2).toUpperCase() : ''}`, size: s, color: c, barcode: '8901234' + String(100 + i * 10 + j + ci * 5).padStart(6, '0'), mrp: p[5], cost: Math.round(p[5] * 0.52), stock: (i * 7 + j * 3 + ci) % 11, slab: '' }))) }));
  }
  defSlabs = [
    { id: 'APP', name: 'Apparel — value based', codes: '6204, 6206, 6209, 6211', type: 'threshold', rate: 5, low: 5, high: 18, threshold: 2500, active: true },
    { id: 'SLK', name: 'Silk sarees & fabric', codes: '5007', type: 'fixed', rate: 5, active: true },
    { id: 'ACC', name: 'Dupattas & accessories', codes: '6214, 6217', type: 'threshold', rate: 5, low: 5, high: 18, threshold: 2500, active: true },
    { id: 'SRV', name: 'Alteration & stitching service', codes: 'SAC 998821', type: 'fixed', rate: 5, active: true },
  ];
  slabs = (() => { try { return JSON.parse(db.getItem('sc_gst_slabs')) || this.defSlabs; } catch (e) { return this.defSlabs; } })().filter(s => s.active);
  rateFor(s, unit) { return !s ? 0 : s.type === 'fixed' ? +s.rate : unit <= +s.threshold ? +s.low : +s.high; }
  slabLabel(s) { return s ? `${s.id} · ${s.name} · ${s.type === 'fixed' ? s.rate + '%' : s.low + '% ≤ ₹' + (+s.threshold).toLocaleString('en-IN') + ' < ' + s.high + '%'}` : '—'; }
  state: any = { products: this.seed(), q: '', cat: 'All', sel: 'SC-ANK-104', adding: false, nv: { size: 'M', color: '', mrp: '', cost: '' }, showNew: false, np: {}, imp: null };
  renderVals() {
    const s = this.state, inr = n => '₹' + Number(n).toLocaleString('en-IN'), iv = this.importVals();
    const catNames = (() => { try { const c = JSON.parse(db.getItem('sc_categories')); if (c && c.length) return c.filter(x => x.active !== false).map(x => x.name); } catch (e) {} return ['Anarkali', 'Lehenga', 'Saree', 'Kurti', 'Gown', 'Salwar', 'Accessories', 'Kids']; })();
    const p = s.products.find(x => x.code === s.sel) || s.products[0];
    const list = s.products.filter(x => (s.cat === 'All' || x.cat === s.cat) && (x.name + x.code).toLowerCase().includes(s.q.toLowerCase()));
    const setNv = k => e => this.setState({ nv: { ...s.nv, [k]: e.target.value } });
    const setNp = k => e => this.setState({ np: { ...s.np, [k]: e.target.value } });
    const bySlab = Object.fromEntries(this.slabs.map(x => [x.id, x]));
    return { ...iv,
      q: s.q, onQ: e => this.setState({ q: e.target.value }),
      cats: ['All', ...catNames].map(c => { const on = s.cat === c; return { label: c, pick: () => this.setState({ cat: c }), bg: on ? 'var(--color-accent-900)' : 'transparent', color: on ? 'var(--color-accent-300)' : 'var(--color-neutral-400)', border: on ? 'var(--color-accent-700)' : 'var(--color-neutral-800)' }; }),
      plist: list.map(x => { const on = x.code === p.code; return { name: x.name, code: x.code, cat: x.cat, price: inr(x.mrp), nItems: x.items.length, open: () => this.setState({ sel: x.code, adding: false }),
        bg: on ? 'var(--color-surface)' : 'transparent', ring: on ? 'inset 0 0 0 1px var(--color-accent-700), 0 0 20px -12px var(--color-accent)' : 'none' }; }),
      p,
      pInfo: [['Fabric', p.fabric], ['HSN', p.hsn], ['Default MRP', inr(p.mrp)], ['Brand', p.brand], ['Supplier', p.supplier], ['Season', p.season], ['Total stock', p.items.reduce((a, i) => a + i.stock, 0) + ' pcs']].map(([k, v]) => ({ k, v })),
      nItems: p.items.length,
      slabOpts: this.slabs.map(x => ({ v: x.id, l: this.slabLabel(x) })),
      pSlabShort: (bySlab[p.slabId] || {}).id || '—',
      onProdSlab: e => this.setState({ products: s.products.map(x => x.code === p.code ? { ...x, slabId: e.target.value } : x) }),
      nvSlab: setNv('slab'),
      npSlab: e => { const sl = bySlab[e.target.value]; this.setState({ np: { ...s.np, slabId: e.target.value, hsn: sl && /^\d/.test(sl.codes) ? sl.codes.split(',')[0].trim() : s.np.hsn } }); },
      npSlabNote: (() => { const sl = bySlab[s.np.slabId]; return sl ? (sl.type === 'fixed' ? `${sl.rate}% GST on every piece.` : `${sl.low}% GST up to ₹${(+sl.threshold).toLocaleString('en-IN')} per piece, ${sl.high}% above — picked at billing.`) : 'Choose a GST slab.'; })(),
      items: p.items.map(i => { const sl = bySlab[i.slab || p.slabId], r = this.rateFor(sl, i.mrp); return { ...i, mrp: inr(i.mrp), cost: inr(i.cost), margin: Math.round((1 - i.cost / (i.mrp / (1 + r / 100))) * 100) + '%', gst: r + '% · ' + (sl ? sl.id : '—'), gstClass: i.slab ? 'tag tag-outline' : 'tag tag-neutral', gstTip: i.slab ? 'Item override: ' + this.slabLabel(sl) : 'Inherited from product: ' + this.slabLabel(sl), stockColor: i.stock <= 2 ? 'var(--color-accent-300)' : 'var(--color-text)' }; }),
      adding: s.adding, toggleAdd: () => this.setState({ adding: !s.adding, nv: { size: 'M', color: p.items[0]?.color || '', mrp: String(p.mrp), cost: String(Math.round(p.mrp * 0.52)), slab: '' } }),
      nv: s.nv, nvSize: setNv('size'), nvColor: setNv('color'), nvMrp: setNv('mrp'), nvCost: setNv('cost'),
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FS', '4Y', '6Y', '8Y', '10Y'],
      addItem: () => {
        const nv = s.nv; if (!nv.color || !+nv.mrp) return;
        const it = { sku: `${p.code}-${nv.size}-${nv.color.slice(0, 2).toUpperCase()}`, size: nv.size, color: nv.color, barcode: '8901234' + String(Math.floor(Math.random() * 900000) + 100000), mrp: +nv.mrp, cost: +nv.cost || 0, stock: 0, slab: nv.slab || '' };
        this.setState({ products: s.products.map(x => x.code === p.code ? { ...x, items: [...x.items, it] } : x), adding: false });
      },
      showNew: s.showNew, np: s.np, catNames, suppliers: ['Rangrez Textiles', 'Jaipur Zari House', 'Kanchi Weavers Co-op', 'Tiruppur Knits', 'Amritsar Crafts'],
      openNew: () => this.setState({ showNew: true, np: { name: '', cat: s.cat !== 'All' && catNames.includes(s.cat) ? s.cat : catNames[0], fabric: '', brand: 'Saanvi Signature', hsn: '6204', mrp: '', supplier: 'Rangrez Textiles', slabId: (this.slabs[0] || {}).id || '' } }),
      closeNew: () => this.setState({ showNew: false }),
      npName: setNp('name'), npCat: setNp('cat'),
      npInvalid: !(s.np.name || '').trim() || !+s.np.mrp || !s.np.slabId,
      saveNew: () => {
        const n = s.np, pre = n.cat.slice(0, 3).toUpperCase(), code = 'SC-' + pre + '-' + String(400 + s.products.length), mrp = +n.mrp;
        const items = [];
        this.setState({ products: [{ slabId: n.slabId, code, name: n.name, cat: n.cat, fabric: n.fabric || '—', hsn: n.hsn, mrp: +n.mrp, supplier: n.supplier, brand: n.brand, season: 'Festive 2026', items }, ...s.products], sel: code, showNew: false, adding: !items.length, nv: { size: 'M', color: '', mrp: n.mrp, cost: String(Math.round(n.mrp * 0.52)), slab: '' } });
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
              <h1 className={styles.title1}>Products &amp; items</h1>
              <div className={styles.box3}>
                A product is the design/style. Each item is a sellable size × colour variant with its own SKU and barcode.
              </div>
            </div>
            <div className={styles.box4}>
              <button className="btn btn-secondary" onClick={$v.impOpenFn}>
                <i className="ph ph-upload-simple" />
                Import
              </button>
              <button className="btn btn-primary" onClick={$v.openNew}>
                <i className="ph ph-plus" />
                New product
              </button>
            </div>
          </header>
          <div className={styles.box5}>
            <section className={styles.section1}>
              <div className={styles.box6}>
                <i className={`ph ph-magnifying-glass ${styles.icon1}`} />
                <input className={styles.field1} value={$v.q} onChange={$v.onQ} placeholder="Search products" />
              </div>
              <div className={styles.box7}>
                {($v.cats || []).map((c: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <button className={styles.button1} onClick={c?.pick} style={{ background: c?.bg, color: c?.color, border: `1px solid ${c?.border ?? ''}` }}>{c?.label}</button>
                  </React.Fragment>
                ))}
              </div>
              <div className={styles.box8}>
                {($v.plist || []).map((p: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <button className={styles.button2} onClick={p?.open} style={{ "--dyn-background": p?.bg, boxShadow: p?.ring }}>
                      <div className={styles.box9}><i className="ph ph-dress" /></div>
                      <div className={styles.box10}>
                        <div className={styles.box11}>{p?.name}</div>
                        <div className={styles.box12}>{p?.code} · {p?.cat}</div>
                      </div>
                      <div className={styles.box13}>
                        <div className={styles.box14}>{p?.price}</div>
                        <div className={styles.box15}>{p?.nItems} items</div>
                      </div>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </section>
            <section className={styles.section2}>
              <div className={`card ${styles.box16}`}>
                <div className={styles.box17}>
                  <div className={styles.box18}>product photo</div>
                  <div className={styles.box19}>
                    <div className="card-kicker">{$v.p?.cat} · {$v.p?.code}</div>
                    <div className={styles.box20}>{$v.p?.name}</div>
                    <div className={styles.box21}>
                      {($v.pInfo || []).map((i: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <div>
                            <div className={styles.box15}>{i?.k}</div>
                            <div>{i?.v}</div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className={styles.box22}>
                      <div className={`field ${styles.box23}`}>
                        <label className={styles.label1}>GST slab (applies to all items unless overridden)</label>
                        <select className="input" value={$v.p?.slabId} onChange={$v.onProdSlab}>
                          {($v.slabOpts || []).map((o: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={o?.v}>{o?.l}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                      <A className={styles.link1} href="GST.dc.html">Manage slabs →</A>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`card ${styles.box24}`}>
                <div className={styles.box25}>
                  <div className="card-kicker">Items (SKU variants) · {$v.nItems}</div>
                  <button className="btn btn-ghost" onClick={$v.toggleAdd}>
                    <i className="ph ph-plus" />
                    Add item
                  </button>
                </div>
                {$v.adding ? (
                  <>
                    <div className={styles.box26}>
                      <div className="field">
                        <label>Size</label>
                        <select className="input" value={$v.nv?.size} onChange={$v.nvSize}>
                          {($v.sizes || []).map((s: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={s}>{s}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Colour</label>
                        <input className="input" value={$v.nv?.color} onChange={$v.nvColor} placeholder="Teal" />
                      </div>
                      <div className="field">
                        <label>MRP ₹</label>
                        <input className="input" value={$v.nv?.mrp} onChange={$v.nvMrp} inputMode="numeric" />
                      </div>
                      <div className="field">
                        <label>Cost ₹</label>
                        <input className="input" value={$v.nv?.cost} onChange={$v.nvCost} inputMode="numeric" />
                      </div>
                      <div className={`field ${styles.box27}`}>
                        <label>GST slab</label>
                        <select className="input" value={$v.nv?.slab} onChange={$v.nvSlab}>
                          <option value="">Inherit · {$v.pSlabShort}</option>
                          {($v.slabOpts || []).map((o: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={o?.v}>{o?.l}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                      <button className={`btn btn-primary ${styles.button3}`} onClick={$v.addItem}>Save item</button>
                    </div>
                  </>
                ) : null}
                <div className={styles.box28}>
                  <table className={`table ${styles.table1}`}>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Size</th>
                        <th>Colour</th>
                        <th>Barcode</th>
                        <th className={styles.headCell1}>MRP</th>
                        <th className={styles.headCell1}>Cost</th>
                        <th className={styles.headCell1}>Margin</th>
                        <th className={styles.headCell2}>GST slab</th>
                        <th className={styles.headCell1}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {($v.items || []).map((i: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <tr>
                            <td className={styles.cell1}>{i?.sku}</td>
                            <td>{i?.size}</td>
                            <td>{i?.color}</td>
                            <td className={styles.cell2}>{i?.barcode}</td>
                            <td className={styles.headCell1}>{i?.mrp}</td>
                            <td className={styles.cell3}>{i?.cost}</td>
                            <td className={styles.cell3}>{i?.margin}</td>
                            <td className={styles.headCell2}>
                              <span className={`${i?.gstClass ?? ''}`} title={i?.gstTip}>{i?.gst}</span>
                            </td>
                            <td className={styles.headCell1} style={{ color: i?.stockColor }}>{i?.stock}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      {$v.showNew ? (
        <>
          <div className={`dialog-backdrop ${styles.box29}`}>
            <div className={`dialog ${styles.box30}`}>
              <div className="dialog-title">New product</div>
              <div className={styles.box31}>
                <div className={`field ${styles.box32}`}>
                  <label>Product name *</label>
                  <input className="input" value={$v.np?.name} onChange={$v.npName} placeholder="e.g. Zoya Georgette Anarkali" />
                </div>
                <div className="field">
                  <label className={styles.label2}>
                    Category
                    <A className={styles.link2} href="Categories.dc.html">Configure →</A>
                  </label>
                  <select className="input" value={$v.np?.cat} onChange={$v.npCat}>
                    {($v.catNames || []).map((c: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <option value={c}>{c}</option>
                      </React.Fragment>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Fabric</label>
                  <input className="input" value={$v.np?.fabric} onChange={$v.npFabric} placeholder="Georgette" />
                </div>
                <div className="field">
                  <label>Brand / label</label>
                  <input className="input" value={$v.np?.brand} onChange={$v.npBrand} placeholder="Saanvi Signature" />
                </div>
                <div className="field">
                  <label>GST slab *</label>
                  <select className="input" value={$v.np?.slabId} onChange={$v.npSlab}>
                    {($v.slabOpts || []).map((o: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <option value={o?.v}>{o?.l}</option>
                      </React.Fragment>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>HSN code</label>
                  <input className="input" value={$v.np?.hsn} onChange={$v.npHsn} placeholder="6204" />
                </div>
                <div className="field">
                  <label>Default MRP ₹</label>
                  <input className="input" value={$v.np?.mrp} onChange={$v.npMrp} inputMode="numeric" />
                </div>
                <div className="field">
                  <label>Supplier</label>
                  <select className="input" value={$v.np?.supplier} onChange={$v.npSupplier}>
                    {($v.suppliers || []).map((s: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <option value={s}>{s}</option>
                      </React.Fragment>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.box33}>{$v.npSlabNote}</div>
              <div className="dialog-actions">
                <button className="btn btn-secondary" onClick={$v.closeNew}>Cancel</button>
                <button className="btn btn-primary" onClick={$v.saveNew} disabled={$v.npInvalid}>Create product</button>
              </div>
            </div>
          </div>
        </>
      ) : null}
      {$v.impOpen ? (
        <>
          <div className={`dialog-backdrop ${styles.box29}`}>
            <div className={`dialog ${styles.box34}`}>
              <div className="dialog-title">Import products & items</div>
              <div className={styles.box35}>
                One row per sellable item (size/colour). Rows sharing a product code are grouped into one product. Existing SKUs are updated; new ones are added.
              </div>
              <div className={styles.box36}>
                <i className={`ph ph-file-csv ${styles.icon2}`} />
                <div className={styles.box37}>
                  <div className={styles.box38}>Sample template (.csv)</div>
                  <div className={styles.box39}>
                    product_code, product_name, category, fabric, hsn, gst_slab, brand, supplier, size, colour, sku, barcode, mrp, cost, opening_stock
                  </div>
                </div>
                <button className={`btn btn-secondary ${styles.button4}`} onClick={$v.dlSample}>
                  <i className="ph ph-download-simple" />
                  Download sample
                </button>
              </div>
              <label className={styles.label3}>
                <i className={`ph ph-upload-simple ${styles.icon3}`} />
                <span className={styles.text1}>{$v.impFileLabel}</span>
                <span className={styles.text2}>
                  CSV, comma-separated, first row as headers. Save Excel sheets as “CSV UTF-8”.
                </span>
                <input className={styles.field2} type="file" accept=".csv,text/csv" onChange={$v.impPick} />
              </label>
              {$v.impHasPreview ? (
                <>
                  <div className={styles.box4}>
                    {($v.impStats || []).map((st: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <span className={`tag ${st?.cls ?? ''}`}>{st?.l}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  {$v.impHasErr ? (
                    <>
                      <div className={styles.box40}>
                        {($v.impErrs || []).map((er: any, $index: number) => (
                          <React.Fragment key={$index}>
                            <div className={styles.box41}>
                              <i className={`ph ph-warning ${styles.icon4}`} />
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
