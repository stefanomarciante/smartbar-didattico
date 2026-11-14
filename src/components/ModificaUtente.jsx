import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, UserCog, User, ArrowLeft, GraduationCap, Edit2, Hash, CheckCircle } from 'lucide-react';

export default function ModificaUtente() {
  const [tuttiUtenti, setTuttiUtenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ricerca, setRicerca] = useState("");
  
  const [utenteSelezionato, setUtenteSelezionato] = useState(null);
  
  // Campi form modifica
  const [editNome, setEditNome] = useState("");
  const [editRuolo, setEditRuolo] = useState("");

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

  const selezionaUtente = (utente) => {
    setUtenteSelezionato(utente);
    setEditNome(utente.holder_name || "");
    setEditRuolo(utente.role || "Studente");
  };

  const salvaModifiche = async (e) => {
    e.preventDefault();
    const nomePulito = editNome.trim().toUpperCase();

    if (!nomePulito) {
      alert("Il nome utente non può essere vuoto.");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "cards", utenteSelezionato.id);
      await updateDoc(userRef, {
        holder_name: nomePulito,
        role: editRuolo
      });
      
      alert("Dati utente aggiornati con successo!");
      setUtenteSelezionato(null);
      setRicerca("");
      fetchUtenti(); // Ricarica la lista per mostrare il nome aggiornato
    } catch (error) {
      console.error("Errore modifica:", error);
      alert("Errore durante il salvataggio delle modifiche.");
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

  return (
    <div className="panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* VISTA 1: ELENCO UTENTI E RICERCA */}
      {!utenteSelezionato ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
            <div style={{ background: '#e0e7ff', padding: '12px', borderRadius: '12px', color: '#4f46e5' }}>
              <UserCog size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#1f2937' }}>Gestione Anagrafica Utenti</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Cerca un utente o selezionalo dalla lista per aggiornarne i dati</p>
            </div>
          </div>

          {/* Barra di Ricerca Veloce */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={20} color="#9ca3af" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cerca rapidamente per Nome, Cognome o Seriale UID..." 
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

        /* VISTA 2: MODIFICA UTENTE SELEZIONATO */
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
            <button onClick={() => setUtenteSelezionato(null)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontWeight: '600', padding: '8px', borderRadius: '8px' }}>
              <ArrowLeft size={20} /> Torna alla lista
            </button>
            <div style={{ width: '2px', height: '30px', background: '#e5e7eb' }}></div>
            <div>
              <h2 style={{ margin: 0, color: '#4f46e5' }}>Modifica Profilo</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{utenteSelezionato.holder_name}</p>
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
            </div>
          </div>

          {/* Form di Modifica */}
          <form onSubmit={salvaModifiche} style={{ background: '#f9fafb', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#4f46e5" /> Dati Anagrafici
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
                <Hash size={16} /> Seriale Fisico (UID) - <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>Non modificabile</span>
              </label>
              <input type="text" disabled value={utenteSelezionato.id} style={{ width: '100%', boxSizing: 'border-box', background: '#e5e7eb', color: '#6b7280', fontFamily: 'monospace', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
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

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '15px', fontSize: '1.1rem', justifyContent: 'center', backgroundColor: '#4f46e5' }}>
              {loading ? 'Salvataggio in corso...' : 'Salva Modifiche'}
            </button>
          </form>

        </div>
      )}

    </div>
  );
}