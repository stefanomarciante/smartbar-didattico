import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserPlus, CreditCard, User, Hash, GraduationCap, CheckCircle, Save, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';

export default function NuovaCard() {
  const [uid, setUid] = useState('');
  const [nome, setNome] = useState('');
  const [ruolo, setRuolo] = useState('Studente');
  const [loading, setLoading] = useState(false);
  const [lettoreConnesso, setLettoreConnesso] = useState(false);
  const [ultimoUidLettore, setUltimoUidLettore] = useState('');
  const [avvisoEsistente, setAvvisoEsistente] = useState('');

  const ultimoScanId = useRef(null);

  // Ascolto in tempo reale della collezione dedicata nfc_reader/ultimo_scan
  useEffect(() => {
    const readerRef = doc(db, "nfc_reader", "ultimo_scan");
    const unsubscribe = onSnapshot(readerRef, (docSnap) => {
      if (docSnap.exists()) {
        setLettoreConnesso(true);
        const data = docSnap.data();
        const uidLetto = (data.uid || '').trim().toUpperCase();
        const scanAttuale = data.scan_id || data.timestamp || uidLetto;

        setUltimoUidLettore(uidLetto);

        // Compila automaticamente la casella solo se c'è un UID non vuoto e nuovo
        if (uidLetto && ultimoScanId.current !== scanAttuale) {
          ultimoScanId.current = scanAttuale;
          setUid(uidLetto);
          verificaSeEsiste(uidLetto);
        }
      }
    }, (error) => {
      console.error("Errore ascolto lettore NFC:", error);
    });

    return () => unsubscribe();
  }, []);

  // Verifica se l'UID è già registrato nella collezione "cards"
  const verificaSeEsiste = async (codiceUid) => {
    setAvvisoEsistente('');
    if (!codiceUid) return;
    try {
      const docRef = doc(db, "cards", codiceUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAvvisoEsistente(`Attenzione: chiavetta già assegnata a ${docSnap.data().holder_name}`);
      }
    } catch (err) {
      console.error("Errore verifica UID:", err);
    }
  };

  // Pulsante manuale per richiamare l'ultimo UID letto dal Pico
  const caricaUltimoUid = () => {
    if (ultimoUidLettore) {
      setUid(ultimoUidLettore);
      verificaSeEsiste(ultimoUidLettore);
    } else {
      alert("Nessun UID in memoria sul lettore. Avvicina una chiavetta al Pico 2W.");
    }
  };

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
    const readerRef = doc(db, "nfc_reader", "ultimo_scan");

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        alert(`Attenzione! Questa card è già associata a: ${docSnap.data().holder_name}. Impossibile sovrascriverla.`);
        setLoading(false);
        return;
      }

      // 1. Salva la nuova card nella collezione "cards"
      await setDoc(docRef, {
        holder_name: nomePulito,
        role: ruolo,
        credit: 0,
        createdAt: serverTimestamp()
      });

      // 2. Svuota il buffer temporaneo di nfc_reader/ultimo_scan per non riproporre lo stesso UID
      await setDoc(readerRef, {
        uid: "",
        scan_id: ""
      });

      alert(`Card ${uidPulito} associata con successo a ${nomePulito}!`);
      
      // 3. Resetta il form locale
      setUid('');
      setNome('');
      setRuolo('Studente');
      setUltimoUidLettore('');
      setAvvisoEsistente('');
      ultimoScanId.current = null;

    } catch (error) {
      console.error("Errore registrazione card:", error);
      alert("Si è verificato un errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Intestazione con stato Lettore NFC */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '12px', color: '#059669' }}>
            <UserPlus size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#1f2937' }}>Registrazione Nuova Card</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Associa un nuovo utente a un supporto fisico NFC</p>
          </div>
        </div>

        {/* Badge Stato Lettore Pico 2W */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', 
          background: lettoreConnesso ? '#ecfdf5' : '#f3f4f6', 
          color: lettoreConnesso ? '#059669' : '#6b7280', 
          padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
          border: `1px solid ${lettoreConnesso ? '#a7f3d0' : '#e5e7eb'}`
        }}>
          <Wifi size={14} />
          {lettoreConnesso ? `Lettore Attivo (${ultimoUidLettore || 'In attesa card...'})` : 'In ascolto lettore NFC...'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        
        {/* Modulo di Inserimento */}
        <form onSubmit={registraCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={16} /> Codice Seriale Card (UID)
              </span>
              {ultimoUidLettore && (
                <button 
                  type="button" 
                  onClick={caricaUltimoUid}
                  style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={12} /> Usa ultimo letto ({ultimoUidLettore})
                </button>
              )}
            </label>
            <input 
              type="text" 
              required
              placeholder="Avvicina la chiavetta al lettore NFC..." 
              value={uid} 
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setUid(val);
                verificaSeEsiste(val.trim());
              }} 
              style={{ 
                width: '100%', boxSizing: 'border-box', 
                borderLeft: `4px solid ${avvisoEsistente ? '#f59e0b' : '#059669'}`,
                fontFamily: 'monospace', fontWeight: '700', letterSpacing: '1px', fontSize: '1.05rem'
              }}
            />
            {avvisoEsistente ? (
              <small style={{ color: '#d97706', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                <AlertTriangle size={14} /> {avvisoEsistente}
              </small>
            ) : (
              <small style={{ color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                Dopo il salvataggio il buffer del lettore viene azzerato automaticamente.
              </small>
            )}
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

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !!avvisoEsistente} 
            style={{ 
              backgroundColor: avvisoEsistente ? '#9ca3af' : '#059669', 
              padding: '15px', marginTop: '10px', fontSize: '1.1rem', justifyContent: 'center',
              cursor: avvisoEsistente ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Registrazione in corso...' : <><Save size={20} /> Salva Nuova Card</>}
          </button>
        </form>

        {/* Anteprima Card Virtuale in Tempo Reale */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h4 style={{ color: '#9ca3af', marginBottom: '15px', fontWeight: '500' }}>Anteprima Card</h4>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
            borderRadius: '16px', padding: '25px', color: 'white', 
            width: '100%', maxWidth: '350px', boxSizing: 'border-box',
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
                <p style={{ margin: 0, fontFamily: 'monospace', letterSpacing: '1px', fontWeight: '700' }}>
                  {uid ? uid : '.... .... ....'}
                </p>
              </div>
            </div>
          </div>
          
          {uid && nome && !avvisoEsistente && (
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.9rem', fontWeight: '500', animation: 'fadeIn 0.3s ease-in' }}>
              <CheckCircle size={18} /> Pronta per la registrazione
            </div>
          )}
        </div>

      </div>
    </div>
  );
}