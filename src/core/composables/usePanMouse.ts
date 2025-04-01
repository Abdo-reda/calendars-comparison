import { ref, onMounted, onUnmounted } from 'vue'

export function usePanMouse() {
  const isPanActive = ref(false);

  function handleMouseDown(event: MouseEvent) {
    if (event.button === 2) {
      isPanActive.value = true;
      document.body.style.cursor = 'all-scroll';
    }
  }

  function handleMouseUp(event: MouseEvent) {
    if (event.button === 2) {
      isPanActive.value = false;
      document.body.style.cursor = 'default';
    }
  }

  function handleContextMenu(event: Event) {
    event.preventDefault();
  }

  onMounted(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);
  });

  onUnmounted(() => {
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('contextmenu', handleContextMenu);
  });

  return { isPanActive }
}