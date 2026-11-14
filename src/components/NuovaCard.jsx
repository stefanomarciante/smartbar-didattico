import { useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserPlus, CreditCard, User, Hash, GraduationCap, CheckCircle, Save } from 'lucide-react';

export default function NuovaCard() {
  const [uid, setUid] = useState('');
  const [nome, setNome] = useState('');
  const [ruolo, setRuolo] = useState('Studente');
  const [loading, setLoading] = useState(false);

  const registraCard = async (e) => {
    e.preventDefault();
    const uidPulito = uid.trim().toUpperCase();
    const nomePulito = nome.trim().toUpperCase();

    if (!uidPulito || !nomePulito) {
      alert("Compila tutti i campi obbligatori.");
      return;
    }

    setLoading(true);
    const docRef = doc(db, "cards", uidPulito);

    try {
      // 1. Controlla se la card esiste già
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        alert(`Attenzione! Questa card è già associata a: ${docSnap.data().holder_name}. Impossibile sovrascriverla.`);
        setLoading(false);
        return;
      }

      // 2. Crea il nuovo documento usando l'UID come ID del documento
      await setDoc(docRef, {
        holder_name: nomePulito,
        role: ruolo,
        credit: 0, // Credito iniziale sempre a zero
        createdAt: serverTimestamp()
      });

      alert("Card registrata con successo nel database!");
      
      // Resetta il form
      setUid('');
      setNome('');
      setRuolo('Studente');

    } catch (error) {
      console.error("Errore registrazione card:", error);
      alert("Si è verificato un errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Intestazione */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '12px', color: '#059669' }}>
          <UserPlus size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#1f2937' }}>Registrazione Nuova Card</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Associa un nuovo utente a un supporto fisico NFC</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
        
        {/* Modulo di Inserimento */}
        <form onSubmit={registraCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
              <Hash size={16} /> Codice Seriale Card (UID)
            </label>
            <input 
              type="text" 
              required
              placeholder="Poggia la card sul lettore USB..." 
              value={uid} 
              onChange={(e) => setUid(e.target.value)} 
              style={{ width: '100%', boxSizing: 'border-box', borderLeft: '4px solid #059669' }}
            />
            <small style={{ color: '#9ca3af', marginTop: '4px', display: 'block' }}>
              Clicca nel campo e avvicina il tag NFC al lettore per l'autocompilazione.
            </small>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
              <User size={16} /> Nome e Cognome Utente
            </label>
            <input 
              type="text" 
              required
              placeholder="Es. MARIO ROSSI" 
              value={nome} 
              onChange={(e) => setNome(e.target.value.toUpperCase())} 
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
              <GraduationCap size={16} /> Qualifica / Ruolo
            </label>
            <select 
              value={ruolo} 
              onChange={(e) => setRuolo(e.target.value)}
              style={{ 
                width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', 
                borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'white' 
              }}
            >
              <option value="Studente">Studente</option>
              <option value="Docente">Docente</option>
              <option value="Personale ATA">Personale ATA</option>
              <option value="DSGA">DSGA</option>
              <option value="Dirigente">Dirigente</option>
              <option value="Collaboratore Dirigente">Collaboratore Dirigente</option>
              <option value="Esterno">Ospite / Esterno</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ backgroundColor: '#059669', padding: '15px', marginTop: '10px', fontSize: '1.1rem', justifyContent: 'center' }}>
            {loading ? 'Registrazione in corso...' : <><Save size={20} /> Salva Nuova Card</>}
          </button>
        </form>

        {/* Anteprima Card Virtuale in Tempo Reale */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h4 style={{ color: '#9ca3af', marginBottom: '15px', fontWeight: '500' }}>Anteprima Card</h4>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
            borderRadius: '16px', padding: '25px', color: 'white', 
            width: '100%', maxWidth: '350px',
            boxShadow: '0 15px 30px -10px rgba(5, 150, 105, 0.4)',
            position: 'relative', overflow: 'hidden', minHeight: '180px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <CreditCard size={150} />
            </div>
            
            <div>
              <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase' }}>
                IPSSAT Rocco Chinnici
              </p>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', minHeight: '33px' }}>
                {nome ? nome : 'NOME UTENTE'}
              </h2>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '0.75rem', opacity: 0.8 }}>Qualifica</p>
                <p style={{ margin: 0, fontWeight: '600' }}>{ruolo}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 2px 0', fontSize: '0.75rem', opacity: 0.8 }}>UID Seriale</p>
                <p style={{ margin: 0, fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {uid ? uid : '.... .... ....'}
                </p>
              </div>
            </div>
          </div>
          
          {uid && nome && (
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.9rem', fontWeight: '500', animation: 'fadeIn 0.3s ease-in' }}>
              <CheckCircle size={18} /> Pronta per la registrazione
            </div>
          )}
        </div>

      </div>
    </div>
  );
}