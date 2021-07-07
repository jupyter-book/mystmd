import { MyST } from './src_archive'

declare global {
  interface Window {
    MyST: typeof MyST
  }
}

window.MyST = MyST
