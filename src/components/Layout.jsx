import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Home, CreditCard, History, Coffee, User, BarChart2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Controlla se siamo sulla Dashboard principale
  const isDashboard = location.pathname === '/';
  
  // Recupera l'email dell'utente loggato in Firebase
  const utenteLoggato = auth.currentUser?.email || 'Amministratore';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Errore durante il logout", error);
    }
  };

  // Componente interno per i bottoni del menu (gestisce lo stile attivo/inattivo)
  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname.startsWith(to) && to !== '/' || (to === '/' && isDashboard);
    return (
      <Link 
        to={to} 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', 
          padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.95rem',
          background: isActive ? '#e0f2fe' : 'transparent',
          color: isActive ? '#0284c7' : '#6b7280',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => !isActive && (e.currentTarget.style.color = '#374151')}
        onMouseOut={(e) => !isActive && (e.currentTarget.style.color = '#6b7280')}
      >
        <Icon size={18} /> {label}
      </Link>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      
      {/* Topbar */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 25px', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        
        {/* Logo e Titolo (Sinistra) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo-scuola.png" alt="Logo Istituto" style={{ height: '50px' }} />
          <div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280', fontWeight: '700', letterSpacing: '1px' }}>IPSSAT ROCCO CHINNICI</p>
            <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#0284c7', fontWeight: '800' }}>SmartBar Didattico</h1>
          </div>
        </div>

        {/* Menu Navigazione Centrale (Renderizzato SOLO se NON siamo nella Dashboard) */}
        {!isDashboard && (
          <nav style={{ display: 'flex', gap: '5px', animation: 'fadeIn 0.3s ease' }}>
            <NavItem to="/" icon={Home} label="Dashboard" />
            <NavItem to="/ricariche" icon={CreditCard} label="Ricariche" />
            <NavItem to="/storico" icon={History} label="Storico" />
            <NavItem to="/prodotti" icon={Coffee} label="Prodotti" />
            <NavItem to="/report" icon={BarChart2} label="Report" />
          </nav>
        )}

        {/* Utente e Tasto Logout (Destra) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {/* Badge Utente Loggato */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '6px 14px', borderRadius: '30px', border: '1px solid #e2e8f0' }}>
            <div style={{ background: '#e0f2fe', padding: '6px', borderRadius: '50%', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Sessione Attiva</span>
              <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>{utenteLoggato}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fef2f2'}
          >
            <LogOut size={18} /> Esci
          </button>
        </div>
      </header>

      {/* Contenuto Principale delle Pagine */}
      <main style={{ flex: 1, padding: '30px 20px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}