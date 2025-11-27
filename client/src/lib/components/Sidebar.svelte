<script lang="ts">
  let { roomName, roomId, isGridMode = $bindable() } = $props();
</script>

<div class="sidebar-container">
  <h2>操作パネル</h2>
  <div class="mode-selector">
    <button 
      class:active={!isGridMode} 
      onclick={() => isGridMode = false}>
      自由配置モード
    </button>
    <button 
      class:active={isGridMode} 
      onclick={() => isGridMode = true}>
      グリッドモード
    </button>
  </div>
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
    gap: 1rem;
  }

  .mode-selector {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem;
    border: 1px solid var(--c-border);
    background-color: var(--c-bg-primary);
    color: var(--c-text-primary);
    cursor: pointer;
  }
  button.active {
    background-color: var(--c-main);
    border-color: var(--c-main);
    color: #fff; /* アクティブ時は白文字固定で見やすく */
    font-weight: bold;
  }
</style>