/// <reference types="vite/client" />

interface ElectronAPI {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
