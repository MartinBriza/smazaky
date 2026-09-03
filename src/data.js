// Import the restaurant dataset from the generated app data file.
// The data file may be exported as either a plain array or as an object
// containing a `restaurants` property, so we normalize both shapes.
import restaurantData from '../brno-fried-cheese-app.js';

// Normalize the imported value to a predictable array so the React UI can
// safely iterate over it without needing conditional checks in the components.
const restaurants = Array.isArray(restaurantData)
  ? restaurantData
  : restaurantData?.restaurants ?? restaurantData?.default ?? [];

// Export the final array for the rest of the app.
export default restaurants;
