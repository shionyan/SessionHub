<script lang="ts">
  import { socket } from '../socket';
  import type { SceneObject, TokenAlignment } from '../types';
  let { roomId, selectedToken = $bindable(null) } = $props();

  // 更新処理
  function update() {
    if (!selectedToken) return;
    socket.emit('updateObject', { roomId, token: selectedToken });
  }

  // アライメント設定
  function setAlignment(align: TokenAlignment) {
    if (!selectedToken) return;
    selectedToken.alignment = align;
    update();
  }
</script>

<div class="sidebar-container">
  <h2>プロパティ</h2>
  
  {#if selectedToken}
    <div class="property-group">
      <span class="group-label">位置・サイズ</span>
      <div class="row">
        <div class="input-wrap">
          <span>X</span>
          <input type="number" bind:value={selectedToken.x} onchange={update} />
        </div>
        <div class="input-wrap">
          <span>Y</span>
          <input type="number" bind:value={selectedToken.y} onchange={update} />
        </div>
      </div>
      <div class="row">
        <div class="input-wrap">
          <span>W</span>
          <input type="number" bind:value={selectedToken.width} onchange={update} />
        </div>
        <div class="input-wrap">
          <span>H</span>
          <input type="number" bind:value={selectedToken.height} onchange={update} />
        </div>
      </div>
    </div>

    <div class="property-group">
      <span class="group-label">アライメント</span>
      <div class="alignment-grid">
        {#each [
          'top-left', 'top-center', 'top-right',
          'center-left', 'center', 'center-right',
          'bottom-left', 'bottom-center', 'bottom-right'
        ] as align}
          <button 
            class:active={selectedToken.alignment === align} 
            onclick={() => setAlignment(align as TokenAlignment)}
            title={align}
            aria-label={align}
          >
            <div class="dot" class:dot-active={selectedToken.alignment === align}></div>
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <p class="empty-msg">オブジェクトを選択してください</p>
  {/if}
</div>

<style>
  .sidebar-container {
    width: 250px;
    height: 100%;
    background-color: var(--c-bg-secondary);
    padding: 1rem;
    border-left: 1px solid var(--c-border);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    color: var(--c-text-primary);
  }

  .property-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .group-label {
    font-size: 0.85rem;
    color: var(--c-text-secondary);
    font-weight: bold;
  }

  .row {
    display: flex;
    gap: 0.5rem;
  }

  .input-wrap {
    display: flex;
    align-items: center;
    background-color: var(--c-bg-primary);
    border: 1px solid var(--c-border);
    border-radius: 4px;
    padding: 0 0.5rem;
    flex: 1;
  }

  input[type="number"] {
    background: none;
    border: none;
    color: var(--c-text-primary);
    width: 100%;
    padding: 0.4rem 0;
    font-size: 0.9rem;
    outline: none;
  }

  /* 9方向グリッド */
  .alignment-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    width: 100px; /* サイズ感調整 */
  }

  .alignment-grid button {
    aspect-ratio: 1;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--c-bg-primary);
    border: 1px solid var(--c-border);
    border-radius: 2px;
    cursor: pointer;
  }

  .alignment-grid button:hover {
    background-color: #3a3a3a;
  }

  .alignment-grid button.active {
    background-color: var(--c-main);
    border-color: var(--c-main);
  }

  .dot {
    width: 4px;
    height: 4px;
    background-color: var(--c-text-secondary);
    border-radius: 50%;
  }
  
  .dot-active {
    background-color: white;
  }

  .empty-msg {
    color: var(--c-text-secondary);
    font-size: 0.9rem;
    text-align: center;
    margin-top: 2rem;
  }
</style>