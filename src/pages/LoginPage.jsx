import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const credentials = registering
        ? form
        : { username: form.username, password: form.password };
      await login(credentials, registering);
      navigate(location.state?.from || '/discover', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-intro">
        <p className="eyebrow">A library that feels like yours</p>
        <h1>Make room for a <em>new story.</em></h1>
        <p>Join MaktabaLink to keep your favorite reads close and make more of every library visit.</p>
        <div className="auth-quote">
          <span aria-hidden="true">“</span>
          <p>Every shelf holds a doorway to somewhere new.</p>
          <small>A thought for curious minds</small>
        </div>
      </div>
      <div className="auth-form-panel">
        <p className="eyebrow">{registering ? 'Start your membership' : 'Welcome to MaktabaLink'}</p>
        <h2>{registering ? 'Create your account' : 'Welcome back'}</h2>
        <p className="muted">{registering ? 'A world of reading is just around the corner.' : 'Sign in to pick up where you left off.'}</p>
        <form className="stack" onSubmit={submit}>
          <label>
            Username
            <input autoComplete="username" name="username" onChange={updateField} required value={form.username} />
          </label>
          {registering && (
            <label>
              Email
              <input autoComplete="email" name="email" onChange={updateField} required type="email" value={form.email} />
            </label>
          )}
          <label>
            Password
            <input
              autoComplete={registering ? 'new-password' : 'current-password'}
              minLength={registering ? 10 : undefined}
              name="password"
              onChange={updateField}
              required
              type="password"
              value={form.password}
            />
          </label>
          {error && <p className="notice error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" disabled={saving} type="submit">
            {saving ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <button className="text-button" onClick={() => { setRegistering(!registering); setError(''); }} type="button">
          {registering ? 'Already have an account? Sign in' : 'New to MaktabaLink? Join free'}
        </button>
      </div>
    </section>
  );
}
