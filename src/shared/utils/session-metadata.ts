import type { Request } from 'express';
import type { SessionMetadata } from '@/src/shared/types/session-metadata';
import DeviceDetector = require('device-detector-js');
import {lookup} from 'geoip-lite'
import * as countries from 'i18n-iso-countries';

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

export const getSessionMetadata = (req: Request, userAgent: string): SessionMetadata => {
  const ip = process.env.NODE_ENV === 'dev'
    ? '173.166.164.121'
    : Array.isArray(req.headers['cf-connecting-ip'])
      ? req.headers['cf-connecting-ip'][0]
      : req.headers['cf-connecting-ip'] || (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]
      : req.ip);

  const device = new DeviceDetector().parse(userAgent);
  const location = ip ? lookup(ip) : null;
  return {
    location: {
      country: countries.getName(location?.country || 'Неизвестно', 'ru') || 'Неизвестно',
      city: location?.city || 'Неизвестно',
      latitude: location?.ll[0] || 0,
      longitude: location?.ll[1] || 0
    },
    device: {
      browser: device?.client?.name || 'Неизвестно',
      os: device?.os?.name || 'Неизвестно',
      type: device?.device?.type || 'Неизвестно'
    },
    ip: ip ? ip: '127.0.0.1',
  }
};