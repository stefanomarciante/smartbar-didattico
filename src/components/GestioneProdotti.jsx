import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Coffee, Pizza, Cake, Utensils, CupSoda, Package, 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, Tag, Euro, Image as ImageIcon 
} from 'lucide-react';

export default function GestioneProdotti() {
  const [categorie, setCategorie] = useState([]);
  const [prodotti, setProdotti] = useState([]);
  const [categoriaAttiva, setCategoriaAttiva] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Stati form
  const [nuovoNome, setNuovoNome] = useState('');
  const [nuovoPrezzo, setNuovoPrezzo] = useState('');
  const [nuovaIconaNome, setNuovaIconaNome] = useState('menu.png');

  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editPrezzo, setEditPrezzo] = useState('');
  const [editIconaNome, setEditIconaNome] = useState('');

  const percorsoBaseRPi = "/home/pi/CassaBarDidattico/icons/";

  // ELENCO DELLE ICONE LOCALI
  // Aggiungi qui i nomi esatti dei file .png che hai copiato nella cartella public/icons/
  const iconeDisponibili = [
    'menu.png',
    'coffee.png',
    'cappuccino.png',
    'croissant.png',
    'water-bottle.png',
    'sparkling-water-bottle.png',
    'pizza.png',
    'pizza_slice .png',
    'sandwich.png',
    'orange-juice.png',
    'tea_freddo.png',
    'tea.png',
    'chocolate.png',
    'bread.png',
    'cake.png',
    'focaccia.png',
  ];

  const fetchDati = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      setCategorie(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const prodSnap = await getDocs(collection(db, "products"));
      const prodList = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      prodList.sort((a, b) => a.name.localeCompare(b.name));
      setProdotti(prodList);
    } catch (error) {
      console.error("Errore nel caricamento:", error);
      alert("Impossibile caricare il listino.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDati();
  }, []);

  const getStileCategoria = (nomeCat) => {
    const n = (nomeCat || '').toLowerCase();
    if (n.includes('caff')) return { icona: <Coffee size={46} color="#b45309" fill="#fef3c7" style={{ filter: 'drop-shadow(0 6px 8px rgba(180,83,9,0.3))' }}/>, colore: '#b45309', ombra: 'rgba(180,83,9,0.4)' };
    if (n.includes('rost')) return { icona: <Pizza size={46} color="#ea580c" fill="#ffedd5" style={{ filter: 'drop-shadow(0 6px 8px rgba(234,88,12,0.3))' }}/>, colore: '#ea580c', ombra: 'rgba(234,88,12,0.4)' };
    if (n.includes('past')) return { icona: <Cake size={46} color="#db2777" fill="#fce7f3" style={{ filter: 'drop-shadow(0 6px 8px rgba(219,39,119,0.3))' }}/>, colore: '#db2777', ombra: 'rgba(219,39,119,0.4)' };
    if (n.includes('rist')) return { icona: <Utensils size={46} color="#0284c7" fill="#bae6fd" style={{ filter: 'drop-shadow(0 6px 8px rgba(2,132,199,0.3))' }}/>, colore: '#0284c7', ombra: 'rgba(2,132,199,0.4)' };
    if (n.includes('bev')) return { icona: <CupSoda size={46} color="#059669" fill="#a7f3d0" style={{ filter: 'drop-shadow(0 6px 8px rgba(5,150,105,0.3))' }}/>, colore: '#059669', ombra: 'rgba(5,150,105,0.4)' };
    return { icona: <Package size={46} color="#4b5563" fill="#e5e7eb" style={{ filter: 'drop-shadow(0 6px 8px rgba(75,85,99,0.3))' }}/>, colore: '#4b5563', ombra: 'rgba(75,85,99,0.4)' };
  };

  const aggiungiProdotto = async (e) => {
    e.preventDefault();
    const prezzoNum = parseFloat(nuovoPrezzo);
    if (!nuovoNome.trim() || isNaN(prezzoNum) || prezzoNum <= 0 || !categoriaAttiva) return;

    try {
      await addDoc(collection(db, "products"), {
        name: nuovoNome.trim(),
        price: prezzoNum,
        category_id: categoriaAttiva.id,
        icon: `${percorsoBaseRPi}${nuovaIconaNome}` 
      });
      setNuovoNome('');
      setNuovoPrezzo('');
      setNuovaIconaNome('menu.png');
      fetchDati();
    } catch (error) {
      console.error("Errore aggiunta:", error);
    }
  };

  const salvaModifica = async (id) => {
    const prezzoNum = parseFloat(editPrezzo);
    if (!editNome.trim() || isNaN(prezzoNum) || prezzoNum <= 0) return;

    try {
      await updateDoc(doc(db, "products", id), {
        name: editNome.trim(),
        price: prezzoNum,
        icon: `${percorsoBaseRPi}${editIconaNome}`
      });
      setEditingId(null);
      fetchDati();
    } catch (error) {
      console.error("Errore modifica:", error);
    }
  };

  const eliminaProdotto = async (id, nome) => {
    if (!window.confirm(`Eliminare "${nome}"? Verrà rimosso dai POS.`)) return;
    try {
      await deleteDoc(doc(db, "products", id));
      fetchDati();
    } catch (error) {
      console.error("Errore:", error);
    }
  };

  const avviaModifica = (prod) => {
    setEditingId(prod.id);
    setEditNome(prod.name);
    setEditPrezzo(prod.price);
    setEditIconaNome(prod.icon ? prod.icon.replace(percorsoBaseRPi, '') : 'menu.png');
  };

  const prodottiFiltrati = categoriaAttiva ? prodotti.filter(p => p.category_id === categoriaAttiva.id) : [];

  // Selettore visivo che carica le immagini dalla cartella locale public/icons/
  const SelettoreIcone = ({ iconaSelezionata, setIconaSelezionata }) => (
    <div style={{ marginTop: '15px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
        <ImageIcon size={16} /> Seleziona Icona POS
      </label>
      
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
        {iconeDisponibili.map((nomeIcona) => {
          const isSelected = iconaSelezionata === nomeIcona;
          return (
            <div 
              key={nomeIcona}
              onClick={() => setIconaSelezionata(nomeIcona)}
              style={{ 
                flexShrink: 0, width: '70px', padding: '8px', cursor: 'pointer',
                background: isSelected ? '#f5f3ff' : 'white',
                border: isSelected ? `2px solid ${getStileCategoria(categoriaAttiva.name).colore}` : '1px solid #e5e7eb',
                borderRadius: '12px', transition: 'all 0.2s', textAlign: 'center'
              }}
            >
              <img 
                src={`/icons/${nomeIcona}`} 
                alt={nomeIcona} 
                onError={(e) => { e.target.src = '/logo-scuola.png'; e.target.style.opacity = 0.3; }}
                style={{ width: '40px', height: '40px', objectFit: 'contain', margin: '0 auto', display: 'block' }} 
              />
              <p style={{ margin: '5px 0 0 0', fontSize: '0.7rem', color: isSelected ? '#374151' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nomeIcona}
              </p>
            </div>
          );
        })}
      </div>
      <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>
        Percorso finale generato: {percorsoBaseRPi}<strong>{iconaSelezionata}</strong>
      </p>
    </div>
  );

  return (
    <div className="panel" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {!categoriaAttiva ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
            <div style={{ background: '#ede9fe', padding: '12px', borderRadius: '12px', color: '#7c3aed' }}>
              <Coffee size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#1f2937' }}>Gestione Reparti Bar</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Seleziona una categoria per gestirne il listino</p>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>Caricamento reparti...</p>
          ) : (
            <div className="dashboard-grid-3d">
              {categorie.map(cat => {
                const stile = getStileCategoria(cat.name);
                return (
                  <div key={cat.id} className="glass-card-3d" style={{ '--glass-color': stile.colore, '--glass-shadow': stile.ombra }} onClick={() => setCategoriaAttiva(cat)}>
                    <div className="icon-wrapper-3d">{stile.icona}</div>
                    <h3 className="glass-title">{cat.name}</h3>
                    <p className="glass-desc">{prodotti.filter(p => p.category_id === cat.id).length} Prodotti</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (

        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
            <button onClick={() => setCategoriaAttiva(null)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontWeight: '600', padding: '8px', borderRadius: '8px' }}>
              <ArrowLeft size={20} /> Indietro
            </button>
            <div style={{ width: '2px', height: '30px', background: '#e5e7eb' }}></div>
            <div>
              <h2 style={{ margin: 0, color: getStileCategoria(categoriaAttiva.name).colore }}>{categoriaAttiva.name}</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Gestione listino reparto</p>
            </div>
          </div>

          <form onSubmit={aggiungiProdotto} style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 200px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}><Tag size={16} /> Nome Prodotto</label>
                <input type="text" required value={nuovoNome} onChange={(e) => setNuovoNome(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}><Euro size={16} /> Prezzo</label>
                <input type="number" step="0.10" required value={nuovoPrezzo} onChange={(e) => setNuovoPrezzo(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ backgroundColor: getStileCategoria(categoriaAttiva.name).colore, padding: '11px 20px', height: 'fit-content' }}>
                <Plus size={18} /> Aggiungi
              </button>
            </div>
            
            <SelettoreIcone iconaSelezionata={nuovaIconaNome} setIconaSelezionata={setNuovaIconaNome} />
          </form>

          <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <table className="data-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Prodotto</th>
                  <th style={{ width: '15%' }}>Prezzo</th>
                  <th style={{ width: '25%' }}>Icona</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {prodottiFiltrati.map(prod => (
                  <tr key={prod.id}>
                    <td colSpan={editingId === prod.id ? "4" : "1"} style={editingId === prod.id ? { padding: '15px', background: '#f8fafc' } : {}}>
                      {editingId === prod.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} style={{ flex: 2 }} />
                            <input type="number" step="0.10" value={editPrezzo} onChange={(e) => setEditPrezzo(e.target.value)} style={{ flex: 1 }} />
                          </div>
                          
                          <SelettoreIcone iconaSelezionata={editIconaNome} setIconaSelezionata={setEditIconaNome} />
                          
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => salvaModifica(prod.id)} className="btn-primary" style={{ background: '#10b981' }}><Save size={16} /> Salva Modifiche</button>
                            <button onClick={() => setEditingId(null)} className="btn-logout"><X size={16} /> Annulla</button>
                          </div>
                        </div>
                      ) : (
                        <strong style={{ color: '#374151' }}>{prod.name}</strong>
                      )}
                    </td>
                    
                    {editingId !== prod.id && (
                      <>
                        <td><span style={{ fontWeight: '500', color: getStileCategoria(categoriaAttiva.name).colore }}>€ {parseFloat(prod.price).toFixed(2)}</span></td>
                        <td>
                          {/* Mostra l'immagine locale nella tabella usando lo stesso nome file */}
                          {prod.icon ? (
                            <img 
                              src={`/icons/${prod.icon.replace(percorsoBaseRPi, '')}`} 
                              alt="icon" 
                              onError={(e) => { e.target.src = '/logo-scuola.png'; e.target.style.opacity = 0.3; }}
                              style={{ height: '30px', objectFit: 'contain' }} 
                            />
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Nessuna immagine</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => avviaModifica(prod)} style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Edit2 size={16} /></button>
                            <button onClick={() => eliminaProdotto(prod.id, prod.name)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}