<script lang="ts">
  import Sidebar from './lib/components/Sidebar.svelte';
  import Tabletop from './lib/components/Tabletop.svelte';
  import { onMount } from 'svelte';
  import { socket } from './lib/socket';

  // URLからルームIDを取得する
  // もしIDがなければ、'default-room'に入る
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const roomId = pathSegments.length > 1 && pathSegments[0] === 'room'
    ? pathSegments[1]
    : 'default-room';

  onMount(() => {
    socket.on('connect', () => {
      console.log('サーバーに接続しました。ルームに参加します...');
      // サーバーにルームへの参加を伝える
      socket.emit('joinRoom', roomId);
    });
  });
</script>

<div class="app-container">
  <Sidebar />
  <Tabletop {roomId} />
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
  }
</style>