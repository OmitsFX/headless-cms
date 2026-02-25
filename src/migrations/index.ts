import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260221_113056 from './20260221_113056';
import * as migration_20260223_100236 from './20260223_100236';
import * as migration_20260223_113850 from './20260223_113850';
import * as migration_20260223_125206 from './20260223_125206';
import * as migration_20260224_212029 from './20260224_212029';
import * as migration_20260225_132049 from './20260225_132049';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260221_113056.up,
    down: migration_20260221_113056.down,
    name: '20260221_113056',
  },
  {
    up: migration_20260223_100236.up,
    down: migration_20260223_100236.down,
    name: '20260223_100236',
  },
  {
    up: migration_20260223_113850.up,
    down: migration_20260223_113850.down,
    name: '20260223_113850',
  },
  {
    up: migration_20260223_125206.up,
    down: migration_20260223_125206.down,
    name: '20260223_125206',
  },
  {
    up: migration_20260224_212029.up,
    down: migration_20260224_212029.down,
    name: '20260224_212029',
  },
  {
    up: migration_20260225_132049.up,
    down: migration_20260225_132049.down,
    name: '20260225_132049'
  },
];
