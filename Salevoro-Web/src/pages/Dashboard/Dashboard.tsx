import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Dashboard.module.css';

export default class Dashboard extends DCLogic {
  state: any = { branch: db.getItem('sc_branch') || 'Chennai · T. Nagar' };
  componentDidMount() { this.h = e => this.setState({ branch: e.detail }); window.addEventListener('sc-branch', this.h); }
  componentWillUnmount() { window.removeEventListener('sc-branch', this.h); }
  renderVals() {
    const inr = n => '₹' + n.toLocaleString('en-IN');
    const days = [82, 96, 74, 110, 128, 164, 152, 88, 102, 91, 118, 136, 171, 143.33].map(v => Math.round(v * 1000));
    const max = Math.max(...days);
    const now = new Date();
    return {
      branch: this.state.branch,
      today: now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
      kpis: [
        { label: "Today's sales", value: '₹1,43,330', note: '+12% vs last Wednesday', icon: 'ph ph-currency-inr' },
        { label: 'Invoices', value: '38', note: 'Avg bill ₹3,772', icon: 'ph ph-receipt' },
        { label: 'Returns / exchanges', value: '3', note: '₹8,240 credit notes', icon: 'ph ph-arrow-u-up-left' },
        { label: 'Low-stock SKUs', value: '17', note: '5 below half of reorder level', icon: 'ph ph-warning' },
      ],
      total14: inr(days.reduce((a, b) => a + b, 0)),
      bars: days.map((v, i) => {
        const d = new Date(now); d.setDate(now.getDate() - (13 - i)); const last = i === 13;
        return { h: Math.round(v / max * 100), d: d.getDate(), tip: d.toDateString() + ' · ' + inr(v), bg: last ? 'var(--color-accent)' : 'var(--color-accent-800)', glow: last ? '0 0 16px -2px var(--color-accent)' : 'none' };
      }),
      recent: [
        ['TNG/26-27/01042', 'Ananya Iyer', 'UPI', 18200], ['TNG/26-27/01041', 'Walk-in', 'Cash', 1290], ['TNG/26-27/01040', 'Kavya Reddy', 'Split', 9340],
        ['TNG/26-27/01039', 'Lakshmi Narayan', 'Card', 48500], ['TNG/26-27/01038', 'Walk-in', 'UPI', 3450], ['TNG/26-27/01037', 'Fathima Z', 'Card', 6890],
      ].map(([no, cust, mode, a]) => ({ no, cust, mode, amt: inr(a) })),
      low: [
        ['Mehr Bridal Lehenga · M', 'SC-LHG-021-M', 1, 4], ['Noor Anarkali Suit · S', 'SC-ANK-104-S', 2, 6], ['Banarasi Dupatta', 'SC-DUP-090-FS', 3, 10],
        ['Celeste Evening Gown · L', 'SC-GWN-077-L', 2, 5], ['Ira Cotton Kurti · XL', 'SC-KUR-552-XL', 4, 12],
      ].map(([name, sku, qty, re]) => ({ name, sku, qty, pct: Math.round(qty / re * 100) })),
      occ: [
        ['20', 'Nov', 'Ananya Iyer', 'Birthday', 'Gold'], ['24', 'Nov', 'Meera & Rohit', 'Wedding · bridal fitting due', 'Platinum'],
        ['02', 'Dec', 'Kavya Reddy', 'Anniversary', 'Silver'], ['05', 'Dec', 'Sneha Kapoor', 'Birthday', 'Gold'],
      ].map(([day, mon, name, what, tier]) => ({ day, mon, name, what, tier })),
      branches: [
        ['Chennai · T. Nagar', 143330, 38, 160000], ['Chennai · Anna Nagar', 96410, 27, 120000], ['Bengaluru · Koramangala', 118750, 31, 140000],
      ].map(([name, a, bills, t]) => ({ name, amt: inr(a), bills, target: inr(t), pct: Math.min(100, Math.round(a / t * 100)) })),
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header className={styles.header1}>
            <div>
              <div className={styles.box2}>{$v.branch} · {$v.today}</div>
              <h1 className={styles.title1}>Good afternoon, Priya</h1>
            </div>
            <div className={styles.box3}>
              <A className="btn btn-secondary" href="Customers.dc.html">
                <i className="ph ph-user-plus" />
                Add customer
              </A>
              <A className="btn btn-secondary" href="Purchases.dc.html">
                <i className="ph ph-truck" />
                New purchase
              </A>
              <A className="btn btn-primary" href="Billing.dc.html">
                <i className="ph ph-receipt" />
                New bill
              </A>
            </div>
          </header>
          <div className={styles.box4}>
            {($v.kpis || []).map((k: any, $index: number) => (
              <React.Fragment key={$index}>
                <div className={`card ${styles.box5}`}>
                  <div className={styles.box6}>
                    <span>{k?.label}</span>
                    <i className={`${k?.icon ?? ''} ${styles.icon1}`} />
                  </div>
                  <div className={styles.box7}>{k?.value}</div>
                  <div className={styles.box8}>{k?.note}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className={styles.box9}>
            <div className={`card ${styles.box10}`}>
              <div className={styles.box11}>
                <div>
                  <div className="card-kicker">Sales · last 14 days</div>
                  <div className={styles.box12}>{$v.total14}</div>
                </div>
                <A className={styles.link1} href="Reports.dc.html">Open reports →</A>
              </div>
              <div className={styles.box13}>
                {($v.bars || []).map((b: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <div className={styles.box14} title={b?.tip}>
                      <div className={styles.box15} style={{ height: `${b?.h ?? ''}%`, background: b?.bg, boxShadow: b?.glow }} />
                      <span className={styles.text1}>{b?.d}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div className={styles.box16}>
                <div className={styles.box17}>Today's payment mix</div>
                <div className={styles.box18}>
                  <div className={styles.box19} />
                  <div className={styles.box20} />
                  <div className={styles.box21} />
                </div>
                <div className={styles.box22}>
                  <span>UPI 46% · ₹65,940</span>
                  <span>Card 31% · ₹44,430</span>
                  <span>Cash 23% · ₹32,960</span>
                </div>
              </div>
            </div>
            <div className={`card ${styles.box23}`}>
              <div className={styles.box24}>
                <div className="card-kicker">Recent invoices</div>
                <A className={styles.link1} href="Invoices.dc.html">All invoices →</A>
              </div>
              <table className={`table ${styles.table1}`}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Mode</th>
                    <th className={styles.headCell1}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {($v.recent || []).map((r: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <tr>
                        <td className={styles.cell1}>{r?.no}</td>
                        <td>{r?.cust}</td>
                        <td><span className="tag tag-neutral">{r?.mode}</span></td>
                        <td className={styles.headCell1}>{r?.amt}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className={styles.box25}>
            <div className={`card ${styles.box23}`}>
              <div className={styles.box24}>
                <div className="card-kicker">Low stock · this branch</div>
                <A className={styles.link1} href="Inventory.dc.html">Inventory →</A>
              </div>
              {($v.low || []).map((l: any, $index: number) => (
                <React.Fragment key={$index}>
                  <div className={styles.box26}>
                    <div className={styles.box27}>
                      <div className={styles.box28}>{l?.name}</div>
                      <div className={styles.box29}>{l?.sku}</div>
                    </div>
                    <div className={styles.box30}>
                      <div className={styles.box31} style={{ width: `${l?.pct ?? ''}%` }} />
                    </div>
                    <span className={styles.text2}>{l?.qty} left</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className={`card ${styles.box23}`}>
              <div className={styles.box24}>
                <div className="card-kicker">Upcoming occasions</div>
                <A className={styles.link1} href="Events.dc.html">Events →</A>
              </div>
              {($v.occ || []).map((o: any, $index: number) => (
                <React.Fragment key={$index}>
                  <div className={styles.box26}>
                    <div className={styles.box32}>
                      <div className={styles.box33}>{o?.day}</div>
                      <div className={styles.box34}>{o?.mon}</div>
                    </div>
                    <div className={styles.box27}>
                      <div className={styles.box28}>{o?.name}</div>
                      <div className={styles.box8}>{o?.what}</div>
                    </div>
                    <span className="tag tag-accent">{o?.tier}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className={`card ${styles.box23}`}>
              <div className="card-kicker">Branches today</div>
              {($v.branches || []).map((b: any, $index: number) => (
                <React.Fragment key={$index}>
                  <div className={styles.box35}>
                    <div className={styles.box36}>
                      <span>{b?.name}</span>
                      <span>{b?.amt}</span>
                    </div>
                    <div className={styles.box37}>
                      <div className={styles.box38} style={{ width: `${b?.pct ?? ''}%` }} />
                    </div>
                    <div className={styles.box39}>{b?.bills} bills · target {b?.target}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </main>
      </div>
      </>
    );
  }
}
