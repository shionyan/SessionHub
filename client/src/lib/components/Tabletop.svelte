<script lang="ts">
  import { onMount, onDestroy  } from 'svelte';
  import { socket } from '../socket';
  import type { SceneObject, ImageType } from '../types';
  import RightClickModal from './RightClickModal.svelte';
  import PanelSelectModal from './PanelSelectModal.svelte';

  // App.svelteからルームIDを受け取る
  let { roomId, initialTokens = [], isGridMode = false } = $props();

  // State
  let tokens = $state(initialTokens);
  let activeToken: SceneObject | null = $state(null);
  let selectedTokenId: string | null = $state(null);

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
    if (!isGridMode) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  // #region --- マウス操作ハンドラ ---
  // 1. トークンのドラッグ開始
  function handleMouseDown(event: MouseEvent, token: SceneObject) {
    if (event.button !== 0) return;
    event.stopPropagation();
    
    activeToken = token;
    selectedTokenId = token.id;
    isDraggingToken = true;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  // 2. 背景のドラッグ開始（視点移動）
  function handleBackgroundMouseDown(event: MouseEvent) {
    if (event.button === 0 || event.button === 1) {
      selectedTokenId = null;
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
      
      let nextX = activeToken.x + deltaX;
      let nextY = activeToken.y + deltaY;

      // グリッドモードならスナップ（移動中はカクカクするが分かりやすい）
      // ※より高度にするなら「ドラッグ中は自由、離すとスナップ」だが、要望の「配置ができるように」に従い常時スナップさせる
      if (isGridMode) {
        // 現在のマウス位置に対応するグリッド座標に吸着させるロジックに変更
        // deltaを加算する方式だと誤差が積もるため、マウス座標から逆算するのが理想だが、
        // 既存ロジックへの変更を最小限にするため、ここでは「移動量を加算した結果」をスナップする
        // ただし、これだとドラッグしづらい（少し動かしても戻される）場合がある。
        // なので、今回は「内部値は自由に更新、表示・送信時にスナップ」はせず、
        // 単純に「グリッドモードONなら移動量に関わらず直近のグリッドに配置」は操作性が悪いので、
        // ドラッグ終了時にスナップさせるか、あるいは「移動」ではなく「配置」と割り切るか。
        // ここでは「内部座標は更新し、描画側でスナップ」はSvelteのリアクティブだと難しいので、
        // そのまま座標を更新します（オートスナップはまだ実装しない、または将来の課題とする、という手もあるが、要望にあるので実装）
        
        // 修正: 常にスナップさせると動きにくいので、今回は「ドラッグ中は自由移動」とし、
        // `handleMouseUp` (ドロップ時) にスナップさせる挙動にします。
      }

      activeToken.x = nextX;
      activeToken.y = nextY;

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
    if (activeToken && isDraggingToken && isGridMode) {
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
    
    if (isGridMode) {
        wx = snapToGrid(wx);
        wy = snapToGrid(wy);
    }

    clickCoords = { x: wx, y: wy };

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
        x: clickCoords.x - (isGridMode ? 0 : img.width / 2),
        y: clickCoords.y - (isGridMode ? 0 : img.height / 2),
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
  <RightClickModal showRightClickModal={showRightClickModal} {menuX} {menuY} on:close={closeMenu}>
    <ul>
      {#if contextMenuType === 'background'}
        <li onclick={() => { alert('フレームオブジェクトは未実装です'); closeMenu(); }}>フレームオブジェクトを追加</li>
        <li onclick={openPanelSelectModal}>パネルオブジェクトを追加</li>
      {:else}
        <li onclick={() => { alert(`編集: ${targetTokenId}`); closeMenu(); }}>詳細編集（未実装）</li>
        <li onclick={() => { alert(`削除: ${targetTokenId}`); closeMenu(); }}>削除（未実装）</li>
        <li onclick={() => { alert(`前面へ: ${targetTokenId}`); closeMenu(); }}>最前面へ移動</li>
      {/if}
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
  bind:this={tabletopElement}
  onmousedown={handleBackgroundMouseDown}
  onwheel={handleWheel}
  oncontextmenu={(e) => handleContextMenu(e, 'background')}
  role="button"
  tabindex="0"
  style:background-size="{isGridMode ? `${GRID_SIZE * view.scale}px ${GRID_SIZE * view.scale}px` : 'cover'}"
  style:background-position="{isGridMode ? `${view.x}px ${view.y}px` : 'center'}"
  style:background-image="{isGridMode ? `
    linear-gradient(to right, var(--c-grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--c-grid-line) 1px, transparent 1px)
  ` : `url('/background.jpg')`}"
  style:background-color="var(--c-bg-primary)"
>
  
  <div 
    class="world-layer" 
    style:transform={`translate(${view.x}px, ${view.y}px) scale(${view.scale})`}
  >
    <div class="axis x-axis"></div>
    <div class="axis y-axis"></div>

    {#each tokens as token (token.id)}
      <img
        class="token"
        class:selected={selectedTokenId === token.id}
        src={token.src}
        alt="token"
        draggable="false"
        style:left="{token.x}px"
        style:top="{token.y}px"
        style:width="{token.width}px"
        style:height="{token.height}px"
        style:z-index={token.z}
        onmousedown={(e) => handleMouseDown(e, token)}
        oncontextmenu={(e) => handleContextMenu(e, 'token', token)}
      />
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

  .token {
    position: absolute;
    cursor: grab;
    user-select: none;
    pointer-events: auto;
    box-sizing: border-box; 
  }
  .token.selected {
    outline: 2px solid var(--c-accent);
    z-index: 9999 !important; /* 選択中は手前に表示 */
  }
  
  .token:active {
    cursor: grabbing;
  }
</style>