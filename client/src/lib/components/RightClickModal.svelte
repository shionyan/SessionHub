<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let showModal = false;
  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }
</script>

{#if showModal}
  <div class="backdrop" on:click|self={closeModal}>
    <div class="modal-content">
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
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }
  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }
</style>