import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, runTransaction, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Search, CreditCard, User, Wallet, Calendar, FileText, CheckCircle, ArrowRight, Wifi, RefreshCw } from 'lucide-react';

export default function GestioneRicariche() {
  const [ricerca, setRicerca] = useState("");
  const [risultati, setRisultati] = useState([]);
  const [utenteSelezionato, setUtenteSelezionato] = useState(null);
  
  // Stati Lettore NFC
  const [lettoreConnesso, setLettoreConnesso] = useState(false);
  const [ultimoUidLettore, setUltimoUidLettore] = useState("");
  const primoCaricamento = useRef(true);

  // Campi form ricarica
  const [importo, setImporto] = useState("");
  const [dataVersamento, setDataVersamento] = useState("");
  const [datiEmissione, setDatiEmissione] = useState("");
  const [loading, setLoading] = useState(false);

  // Ascolto in tempo reale di nfc_reader/ultimo_scan
  useEffect(() => {
    const readerRef = doc(db, "nfc_reader", "ultimo_scan");
    const unsubscribe = onSnapshot(readerRef, async (docSnap) => {
      if (docSnap.exists()) {
        setLettoreConnesso(true);
        const data = docSnap.data();
        const uidLetto = (data.uid || '').trim().toUpperCase();
        setUltimoUidLettore(uidLetto);

        // Ignora vecchie letture già presenti prima di aprire la pagina
        if (primoCaricamento.current) {
          primoCaricamento.current = false;
          return;
        }

        if (uidLetto) {
          await caricaUtenteDaUid(uidLetto);
        }
      } else {
        primoCaricamento.current = false;
      }
    }, (error) => {
      console.error("Errore ascolto lettore NFC:", error);
    });

    return () => unsubscribe();
  }, []);

  // Carica direttamente l'utente dal documento cards/{UID}
  const caricaUtenteDaUid = async (uidLetto) => {
    const uidPulito = uidLetto.trim().toUpperCase();
    if (!uidPulito) return;

    setLoading(true);
    try {
      const cardRef = doc(db, "cards", uidPulito);
      const cardSnap = await getDoc(cardRef);

      if (cardSnap.exists()) {
        selezionaUtente({ id: cardSnap.id, ...cardSnap.data() });
      } else {
        alert(`Chiavetta rilevata (UID: ${uidPulito}), ma non risulta associata a nessun utente in archivio.`);
      }
    } catch (error) {
      console.error("Errore ricerca NFC:", error);
      alert("Errore durante la lettura della card dal database.");
    } finally {
      setLoading(false);
    }
  };

  const cercaUtente = async (e) => {
    e.preventDefault();
    if (!ricerca.trim()) return;

    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "cards"));
      const tutteLeCards = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const termine = ricerca.toLowerCase();
      const res = tutteLeCards.filter(card => {
        const nomeUtente = (card.holder_name || card.holder || card.nome || "").toLowerCase();
        const uidCard = card.id.toLowerCase();
        return nomeUtente.includes(termine) || uidCard.includes(termine);
      });

      setRisultati(res);
      setUtenteSelezionato(null);
      
      if (res.length === 0) {
        alert("Nessun utente trovato con questo nome o UID.");
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
    // Precompila la data di oggi per velocizzare l'inserimento
    if (!dataVersamento) {
      setDataVersamento(new Date().toISOString().split('T')[0]);
    }
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
    const txRef = doc(collection(db, "transazioni")); 
    const readerRef = doc(db, "nfc_reader", "ultimo_scan");

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("Utente non trovato");
        
        const nuovoSaldo = (userDoc.data().credit || 0) + val;
        
        transaction.update(userRef, { credit: nuovoSaldo });
        
        transaction.set(txRef, {
          holder_name: utenteSelezionato.holder_name || utenteSelezionato.holder || "Utente",
          card_id: utenteSelezionato.id,
          tipo: "ricarica",
          importo: val,
          plesso: "Segreteria",
          data: new Date(),
          date_str: new Date().toLocaleString('it-IT'),
          operatore: auth.currentUser?.email || "Segreteria",
          dettagli_versamento: datiEmissione.trim(),
          data_versamento: dataVersamento,
          items: [{
            name: `Ricarica (${datiEmissione.trim()})`,
            price: val,
            qty: 1,
            subtotal: val
          }]
        });
      });

      // Svuota il buffer del lettore NFC dopo la ricarica
      await setDoc(readerRef, { uid: "", scan_id: "" });
      
      alert(`Ricarica di € ${val.toFixed(2)} completata con successo per ${utenteSelezionato.holder_name}!`);
      setUtenteSelezionato(null);
      setImporto("");
      setDataVersamento("");
      setDatiEmissione("");
      setUltimoUidLettore("");
    } catch (error) {
      console.error("Errore ricarica:", error);
      alert("Errore durante la ricarica. Operazione annullata.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Intestazione Sezione con Stato Lettore NFC */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#e0f2fe', padding: '12px', borderRadius: '12px', color: '#0284c7' }}>
            <CreditCard size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#1f2937' }}>Ricarica Card</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Avvicina la chiavetta al lettore NFC o cerca l'utente per nome</p>
          </div>
        </div>

        {/* Badge Stato Lettore Pico 2W */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {ultimoUidLettore && !utenteSelezionato && (
            <button
              type="button"
              onClick={() => caricaUtenteDaUid(ultimoUidLettore)}
              style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <RefreshCw size={13} /> Apri {ultimoUidLettore}
            </button>
          )}
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', 
            background: lettoreConnesso ? '#ecfdf5' : '#f3f4f6', 
            color: lettoreConnesso ? '#059669' : '#6b7280', 
            padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
            border: `1px solid ${lettoreConnesso ? '#a7f3d0' : '#e5e7eb'}`
          }}>
            <Wifi size={14} />
            {lettoreConnesso ? 'Lettore NFC Pronto' : 'In ascolto NFC...'}
          </div>
        </div>
      </div>

      {/* Barra di Ricerca Manuale / Avviso NFC */}
      {!utenteSelezionato && (
        <form onSubmit={cercaUtente} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} color="#9ca3af" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Poggia la chiavetta sul lettore oppure cerca per Nome/Cognome..." 
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

      {/* Lista Risultati Ricerca Testuale */}
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
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.transform = 'translateX(5px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <User size={20} color="#6b7280" />
                <div>
                  <span style={{ fontWeight: '600', display: 'block' }}>{utente.holder_name}</span>
                  <small style={{ color: '#9ca3af', fontFamily: 'monospace' }}>UID: {utente.id} — Saldo: € {(utente.credit || 0).toFixed(2)}</small>
                </div>
              </div>
              <ArrowRight size={18} color="#0284c7" />
            </div>
          ))}
        </div>
      )}

      {/* Area Utente Selezionato & Modulo Ricarica */}
      {utenteSelezionato && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* Card Virtuale Utente */}
          <div style={{ 
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
            borderRadius: '16px', padding: '25px', color: 'white', 
            marginBottom: '30px', boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <Wallet size={150} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
                  Intestatario Card ({utenteSelezionato.role || 'Studente'})
                </p>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '1.8rem', fontWeight: '800' }}>{utenteSelezionato.holder_name}</h2>
              </div>
              <span style={{ background: 'rgba(255,255,255,0.18)', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                UID: {utenteSelezionato.id}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', opacity: 0.8 }}>Credito Attuale</p>
                <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700' }}>€ {(utenteSelezionato.credit || 0).toFixed(2)}</h3>
              </div>
              <button 
                type="button"
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
                  <Wallet size={16} /> Importo da ricaricare (€)
                </label>
                <input 
                  type="number" 
                  step="0.50" 
                  min="0.50"
                  required
                  autoFocus
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
                <FileText size={16} /> Dati Emissione (Es. Ricevuta PagoPA / Bollettino)
              </label>
              <input 
                type="text" 
                required
                placeholder="Es. Ricevuta PagoPA / IUV N. 123456" 
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