export const INCIDENT_TYPES = [
  { value: 'bank', label: 'Bank Robbery', icon: '🏦' },
  { value: 'jewelry', label: 'Jewelry Store', icon: '💎' },
  { value: 'store', label: 'Store Robbery', icon: '🏪' },
  { value: 'drugs', label: 'Drug Operations', icon: '💊' },
  { value: 'seizure', label: 'Seizure', icon: '📦' },
  { value: 'stockade', label: 'Stockade', icon: '🚔' },
  { value: 'code5', label: 'Code 5', icon: '🔍' },
  { value: 'gang_shootout', label: 'Gang Shootout', icon: '💥' },
  { value: 'shootout', label: 'Shootout', icon: '🔫' },
  { value: 'civilian', label: 'Civilian Incident', icon: '👤' },
  { value: 'cadet', label: 'Cadet Report', icon: '📝' },
];

export const LOCATIONS = [
  'Paleto Bay',
  'Sandy Shores',
  'Grapeseed',
  'Harmony',
  'Mount Chiliad',
  'Vinewood',
  'Downtown Los Santos',
  'Little Seoul',
  'Vespucci',
  'Del Perro',
  'Rockford Hills',
  'Morningwood',
  'Mirror Park',
  'La Mesa',
  'Cypress Flats',
  'El Burro Heights',
  'Elysian Island',
  'Terminal',
  'Davis',
  'Strawberry',
  'Chamberlain Hills',
  'Rancho',
  'LSIA',
  'Pacific Bluffs',
  'Chumash',
  'Banham Canyon',
  'Tongva Hills',
  'Great Chaparral',
  'Tataviam Mountains',
  'Fort Zancudo',
  'Lago Zancudo',
  'Raton Canyon',
  'Cassidy Creek',
  'RON Alternates Wind Farm',
  'Grand Senora Desert',
  'Humane Labs',
  'Custom Location',
];

export const VEHICLES = [
  // Sports
  'Adder', 'Banshee', 'Bullet', 'Cheetah', 'Comet', 'Coquette', 'Entity XF',
  'Feltzer', 'Infernus', 'Jester', 'Massacro', 'Osiris', 'Reaper', 'Sultan RS',
  'T20', 'Turismo R', 'Vacca', 'Voltic', 'Zentorno',
  // Muscle
  'Blade', 'Buccaneer', 'Chino', 'Dominator', 'Dukes', 'Gauntlet', 'Hotknife',
  'Phoenix', 'Picador', 'Ruiner', 'Sabre Turbo', 'Stallion', 'Tampa', 'Vigero',
  'Virgo', 'Voodoo',
  // SUVs
  'Baller', 'Cavalcade', 'Dubsta', 'FQ 2', 'Granger', 'Gresley', 'Habanero',
  'Huntley S', 'Landstalker', 'Mesa', 'Patriot', 'Radius', 'Rocoto', 'Seminole',
  'Serrano',
  // Sedans
  'Asterope', 'Buffalo', 'Emperor', 'Exemplar', 'Felon', 'Fugitive', 'Ingot',
  'Intruder', 'Jackal', 'Oracle', 'Premier', 'Primo', 'Regina', 'Schafter',
  'Stanier', 'Stratum', 'Super Diamond', 'Surge', 'Tailgater', 'Washington',
  // Compacts
  'Blista', 'Dilettante', 'Issi', 'Panto', 'Prairie', 'Rhapsody',
  // Motorcycles
  'Akuma', 'Bagger', 'Bati 801', 'Carbon RS', 'Daemon', 'Double T', 'Enduro',
  'Faggio', 'Hakuchou', 'Hexer', 'Innovation', 'Nemesis', 'PCJ 600', 'Ruffian',
  'Sanchez', 'Sovereign', 'Thrust', 'Vader', 'Vindicator', 'Wolfsbane', 'Zombiee',
  // Vans
  'Bison', 'Bobcat XL', 'Burrito', 'Camper', 'Journey', 'Minivan', 'Paradise',
  'Pony', 'Rumpo', 'Speedo', 'Surfer', 'Youga',
  // Emergency
  'Ambulance', 'Fire Truck', 'Police Cruiser', 'Police Buffalo', 'Sheriff Cruiser',
  'Sheriff SUV', 'Unmarked Cruiser', 'Police Bike', 'Police Riot', 'Police Transporter',
];

export const PURSUIT_INITIATORS = [
  'Self',
  'Air-1',
  'Other Unit',
  'Dispatch',
];

export const PURSUIT_REASONS = [
  'Traffic Violation',
  'Felony Stop',
  'BOLO Vehicle',
  'Shots Fired',
  'Hit and Run',
  'Reckless Driving',
  'Stolen Vehicle',
  'Suspect Fleeing Scene',
];

export const PURSUIT_TYPES = [
  'Ground Only',
  'Air Support',
  'Ground + Air',
  'Terminated Early',
];

export const PURSUIT_TERMINATIONS = [
  'Suspect in Custody',
  'Suspect Escaped',
  'Vehicle Disabled',
  'Spike Strip',
  'PIT Maneuver',
  'Supervisor Termination',
  'Safety Concerns',
];

export const SUSPECT_STATUSES = [
  'In Custody',
  'At Large',
  'Deceased',
  'Hospital',
  'Released',
];
