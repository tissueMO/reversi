<template>
  <div v-if="isActive" class="confetti-container">
    <div
      v-for="(confetto, index) in confetti"
      :key="index"
      class="confetti"
      :style="confettoStyle(confetto)"/>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted, onUnmounted, computed, watch } from 'vue';

/**
 * クラッカーアニメーションの表示状態を受け取る
 */
const props = defineProps<{
  isActive: boolean;
}>();

/**
 * クラッカーの色のバリエーション
 */
const COLORS = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];

/**
 * クラッカーの紙片を表現するインターフェース
 */
interface Confetto {
  x: number;
  y: number;
  rotation: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  rotationSpeed: number;
}

/**
 * クラッカーの紙片コレクション
 * 画面中央から放出される100個の紙片をランダム生成
 */
const confetti = ref<Confetto[]>(Array.from({ length: 100 }).map(() => ({
  x: 50, // 画面中央のX座標（%）
  y: 50, // 画面中央のY座標（%）
  rotation: Math.random() * 360, // 初期回転
  size: Math.random() * 0.8 + 0.5, // サイズ
  color: COLORS[Math.floor(Math.random() * COLORS.length)], // ランダムな色
  speed: Math.random() * 3 + 1, // 移動速度
  angle: Math.random() * 360, // 移動方向
  rotationSpeed: (Math.random() - 0.5) * 10, // 回転速度
})));

/**
 * アニメーションフレーム用のID
 */
let animationFrame: number;

/**
 * クラッカー紙片のスタイル生成
 */
const confettoStyle = computed(() => {
  return (confetto: Confetto) => {
    return {
      left: `${confetto.x}%`,
      top: `${confetto.y}%`,
      transform: `rotate(${confetto.rotation}deg) scale(${confetto.size})`,
      backgroundColor: confetto.color,
    };
  };
});

/**
 * クラッカーアニメーション更新処理
 */
const updateConfetti = (): void => {
  confetti.value = confetti.value.map(confetto => {
    // ラジアンに変換
    const angleRad = (confetto.angle * Math.PI) / 180;
    // X方向の移動
    confetto.x += Math.cos(angleRad) * confetto.speed * 0.3;
    // Y方向の移動（重力効果を加える）
    confetto.y += Math.sin(angleRad) * confetto.speed * 0.3 + 0.1;
    // 回転更新
    confetto.rotation += confetto.rotationSpeed;

    // 画面外に出たら再配置せずそのまま移動（一時的な効果のため）
    return confetto;
  });

  // 再帰的にアニメーション実行
  if (props.isActive) {
    animationFrame = requestAnimationFrame(updateConfetti);
  }
};

/**
 * コンポーネントマウント時の処理
 */
onMounted(() => {
  if (props.isActive) {
    animationFrame = requestAnimationFrame(updateConfetti);
  }
});

/**
 * コンポーネントアンマウント時のクリーンアップ
 */
onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});

/**
 * アクティブ状態が変わった時の監視
 */
watch(
  () => props.isActive,
  (newValue) => {
    if (newValue && !animationFrame) {
      animationFrame = requestAnimationFrame(updateConfetti);
    } else if (!newValue && animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    }
  },
);
</script>

<style scoped>
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  opacity: 0.8;
  animation: fadeOut 3s forwards;
}

@keyframes fadeOut {
  0% { opacity: 0.8; }
  80% { opacity: 0.8; }
  100% { opacity: 0; }
}
</style>
