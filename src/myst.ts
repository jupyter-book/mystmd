import MyST from '.';

declare global {
  interface Window {
    MyST: typeof MyST;
  }
}

window.MyST = MyST;
