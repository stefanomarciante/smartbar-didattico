import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Activity, Power, Thermometer, CheckCircle, XCircle, Server, MonitorSmartphone, Wifi } from 'lucide-react';

export default function StatusPOS() {
  const [posList, setPosList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ascolto in tempo reale dello stato dei POS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pos_status"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordina per nome POS
      lista.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setPosList(lista);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Funzione per inviare il comando di riavvio ai Raspberry
  const eseguiRiavvioGlobale = async () => {
    const conferma = window.confirm("⚠️ ATTENZIONE: Sei sicuro di voler RIAVVIARE tutti i POS in tutti i plessi? L'operazione impiegherà circa 1 minuto e interromperà eventuali transazioni in corso.");
    
    if (conferma) {
      try {
        await setDoc(doc(db, "system", "commands"), {
          action: "reboot_all",
          timestamp: serverTimestamp()
        }, { merge: true });
        
        alert("✅ Comando di riavvio inviato con successo! Attendi qualche istante per vedere i POS andare offline e poi tornare online.");
      } catch (error) {
        console.error("Errore invio comando di riavvio:", error);
        alert("❌ Errore durante l'invio del comando. Verifica la connessione.");
      }
    }
  };

  // Calcola se il POS è online (ultimo segnale ricevuto meno di 2 minuti fa)
  const isOnline = (timestamp) => {
    if (!timestamp) return false;
    // Converte il timestamp di Firebase in Date
    const lastPing = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffSecondi = (new Date() - lastPing) / 1000;
    return diffSecondi < 120; // 120 secondi = 2 minuti
  };

  return (
    <div className="panel" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Intestazione e Pulsante Riavvio */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '12px', color: '#4b5563' }}>
            <Activity size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#1f2937' }}>Control Room</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Telemetria e controllo remoto flotta POS Bar Didattico</p>
          </div>
        </div>

        <button 
          onClick={eseguiRiavvioGlobale}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#dc2626', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Power size={20} /> Forza Riavvio Globale
        </button>
      </div>

      {/* Griglia Dispositivi */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Connessione ai terminali in corso...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {posList.map(pos => {
            const online = isOnline(pos.last_ping);
            
            return (
              <div key={pos.id} style={{ 
                background: 'white', border: `1px solid ${online ? '#10b981' : '#ef4444'}`, borderRadius: '16px', padding: '20px', 
                boxShadow: `0 10px 15px -3px ${online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
                position: 'relative', overflow: 'hidden'
              }}>
                {/* Indicatore Stato Superiore */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MonitorSmartphone size={24} color={online ? '#10b981' : '#6b7280'} />
                    <div>
                      <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem' }}>{pos.name || pos.id}</h3>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>Plesso: <strong>{pos.plesso || 'Non specificato'}</strong></p>
                    </div>
                  </div>
                  
                  {online ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#d1fae5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                      <CheckCircle size={14} /> ONLINE
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                      <XCircle size={14} /> OFFLINE
                    </span>
                  )}
                </div>

                {/* Dati Telemetria */}
                <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '0.9rem' }}><Thermometer size={16} /> Temp. CPU</span>
                    <span style={{ fontWeight: '600', color: (pos.cpu_temp > 70) ? '#dc2626' : '#374151' }}>
                      {pos.cpu_temp ? `${parseFloat(pos.cpu_temp).toFixed(1)} °C` : 'N/D'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '0.9rem' }}><Server size={16} /> Indirizzo IP</span>
                    <span style={{ fontWeight: '500', color: '#374151', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {pos.ip_address || 'Sconosciuto'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '0.85rem' }}><Wifi size={14} /> Ultimo Segnale</span>
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      {pos.last_ping?.toDate ? pos.last_ping.toDate().toLocaleTimeString('it-IT') : 'Mai'}
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
          {posList.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '16px', border: '1px dashed #d1d5db', color: '#6b7280' }}>
              <Activity size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <p>Nessun terminale POS registrato nel sistema.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}