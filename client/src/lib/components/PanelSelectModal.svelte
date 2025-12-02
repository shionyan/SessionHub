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
    dispatch('close');
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }
  function handleDragLeave() {
    isDragging = false;
  }
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files) {
      console.log('Drop:', e.dataTransfer.files);
    }
  }

  // ファイルが選択される
  async function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    isLoading = true;
    const formData = new FormData();
    formData.append('image', file);

    try {
      // サーバーへのアップロード処理
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/update`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'アップロードに失敗しました。');
      }

      console.log('アップロード成功:', result);

      // アップロード成功後、サムネイルを生成してリストに追加
      const newAsset: ImageAsset = {
        id: `new-${Date.now()}`,
        src: `http://localhost:3000${result.filePath}`, // サーバーから返されたパス
        thumbnail: URL.createObjectURL(file), // サムネイルはブラウザで一時的に生成
        type: 'PANEL', // TODO: タイプを選択できるようにする
        tags: [],
      };
      libraryImages = [newAsset, ...libraryImages];
      selectedImage = newAsset; // アップロードしたものを選択状態にする

    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      isLoading = false;
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
  <div 
    class="backdrop" 
    onclick={closeModal}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
  >
    <div class="modal-content"
      role="presentation"
      onclick={(e) => e.stopPropagation()}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}>
      <div class="tabs">
        <button class:active={imageType === 'RASTER'} onclick={() => imageType = 'RASTER'}>
          ラスター画像
        </button>
        <button class:active={imageType === 'VECTOR'} onclick={() => imageType = 'VECTOR'} disabled>
          ベクター (未実装)
        </button>
      </div>

      {#if imageType === 'RASTER'}
        <div class="tab-content">
          <input type="file" accept="image/*" onchange={handleImageUpload} bind:this={fileInput} style="display: none;" />
          <button onclick={() => fileInput.click()}>画像を選択</button>
          {#if uploadedImageSrc}
            <div class="image-preview">
              <img src={uploadedImageSrc} alt="Preview" />
            </div>
          {/if}
        </div>
      {/if}

      <div class="actions">
        <button onclick={handleCreate} disabled={!uploadedImageSrc}>作成</button>
        <button onclick={closeModal} class="cancel">キャンセル</button>
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