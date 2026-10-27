// The account sheet: sign in, create an account, forgot password, and (when
// signed in) the account page with the sign-out and delete confirmations.
//
// Built for slow, careful reading: big inputs with visible labels, one
// plain-language message per problem right next to the field, nothing that
// disappears by itself, and no way to submit twice.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Lang } from '../lib/data';
import type { Strings } from '../lib/i18n';
import { emailOk, passwordOk, problemOf, MIN_PASSWORD } from '../lib/cloud/auth';
import { normalizeUsername } from '../lib/cloud/remote';
import { passwordStrength } from '../lib/accountUi';
import { useAccount } from './AccountProvider';
import { SyncLine, VerifyNotice } from './AccountSection';
import { useDialog } from './useDialog';
import { Icon } from './Icon';

export type AccountView = 'signin' | 'signup' | 'forgot' | 'account' | 'signout' | 'delete' | 'password';
/** What happened while the sheet was open (the app reacts, e.g. shows a note). */
export type AccountResult = 'signed-in' | 'signed-out' | 'deleted';

interface Props {
  t: Strings;
  lang: Lang;
  initial: AccountView;
  onClose: (result?: AccountResult) => void;
}

type Screen = AccountView | 'welcome';
type Errors = { email?: string; password?: string; newPassword?: string; username?: string; form?: string };

