import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        // Viteのデフォルトのポート
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// クライアント接続時
io.on('connection', (socket) => {
    console.log('ユーザーが接続しました。\nID:', socket.id);
    // クライアント切断時
    socket.on('disconnect', () => {
        console.log('ユーザーが切断しました。\nID:', socket.id);
    });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました。\nhttp:localhost:${PORT}`)
})