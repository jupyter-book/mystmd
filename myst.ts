import MyST from './src';

declare global {
  interface Window {
    MyST: typeof MyST;
  }
}

window.MyST = MyST;
