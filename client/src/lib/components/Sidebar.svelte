<script lang="ts">
  export let roomName: string;
  export let roomId: string;
</script>

<div class="sidebar-container">
  <h2>操作パネル</h2>
  <div class="mode-selector">
    <button>自由配置モード</button>
    <button>グリッドモード</button>
  </div>
  </div>

<style>
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
    border: 1px solid #ccc;
    background-color: white;
    cursor: pointer;
  }
</style>