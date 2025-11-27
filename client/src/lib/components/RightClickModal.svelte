<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let showRightClickModal = false;
  export let menuX: number;
  export let menuY: number;

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  // Escで閉じる
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if showRightClickModal}
  <div 
    class="backdrop" 
    onclick={closeModal} 
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
  >
    <div class="context-menu" style="top: {menuY}px; left: {menuX}px;">
      <slot></slot>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent; /* 透明な背景でクリックを検知 */
    z-index: 2000;
  }
  .context-menu {
    position: absolute; /* 親要素ではなく画面全体を基準に位置を決定 */
    background-color: rgba(31, 31, 31, 0.8);
    box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
    z-index: 2001; /* backdropより手前に表示 */
    min-width: 180px;
    font-size: 0.875rem;
    font-family: Roboto, Helvetica, Arial, sans-serif;
    border-radius: 4px;
    overflow: hidden; /* 角を丸めるため */
  }

  :global(.menu-list) {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
  }
  
  :global(.menu-item) {
    background: none;
    border: none;
    text-align: left;
    padding: 8px 16px;
    cursor: pointer;
    color: white;
    font-size: 0.9rem;
    width: 100%;
    border-radius: 0;
  }
  
  :global(.menu-item:hover) {
    background-color: rgba(255, 255, 255, 0.1);
    color: white; /* ボタン文字色強制 */
  }

  :global(.menu-item.warning:hover) {
    background-color: rgba(255, 50, 50, 0.3);
  }
</style>