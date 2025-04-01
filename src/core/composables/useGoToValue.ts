import { reactive, ref } from "vue";
import { gsap } from "gsap";

export function useGoToValue(onUpdate: (deltaValue: number) => void, value: number = 0) {
	const state = reactive({ value: value });
	const inProgress = ref(false);
	let tween: gsap.core.Tween;
	let previousValue = value;
  const MAX_DELTA = 80000; 
	function restart(initialValue: number) {
		if (tween) tween.kill();
		state.value = initialValue;
		previousValue = initialValue;
		inProgress.value = true;
    const duration = Math.max(Math.abs(initialValue/MAX_DELTA), 3);
		tween = gsap.to(state, {
			value: 0,
      duration: duration,
			ease: "power1.out",
			onUpdate: () => {
				const delta = previousValue - state.value;
				previousValue = state.value;
				onUpdate(delta);
			},
			onComplete: () => {
				inProgress.value = false;
			},
		});
	}

	return { inProgress, restart };
}
