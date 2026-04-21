import { useState } from 'react';
import { supabase } from '../supabase';
import { Stethoscope, Activity } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session == null) {
          setError("Check your email for the confirmation link.");
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container card" style={{ padding: 0 }}>
        {/* Left Side */}
        <div className="auth-left">
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '50%', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <Stethoscope size={60} color="var(--primary)" strokeWidth={1.5} />
          </div>
          <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '1.5rem' }}>Speech Clarity Analyser</h2>
          <p style={{ opacity: 0.9, lineHeight: 1.6, fontSize: '1.1rem' }}>
            A powerful medical-grade tool to monitor and track your speech clarity journey with precision and care.
          </p>
          <div style={{ marginTop: '3rem', width: '150px', height: '150px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', position: 'relative' }}>
             <Activity size={80} color="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
        </div>

        {/* Right Side */}
        <div className="auth-right">
          <header className="mb-6">
            <h1 style={{ fontSize: '1.75rem' }}>{isLogin ? 'Welcome' : 'Create Account'}</h1>
            <p className="text-muted">{isLogin ? 'Please enter your login details' : 'Start your clarity monitoring journey'}</p>
          </header>

          <form onSubmit={handleAuth}>
            <div className="auth-input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="example@email.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="auth-input-group mb-6">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            {error && <p className="error-msg mb-4">{error}</p>}
            
            <button type="submit" disabled={loading} style={{ width: '100%', height: '54px', fontSize: '1.1rem' }}>
              {loading ? <div className="spinner" style={{ borderTopColor: 'white' }}></div> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button" 
                className="secondary" 
                style={{ padding: '0 0.5rem', border: 'none', color: 'var(--primary)', fontWeight: 800, background: 'transparent' }}
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
