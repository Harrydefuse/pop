/**
 * Where the campaign happens.
 *
 * Every boss stands at a real address, which is what turns the ladder into a
 * route through the city rather than a list — and puts the next one a walk
 * away. This is all that is left of the hand-drawn Sydney: the coordinates.
 */
export const PLACES = [
  { id: 'quay', name: 'Circular Quay', lat: -33.861, lon: 151.211 },
  { id: 'darling', name: 'Darling Harbour', lat: -33.872, lon: 151.198 },
  { id: 'northsyd', name: 'North Sydney', lat: -33.838, lon: 151.207 },
  { id: 'cbd', name: 'The CBD', lat: -33.87, lon: 151.209 },
  { id: 'domain', name: 'The Domain', lat: -33.865, lon: 151.218 },
  { id: 'centennial', name: 'Centennial Park', lat: -33.896, lon: 151.239 },
  { id: 'mosman', name: 'Mosman', lat: -33.828, lon: 151.244 },
  { id: 'rose', name: 'Rose Bay', lat: -33.866, lon: 151.266 },
  { id: 'bondi', name: 'Bondi', lat: -33.891, lon: 151.274 },
  { id: 'heads', name: 'The Heads', lat: -33.823, lon: 151.285 },
]

export const placeById = (id) => PLACES.find((p) => p.id === id)
