import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Customers.module.css';

export default class Customers extends DCLogic {
  seed = [
    ['Ananya Iyer', '9840012345', 'ananya.iyer@gmail.com', 'Chennai', 'Tamil Nadu', '1994-11-20', '2019-02-14', 'M', 68400, 1840, '2021-03-02'],
    ['Kavya Reddy', '9876543210', 'kavya.r@outlook.com', 'Bengaluru', 'Karnataka', '1991-06-08', '2016-12-02', 'S', 21900, 620, '2023-01-17'],
    ['Lakshmi Narayan', '9444455566', 'lakshmi.n@yahoo.in', 'Chennai', 'Tamil Nadu', '1978-01-25', '', 'L', 214300, 5210, '2018-08-10'],
    ['Fathima Zahra', '9003322110', 'fathima.z@gmail.com', 'Chennai', 'Tamil Nadu', '1999-04-11', '', 'S', 12400, 310, '2025-09-21'],
    ['Sneha Kapoor', '9811198111', 'sneha.kapoor@gmail.com', 'Bengaluru', 'Karnataka', '1996-12-05', '', 'M', 47250, 1120, '2022-05-30'],
    ['Meera Krishnan', '9790011223', 'meera.k@gmail.com', 'Chennai', 'Tamil Nadu', '1997-07-19', '2026-11-24', 'S', 132800, 3020, '2026-06-02'],
    ['Divya Menon', '9447012012', 'divya.menon@gmail.com', 'Kochi', 'Kerala', '1988-09-30', '2012-05-06', 'L', 38600, 860, '2020-11-11'],
    ['Riya Shah', '9820045678', 'riya.shah@gmail.com', 'Mumbai', 'Maharashtra', '2001-03-15', '', 'XS', 8900, 89, '2026-10-04'],
  ].map((r, i) => ({ id: i + 1, code: 'CUS-' + String(1001 + i), name: r[0], mobile: r[1], email: r[2], city: r[3], state: r[4], dob: r[5], anniv: r[6], size: r[7], spend: r[8], points: r[9], since: r[10], gstin: '', optin: true }));
  blank = { name: '', mobile: '', email: '', city: '', state: 'Tamil Nadu', dob: '', anniv: '', size: 'M', gstin: '', address: '', optin: true };
  state: any = { list: [...this.seed, ...JSON.parse(db.getItem('sc_customers_new') || '[]')], q: '', tier: 'All', mode: 'view', selId: 1, form: { ...this.blank }, err: '', tried: false };
  tier(sp) { return sp > 100000 ? 'Platinum' : sp >= 25000 ? 'Gold' : 'Silver'; }
  save() {
    const f = this.state.form, m = f.mobile.replace(/\D/g, '');
    let err = '';
    if (!f.name.trim()) err = 'Name is required.';
    else if (m.length !== 10) err = 'Mobile must be 10 digits.';
    else if (this.state.list.some(c => c.mobile === m && c.id !== f.id)) err = 'A customer with this mobile already exists.';
    else if (f.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(f.gstin.toUpperCase())) err = 'GSTIN format looks wrong (15 characters).';
    if (err) return this.setState({ err, tried: true });
    this.setState(s => {
      let list, selId;
      if (f.id) { list = s.list.map(c => c.id === f.id ? { ...c, ...f, mobile: m } : c); selId = f.id; }
      else {
        selId = Math.max(...s.list.map(c => c.id)) + 1;
        const c = { ...f, mobile: m, id: selId, code: 'CUS-' + (1000 + selId), spend: 0, points: 0, since: new Date().toISOString().slice(0, 10) };
        list = [...s.list, c];
        db.setItem('sc_customers_new', JSON.stringify(list.filter(x => x.id > this.seed.length)));
      }
      return { list, selId, mode: 'view', err: '', tried: false };
    });
  }
  renderVals() {
    const s = this.state, inr = n => '₹' + n.toLocaleString('en-IN');
    const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const q = s.q.toLowerCase();
    const rows = s.list.map(c => ({ ...c, tier: this.tier(c.spend) }))
      .filter(c => (s.tier === 'All' || c.tier === s.tier) && (c.name + c.mobile + c.email).toLowerCase().includes(q))
      .map(c => ({ ...c, initials: c.name.split(' ').map(w => w[0]).join('').slice(0, 2), mobileFmt: c.mobile.replace(/(\d{5})(\d{5})/, '$1 $2'), spendFmt: inr(c.spend), points: c.points.toLocaleString('en-IN'),
        ring: s.mode === 'view' && c.id === s.selId ? 'inset 2px 0 0 var(--color-accent)' : 'none', open: () => this.setState({ selId: c.id, mode: 'view' }) }));
    const c = s.list.find(x => x.id === s.selId) || s.list[0];
    const set = k => e => this.setState({ form: { ...s.form, [k]: e.target.value } });
    const f = s.form, m = f.mobile.replace(/\D/g, '');
    const bad = { name: s.tried && !f.name.trim(), mobile: s.tried && m.length !== 10 };
    const F = [['name', 'Full name *', 'text', 'e.g. Ananya Iyer', '1 / -1'], ['mobile', 'Mobile *', 'tel', '10-digit mobile', 'auto'], ['email', 'Email', 'email', 'name@email.com', 'auto'],
      ['dob', 'Date of birth', 'date', '', 'auto'], ['anniv', 'Anniversary / wedding', 'date', '', 'auto'], ['city', 'City', 'text', 'Chennai', 'auto'], ['gstin', 'GSTIN (B2B, optional)', 'text', '33ABCDE1234F1Z5', 'auto'], ['address', 'Address', 'text', 'Door no, street, area, PIN', '1 / -1']];
    return {
      startNew: () => this.setState({ mode: 'form', form: { ...this.blank }, err: '', tried: false }),
      q: s.q, onQ: e => this.setState({ q: e.target.value }),
      tiers: ['All', 'Silver', 'Gold', 'Platinum'].map(t => ({ label: t, pick: () => this.setState({ tier: t }), color: s.tier === t ? 'var(--color-accent)' : 'var(--color-text)', ring: s.tier === t ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })),
      rows, none: rows.length === 0, count: s.list.length,
      isForm: s.mode === 'form', isView: s.mode === 'view',
      formKicker: f.id ? 'Edit customer' : 'New customer', formTitle: f.id ? f.name : 'Create customer profile',
      fields: F.map(([k, label, type, ph, span]) => ({ label, type, ph, span, value: f[k] || '', onChange: set(k), err: bad[k] ? '0 0 0 1px var(--color-accent-300)' : 'none' })),
      form: f, onState: set('state'), onSize: set('size'), onOptin: () => this.setState({ form: { ...f, optin: !f.optin } }),
      states: ['Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Delhi', 'Other'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free size'],
      hasErr: !!s.err, errMsg: s.err,
      cancel: () => this.setState({ mode: 'view', err: '', tried: false }),
      save: () => this.save(),
      edit: () => this.setState({ mode: 'form', form: { ...this.blank, ...c }, err: '' }),
      sel: { ...c, initials: c.name.split(' ').map(w => w[0]).join('').slice(0, 2), tier: this.tier(c.spend), spendFmt: inr(c.spend), points: c.points.toLocaleString('en-IN'), since: fmtD(c.since) },
      selInfo: [['Mobile', '+91 ' + c.mobile.replace(/(\d{5})(\d{5})/, '$1 $2')], ['Email', c.email || '—'], ['City', (c.city || '—') + ', ' + c.state], ['Birthday', fmtD(c.dob)], ['Anniversary', fmtD(c.anniv)], ['Size', c.size], ['GSTIN', c.gstin || '—']].map(([k, v]) => ({ k, v })),
      selHist: c.spend ? [['12 Nov', 'Kanjivaram Silk Saree', 18200], ['28 Oct', 'Noor Anarkali Suit · M', 6890], ['03 Sep', 'Banarasi Dupatta', 2150]].map(([date, item, a]) => ({ date, item, amt: inr(a) })) : [{ date: '—', item: 'No purchases yet', amt: '' }],
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
              <h1 className={styles.title1}>Customers</h1>
            </div>
            <button className="btn btn-primary" onClick={$v.startNew}>
              <i className="ph ph-user-plus" />
              New customer
            </button>
          </header>
          <div className={styles.box3}>
            <section className={styles.section1}>
              <div className={styles.box4}>
                <div className={styles.box5}>
                  <i className={`ph ph-magnifying-glass ${styles.icon1}`} />
                  <input className={styles.field1} value={$v.q} onChange={$v.onQ} placeholder="Search name, mobile or email" />
                </div>
                <div className="seg">
                  {($v.tiers || []).map((t: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <button className={`seg-opt ${styles.button1}`} onClick={t?.pick} style={{ color: t?.color, boxShadow: t?.ring }}>{t?.label}</button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className={styles.box6}>
                <table className={`table ${styles.table1}`}>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Mobile</th>
                      <th>City</th>
                      <th>Tier</th>
                      <th className={styles.headCell1}>Points</th>
                      <th className={styles.headCell1}>Lifetime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {($v.rows || []).map((r: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <tr className={styles.row1} onClick={r?.open} style={{ boxShadow: r?.ring }}>
                          <td>
                            <div className={styles.box7}>
                              <div className={styles.box8}>{r?.initials}</div>
                              <div>
                                <div>{r?.name}</div>
                                <div className={styles.box9}>{r?.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className={styles.cell1}>{r?.mobileFmt}</td>
                          <td className={styles.cell1}>{r?.city}</td>
                          <td><span className="tag tag-accent">{r?.tier}</span></td>
                          <td className={styles.headCell1}>{r?.points}</td>
                          <td className={styles.headCell1}>{r?.spendFmt}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {$v.none ? (
                  <>
                    <div className={styles.box10}>No customers match “{$v.q}”.</div>
                  </>
                ) : null}
              </div>
              <div className={styles.box11}>
                {$v.count} customers · Tiers: Silver &lt; ₹25k, Gold ₹25k–1L, Platinum &gt; ₹1L lifetime · 1 point per ₹100, 1 point = ₹1
              </div>
            </section>
            <aside className={styles.aside1}>
              {$v.isForm ? (
                <>
                  <div className={`card ${styles.box12}`}>
                    <div className={styles.box13}>
                      <div>
                        <div className="card-kicker">{$v.formKicker}</div>
                        <div className={styles.box14}>{$v.formTitle}</div>
                      </div>
                      <button className={styles.button2} onClick={$v.cancel}><i className={`ph ph-x ${styles.icon2}`} /></button>
                    </div>
                    <div className={styles.box15}>
                      {($v.fields || []).map((f: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <div className="field" style={{ gridColumn: f?.span }}>
                            <label>{f?.label}</label>
                            <input className="input" type={f?.type} value={f?.value} onChange={f?.onChange} placeholder={f?.ph} style={{ boxShadow: f?.err }} />
                          </div>
                        </React.Fragment>
                      ))}
                      <div className="field">
                        <label>State</label>
                        <select className="input" value={$v.form?.state} onChange={$v.onState}>
                          {($v.states || []).map((s: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={s}>{s}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Preferred size</label>
                        <select className="input" value={$v.form?.size} onChange={$v.onSize}>
                          {($v.sizes || []).map((s: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={s}>{s}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                      <label className={styles.label1}>
                        <input className={styles.field2} type="checkbox" checked={$v.form?.optin} onChange={$v.onOptin} />
                        Send occasion wishes &amp; offers on WhatsApp / SMS
                      </label>
                    </div>
                    {$v.hasErr ? (
                      <>
                        <div className={styles.box16}>{$v.errMsg}</div>
                      </>
                    ) : null}
                    <div className={styles.box17}>
                      <button className="btn btn-secondary" onClick={$v.cancel}>Cancel</button>
                      <button className="btn btn-primary" onClick={$v.save}>
                        <i className="ph ph-check" />
                        Save customer
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
              {$v.isView ? (
                <>
                  <div className={`card ${styles.box18}`}>
                    <div className={styles.box19}>
                      <div className={styles.box20}>{$v.sel?.initials}</div>
                      <div className={styles.box21}>
                        <div className={styles.box22}>{$v.sel?.name}</div>
                        <div className={styles.box23}>{$v.sel?.code} · since {$v.sel?.since}</div>
                      </div>
                      <button className="btn btn-secondary" onClick={$v.edit}>
                        <i className="ph ph-pencil-simple" />
                        Edit
                      </button>
                    </div>
                    <div className={styles.box24}>
                      <div className={styles.box25}>
                        <div className={styles.box26}>Tier</div>
                        <div className={styles.box27}>{$v.sel?.tier}</div>
                      </div>
                      <div className={styles.box25}>
                        <div className={styles.box26}>Points</div>
                        <div className={styles.icon2}>{$v.sel?.points}</div>
                      </div>
                      <div className={styles.box25}>
                        <div className={styles.box26}>Lifetime</div>
                        <div className={styles.icon2}>{$v.sel?.spendFmt}</div>
                      </div>
                    </div>
                    <div className={styles.box28}>
                      {($v.selInfo || []).map((i: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <span className={styles.icon1}>{i?.k}</span>
                          <span>{i?.v}</span>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className={styles.box29}>
                      <div className="card-kicker">Recent purchases</div>
                      {($v.selHist || []).map((h: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <div className={styles.box30}>
                            <span>
                              <span className={styles.icon1}>{h?.date}</span>
                              {" "}· {h?.item}
                            </span>
                            <span>{h?.amt}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className={styles.box31}>
                      <A className={`btn btn-primary ${styles.link1}`} href="Billing.dc.html">
                        <i className="ph ph-receipt" />
                        Bill this customer
                      </A>
                      <A className={`btn btn-secondary ${styles.link1}`} href="Events.dc.html">
                        <i className="ph ph-calendar-heart" />
                        Occasions
                      </A>
                    </div>
                  </div>
                </>
              ) : null}
            </aside>
          </div>
        </main>
      </div>
      </>
    );
  }
}
