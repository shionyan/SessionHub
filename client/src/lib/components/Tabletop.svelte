<script lang="ts">
  import { onMount, onDestroy  } from 'svelte';
  import { socket } from '../socket';
  import type { SceneObject, ImageType } from '../types';
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

  // --- 視点操作用の状態変数 ---
  let view = { x: 0, y: 0, scale: 1 };
  let isPanning = false;
  let isDraggingToken = false; // トークンドラッグ中かどうかのフラグ

  // 
  function handleMouseDown(event: MouseEvent, token: SceneObject) {
    if (event.button !== 0) return;
    // イベントの伝播を止めて、背景のパン操作が始まらないようにする
    event.stopPropagation();
    activeToken = token;
    isDraggingToken = true; // ドラッグ開始フラグ

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  // 2. 背景のドラッグ開始（視点移動）
  function handleBackgroundMouseDown(event: MouseEvent) {
    // 左クリック(0) または 中クリック(1) で移動
    if (event.button === 0 || event.button === 1) {
      isPanning = true;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  }

  // オブジェクトをドラッグで移動させる
  function handleMouseMove(event: MouseEvent) {
    // トークンの移動処理
    if (activeToken && isDraggingToken) {
      // 拡大率を考慮して移動量を計算
      const deltaX = event.movementX / view.scale;
      const deltaY = event.movementY / view.scale;

      activeToken.x += deltaX;
      activeToken.y += deltaY;
      tokens = tokens; // 再描画

      socket.emit('moveObject', { 
        roomId, 
        tokenId: activeToken.id, 
        x: activeToken.x, 
        y: activeToken.y 
      });
      return;
    }

    // 背景のパン（移動）処理
    if (isPanning) {
      view.x += event.movementX;
      view.y += event.movementY;
      view = view; // 再描画
    }
  }

  // オブジェクトをドロップで位置確定
  function handleMouseUp() {
    activeToken = null;
    isDraggingToken = false;
    isPanning = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  // 5. 拡大縮小（ズーム）
  function handleWheel(event: WheelEvent) {
    if (!showPanelSelectModal || !showRightClickModal) return; // メニュー表示中は無効
    event.preventDefault();

    const scaleAmount = -event.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.1, view.scale + scaleAmount), 5); // 0.1倍〜5倍

    // マウス位置を中心にズームする計算
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // ズーム前のワールド座標
    const worldMouseX = (mouseX - view.x) / view.scale;
    const worldMouseY = (mouseY - view.y) / view.scale;

    // スケール更新
    view.scale = newScale;

    // ズーム後の位置補正
    view.x = mouseX - worldMouseX * view.scale;
    view.y = mouseY - worldMouseY * view.scale;
  }

  // 6. 右クリックメニュー（座標変換を追加）
  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // スクリーン座標からワールド座標（拡大縮小・移動を考慮した座標）に変換して保存
    clickCoords = { 
      x: (clickX - view.x) / view.scale, 
      y: (clickY - view.y) / view.scale 
    };

    showRightClickModal = true;
    menuX = event.clientX;
    menuY = event.clientY;
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
  on:mousedown={handleBackgroundMouseDown}
  on:wheel={handleWheel}
  on:contextmenu={handleContextMenu}
  role="button"
  tabindex="0"
>
<div 
    class="world-layer" 
    style="transform: translate({view.x}px, {view.y}px) scale({view.scale});"
  >
    {#each tokens as token (token.id)}
      <img
        class="token"
        src={token.src}
        alt="token"
        draggable="false" 
        style="left: {token.x}px; top: {token.y}px; width: {token.width}px; height: {token.height}px; z-index: {token.z};"
        on:mousedown={(e) => handleMouseDown(e, token)}
      />
    {/each}
  </div>
</div>

<style>
  .tabletop-area {
    flex-grow: 1;
    background-image: url('/background.jpg');
    background-size: cover;
    background-position: center;
    position: relative;
    cursor: default;
    outline: none;
    overflow: hidden; /* 追加: 領域外を描画しない */
  }

  /* 追加: ワールド座標系を管理するレイヤー */
  .world-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: 0 0; /* 左上原点で変形 */
    pointer-events: none; /* コンテナ自体はクリックを透過させる */
  }

  .token {
    position: absolute;
    cursor: grab;
    user-select: none;
    pointer-events: auto; /* トークンはマウスイベントを受け取る */
  }
  
  .token:active {
    cursor: grabbing;
  }
</style>