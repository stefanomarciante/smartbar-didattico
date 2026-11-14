import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Home, CreditCard, History, Coffee, User, BarChart2, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Stato per l'Hamburger Menu su mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  // Chiude il menu quando si clicca un link su smartphone
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Componente interno per i bottoni del menu
  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname.startsWith(to) && to !== '/' || (to === '/' && isDashboard);
    return (
      <Link 
        to={to} 
        onClick={closeMobileMenu}
        className="nav-item"
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', 
          padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.95rem',
          background: isActive ? '#e0f2fe' : 'transparent',
          color: isActive ? '#0284c7' : '#6b7280',
          transition: 'all 0.2s'
        }}
      >
        <Icon size={18} /> {label}
      </Link>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      
      {/* INIEZIONE STILI CSS PER IL MENU */}
      <style>{`
        .nav-item:hover { color: #374151 !important; }
        
        .mobile-toggle-btn { display: none; background: transparent; border: none; color: #0284c7; cursor: pointer; padding: 5px; }

        /* LAYOUT DESKTOP */
        .menu-wrapper {
          display: flex;
          flex: 1;
          align-items: center;
          justify-content: space-between;
          margin-left: 20px;
        }
        
        /* Se siamo in dashboard, spinge i pulsanti profilo a destra */
        .menu-wrapper.dashboard-mode {
          justify-content: flex-end;
        }

        .center-nav { display: flex; gap: 5px; margin: 0 auto; }
        .header-actions { display: flex; align-items: center; gap: 20px; }

        /* LAYOUT SMARTPHONE (Sotto gli 850px) */
        @media (max-width: 850px) {
          .topbar { padding: 0 15px !important; height: 65px !important; }
          .logo-img { height: 35px !important; }
          .logo-title h1 { font-size: 1.1rem !important; }
          .logo-title p { font-size: 0.6rem !important; }

          /* Mostriamo il bottone Hamburger */
          .mobile-toggle-btn { display: block; margin-left: auto; }

          /* Trasformiamo il wrapper in un contenitore a tutto schermo a comparsa */
          .menu-wrapper {
            display: none;
            flex-direction: column;
            position: fixed; /* Fixed blocca il menu sullo schermo senza farlo scorrere */
            top: 65px;
            left: 0;
            width: 100%;
            height: calc(100vh - 65px);
            background: white;
            z-index: 45;
            padding: 20px 20px 40px 20px;
            box-sizing: border-box;
          }
          
          /* Quando l'hamburger viene cliccato */
          .menu-wrapper.open { display: flex; }

          /* Incolonniamo i tasti di navigazione in alto */
          .center-nav {
            flex-direction: column;
            width: 100%;
            margin: 0;
          }
          .center-nav .nav-item {
            width: 100%;
            padding: 15px !important;
            font-size: 1.1rem !important;
            background: #f8fafc !important;
            border-radius: 10px;
            margin-bottom: 8px;
          }
          .center-nav .nav-item:active { background: #e0f2fe !important; }

          /* Incolonniamo le azioni utente in basso (Comportamento Footer) */
          .header-actions {
            flex-direction: column;
            width: 100%;
            margin-top: auto; /* Questo comando spinge magicamente il blocco verso il fondo! */
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            gap: 15px;
          }
          .header-actions > div, .header-actions > button {
            width: 100%;
          }
        }
      `}</style>

      {/* Topbar */}
      <header className="topbar" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 25px', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        
        {/* Logo e Titolo (Sinistra) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => { navigate('/'); closeMobileMenu(); }}>
          <img src="/logo-scuola.png" alt="Logo Istituto" className="logo-img" style={{ height: '50px' }} />
          <div className="logo-title">
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280', fontWeight: '700', letterSpacing: '1px' }}>IPSSAT ROCCO CHINNICI</p>
            <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#0284c7', fontWeight: '800' }}>SmartBar Didattico</h1>
          </div>
        </div>

        {/* Pulsante Hamburger (Mobile) */}
        <button 
          className="mobile-toggle-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* 
          WRAPPER DINAMICO:
          Su Desktop: Dispone Navigazione al centro e Profilo a destra.
          Su Smartphone: Diventa una tendina verticale con Nav in alto e Profilo in basso.
        */}
        <div className={`menu-wrapper ${isMobileMenuOpen ? 'open' : ''} ${isDashboard ? 'dashboard-mode' : ''}`}>
          
          {/* Menu Navigazione Centrale */}
          {!isDashboard && (
            <nav className="center-nav">
              <NavItem to="/" icon={Home} label="Dashboard" />
              <NavItem to="/ricariche" icon={CreditCard} label="Ricariche" />
              <NavItem to="/storico" icon={History} label="Storico" />
              <NavItem to="/prodotti" icon={Coffee} label="Prodotti" />
              <NavItem to="/report" icon={BarChart2} label="Report" />
            </nav>
          )}

          {/* Badge Utente e Tasto Logout (Footer su Mobile) */}
          <div className="header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '6px 14px', borderRadius: '30px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
              <div style={{ background: '#e0f2fe', padding: '6px', borderRadius: '50%', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Sessione Attiva</span>
                <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '600', wordBreak: 'break-all' }}>{utenteLoggato}</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
              onMouseOut={(e) => e.currentTarget.style.background = '#fef2f2'}
            >
              <LogOut size={18} /> Esci
            </button>
          </div>
        </div>

      </header>

      {/* Contenuto Principale delle Pagine */}
      <main style={{ flex: 1, padding: '20px 15px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}