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
import sideUnknownIconUrl from './assets/icon-cheese-side-unknown.svg';
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
  sideUnknown: sideUnknownIconUrl,
  unknown: unknownIconUrl,
};

const getRestaurantSideCategory = (restaurant) => {
  const description = `${restaurant?.dish ?? ''} ${restaurant?.side_details ?? ''}`.toLowerCase();
  const sideDetail = `${restaurant?.side_details ?? ''}`.toLowerCase();
  const hasSideIncluded = restaurant?.with_side === true;
  const hasGenericSide =
    sideDetail.includes('příloha') ||
    sideDetail.includes('priloha') ||
    sideDetail.includes('standardní příloha') ||
    sideDetail.includes('standardni priloha') ||
    sideDetail.includes('dle výběru') ||
    sideDetail.includes('dle vyberu') ||
    sideDetail.includes('podle menu') ||
    sideDetail.includes('součást ceny') ||
    sideDetail.includes('soucast ceny');

  if (description.includes('bulka') || description.includes('v bulce') || description.includes('chléb')) {
    return 'bun';
  }

  if (description.includes('brambor') || description.includes('vařené brambory') || description.includes('brambory')) {
    return 'potatoes';
  }

  if (description.includes('hranol') || description.includes('fries')) {
    return 'fries';
  }

  if (hasSideIncluded && hasGenericSide) {
    return 'sideUnknown';
  }

  if (description.includes('smažený sýr') && restaurant?.with_side === false) {
    return 'plain';
  }

  if (description.includes('smažený sýr')) {
    return 'plain';
  }

  return 'unknown';
};

const getRestaurantIconType = (restaurant) => getRestaurantSideCategory(restaurant);

const getDistrictName = (restaurant) => {
  const address = restaurant?.address ?? '';
  const matches = address.match(/Brno[-\s]([A-Za-zÀ-ž0-9]+(?:[- ][A-Za-zÀ-ž0-9]+)*)/i);

  if (!matches?.[1]) {
    return 'Brno';
  }

  const district = matches[1].trim().replace(/[-_]+/g, ' ');
  return district ? `Brno ${district}` : 'Brno';
};

const getPriceValue = (restaurant) => {
  const price = Number(restaurant?.price);
  return Number.isFinite(price) ? price : Number.MAX_SAFE_INTEGER;
};

const sortOptions = {
  default: { label: 'Výchozí', value: 'default' },
  cheapest: { label: 'Cena: nejlevnější', value: 'cheapest' },
  expensive: { label: 'Cena: nejdražší', value: 'expensive' },
};

