import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrore('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/'); // Se la password è corretta, va alla dashboard
    } catch (error) {
      setErrore('Credenziali non valide. Riprova.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', '--glass-color': '#3b82f6', '--glass-color-glow': 'rgba(59, 130, 246, 0.15)' }}>
        
        <img 
          src="/logo-scuola.png" 
          alt="Logo Alberghiero Nicolosi" 
          style={{ height: '90px', marginBottom: '15px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} 
        />
        
        <h3 style={{ margin: '0 0 5px 0', color: '#9ca3af', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          IPSSAT Rocco Chinnici
        </h3>
        <h1 style={{ margin: '0 0 20px 0', fontSize: '2rem', fontWeight: '800' }}>
          SmartBar Didattico
        </h1>

        {errore && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', width: '100%', boxSizing: 'border-box', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {errore}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Segreteria (es. @ipssatchinnicinicolosi.edu.it)" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px', padding: '12px' }}>
            <LogIn size={20} /> Accedi al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}