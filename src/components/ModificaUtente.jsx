import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, UserCog, User, ArrowLeft, GraduationCap, Edit2, Hash, CheckCircle, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ModificaUtente() {
  const [tuttiUtenti, setTuttiUtenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ricerca, setRicerca] = useState("");
  
  const [utenteSelezionato, setUtenteSelezionato] = useState(null);
  
  // Campi form modifica
  const [editNome, setEditNome] = useState("");
  const [editRuolo, setEditRuolo] = useState("");
  const [nuovoUid, setNuovoUid] = useState("");
  const [avvisoUid, setAvvisoUid] = useState("");

  // Stati Lettore NFC
  const [lettoreConnesso, setLettoreConnesso] = useState(false);
  const [ultimoUidLettore, setUltimoUidLettore] = useState("");
  const primoCaricamento = useRef(true);
  const utenteSelezionatoRef = useRef(null);
  const tuttiUtentiRef = useRef([]);

  // Mantiene i ref sincronizzati per usarli dentro onSnapshot
  useEffect(() => {
    utenteSelezionatoRef.current = utenteSelezionato;
  }, [utenteSelezionato]);

  useEffect(() => {
    tuttiUtentiRef.current = tuttiUtenti;
  }, [tuttiUtenti]);

  const fetchUtenti = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "cards"));
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Ordina alfabeticamente per nome
      lista.sort((a, b) => (a.holder_name || '').localeCompare(b.holder_name || ''));
      setTuttiUtenti(lista);
    } catch (error) {
      console.error("Errore caricamento utenti:", error);
      alert("Impossibile caricare l'elenco degli utenti.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtenti();
  }, []);

  // Ascolto in tempo reale di nfc_reader/ultimo_scan
  useEffect(() => {
    const readerRef = doc(db, "nfc_reader", "ultimo_scan");
    const unsubscribe = onSnapshot(readerRef, (docSnap) => {
      if (docSnap.exists()) {
        setLettoreConnesso(true);
        const data = docSnap.data();
        const uidLetto = (data.uid || '').trim().toUpperCase();
        setUltimoUidLettore(uidLetto);

        // Ignora il dato vecchio già presente all'apertura della pagina
        if (primoCaricamento.current) {
          primoCaricamento.current = false;
          return;
        }

        if (!uidLetto) return;

        // CASO 1: Siamo nella lista utenti -> Cerca e apre automaticamente l'utente della chiavetta
        if (!utenteSelezionatoRef.current) {
          const trovato = tuttiUtentiRef.current.find(u => u.id.toUpperCase() === uidLetto);
          if (trovato) {
            selezionaUtente(trovato);
          } else {
            setRicerca(uidLetto);
          }
        } else {
          // CASO 2: Siamo dentro la modifica di un utente -> Imposta il nuovo UID per sostituire la card
          impostaNuovaChiavetta(uidLetto);
        }
      } else {
        primoCaricamento.current = false;
      }
    }, (error) => {
      console.error("Errore ascolto lettore NFC:", error);
    });

    return () => unsubscribe();
  }, []);

  const selezionaUtente = (utente) => {
    setUtenteSelezionato(utente);
    setEditNome(utente.holder_name || "");
    setEditRuolo(utente.role || "Studente");
    setNuovoUid(utente.id);
    setAvvisoUid("");
  };

  // Verifica se il nuovo UID è già assegnato a un'altra persona
  const impostaNuovaChiavetta = (codiceUid) => {
    const uidPulito = codiceUid.trim().toUpperCase();
    setNuovoUid(uidPulito);
    setAvvisoUid("");

    if (!uidPulito || !utenteSelezionatoRef.current) return;

    if (uidPulito !== utenteSelezionatoRef.current.id.toUpperCase()) {
      const conflitto = tuttiUtentiRef.current.find(u => u.id.toUpperCase() === uidPulito);
      if (conflitto) {
        setAvvisoUid(`Impossibile usare questa chiavetta: è già assegnata a ${conflitto.holder_name}!`);
      }
    }
  };

  const salvaModifiche = async (e) => {
    e.preventDefault();
    const nomePulito = editNome.trim().toUpperCase();
    const uidFinale = nuovoUid.trim().toUpperCase();
    const vecchioUid = utenteSelezionato.id;

    if (!nomePulito || !uidFinale) {
      alert("Nome utente e UID non possono essere vuoti.");
      return;
    }

    if (avvisoUid) {
      alert(avvisoUid);
      return;
    }

    setLoading(true);
    const readerRef = doc(db, "nfc_reader", "ultimo_scan");

    try {
      // Se l'UID non è cambiato, aggiorna solo Nome e Ruolo
      if (uidFinale === vecchioUid.toUpperCase()) {
        const userRef = doc(db, "cards", vecchioUid);
        await updateDoc(userRef, {
          holder_name: nomePulito,
          role: editRuolo
        });
        alert("Dati utente aggiornati con successo!");
      } else {
        // Se l'UID è cambiato (Sostituzione Chiavetta): sposta credito e dati sul nuovo UID ed elimina il vecchio
        const conferma = window.confirm(
          `Confermi la sostituzione della chiavetta per ${nomePulito}?\n\nVecchio UID: ${vecchioUid}\nNuovo UID: ${uidFinale}\n\nIl credito attuale (€ ${(utenteSelezionato.credit || 0).toFixed(2)}) verrà trasferito sulla nuova chiavetta.`
        );
        if (!conferma) {
          setLoading(false);
          return;
        }

        const oldRef = doc(db, "cards", vecchioUid);
        const newRef = doc(db, "cards", uidFinale);

        await runTransaction(db, async (transaction) => {
          const oldSnap = await transaction.get(oldRef);
          const newSnap = await transaction.get(newRef);

          if (!oldSnap.exists()) {
            throw new Error("Documento utente originale non trovato.");
          }
          if (newSnap.exists()) {
            throw new Error(`La nuova chiavetta è già associata a ${newSnap.data().holder_name}.`);
          }

          const vecchiDati = oldSnap.data();

          // Crea il nuovo documento mantenendo saldo e storico creazione
          transaction.set(newRef, {
            ...vecchiDati,
            holder_name: nomePulito,
            role: editRuolo,
            previous_uid: vecchioUid,
            updatedAt: serverTimestamp()
          });

          // Elimina la vecchia chiavetta smarrita
          transaction.delete(oldRef);
        });

        alert(`Chiavetta sostituita con successo! Nuovo UID assegnato: ${uidFinale}`);
      }

      // Svuota sempre il buffer del lettore NFC dopo il salvataggio
      await setDoc(readerRef, { uid: "", scan_id: "" });

      setUtenteSelezionato(null);
      setRicerca("");
      setUltimoUidLettore("");
      fetchUtenti();
    } catch (error) {
      console.error("Errore modifica:", error);
      alert("Errore durante il salvataggio: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtro in tempo reale dell'elenco
  const utentiFiltrati = tuttiUtenti.filter(utente => {
    const termine = ricerca.toLowerCase();
    const nome = (utente.holder_name || '').toLowerCase();
    const uid = utente.id.toLowerCase();
    return nome.includes(termine) || uid.includes(termine);
  });

  const uidModificato = utenteSelezionato && nuovoUid.trim().toUpperCase() !== utenteSelezionato.id.toUpperCase();

  return (
    <div className="panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* VISTA 1: ELENCO UTENTI E RICERCA */}
      {!utenteSelezionato ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: '#e0e7ff', padding: '12px', borderRadius: '12px', color: '#4f46e5' }}>
                <UserCog size={28} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: '#1f2937' }}>Gestione Anagrafica Utenti</h2>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Cerca un utente, oppure avvicina la sua chiavetta al lettore per aprirne la scheda</p>
              </div>
            </div>

            {/* Badge Stato Lettore Pico 2W */}
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              background: lettoreConnesso ? '#eef2ff' : '#f3f4f6', 
              color: lettoreConnesso ? '#4f46e5' : '#6b7280', 
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
              border: `1px solid ${lettoreConnesso ? '#c7d2fe' : '#e5e7eb'}`
            }}>
              <Wifi size={14} />
              {lettoreConnesso ? `Lettore NFC Pronto` : 'In ascolto lettore NFC...'}
            </div>
          </div>

          {/* Barra di Ricerca Veloce */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={20} color="#9ca3af" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cerca per Nome, Cognome, Seriale UID o avvicina la chiavetta..." 
              value={ricerca} 
              onChange={(e) => setRicerca(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 45px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
            />
          </div>

          {/* Tabella Elenco Utenti con Scroll */}
          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Caricamento archivio utenti...</p>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '500px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1 }}>
                  <tr>
                    <th style={{ width: '40%' }}>Utente</th>
                    <th style={{ width: '25%' }}>Ruolo</th>
                    <th style={{ width: '20%' }}>Seriale (UID)</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {utentiFiltrati.map(utente => (
                    <tr key={utente.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={16} color="#6b7280" />
                          <strong style={{ color: '#374151' }}>{utente.holder_name || 'N/D'}</strong>
                        </div>
                      </td>
                      <td>
                        <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', color: '#4b5563' }}>
                          {utente.role || 'Studente'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#6b7280' }}>
                        {utente.id}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => selezionaUtente(utente)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                          title="Modifica Utente"
                        >
                          <Edit2 size={16} /> Modifica
                        </button>
                      </td>
                    </tr>
                  ))}
                  {utentiFiltrati.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                        Nessun utente trovato con i criteri di ricerca.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (

        /* VISTA 2: MODIFICA UTENTE SELEZIONATO & SOSTITUZIONE CARD */
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => setUtenteSelezionato(null)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontWeight: '600', padding: '8px', borderRadius: '8px' }}>
                <ArrowLeft size={20} /> Torna alla lista
              </button>
              <div style={{ width: '2px', height: '30px', background: '#e5e7eb' }}></div>
              <div>
                <h2 style={{ margin: 0, color: '#4f46e5' }}>Modifica Profilo</h2>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{utenteSelezionato.holder_name} — Credito: € {(utenteSelezionato.credit || 0).toFixed(2)}</p>
              </div>
            </div>

            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              background: lettoreConnesso ? '#eef2ff' : '#f3f4f6', 
              color: lettoreConnesso ? '#4f46e5' : '#6b7280', 
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
              border: `1px solid ${lettoreConnesso ? '#c7d2fe' : '#e5e7eb'}`
            }}>
              <Wifi size={14} />
              {lettoreConnesso ? `Avvicina nuova card per sostituirla` : 'Lettore NFC in ascolto...'}
            </div>
          </div>
          
          {/* Card Virtuale (Stile Indaco) */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', borderRadius: '16px', padding: '25px', color: 'white', marginBottom: '30px', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <UserCog size={150} />
            </div>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Anteprima Profilo</p>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.8rem', fontWeight: '800' }}>{editNome || 'NOME UTENTE'}</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', opacity: 0.8 }}>Ruolo</p>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>{editRuolo}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', opacity: 0.8 }}>UID Associato</p>
                <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: '700', fontSize: '1.05rem', color: uidModificato ? '#fde047' : 'white' }}>
                  {nuovoUid || utenteSelezionato.id}
                </p>
              </div>
            </div>
          </div>

          {/* Form di Modifica */}
          <form onSubmit={salvaModifiche} style={{ background: '#f9fafb', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#4f46e5" /> Dati Anagrafici & Supporto NFC
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Hash size={16} /> Seriale Fisico (UID) {uidModificato && <span style={{ color: '#059669', fontWeight: '700' }}>— NUOVA CHIAVETTA RILEVATA!</span>}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {ultimoUidLettore && ultimoUidLettore !== nuovoUid && (
                    <button 
                      type="button" 
                      onClick={() => impostaNuovaChiavetta(ultimoUidLettore)}
                      style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={12} /> Usa UID letto ({ultimoUidLettore})
                    </button>
                  )}
                  {uidModificato && (
                    <button 
                      type="button" 
                      onClick={() => impostaNuovaChiavetta(utenteSelezionato.id)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Ripristina UID originale
                    </button>
                  )}
                </div>
              </label>
              <input 
                type="text" 
                value={nuovoUid} 
                onChange={(e) => impostaNuovaChiavetta(e.target.value)}
                style={{ 
                  width: '100%', boxSizing: 'border-box', 
                  background: uidModificato ? '#ecfdf5' : 'white', 
                  color: '#1f2937', fontFamily: 'monospace', fontWeight: '700',
                  padding: '10px 14px', border: `2px solid ${avvisoUid ? '#ef4444' : uidModificato ? '#059669' : '#d1d5db'}`, 
                  borderRadius: '8px' 
                }} 
              />
              {avvisoUid ? (
                <small style={{ color: '#dc2626', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                  <AlertTriangle size={14} /> {avvisoUid}
                </small>
              ) : (
                <small style={{ color: '#6b7280', marginTop: '5px', display: 'block' }}>
                  Per sostituire una chiavetta smarrita, poggia semplicemente la nuova chiavetta sul lettore NFC: il credito verrà trasferito automaticamente.
                </small>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
                  <User size={16} /> Nome e Cognome
                </label>
                <input type="text" required value={editNome} onChange={(e) => setEditNome(e.target.value.toUpperCase())} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
                  <GraduationCap size={16} /> Qualifica / Ruolo
                </label>
                <select value={editRuolo} onChange={(e) => setEditRuolo(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'white' }}>
                  <option value="Studente">Studente</option>
                  <option value="Docente">Docente</option>
                  <option value="Personale ATA">Personale ATA</option>
                  <option value="DSGA">DSGA</option>
                  <option value="Dirigente">Dirigente</option>
                  <option value="Collaboratore Dirigente">Collaboratore Dirigente</option>
                  <option value="Esterno">Ospite / Esterno</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || !!avvisoUid} 
              style={{ 
                width: '100%', padding: '15px', fontSize: '1.1rem', justifyContent: 'center', 
                backgroundColor: avvisoUid ? '#9ca3af' : uidModificato ? '#059669' : '#4f46e5',
                cursor: avvisoUid ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Salvataggio in corso...' : uidModificato ? `Trasferisci Profilo e Credito su Nuovo UID (${nuovoUid})` : 'Salva Modifiche'}
            </button>
          </form>

        </div>
      )}

    </div>
  );
}