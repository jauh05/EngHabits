import { describe, expect, it } from 'vitest';
import { detectInstallPlatform } from './install';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36';
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15';

describe('detectInstallPlatform', () => {
  it('iPhone di Safari mendapat petunjuk Bagikan', () => {
    expect(detectInstallPlatform(IPHONE, false)).toBe('ios');
  });

  it('Android dan desktop mendapat petunjuk umum', () => {
    expect(detectInstallPlatform(ANDROID, false)).toBe('other');
    expect(detectInstallPlatform(DESKTOP, false)).toBe('other');
  });

  it('aplikasi yang sudah dipasang tidak lagi menampilkan tombol', () => {
    expect(detectInstallPlatform(IPHONE, true)).toBe('installed');
    expect(detectInstallPlatform(ANDROID, true)).toBe('installed');
  });
});
