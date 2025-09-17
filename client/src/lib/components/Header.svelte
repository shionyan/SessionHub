<script lang="ts">
  export let roomName: string;
  export let roomId: string;
</script>

<div class="header">
  <div class="tool-bar">
    <button class="room-name-root">
      <h6 class="room-name">
        {roomName}
      </h6>
      <span class="room-name-pulldown-button-wrapping">
        <svg class="room-name-pulldown-button" viewBox="0 0 24 24">
          <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
        </svg>
      </span>
    </button>
    <div class="spacer"></div>
    <button class="menu-button">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
      </svg>
    </button>
  </div>
</div>

<style>
  .header {
    display: flex;
    width: 100%;
    position: fixed;
    align-items: center;
    min-height: 64px;
    flex-direction: row;
  }
  .tool-bar {
    display: flex;
    width: 100%;
    align-items: center;
    padding: 0px 24px;
    box-sizing: border-box;
  }
  .room-name-root {
    display: inline-flex;
    align-items: center;
    padding: 6px 8px;
  }
  .room-name {
    margin: 0;
    font-weight: bold;
    font-size: 0.875rem;
    font-family: Roboto, Helvetica, Arial, sans-serif;
  }
  .room-name-pulldown-button-wrapping {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding-left: 5px;
  }
  .room-name-pulldown-button {
    width: 1em;
    height: 1em;
    fill: white;
  }
  .spacer {
    flex-grow: 1;
  }
</style>