function GoogleG() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 019.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 000 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className={error ? 'acct-field has-error' : 'acct-field'}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <p className="acct-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="acct-err" id={`${id}-err`} role="alert">
          <Icon name="warning" size={22} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default function AccountSheet({ t, lang, initial, onClose }: Props) {
  const acct = useAccount();
  const [view, setView] = useState<Screen>(initial);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwChanged, setPwChanged] = useState(false);
  const justSignedUp = useRef(false);
  const [username, setUsername] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [sure, setSure] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const busyRef = useRef(false);
  const result = useRef<AccountResult | undefined>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const refs = {
    username: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    sure: useRef<HTMLInputElement>(null),
    newPassword: useRef<HTMLInputElement>(null),
  };
  const heading = useRef<HTMLHeadingElement>(null);

  const close = () => onClose(result.current);
  useDialog(box, close, { locked: busy });

  // Signed-in screens make no sense once signed out (e.g. after Delete).
  const screen: Screen = (view === 'account' || view === 'signout' || view === 'delete' || view === 'password') && !acct.account ? 'signin' : view;

  const go = (v: Screen) => {
    setView(v);
    setErrors({});
    setShowPw(false);
    setResetSent(false);
    setPassword('');
    setNewPassword('');
    setPwChanged(false);
  };

  // Put the cursor where it helps: the first empty field, or the heading.
  useEffect(() => {
    const first = screen === 'signup' ? refs.username.current : screen === 'signin' || screen === 'forgot' ? refs.email.current : screen === 'delete' ? (refs.password.current ?? refs.sure.current) : screen === 'password' ? refs.password.current : null;
    (first ?? heading.current)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // After a failed attempt, go to the first field that needs fixing.
  useEffect(() => {
    const order: (keyof Errors)[] = screen === 'signup' ? ['username', 'email', 'password'] : screen === 'password' ? ['password', 'newPassword'] : ['email', 'password'];
    for (const k of order) {
      if (errors[k]) {
        refs[k as 'email' | 'password' | 'username' | 'newPassword'].current?.focus();
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  const fail = (e: unknown) => {
    const p = problemOf(e);
    const msg = t.authErrors[p];
    if (screen === 'password' && p === 'wrong-password') setErrors({ password: t.acctDeleteWrongPw });
    else if (screen === 'password' && p === 'weak-password') setErrors({ newPassword: msg });
    else if (p === 'invalid-email' || p === 'email-in-use') setErrors({ email: msg });
    else if (p === 'weak-password') setErrors({ password: msg });
    else if (p === 'username-taken' || p === 'username-invalid') setErrors({ username: msg });
    else if (screen === 'delete' && p === 'wrong-password') setErrors({ password: t.acctDeleteWrongPw });
    else setErrors({ form: msg });
  };

  /** Run one action: no double submits, one place for errors. */
  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setErrors({});
    try {
      await action();
    } catch (e) {
      fail(e);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const signedIn = () => {
    result.current = 'signed-in';
    setView('welcome');
  };

  const submitSignIn = (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!emailOk(email)) errs.email = t.authErrors['invalid-email'];
    if (!password) errs.password = t.acctEnterPassword;
    if (errs.email || errs.password) return setErrors(errs);
    void run(async () => {
      await acct.signIn(email, password);
      signedIn();
    });
  };

  const submitSignUp = (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!normalizeUsername(username)) errs.username = t.authErrors['username-invalid'];
    if (!emailOk(email)) errs.email = t.authErrors['invalid-email'];
    if (!passwordOk(password)) errs.password = t.authErrors['weak-password'];
    if (errs.username || errs.email || errs.password) return setErrors(errs);
    void run(async () => {
      await acct.signUp(email, password, username);
      justSignedUp.current = true;
      signedIn();
    });
  };

  const submitForgot = (e: FormEvent) => {
    e.preventDefault();
    if (!emailOk(email)) return setErrors({ email: t.authErrors['invalid-email'] });
    void run(async () => {
      await acct.sendPasswordReset(email);
      setResetSent(true); // the same words whether or not an account exists
    });
  };

  const google = () =>
    void run(async () => {
      await acct.signInWithGoogle();
      signedIn();
    });

  const submitChangePw = (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!password) errs.password = t.acctEnterPassword;
    if (!passwordOk(newPassword)) errs.newPassword = t.authErrors['weak-password'];
    if (errs.password || errs.newPassword) return setErrors(errs);
    void run(async () => {
      await acct.changePassword(password, newPassword);
      setPassword('');
      setNewPassword('');
      setPwChanged(true);
    });
  };

  const confirmSignOut = () =>
    void run(async () => {
      await acct.signOut();
      onClose('signed-out');
    });

  const confirmDelete = (e: FormEvent) => {
    e.preventDefault();
    const needsPw = acct.account?.provider === 'password';
    const errs: Errors = {};
    if (needsPw && !password) errs.password = t.acctEnterPassword;
    if (!sure) errs.form = t.acctDeleteNeedCheck;
    if (errs.password || errs.form) {
      setErrors(errs);
      if (!errs.password) refs.sure.current?.focus();
      return;
    }
    void run(async () => {
      await acct.deleteAccount(needsPw ? password : undefined);
      onClose('deleted');
    });
  };

  const titles: Record<Screen, string> = {
    signin: t.acctSignIn,
    signup: t.acctCreate,
    forgot: t.acctForgot,
    account: t.acctTitle,
    signout: t.acctSignOutTitle,
    delete: t.acctDeleteTitle,
    password: t.acctChangePw,
    welcome: acct.account?.name || acct.account?.email ? t.acctWelcome(acct.account.name ?? acct.account.email ?? '') : t.acctSignedIn,
  };

  const emailField = (autoComplete: string) => (
    <Field id="acct-email" label={t.acctEmail} error={errors.email}>
      <input
        ref={refs.email}
        id="acct-email"
        type="email"
        inputMode="email"
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        onChange={e => setEmail(e.target.value)}
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? 'acct-email-err' : undefined}
        disabled={busy}
      />
    </Field>
  );

  const passwordField = (mode: 'current' | 'new', label: string = t.acctPassword) => {
    const level = passwordStrength(password);
    return (
      <Field
        id="acct-password"
        label={label}
        error={errors.password}
        hint={
          mode === 'new' ? (
            <>
              {t.acctPasswordHelp(MIN_PASSWORD)}
              {password && (
                <span className="acct-strength" data-level={level} aria-live="polite">
                  <span className="acct-bars" aria-hidden="true">
                    <i /><i /><i /><i />
                  </span>
                  {t.acctStrengthLabel}: {t.acctStrength[level]}
                </span>
              )}
            </>
          ) : undefined
        }
      >
        <div className="acct-pw">
          <input
            ref={refs.password}
            id="acct-password"
            type={showPw ? 'text' : 'password'}
            autoComplete={mode === 'new' ? 'new-password' : 'current-password'}
            autoCapitalize="none"
            spellCheck={false}
            value={password}
            onChange={e => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={[mode === 'new' ? 'acct-password-hint' : '', errors.password ? 'acct-password-err' : ''].filter(Boolean).join(' ') || undefined}
            disabled={busy}
          />
          <button type="button" className="acct-eye" aria-label={showPw ? t.acctHidePw : t.acctShowPw} title={showPw ? t.acctHidePw : t.acctShowPw} onClick={() => setShowPw(s => !s)}>
            <Icon name={showPw ? 'eyeOff' : 'eye'} size={28} />
          </button>
        </div>
      </Field>
    );
  };

  const formError = errors.form && (
    <p className="acct-err acct-form-err" role="alert">
      <Icon name="warning" size={22} />
      <span>{errors.form}</span>
    </p>
  );

  const submit = (label: string) => (
    <button className="btn primary big acct-submit" type="submit" disabled={busy}>
      {busy ? t.acctWorking : label}
    </button>
  );

  const googleBlock = (
    <>
      <button type="button" className="btn big acct-google" onClick={google} disabled={busy}>
        <GoogleG />
        {t.acctGoogle}
      </button>
      <p className="acct-or" aria-hidden="true">
        <span>{t.acctOr}</span>
      </p>
    </>
  );

  const name = acct.account?.name || acct.account?.email || '';

  return (
    <div className="acct-backdrop" onClick={() => !busy && close()}>
      <div ref={box} className="acct-sheet" role="dialog" aria-modal="true" aria-labelledby="acct-title" onClick={e => e.stopPropagation()}>
        <button className="acct-close" aria-label={t.close} onClick={close} disabled={busy && screen === 'delete'}>
          <Icon name="close" size={28} />
        </button>
        <h2 id="acct-title" ref={heading} tabIndex={-1}>
          {titles[screen]}
        </h2>

        {screen === 'signin' && (
          <form onSubmit={submitSignIn} noValidate>
            {googleBlock}
            {emailField('email')}
            {passwordField('current')}
            {formError}
            {submit(t.acctSignIn)}
            <div className="acct-links">
              <button type="button" className="acct-link" onClick={() => go('forgot')}>
                {t.acctForgot}
              </button>
              <button type="button" className="acct-link" onClick={() => go('signup')}>
                {t.acctCreate}
              </button>
            </div>
          </form>
        )}

        {screen === 'signup' && (
          <form onSubmit={submitSignUp} noValidate>
            {googleBlock}
            <Field id="acct-username" label={t.acctUsername} error={errors.username} hint={t.acctUsernameHelp}>
              <input
                ref={refs.username}
                id="acct-username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={20}
                value={username}
                onChange={e => setUsername(e.target.value)}
                aria-invalid={!!errors.username}
                aria-describedby={['acct-username-hint', errors.username ? 'acct-username-err' : ''].filter(Boolean).join(' ')}
                disabled={busy}
              />
            </Field>
            {emailField('email')}
            {passwordField('new')}
            {formError}
            {submit(t.acctCreate)}
            <p className="acct-switch">
              {t.acctHaveAlready}{' '}
              <button type="button" className="acct-link" onClick={() => go('signin')}>
                {t.acctSignIn}
              </button>
            </p>
          </form>
        )}

        {screen === 'forgot' && (
          <form onSubmit={submitForgot} noValidate>
            <p>{t.acctForgotBody}</p>
            {emailField('email')}
            {formError}
            {resetSent && (
              <p className="notice good acct-sent" role="status">
                {t.acctResetSent}
              </p>
            )}
            {submit(t.acctSendLink)}
            <div className="acct-links">
              <button type="button" className="acct-link" onClick={() => go('signin')}>
                {t.acctBackToSignIn}
              </button>
            </div>
          </form>
        )}

        {screen === 'welcome' && (
          <div className="acct-welcome">
            {!acct.account && <p role="status">{t.acctWorking}</p>}
            {justSignedUp.current && acct.account?.email && (
              <p className="notice acct-verify-sent" role="status">
                <Icon name="check" size={24} />
                <span>{t.acctVerifyBody(acct.account.email)}</span>
              </p>
            )}
            {acct.linkResult === 'merged' && (
              <p className="notice good" role="status">
                {t.acctLinkMerged}
              </p>
            )}
            {acct.linkResult === 'switched' && (
              <p className="notice good" role="status">
                {t.acctLinkSwitched(name)}
              </p>
            )}
            <button className="btn primary big acct-submit" onClick={close}>
              {t.acctContinue}
            </button>
          </div>
        )}

        {screen === 'account' && acct.account && (
          <div className="acct-manage">
            <p className="acct-who">
              <Icon name="person" size={28} />
              <span>
                <strong>{acct.account.name ?? acct.account.email}</strong>
                {acct.account.name && acct.account.email && <span className="muted"> {acct.account.email}</span>}
              </span>
            </p>
            <VerifyNotice t={t} />
            <SyncLine t={t} lang={lang} />
            <div className="acct-actions">
              {acct.account.provider === 'password' && (
                <button className="btn" onClick={() => go('password')}>
                  {t.acctChangePw}
                </button>
              )}
              <button className="btn" onClick={() => go('signout')}>
                <Icon name="back" size={24} />
                {t.acctSignOut}
              </button>
              <button className="btn quiet" onClick={() => go('delete')}>
                {t.acctDelete}
              </button>
            </div>
          </div>
        )}

        {screen === 'password' && (
          <form onSubmit={submitChangePw} noValidate>
            {pwChanged ? (
              <>
                <p className="notice good" role="status">
                  {t.acctPwChanged}
                </p>
                <button type="button" className="btn primary big acct-submit" onClick={() => go('account')}>
                  {t.acctContinue}
                </button>
              </>
            ) : (
              <>
                <Field id="acct-password" label={t.acctCurrentPw} error={errors.password}>
                  <div className="acct-pw">
                    <input
                      ref={refs.password}
                      id="acct-password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'acct-password-err' : undefined}
                      disabled={busy}
                    />
                    <button type="button" className="acct-eye" aria-label={showPw ? t.acctHidePw : t.acctShowPw} title={showPw ? t.acctHidePw : t.acctShowPw} onClick={() => setShowPw(s => !s)}>
                      <Icon name={showPw ? 'eyeOff' : 'eye'} size={28} />
                    </button>
                  </div>
                </Field>
                <Field
                  id="acct-newpw"
                  label={t.acctNewPw}
                  error={errors.newPassword}
                  hint={
                    <>
                      {t.acctPasswordHelp(MIN_PASSWORD)}
                      {newPassword && (
                        <span className="acct-strength" data-level={passwordStrength(newPassword)} aria-live="polite">
                          <span className="acct-bars" aria-hidden="true">
                            <i /><i /><i /><i />
                          </span>
                          {t.acctStrengthLabel}: {t.acctStrength[passwordStrength(newPassword)]}
                        </span>
                      )}
                    </>
                  }
                >
                  <input
                    ref={refs.newPassword}
                    id="acct-newpw"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    aria-invalid={!!errors.newPassword}
                    aria-describedby={['acct-newpw-hint', errors.newPassword ? 'acct-newpw-err' : ''].filter(Boolean).join(' ')}
                    disabled={busy}
                  />
                </Field>
                {formError}
                {submit(t.acctChangePw)}
                <div className="acct-links">
                  <button type="button" className="acct-link" onClick={() => go('account')}>
                    {t.acctCancel}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {screen === 'signout' && (
          <div className="acct-confirm">
            <p>{t.acctSignOutBody}</p>
            {(acct.status === 'error' || acct.status === 'offline') && (
              <div className="notice acct-unsaved" role="alert">
                <Icon name="warning" size={24} />
                <span>{t.acctSignOutUnsaved}</span>
                <button className="btn" onClick={() => void acct.syncNow()}>
                  <Icon name="refresh" size={22} />
                  {t.acctTryAgain}
                </button>
              </div>
            )}
            {formError}
            <div className="acct-actions">
              <button className="btn primary big" onClick={confirmSignOut} disabled={busy}>
                {busy ? t.acctWorking : t.acctSignOutYes}
              </button>
              <button className="btn big" onClick={() => go('account')} disabled={busy}>
                {t.acctCancel}
              </button>
            </div>
          </div>
        )}

        {screen === 'delete' && (
          <form className="acct-confirm" onSubmit={confirmDelete} noValidate>
            <p className="notice acct-danger">
              <Icon name="warning" size={24} />
              <span>{t.acctDeleteBody}</span>
            </p>
            <label className="check acct-sure">
              <input ref={refs.sure} type="checkbox" checked={sure} onChange={e => setSure(e.target.checked)} disabled={busy} />
              <span>{t.acctDeleteCheck}</span>
            </label>
            {acct.account?.provider === 'password' ? (
              <Field id="acct-password" label={t.acctDeletePw} hint={t.acctDeletePwHelp} error={errors.password}>
                <div className="acct-pw">
                  <input
                    ref={refs.password}
                    id="acct-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={['acct-password-hint', errors.password ? 'acct-password-err' : ''].filter(Boolean).join(' ')}
                    disabled={busy}
                  />
                  <button type="button" className="acct-eye" aria-label={showPw ? t.acctHidePw : t.acctShowPw} title={showPw ? t.acctHidePw : t.acctShowPw} onClick={() => setShowPw(s => !s)}>
                    <Icon name={showPw ? 'eyeOff' : 'eye'} size={28} />
                  </button>
                </div>
              </Field>
            ) : (
              <p className="muted">{t.acctDeleteGoogle}</p>
            )}
            {formError}
            <div className="acct-actions">
              <button type="button" className="btn primary big" onClick={() => go('account')} disabled={busy}>
                {t.acctCancel}
              </button>
              <button type="submit" className="btn big danger" disabled={busy}>
                <Icon name="trash" size={24} />
                {busy ? t.acctWorking : t.acctDeleteYes}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
