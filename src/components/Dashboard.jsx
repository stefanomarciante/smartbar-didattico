import { useNavigate } from 'react-router-dom';
import { CreditCard, PlusCircle, History, Coffee, UserCog, Activity } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const menuItems = [
    {
      titolo: "Ricarica Card",
      descrizione: "Aggiungi credito alle chiavette",
      // Icona Bicolore: Bordo blu scuro, interno azzurro chiaro, con ombra
      icona: <CreditCard size={46} strokeWidth={1.5} color="#0284c7" fill="#bae6fd" style={{ filter: 'drop-shadow(0 6px 8px rgba(2, 132, 199, 0.3))' }} />,
      rotta: "/ricariche",
      colore: "#0284c7", // Blu
      ombra: "rgba(2, 132, 199, 0.4)"
    },
    {
      titolo: "Nuova Card",
      descrizione: "Registra e associa nuovi utenti",
      // Icona Bicolore: Bordo verde smeraldo, interno verde pastello
      icona: <PlusCircle size={46} strokeWidth={1.5} color="#059669" fill="#a7f3d0" style={{ filter: 'drop-shadow(0 6px 8px rgba(5, 150, 105, 0.3))' }} />,
      rotta: "/nuova-card",
      colore: "#059669", // Verde
      ombra: "rgba(5, 150, 105, 0.4)"
    },
    {
      titolo: "Modifica Utente",
      descrizione: "Aggiorna i dati di una card esistente",
      // Icona Bicolore: Bordo indaco, interno azzurro chiaro
      icona: <UserCog size={46} strokeWidth={1.5} color="#4f46e5" fill="#e0e7ff" style={{ filter: 'drop-shadow(0 6px 8px rgba(79, 70, 229, 0.3))' }} />,
      rotta: "/modifica-utente",
      colore: "#4f46e5", // Indaco
      ombra: "rgba(79, 70, 229, 0.4)"
    },
    {
      titolo: "Storico Globale",
      descrizione: "Visualizza tutte le transazioni",
      // Icona Bicolore: Bordo arancio bruciato, interno pesca/oro
      icona: <History size={46} strokeWidth={1.5} color="#ea580c" fill="#fed7aa" style={{ filter: 'drop-shadow(0 6px 8px rgba(234, 88, 12, 0.3))' }} />,
      rotta: "/storico",
      colore: "#ea580c", // Arancio
      ombra: "rgba(234, 88, 12, 0.4)"
    },
    {
      titolo: "Gestione Prodotti",
      descrizione: "Modifica listino prezzi del bar",
      // Icona Bicolore: Bordo viola scuro, interno lavanda
      icona: <Coffee size={46} strokeWidth={1.5} color="#7c3aed" fill="#ddd6fe" style={{ filter: 'drop-shadow(0 6px 8px rgba(124, 58, 237, 0.3))' }} />,
      rotta: "/prodotti",
      colore: "#7c3aed", // Viola
      ombra: "rgba(124, 58, 237, 0.4)"
    },
    {
      titolo: "Control Room",
      descrizione: "Telemetria e gestione remota POS",
      icona: <Activity size={46} strokeWidth={1.5} color="#4b5563" fill="#e5e7eb" style={{ filter: 'drop-shadow(0 6px 8px rgba(75, 85, 99, 0.3))' }} />,
      rotta: "/control-room", // Rotta aggiornata
      colore: "#4b5563", 
      ombra: "rgba(75, 85, 99, 0.4)"
    }
  ];

  return (
    <div className="dashboard-wrapper">
      <h2 className="dashboard-wrapper-title">Seleziona un'operazione rapida</h2>
      
      <div className="dashboard-grid-3d">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            className="glass-card-3d"
            style={{ 
              '--glass-color': item.colore,
              '--glass-shadow': item.ombra
            }}
            onClick={() => navigate(item.rotta)} // Usiamo di nuovo solo il navigate
          >
            <div className="icon-wrapper-3d">
              {item.icona}
            </div>
            <h3 className="glass-title">{item.titolo}</h3>
            <p className="glass-desc">{item.descrizione}</p>
          </div>
        ))}
      </div>
    </div>
  );
}