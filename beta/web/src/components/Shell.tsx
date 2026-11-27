import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { USING_PLACEHOLDER_DATA } from '../data';
import { looksLikeDoi, normalizeDoi } from '../lib/doi';
import { useTheme } from '../lib/theme';

/** Link back to the current (non-beta) Lighthouse site. */
const CLASSIC_URL = import.meta.env.VITE_CLASSIC_URL ?? 'http://localhost:8080/';

export function DoiForm({ size = 'small', autoFocus = false }: { size?: 'small' | 'large'; autoFocus?: boolean }) {
  const nav = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) { setError('Enter a DOI, for example 10.5555/lhb.2012.0417.'); return; }
    if (!looksLikeDoi(value)) { setError('That does not look like a DOI. A DOI starts with "10." followed by a slash, e.g. 10.5555/lhb.2012.0417.'); return; }
    setError('');
    nav(`/paper/${normalizeDoi(value)}`);
  };
  const errId = `doi-err-${size}`;
  return (
    <form className={`doi-form doi-${size}`} onSubmit={submit} role="search" noValidate>
      <label htmlFor={`doi-${size}`} className={size === 'small' ? 'visually-hidden' : 'doi-label'}>DOI</label>
      <div className="doi-row">
        <svg className="doi-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" /></svg>
        <input id={`doi-${size}`} value={value} onChange={e => { setValue(e.target.value); if (error) setError(''); }}
          placeholder={size === 'large' ? 'Paste a DOI, e.g. 10.5555/lhb.2010.0093' : 'Look up a DOI…'}
          autoComplete="off" spellCheck={false} autoFocus={autoFocus}
          aria-invalid={!!error} aria-describedby={error ? errId : undefined} />
        <button type="submit">{size === 'large' ? 'Check paper' : 'Go'}</button>
      </div>
      {error && <p id={errId} className="field-error" role="alert">{error}</p>}
    </form>
  );
}

export function Shell({ children, search = true }: { children: ReactNode; search?: boolean }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Lighthouse Beta home">
          <img src="/logo.svg" alt="FORRT" height={22} />
          <span className="brand-div" aria-hidden="true" />
          <span className="brand-name">Lighthouse</span>
          <span className="beta-tag">Beta</span>
        </Link>
        {search && <div className="topbar-search"><DoiForm /></div>}
        <nav className="topbar-nav" aria-label="Site">
          <Link to="/explore" className="nav-link">Explore</Link>
          <Link to="/institutions" className="nav-link">Institutions</Link>
          <a href={CLASSIC_URL} className="nav-link">Current site</a>
          <button type="button" className="theme-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark'
              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" fill="currentColor" /></svg>
              : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor" /><g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="8" y1="1" x2="8" y2="2.5" /><line x1="8" y1="13.5" x2="8" y2="15" /><line x1="1" y1="8" x2="2.5" y2="8" /><line x1="13.5" y1="8" x2="15" y2="8" /><line x1="3.1" y1="3.1" x2="4.2" y2="4.2" /><line x1="11.8" y1="11.8" x2="12.9" y2="12.9" /><line x1="12.9" y1="3.1" x2="11.8" y2="4.2" /><line x1="4.2" y1="11.8" x2="3.1" y2="12.9" /></g></svg>}
          </button>
        </nav>
      </header>
      {USING_PLACEHOLDER_DATA && (
        <div className="sample-banner" role="note">
          <b>Sample data.</b> Every paper, person, institution and number in this beta is invented for design work. Data sources are still being decided.
        </div>
      )}
      <main id="main" tabIndex={-1}>{children}</main>
      <footer className="footer">
        <span>FORRT · Framework for Open and Reproducible Research Training</span>
        <span>Lighthouse Beta · trust model is a draft for discussion</span>
      </footer>
    </div>
  );
}
