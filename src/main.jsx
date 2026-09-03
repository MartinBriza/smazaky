import React from 'react';
import ReactDOM from 'react-dom/client';
import restaurants from './data';
import './styles.css';

// Format the displayed price. When the source data does not include a price,
// we intentionally show N/A instead of an empty value or invalid text.
const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return `${value} Kč`;
};

// The main application view:
// - renders a heading
// - loops over all restaurant entries
// - shows the dish name and a formatted price for each item
function App() {
  return (
    <main className="app">
      <h1>Brno – Smažený sýr</h1>
      <p className="subtitle">Cena za nabídku v restauraci</p>
      <div className="list">
        {restaurants.map((restaurant) => (
          <article key={restaurant.id ?? `${restaurant.name}-${restaurant.address}`} className="card">
            <div className="name-row">
              <h2>{restaurant.name}</h2>
            </div>
            <p className="dish">{restaurant.dish}</p>
            <div className="price-row">
              <span className="label">Cena:</span>
              <strong>{formatPrice(restaurant.price)}</strong>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

// Boot the React application into the root element defined in index.html.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
