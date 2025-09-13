<script lang="ts">
  import { onMount } from 'svelte';
  import { socket } from '../socket';

  // App.svelteからルームIDを受け取る
  export let roomId: string;

  // このコンポーネントが管理するトークンのリスト
  let tokens = [];

  onMount(() => {
    // サーバーから現在のトークンリストを受け取る
    socket.on('currentTokens', (currentTokens) => {
      tokens = currentTokens;
    });

    // 他の誰かがトークンを追加した情報を受け取る
    socket.on('objectAdded', (newToken) => {
      // 既存のリストに新しいトークンを追加して画面を更新
      tokens = [...tokens, newToken];
    });
  });

  function handleTabletopClick(event: MouseEvent) {
    // tabletop-areaの左上からの相対座標を計算
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 新しいトークンオブジェクトを作成
    const newToken = {
      id: `token-${Date.now()}-${Math.random()}`, // ユニークなIDを生成
      src: '/character.png', // とりあえず固定の画像
      x: x - 40, // 画像の中心がクリック位置になるように調整
      y: y - 40,
      width: 80,
    };

    // サーバーに新しいトークンが追加されたことを通知
    socket.emit('addObject', { roomId, token: newToken });
  }
</script>

<div class="tabletop-area" on:click={handleTabletopClick}>
  {#each tokens as token (token.id)}
    <img
      class="token"
      src={token.src}
      alt="キャラクターコマ"
      style="
        left: {token.x}px;
        top: {token.y}px;
        width: {token.width}px;
      "
    />
  {/each}
</div>

<style>
  .tabletop-area {
    flex-grow: 1;
    background-image: url('/background.jpg');
    background-size: cover;
    background-position: center;
    position: relative;
    cursor: crosshair; /* クリックできる場所と分かるようにカーソルを変更 */
  }

  .token {
    position: absolute;
    cursor: grab;
    user-select: none;
  }
</style>