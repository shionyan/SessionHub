<script lang="ts">
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';

  // サーバーのURLを指定して接続
  const socket = io('http://localhost:3000');

  let connectionStatus = '接続中...';

  // 接続成功
  socket.on('connect', () => {
    connectionStatus = `サーバーに接続しました。\n(ID: ${socket.id})`;
    console.log('接続成功！');
  });

  // 接続失敗
  socket.on('connect_error', (err) => {
    connectionStatus = 'サーバーへの接続に失敗しました。';
    console.error('接続エラー:', err.message);
  });

</script>

<main>
  <h1>Session Hub</h1>
  <p>ステータス: {connectionStatus}</p>
</main>

<style>
  main {
    font-family: sans-serif;
    text-align: center;
  }
</style>