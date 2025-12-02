// client/src/lib/socket.js
import { io } from 'socket.io-client';

// 環境変数で切り替えるのがベスト
const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const socket = io(URL);