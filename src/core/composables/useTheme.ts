import { onMounted, onUnmounted, ref } from "vue"

type TTheme = 'light' | 'dark';

export function useTheme() {
    const currentTheme = ref<TTheme>('light');

    function handleDoubleClick() {
        currentTheme.value = (currentTheme.value === 'light') ? 'dark' : 'light';
        setTheme();
    }

    function setTheme() {
        const newTheme = currentTheme.value;
        const oldTheme = (currentTheme.value === 'light') ? 'dark' : 'light';
        document.body.classList.remove(oldTheme);
        document.body.classList.add(newTheme);
    }

    onMounted(() => {
        window.addEventListener('dblclick', handleDoubleClick);
        setTheme();
    })
    onUnmounted(() => window.removeEventListener('dblclick', handleDoubleClick))

    return { currentTheme }
}