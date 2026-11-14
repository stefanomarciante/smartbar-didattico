import { useState } from 'react';
import { collection, query, orderBy, startAt, endAt, getDocs, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, CreditCard, User, Wallet, Calendar, FileText, CheckCircle, ArrowRight } from 'lucide-react';

export default function GestioneRicariche() {
  const [ricerca, setRicerca] = useState("");
  const [risultati, setRisultati] = useState([]);
  const [utenteSelezionato, setUtenteSelezionato] = useState(null);
  
  // Campi form ricarica
  const [importo, setImporto] = useState("");
  const [dataVersamento, setDataVersamento] = useState("");
  const [datiEmissione, setDatiEmissione] = useState("");
  const [loading, setLoading] = useState(false);

  const cercaUtente = async (e) => {
    e.preventDefault();
    if (!ricerca.trim()) return;

    setLoading(true);
    try {
      // Scarica tutte le card (operazione istantanea per i numeri di una scuola)
      const snapshot = await getDocs(collection(db, "cards"));
      const tutteLeCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtra localmente: ignora maiuscole/minuscole e permette la ricerca di parole parziali
      const termine = ricerca.toLowerCase();
      const res = tutteLeCards.filter(card => {
        // Intercetta il nome in base a come lo hai chiamato nel database (holder_name, holder o nome)
        const nomeUtente = (card.holder_name || card.holder || card.nome || "").toLowerCase();
        return nomeUtente.includes(termine);
      });

      setRisultati(res);
      setUtenteSelezionato(null);
      
      if (res.length === 0) {
        alert("Nessun utente trovato con questo nome.");
      }
    } catch (error) {
      console.error("Errore ricerca:", error);
      alert("Errore durante la ricerca. Controlla la connessione.");
    } finally {
      setLoading(false);
    }
  };

  const selezionaUtente = (utente) => {
    setUtenteSelezionato(utente);
    setRisultati([]);
    setRicerca("");
  };

  const eseguiRicarica = async (e) => {
    e.preventDefault();
    const val = parseFloat(importo);
    
    if (!dataVersamento || !datiEmissione.trim()) {
      alert("Compila tutti i campi richiesti (Data e Dati Emissione).");
      return;
    }
    if (!utenteSelezionato || isNaN(val) || val <= 0) {
      alert("Inserisci un importo valido.");
      return;
    }

    setLoading(true);
    const userRef = doc(db, "cards", utenteSelezionato.id);
    const txRef = doc(collection(db, "sales")); 

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("Utente non trovato");
        
        const nuovoSaldo = (userDoc.data().credit || 0) + val;
        
        transaction.update(userRef, { credit: nuovoSaldo });
        
        // Scrittura allineata ai POS nella collezione "sales"
        transaction.set(txRef, {
          holder: utenteSelezionato.holder_name,
          type: "ricarica",
          total: val,
          timestamp: new Date(),
          date_str: new Date().toLocaleString('it-IT'),
          items: [{
            name: "Ricarica manuale segreteria",
            price: val,
            qty: 1,
            subtotal: val
          }]
        });
      });
      
      alert("Ricarica completata con successo!");
      setUtenteSelezionato(null);
      setImporto("");
      setDataVersamento("");
      setDatiEmissione("");
    } catch (error) {
      console.error("Errore ricarica:", error);
      alert("Errore durante la ricarica. Operazione annullata.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Intestazione Sezione */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <div style={{ background: '#e0f2fe', padding: '12px', borderRadius: '12px', color: '#0284c7' }}>
          <CreditCard size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#1f2937' }}>Ricarica Card</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Cerca un utente ed effettua un versamento</p>
        </div>
      </div>

      {/* Barra di Ricerca */}
      {!utenteSelezionato && (
        <form onSubmit={cercaUtente} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} color="#9ca3af" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cerca per Nome o Cognome (MAIUSCOLO)..." 
              value={ricerca} 
              onChange={(e) => setRicerca(e.target.value.toUpperCase())}
              style={{ width: '100%', paddingLeft: '45px', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Ricerca...' : 'Cerca'}
          </button>
        </form>
      )}

      {/* Lista Risultati Ricerca */}
      {risultati.length > 0 && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 10px', color: '#6b7280' }}>Risultati Trovati:</h4>
          {risultati.map(utente => (
            <div 
              key={utente.id} 
              onClick={() => selezionaUtente(utente)}
              style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '12px 20px', margin: '5px 0', background: 'white', 
                borderRadius: '8px', cursor: 'pointer', border: '1px solid #e5e7eb',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateX(5px)' }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateX(0)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <User size={20} color="#6b7280" />
                <span style={{ fontWeight: '600' }}>{utente.holder_name}</span>
              </div>
              <ArrowRight size={18} color="#0284c7" />
            </div>
          ))}
        </div>
      )}

      {/* Area Utente Selezionato & Modulo Ricarica */}
      {utenteSelezionato && (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
          
          {/* Card Virtuale Utente */}
          <div style={{ 
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
            borderRadius: '16px', padding: '25px', color: 'white', 
            marginBottom: '30px', boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Effetto decorativo interno alla card */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <Wallet size={150} />
            </div>
            
            <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Intestatario Card</p>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.8rem', fontWeight: '800' }}>{utenteSelezionato.holder_name}</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', opacity: 0.8 }}>Credito Attuale</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>€ {(utenteSelezionato.credit || 0).toFixed(2)}</h3>
              </div>
              <button 
                onClick={() => setUtenteSelezionato(null)} 
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Cambia Utente
              </button>
            </div>
          </div>

          {/* Modulo di Ricarica */}
          <form onSubmit={eseguiRicarica} style={{ background: '#f9fafb', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#059669" /> Dettagli Versamento
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
                  <Wallet size={16} /> Importo da ricaricare (€)
                </label>
                <input 
                  type="number" 
                  step="0.50" 
                  min="0.50"
                  required
                  placeholder="Es. 10.00" 
                  value={importo} 
                  onChange={(e) => setImporto(e.target.value)} 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
                  <Calendar size={16} /> Data del Versamento
                </label>
                <input 
                  type="date" 
                  required
                  value={dataVersamento} 
                  onChange={(e) => setDataVersamento(e.target.value)} 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
                <FileText size={16} /> Dati Emissione (Es. Numero Ricevuta)
              </label>
              <input 
                type="text" 
                required
                placeholder="Es. Ricevuta N. 1234 - Pagamento Contanti" 
                value={datiEmissione} 
                onChange={(e) => setDatiEmissione(e.target.value)} 
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '15px', fontSize: '1.1rem', justifyContent: 'center' }}>
              {loading ? 'Elaborazione in corso...' : `Conferma Ricarica di € ${importo || '0.00'}`}
            </button>
          </form>

        </div>
      )}

    </div>
  );
}