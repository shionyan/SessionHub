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
  <div class="backdrop" on:click|self={closeModal} on:contextmenu|preventDefault|stopPropagation>
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

  /* スロット経由で挿入されるul, liのスタイルをここで定義 */
  :global(.context-menu ul) {
    list-style: none;
    padding: 5px 0;
    margin: 0;
  }
  :global(.context-menu li) {
    padding: 8px 15px;
    cursor: pointer;
    color: white;
  }
  :global(.context-menu li:hover) {
    background-color: rgba(73, 73, 73, 0.8);
  }
</style>