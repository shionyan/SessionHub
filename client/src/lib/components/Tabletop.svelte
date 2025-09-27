<script lang="ts">
  import { onMount, onDestroy  } from 'svelte';
  import { socket } from '../socket';
  import type { SceneObject } from '../types';
  import RightClickModal from './RightClickModal.svelte';
  import PanelSelectModal from './PanelSelectModal.svelte';

  // App.svelteからルームIDを受け取る
  export let roomId: string;
  export let initialTokens: SceneObject[] = [];

  // このコンポーネントが管理するトークンのリスト
  let tokens: SceneObject[] = initialTokens;
  let activeToken: SceneObject | null = null;
  let offsetX = 0;
  let offsetY = 0;
  let clickCoords = { x: 0, y: 0 };

  // モーダルの表示フラグ
  let showRightClickModal = false;
  let menuX = 0;
  let menuY = 0;
  let showPanelSelectModal = false;

  let newObject = {
    src: '',
    width: 100,
    height: 100,
    z: 1
  };

  // 
  function handleMouseDown(event: MouseEvent, token: SceneObject) {
    if (event.button !== 0) return;
    activeToken = token;
    offsetX = event.clientX - token.x;
    offsetY = event.clientY - token.y;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  // オブジェクトをドラッグで移動させる
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

  // オブジェクトをドロップで位置確定
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

  // 右クリックメニュー
  function handleContextMenu(event: MouseEvent) {
    event.preventDefault(); // ブラウザのデフォルト右クリックメニューを禁止

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    clickCoords = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    showRightClickModal = true;
    menuX = event.clientX;
    menuY = event.clientY;
  }

  function closeMenu() {
    showRightClickModal = false;
  }

  // パネルオブジェクト選択画面
  function openPanelSelectModal() {
    closeMenu();
    showPanelSelectModal  = true;
  }

  function handleCreateObject(event: CustomEvent<{ src: string; imageType: ImageType }>) {
    const { src, imageType } = event.detail;

    // 画像のサイズを取得して、適切なサイズで表示する（任意）
    const img = new Image();
    img.onload = () => {
      const newPanel: SceneObject = {
        id: `obj-${Date.now()}-${Math.random()}`,
        objectType: 'PANEL',
        imageType: imageType,
        src: src,
        x: clickCoords.x - img.width / 2,
        y: clickCoords.y - img.height / 2,
        width: img.width,
        height: img.height,
        z: 1,
      };
      socket.emit('addObject', { roomId, token: newPanel });
    };
    img.src = src;
  }
</script>

{#if showRightClickModal}
  <RightClickModal {showRightClickModal} {menuX} {menuY} on:close={closeMenu}>
    <ul>
      <li on:click={() => { alert('フレームオブジェクトは未実装です'); closeMenu(); }}>フレームオブジェクトを追加</li>
      <li on:click={openPanelSelectModal}>パネルオブジェクトを追加</li>
    </ul>
  </RightClickModal>
{/if}

<PanelSelectModal
  showModal={showPanelSelectModal}
  on:close={() => showPanelSelectModal = false}
  on:create={handleCreateObject}
/>

<div
  class="tabletop-area"
  on:contextmenu={handleContextMenu}
  role="button"
  tabindex="0"
>
  {#each tokens as token (token.id)}
    <img
      class="token"
      src={token.src}
      alt="token"
      style="left: {token.x}px; top: {token.y}px; width: {token.width}px; height: {token.height}px; z-index: {token.z};"
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
</style>