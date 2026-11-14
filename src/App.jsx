import { useState, useEffect } from 'react';
import { LogOut, Home, CreditCard, History, Coffee, User, BarChart2 } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

// Importazione di tutti i componenti
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import GestioneRicariche from './components/GestioneRicariche';
import StoricoTransazioni from './components/StoricoTransazioni';
import GestioneProdotti from './components/GestioneProdotti';
import NuovaCard from './components/NuovaCard';
import ModificaUtente from './components/ModificaUtente';
import StatusPOS from './components/StatusPOS';
import ReportDashboard from './components/ReportDashboard';

// Componente per proteggere le rotte e applicare il Layout globale
const ProtectedRoute = ({ children, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Ascolta lo stato di autenticazione
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Sistema di Timeout per Inattività (15 minuti)
  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (user) {
        timeoutId = setTimeout(() => {
          signOut(auth);
          alert("Sessione scaduta per inattività. Effettua nuovamente il login per sicurezza.");
        }, 900000); 
      }
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    
    if (user) {
      resetTimer();
      events.forEach(e => window.addEventListener(e, resetTimer));
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', color: '#1f2937' }}>
        Caricamento SmartBar Didattico...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        
        {/* Tutte le rotte protette avvolte automaticamente dal Layout */}
        <Route path="/" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
        <Route path="/ricariche" element={<ProtectedRoute user={user}><GestioneRicariche /></ProtectedRoute>} />
        <Route path="/nuova-card" element={<ProtectedRoute user={user}><NuovaCard /></ProtectedRoute>} />
        <Route path="/modifica-utente" element={<ProtectedRoute user={user}><ModificaUtente /></ProtectedRoute>} />
        <Route path="/storico" element={<ProtectedRoute user={user}><StoricoTransazioni /></ProtectedRoute>} />
        <Route path="/storico/:uid" element={<ProtectedRoute user={user}><StoricoTransazioni /></ProtectedRoute>} />
        <Route path="/prodotti" element={<ProtectedRoute user={user}><GestioneProdotti /></ProtectedRoute>} />
        <Route path="/control-room" element={<ProtectedRoute user={user}><StatusPOS /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute user={user}><ReportDashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}