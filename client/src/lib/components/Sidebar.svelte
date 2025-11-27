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
  /* スタイル調整 */
  .sidebar-container {
    width: 250px;
    height: 100%;
    background-color: #2c2c2c;
    padding: 1rem;
    border-left: 1px solid #505050;
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
    border: 1px solid #555;
    background-color: #333;
    color: #fff;
    cursor: pointer;
  }
  button.active {
    background-color: #646cff;
    border-color: #646cff;
    font-weight: bold;
  }
</style>