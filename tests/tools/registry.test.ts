import { getToolsForSurface } from '@genfeedai/tools';
import { describe, expect, it } from 'vitest';

describe('@genfeedai/tools CLI agent surface', () => {
  it('exposes the richer cloud agent tool set to the CLI shell', () => {
    const names = getToolsForSurface('cli').map((tool) => tool.name);

    expect(names).toContain('generate_image');
    expect(names).toContain('create_livestream_bot');
    expect(names).toContain('manage_livestream_bot');
    expect(names).toContain('install_official_workflow');
    expect(names).toContain('capture_memory');
  });
});
