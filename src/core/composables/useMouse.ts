import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const mouseXRatio = ref(0);

  function update(event: MouseEvent) {
    mouseXRatio.value = event.pageX / window.innerWidth; 
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { mouseXRatio }
}