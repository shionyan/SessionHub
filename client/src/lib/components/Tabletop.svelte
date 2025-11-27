<script lang="ts">
  import { onMount, onDestroy  } from 'svelte';
  import { socket } from '../socket';
  import type { SceneObject, ImageType, TokenAlignment } from '../types';
  import RightClickModal from './RightClickModal.svelte';
  import PanelSelectModal from './PanelSelectModal.svelte';

  // App.svelteからルームIDを受け取る
  let { roomId, initialTokens = [], selectedToken = $bindable(null) } = $props();

  // State
  let tokens = $state(initialTokens);
  let activeToken: SceneObject | null = $state(null);

  // 視点操作用の状態変数
  let view = $state({ x: 0, y: 0, scale: 1 });
  let isPanning = false;
  let isDraggingToken = false;
  let tabletopElement: HTMLDivElement;

  // モーダル関連
  let showRightClickModal = $state(false);
  let menuX = $state(0);
  let menuY = $state(0);
  let contextMenuType: 'background' | 'token' = $state('background'); // メニューの種類
  let targetTokenId: string | null = null; // 右クリックされたトークンのID

  let showPanelSelectModal = $state(false);
  let clickCoords = { x: 0, y: 0 };

  const GRID_SIZE = 50; // グリッドの単位

  // 座標をグリッドにスナップさせる関数
  function snapToGrid(value: number) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  // サイズをグリッド単位に丸める（最低1マス）
  function snapSizeToGrid(value: number) {
    const size = Math.round(value / GRID_SIZE) * GRID_SIZE;
    return size < GRID_SIZE ? GRID_SIZE : size;
  }

  // #region --- マウス操作ハンドラ ---
  // 1. トークンのドラッグ開始
  function handleMouseDown(event: MouseEvent, token: SceneObject) {
    if (event.button !== 0) return;
    event.stopPropagation();
    
    activeToken = token;
    selectedToken = token;
    isDraggingToken = true;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  // 2. 背景のドラッグ開始（視点移動）
  function handleBackgroundMouseDown(event: MouseEvent) {
    if (event.button === 0 || event.button === 1) {
      selectedToken = null;
      isPanning = true;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  }

  // 3. マウス移動
  function handleMouseMove(event: MouseEvent) {
    // A. トークンの移動
    if (activeToken && isDraggingToken) {
      const deltaX = event.movementX / view.scale;
      const deltaY = event.movementY / view.scale;

      // 自由移動中はそのまま加算し、ドロップ時や表示時にスナップを考慮する手もあるが、
      // ここではドラッグ中もリアルタイムにスナップさせるなら以下のように計算を変える
      // ただし、スムーズな移動のためには内部座標は細かく持ち、表示または確定時にスナップが良い。
      // 今回は簡易的に、現在の位置に加算してからスナップ判定を行う。
      
      activeToken.x += deltaX;
      activeToken.y += deltaY;

      socket.emit('moveObject', { 
        roomId, 
        tokenId: activeToken.id, 
        x: activeToken.x, 
        y: activeToken.y 
      });
      return;
    }

    // B. 背景の移動（パン）
    if (isPanning) {
      view.x += event.movementX;
      view.y += event.movementY;
    }
  }

  // 4. ドラッグ終了
  function handleMouseUp() {
    // グリッドモードならドロップ時にスナップして位置確定
    if (activeToken && isDraggingToken) {
      activeToken.x = snapToGrid(activeToken.x);
      activeToken.y = snapToGrid(activeToken.y);
      
      // スナップ後の位置を送信
      socket.emit('moveObject', { 
        roomId, 
        tokenId: activeToken.id, 
        x: activeToken.x, 
        y: activeToken.y 
      });
    }

    activeToken = null;
    isDraggingToken = false;
    isPanning = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  // 5. 拡大縮小
  function handleWheel(event: WheelEvent) {
    if (showRightClickModal) return;
    event.preventDefault();

    const scaleAmount = -event.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.1, view.scale + scaleAmount), 5);

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const worldMouseX = (mouseX - view.x) / view.scale;
    const worldMouseY = (mouseY - view.y) / view.scale;

    view.scale = newScale;
    view.x = mouseX - worldMouseX * view.scale;
    view.y = mouseY - worldMouseY * view.scale;
  }

  // 6. 右クリックメニュー
  function handleContextMenu(event: MouseEvent, type: 'background' | 'token' = 'background', token?: SceneObject) {
    event.preventDefault();
    event.stopPropagation(); // 背景とトークンのイベント重複を防ぐ
    
    const rect = (event.currentTarget as HTMLElement).closest('.tabletop-area')!.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // ワールド座標を計算して保存（新規作成用）
    // グリッドモードならクリック位置もスナップさせる
    let wx = (clickX - view.x) / view.scale;
    let wy = (clickY - view.y) / view.scale;

    clickCoords = { x: snapToGrid(wx), y: snapToGrid(wy) };

    contextMenuType = type;
    if (type === 'token' && token) {
      targetTokenId = token.id;
    } else {
      targetTokenId = null;
    }

    showRightClickModal = true;
    menuX = event.clientX;
    menuY = event.clientY;
  }
  // #endregion --- マウス操作ハンドラ ---

  // #region --- ソケットリスナー ---
  onMount(() => {
    socket.on('objectAdded', (newToken: SceneObject) => {
      tokens = [...tokens, newToken];
    });
    socket.on('objectMoved', ({ tokenId, x, y }) => {
      const token = tokens.find(t => t.id === tokenId);
      if (token) {
        token.x = x;
        token.y = y;
      }
    });
    socket.on('objectUpdated', (updatedToken: SceneObject) => {
      const index = tokens.findIndex(t => t.id === updatedToken.id);
      if (index !== -1) {
        tokens[index] = updatedToken;
        // もし自分が選択しているトークンが更新されたら、選択状態も更新
        if (selectedToken && selectedToken.id === updatedToken.id) {
          selectedToken = updatedToken;
        }
      }
    });

    // 画面サイズに合わせて初期位置を調整（中央表示）
    if (tabletopElement) {
      const rect = tabletopElement.getBoundingClientRect();
      view.x = rect.width / 2;
      view.y = rect.height / 2;
    }
  });

  onDestroy(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  });

  // #endregion --- ソケットリスナー ---

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

  // アライメントを変更する関数（将来的にメニューから呼ぶ）
  function updateAlignment(tokenId: string, alignment: TokenAlignment) {
    const token = tokens.find(t => t.id === tokenId);
    if (token) {
        token.alignment = alignment;
        // socket.emit('updateObject', ...) // 将来的に実装
    }
  }

  function handleCreateObject(event: CustomEvent<{ src: string; imageType: ImageType }>) {
    const { src, imageType } = event.detail;

    // 画像のサイズを取得して、適切なサイズで表示する（任意）
    const img = new Image();
    img.onload = () => {
      const boxWidth = Math.ceil(img.width / GRID_SIZE) * GRID_SIZE;
      const boxHeight = Math.ceil(img.height / GRID_SIZE) * GRID_SIZE;
      const newPanel: SceneObject = {
        id: `obj-${Date.now()}-${Math.random()}`,
        objectType: 'PANEL',
        imageType: imageType,
        src: src,
        x: clickCoords.x,
        y: clickCoords.y,
        width: boxWidth || GRID_SIZE,
        height: boxHeight || GRID_SIZE,
        z: 1,
        alignment: 'center',
      };
      socket.emit('addObject', { roomId, token: newPanel });
    };
    img.src = src;
  }
