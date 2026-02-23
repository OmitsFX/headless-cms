import * as migration_00000000_baseline from './00000000_baseline';

export const migrations = [
  {
    up: migration_00000000_baseline.up,
    down: migration_00000000_baseline.down,
    name: '00000000_baseline',
  },
];
