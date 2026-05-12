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

function getDefaultPortForProtocol(protocol) {
  return protocol === 'https:' ? '443' : '80';
}

function getPortFromBaseUrl(baseUrl) {
  if (!baseUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(baseUrl);
    return parsedUrl.port || getDefaultPortForProtocol(parsedUrl.protocol);
  } catch {
    return null;
  }
}

function getRuntimeHost() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname || null;
  }

  return expoHost;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function getHealthUrl(baseUrl) {
  return `${baseUrl.replace(/\/+$/, '')}/health/`;
}

async function fetchWithTimeout(url, timeoutMs = 1500) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller?.abort();
      reject(new Error('timeout'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      fetch(url, {
        method: 'GET',
        signal: controller?.signal,
      }),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timeoutId);
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

const initialApiBaseUrl =
  Platform.OS === 'web'
    ? configuredBaseUrl
    : rewriteLoopbackUrl(configuredBaseUrl, expoHost);

let resolvedApiBaseUrl = initialApiBaseUrl;
let apiBaseUrlVerified = false;
let apiBaseUrlPromise = null;

export const API_BASE_URL = initialApiBaseUrl;
export const ADDRESS = API_BASE_URL.replace(/^https?:\/\//i, '');
export const WS_BASE_URL = API_BASE_URL.replace(/^http/i, 'ws');

function getApiBaseUrlCandidates() {
  const runtimeHost = getRuntimeHost();
  const configuredPort = getPortFromBaseUrl(initialApiBaseUrl);
  const candidatePorts = uniqueValues([
    configuredPort,
    process.env.EXPO_PUBLIC_API_PORT,
    '8000',
    '8001',
    '8012',
  ]);

  const runtimeCandidates = runtimeHost
    ? candidatePorts.map((port) => `http://${runtimeHost}:${port}`)
    : [];

  return uniqueValues([
    initialApiBaseUrl,
    rewriteLoopbackUrl(configuredBaseUrl, runtimeHost),
    inferredBaseUrl,
    normalizeBaseUrl(fallbackHost),
    ...runtimeCandidates,
  ]).map((baseUrl) => baseUrl.replace(/\/+$/, ''));
}

async function resolveReachableApiBaseUrl() {
  const candidates = getApiBaseUrlCandidates();

  for (const candidate of candidates) {
    try {
      const response = await fetchWithTimeout(getHealthUrl(candidate));
      if (response?.ok) {
        resolvedApiBaseUrl = candidate;
        apiBaseUrlVerified = true;
        return resolvedApiBaseUrl;
      }
    } catch {
      // Try the next likely local/LAN backend URL.
    }
  }

  return resolvedApiBaseUrl;
}

export async function getApiBaseUrl() {
  if (apiBaseUrlVerified) {
    return resolvedApiBaseUrl;
  }

  if (!apiBaseUrlPromise) {
    apiBaseUrlPromise = resolveReachableApiBaseUrl().finally(() => {
      apiBaseUrlPromise = null;
    });
  }

  return apiBaseUrlPromise;
}

export async function getWsBaseUrl() {
  const baseUrl = await getApiBaseUrl();
  return baseUrl.replace(/^http/i, 'ws');
}

export function resolveMediaUrl(url) {
  if (!url) {
    return null;
  }

  return /^https?:\/\//i.test(url) ? url : `${resolvedApiBaseUrl}${url}`;
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
  const baseURL = await getApiBaseUrl();
  const requestUrl = String(config.url || '');
  const isPublicAuthRequest =
    requestUrl.includes('/chat/signin/') || requestUrl.includes('/chat/signup/');

  if (!isPublicAuthRequest && tokens?.access && !nextHeaders.Authorization) {
    nextHeaders.Authorization = `Bearer ${tokens.access}`;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof nextHeaders.delete === 'function') {
      nextHeaders.delete('Content-Type');
      nextHeaders.delete('content-type');
    } else {
      delete nextHeaders['Content-Type'];
      delete nextHeaders['content-type'];
    }
  }

  return {
    ...config,
    baseURL,
    headers: nextHeaders,
  };
});

export default api;
