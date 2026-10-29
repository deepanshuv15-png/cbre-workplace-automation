// data/testData.ts
// Synthetic test data only. No real employees, sites or credentials.

export const users = {
  facilities: {
    username: process.env.TEST_USERNAME || 'facilities.user',
    password: process.env.TEST_PASSWORD || 'Password123',
  },
  viewer: {
    username: process.env.VIEWER_USERNAME || 'viewer.user',
    password: process.env.VIEWER_PASSWORD || 'Password123',
  },
};

export const sites = {
  warehouse: 'GXO Warehouse',
  londonOffice: 'London Office',
  manchesterHub: 'Manchester Hub',
};

export const teams = {
  Facilities: 'Facilities Team',
  IT: 'IT Service Desk',
  Security: 'Security Team',
};

export const incidents = {
  rollerDoor: 'Warehouse roller door inspection required',
  lightFailure: 'Warehouse aisle 4 light failure',
  fireDoor: 'Fire door on level 2 does not close fully',
  generator: 'Backup generator failed weekly test',
};
