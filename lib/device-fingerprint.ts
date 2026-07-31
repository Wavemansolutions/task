import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { UAParser } from 'ua-parser-js';

export type DeviceInformation = {
  fingerprint: string;
  deviceName: string;
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  deviceType: string;
  userAgent: string;
};

export async function getDeviceInformation(): Promise<DeviceInformation> {
  const fingerprintAgent = await FingerprintJS.load();
  const fingerprintResult = await fingerprintAgent.get();

  const userAgent = navigator.userAgent;
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browserName = result.browser.name ?? 'Unknown browser';
  const browserVersion = result.browser.version ?? '';
  const operatingSystem = [
    result.os.name,
    result.os.version,
  ]
    .filter(Boolean)
    .join(' ');

  const deviceType = result.device.type ?? 'desktop';

  const deviceName =
    result.device.model ||
    result.device.vendor ||
    `${operatingSystem || 'Unknown device'} · ${browserName}`;

  return {
    fingerprint: fingerprintResult.visitorId,
    deviceName,
    browserName,
    browserVersion,
    operatingSystem: operatingSystem || 'Unknown OS',
    deviceType,
    userAgent,
  };
}