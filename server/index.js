import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const app = express();
const httpServer = createServer(app);
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const io = new Server(httpServer, {
    cors: {
        // 本番環境のフロントエンドURLを追加
        origin: ["http://localhost:5173", process.env.CORS_ORIGIN || "https://session-hub-mu.vercel.app"],
        methods: ["GET", "POST"]
    }
});

// #region アップロードされたファイルの管理
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// R2クライアントの初期化
const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // 環境変数から読み込む
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,         // 環境変数
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY, // 環境変数
  },
});

// #region 暗号化 
const algorithm = 'aes-256-cbc';
const secretKey = crypto.createHash('sha256').update(
  String(process.env.SECRET_KEY || 'default-secret-key')
).digest('base64').substr(0, 32);
const iv = crypto.randomBytes(16); // 初期ベクトル

// 暗号化関数
function encrypt(buffer) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  // 初期ベクトルを先頭に配置する
  return Buffer.concat([iv, encrypted]);
}

// #endregion 暗号化

// #region multerの設定
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,

  limits: {
    // 10MBまで 
    fileSize: 10*1024*1024,
   },

  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('許可されていないファイルタイプです。\nJPEG, PNG, GIF, WebPのみが許可されています。'), false);
    }
  }
});
// #endregion multerの設定

// #region ファイルアップロードのAPI
app.post('/update', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send({ message: 'ファイルなし'});
  try {
    // アップロードされた画像をWebPに変換する
    const quality = 80;
    const webpBuffer = await sharp(req.file.buffer).webp({ quality: 80 }).toBuffer();

    // 暗号化
    const encryptedBuffer = encrypt(webpBuffer);

    // R2へアップロード
    const fileName = `${Date.now()}.webp.encrypted`;
    await R2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME, // 環境変数
      Key: fileName,
      Body: encryptedBuffer,
      ContentType: 'application/octet-stream',
    }));

    // 返却するURL等は設計に合わせて調整（今回はファイル名だけでOKかも）
    res.status(200).send({ message: 'OK', filePath: fileName });

  } catch (error) {
    console.error(error);
    res.status(500).send({message: 'Error'});
  }
});
// #endregion ファイルアップロードのAPI

app.use(cors());
app.use('/uploads', express.static('uploads'));
// #endregion アップロードされたファイルの管理

// 全てのルームの状態をサーバーのメモリ上に保存するオブジェクト
const rooms = {};

io.on('connection', (socket) => {
  console.log('ユーザーが接続しました。 ID:', socket.id);

  // クライアントからjoinRoomイベントが送られてきたときの処理
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId); // Socket.IOのルーム機能を使って参加
    console.log(`${socket.id} がルーム'${roomId}'に参加しました。`);

    // もし部屋がまだ存在しなければ、新しい部屋のデータを作成
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        roomName: '新しい部屋',
        tokens: [] // この部屋のコマ情報を保持する配列
      };
    }

    // 参加したクライアントに、現在の部屋の全トークン情報を送る
    socket.emit('roomData', rooms[roomId]);
  });

  // クライアントがオブジェクトを生成した
  socket.on('addObject', ({ roomId, token }) => {
    // 該当する部屋のトークンリストに新しいトークンを追加
    if (rooms[roomId]) {
      rooms[roomId].tokens.push(token);

      // 参加者にブロードキャスト
      io.to(roomId).emit('objectAdded', token);
    }
  });

  // クライアントがオブジェクトを移動させた
  socket.on('moveObject', ({roomId, tokenId, x, y}) => {
    if (rooms[roomId]) {
      const tokenToMove = rooms[roomId].tokens.find(t => t.id === tokenId);
      if (tokenToMove) {
        tokenToMove.x = x;
        tokenToMove.y = y;

        // 参加者にブロードキャスト
        socket.to(roomId).emit('objectMoved', {tokenId, x, y});
      }
    }
  });

  // オブジェクトのプロパティ更新 (リサイズ、アライメント変更など)
  socket.on('updateObject', ({ roomId, token }) => {
    if (rooms[roomId]) {
      const index = rooms[roomId].tokens.findIndex(t => t.id === token.id);
      if (index !== -1) {
        // サーバー側のデータを更新
        rooms[roomId].tokens[index] = token;
        // 部屋の全員に更新を通知
        io.to(roomId).emit('objectUpdated', token);
      }
    }
  });

  // オブジェクトを削除する
  socket.on('removeObject', ({ roomId, tokenId }) => {
    if (rooms[roomId]) {
      const index = rooms[roomId].tokens.findIndex(t => t.id === tokenId);
      if (index !== -1) {
        rooms[roomId].tokens.splice(index, 1);
        io.to(roomId).emit('objectRemoved', tokenId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('ユーザーが切断しました。 ID:', socket.id);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました。\nhttp:localhost:${PORT}`)
})
