<template>
  <div v-if="isActive" class="confetti-container">
    <div v-for="(confetto, index) in confetti" :key="index" class="confetti" :style="confettoStyle(confetto)" />
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, onMounted, onUnmounted, computed, watch } from 'vue';

const props = defineProps<{
  isActive: boolean;
}>();

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

let animationFrame: number | undefined;

const COLORS: string[] = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50',
  '#8BC34A', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
];

const confetti = ref<Confetto[]>(Array.from({ length: 100 }).map(() => ({
  x: 50,
  y: 50,
  rotation: Math.random() * 360,
  size: Math.random() * 0.8 + 0.5,
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  speed: Math.random() * 3 + 1,
  angle: Math.random() * 360,
  rotationSpeed: (Math.random() - 0.5) * 10,
})));

const updateConfetti = (): void => {
  confetti.value = confetti.value.map((confetto) => {
    const angleRad = (confetto.angle * Math.PI) / 180;
    confetto.x += Math.cos(angleRad) * confetto.speed * 0.3;
    confetto.y += Math.sin(angleRad) * confetto.speed * 0.3 + 0.1;
    confetto.rotation += confetto.rotationSpeed;
    return confetto;
  });

  if (props.isActive) {
    animationFrame = requestAnimationFrame(updateConfetti);
  }
};

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

onMounted(() => {
  if (props.isActive) {
    animationFrame = requestAnimationFrame(updateConfetti);
  }
});

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});

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
  0% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
  }
}
</style>
