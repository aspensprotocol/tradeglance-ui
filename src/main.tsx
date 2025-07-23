import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Buffer polyfill for browser environment
import { Buffer } from 'buffer';
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
