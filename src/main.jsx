import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import restaurants from './data';
import './styles.css';
import plainIconUrl from './assets/icon-cheese-plain.svg';
import friesIconUrl from './assets/icon-cheese-fries.svg';
import potatoesIconUrl from './assets/icon-cheese-potatoes.svg';
import bunIconUrl from './assets/icon-cheese-bun.svg';
import unknownIconUrl from './assets/icon-cheese-unknown.svg';

// Fix the default Leaflet marker assets so they work correctly when the app is
// bundled and served from a static site or GitHub Pages.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const restaurantIconMap = {
  plain: plainIconUrl,
  fries: friesIconUrl,
  potatoes: potatoesIconUrl,
  bun: bunIconUrl,
  unknown: unknownIconUrl,
};

const getRestaurantIconType = (restaurant) => {
  const description = `${restaurant?.dish ?? ''} ${restaurant?.side_details ?? ''}`.toLowerCase();

  if (description.includes('bulka') || description.includes('v bulce') || description.includes('chléb')) {
    return 'bun';
  }

  if (description.includes('brambor') || description.includes('vařené brambory') || description.includes('brambory')) {
    return 'potatoes';
  }

  if (description.includes('hranol') || description.includes('fries')) {
    return 'fries';
  }

  if (description.includes('smažený sýr') && restaurant?.with_side === false) {
    return 'plain';
  }

  if (description.includes('smažený sýr')) {
    return 'plain';
  }

  return 'unknown';
};

const createRestaurantIcon = (restaurant) => {
  const iconType = getRestaurantIconType(restaurant);
  const iconUrl = restaurantIconMap[iconType] ?? restaurantIconMap.unknown;
  const label = restaurant?.dish ?? 'Smažený sýr';

  const markerSize = 32 * 1.3;

  return L.divIcon({
    className: 'restaurant-marker-icon',
    html: `<img src="${iconUrl}" alt="${label}" title="${label}" style="display:block;width:${markerSize}px;height:${markerSize}px;pointer-events:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.28));" />`,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    popupAnchor: [0, -markerSize * 0.5],
  });
};

// Format the displayed price. When the source data does not include a price,
// we intentionally show N/A instead of an empty value or invalid text.
const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return `${value} Kč`;
};

// Normalizes the restaurant coordinates and ensures the map has valid values.
const toNumber = (value) => Number(value);

// A small helper that keeps the map centered on the currently selected restaurant.
function MapFocus({ selectedRestaurant }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedRestaurant) return;

    const latitude = toNumber(selectedRestaurant.lat);
    const longitude = toNumber(selectedRestaurant.lng);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      map.flyTo([latitude, longitude], 14, { duration: 1.2 });
    }
  }, [map, selectedRestaurant]);

  return null;
}

// The restaurant list stays available and can be used to focus the map.
function RestaurantList({ restaurantsList, selectedRestaurantId, onSelectRestaurant }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Restaurace</h2>
        <span>{restaurantsList.length}</span>
      </div>

      <div className="restaurant-list">
        {restaurantsList.map((restaurant) => {
          const isSelected = restaurant.id === selectedRestaurantId;

          return (
            <button
              key={restaurant.id ?? `${restaurant.name}-${restaurant.address}`}
              type="button"
              className={`restaurant-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectRestaurant(restaurant)}
            >
              <div className="restaurant-card__title-row">
                <h3>{restaurant.name}</h3>
              </div>
              <p className="restaurant-card__dish">{restaurant.dish}</p>
              <div className="restaurant-card__meta">
                <span>Cena</span>
                <strong>{formatPrice(restaurant.price)}</strong>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// Main application layout:
// - map on the right or top on mobile
// - list view on the left or bottom on mobile
// - clicking a list item focuses the map on that venue
function App() {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  const validRestaurants = useMemo(
    () =>
      restaurants.filter((restaurant) => {
        const latitude = toNumber(restaurant.lat);
        const longitude = toNumber(restaurant.lng);
        return Number.isFinite(latitude) && Number.isFinite(longitude);
      }),
    [],
  );

  const selectedRestaurant =
    validRestaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? validRestaurants[0] ?? null;

  const mapCenter = selectedRestaurant
    ? [toNumber(selectedRestaurant.lat), toNumber(selectedRestaurant.lng)]
    : [49.1951, 16.6068];

  const handleRestaurantSelect = (restaurant) => {
    setSelectedRestaurantId(restaurant.id);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Brno food map</p>
          <h1>Brno – Smažený sýr</h1>
        </div>
        <p className="subtitle">Klikni na restauraci v seznamu pro přesun na mapu.</p>
      </header>

      <div className="content-grid">
        <RestaurantList
          restaurantsList={validRestaurants}
          selectedRestaurantId={selectedRestaurant?.id ?? null}
          onSelectRestaurant={handleRestaurantSelect}
        />

        <section className="map-panel" aria-label="Map of Brno fried-cheese restaurants">
          <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="map-container">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {validRestaurants.map((restaurant) => {
              const latitude = toNumber(restaurant.lat);
              const longitude = toNumber(restaurant.lng);

              return (
                <Marker
                  key={restaurant.id ?? `${restaurant.name}-${restaurant.address}`}
                  position={[latitude, longitude]}
                  icon={createRestaurantIcon(restaurant)}
                >
                  <Popup>
                    <div className="popup-content">
                      <strong>{restaurant.name}</strong>
                      <span>{restaurant.dish}</span>
                      <em>{formatPrice(restaurant.price)}</em>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {selectedRestaurant && <MapFocus selectedRestaurant={selectedRestaurant} />}
          </MapContainer>
        </section>
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
