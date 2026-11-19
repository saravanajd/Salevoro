import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Events.module.css';

export default class Events extends DCLogic {
  state: any = { tab: 'occ', kind: 'All', sent: {}, aq: '', mod: 'All modules', usr: 'All users' };
  occ = [
    [20, 'Nov', 'Ananya Iyer', 'Birthday', 'Gold', '98400 12345', 'in 2 days'],
    [22, 'Nov', 'Pooja Venkat', 'Anniversary', 'Silver', '99620 44110', 'in 4 days'],
    [24, 'Nov', 'Meera Krishnan', 'Wedding', 'Platinum', '97900 11223', 'in 6 days · final fitting'],
    [2, 'Dec', 'Kavya Reddy', 'Anniversary', 'Silver', '98765 43210', 'in 14 days'],
    [5, 'Dec', 'Sneha Kapoor', 'Birthday', 'Gold', '98111 98111', 'in 17 days'],
    [9, 'Dec', 'Harini & Vikram', 'Wedding', 'Gold', '90031 70707', 'in 21 days · trousseau order'],
    [14, 'Dec', 'Divya Menon', 'Birthday', 'Gold', '94470 12012', 'in 26 days'],
  ];
  logs = [
    ['18 Nov, 2:41 pm', 'Meena K', 'Sales', 'Create', 'TNG/26-27/01042', 'Invoice ₹18,200 · UPI', 'T. Nagar'],
    ['18 Nov, 2:12 pm', 'Priya R', 'Sales', 'Override', 'TNG/26-27/01040', 'Manual discount 15% approved', 'T. Nagar'],
    ['18 Nov, 1:58 pm', 'Arjun S', 'Customers', 'Update', 'CUS-1006', 'Anniversary date changed', 'T. Nagar'],
    ['18 Nov, 11:05 am', 'Ravi M', 'Purchases', 'Create', 'PUR-0318', 'GRN 25 pcs from Tiruppur Knits', 'T. Nagar'],
    ['18 Nov, 10:40 am', 'Priya R', 'Products', 'Update', 'SC-ANK-104', 'MRP ₹6,490 → ₹6,890', 'All'],
    ['18 Nov, 10:02 am', 'Meena K', 'System', 'Login', 'POS-TNG-01', 'Shift opened · float ₹5,000', 'T. Nagar'],
    ['17 Nov, 8:55 pm', 'Meena K', 'System', 'Logout', 'POS-TNG-01', 'Shift closed · cash ₹32,960', 'T. Nagar'],
    ['17 Nov, 6:20 pm', 'Divya P', 'Sales', 'Return', 'CN-0091', 'Credit note ₹6,890 against 01037', 'T. Nagar'],
    ['17 Nov, 4:10 pm', 'Ravi M', 'Inventory', 'Transfer', 'TRF-0042', '2 pcs SC-GWN-077-M → Koramangala', 'Anna Nagar'],
    ['16 Nov, 7:30 pm', 'Ravi M', 'Inventory', 'Adjust', 'ADJ-0107', 'SC-DUP-090-FS −1 · damaged', 'Anna Nagar'],
    ['16 Nov, 12:14 pm', 'Priya R', 'Sales', 'Void', 'TNG/26-27/01029', 'Invoice cancelled · wrong size billed', 'T. Nagar'],
  ];
  renderVals() {
    const s = this.state;
    const icon = { Birthday: 'ph ph-cake', Anniversary: 'ph ph-heart', Wedding: 'ph ph-flower-lotus' };
    const items = this.occ.filter(o => s.kind === 'All' || o[3] === s.kind).map((o, i) => {
      const key = o[2] + o[3], sent = !!s.sent[key], isW = o[3] === 'Wedding';
      return { group: o[1] === 'Nov' && o[0] <= 25 ? 'This week' : 'Next 30 days', day: o[0], mon: o[1], name: o[2], kind: o[3], tier: o[4], mobile: o[5], when: o[6], icon: icon[o[3]], sent,
        btn: sent ? 'Sent ✓' : isW ? 'Send invite' : 'Send wish', btnClass: sent ? 'btn btn-secondary' : 'btn btn-primary', ring: sent ? 'none' : 'var(--shadow-sm)',
        act: () => this.setState({ sent: { ...s.sent, [key]: true } }) };
    });
    const groups = ['This week', 'Next 30 days'].map(label => ({ label, items: items.filter(i => i.group === label) })).filter(g => g.items.length);
    const tpl = s.kind === 'Wedding' ? { title: 'Wedding — bridal invite', body: 'Hi {name}, congratulations on your upcoming wedding!\nYour final fitting at Saanvi Couture is ready. Book a slot and enjoy a complimentary dupatta draping session.', offer: 'Free draping + 10% on trousseau' }
      : s.kind === 'Anniversary' ? { title: 'Anniversary wish', body: 'Happy anniversary, {name}! Celebrate with something special — 10% off your next outfit this week at Saanvi Couture.', offer: '10% off · valid 7 days' }
      : { title: 'Birthday wish', body: 'Happy birthday, {name}!\nA gift from Saanvi Couture: 200 bonus loyalty points and 10% off your next purchase this month.', offer: '200 bonus points + 10% off' };
    const aq = s.aq.toLowerCase();
    const logs = this.logs.filter(l => (s.mod === 'All modules' || l[2] === s.mod) && (s.usr === 'All users' || l[1] === s.usr) && l.join(' ').toLowerCase().includes(aq));
    const hot = ['Override', 'Void', 'Return', 'Adjust'];
    return {
      tabs: [['occ', 'Customer occasions', 'ph ph-calendar-heart'], ['audit', 'Audit log', 'ph ph-shield-check']].map(([k, label, icon]) => ({ label, icon, pick: () => this.setState({ tab: k }), color: s.tab === k ? 'var(--color-accent)' : 'var(--color-text)', ring: s.tab === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })),
      isOcc: s.tab === 'occ', isAudit: s.tab === 'audit',
      kinds: ['All', 'Birthday', 'Anniversary', 'Wedding'].map(k => { const on = s.kind === k; return { label: k, pick: () => this.setState({ kind: k }), bg: on ? 'var(--color-accent-900)' : 'transparent', color: on ? 'var(--color-accent-300)' : 'var(--color-neutral-400)', border: on ? 'var(--color-accent-700)' : 'var(--color-neutral-800)' }; }),
      groups, tpl, sentCount: Object.keys(s.sent).length,
      aq: s.aq, onAq: e => this.setState({ aq: e.target.value }),
      mod: s.mod, onMod: e => this.setState({ mod: e.target.value }), mods: ['All modules', 'Sales', 'Customers', 'Products', 'Inventory', 'Purchases', 'System'],
      usr: s.usr, onUsr: e => this.setState({ usr: e.target.value }), users: ['All users', 'Priya R', 'Meena K', 'Arjun S', 'Divya P', 'Ravi M'],
      logs: logs.map(l => ({ time: l[0], user: l[1], mod: l[2], action: l[3], rec: l[4], detail: l[5], branch: l[6], tag: hot.includes(l[3]) ? 'tag tag-accent' : 'tag tag-outline' })),
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header className={styles.header1}>
            <div>
              <div className={styles.box2}>Insights</div>
              <h1 className={styles.title1}>Events</h1>
            </div>
            <div className="seg">
              {($v.tabs || []).map((t: any, $index: number) => (
                <React.Fragment key={$index}>
                  <button className={`seg-opt ${styles.button1}`} onClick={t?.pick} style={{ color: t?.color, boxShadow: t?.ring }}>
                    <i className={`${t?.icon ?? ''}`} />
                    {t?.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </header>
          {$v.isOcc ? (
            <>
              <div className={styles.box3}>
                <section className={styles.section1}>
                  <div className={styles.box4}>
                    {($v.kinds || []).map((k: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <button className={styles.button2} onClick={k?.pick} style={{ background: k?.bg, color: k?.color, border: `1px solid ${k?.border ?? ''}` }}>
                          {k?.label}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                  {($v.groups || []).map((g: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <div className={styles.box5}>
                        <div className={styles.box6}>{g?.label}</div>
                        {(g?.items || []).map((o: any, $index: number) => (
                          <React.Fragment key={$index}>
                            <div className={styles.box7} style={{ boxShadow: o?.ring }}>
                              <div className={styles.box8}>
                                <div className={styles.box9}>{o?.day}</div>
                                <div className={styles.box10}>{o?.mon}</div>
                              </div>
                              <i className={`${o?.icon ?? ''} ${styles.icon1}`} />
                              <div className={styles.box11}>
                                <div className={styles.box12}>
                                  {o?.name}{" "}
                                  <span className={`tag tag-accent ${styles.text1}`}>{o?.tier}</span>
                                </div>
                                <div className={styles.box13}>{o?.kind} · {o?.when} · {o?.mobile}</div>
                              </div>
                              <button className={`${o?.btnClass ?? ''}`} onClick={o?.act} disabled={o?.sent}>{o?.btn}</button>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </React.Fragment>
                  ))}
                </section>
                <aside className={styles.aside1}>
                  <div className={`card ${styles.box14}`}>
                    <div className="card-kicker">Message template</div>
                    <div className={styles.box15}>{$v.tpl?.title}</div>
                    <div className={styles.box16}>{$v.tpl?.body}</div>
                    <div className={styles.box17}>
                      <span className={styles.text2}>Channel</span>
                      <span>
                        WhatsApp Business ·{" "}
                        <A className={styles.link1} href="WhatsApp.dc.html">templates</A>
                      </span>
                      <span className={styles.text2}>Offer</span>
                      <span>{$v.tpl?.offer}</span>
                      <span className={styles.text2}>Sent today</span>
                      <span>{$v.sentCount}</span>
                    </div>
                    <div className={styles.box18}>
                      Reminders queue automatically 7 days before each occasion for opted-in customers.
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
          {$v.isAudit ? (
            <>
              <div className={styles.box19}>
                <div className={styles.box20}>
                  <i className={`ph ph-magnifying-glass ${styles.text2}`} />
                  <input className={styles.field1} value={$v.aq} onChange={$v.onAq} placeholder="Search action, record or detail" />
                </div>
                <select className={`input ${styles.select1}`} value={$v.mod} onChange={$v.onMod}>
                  {($v.mods || []).map((m: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <option value={m}>{m}</option>
                    </React.Fragment>
                  ))}
                </select>
                <select className={`input ${styles.select1}`} value={$v.usr} onChange={$v.onUsr}>
                  {($v.users || []).map((u: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <option value={u}>{u}</option>
                    </React.Fragment>
                  ))}
                </select>
              </div>
              <div className={styles.box21}>
                <table className={`table ${styles.table1}`}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>User</th>
                      <th>Module</th>
                      <th>Action</th>
                      <th>Record</th>
                      <th>Detail</th>
                      <th>Branch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {($v.logs || []).map((l: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <tr>
                          <td className={styles.cell1}>{l?.time}</td>
                          <td>{l?.user}</td>
                          <td><span className="tag tag-neutral">{l?.mod}</span></td>
                          <td><span className={`${l?.tag ?? ''}`}>{l?.action}</span></td>
                          <td className={styles.cell2}>{l?.rec}</td>
                          <td className={styles.cell3}>{l?.detail}</td>
                          <td className={styles.cell4}>{l?.branch}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.box13}>
                Audit rows are written by SQL Server triggers / stored procedures and are read-only. Old and new values are kept as JSON for every update and delete.
              </div>
            </>
          ) : null}
        </main>
      </div>
      </>
    );
  }
}
