import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { History, Search, MapPin, Filter, TrendingUp, Coffee, CreditCard } from 'lucide-react';

export default function StoricoTransazioni() {
  const [transazioni, setTransazioni] = useState([]);
  const [filtrate, setFiltrate] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stati per i filtri
  const [ricercaNome, setRicercaNome] = useState('');
  const [filtroPlesso, setFiltroPlesso] = useState('Tutti');
  const [filtroTipo, setFiltroTipo] = useState('Tutti');

  const plessi = ['Tutti', 'Nicolosi', 'Santa Maria di Licodia', 'Pedara', 'Trecastagni', 'Paternò'];

  const fetchStorico = async () => {
    setLoading(true);
    try {
      // Usiamo la nuova collezione 'transazioni'
      const q = query(collection(db, "transazioni"), orderBy("data", "desc"), limit(1000));
      const snapshot = await getDocs(q);
      
      const lista = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Normalizziamo la data dal nuovo campo "data"
          dataFormattata: data.data?.toDate 
            ? data.data.toDate().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })
            : data.date_str || 'Data non disponibile'
        };
      });
      setTransazioni(lista);
      setFiltrate(lista);
    } catch (error) {
      console.warn("Manca l'indice su 'data', uso ordinamento locale", error);
      // Fallback in caso di mancanza dell'Indice Composto su Firebase
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
        // Ordina localmente in modo discendente
        lista.sort((a, b) => {
          const timeA = a.data?.toMillis ? a.data.toMillis() : new Date(a.date_str || 0).getTime();
          const timeB = b.data?.toMillis ? b.data.toMillis() : new Date(b.date_str || 0).getTime();
          return timeB - timeA;
        });
        setTransazioni(lista);
        setFiltrate(lista);
      } catch (fallbackError) {
        console.error("Errore irreversibile caricamento storico:", fallbackError);
        alert("Impossibile caricare lo storico delle transazioni.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorico();
  }, []);

  // Effetto per applicare i filtri in tempo reale
  useEffect(() => {
    let risultato = transazioni;

    if (ricercaNome.trim()) {
      const termine = ricercaNome.toLowerCase();
      // Usiamo holder_name (il nuovo campo) o facciamo fallback su holder (vecchio campo)
      risultato = risultato.filter(tx => (tx.holder_name || tx.holder || '').toLowerCase().includes(termine));
    }

    if (filtroPlesso !== 'Tutti') {
      risultato = risultato.filter(tx => tx.plesso === filtroPlesso);
    }

    if (filtroTipo !== 'Tutti') {
      const tipoRichiesto = filtroTipo === 'Ricariche' ? 'ricarica' : 'consumazione';
      // Usiamo tipo (nuovo campo) o facciamo fallback su type (vecchio campo)
      risultato = risultato.filter(tx => (tx.tipo || tx.type) === tipoRichiesto);
    }

    setFiltrate(risultato);
  }, [ricercaNome, filtroPlesso, filtroTipo, transazioni]);

  // Calcolo Statistiche Dinamiche sui dati filtrati (usando importo o total)
  const getImporto = (tx) => parseFloat(tx.importo || tx.total || 0);

  const totRicariche = filtrate
    .filter(tx => (tx.tipo || tx.type) === 'ricarica')
    .reduce((acc, curr) => acc + getImporto(curr), 0);
    
  const totConsumazioni = filtrate
    .filter(tx => (tx.tipo || tx.type) === 'consumazione' || (tx.tipo || tx.type) === 'sale')
    .reduce((acc, curr) => acc + getImporto(curr), 0);

  return (
    <div className="panel" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Intestazione */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px', color: '#d97706' }}>
          <History size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#1f2937' }}>Storico Transazioni</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Monitora incassi e ricariche di tutti i plessi</p>
        </div>
      </div>

      {/* Card Riepilogative */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px', background: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Cerca Utente/Docente..." 
            value={ricercaNome}
            onChange={(e) => setRicercaNome(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box', padding: '10px 10px 10px 38px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <MapPin size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <select 
            value={filtroPlesso} 
            onChange={(e) => setFiltroPlesso(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', background: 'white' }}
          >
            {plessi.map(p => <option key={p} value={p}>{p === 'Tutti' ? 'Tutti i Plessi' : p}</option>)}
          </select>
        </div>

        <div style={{ position: 'relative' }}>
          <Filter size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', background: 'white' }}
          >
            <option value="Tutti">Tutte le Operazioni</option>
            <option value="Ricariche">Solo Ricariche</option>
            <option value="Consumazioni">Solo Consumazioni (Bar)</option>
          </select>
        </div>
      </div>

      {/* Tabella Dati */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Caricamento storico in corso...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Data e Ora</th>
                <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Plesso</th>
                <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Utente</th>
                <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Tipo</th>
                <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Dettaglio</th>
                <th style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Importo</th>
              </tr>
            </thead>
            <tbody>
              {filtrate.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 15px', fontSize: '0.9rem', color: '#4b5563' }}>{tx.dataFormattata}</td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', color: '#374151' }}>
                      {tx.plesso || 'Non spec.'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px', fontWeight: '500' }}>{tx.holder_name || tx.holder || 'Utente Sconosciuto'}</td>
                  <td style={{ padding: '12px 15px' }}>
                    {(tx.tipo || tx.type) === 'ricarica' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontSize: '0.9rem', fontWeight: '500' }}><CreditCard size={14} /> Ricarica</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '0.9rem', fontWeight: '500' }}><Coffee size={14} /> Bar</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 15px', fontSize: '0.85rem', color: '#6b7280' }}>
                    {(tx.tipo || tx.type) === 'ricarica' 
                      ? (tx.operatore ? `Operatore: ${tx.operatore}` : 'N/D') 
                      : (tx.items ? tx.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'N/D')}
                  </td>
                  <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: '700', color: (tx.tipo || tx.type) === 'ricarica' ? '#0284c7' : '#059669' }}>
                    € {getImporto(tx).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filtrate.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    Nessuna transazione trovata con i filtri attuali.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}