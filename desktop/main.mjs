import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { app, BrowserWindow, net, protocol, shell } from 'electron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundleRoot = path.resolve(__dirname, '../apps/runner/dist');
const devUrl = process.env.ARCADE_DESKTOP_DEV_URL;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'arcade',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

function resolveBundleRequest(requestUrl) {
  const url = new URL(requestUrl);
  if (url.host !== 'app') return null;
  const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const absolute = path.resolve(bundleRoot, `.${requested}`);
  const relative = path.relative(bundleRoot, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return absolute;
}

function approvedNavigation(url) {
  if (url.startsWith('arcade://app/')) return true;
  if (!devUrl) return false;
  try {
    const configured = new URL(devUrl);
    const candidate = new URL(url);
    return (
      configured.protocol === 'http:' &&
      configured.hostname === '127.0.0.1' &&
      candidate.origin === configured.origin
    );
  } catch {
    return false;
  }
}

async function createWindow() {
  const window = new BrowserWindow({
    title: 'Badger Sprawl Runner',
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    backgroundColor: '#07101d',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (!approvedNavigation(url)) event.preventDefault();
  });

  if (devUrl) {
    if (!approvedNavigation(devUrl)) {
      throw new Error('ARCADE_DESKTOP_DEV_URL must use http://127.0.0.1');
    }
    await window.loadURL(devUrl);
  } else {
    await window.loadURL('arcade://app/index.html');
  }
}

app.whenReady().then(async () => {
  protocol.handle('arcade', (request) => {
    const file = resolveBundleRequest(request.url);
    if (!file) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  await createWindow();
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
