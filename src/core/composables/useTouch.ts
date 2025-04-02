import { onMounted, onUnmounted } from "vue";
import Hammer from 'hammerjs';

export function useTouch(doubleTapHandler: HammerListener, swipeHandler: HammerListener) {
	let hammerManager: HammerManager|undefined;

    function setUpHammer() {
        hammerManager = new Hammer(document.body)
        hammerManager.on("doubletap", doubleTapHandler);
        hammerManager.on("swipe", swipeHandler);
    }

	onMounted(() => {
        setUpHammer();
    });

	onUnmounted(() => {
        if (hammerManager) {
            hammerManager.off("doubletap", doubleTapHandler)
            hammerManager.off("swipe", swipeHandler)
            hammerManager.destroy();
        }
    });
}