const sideFilterOptions = [
  { value: 'all', label: 'Všechny přílohy' },
  { value: 'plain', label: 'Bez přílohy' },
  { value: 'fries', label: 'Hranolky' },
  { value: 'potatoes', label: 'Brambory' },
  { value: 'bun', label: 'V bulce' },
  { value: 'sideUnknown', label: 'Neznámá příloha' },
  { value: 'unknown', label: 'Jiná nabídka' },
];

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
function RestaurantList({
  restaurantsList,
  selectedRestaurantId,
  onSelectRestaurant,
  sortValue,
  onSortChange,
  districtFilter,
  onDistrictChange,
  sideFilter,
  onSideFilterChange,
  districtOptions,
  minPrice,
  maxPrice,
  minRange,
  maxRange,
  onMinPriceChange,
  onMaxPriceChange,
}) {
  const minPercent = ((minPrice - minRange) / (Math.max(maxRange - minRange, 1))) * 100;
  const maxPercent = ((maxPrice - minRange) / (Math.max(maxRange - minRange, 1))) * 100;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Restaurace</h2>
        <span>{restaurantsList.length}</span>
      </div>

      <div className="toolbar">
        <label className="field">
          <span>Řadit</span>
          <select value={sortValue} onChange={(event) => onSortChange(event.target.value)}>
            {Object.values(sortOptions).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Městská část</span>
          <select value={districtFilter} onChange={(event) => onDistrictChange(event.target.value)}>
            <option value="all">Všechny</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Příloha</span>
          <select value={sideFilter} onChange={(event) => onSideFilterChange(event.target.value)}>
            {sideFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="field field--inline">
          <span>Cena</span>
          <div className="price-value-row">
            <strong>{minPrice} Kč</strong>
            <strong>{maxPrice} Kč</strong>
          </div>
          <div
            className="dual-range"
            style={{
              '--min': `${minPercent}%`,
              '--max': `${maxPercent}%`,
            }}
          >
            <input
              type="range"
              min={minRange}
              max={maxRange}
              step="10"
              value={minPrice}
              onChange={(event) => onMinPriceChange(Math.min(Number(event.target.value), maxPrice - 10))}
              aria-label="Minimální cena"
            />
            <input
              type="range"
              min={minRange}
              max={maxRange}
              step="10"
              value={maxPrice}
              onChange={(event) => onMaxPriceChange(Math.max(Number(event.target.value), minPrice + 10))}
              aria-label="Maximální cena"
            />
          </div>
        </div>
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
                <span>{getDistrictName(restaurant)}</span>
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
  const [sortValue, setSortValue] = useState(sortOptions.cheapest.value);
  const [districtFilter, setDistrictFilter] = useState('all');
  const [sideFilter, setSideFilter] = useState('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);

  const validRestaurants = useMemo(
    () =>
      restaurants.filter((restaurant) => {
        const latitude = toNumber(restaurant.lat);
        const longitude = toNumber(restaurant.lng);
        return Number.isFinite(latitude) && Number.isFinite(longitude);
      }),
    [],
  );

  const districtOptions = useMemo(
    () =>
      [...new Set(validRestaurants.map((restaurant) => getDistrictName(restaurant)))].sort((left, right) =>
        left.localeCompare(right, 'cs'),
      ),
    [validRestaurants],
  );

  const baseFilteredRestaurants = useMemo(() => {
    let result = [...validRestaurants];

    if (districtFilter !== 'all') {
      result = result.filter((restaurant) => getDistrictName(restaurant) === districtFilter);
    }

    if (sideFilter !== 'all') {
      result = result.filter((restaurant) => getRestaurantSideCategory(restaurant) === sideFilter);
    }

    return result;
  }, [districtFilter, sideFilter, validRestaurants]);

  const priceBounds = useMemo(() => {
    const prices = baseFilteredRestaurants
      .map((restaurant) => getPriceValue(restaurant))
      .filter((price) => Number.isFinite(price) && price < Number.MAX_SAFE_INTEGER);

    if (prices.length === 0) {
      return { min: 0, max: 500 };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [baseFilteredRestaurants]);

  useEffect(() => {
    const nextMin = Math.min(Math.max(minPrice, priceBounds.min), priceBounds.max);
    const nextMax = Math.max(Math.min(maxPrice, priceBounds.max), priceBounds.min);

    if (nextMin !== minPrice || nextMax !== maxPrice) {
      setMinPrice(nextMin);
      setMaxPrice(nextMax);
    }
  }, [maxPrice, minPrice, priceBounds.max, priceBounds.min]);

  const filteredRestaurants = useMemo(() => {
    let result = [...baseFilteredRestaurants];

    result = result.filter((restaurant) => {
      const price = getPriceValue(restaurant);
      return price >= minPrice && price <= maxPrice;
    });

    if (sortValue === sortOptions.cheapest.value) {
      result.sort((left, right) => getPriceValue(left) - getPriceValue(right));
    } else if (sortValue === sortOptions.expensive.value) {
      result.sort((left, right) => getPriceValue(right) - getPriceValue(left));
    }

    return result;
  }, [baseFilteredRestaurants, maxPrice, minPrice, sortValue]);

  const selectedRestaurant =
    filteredRestaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? filteredRestaurants[0] ?? null;

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
          restaurantsList={filteredRestaurants}
          selectedRestaurantId={selectedRestaurant?.id ?? null}
          onSelectRestaurant={handleRestaurantSelect}
          sortValue={sortValue}
          onSortChange={setSortValue}
          districtFilter={districtFilter}
          onDistrictChange={setDistrictFilter}
          sideFilter={sideFilter}
          onSideFilterChange={setSideFilter}
          districtOptions={districtOptions}
          minPrice={minPrice}
          maxPrice={maxPrice}
          minRange={priceBounds.min}
          maxRange={priceBounds.max}
          onMinPriceChange={(nextValue) => setMinPrice(Math.min(nextValue, maxPrice))}
          onMaxPriceChange={(nextValue) => setMaxPrice(Math.max(nextValue, minPrice))}
        />

        <section className="map-panel" aria-label="Map of Brno fried-cheese restaurants">
          <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="map-container">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredRestaurants.map((restaurant) => {
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
