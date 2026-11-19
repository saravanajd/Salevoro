import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Purchases.module.css';

export default class Purchases extends DCLogic {
  skus = [['SC-ANK-104-M', 'Noor Anarkali Suit · M', 3580], ['SC-LHG-021-M', 'Mehr Bridal Lehenga · M', 25200], ['SC-SAR-310-FS', 'Kanjivaram Silk Saree', 9460], ['SC-KUR-552-M', 'Ira Cotton Kurti · M', 670], ['SC-KUR-552-L', 'Ira Cotton Kurti · L', 670], ['SC-GWN-077-M', 'Celeste Evening Gown · M', 6450], ['SC-SAL-218-L', 'Phulkari Salwar Set · L', 1790], ['SC-DUP-090-FS', 'Banarasi Dupatta', 1120], ['SC-KID-033-6Y', 'Tara Kids Lehenga · 6Y', 1290]];
  state: any = { tab: 'pur', newPo: false, addingSup: false, sf: {},
    sups: [
      ['SUP-01', 'Rangrez Textiles', 'Surat', 'Gujarat', '24AAKFR4521Q1Z8', 'Imran · 98250 11223', 'Anarkali, Gown', 'Net 30', 184200],
      ['SUP-02', 'Jaipur Zari House', 'Jaipur', 'Rajasthan', '08AAGFJ7788L1ZK', 'Manish · 94140 22331', 'Lehenga, Dupatta', 'Net 45', 412500],
      ['SUP-03', 'Kanchi Weavers Co-op', 'Kanchipuram', 'Tamil Nadu', '33AAATK1209P1Z2', 'Selvi · 94431 55102', 'Silk sarees', 'Advance', 0],
      ['SUP-04', 'Tiruppur Knits', 'Tiruppur', 'Tamil Nadu', '33AAHFT6650R1ZQ', 'Ramesh · 98422 80080', 'Kurti, Kids', 'Net 15', 38900],
      ['SUP-05', 'Amritsar Crafts', 'Amritsar', 'Punjab', '03AAJFA3344M1Z1', 'Gurpreet · 98140 66778', 'Salwar, Phulkari', 'Net 30', 26400],
    ],
    purs: [
      ['PUR-0318', '18 Nov 2026', 'Tiruppur Knits', 'TK/26/2291', 'T. Nagar', 25, 'Credit · 30 days', 17670],
      ['PUR-0317', '15 Nov 2026', 'Jaipur Zari House', 'JZH/1182', 'Anna Nagar', 6, 'Credit · 30 days', 168210],
      ['PUR-0316', '12 Nov 2026', 'Kanchi Weavers Co-op', 'KWC-0911', 'T. Nagar', 8, 'Paid · Bank transfer', 79460],
      ['PUR-0315', '08 Nov 2026', 'Rangrez Textiles', 'RT/2026/1144', 'Koramangala', 14, 'Paid · Cheque', 56910],
      ['PUR-0314', '02 Nov 2026', 'Amritsar Crafts', 'AC/559', 'Anna Nagar', 12, 'Credit · 30 days', 22560],
    ],
    po: {} };
  newPo() { return { sup: 'Rangrez Textiles', ref: '', date: new Date().toISOString().slice(0, 10), branch: 'T. Nagar', pay: 'Credit · 30 days', lines: [{ sku: this.skus[0][0], qty: '5', cost: String(this.skus[0][2]) }] }; }
  renderVals() {
    const s = this.state, inr = (n, d = 0) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const po = s.po, sup = s.sups.find(x => x[1] === po.sup);
    const inter = sup && sup[3] !== 'Tamil Nadu';
    const lines = (po.lines || []).map(l => { const q = +l.qty || 0, c = +l.cost || 0, g = c <= 2500 ? 5 : 18; return { ...l, q, c, g, base: q * c, tax: q * c * g / 100 }; });
    const base = lines.reduce((a, l) => a + l.base, 0), tax = lines.reduce((a, l) => a + l.tax, 0);
    const updLine = (k, patch) => this.setState({ po: { ...po, lines: po.lines.map((l, j) => j === k ? { ...l, ...patch } : l) } });
    const setPo = k => e => this.setState({ po: { ...po, [k]: e.target.value } });
    const SF = [['name', 'Supplier name', 'Kalamkari Prints'], ['city', 'City', 'Machilipatnam'], ['state', 'State', 'Andhra Pradesh'], ['gstin', 'GSTIN', '37AABCK1234L1Z9'], ['contact', 'Contact', 'Name · mobile'], ['cats', 'Supplies', 'Sarees, dupattas'], ['terms', 'Credit terms', 'Net 30']];
    return {
      tabs: [['pur', 'Purchases'], ['sup', 'Suppliers']].map(([k, label]) => ({ label, pick: () => this.setState({ tab: k, newPo: false, addingSup: false }), color: s.tab === k ? 'var(--color-accent)' : 'var(--color-text)', ring: s.tab === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })),
      isPur: s.tab === 'pur', isSup: s.tab === 'sup', isNew: s.tab === 'pur' && s.newPo,
      primaryLabel: s.tab === 'pur' ? 'New purchase' : 'New supplier',
      primary: () => s.tab === 'pur' ? this.setState({ newPo: true, po: this.newPo() }) : this.setState({ addingSup: true, sf: {} }),
      grnNo: 'PUR-' + String(319 + s.purs.length - 5).padStart(4, '0'),
      po, poSup: setPo('sup'), poRef: setPo('ref'), poDate: setPo('date'), poBranch: setPo('branch'), poPay: setPo('pay'),
      supOpts: s.sups.map(x => x[1]), skuOpts: this.skus.map(([v, l]) => ({ v, l: v + ' — ' + l })),
      poLines: lines.map((l, k) => ({ sku: l.sku, qty: l.qty, cost: l.cost, gst: l.g + '%', total: inr(l.base + l.tax, 2),
        onSku: e => { const d = this.skus.find(x => x[0] === e.target.value); updLine(k, { sku: e.target.value, cost: String(d[2]) }); },
        onQty: e => updLine(k, { qty: e.target.value.replace(/\D/g, '') }), onCost: e => updLine(k, { cost: e.target.value.replace(/[^\d.]/g, '') }),
        remove: () => this.setState({ po: { ...po, lines: po.lines.filter((_, j) => j !== k) } }) })),
      addLine: () => this.setState({ po: { ...po, lines: [...po.lines, { sku: this.skus[3][0], qty: '1', cost: String(this.skus[3][2]) }] } }),
      poSum: [{ k: 'Taxable value', v: inr(base, 2) }, ...(inter ? [{ k: 'IGST (input)', v: inr(tax, 2) }] : [{ k: 'CGST (input)', v: inr(tax / 2, 2) }, { k: 'SGST (input)', v: inr(tax / 2, 2) }])],
      poTotal: inr(base + tax, 2), poInvalid: !lines.length || !base || !(po.ref || '').trim(),
      cancelNew: () => this.setState({ newPo: false }),
      savePo: () => this.setState({ newPo: false, purs: [['PUR-' + String(319 + s.purs.length - 5).padStart(4, '0'), new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), po.sup, po.ref, po.branch, lines.reduce((a, l) => a + l.q, 0), po.pay, Math.round(base + tax)], ...s.purs] }),
      purs: s.purs.map(([no, date, sup, ref, branch, pcs, pay, a]) => ({ no, date, sup, ref, branch, pcs, pay, amt: inr(a), tag: pay.startsWith('Paid') ? 'tag tag-neutral' : 'tag tag-accent' })),
      sups: s.sups.map(([code, name, city, state, gstin, contact, cats, terms, due]) => ({ code, name, city, state, gstin, contact, cats, terms, due: due ? inr(due) : 'Nil', dueColor: due ? 'var(--color-accent-300)' : 'var(--color-neutral-400)' })),
      addingSup: s.addingSup,
      supFields: SF.map(([k, label, ph]) => ({ label, ph, value: s.sf[k] || '', onChange: e => this.setState({ sf: { ...s.sf, [k]: e.target.value } }) })),
      supInvalid: !(s.sf.name || '').trim(),
      cancelSup: () => this.setState({ addingSup: false }),
      saveSup: () => { const f = s.sf; this.setState({ addingSup: false, sups: [...s.sups, ['SUP-' + String(s.sups.length + 1).padStart(2, '0'), f.name, f.city || '—', f.state || '—', (f.gstin || '—').toUpperCase(), f.contact || '—', f.cats || '—', f.terms || 'Net 30', 0]] }); },
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header className={styles.header1}>
            <div>
              <div className={styles.box2}>Purchasing</div>
              <h1 className={styles.title1}>Purchases &amp; suppliers</h1>
            </div>
            <div className={styles.box3}>
              <div className="seg">
                {($v.tabs || []).map((t: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <button className={`seg-opt ${styles.button1}`} onClick={t?.pick} style={{ color: t?.color, boxShadow: t?.ring }}>{t?.label}</button>
                  </React.Fragment>
                ))}
              </div>
              <button className="btn btn-primary" onClick={$v.primary}>
                <i className="ph ph-plus" />
                {$v.primaryLabel}
              </button>
            </div>
          </header>
          {$v.isNew ? (
            <>
              <div className={`card ${styles.box4}`}>
                <div className={styles.box5}>
                  <div>
                    <div className="card-kicker">Goods receipt (GRN)</div>
                    <div className={styles.box6}>New purchase · {$v.grnNo}</div>
                  </div>
                  <button className={styles.button2} onClick={$v.cancelNew}><i className={`ph ph-x ${styles.icon1}`} /></button>
                </div>
                <div className={styles.box7}>
                  <div className="field">
                    <label>Supplier</label>
                    <select className="input" value={$v.po?.sup} onChange={$v.poSup}>
                      {($v.supOpts || []).map((o: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <option value={o}>{o}</option>
                        </React.Fragment>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Supplier invoice no.</label>
                    <input className="input" value={$v.po?.ref} onChange={$v.poRef} placeholder="RT/2026/1182" />
                  </div>
                  <div className="field">
                    <label>Invoice date</label>
                    <input className="input" type="date" value={$v.po?.date} onChange={$v.poDate} />
                  </div>
                  <div className="field">
                    <label>Receive at branch</label>
                    <select className="input" value={$v.po?.branch} onChange={$v.poBranch}>
                      <option>T. Nagar</option>
                      <option>Anna Nagar</option>
                      <option>Koramangala</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Payment</label>
                    <select className="input" value={$v.po?.pay} onChange={$v.poPay}>
                      <option>Credit · 30 days</option>
                      <option>Paid · Bank transfer</option>
                      <option>Paid · Cheque</option>
                    </select>
                  </div>
                </div>
                <div className={styles.box8}>
                  <div className={styles.box9}>
                    <div className={styles.box10}>
                      <span>Item</span>
                      <span className={styles.text1}>Qty</span>
                      <span className={styles.text1}>Unit cost ₹</span>
                      <span className={styles.text1}>GST %</span>
                      <span className={styles.text1}>Line total</span>
                      <span />
                    </div>
                    {($v.poLines || []).map((l: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <div className={styles.box11}>
                          <select className={`input ${styles.select1}`} value={l?.sku} onChange={l?.onSku}>
                            {($v.skuOpts || []).map((o: any, $index: number) => (
                              <React.Fragment key={$index}>
                                <option value={o?.v}>{o?.l}</option>
                              </React.Fragment>
                            ))}
                          </select>
                          <input className={`input ${styles.field1}`} value={l?.qty} onChange={l?.onQty} inputMode="numeric" />
                          <input className={`input ${styles.field1}`} value={l?.cost} onChange={l?.onCost} inputMode="decimal" />
                          <span className={styles.text2}>{l?.gst}</span>
                          <span className={styles.text3}>{l?.total}</span>
                          <button className={styles.button3} onClick={l?.remove}><i className="ph ph-x" /></button>
                        </div>
                      </React.Fragment>
                    ))}
                    <button className={`btn btn-ghost ${styles.button4}`} onClick={$v.addLine}>
                      <i className="ph ph-plus" />
                      Add line
                    </button>
                  </div>
                </div>
                <div className={styles.box12}>
                  <div className={styles.box13}>
                    Input GST is booked for ITC. Saving posts stock into the selected branch and records a payable against the supplier.
                  </div>
                  <div className={styles.box14}>
                    {($v.poSum || []).map((r: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <div className={styles.box15}>
                          <span>{r?.k}</span>
                          <span>{r?.v}</span>
                        </div>
                      </React.Fragment>
                    ))}
                    <div className={styles.box16}>
                      <span>Total</span>
                      <span>{$v.poTotal}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.box17}>
                  <button className="btn btn-secondary" onClick={$v.cancelNew}>Cancel</button>
                  <button className="btn btn-primary" onClick={$v.savePo} disabled={$v.poInvalid}>
                    <i className="ph ph-check" />
                    Save &amp; receive stock
                  </button>
                </div>
              </div>
            </>
          ) : null}
          {$v.isPur ? (
            <>
              <div className={styles.box18}>
                <table className={`table ${styles.table1}`}>
                  <thead>
                    <tr>
                      <th>GRN</th>
                      <th>Date</th>
                      <th>Supplier</th>
                      <th>Supplier inv.</th>
                      <th>Branch</th>
                      <th className={styles.text1}>Pieces</th>
                      <th>Payment</th>
                      <th className={styles.text1}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {($v.purs || []).map((p: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <tr>
                          <td className={styles.cell1}>{p?.no}</td>
                          <td className={styles.cell2}>{p?.date}</td>
                          <td>{p?.sup}</td>
                          <td className={styles.cell2}>{p?.ref}</td>
                          <td>{p?.branch}</td>
                          <td className={styles.text1}>{p?.pcs}</td>
                          <td><span className={`${p?.tag ?? ''}`}>{p?.pay}</span></td>
                          <td className={styles.text1}>{p?.amt}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
          {$v.isSup ? (
            <>
              {$v.addingSup ? (
                <>
                  <div className={`card ${styles.box19}`}>
                    <div className="card-kicker">New supplier</div>
                    <div className={styles.box20}>
                      {($v.supFields || []).map((f: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <div className="field">
                            <label>{f?.label}</label>
                            <input className="input" value={f?.value} onChange={f?.onChange} placeholder={f?.ph} />
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className={styles.box17}>
                      <button className="btn btn-secondary" onClick={$v.cancelSup}>Cancel</button>
                      <button className="btn btn-primary" onClick={$v.saveSup} disabled={$v.supInvalid}>Save supplier</button>
                    </div>
                  </div>
                </>
              ) : null}
              <div className={styles.box21}>
                {($v.sups || []).map((s: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <div className={`card ${styles.box22}`}>
                      <div className={styles.box23}>
                        <div>
                          <div className="card-title">{s?.name}</div>
                          <div className={styles.box24}>{s?.code} · {s?.city}, {s?.state}</div>
                        </div>
                        <span className="tag tag-neutral">{s?.terms}</span>
                      </div>
                      <div className={styles.box25}>
                        <span className={styles.text4}>GSTIN</span>
                        <span className={styles.text5}>{s?.gstin}</span>
                        <span className={styles.text4}>Contact</span>
                        <span>{s?.contact}</span>
                        <span className={styles.text4}>Supplies</span>
                        <span>{s?.cats}</span>
                      </div>
                      <div className={styles.box26}>
                        <span className={styles.cell2}>Outstanding</span>
                        <span style={{ color: s?.dueColor }}>{s?.due}</span>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : null}
        </main>
      </div>
      </>
    );
  }
}
