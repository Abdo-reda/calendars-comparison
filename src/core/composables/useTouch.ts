import { onMounted, onUnmounted, type Ref } from "vue";
import Hammer from 'hammerjs';

export function useTouch(element: Ref<HTMLElement|null>, doubleTapHandler: HammerListener, swipeHandler: HammerListener) {
	let hammerManager: HammerManager|undefined;
	let otherHammerManager: HammerManager|undefined;

    function setUpHammer() {
        hammerManager = new Hammer(document.body)
        hammerManager.on("doubletap", doubleTapHandler);
        hammerManager.on("swipe", swipeHandler);
        if (element.value)  {
            otherHammerManager = new Hammer(element.value)
            otherHammerManager.on("swipe", swipeHandler);
            otherHammerManager.off("doubletap", doubleTapHandler)
        }
    }

    function destroyHammer(hammer: HammerManager|undefined) {
        if (!hammer) return;
        hammer.off("doubletap", doubleTapHandler)
        hammer.off("swipe", swipeHandler)
        hammer.destroy();
    }

	onMounted(() => {
        setUpHammer();
    });

	onUnmounted(() => {
        destroyHammer(hammerManager);
        destroyHammer(otherHammerManager);
    });
}
