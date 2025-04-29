<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <button v-if="showCloseButton" class="close-button" @click="closeModal">&times;</button>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps<{
  isOpen: boolean;
  showCloseButton?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const closeModal = (): void => {
  emit('close');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  animation: fade-in 0.3s ease;
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: 80%;
  max-width: 400px;
  animation: scale-in 0.3s ease;
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  font-weight: bold;
  color: #555;
  cursor: pointer;
  padding: 5px 10px;
  line-height: 1;
}

.close-button:hover {
  color: #000;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
