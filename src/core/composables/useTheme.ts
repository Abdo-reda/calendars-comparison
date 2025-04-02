import { ref } from "vue"

type TTheme = 'light' | 'dark';

export function useTheme() {
    const currentTheme = ref<TTheme>('light');

    function toggleTheme() {
        currentTheme.value = (currentTheme.value === 'light') ? 'dark' : 'light';
        setTheme();
    }

    function setTheme() {
        const newTheme = currentTheme.value;
        const oldTheme = (currentTheme.value === 'light') ? 'dark' : 'light';
        document.body.classList.remove(oldTheme);
        document.body.classList.add(newTheme);
    }
    
    setTheme();

    return { currentTheme, toggleTheme }
}