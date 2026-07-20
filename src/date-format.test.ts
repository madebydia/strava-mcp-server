import test from 'node:test';
import assert from 'node:assert/strict';

import { formatActivityDate, formatActivityDateTime } from './date-format.js';

test('formats late-evening UTC activity timestamps in America/Chicago', () => {
  const timestamp = '2026-07-20T03:32:08Z';

  assert.equal(formatActivityDate(timestamp), '7/19/2026');
  assert.equal(formatActivityDateTime(timestamp), '7/19/2026, 10:32:08 PM');
});

test('allows the display timezone to be configured', () => {
  const previous = process.env.DISPLAY_TIME_ZONE;
  process.env.DISPLAY_TIME_ZONE = 'UTC';

  try {
    assert.equal(formatActivityDate('2026-07-20T03:32:08Z'), '7/20/2026');
  } finally {
    if (previous === undefined) {
      delete process.env.DISPLAY_TIME_ZONE;
    } else {
      process.env.DISPLAY_TIME_ZONE = previous;
    }
  }
});
