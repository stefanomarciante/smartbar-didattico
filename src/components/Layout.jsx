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

  // Funzione per chiudere il menu mobile quando si clicca un link
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
      
      {/* 
        INIEZIONE STILI RESPONSIVE 
        Queste regole CSS scattano automaticamente quando lo schermo scende sotto gli 850px (tablet/smartphone).
      */}
      <style>{`
        /* Stile Hover generico per i NavItem */
        .nav-item:hover { color: #374151 !important; }
        
        /* Contenitore Profilo + Bottone Esci (Destra) */
        .header-actions { display: flex; align-items: center; gap: 20px; }
        
        /* Nascondiamo l'hamburger di base sui monitor grandi */
        .mobile-toggle-btn { display: none; background: transparent; border: none; color: #0284c7; cursor: pointer; padding: 5px; }

        @media (max-width: 850px) {
          /* Riduciamo l'altezza della topbar e sistemiamo il logo */
          .topbar { padding: 0 15px !important; height: 65px !important; }
          .logo-img { height: 35px !important; }
          .logo-title h1 { font-size: 1.1rem !important; }
          .logo-title p { font-size: 0.6rem !important; }

          /* Mostriamo l'hamburger */
          .mobile-toggle-btn { display: block; margin-left: auto; }

          /* Nascondiamo di base il menu centrale e le azioni di destra (profilo e logout) */
          .center-nav, .header-actions { display: none !important; }

          /* SE L'HAMBURGER È APERTO: Mostriamo tutto in verticale sovrapposto allo schermo */
          .mobile-menu-active .center-nav {
            display: flex !important;
            flex-direction: column;
            position: absolute;
            top: 65px;
            left: 0;
            width: 100%;
            background: white;
            padding: 15px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            border-bottom: 1px solid #e5e7eb;
            box-sizing: border-box;
            z-index: 45;
          }
          
          /* Spingiamo il logout dentro la tendina mobile e allarghiamo i pulsanti */
          .mobile-menu-active .nav-item { width: 100%; padding: 12px 15px !important; }
          .mobile-menu-active .header-actions { 
            display: flex !important; 
            flex-direction: column; 
            width: 100%; 
            padding: 15px; 
            position: absolute; 
            top: auto; 
            margin-top: 150px; 
            background: white; 
            box-sizing: border-box; 
            z-index: 46; 
          }
        }
      `}</style>

      {/* Topbar (L'aggiunta di className="mobile-menu-active" attiva la tendina su smartphone) */}
      <header className={`topbar ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`} style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 25px', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        
        {/* Logo e Titolo (Sinistra) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => { navigate('/'); closeMobileMenu(); }}>
          <img src="/logo-scuola.png" alt="Logo Istituto" className="logo-img" style={{ height: '50px' }} />
          <div className="logo-title">
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280', fontWeight: '700', letterSpacing: '1px' }}>IPSSAT ROCCO CHINNICI</p>
            <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#0284c7', fontWeight: '800' }}>SmartBar Didattico</h1>
          </div>
        </div>

        {/* Pulsante Hamburger (Visibile solo sotto 850px) */}
        <button 
          className="mobile-toggle-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Menu Navigazione Centrale (Nascosto su Dashboard, e trasformato in tendina su smartphone se aperto) */}
        {!isDashboard && (
          <nav className="center-nav" style={{ display: 'flex', gap: '5px' }}>
            <NavItem to="/" icon={Home} label="Dashboard" />
            <NavItem to="/ricariche" icon={CreditCard} label="Ricariche" />
            <NavItem to="/storico" icon={History} label="Storico" />
            <NavItem to="/prodotti" icon={Coffee} label="Prodotti" />
            <NavItem to="/report" icon={BarChart2} label="Report" />
          </nav>
        )}

        {/* Utente e Tasto Logout (Destra. Su Smartphone finiscono in fondo al menu a tendina) */}
        <div className="header-actions">
          
          {/* Badge Utente Loggato */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '6px 14px', borderRadius: '30px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', width: '100%' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fef2f2'}
          >
            <LogOut size={18} /> Esci
          </button>
        </div>
      </header>

      {/* Contenuto Principale delle Pagine */}
      <main style={{ flex: 1, padding: '20px 15px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}