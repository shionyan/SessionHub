<script lang="ts">
  import Sidebar from './lib/components/Sidebar.svelte';
  import Tabletop from './lib/components/Tabletop.svelte';
  import Header from './lib/components/Header.svelte';
  import { onMount } from 'svelte';
  import { socket } from './lib/socket';
  import type { Token } from './lib/types';

  // URLからルームIDを取得する
  // もしIDがなければ、'default-room'に入る
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const roomId = pathSegments.length > 1 && pathSegments[0] === 'room'
    ? pathSegments[1]
    : 'default-room';

  let roomName = '部屋を読み込み中...';
  let initialTokens: Token[] = [];

  onMount(() => {
    socket.on('connect', () => {
      console.log('サーバーに接続しました。ルームに参加します...');
      // サーバーにルームへの参加を伝える
      socket.emit('joinRoom', roomId);
    });

    socket.on('roomData', (data) => {
      roomName = data.roomName;
      initialTokens = data.tokens;
      console.log(`ルーム'${data.roomName}'のデータを受信しました。`);
    });
  });
</script>

<div class="app-container">
  <div class="left-root">
    <Header {roomName} {roomId}/>
    <Tabletop {roomId} {initialTokens} />
  </div>
  <div class="right-root">
    <Sidebar {roomName} {roomId} />
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
  .app-container {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    justify-content: space-between;
  }
  .left-root {
    display: flex;
  }
  .right-root {
    align-items: end;
    justify-items: end;
  }
</style>