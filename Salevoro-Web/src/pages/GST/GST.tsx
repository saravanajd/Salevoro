import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './GST.module.css';

export default class GST extends DCLogic {
  defaults = [
    { id: 'APP', name: 'Apparel — value based', codes: '6204, 6206, 6209, 6211', type: 'threshold', rate: 5, low: 5, high: 18, threshold: 2500, cess: 0, from: '2025-09-22', active: true },
    { id: 'SLK', name: 'Silk sarees & fabric', codes: '5007', type: 'fixed', rate: 5, low: 5, high: 18, threshold: 2500, cess: 0, from: '2025-09-22', active: true },
    { id: 'ACC', name: 'Dupattas & accessories', codes: '6214, 6217', type: 'threshold', rate: 5, low: 5, high: 18, threshold: 2500, cess: 0, from: '2025-09-22', active: true },
    { id: 'SRV', name: 'Alteration & stitching service', codes: 'SAC 998821', type: 'fixed', rate: 5, low: 5, high: 18, threshold: 2500, cess: 0, from: '2025-09-22', active: true },
    { id: 'NIL', name: 'Exempt / nil rated', codes: '—', type: 'fixed', rate: 0, low: 0, high: 0, threshold: 0, cess: 0, from: '2017-07-01', active: false },
  ];
  load() { try { return JSON.parse(db.getItem('sc_gst_slabs')) || this.defaults; } catch (e) { return this.defaults; } }
  slabs0 = this.load();
  state: any = { slabs: this.slabs0, sel: this.slabs0[0].id, f: { ...this.slabs0[0] }, isNew: false, test: '2000', err: '', cfg: JSON.parse(db.getItem('sc_gst_cfg') || '{"inclusive":true,"roundOff":true,"afterDisc":true}') };
  rateFor(s, unit) { return s.type === 'fixed' ? +s.rate : unit <= +s.threshold ? +s.low : +s.high; }
  persist(slabs) { db.setItem('sc_gst_slabs', JSON.stringify(slabs)); }
  renderVals() {
    const s = this.state, f = s.f, inr = (n, d = 2) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const used = { APP: '5 products · 19 items', SLK: '1 product · 2 items', ACC: '1 product · 1 item', SRV: 'alteration charges', NIL: 'none' };
    const set = k => e => this.setState({ f: { ...f, [k]: e.target.value } });
    const price = +s.test || 0, r = this.rateFor(f, price), cess = +f.cess || 0;
    const taxable = s.cfg.inclusive ? price / (1 + (r + cess) / 100) : price, gst = taxable * r / 100, cessAmt = taxable * cess / 100;
    const setCfg = k => () => { const cfg = { ...s.cfg, [k]: !s.cfg[k] }; db.setItem('sc_gst_cfg', JSON.stringify(cfg)); this.setState({ cfg }); };
    return {
      rows: s.slabs.map(x => ({ id: x.id, name: x.name, codes: x.codes, from: new Date(x.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), used: used[x.id] || 'not assigned yet',
        rate: x.type === 'fixed' ? x.rate + '%' : `${x.low}% / ${x.high}%`, rule: x.type === 'fixed' ? 'Fixed rate' + (+x.cess ? ` + ${x.cess}% cess` : '') : `≤ ₹${(+x.threshold).toLocaleString('en-IN')} / above`,
        inactive: !x.active, op: x.active ? 1 : 0.6,
        ring: !s.isNew && x.id === s.sel ? '0 0 0 1px var(--color-accent), 0 0 24px -12px var(--color-accent)' : 'var(--shadow-sm)',
        open: () => this.setState({ sel: x.id, f: { ...x }, isNew: false, err: '' }) })),
      edKicker: s.isNew ? 'New slab' : 'Edit slab', edTitle: s.isNew ? 'Create GST slab' : f.name || '—',
      f, fName: set('name'), fId: e => this.setState({ f: { ...f, id: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) } }), fFrom: set('from'), fCodes: set('codes'),
      fRate: set('rate'), fLow: set('low'), fHigh: set('high'), fThreshold: e => this.setState({ f: { ...f, threshold: e.target.value.replace(/\D/g, '') } }), fCess: e => this.setState({ f: { ...f, cess: e.target.value.replace(/[^\d.]/g, '') } }),
      toggleActive: () => this.setState({ f: { ...f, active: !f.active } }),
      types: [['fixed', 'Fixed rate'], ['threshold', 'Value-based (threshold)']].map(([k, label]) => ({ label, pick: () => this.setState({ f: { ...f, type: k } }), color: f.type === k ? 'var(--color-accent)' : 'var(--color-text)', ring: f.type === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })),
      isFixed: f.type === 'fixed', isThreshold: f.type === 'threshold',
      rates: [0, 0.25, 3, 5, 12, 18, 28, 40].map(v => ({ v: String(v), l: v + '%' })),
      testPrice: s.test, onTest: e => this.setState({ test: e.target.value.replace(/\D/g, '') }),
      preview: [['Applied rate', r + '%' + (cess ? ` + ${cess}% cess` : '')], ['Taxable value', inr(taxable)], ['CGST ' + r / 2 + '% / SGST ' + r / 2 + '% (intra-state)', inr(gst / 2) + ' + ' + inr(gst / 2)], ['IGST ' + r + '% (inter-state)', inr(gst)], ...(cess ? [['Cess', inr(cessAmt)]] : [])].map(([k, v]) => ({ k, v })),
      hasErr: !!s.err, err: s.err,
      addSlab: () => this.setState({ isNew: true, f: { id: '', name: '', codes: '', type: 'fixed', rate: '5', low: '5', high: '18', threshold: '2500', cess: '', from: new Date().toISOString().slice(0, 10), active: true }, err: '' }),
      cancel: () => { const x = s.slabs.find(y => y.id === s.sel) || s.slabs[0]; this.setState({ isNew: false, f: { ...x }, err: '' }); },
      save: () => {
        if (!f.name.trim() || !f.id) return this.setState({ err: 'Name and slab code are required.' });
        if (s.isNew && s.slabs.some(x => x.id === f.id)) return this.setState({ err: 'Slab code already exists.' });
        if (f.type === 'threshold' && !(+f.threshold > 0)) return this.setState({ err: 'Enter a threshold above ₹0.' });
        const slabs = s.isNew ? [...s.slabs, { ...f }] : s.slabs.map(x => x.id === s.sel ? { ...f } : x);
        this.persist(slabs); this.setState({ slabs, sel: f.id, isNew: false, err: '' });
      },
      resetDefaults: () => { this.persist(this.defaults); this.setState({ slabs: this.defaults, sel: 'APP', f: { ...this.defaults[0] }, isNew: false, err: '' }); },
      cfg: s.cfg, toggleInclusive: setCfg('inclusive'), toggleRound: setCfg('roundOff'), toggleAfterDisc: setCfg('afterDisc'),
      branches: [['Chennai · T. Nagar', 'Tamil Nadu', '33', '33ABCPS1234K1Z5'], ['Chennai · Anna Nagar', 'Tamil Nadu', '33', '33ABCPS1234K1Z5'], ['Bengaluru · Koramangala', 'Karnataka', '29', '29ABCPS1234K1ZC']].map(([name, state, code, gstin]) => ({ name, state, code, gstin })),
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header className={styles.header1}>
            <div>
              <div className={styles.box2}>System · Tax</div>
              <h1 className={styles.title1}>GST slab configuration</h1>
              <div className={styles.box3}>
                Slabs are assigned to products (and optionally overridden per item). Billing picks the rate per piece from the slab, then splits it into CGST + SGST or IGST by place of supply.
              </div>
            </div>
            <button className="btn btn-primary" onClick={$v.addSlab}>
              <i className="ph ph-plus" />
              New slab
            </button>
          </header>
          <div className={styles.box4}>
            <section className={styles.section1}>
              {($v.rows || []).map((r: any, $index: number) => (
                <React.Fragment key={$index}>
                  <button className={styles.button1} onClick={r?.open} style={{ boxShadow: r?.ring, opacity: r?.op }}>
                    <div className={styles.box5}>
                      <div className={styles.box6}>
                        <span className={styles.text1}>{r?.name}</span>
                        <span className={`tag tag-neutral ${styles.text2}`}>{r?.id}</span>
                        {r?.inactive ? (
                          <>
                            <span className="tag tag-outline">Inactive</span>
                          </>
                        ) : null}
                      </div>
                      <div className={styles.box7}>HSN/SAC {r?.codes} · effective {r?.from} · used by {r?.used}</div>
                    </div>
                    <div className={styles.box8}>
                      <div className={styles.box9}>{r?.rate}</div>
                      <div className={styles.box10}>{r?.rule}</div>
                    </div>
                    <i className={`ph ph-caret-right ${styles.icon1}`} />
                  </button>
                </React.Fragment>
              ))}
              <div className={`card ${styles.box11}`}>
                <div className="card-kicker">General tax settings</div>
                <label className={styles.label1}>
                  <input type="checkbox" checked={$v.cfg?.inclusive} onChange={$v.toggleInclusive} />
                  Selling prices (MRP) include GST
                </label>
                <label className={styles.label1}>
                  <input type="checkbox" checked={$v.cfg?.roundOff} onChange={$v.toggleRound} />
                  Round invoice total to nearest rupee
                </label>
                <label className={styles.label1}>
                  <input type="checkbox" checked={$v.cfg?.afterDisc} onChange={$v.toggleAfterDisc} />
                  Pick value-based slab on the price after discount
                </label>
                <div className={styles.box12}>
                  <table className={`table ${styles.table1}`}>
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>State</th>
                        <th>State code</th>
                        <th>GSTIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {($v.branches || []).map((b: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <tr>
                            <td>{b?.name}</td>
                            <td>{b?.state}</td>
                            <td>{b?.code}</td>
                            <td className={styles.cell1}>{b?.gstin}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            <aside className={styles.aside1}>
              <div className={`card ${styles.box13}`}>
                <div className={styles.box14}>
                  <div>
                    <div className="card-kicker">{$v.edKicker}</div>
                    <div className={styles.box15}>{$v.edTitle}</div>
                  </div>
                  <label className={styles.label2}>
                    <input type="checkbox" checked={$v.f?.active} onChange={$v.toggleActive} />
                    Active
                  </label>
                </div>
                <div className={styles.box16}>
                  <div className={`field ${styles.box17}`}>
                    <label>Slab name *</label>
                    <input className="input" value={$v.f?.name} onChange={$v.fName} placeholder="e.g. Apparel — value based" />
                  </div>
                  <div className="field">
                    <label>Slab code *</label>
                    <input className={`input ${styles.field1}`} value={$v.f?.id} onChange={$v.fId} placeholder="APP" />
                  </div>
                  <div className="field">
                    <label>Effective from</label>
                    <input className="input" type="date" value={$v.f?.from} onChange={$v.fFrom} />
                  </div>
                  <div className={`field ${styles.box17}`}>
                    <label>HSN / SAC codes (comma separated)</label>
                    <input className="input" value={$v.f?.codes} onChange={$v.fCodes} placeholder="6204, 6206" />
                  </div>
                  <div className={`field ${styles.box17}`}>
                    <label>Rate type</label>
                    <div className={`seg ${styles.box18}`}>
                      {($v.types || []).map((t: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <button className={`seg-opt ${styles.button2}`} onClick={t?.pick} style={{ color: t?.color, boxShadow: t?.ring }}>{t?.label}</button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  {$v.isFixed ? (
                    <>
                      <div className="field">
                        <label>GST rate</label>
                        <select className="input" value={$v.f?.rate} onChange={$v.fRate}>
                          {($v.rates || []).map((x: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={x?.v}>{x?.l}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : null}
                  {$v.isThreshold ? (
                    <>
                      <div className={`field ${styles.box17}`}>
                        <label>Threshold — sale value per piece (₹)</label>
                        <input className="input" value={$v.f?.threshold} onChange={$v.fThreshold} inputMode="numeric" />
                      </div>
                      <div className="field">
                        <label>Rate up to threshold</label>
                        <select className="input" value={$v.f?.low} onChange={$v.fLow}>
                          {($v.rates || []).map((x: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={x?.v}>{x?.l}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Rate above threshold</label>
                        <select className="input" value={$v.f?.high} onChange={$v.fHigh}>
                          {($v.rates || []).map((x: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={x?.v}>{x?.l}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : null}
                  <div className="field">
                    <label>Cess %</label>
                    <input className="input" value={$v.f?.cess} onChange={$v.fCess} inputMode="decimal" placeholder="0" />
                  </div>
                </div>
                <div className={styles.box19}>
                  <div className={styles.box20}>
                    <span className={styles.text3}>Preview · price per piece (incl. GST)</span>
                    <input className={`input ${styles.field2}`} value={$v.testPrice} onChange={$v.onTest} inputMode="numeric" />
                  </div>
                  {($v.preview || []).map((p: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <div className={styles.box21}>
                        <span>{p?.k}</span>
                        <span>{p?.v}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                {$v.hasErr ? (
                  <>
                    <div className={styles.box22}>{$v.err}</div>
                  </>
                ) : null}
                <div className={styles.box23}>
                  <button className={`btn btn-ghost ${styles.button3}`} onClick={$v.resetDefaults}>Restore defaults</button>
                  <div className={styles.box24}>
                    <button className="btn btn-secondary" onClick={$v.cancel}>Discard</button>
                    <button className="btn btn-primary" onClick={$v.save}>
                      <i className="ph ph-check" />
                      Save slab
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
      </>
    );
  }
}
