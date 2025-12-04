<script lang="ts">
  import Sidebar from '$SessionTool/Sidebar.svelte';
  import Tabletop from '$SessionTool/Tabletop.svelte';
  import Topbar from '$SessionTool/Topbar.svelte';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { socket } from '$lib/socket';
  import type { SceneObject } from '$lib/types';
  import type { User } from '@supabase/supabase-js';

  // URLからルームIDを取得する
  // もしIDがなければ、'default-room'に入る
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const roomId = pathSegments.length > 1 && pathSegments[0] === 'room'
    ? pathSegments[1]
    : 'default-room';

  let roomName = $state('部屋を読み込み中...');
  let initialTokens: SceneObject[] = $state([]);
  let selectedToken: SceneObject | null = $state(null);
let user: User | null = $state(null);

  onMount(() => {
    console.log("🚀 アプリ起動: ログインチェック開始");

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("📦 セッション取得結果:", session);
      user = session?.user ?? null;
      console.log("👤 ユーザー状態:", user ? "ログイン済み" : "未ログイン");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔄 状態変更イベント:", _event);
      user = session?.user ?? null;
    });

    return () => subscription.unsubscribe();
  });
  // Googleログイン処理
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  }

  // ログアウト処理
  async function signOut() {
    await supabase.auth.signOut();
  }
</script>

{#if !user}
  <div class="login-container">
    <h1>SessionHubへようこそ</h1>
    <button onclick={signInWithGoogle}>Googleでログイン</button>
  </div>
{:else}
  <div class="app-container">
    <div class="main-content">
      <Topbar roomName={roomName} />
      <Tabletop {roomId} {initialTokens} bind:selectedToken={selectedToken}/>
    </div>
    <div class="sidebar-wrapper">
      <Sidebar {roomId} bind:selectedToken={selectedToken} />
      <button onclick={signOut} class="logout-btn">ログアウト</button>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
  .app-container {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    justify-content: space-between;
  }
  .main-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    position: relative; /* Topbar の位置の基準点となります */
  }
  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: white;
  }
</style>