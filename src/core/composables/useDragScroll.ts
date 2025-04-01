import { onMounted, onUnmounted, type Ref } from 'vue';
export function useDragScroll(
  elRef: Ref<HTMLElement | null>,
) {

  let isDragging = false;
  let startY = 0;
  let startX = 0;
  let scrollTop = 0;
  let scrollLeft = 0;

  const handleMouseDown = (e: MouseEvent) => {
    if (!elRef.value) return;
    
    isDragging = true;
    elRef.value.style.cursor = 'grabbing';
    startY = e.clientY;
    startX = e.clientX;
    scrollTop = elRef.value.scrollTop;
    scrollLeft = elRef.value.scrollLeft;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !elRef.value) return;
    
    const deltaY = e.clientY - startY;
    const deltaX = e.clientX - startX;
    elRef.value.scrollTop = scrollTop - deltaY;
    elRef.value.scrollLeft = scrollLeft - deltaX;
  };

  const handleMouseUp = () => {
    if (!elRef.value) return;
    
    isDragging = false;
    elRef.value.style.cursor = 'grab';
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!elRef.value) return;
    
    isDragging = true;
    const touch = e.touches[0];
    startY = touch.clientY;
    startX = touch.clientX;
    scrollTop = elRef.value.scrollTop;
    scrollLeft = elRef.value.scrollLeft;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !elRef.value) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    const deltaX = touch.clientX - startX;
    elRef.value.scrollTop = scrollTop - deltaY;
    elRef.value.scrollLeft = scrollLeft - deltaX;
    e.preventDefault();
  };

  onMounted(() => {
    const el = elRef.value;
    if (!el) return;

    el.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleMouseUp);
    el.style.cursor = 'grab';
  });

  onUnmounted(() => {
    const el = elRef.value;
    if (!el) return;

    el.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    el.removeEventListener('touchstart', handleTouchStart);
    el.removeEventListener('touchmove', handleTouchMove);
  });
}