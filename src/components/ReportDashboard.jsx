import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; 

export default function ReportDashboard() {
  const [showSpesaForm, setShowSpesaForm] = useState(false);
  
  // Stati per i dati reali
  const [kpi, setKpi] = useState({ ricariche: 0, consumi: 0, spese: 0, netto: 0 });
  const [trendData, setTrendData] = useState([]);
  const [plessiData, setPlessiData] = useState([]);
  const [loadingDati, setLoadingDati] = useState(true);

  // Stati per il form
  const [importo, setImporto] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [plesso, setPlesso] = useState('Nicolosi');
  const [categoria, setCategoria] = useState('Forniture');

  // Funzione per caricare ed elaborare i dati da Firebase
  const fetchDashboardData = async () => {
    try {
      // 1. Recupera le Spese (Verrà creata in automatico al primo salvataggio)
      const speseSnapshot = await getDocs(collection(db, 'expenses'));
      const speseList = speseSnapshot.docs.map(doc => doc.data());

      // 2. Recupera le Transazioni puntando alla collezione esatta del tuo DB
      const storicoSnapshot = await getDocs(collection(db, 'transazioni')); 
      const storicoList = storicoSnapshot.docs.map(doc => doc.data());

      // Elaborazione Variabili Temporanee
      let totRicariche = 0;
      let totConsumi = 0;
      let totSpese = 0;
      const andamentoGiornaliero = {};
      const incassiPerPlesso = {};

      // Calcolo Spese
      speseList.forEach(spesa => {
        const val = parseFloat(spesa.amount) || 0;
        totSpese += val;
        
        const dataKey = spesa.date ? spesa.date.split('T')[0] : 'N/D';
        if (!andamentoGiornaliero[dataKey]) andamentoGiornaliero[dataKey] = { data: dataKey, ricariche: 0, consumi: 0, spese: 0 };
        andamentoGiornaliero[dataKey].spese += val;
      });

      // Calcolo Transazioni
      storicoList.forEach(transazione => {
        // Verifica che nel database il costo si chiami 'importo' e la tipologia 'tipo'
        const val = parseFloat(transazione.importo) || 0;
        const tipo = transazione.tipo; 
        const nomePlesso = transazione.plesso || 'Sconosciuto';
        
        let dataKey = 'N/D';
        if (transazione.data) {
          dataKey = transazione.data.toDate ? transazione.data.toDate().toISOString().split('T')[0] : String(transazione.data).split('T')[0];
        }

        if (!andamentoGiornaliero[dataKey]) {
          andamentoGiornaliero[dataKey] = { data: dataKey, ricariche: 0, consumi: 0, spese: 0 };
        }

        // Modifica 'ricarica' se nel tuo DB usi un termine diverso (es. 'recharge')
        if (tipo === 'ricarica') {
          totRicariche += val;
          andamentoGiornaliero[dataKey].ricariche += val;
        } else {
          totConsumi += val;
          andamentoGiornaliero[dataKey].consumi += val;

          // Escludiamo il pos di test dalle statistiche plessi
          if (nomePlesso !== 'Lab. Sviluppo') {
            if (!incassiPerPlesso[nomePlesso]) incassiPerPlesso[nomePlesso] = 0;
            incassiPerPlesso[nomePlesso] += val;
          }
        }
      });

      // Aggiorna gli Stati React
      setKpi({
        ricariche: totRicariche,
        consumi: totConsumi,
        spese: totSpese,
        netto: totRicariche - totSpese
      });

      const arrayAndamento = Object.values(andamentoGiornaliero).sort((a, b) => a.data.localeCompare(b.data));
      setTrendData(arrayAndamento);

      const arrayPlessi = Object.keys(incassiPerPlesso).map(key => ({
        plesso: key,
        incassi: incassiPerPlesso[key]
      }));
      setPlessiData(arrayPlessi);
      setLoadingDati(false);

    } catch (error) {
      console.error("Errore nel recupero dati Firebase:", error);
      setLoadingDati(false);
    }
  };

  // Esegue il fetch al caricamento del componente
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Salvataggio Spesa
  const handleAggiungiSpesa = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'expenses'), {
        amount: parseFloat(importo),
        description: descrizione,
        plesso: plesso,
        category: categoria,
        date: new Date().toISOString(),
        timestamp: new Date()
      });
      alert('Spesa registrata con successo!');
      setShowSpesaForm(false);
      setImporto('');
      setDescrizione('');
      fetchDashboardData(); // Ricarica in tempo reale
    } catch (error) {
      console.error("Errore salvataggio spesa: ", error);
      alert("Errore nel salvataggio della spesa.");
    }
  };

  const cardStyle = { background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px', boxSizing: 'border-box' };

  if (loadingDati) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Sincronizzazione dati finanziari in corso...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Report e Statistiche</h2>
        <button 
          onClick={() => setShowSpesaForm(!showSpesaForm)}
          style={{ backgroundColor: showSpesaForm ? '#ef4444' : '#0284c7', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
        >
          {showSpesaForm ? 'Annulla' : '+ Registra Spesa'}
        </button>
      </div>
      
      {showSpesaForm && (
        <div style={{ ...cardStyle, marginBottom: '25px', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#334155', fontSize: '1.1rem' }}>Nuova Uscita Finanziaria</h3>
          <form onSubmit={handleAggiungiSpesa} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <label style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '600' }}>Importo (€)</label>
              <input type="number" step="0.01" required value={importo} onChange={(e) => setImporto(e.target.value)} style={inputStyle} placeholder="es. 45.50" />
            </div>
            <div style={{ flex: '3', minWidth: '200px' }}>
              <label style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '600' }}>Descrizione</label>
              <input type="text" required value={descrizione} onChange={(e) => setDescrizione(e.target.value)} style={inputStyle} placeholder="es. Rifornimento Acqua" />
            </div>
            <div style={{ flex: '2', minWidth: '150px' }}>
              <label style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '600' }}>Plesso</label>
              <select value={plesso} onChange={(e) => setPlesso(e.target.value)} style={inputStyle}>
                <option>Nicolosi</option>
                <option>Trecastagni</option>
                <option>Paternò</option>
                <option>Pedara</option>
                <option>Santa Maria di Licodia</option>
              </select>
            </div>
            <button type="submit" style={{ backgroundColor: '#1f2937', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', height: '39px' }}>
              Salva
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Totale Ricariche</h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#16a34a' }}>€ {kpi.ricariche.toFixed(2)}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Incassi (Consumi)</h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#2563eb' }}>€ {kpi.consumi.toFixed(2)}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Spese Sostenute</h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#dc2626' }}>€ {kpi.spese.toFixed(2)}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>Flusso Netto</h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: '#1f2937' }}>€ {kpi.netto.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
        
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#374151' }}>Andamento Finanziario</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ricariche" stroke="#16a34a" strokeWidth={3} name="Ricariche" />
                <Line type="monotone" dataKey="consumi" stroke="#2563eb" strokeWidth={3} name="Consumi" />
                <Line type="monotone" dataKey="spese" stroke="#dc2626" strokeWidth={3} name="Spese" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#374151' }}>Incassi per Plesso</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plessiData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="plesso" />
                <YAxis />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="incassi" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Incassi Totali" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}