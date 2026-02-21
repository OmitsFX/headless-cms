import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260221_113056 from './20260221_113056';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260221_113056.up,
    down: migration_20260221_113056.down,
    name: '20260221_113056'
  },
];
