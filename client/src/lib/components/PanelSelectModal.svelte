<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ImageAsset, ImageType } from '../types';

  export let showModal: boolean;

  const dispatch = createEventDispatcher();

  // ---- 状態変数 ----
  let imageType: ImageType = 'RASTER';
  let isDragging = false;

  let uploadedImageSrc: string | null = null;
  let fileInput: HTMLInputElement;

  // 表示用の画像リスト（TODO: 将来的にAPIから取得）
  let roomImages: ImageAsset[] = []; 
  let libraryImages: ImageAsset[] = [];
  let selectedImage: ImageAsset | null = null;
  let isLoading = false;

  function closeModal() {
    if (isLoading) return;
    dispatch('close');
  }

  // ファイルが選択される
  async function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    isLoading = true;
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'ファイルのアップロードに失敗しました。');
      }
      console.log('サーバに')
    }
  }

  function handleImageUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedImageSrc = e.target?.result as string;
      };
      reader.readAsDataURL(target.files[0]);
    }
  }

  function handleCreate() {
    if (uploadedImageSrc) {
      dispatch('create', { src: uploadedImageSrc, imageType: imageType });
      closeModal();
    } else {
      alert('画像をアップロードしてください。');
    }
  }
</script>

{#if showModal}
  <div class="backdrop" on:click|self={closeModal}>
    <div class="modal-content">
      <div class="tabs">
        <button class:active={imageType === 'RASTER'} on:click={() => imageType = 'RASTER'}>
          ラスター画像
        </button>
        <button class:active={imageType === 'VECTOR'} on:click={() => imageType = 'VECTOR'} disabled>
          ベクター (未実装)
        </button>
      </div>

      {#if imageType === 'RASTER'}
        <div class="tab-content">
          <input type="file" accept="image/*" on:change={handleImageUpload} bind:this={fileInput} style="display: none;" />
          <button on:click={() => fileInput.click()}>画像を選択</button>
          {#if uploadedImageSrc}
            <div class="image-preview">
              <img src={uploadedImageSrc} alt="Preview" />
            </div>
          {/if}
        </div>
      {/if}

      <div class="actions">
        <button on:click={handleCreate} disabled={!uploadedImageSrc}>作成</button>
        <button on:click={closeModal} class="cancel">キャンセル</button>
      </div>
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
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3000;
  }
  .modal-content {
    background-color: #2c2c2c;
    color: white;
    padding: 1.5rem 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    width: 80%;
    max-width: calc(100% - 64px);
    height: 80%;
    max-height: calc(100% - 64px);
  }
  .tabs {
    display: flex;
    border-bottom: 1px solid #505050;
    margin-bottom: 1rem;
  }
  .tabs button {
    background: none;
    border: none;
    color: #aaa;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 0px;
  }
  .tabs button.active {
    color: white;
    border-bottom: 2px solid #646cff;
  }
  .image-preview {
    margin-top: 1rem;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #505050;
    border-radius: 4px;
  }
  .image-preview img {
    width: 100%;
    height: auto;
    display: block;
  }
  .actions {
    margin-top: 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>