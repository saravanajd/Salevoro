import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Login.module.css';

export default class Login extends DCLogic {
  read(k, d) { try { return { ...d, ...(JSON.parse(db.getItem(k)) || {}) }; } catch (e) { return { ...d }; } }
  users = [
    { name: 'Priya Raman', mobile: '9840098400', role: 'Admin', email: 'priya@saanvicouture.in', empId: 'EMP-004' },
    { name: 'Meena K', mobile: '9840022222', role: 'Store Keeper', email: 'meena@saanvicouture.in', empId: 'EMP-017' },
  ];
  store = this.read('sc_store', { name: 'Saanvi Couture', logo: '' });
  state: any = { mobile: '', pw: '', show: false, msg: '', wasOut: db.getItem('sc_session') === 'out', branch: db.getItem('sc_branch') || 'Chennai · T. Nagar' };
  signIn() {
    const m = this.state.mobile.replace(/\D/g, '');
    if (m.length !== 10) return this.setState({ msg: 'Enter your 10-digit mobile number.' });
    if (this.state.pw.length < 4) return this.setState({ msg: 'Enter your password.' });
    const u = this.users.find(x => x.mobile === m);
    if (!u) return this.setState({ msg: 'No staff account with this mobile. Try a demo account below.' });
    const prev = this.read('sc_user', {});
    db.setItem('sc_user', JSON.stringify({ ...(prev.mobile === u.mobile ? prev : {}), ...u, branch: this.state.branch }));
    db.setItem('sc_branch', this.state.branch);
    db.setItem('sc_session', 'in');
    scGo('/' + (u.role === 'Admin' ? 'dashboard' : 'billing'));
  }
  renderVals() {
    const s = this.state, st = this.store;
    return {
      store: { ...st, initial: (st.name || 'S').trim()[0].toUpperCase() }, logoImg: (st.logo) ? React.createElement('img', { src: st.logo, alt: '', style: { width: 52, height: 52, borderRadius: 12, objectFit: 'contain', background: 'var(--color-neutral-100)', padding: 6, boxSizing: 'border-box' } }) : null, hasLogo: !!st.logo, noLogo: !st.logo, wasOut: s.wasOut,
      mobile: s.mobile, onMobile: e => this.setState({ mobile: e.target.value, msg: '' }),
      pw: s.pw, onPw: e => this.setState({ pw: e.target.value, msg: '' }), pwType: s.show ? 'text' : 'password', eye: s.show ? 'ph ph-eye-slash' : 'ph ph-eye', togglePw: () => this.setState({ show: !s.show }),
      onKey: e => { if (e.key === 'Enter') this.signIn(); },
      branch: s.branch, onBranch: e => this.setState({ branch: e.target.value }),
      branches: (st.branches || [{ name: 'Chennai · T. Nagar' }, { name: 'Chennai · Anna Nagar' }, { name: 'Bengaluru · Koramangala' }]).map(b => b.name),
      forgot: e => { e.preventDefault(); this.setState({ msg: 'Ask your store admin to reset your password from Staff settings.' }); },
      hasMsg: !!s.msg, msg: s.msg, signIn: () => this.signIn(),
      demos: this.users.map(u => ({ name: u.name, role: u.role, initials: u.name.split(' ').map(w => w[0]).join(''), pick: () => this.setState({ mobile: u.mobile.replace(/(\d{5})(\d{5})/, '$1 $2'), pw: 'demo1234', msg: '' }) })),
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <div className={styles.box2}>
          <div className={styles.box3}>
            {$v.hasLogo ? (
              <>
                {$v.logoImg}
              </>
            ) : null}
            {$v.noLogo ? (
              <>
                <div className={styles.box4}>{$v.store?.initial}</div>
              </>
            ) : null}
            <div>
              <div className={styles.box5}>{$v.store?.name}</div>
              <div className={styles.box6}>Billing Suite</div>
            </div>
          </div>
          <div className={`card ${styles.box7}`}>
            {$v.wasOut ? (
              <>
                <div className={styles.box8}>
                  <i className="ph ph-check-circle" />
                  You've been signed out.
                </div>
              </>
            ) : null}
            <div>
              <h2 className={styles.title1}>Sign in</h2>
              <div className={styles.box9}>Use your staff mobile number and password.</div>
            </div>
            <div className="field">
              <label>Mobile number</label>
              <input className="input" value={$v.mobile} onChange={$v.onMobile} onKeyDown={$v.onKey} inputMode="tel" placeholder="10-digit mobile" autoFocus={true} />
            </div>
            <div className="field">
              <label>Password</label>
              <div className={styles.box10}>
                <input className={`input ${styles.field1}`} type={$v.pwType} value={$v.pw} onChange={$v.onPw} onKeyDown={$v.onKey} placeholder="••••••••" />
                <button className={styles.button1} onClick={$v.togglePw} title="Show password"><i className={`${$v.eye ?? ''}`} /></button>
              </div>
            </div>
            <div className={styles.box11}>
              <select className={`input ${styles.select1}`} value={$v.branch} onChange={$v.onBranch}>
                {($v.branches || []).map((b: any, $index: number) => (
                  <React.Fragment key={$index}>
                    <option value={b}>{b}</option>
                  </React.Fragment>
                ))}
              </select>
              <A className={styles.link1} href="#" onClick={$v.forgot}>Forgot password?</A>
            </div>
            {$v.hasMsg ? (
              <>
                <div className={styles.box12}>{$v.msg}</div>
              </>
            ) : null}
            <button className={`btn btn-primary ${styles.button2}`} onClick={$v.signIn}>
              <i className="ph ph-sign-in" />
              Sign in
            </button>
          </div>
          <div className={styles.box13}>
            <div className={styles.box14}>Demo accounts · any password</div>
            <div className={styles.box15}>
              {($v.demos || []).map((d: any, $index: number) => (
                <React.Fragment key={$index}>
                  <button className={styles.button3} onClick={d?.pick}>
                    <div className={styles.box16}>{d?.initials}</div>
                    <div className={styles.box17}>
                      <div className={styles.box18}>{d?.name}</div>
                      <div className={styles.box19}>{d?.role}</div>
                    </div>
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }
}
