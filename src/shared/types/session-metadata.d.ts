export interface LocationInfoData {
  country: string;
  city: string;
  longitude: number;
  latitude: number;
}

export interface DeviceInfoData {
  browser: string;
  os: string;
  type: string;
}

export interface SessionMetadata {
  location: LocationInfoData;
  device: DeviceInfoData;
  ip: string;
}