<script lang="ts">
  export let roomName: string;
  export let roomId: string;
</script>

<div class="topbar-wrapper">
  <div class="hover-trigger"></div>

  <div class="topbar-content">
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
</div>

<style>
  .topbar-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
  }

  .hover-trigger {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 15px;
  }

  button {
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: rgba(0, 0, 0/0);
    cursor: pointer;
    transition: border-color 0.25s;
  }
  button:hover {
    background-color: #242424;
  }

  .topbar-content {
    display: flex;
    width: 100%;
    align-items: center;
    min-height: 64px;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
    transform: translateY(-100%);
    transition: transform 0.3s ease-in-out;
  }

  .topbar-wrapper:hover .topbar-content {
    transform: translateY(0);
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
    color: white;
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
  .menu-button {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    padding: 6px;
    margin: 0px;
    color: white;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>