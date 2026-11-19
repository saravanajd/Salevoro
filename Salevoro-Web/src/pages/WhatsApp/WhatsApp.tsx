import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './WhatsApp.module.css';

export default class WhatsApp extends DCLogic {
  read(k, d) { try { return { ...d, ...(JSON.parse(db.getItem(k)) || {}) }; } catch (e) { return { ...d }; } }
  defC = { connected: true, provider: 'Meta WhatsApp Cloud API (direct)', displayName: 'Saanvi Couture', phone: '9844012345', phoneId: '109876543210987', wabaId: '204567891234567', token: 'EAAGxxxxxxxxxxxxxxxxxxxx', verify: 'sc-verify-7f3a', autoInvoice: true, autoCredit: true, autoWish: true, autoAlter: false, quietFrom: '21:00', quietTo: '09:00', rateMkt: '0.88', rateUtil: '0.13' };
  T = [
    { id: 'invoice_share', cat: 'Utility', lang: 'English', status: 'Approved', header: 'Document', doc: 'Invoice_TNG-26-27-01043.pdf', body: 'Hi {{1}}, thank you for shopping at {{2}}! Your invoice {{3}} for ₹{{4}} is attached.\nLoyalty points earned: {{5}}. Exchange within 7 days with original tags.', footer: 'Saanvi Couture', buttons: ['View invoice'], sample: ['Ananya', 'Saanvi Couture', 'TNG/26-27/01043', '18,200.00', '182'] },
    { id: 'credit_note_issued', cat: 'Utility', lang: 'English', status: 'Approved', header: 'Document', doc: 'CreditNote_CN-0092.pdf', body: 'Hi {{1}}, credit note {{2}} for ₹{{3}} has been issued against invoice {{4}}. Use it on your next purchase within 90 days.', footer: 'Saanvi Couture', buttons: [], sample: ['Fathima', 'CN-0092', '6,890.00', 'TNG/26-27/01037'] },
    { id: 'birthday_offer', cat: 'Marketing', lang: 'English', status: 'Approved', header: 'Image', body: 'Happy birthday, {{1}}!\nEnjoy {{2}} on your next purchase at {{3}}, valid till {{4}}. Just show this message at the counter.', footer: 'Reply STOP to opt out', buttons: ['Book a visit', 'Stop promotions'], sample: ['Ananya', '10% off + 200 bonus points', 'Saanvi Couture', '30 Nov'] },
    { id: 'festive_collection', cat: 'Marketing', lang: 'English', status: 'Approved', header: 'Image', body: 'Hi {{1}}, our {{2}} collection has arrived!\nGet {{3}} with code {{4}} till {{5}}.', footer: 'Reply STOP to opt out', buttons: ['Shop the look', 'Stop promotions'], sample: ['Kavya', 'Wedding Season 2026', 'flat 15% off', 'WED15', '15 Dec'] },
    { id: 'alteration_ready', cat: 'Utility', lang: 'English', status: 'Pending', header: 'Text', headerText: 'Your outfit is ready', body: 'Hi {{1}}, your alteration for {{2}} is ready for pickup at {{3}}. Store hours 10 am – 9 pm.', footer: 'Saanvi Couture', buttons: [], sample: ['Meera', 'Mehr Bridal Lehenga', 'T. Nagar'] },
  ];
  state: any = { tab: 'conn', c: this.read('sc_wa', this.defC), connMsg: '', copied: false, testNo: '', testMsg: 'Sends the hello_world template to check delivery.', tpls: this.T, selTpl: 'invoice_share', nt: null,
    cp: { name: '', tpl: 'festive_collection', seg: 'all', when: 'now', at: '', v: ['Wedding Season 2026', 'flat 15% off', 'WED15', '15 Dec'] },
    camps: [['Diwali festive edit', 'festive_collection', '28 Oct 2026', 1840, 1796, 1312, 214, 'Completed'], ['November birthdays', 'birthday_offer', 'Daily · auto', 46, 46, 41, 12, 'Running']],
    lq: '', lt: 'All types',
    logs: [['18 Nov, 2:41 pm', 'Ananya Iyer', '98400 12345', 'Invoice', 'invoice_share', 'TNG/26-27/01042', 'Read'], ['18 Nov, 1:20 pm', 'Kavya Reddy', '98765 43210', 'Invoice', 'invoice_share', 'TNG/26-27/01040', 'Delivered'], ['18 Nov, 9:00 am', 'Ananya Iyer', '98400 12345', 'Wish', 'birthday_offer', 'Birthday · 20 Nov', 'Read'], ['17 Nov, 6:22 pm', 'Fathima Zahra', '90033 22110', 'Credit note', 'credit_note_issued', 'CN-0091', 'Read'], ['17 Nov, 4:05 pm', 'Lakshmi Narayan', '94444 55566', 'Invoice', 'invoice_share', 'TNG/26-27/01039', 'Delivered'], ['17 Nov, 11:30 am', 'Riya Shah', '98200 45678', 'Invoice', 'invoice_share', 'TNG/26-27/01035', 'Failed'], ['28 Oct, 11:00 am', '1,840 customers', '—', 'Offer', 'festive_collection', 'Diwali festive edit', 'Delivered']] };
  save(c) { db.setItem('sc_wa', JSON.stringify(c)); this.setState({ c }); }
  fill(t, vals) { return t.body.replace(/\{\{(\d+)\}\}/g, (m, n) => vals[n - 1] ?? m); }
  renderVals() {
    const s = this.state, c = s.c;
    const isAdmin = ((() => { try { return JSON.parse(db.getItem('sc_user')) || {}; } catch (e) { return {}; } })().role || 'Admin') === 'Admin';
    const store = this.read('sc_store', { name: 'Saanvi Couture' });
    const setC = k => e => this.setState({ c: { ...c, [k]: e.target.value }, connMsg: '' });
    const tab = (k, label, icon) => ({ label, icon, pick: () => this.setState({ tab: k }), color: s.tab === k ? 'var(--color-accent)' : 'var(--color-text)', ring: s.tab === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' });
    const tp = s.tpls.find(t => t.id === s.selTpl) || s.tpls[0];
    const pvT = s.nt ? { ...s.nt, buttons: s.nt.button ? [s.nt.button] : [], footer: '', sample: [] } : tp;
    const SEG = { all: ['All opted-in', 2310], gold: ['Gold & Platinum', 640], plat: ['Platinum', 118], bday: ['Birthdays this month', 46], bridal: ['Bought bridal in 12 months', 212], lapsed: ['No visit in 90 days', 780] };
    const ct = s.tpls.find(t => t.id === s.cp.tpl) || s.tpls[3];
    const cpVals = ['{name}', ...(ct.id === 'birthday_offer' ? [s.cp.v[1], store.name, s.cp.v[3]] : s.cp.v)];
    const n = SEG[s.cp.seg][1], cost = n * (+c.rateMkt || 0);
    const st = { Read: ['ph ph-checks', 'var(--color-accent-300)'], Delivered: ['ph ph-checks', 'var(--color-neutral-300)'], Sent: ['ph ph-check', 'var(--color-neutral-400)'], Failed: ['ph ph-warning-circle', 'var(--color-accent-200)'] };
    const lq = s.lq.toLowerCase();
    const logs = s.logs.filter(l => (s.lt === 'All types' || l[3] === s.lt) && l.join(' ').toLowerCase().includes(lq));
    const varLabels = ct.id === 'birthday_offer' ? ['—', 'Offer', '—', 'Valid till'] : ['Collection', 'Offer', 'Coupon code', 'Valid till'];
    return {
      tabs: [tab('conn', 'Connection', 'ph ph-plugs-connected'), tab('tpl', 'Templates', 'ph ph-chat-text'), tab('camp', 'Campaigns', 'ph ph-megaphone'), tab('log', 'Message log', 'ph ph-list-checks')],
      tabConn: s.tab === 'conn', tabTpl: s.tab === 'tpl', tabCamp: s.tab === 'camp', tabLog: s.tab === 'log',
      dot: c.connected ? 'var(--color-accent)' : 'var(--color-neutral-600)',
      statusLine: c.connected ? `Connected · ${c.displayName} · +91 ${c.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}` : 'Not connected — bills can still be shared by click-to-chat',
      notAdmin: !isAdmin, connected: c.connected, notConnected: !c.connected,
      c, providers: ['Meta WhatsApp Cloud API (direct)', 'Gupshup', 'Interakt', 'WATI', 'AiSensy', 'Twilio'],
      cProvider: setC('provider'), cQuietFrom: setC('quietFrom'), cQuietTo: setC('quietTo'), cRateMkt: setC('rateMkt'), cRateUtil: setC('rateUtil'),
      connFields: [['displayName', 'Business display name', 'Saanvi Couture', 'auto', 'text', 'inherit'], ['phone', 'WhatsApp business number', '10-digit mobile', 'auto', 'tel', 'inherit'], ['phoneId', 'Phone number ID', '1098…', 'auto', 'text', 'ui-monospace,Menlo,monospace'], ['wabaId', 'WhatsApp Business Account ID', '2045…', 'auto', 'text', 'ui-monospace,Menlo,monospace'], ['token', 'Permanent access token', 'EAAG…', '1 / -1', 'password', 'ui-monospace,Menlo,monospace'], ['verify', 'Webhook verify token', 'any secret string', 'auto', 'text', 'ui-monospace,Menlo,monospace']]
        .map(([k, label, ph, span, type, font]) => ({ label, ph, span, type, font, value: c[k], onChange: setC(k) })),
      webhook: 'https://api.saanvicouture.in/webhooks/whatsapp', copyLabel: s.copied ? 'Copied' : 'Copy',
      copyHook: () => { navigator.clipboard && navigator.clipboard.writeText('https://api.saanvicouture.in/webhooks/whatsapp'); this.setState({ copied: true }); setTimeout(() => this.setState({ copied: false }), 1500); },
      hasConnMsg: !!s.connMsg, connMsg: s.connMsg, connectLabel: c.connected ? 'Save & re-verify' : 'Connect',
      connect: () => { if (c.phone.replace(/\D/g, '').length !== 10 || !c.phoneId || !c.token) return this.setState({ connMsg: 'Number, Phone number ID and access token are required.' }); this.save({ ...c, connected: true }); this.setState({ connMsg: 'Connected and verified.' }); },
      disconnect: () => this.save({ ...c, connected: false }),
      autos: [['autoInvoice', 'Send invoice PDF after every bill', 'When the customer has a mobile number on the bill', 'invoice_share'], ['autoCredit', 'Send credit note on returns', 'Issued from Invoices & returns', 'credit_note_issued'], ['autoWish', 'Birthday & anniversary wishes', '9 am on the day · opted-in customers only', 'birthday_offer'], ['autoAlter', 'Alteration ready for pickup', 'When an alteration is marked ready', 'alteration_ready']]
        .map(([k, label, sub, tpl]) => ({ label, sub, tpl, on: !!c[k], toggle: () => this.save({ ...c, [k]: !c[k] }) })),
      phoneFmt: '+91 ' + c.phone.replace(/(\d{5})(\d{5})/, '$1 $2'),
      health: [['Status', c.connected ? 'Connected' : 'Disconnected'], ['Quality rating', 'High'], ['Messaging limit', '10K customers / 24 h'], ['Verified business', 'Yes'], ['Provider', c.provider.replace(' (direct)', '')]].map(([k, v]) => ({ k, v })),
      testNo: s.testNo, onTestNo: e => this.setState({ testNo: e.target.value }), testMsg: s.testMsg,
      sendTest: () => { const m = s.testNo.replace(/\D/g, ''); if (m.length !== 10) return this.setState({ testMsg: 'Enter a 10-digit mobile.' }); this.setState({ testMsg: 'Test sent to +91 ' + m.replace(/(\d{5})(\d{5})/, '$1 $2') + ' — check your phone.', logs: [['Just now', 'Test', '+91 ' + m, 'Test', 'hello_world', '—', 'Sent'], ...s.logs] }); },
      tpls: s.tpls.map(t => ({ id: t.id, cat: t.cat, status: t.status, header: t.header, lang: t.lang, body: t.body.replace(/\n/g, ' '), catTag: t.cat === 'Marketing' ? 'tag tag-accent' : 'tag tag-neutral', stTag: t.status === 'Approved' ? 'tag tag-outline' : 'tag tag-neutral',
        ring: !s.nt && t.id === tp.id ? '0 0 0 1px var(--color-accent), 0 0 24px -12px var(--color-accent)' : 'var(--shadow-sm)', pick: () => this.setState({ selTpl: t.id, nt: null }) })),
      storeInitial: (store.name || 'S')[0],
      pv: { isImage: pvT.header === 'Image', isDoc: pvT.header === 'Document', isText: pvT.header === 'Text', doc: pvT.doc || 'Document.pdf', headerText: pvT.headerText || 'Header text', body: s.nt ? (s.nt.body || 'Your message…') : this.fill(tp, tp.sample), footer: pvT.footer || '', buttons: pvT.buttons || [] },
      editingTpl: !!s.nt, nt: s.nt || {}, bodyPh: 'Hi {{1}}, … use {{1}}, {{2}} for customer name, offer etc.',
      newTpl: () => this.setState({ nt: { id: '', cat: 'Marketing', header: 'Image', body: '', button: '' } }),
      ntId: e => this.setState({ nt: { ...s.nt, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') } }), ntCat: e => this.setState({ nt: { ...s.nt, cat: e.target.value } }), ntHeader: e => this.setState({ nt: { ...s.nt, header: e.target.value } }), ntBody: e => this.setState({ nt: { ...s.nt, body: e.target.value } }), ntButton: e => this.setState({ nt: { ...s.nt, button: e.target.value } }),
      ntInvalid: !s.nt || !s.nt.id || !s.nt.body.trim(), cancelTpl: () => this.setState({ nt: null }),
      submitTpl: () => { const t = s.nt; this.setState({ tpls: [...s.tpls, { id: t.id, cat: t.cat, lang: 'English', status: 'Pending', header: t.header, body: t.body, footer: t.cat === 'Marketing' ? 'Reply STOP to opt out' : '', buttons: [t.button, ...(t.cat === 'Marketing' ? ['Stop promotions'] : [])].filter(Boolean), sample: [] }], selTpl: t.id, nt: null }); },
      cp: s.cp, cpName: e => this.setState({ cp: { ...s.cp, name: e.target.value } }), cpTpl: e => this.setState({ cp: { ...s.cp, tpl: e.target.value } }), cpAt: e => this.setState({ cp: { ...s.cp, at: e.target.value } }),
      mktTpls: s.tpls.filter(t => t.cat === 'Marketing' && t.status === 'Approved').map(t => t.id),
      segs: Object.entries(SEG).map(([k, [label, cnt]]) => { const on = s.cp.seg === k; return { label, n: cnt.toLocaleString('en-IN'), pick: () => this.setState({ cp: { ...s.cp, seg: k } }), bg: on ? 'var(--color-accent-900)' : 'transparent', color: on ? 'var(--color-accent-300)' : 'var(--color-neutral-400)', border: on ? 'var(--color-accent-700)' : 'var(--color-neutral-800)' }; }),
      vars: s.cp.v.map((value, i) => ({ label: varLabels[i], value, i })).filter(v => v.label !== '—').map(v => ({ ...v, onChange: e => this.setState({ cp: { ...s.cp, v: s.cp.v.map((x, j) => j === v.i ? e.target.value : x) } }) })),
      whens: [['now', 'Send now'], ['later', 'Schedule']].map(([k, label]) => ({ label, pick: () => this.setState({ cp: { ...s.cp, when: k } }), color: s.cp.when === k ? 'var(--color-accent)' : 'var(--color-text)', ring: s.cp.when === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })),
      isLater: s.cp.when === 'later',
      audienceNote: `${n.toLocaleString('en-IN')} customers · est. ₹${cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })} at ₹${c.rateMkt}/msg`,
      cpPreview: this.fill(ct, cpVals).replace('{name}', 'Kavya'), cpButtons: ct.buttons,
      cantLaunch: !s.cp.name.trim() || !c.connected || (s.cp.when === 'later' && !s.cp.at), launchLabel: s.cp.when === 'later' ? 'Schedule campaign' : 'Send campaign',
      launch: () => { const later = s.cp.when === 'later'; this.setState({ camps: [[s.cp.name, s.cp.tpl, later ? new Date(s.cp.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today', later ? 0 : n, later ? 0 : Math.round(n * 0.97), 0, 0, later ? 'Scheduled' : 'Sending'], ...s.camps], cp: { ...s.cp, name: '' } }); },
      camps: s.camps.map(([name, tpl, date, sent, del, read, clicks, status]) => ({ name, tpl, date, sent: sent.toLocaleString('en-IN'), del: del.toLocaleString('en-IN'), read: read.toLocaleString('en-IN'), clicks: clicks.toLocaleString('en-IN'), status, tag: status === 'Completed' ? 'tag tag-neutral' : 'tag tag-accent' })),
      lq: s.lq, onLq: e => this.setState({ lq: e.target.value }), lt: s.lt, onLt: e => this.setState({ lt: e.target.value }),
      logStats: [['Sent today', 42], ['Delivered', '98%'], ['Read', '81%'], ['Failed', 1]].map(([k, v]) => ({ k, v })),
      logs: logs.map(l => ({ time: l[0], name: l[1], mobile: l[2], type: l[3], tpl: l[4], ref: l[5], status: l[6], icon: st[l[6]][0], color: st[l[6]][1] })),
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header className={styles.header1}>
            <div>
              <div className={styles.box2}>Engage</div>
              <h1 className={styles.title1}>WhatsApp Business</h1>
              <div className={styles.box3}>
                <span className={styles.text1} style={{ background: $v.dot, boxShadow: `0 0 10px ${$v.dot ?? ''}` }} />
                {$v.statusLine}
              </div>
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
          {$v.tabConn ? (
            <>
              <div className={styles.box4}>
                <section className={styles.section1}>
                  {$v.notAdmin ? (
                    <>
                      <div className={styles.box5}>
                        <i className="ph ph-lock-key" />
                        Only admins can change the connection. You can still send bills, campaigns and view the log.
                      </div>
                    </>
                  ) : null}
                  <div className={`card ${styles.box6}`}>
                    <div className="card-kicker">API connection</div>
                    <div className={styles.box7}>
                      <div className={`field ${styles.box8}`}>
                        <label>Provider</label>
                        <select className="input" value={$v.c?.provider} onChange={$v.cProvider} disabled={$v.notAdmin}>
                          {($v.providers || []).map((p: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={p}>{p}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                      {($v.connFields || []).map((x: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <div className="field" style={{ gridColumn: x?.span }}>
                            <label>{x?.label}</label>
                            <input className="input" type={x?.type} value={x?.value} onChange={x?.onChange} placeholder={x?.ph} disabled={$v.notAdmin} style={{ fontFamily: x?.font }} />
                          </div>
                        </React.Fragment>
                      ))}
                      <div className={`field ${styles.box8}`}>
                        <label>Webhook callback URL (paste in your provider dashboard)</label>
                        <div className={styles.box9}>
                          <input className={`input ${styles.field1}`} value={$v.webhook} readOnly={true} />
                          <button className="btn btn-secondary" onClick={$v.copyHook}>
                            <i className="ph ph-copy" />
                            {$v.copyLabel}
                          </button>
                        </div>
                      </div>
                    </div>
                    {$v.hasConnMsg ? (
                      <>
                        <div className={styles.box10}>{$v.connMsg}</div>
                      </>
                    ) : null}
                    <div className={styles.box11}>
                      {$v.connected ? (
                        <>
                          <button className="btn btn-secondary" onClick={$v.disconnect} disabled={$v.notAdmin}>
                            <i className="ph ph-plugs" />
                            Disconnect
                          </button>
                        </>
                      ) : null}
                      <button className="btn btn-primary" onClick={$v.connect} disabled={$v.notAdmin}>
                        <i className="ph ph-plugs-connected" />
                        {$v.connectLabel}
                      </button>
                    </div>
                  </div>
                  <div className={`card ${styles.box12}`}>
                    <div className="card-kicker">Automations</div>
                    {($v.autos || []).map((a: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <label className={styles.label1}>
                          <input className={styles.field2} type="checkbox" checked={a?.on} onChange={a?.toggle} disabled={$v.notAdmin} />
                          <div className={styles.box13}>
                            <div className={styles.box14}>{a?.label}</div>
                            <div className={styles.box15}>{a?.sub}</div>
                          </div>
                          <span className={`tag tag-neutral ${styles.text2}`}>{a?.tpl}</span>
                        </label>
                      </React.Fragment>
                    ))}
                    <div className={styles.box16}>
                      <div className="field">
                        <label>No marketing after</label>
                        <input className="input" type="time" value={$v.c?.quietFrom} onChange={$v.cQuietFrom} disabled={$v.notAdmin} />
                      </div>
                      <div className="field">
                        <label>Resume marketing at</label>
                        <input className="input" type="time" value={$v.c?.quietTo} onChange={$v.cQuietTo} disabled={$v.notAdmin} />
                      </div>
                      <div className="field">
                        <label>Marketing msg cost ₹</label>
                        <input className="input" value={$v.c?.rateMkt} onChange={$v.cRateMkt} inputMode="decimal" disabled={$v.notAdmin} />
                      </div>
                      <div className="field">
                        <label>Utility msg cost ₹</label>
                        <input className="input" value={$v.c?.rateUtil} onChange={$v.cRateUtil} inputMode="decimal" disabled={$v.notAdmin} />
                      </div>
                    </div>
                    <div className={styles.box17}>
                      Message costs are set by Meta and your provider. Enter your current rates so campaign estimates are accurate.
                    </div>
                  </div>
                </section>
                <aside className={styles.aside1}>
                  <div className={`card ${styles.box12}`}>
                    <div className="card-kicker">Business number</div>
                    <div className={styles.box18}>
                      <div className={styles.box19}><i className={`ph ph-whatsapp-logo ${styles.icon1}`} /></div>
                      <div>
                        <div className={styles.box20}>{$v.c?.displayName}</div>
                        <div className={styles.box21}>{$v.phoneFmt}</div>
                      </div>
                    </div>
                    <div className={styles.box22}>
                      {($v.health || []).map((h: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <span className={styles.text3}>{h?.k}</span>
                          <span>{h?.v}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div className={`card ${styles.box23}`}>
                    <div className="card-kicker">Send a test message</div>
                    <div className={styles.box9}>
                      <input className="input" value={$v.testNo} onChange={$v.onTestNo} placeholder="Your mobile" inputMode="tel" />
                      <button className="btn btn-secondary" onClick={$v.sendTest} disabled={$v.notConnected}>Send</button>
                    </div>
                    <div className={styles.box15}>{$v.testMsg}</div>
                  </div>
                  <div className={styles.box24}>
                    Customers only get WhatsApp messages if they opted in on their customer profile. Offers go through Meta-approved templates, and every promotion includes a "Stop promotions" button.
                  </div>
                </aside>
              </div>
            </>
          ) : null}
          {$v.tabTpl ? (
            <>
              <div className={styles.box4}>
                <section className={styles.section2}>
                  <div className={styles.box25}>
                    <span className={styles.text4}>Templates are reviewed by Meta, usually within 24 hours.</span>
                    <button className="btn btn-primary" onClick={$v.newTpl}>
                      <i className="ph ph-plus" />
                      New template
                    </button>
                  </div>
                  {($v.tpls || []).map((t: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <button className={styles.button2} onClick={t?.pick} style={{ boxShadow: t?.ring }}>
                        <div className={styles.box26}>
                          <span className={styles.text5}>{t?.id}</span>
                          <span className={`${t?.catTag ?? ''}`}>{t?.cat}</span>
                          <span className={`${t?.stTag ?? ''}`}>{t?.status}</span>
                          <span className={styles.text6}>{t?.header} header · {t?.lang}</span>
                        </div>
                        <div className={styles.box27}>{t?.body}</div>
                      </button>
                    </React.Fragment>
                  ))}
                </section>
                <aside className={styles.aside2}>
                  {$v.editingTpl ? (
                    <>
                      <div className={`card ${styles.box28}`}>
                        <div className="card-kicker">New template</div>
                        <div className="field">
                          <label>Name (lowercase, underscores)</label>
                          <input className={`input ${styles.text2}`} value={$v.nt?.id} onChange={$v.ntId} placeholder="diwali_offer_2026" />
                        </div>
                        <div className={styles.box29}>
                          <div className="field">
                            <label>Category</label>
                            <select className="input" value={$v.nt?.cat} onChange={$v.ntCat}>
                              <option>Marketing</option>
                              <option>Utility</option>
                            </select>
                          </div>
                          <div className="field">
                            <label>Header</label>
                            <select className="input" value={$v.nt?.header} onChange={$v.ntHeader}>
                              <option>Image</option>
                              <option>Document</option>
                              <option>Text</option>
                              <option>None</option>
                            </select>
                          </div>
                        </div>
                        <div className="field">
                          <label>Body</label>
                          <textarea className={`input ${styles.textarea1}`} value={$v.nt?.body} onChange={$v.ntBody} placeholder={$v.bodyPh} />
                        </div>
                        <div className="field">
                          <label>Button text</label>
                          <input className="input" value={$v.nt?.button} onChange={$v.ntButton} placeholder="Shop now" />
                        </div>
                        <div className={styles.box30}>
                          <button className="btn btn-secondary" onClick={$v.cancelTpl}>Cancel</button>
                          <button className="btn btn-primary" onClick={$v.submitTpl} disabled={$v.ntInvalid}>Submit for review</button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div className={styles.box31}>Preview</div>
                  <div className={styles.box32}>
                    <div className={styles.box33}>
                      <div className={styles.box34}>{$v.storeInitial}</div>
                      <div>
                        <div className={styles.box35}>{$v.c?.displayName}</div>
                        <div className={styles.box36}>Business account</div>
                      </div>
                    </div>
                    <div className={styles.box37}>
                      <div className={styles.box38}>
                        {$v.pv?.isImage ? (
                          <>
                            <div className={styles.box39}>offer image</div>
                          </>
                        ) : null}
                        {$v.pv?.isDoc ? (
                          <>
                            <div className={styles.box40}>
                              <i className={`ph ph-file-pdf ${styles.icon2}`} />
                              <div className={styles.box41}>
                                <div className={styles.box42}>{$v.pv?.doc}</div>
                                <div className={styles.box36}>PDF · 1 page</div>
                              </div>
                            </div>
                          </>
                        ) : null}
                        {$v.pv?.isText ? (
                          <>
                            <div className={styles.box43}>{$v.pv?.headerText}</div>
                          </>
                        ) : null}
                        <div className={styles.box44}>{$v.pv?.body}</div>
                        <div className={styles.box45}>
                          <span>{$v.pv?.footer}</span>
                          <span>2:41 pm</span>
                        </div>
                        {($v.pv?.buttons || []).map((b: any, $index: number) => (
                          <React.Fragment key={$index}>
                            <div className={styles.box46}>{b}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
          {$v.tabCamp ? (
            <>
              <div className={styles.box4}>
                <section className={styles.section1}>
                  <div className={`card ${styles.box6}`}>
                    <div className="card-kicker">New offer campaign</div>
                    <div className={styles.box47}>
                      <div className="field">
                        <label>Campaign name</label>
                        <input className="input" value={$v.cp?.name} onChange={$v.cpName} placeholder="Wedding season preview" />
                      </div>
                      <div className="field">
                        <label>Template</label>
                        <select className="input" value={$v.cp?.tpl} onChange={$v.cpTpl}>
                          {($v.mktTpls || []).map((t: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <option value={t}>{t}</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label>Audience (opted-in customers only)</label>
                      <div className={styles.box48}>
                        {($v.segs || []).map((s: any, $index: number) => (
                          <React.Fragment key={$index}>
                            <button className={styles.button3} onClick={s?.pick} style={{ background: s?.bg, color: s?.color, border: `1px solid ${s?.border ?? ''}` }}>
                              {s?.label} · {s?.n}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className={styles.box49}>
                      {($v.vars || []).map((v: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <div className="field">
                            <label>{v?.label}</label>
                            <input className="input" value={v?.value} onChange={v?.onChange} />
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className={styles.box50}>
                      <div className="field">
                        <label>When</label>
                        <div className="seg">
                          {($v.whens || []).map((w: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <button className={`seg-opt ${styles.button1}`} onClick={w?.pick} style={{ color: w?.color, boxShadow: w?.ring }}>{w?.label}</button>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      {$v.isLater ? (
                        <>
                          <div className="field">
                            <label>Date &amp; time</label>
                            <input className="input" type="datetime-local" value={$v.cp?.at} onChange={$v.cpAt} />
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className={styles.box51}>
                      <div className={styles.box52}>{$v.audienceNote}</div>
                      <button className="btn btn-primary" onClick={$v.launch} disabled={$v.cantLaunch}>
                        <i className="ph ph-paper-plane-tilt" />
                        {$v.launchLabel}
                      </button>
                    </div>
                  </div>
                  <div className={styles.box53}>
                    <table className={`table ${styles.table1}`}>
                      <thead>
                        <tr>
                          <th>Campaign</th>
                          <th>Date</th>
                          <th className={styles.headCell1}>Sent</th>
                          <th className={styles.headCell1}>Delivered</th>
                          <th className={styles.headCell1}>Read</th>
                          <th className={styles.headCell1}>Clicks</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {($v.camps || []).map((k: any, $index: number) => (
                          <React.Fragment key={$index}>
                            <tr>
                              <td>
                                <div>{k?.name}</div>
                                <div className={styles.box54}>{k?.tpl}</div>
                              </td>
                              <td className={styles.cell1}>{k?.date}</td>
                              <td className={styles.headCell1}>{k?.sent}</td>
                              <td className={styles.headCell1}>{k?.del}</td>
                              <td className={styles.headCell1}>{k?.read}</td>
                              <td className={styles.headCell1}>{k?.clicks}</td>
                              <td><span className={`${k?.tag ?? ''}`}>{k?.status}</span></td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <aside className={styles.aside3}>
                  <div className={styles.box31}>Customer sees</div>
                  <div className={styles.box55}>
                    <div className={styles.box56}>
                      <div className={styles.box57}>offer image · 1080 × 1080</div>
                      <div className={styles.box44}>{$v.cpPreview}</div>
                      {($v.cpButtons || []).map((b: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <div className={styles.box46}>{b}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
          {$v.tabLog ? (
            <>
              <div className={styles.box58}>
                <div className={styles.box59}>
                  <i className={`ph ph-magnifying-glass ${styles.text3}`} />
                  <input className={styles.field3} value={$v.lq} onChange={$v.onLq} placeholder="Search customer, mobile or reference" />
                </div>
                <select className={`input ${styles.select1}`} value={$v.lt} onChange={$v.onLt}>
                  <option>All types</option>
                  <option>Invoice</option>
                  <option>Credit note</option>
                  <option>Offer</option>
                  <option>Wish</option>
                  <option>Test</option>
                </select>
              </div>
              <div className={styles.box60}>
                {($v.logStats || []).map((k: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <div className={`card ${styles.box61}`}>
                      <div className={styles.box62}>{k?.k}</div>
                      <div className={styles.box63}>{k?.v}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div className={styles.box53}>
                <table className={`table ${styles.table2}`}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Template</th>
                      <th>Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {($v.logs || []).map((l: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <tr>
                          <td className={styles.cell2}>{l?.time}</td>
                          <td>
                            <div>{l?.name}</div>
                            <div className={styles.box17}>{l?.mobile}</div>
                          </td>
                          <td><span className="tag tag-neutral">{l?.type}</span></td>
                          <td className={styles.cell3}>{l?.tpl}</td>
                          <td className={styles.cell4}>{l?.ref}</td>
                          <td>
                            <span className={styles.text7} style={{ color: l?.color }}>
                              <i className={`${l?.icon ?? ''}`} />
                              {l?.status}
                            </span>
                          </td>
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
      </>
    );
  }
}
