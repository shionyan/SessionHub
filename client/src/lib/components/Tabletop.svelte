<script lang="ts">
  import { onMount, onDestroy  } from 'svelte';
  import { socket } from '../socket';
  import type { SceneObject } from '../types';
  import Modal from './ObjectModal.svelte';

  // App.svelteからルームIDを受け取る
  export let roomId: string;
  export let initialTokens: SceneObject[] = [];

  // このコンポーネントが管理するトークンのリスト
  let tokens: SceneObject[] = initialTokens;
  let activeToken: SceneObject | null = null;
  let offsetX = 0;
  let offsetY = 0;
  let menuVisible = false;
  let menuX = 0;
  let menuY = 0;
  let clickCoords = { x: 0, y: 0 };
  let showAddPanelModal = false;


  let newObject = {
    src: '',
    width: 100,
    height: 100,
    z: 1
  };

  function handleMouseDown(event: MouseEvent, token: SceneObject) {
    if (event.button !== 0) return;
    activeToken = token;
    offsetX = event.clientX - token.x;
    offsetY = event.clientY - token.y;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!activeToken) return;

    // 新しい座標を計算
    const newX = event.clientX - offsetX;
    const newY = event.clientY - offsetY;

    // 自分の画面のトークンを即座に動かす
    activeToken.x = newX;
    activeToken.y = newY;
    tokens = tokens; // Svelteに再描画を促す

    // サーバーに移動情報を送信
    socket.emit('moveObject', { 
      roomId, 
      tokenId: activeToken.id, 
      x: newX, 
      y: newY 
    });
  }

  function handleMouseUp() {
    activeToken = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  onMount(() => {
    // オブジェクト追加を受け取る
    socket.on('objectAdded', (newToken: SceneObject) => {
      tokens = [...tokens, newToken];
    });

    // オブジェクト移動を受け取る
    socket.on('objectMoved', ({ tokenId, x, y }) => {
      const tokenToMove = tokens.find(t => t.id === tokenId);
      if (tokenToMove) {
        tokenToMove.x = x;
        tokenToMove.y = y;
        tokens = tokens; // 再描画を促す
      }
    });
  });

  onDestroy(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  });

  function handleTabletopClick(event: MouseEvent) {
    // tabletop-areaの左上からの相対座標を計算
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 新しいトークンオブジェクトを作成
    const newToken = {
      id: `token-${Date.now()}-${Math.random()}`,
      src: '/character.png', // とりあえず固定の画像
      x: x - 40, // 画像の中心がクリック位置になるように調整
      y: y - 40,
      width: 80,
    };

    // サーバーに新しいトークンが追加されたことを通知
    socket.emit('addObject', { roomId, token: newToken });
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      const newToken: SceneObject = {
        id: `token-${Date.now()}-${Math.random()}`,
        src: '/character.png',
        x: 10,
        y: 10,
        z: 1,
        width: 80,
        height: 80,
        objectType: 'PANEL'
      };

      socket.emit('addObject', { roomId, token: newToken });
    }
  }


  function handleContextMenu(event: MouseEvent) {
    event.preventDefault(); // ブラウザのデフォルト右クリックメニューを抑制

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    clickCoords = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    menuVisible = true;
    menuX = event.clientX;
    menuY = event.clientY;
  }

  function closeMenu() {
    menuVisible = false;
  }


  function openAddPanelModal() {
    closeMenu();
    showAddPanelModal = true;
  }

  function createPanelObject() {
    if (!newObject.src) {
      alert('画像URLを入力してください。');
      return;
    }

    const newPanel: SceneObject = {
      id: `obj-${Date.now()}-${Math.random()}`,
      objectType: 'PANEL',
      src: newObject.src,
      x: clickCoords.x - newObject.width / 2, // クリック位置が中心になるように
      y: clickCoords.y - newObject.height / 2,
      width: newObject.width,
      height: newObject.height,
      z: newObject.z,
    };

    // サーバーに通知
    socket.emit('addObject', { roomId, token: newPanel });

    // モーダルを閉じてフォームをリセット
    showAddPanelModal = false;
    newObject.src = '';
  }
</script>

{#if menuVisible}
  <div class="context-menu" style="top: {menuY}px; left: {menuX}px;">
    <ul>
      <li on:click={() => alert('フレームオブジェクトは未実装です')}>フレームオブジェクトを追加</li>
      <li on:click={openAddPanelModal}>パネルオブジェクトを追加</li>
    </ul>
  </div>
{/if}

<Modal showModal={showAddPanelModal} on:close={() => showAddPanelModal = false}>
  <h2>パネルオブジェクトを追加</h2>
  <div class="form-group">
    <label for="src">画像URL</label>
    <input type="text" id="src" bind:value={newObject.src} placeholder="https://example.com/image.png" />
  </div>
  <button on:click={createPanelObject}>作成</button>
</Modal>

<svelte:window on:click={closeMenu} />

<div
  class="tabletop-area"
  on:click={handleTabletopClick}
  on:keydown={handleKeyDown}
  on:contextmenu={handleContextMenu}
  role="button"
  tabindex="0"
>
  {#each tokens as token (token.id)}
    <img
      class="token"
      src={token.src}
      alt="キャラクターコマ"
      style="left: {token.x}px; top: {token.y}px; width: {token.width}px;"
      on:mousedown={(e) => handleMouseDown(e, token)}
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
    cursor: crosshair;
    outline: none;
  }

  .token {
    position: absolute;
    cursor: grab;
    user-select: none;
  }

  .context-menu {
    position: fixed;
    background-color: rgba(31, 31, 31, 0.8);
    box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
    min-width: 180px;
    font-size: 0.875rem;
    font-family: Roboto, Helvetica, Arial, sans-serif;
  }
  .context-menu ul {
    list-style: none;
    padding: 5px 0;
    margin: 0;
  }
  .context-menu li {
    padding: 8px 15px;
    cursor: pointer;
  }
  .context-menu li:hover {
    background-color: rgba(73, 73, 73, 0.8);
  }


  .form-group {
    margin-bottom: 1rem; 
  }
  .form-group label { 
    display: block;
    margin-bottom: 0.25rem;
  }
  .form-group input { 
    width: 300px; 
    padding: 0.5rem; 
  }
</style>