</script>

{#if showRightClickModal}
  <RightClickModal showRightClickModal={showRightClickModal} {menuX} {menuY} on:close={closeMenu}>
    <div class="menu-list">
      {#if contextMenuType === 'background'}
        <button class="menu-item" onclick={() => { alert('フレームオブジェクトは未実装です'); closeMenu(); }}>フレームオブジェクトを追加</button>
        <button class="menu-item" onclick={openPanelSelectModal}>パネルオブジェクトを追加</button>
      {:else}
        <button class="menu-item" onclick={() => { if(targetTokenId) updateAlignment(targetTokenId, 'top-left'); closeMenu(); }}>↖ 左上に配置</button>
        <button class="menu-item" onclick={() => { if(targetTokenId) updateAlignment(targetTokenId, 'center'); closeMenu(); }}>・ 中央に配置</button>
        <button class="menu-item" onclick={() => { if(targetTokenId) updateAlignment(targetTokenId, 'bottom-right'); closeMenu(); }}>↘ 右下に配置</button>
        <button class="menu-item warning" onclick={() => { alert(`削除: ${targetTokenId}`); closeMenu(); }}>削除（未実装）</button>
      {/if}
    </div>
  </RightClickModal>
{/if}

<PanelSelectModal
  showModal={showPanelSelectModal}
  on:close={() => showPanelSelectModal = false}
  on:create={handleCreateObject}
/>

<div
  class="tabletop-area"
  bind:this={tabletopElement} 
  onmousedown={handleBackgroundMouseDown}
  onwheel={handleWheel}
  oncontextmenu={(e) => handleContextMenu(e, 'background')}
  role="button"
  tabindex="0"
  style:background-size="{GRID_SIZE * view.scale}px {GRID_SIZE * view.scale}px"
  style:background-position="{view.x}px {view.y}px"
  style:background-image={`
    linear-gradient(to right, var(--c-grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--c-grid-line) 1px, transparent 1px)
  `}
  style:background-color="var(--c-bg-primary)"
>
  
  <div 
    class="world-layer" 
    style:transform={`translate(${view.x}px, ${view.y}px) scale(${view.scale})`}
  >
    <div class="axis x-axis"></div>
    <div class="axis y-axis"></div>

    {#each tokens as token (token.id)}
      <div
        class="token-box {token.alignment || 'center'}" 
        class:selected={selectedToken?.id === token.id}
        style:left="{token.x}px"
        style:top="{token.y}px"
        style:width="{token.width}px"
        style:height="{token.height}px"
        style:z-index={token.z}
        onmousedown={(e) => handleMouseDown(e, token)}
        oncontextmenu={(e) => handleContextMenu(e, 'token', token)}
        role="button"
        tabindex="0"
      >
        <img
          src={token.src}
          alt="token"
          draggable="false"
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .tabletop-area {
    flex-grow: 1;
    background-color: var(--c-bg-primary);
    position: relative;
    cursor: default;
    outline: none;
    overflow: hidden;
  }

  .world-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: 0 0;
    pointer-events: none;
  }

  /* 軸のスタイル */
  .axis {
    position: absolute;
    background-color: var(--c-accent); /* 軸の色 */
    opacity: 0.5;
    pointer-events: none;
  }
  .x-axis {
    top: 0;
    left: -100000px; /* 十分長く */
    width: 200000px;
    height: 2px;
  }
  .y-axis {
    left: 0;
    top: -100000px;
    height: 200000px;
    width: 2px;
  }

  .token-box {
    position: absolute;
    cursor: grab;
    user-select: none;
    pointer-events: auto;
    box-sizing: border-box;
    /* 箱の領域を可視化したい場合はコメントアウトを外す */
    /* border: 1px dashed rgba(255, 255, 255, 0.2); */
    
    /* Flexboxで中身の画像を配置 */
    display: flex;
  }
  /* 選択時のボーダーは箱につく */
  .token-box.selected {
    outline: 2px solid var(--c-accent);
    background-color: rgba(0, 229, 255, 0.1); /* 選択範囲をわかりやすく */
    z-index: 9999 !important;
  }
  .token-box:active {
    cursor: grabbing;
  }
  /* 中身の画像 */
  .token-box img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain; /* アスペクト比を維持して収める */
    pointer-events: none; /* 画像自体のイベントは無視して箱で受ける */
  }

  /* 9方向配置のスタイル (Flexboxの組み合わせ) */
  .token-box.top-left      { justify-content: flex-start; align-items: flex-start; }
  .token-box.top-center    { justify-content: center;     align-items: flex-start; }
  .token-box.top-right     { justify-content: flex-end;   align-items: flex-start; }
  
  .token-box.center-left   { justify-content: flex-start; align-items: center; }
  .token-box.center        { justify-content: center;     align-items: center; } /* default */
  .token-box.center-right  { justify-content: flex-end;   align-items: center; }
  
  .token-box.bottom-left   { justify-content: flex-start; align-items: flex-end; }
  .token-box.bottom-center { justify-content: center;     align-items: flex-end; }
  .token-box.bottom-right  { justify-content: flex-end;   align-items: flex-end; }
</style>