import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { History, Search, MapPin, Filter, TrendingUp, Coffee, CreditCard } from 'lucide-react';

export default function StoricoTransazioni() {
  const [transazioni, setTransazioni] = useState([]);
  const [filtrate, setFiltrate] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ricercaNome, setRicercaNome] = useState('');
  const [filtroPlesso, setFiltroPlesso] = useState('Tutti');
  const [filtroTipo, setFiltroTipo] = useState('Tutti');

  const plessi = ['Tutti', 'Nicolosi', 'Santa Maria di Licodia', 'Pedara', 'Trecastagni', 'Paternò'];

  const fetchStorico = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "transazioni"), orderBy("data", "desc"), limit(1000));
      const snapshot = await getDocs(q);
      
      const lista = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataFormattata: data.data?.toDate 
            ? data.data.toDate().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })
            : data.date_str || 'Data non disponibile'
        };
      });
      setTransazioni(lista);
      setFiltrate(lista);
    } catch (error) {
      try {
        const snapshot = await getDocs(collection(db, "transazioni"));
        let lista = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dataFormattata: data.data?.toDate 
              ? data.data.toDate().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })
              : data.date_str || 'Data non disponibile'
          };
        });
        lista.sort((a, b) => {
          const timeA = a.data?.toMillis ? a.data.toMillis() : new Date(a.date_str || 0).getTime();
          const timeB = b.data?.toMillis ? b.data.toMillis() : new Date(b.date_str || 0).getTime();
          return timeB - timeA;
        });
        setTransazioni(lista);
        setFiltrate(lista);
      } catch (fallbackError) {
        console.error("Errore irreversibile:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorico();
  }, []);

  useEffect(() => {
    let risultato = transazioni;
    if (ricercaNome.trim()) {
      const termine = ricercaNome.toLowerCase();
      risultato = risultato.filter(tx => (tx.holder_name || tx.holder || '').toLowerCase().includes(termine));
    }
    if (filtroPlesso !== 'Tutti') {
      risultato = risultato.filter(tx => tx.plesso === filtroPlesso);
    }
    if (filtroTipo !== 'Tutti') {
      const tipoRichiesto = filtroTipo === 'Ricariche' ? 'ricarica' : 'consumazione';
      risultato = risultato.filter(tx => (tx.tipo || tx.type) === tipoRichiesto);
    }
    setFiltrate(risultato);
  }, [ricercaNome, filtroPlesso, filtroTipo, transazioni]);

  const getImporto = (tx) => parseFloat(tx.importo || tx.total || 0);

  const totRicariche = filtrate
    .filter(tx => (tx.tipo || tx.type) === 'ricarica')
    .reduce((acc, curr) => acc + getImporto(curr), 0);
    
  const totConsumazioni = filtrate
    .filter(tx => (tx.tipo || tx.type) === 'consumazione' || (tx.tipo || tx.type) === 'sale')
    .reduce((acc, curr) => acc + getImporto(curr), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px' }}>
      
      {/* BLOCCO STILI RESPONSIVE INTEGRATO */}
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 25px; background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb; }
        
        .desktop-table { width: 100%; border-collapse: collapse; }
        .desktop-table th { padding: 15px; border-bottom: 2px solid #e2e8f0; background: #f8fafc; color: #475569; text-align: left; }
        .desktop-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; }
        
        .mobile-cards { display: none; }
        
        /* Regole per Smartphone e Tablet (sotto i 768px) */
        @media (max-width: 768px) {
          .desktop-table { display: none; }
          .mobile-cards { display: flex; flex-direction: column; gap: 15px; }
          .tx-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
          .tx-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
          .tx-body { display: flex; flex-direction: column; gap: 8px; }
          .tx-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; }
          .tx-label { color: #64748b; font-weight: 500; }
        }
      `}</style>

      {/* Intestazione */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px', color: '#d97706' }}>
          <History size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem' }}>Storico Transazioni</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Monitora incassi e ricariche di tutti i plessi</p>
        </div>
      </div>

      {/* Card Riepilogative */}
      <div className="stats-grid">
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', borderLeft: '4px solid #0284c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#6b7280' }}>Totale Ricariche</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0284c7' }}>€ {totRicariche.toFixed(2)}</h3>
          </div>
          <TrendingUp size={32} color="#bae6fd" />
        </div>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', borderLeft: '4px solid #059669', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#6b7280' }}>Totale Consumazioni</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#059669' }}>€ {totConsumazioni.toFixed(2)}</h3>
          </div>
          <Coffee size={32} color="#a7f3d0" />
        </div>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', borderLeft: '4px solid #4b5563', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#6b7280' }}>Operazioni Trovate</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#4b5563' }}>{filtrate.length}</h3>
          </div>
          <History size={32} color="#e5e7eb" />
        </div>
      </div>

      {/* Barra dei Filtri */}
      <div className="filters-grid">
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Cerca Utente..." 
            value={ricercaNome}
            onChange={(e) => setRicercaNome(e.target.value)}
            style={{ width: '100%', padding: '12px 10px 12px 38px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <MapPin size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <select 
            value={filtroPlesso} 
            onChange={(e) => setFiltroPlesso(e.target.value)}
            style={{ width: '100%', padding: '12px 10px 12px 38px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', background: 'white' }}
          >
            {plessi.map(p => <option key={p} value={p}>{p === 'Tutti' ? 'Tutti i Plessi' : p}</option>)}
          </select>
        </div>

        <div style={{ position: 'relative' }}>
          <Filter size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{ width: '100%', padding: '12px 10px 12px 38px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', background: 'white' }}
          >
            <option value="Tutti">Tutte le Operazioni</option>
            <option value="Ricariche">Solo Ricariche</option>
            <option value="Consumazioni">Solo Consumazioni</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Caricamento storico in corso...</p>
      ) : (
        <>
          {/* VISUALIZZAZIONE DESKTOP (Tabella Classica) */}
          <table className="desktop-table">
            <thead>
              <tr>
                <th>Data e Ora</th>
                <th>Plesso</th>
                <th>Utente</th>
                <th>Tipo</th>
                <th>Dettaglio</th>
                <th style={{ textAlign: 'right' }}>Importo</th>
              </tr>
            </thead>
            <tbody>
              {filtrate.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize: '0.9rem', color: '#4b5563' }}>{tx.dataFormattata}</td>
                  <td>
                    <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', color: '#374151' }}>
                      {tx.plesso || 'Non spec.'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500' }}>{tx.holder_name || tx.holder || 'Sconosciuto'}</td>
                  <td>
                    {(tx.tipo || tx.type) === 'ricarica' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontSize: '0.9rem', fontWeight: '500' }}><CreditCard size={14} /> Ricarica</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '0.9rem', fontWeight: '500' }}><Coffee size={14} /> Bar</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {(tx.tipo || tx.type) === 'ricarica' ? (tx.operatore ? `Op: ${tx.operatore}` : 'N/D') : (tx.items ? tx.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'N/D')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: (tx.tipo || tx.type) === 'ricarica' ? '#0284c7' : '#059669' }}>
                    € {getImporto(tx).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* VISUALIZZAZIONE SMARTPHONE (Card Verticali) */}
          <div className="mobile-cards">
            {filtrate.map(tx => (
              <div key={tx.id} className="tx-card">
                
                <div className="tx-header">
                  <div style={{ fontWeight: '600', fontSize: '1.05rem', color: '#1e293b' }}>
                    {tx.holder_name || tx.holder || 'Sconosciuto'}
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: (tx.tipo || tx.type) === 'ricarica' ? '#0284c7' : '#059669' }}>
                    € {getImporto(tx).toFixed(2)}
                  </div>
                </div>
                
                <div className="tx-body">
                  <div className="tx-row">
                    <span className="tx-label">Operazione</span>
                    <span>
                      {(tx.tipo || tx.type) === 'ricarica' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: '600' }}><CreditCard size={14} /> Ricarica</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: '600' }}><Coffee size={14} /> Bar</span>
                      )}
                    </span>
                  </div>

                  <div className="tx-row">
                    <span className="tx-label">Data</span>
                    <span style={{ color: '#475569' }}>{tx.dataFormattata}</span>
                  </div>
                  
                  <div className="tx-row">
                    <span className="tx-label">Plesso</span>
                    <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{tx.plesso || 'Non spec.'}</span>
                  </div>

                  <div className="tx-row" style={{ alignItems: 'flex-start' }}>
                    <span className="tx-label">Dettaglio</span>
                    <span style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b', maxWidth: '60%' }}>
                      {(tx.tipo || tx.type) === 'ricarica' ? (tx.operatore ? `Op: ${tx.operatore}` : 'N/D') : (tx.items ? tx.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'N/D')}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Messaggio Vuoto */}
          {filtrate.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              Nessuna transazione trovata con i filtri attuali.
            </div>
          )}
        </>
      )}
    </div>
  );
}