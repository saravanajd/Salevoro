import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Invoices.module.css';

export default class Invoices extends DCLogic {
  seed() {
    const L = { a: ['Kanjivaram Silk Saree', 'SC-SAR-310-FS', 18200], b: ['Ira Cotton Kurti · M', 'SC-KUR-552-M', 1290], c: ['Noor Anarkali Suit · L', 'SC-ANK-104-L', 6890], d: ['Banarasi Dupatta', 'SC-DUP-090-FS', 2150], e: ['Mehr Bridal Lehenga · M', 'SC-LHG-021-M', 48500], f: ['Phulkari Salwar Set · L', 'SC-SAL-218-L', 3450], g: ['Celeste Evening Gown · S', 'SC-GWN-077-S', 12400] };
    return [
      [1042, '18 Nov 2026', 'Ananya Iyer', 'UPI', [['a', 1]]], [1041, '18 Nov 2026', 'Walk-in', 'Cash', [['b', 1]]], [1040, '18 Nov 2026', 'Kavya Reddy', 'Card + UPI', [['c', 1], ['d', 1]]],
      [1039, '17 Nov 2026', 'Lakshmi Narayan', 'Card', [['e', 1]]], [1038, '17 Nov 2026', 'Walk-in', 'UPI', [['f', 1]]], [1037, '16 Nov 2026', 'Fathima Zahra', 'Card', [['c', 1]]],
      [1036, '15 Nov 2026', 'Sneha Kapoor', 'Cash + UPI', [['g', 1], ['b', 2]]], [1035, '14 Nov 2026', 'Riya Shah', 'UPI', [['f', 1], ['d', 1]]],
    ].map(([n, date, cust, mode, ls]) => ({ no: 'TNG/26-27/' + String(n).padStart(5, '0'), date, cust, mode, lines: ls.map(([k, q]) => ({ name: L[k][0], sku: L[k][1], price: L[k][2], qty: q, ret: k === 'c' && n === 1037 ? 1 : 0 })) }));
  }
  mobiles = { 'Ananya Iyer': '9840012345', 'Kavya Reddy': '9876543210', 'Lakshmi Narayan': '9444455566', 'Fathima Zahra': '9003322110', 'Sneha Kapoor': '9811198111', 'Riya Shah': '9820045678' };
  state: any = { invs: this.seed(), tab: 'inv', q: '', sel: 'TNG/26-27/01042', ret: null, wa: null, waSent: {},
    cns: [['CN-0091', 'TNG/26-27/01037', '17 Nov 2026', 'Fathima Zahra', 'Size exchange', 'Credit note', 6890], ['CN-0090', 'TNG/26-27/01021', '12 Nov 2026', 'Divya Menon', 'Defect / damage', 'Refund to original mode', 2150]] };
  renderVals() {
    const s = this.state, inr = (n, d = 0) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const total = i => i.lines.reduce((a, l) => a + l.price * l.qty, 0);
    const tax = i => i.lines.reduce((a, l) => { const r = l.price <= 2500 ? 5 : 18; return a + l.price * l.qty * r / (100 + r); }, 0);
    const status = i => { const r = i.lines.reduce((a, l) => a + l.ret, 0), q = i.lines.reduce((a, l) => a + l.qty, 0); return r === 0 ? ['Paid', 'tag tag-neutral'] : r < q ? ['Partly returned', 'tag tag-accent'] : ['Returned', 'tag tag-outline']; };
    const q = s.q.toLowerCase();
    const rows = s.invs.filter(i => (i.no + i.cust).toLowerCase().includes(q));
    const i = s.invs.find(x => x.no === s.sel) || s.invs[0];
    const [st, tg] = status(i);
    const ret = s.ret;
    const retVal = ret ? i.lines.reduce((a, l, k) => a + (ret.on[k] ? l.price * Math.min(+ret.qty[k] || 0, l.qty - l.ret) : 0), 0) : 0;
    return {
      tabs: [['inv', 'Invoices'], ['cn', 'Credit notes']].map(([k, label]) => ({ label, pick: () => this.setState({ tab: k }), color: s.tab === k ? 'var(--color-accent)' : 'var(--color-text)', ring: s.tab === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })),
      isInv: s.tab === 'inv', isCn: s.tab === 'cn',
      q: s.q, onQ: e => this.setState({ q: e.target.value }),
      rows: rows.map(x => { const [st, tag] = status(x); return { no: x.no, date: x.date, cust: x.cust, status: st, tag, total: inr(total(x)), open: () => this.setState({ sel: x.no }), ring: x.no === i.no ? 'inset 2px 0 0 var(--color-accent)' : 'none' }; }),
      sel: { no: i.no, date: i.date, cust: i.cust, mode: i.mode, status: st, tag: tg, total: inr(total(i)), tax: inr(tax(i), 2),
        lines: i.lines.map(l => ({ name: l.name, sku: l.sku, qty: l.qty, amt: inr(l.price * l.qty), retNote: l.ret ? ` · ${l.ret} returned` : '' })) },
      cantReturn: i.lines.every(l => l.ret >= l.qty),
      waOpen: !!s.wa && s.wa.no === i.no, waMobile: s.wa ? s.wa.mobile : '',
      openWa: () => this.setState({ wa: s.wa && s.wa.no === i.no ? null : { no: i.no, mobile: this.mobiles[i.cust] || '' } }),
      onWaMobile: e => this.setState({ wa: { ...s.wa, mobile: e.target.value.replace(/[^\d ]/g, '') } }),
      waCant: !s.wa || s.wa.mobile.replace(/\D/g, '').length !== 10 || s.waSent[i.no] === 'sending',
      waStatus: { sending: 'Sending…', delivered: 'Delivered' }[s.waSent[i.no]] || 'Not sent', waIcon: s.waSent[i.no] === 'delivered' ? 'ph ph-checks' : 'ph ph-circle-dashed',
      sendWa: () => { const no = i.no; this.setState({ waSent: { ...s.waSent, [no]: 'sending' } }); setTimeout(() => this.setState(st => ({ waSent: { ...st.waSent, [no]: 'delivered' } })), 1200); },
      reprint: () => window.print(),
      cns: s.cns.map(([no, inv, date, cust, reason, mode, a]) => ({ no, inv, date, cust, reason, mode, amt: inr(a) })),
      showRet: !!ret, ret: ret || {},
      openReturn: () => this.setState({ ret: { on: i.lines.map(() => false), qty: i.lines.map(l => String(l.qty - l.ret)), reason: 'Size exchange', mode: 'Credit note' } }),
      closeRet: () => this.setState({ ret: null }),
      retLines: ret ? i.lines.map((l, k) => ({ name: l.name, avail: l.qty - l.ret, on: ret.on[k], qty: ret.qty[k], amt: inr(l.price * Math.min(+ret.qty[k] || 0, l.qty - l.ret)),
        toggle: () => this.setState({ ret: { ...ret, on: ret.on.map((v, j) => j === k ? !v : v) } }),
        onQty: e => this.setState({ ret: { ...ret, qty: ret.qty.map((v, j) => j === k ? e.target.value.replace(/\D/g, '') : v) } }) })) : [],
      onReason: e => this.setState({ ret: { ...ret, reason: e.target.value } }), onMode: e => this.setState({ ret: { ...ret, mode: e.target.value } }),
      retTotal: inr(retVal), retInvalid: !retVal,
      submitRet: () => {
        const invs = s.invs.map(x => x.no !== i.no ? x : { ...x, lines: x.lines.map((l, k) => ret.on[k] ? { ...l, ret: l.ret + Math.min(+ret.qty[k] || 0, l.qty - l.ret) } : l) });
        const no = 'CN-' + String(92 + s.cns.length - 2).padStart(4, '0');
        this.setState({ invs, ret: null, cns: [[no, i.no, '18 Nov 2026', i.cust, ret.reason, ret.mode, retVal], ...s.cns] });
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
              <div className={styles.box2}>Sales</div>
              <h1 className={styles.title1}>Invoices &amp; returns</h1>
            </div>
            <A className="btn btn-primary" href="Billing.dc.html">
              <i className="ph ph-receipt" />
              New bill
            </A>
          </header>
          <div className={styles.box3}>
            <div className="seg">
              {($v.tabs || []).map((t: any, $index: number) => (
                <React.Fragment key={$index}>
                  <button className={`seg-opt ${styles.button1}`} onClick={t?.pick} style={{ color: t?.color, boxShadow: t?.ring }}>{t?.label}</button>
                </React.Fragment>
              ))}
            </div>
            <div className={styles.box4}>
              <i className={`ph ph-magnifying-glass ${styles.icon1}`} />
              <input className={styles.field1} value={$v.q} onChange={$v.onQ} placeholder="Search invoice no, customer or mobile" />
            </div>
          </div>
          {$v.isInv ? (
            <>
              <div className={styles.box5}>
                <section className={styles.section1}>
                  <table className={`table ${styles.table1}`}>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th className={styles.headCell1}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {($v.rows || []).map((r: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <tr className={styles.row1} onClick={r?.open} style={{ boxShadow: r?.ring }}>
                            <td className={styles.cell1}>{r?.no}</td>
                            <td className={styles.cell2}>{r?.date}</td>
                            <td>{r?.cust}</td>
                            <td><span className={`${r?.tag ?? ''}`}>{r?.status}</span></td>
                            <td className={styles.headCell1}>{r?.total}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </section>
                <aside className={styles.aside1}>
                  <div className={`card ${styles.box6}`}>
                    <div className={styles.box7}>
                      <div>
                        <div className="card-kicker">{$v.sel?.date} · {$v.sel?.mode}</div>
                        <div className={styles.box8}>{$v.sel?.no}</div>
                        <div className={styles.box9}>{$v.sel?.cust}</div>
                      </div>
                      <span className={`${$v.sel?.tag ?? ''}`}>{$v.sel?.status}</span>
                    </div>
                    <div className={styles.box10}>
                      {($v.sel?.lines || []).map((l: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <div className={styles.box11}>
                            <div>
                              <div>{l?.name}</div>
                              <div className={styles.box12}>{l?.sku} · qty {l?.qty}{l?.retNote}</div>
                            </div>
                            <span>{l?.amt}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className={styles.box13}>
                      <span>GST included</span>
                      <span>{$v.sel?.tax}</span>
                    </div>
                    <div className={styles.box14}>
                      <span>Total</span>
                      <span>{$v.sel?.total}</span>
                    </div>
                    <div className={styles.box15}>
                      <button className={`btn btn-secondary ${styles.button2}`} onClick={$v.reprint}>
                        <i className="ph ph-printer" />
                        Reprint
                      </button>
                      <button className={`btn btn-secondary ${styles.button2}`} onClick={$v.openWa}>
                        <i className="ph ph-whatsapp-logo" />
                        WhatsApp
                      </button>
                      <button className={`btn btn-primary ${styles.button2}`} onClick={$v.openReturn} disabled={$v.cantReturn}>
                        <i className="ph ph-arrow-u-up-left" />
                        Return / exchange
                      </button>
                    </div>
                    {$v.waOpen ? (
                      <>
                        <div className={styles.box16}>
                          <div className={styles.box17}>
                            <span>Send invoice PDF on WhatsApp</span>
                            <span className={styles.text1}>
                              <i className={`${$v.waIcon ?? ''}`} />
                              {$v.waStatus}
                            </span>
                          </div>
                          <div className={styles.box15}>
                            <input className={`input ${styles.field2}`} value={$v.waMobile} onChange={$v.onWaMobile} placeholder="10-digit mobile" inputMode="tel" />
                            <button className="btn btn-primary" onClick={$v.sendWa} disabled={$v.waCant}>
                              <i className="ph ph-paper-plane-tilt" />
                              Send
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}
                    <div className={styles.box12}>
                      Returns allowed within 7 days of invoice date. Exchanges issue a credit note redeemable on the next bill.
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
          {$v.isCn ? (
            <>
              <div className={styles.box18}>
                <table className={`table ${styles.table2}`}>
                  <thead>
                    <tr>
                      <th>Credit note</th>
                      <th>Against invoice</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Reason</th>
                      <th>Settlement</th>
                      <th className={styles.headCell1}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {($v.cns || []).map((c: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <tr>
                          <td className={styles.cell1}>{c?.no}</td>
                          <td className={styles.cell3}>{c?.inv}</td>
                          <td className={styles.cell2}>{c?.date}</td>
                          <td>{c?.cust}</td>
                          <td>{c?.reason}</td>
                          <td><span className="tag tag-neutral">{c?.mode}</span></td>
                          <td className={styles.headCell1}>{c?.amt}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </main>
      </div>
      {$v.showRet ? (
        <>
          <div className={`dialog-backdrop ${styles.box19}`}>
            <div className={`dialog ${styles.box20}`}>
              <div className="dialog-title">
                Return / exchange ·{" "}
                <span className={styles.text2}>{$v.sel?.no}</span>
              </div>
              <div className={styles.box21}>
                {($v.retLines || []).map((l: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <label className={styles.label1}>
                      <input type="checkbox" checked={l?.on} onChange={l?.toggle} />
                      <div>
                        <div>{l?.name}</div>
                        <div className={styles.box12}>{l?.avail} returnable</div>
                      </div>
                      <input className={`input ${styles.field3}`} value={l?.qty} onChange={l?.onQty} inputMode="numeric" />
                      <span className={styles.headCell1}>{l?.amt}</span>
                    </label>
                  </React.Fragment>
                ))}
              </div>
              <div className={styles.box22}>
                <div className="field">
                  <label>Reason</label>
                  <select className="input" value={$v.ret?.reason} onChange={$v.onReason}>
                    <option>Size exchange</option>
                    <option>Defect / damage</option>
                    <option>Colour mismatch</option>
                    <option>Customer changed mind</option>
                  </select>
                </div>
                <div className="field">
                  <label>Settle as</label>
                  <select className="input" value={$v.ret?.mode} onChange={$v.onMode}>
                    <option>Credit note</option>
                    <option>Refund to original mode</option>
                    <option>Exchange now</option>
                  </select>
                </div>
              </div>
              <div className={styles.box23}>
                <span>Return value</span>
                <span>{$v.retTotal}</span>
              </div>
              <div className="dialog-actions">
                <button className="btn btn-secondary" onClick={$v.closeRet}>Cancel</button>
                <button className="btn btn-primary" onClick={$v.submitRet} disabled={$v.retInvalid}>Issue credit note</button>
              </div>
            </div>
          </div>
        </>
      ) : null}
      </>
    );
  }
}
