import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import secure from './secure';

function getHostFromUri(value) {
  if (!value) {
    return null;
  }

  const cleaned = String(value).trim();
  if (!cleaned) {
    return null;
  }

  const withoutProtocol = cleaned.replace(/^[a-z]+:\/\//i, '');
  return withoutProtocol.split('/')[0].split(':')[0] || null;
}

function getExpoHost() {
  const hostCandidates = [
    Constants.expoConfig?.hostUri,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest?.debuggerHost,
    Constants.experienceUrl,
    Constants.linkingUri,
  ];

  for (const candidate of hostCandidates) {
    const host = getHostFromUri(candidate);
    if (host) {
      return host;
    }
  }

  return null;
}

function normalizeBaseUrl(value) {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `http://${trimmedValue}`;

  return withProtocol.replace(/\/+$/, '');
}

function getWebBaseUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  const { hostname, protocol } = window.location;
  if (!hostname) {
    return null;
  }

  const resolvedProtocol = protocol === 'https:' ? 'https' : 'http';
  return `${resolvedProtocol}://${hostname}:8000`;
}

function isLoopbackHost(hostname) {
  return ['127.0.0.1', 'localhost', '10.0.2.2'].includes(hostname);
}

function rewriteLoopbackUrl(baseUrl, runtimeHost) {
  if (!baseUrl || !runtimeHost || runtimeHost === 'localhost') {
    return baseUrl;
  }

  try {
    const parsedUrl = new URL(baseUrl);
    if (!isLoopbackHost(parsedUrl.hostname)) {
      return baseUrl;
    }

    parsedUrl.hostname = runtimeHost;
    return parsedUrl.toString().replace(/\/+$/, '');
  } catch {
    return baseUrl;
  }
}

const fallbackHost = Platform.select({
  android: '10.0.2.2:8000',
  ios: '127.0.0.1:8000',
  web: '127.0.0.1:8000',
  default: '127.0.0.1:8000',
});

const expoHost = getExpoHost();
const inferredBaseUrl =
  getWebBaseUrl() || (expoHost ? `http://${expoHost}:8000` : null);

const configuredBaseUrl =
  normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL) ||
  normalizeBaseUrl(inferredBaseUrl) ||
  normalizeBaseUrl(fallbackHost);

export const API_BASE_URL =
  Platform.OS === 'web'
    ? configuredBaseUrl
    : rewriteLoopbackUrl(configuredBaseUrl, expoHost);

export const ADDRESS = API_BASE_URL.replace(/^https?:\/\//i, '');
export const WS_BASE_URL = API_BASE_URL.replace(/^http/i, 'ws');

export function resolveMediaUrl(url) {
  if (!url) {
    return null;
  }

  return /^https?:\/\//i.test(url) ? url : `${API_BASE_URL}${url}`;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const tokens = await secure.get('tokens');
  const nextHeaders = config.headers || {};
  const requestUrl = String(config.url || '');
  const isPublicAuthRequest =
    requestUrl.includes('/chat/signin/') || requestUrl.includes('/chat/signup/');

  if (!isPublicAuthRequest && tokens?.access && !nextHeaders.Authorization) {
    nextHeaders.Authorization = `Bearer ${tokens.access}`;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof nextHeaders.delete === 'function') {
      nextHeaders.delete('Content-Type');
    } else {
      delete nextHeaders['Content-Type'];
    }
  }

  return {
    ...config,
    headers: nextHeaders,
  };
});

export default api;
