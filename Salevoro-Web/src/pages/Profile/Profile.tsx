import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Profile.module.css';

export default class Profile extends DCLogic {
  def = { name: 'Priya Raman', email: 'priya@saanvicouture.in', mobile: '9840098400', role: 'Admin', empId: 'EMP-004', branch: 'Chennai · T. Nagar', photo: '', pin: '', printAuto: true, sound: true, dailyMail: true };
  read(k, d) { try { return { ...d, ...(JSON.parse(db.getItem(k)) || {}) }; } catch (e) { return { ...d }; } }
  u0 = this.read('sc_user', this.def);
  componentDidMount() { this.onTheme = () => this.forceUpdate(); window.addEventListener('sc-theme', this.onTheme); }
  componentWillUnmount() { window.removeEventListener('sc-theme', this.onTheme); }
  state: any = { f: { ...this.u0 }, base: JSON.stringify(this.u0), err: '', savedAt: '', pw: { cur: '', next: '', conf: '' }, pwMsg: '' };
  renderVals() {
    const s = this.state, f = s.f;
    const set = k => e => this.setState({ f: { ...f, [k]: e.target.value } });
    const tog = k => () => this.setState({ f: { ...f, [k]: !f[k] } });
    const setPw = k => e => this.setState({ pw: { ...s.pw, [k]: e.target.value }, pwMsg: '' });
    const store = this.read('sc_store', {});
    const T = window.scTheme, th = T ? T.get() : { mode: 'light', accent: 'blue' };
    return {
      brightBilling: th.brightBilling !== false, toggleBright: () => T && T.set({ brightBilling: !(th.brightBilling !== false) }),
      modes: [['dark', 'Dark', 'ph ph-moon'], ['light', 'Light', 'ph ph-sun'], ['system', 'System', 'ph ph-desktop']].map(([k, label, icon]) => ({ label, icon, pick: () => T && T.set({ mode: k }), color: th.mode === k ? 'var(--color-accent)' : 'var(--color-text)', ring: th.mode === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })),
      accents: T ? Object.entries(T.ACCENTS).map(([k, a]) => ({ label: a.label, color: T.swatch(k), pick: () => T.set({ accent: k }), ring: th.accent === k ? '0 0 0 2px var(--color-bg), 0 0 0 4px ' + T.swatch(k) : 'none' })) : [],
      f, initials: f.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), photoImg: (f.photo) ? React.createElement('img', { src: f.photo, alt: '', style: { width: '100%', height: '100%', objectFit: 'cover' } }) : null, hasPhoto: !!f.photo, noPhoto: !f.photo,
      onPhoto: e => { const file = e.target.files && e.target.files[0]; if (!file) return; if (file.size > 400 * 1024) return this.setState({ err: 'Photo must be under 400 KB.' }); const r = new FileReader(); r.onload = () => this.setState({ f: { ...this.state.f, photo: r.result }, err: '' }); r.readAsDataURL(file); e.target.value = ''; },
      removePhoto: () => this.setState({ f: { ...f, photo: '' } }),
      fields: [['name', 'Full name', 'Your name', 'text'], ['mobile', 'Mobile', '10-digit mobile', 'tel'], ['email', 'Email', 'name@store.in', 'email'], ['empId', 'Employee ID', 'EMP-000', 'text']].map(([k, label, ph, mode]) => ({ label, ph, mode, value: f[k], onChange: set(k) })),
      onBranch: set('branch'), branchOpts: (store.branches || [{ name: 'Chennai · T. Nagar' }, { name: 'Chennai · Anna Nagar' }, { name: 'Bengaluru · Koramangala' }]).map(b => b.name),
      togglePrint: tog('printAuto'), toggleSound: tog('sound'), toggleMail: tog('dailyMail'),
      onPin: e => this.setState({ f: { ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) } }),
      hasErr: !!s.err, err: s.err, clean: JSON.stringify(f) === s.base, savedNote: s.savedAt ? 'Saved ' + s.savedAt : '',
      save: () => {
        if (!f.name.trim()) return this.setState({ err: 'Name is required.' });
        if (f.mobile.replace(/\D/g, '').length !== 10) return this.setState({ err: 'Mobile must be 10 digits.' });
        try { db.setItem('sc_user', JSON.stringify(f)); } catch (e) { return this.setState({ err: 'Could not save — try a smaller photo.' }); }
        window.dispatchEvent(new CustomEvent('sc-store'));
        this.setState({ base: JSON.stringify(f), err: '', savedAt: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) });
      },
      pw: s.pw, pwCur: setPw('cur'), pwNext: setPw('next'), pwConf: setPw('conf'), hasPwMsg: !!s.pwMsg, pwMsg: s.pwMsg,
      changePw: () => {
        const p = s.pw;
        const msg = !p.cur ? 'Enter your current password.' : p.next.length < 8 ? 'New password must be at least 8 characters.' : p.next !== p.conf ? 'Passwords do not match.' : '';
        this.setState(msg ? { pwMsg: msg } : { pwMsg: 'Password updated.', pw: { cur: '', next: '', conf: '' } });
      },
      sessions: [['ph ph-desktop', 'POS-TNG-01 · Chrome, Windows', 'Now · T. Nagar'], ['ph ph-device-tablet', 'iPad · Safari', 'Yesterday, 6:12 pm · Anna Nagar'], ['ph ph-desktop', 'Back office · Edge', '16 Nov, 10:04 am · T. Nagar']].map(([icon, device, when]) => ({ icon, device, when })),
      signOut: () => { db.setItem('sc_session', 'out'); let h = window; try { if (window.parent !== window && window.parent.__scShell) h = window.parent; } catch (e) {} scGo('/login'); },
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header className={styles.header1}>
            <div>
              <div className={styles.box2}>Account</div>
              <h1 className={styles.title1}>My profile</h1>
            </div>
            <div className={styles.box3}>
              <span className={styles.text1}>{$v.savedNote}</span>
              <button className="btn btn-primary" onClick={$v.save} disabled={$v.clean}>
                <i className="ph ph-check" />
                Save profile
              </button>
            </div>
          </header>
          <div className={styles.box4}>
            <section className={styles.section1}>
              <div className={`card ${styles.box5}`}>
                <div className={styles.box6}>
                  <div className={styles.box7}>
                    {$v.hasPhoto ? (
                      <>
                        {$v.photoImg}
                      </>
                    ) : null}
                    {$v.noPhoto ? (
                      <>
                        <span>{$v.initials}</span>
                      </>
                    ) : null}
                  </div>
                  <div className={styles.box8}>
                    <div className={styles.box9}>{$v.f?.name}</div>
                    <div className={styles.box10}>
                      <span className={`tag tag-accent ${styles.text2}`}>{$v.f?.role}</span>
                      <span className={`tag tag-neutral ${styles.text2}`}>{$v.f?.empId}</span>
                      <span className={`tag tag-neutral ${styles.text2}`}>{$v.f?.branch}</span>
                    </div>
                  </div>
                  <div className={styles.box11}>
                    <label className={`btn btn-secondary ${styles.label1}`}>
                      <i className="ph ph-camera" />
                      Change photo
                      <input className={styles.field1} type="file" accept="image/*" onChange={$v.onPhoto} />
                    </label>
                    {$v.hasPhoto ? (
                      <>
                        <button className="btn btn-ghost" onClick={$v.removePhoto}>Remove</button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className={`card ${styles.box12}`}>
                <div className="card-kicker">Personal details</div>
                <div className={styles.box13}>
                  {($v.fields || []).map((x: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <div className="field">
                        <label>{x?.label}</label>
                        <input className="input" value={x?.value} onChange={x?.onChange} placeholder={x?.ph} inputMode={x?.mode} />
                      </div>
                    </React.Fragment>
                  ))}
                  <div className="field">
                    <label>Home branch</label>
                    <select className="input" value={$v.f?.branch} onChange={$v.onBranch}>
                      {($v.branchOpts || []).map((b: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <option value={b}>{b}</option>
                        </React.Fragment>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Role (set by admin)</label>
                    <input className={`input ${styles.field2}`} value={$v.f?.role} disabled={true} />
                  </div>
                </div>
                {$v.hasErr ? (
                  <>
                    <div className={styles.box14}>{$v.err}</div>
                  </>
                ) : null}
              </div>
              <div className={`card ${styles.box12}`}>
                <div className="card-kicker">Appearance</div>
                <div className={styles.box15}>
                  <div className="field">
                    <label>Mode</label>
                    <div className="seg">
                      {($v.modes || []).map((m: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <button className={`seg-opt ${styles.button1}`} onClick={m?.pick} style={{ color: m?.color, boxShadow: m?.ring }}>
                            <i className={`${m?.icon ?? ''}`} />
                            {m?.label}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label>Accent colour</label>
                    <div className={styles.box16}>
                      {($v.accents || []).map((a: any, $index: number) => (
                        <React.Fragment key={$index}>
                          <button className={styles.button2} onClick={a?.pick} title={a?.label}>
                            <span className={styles.text3} style={{ background: a?.color, boxShadow: a?.ring }} />
                            {a?.label}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <label className={styles.label2}>
                  <input type="checkbox" checked={$v.brightBilling} onChange={$v.toggleBright} />
                  Always use a bright (light) screen on New bill — easier to read at the counter
                </label>
                <div className={styles.box17}>
                  Applies instantly on this device. Printed invoices always stay black on white.
                </div>
              </div>
              <div className={`card ${styles.box12}`}>
                <div className="card-kicker">Preferences</div>
                <label className={styles.label2}>
                  <input type="checkbox" checked={$v.f?.printAuto} onChange={$v.togglePrint} />
                  Open print dialog automatically after each bill
                </label>
                <label className={styles.label2}>
                  <input type="checkbox" checked={$v.f?.sound} onChange={$v.toggleSound} />
                  Beep on barcode scan
                </label>
                <label className={styles.label2}>
                  <input type="checkbox" checked={$v.f?.dailyMail} onChange={$v.toggleMail} />
                  Email me the daily sales summary
                </label>
              </div>
            </section>
            <aside className={styles.aside1}>
              <div className={`card ${styles.box18}`}>
                <div className="card-kicker">Security</div>
                <div className="field">
                  <label>Current password</label>
                  <input className="input" type="password" value={$v.pw?.cur} onChange={$v.pwCur} />
                </div>
                <div className="field">
                  <label>New password</label>
                  <input className="input" type="password" value={$v.pw?.next} onChange={$v.pwNext} placeholder="At least 8 characters" />
                </div>
                <div className="field">
                  <label>Confirm new password</label>
                  <input className="input" type="password" value={$v.pw?.conf} onChange={$v.pwConf} />
                </div>
                {$v.hasPwMsg ? (
                  <>
                    <div className={styles.box14}>{$v.pwMsg}</div>
                  </>
                ) : null}
                <button className={`btn btn-secondary ${styles.button3}`} onClick={$v.changePw}>
                  <i className="ph ph-key" />
                  Update password
                </button>
                <div className={styles.box19} />
                <div className="field">
                  <label>4-digit POS PIN (quick counter login)</label>
                  <input className={`input ${styles.field3}`} type="password" value={$v.f?.pin} onChange={$v.onPin} inputMode="numeric" maxLength="4" placeholder="••••" />
                </div>
              </div>
              <div className={`card ${styles.box20}`}>
                <div className="card-kicker">Recent sign-ins</div>
                {($v.sessions || []).map((x: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <div className={styles.box21}>
                      <i className={`${x?.icon ?? ''} ${styles.icon1}`} />
                      <div className={styles.box22}>
                        <div>{x?.device}</div>
                        <div className={styles.box23}>{x?.when}</div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                <button className={`btn btn-secondary ${styles.button4}`} onClick={$v.signOut}>
                  <i className="ph ph-sign-out" />
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>
      </>
    );
  }
}
