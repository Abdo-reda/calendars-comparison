<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, useTemplateRef } from 'vue';
import { gsap } from "gsap";
import type { ICalendarDay, IDay } from './core/interfaces/dayInterface';
import type { IRecycleScroller } from './core/interfaces/recycleScrollerInterface';
import { createHijriDay, createMiladyDay, getHijriDateParts, hijiriLocaleFormatterDefault, miladyLocaleFormatterDefault } from './core/utilities/dateUtil';
import { useMouse } from './core/composables/useMouse';
import { usePanMouse } from './core/composables/usePanMouse';
import { useTheme } from './core/composables/useTheme';
import { useGoToValue } from './core/composables/useGoToValue';
import { useTouch } from './core/composables/useTouch';

//---------- The following code is really shitty and bad. But it works and its mine ... so fuck it!

//TODO:
//- explanations
//- mobile support 
//- better mobile support

let copiedTimeout: number | null = null;
let hoverTimeout: number | null = null;
let focusTimeout: number | null = null;
let scrollFlag = true;
let scrollPercentSmooth = 0;
let hijriScrollPercentSmooth = 0;
const SECRET_DATES = [
  new Date('2001-02-23').toLocaleDateString(),
  new Date('2003-04-10').toLocaleDateString(),
]
const SMOOTHNESS = 0.05;
const SCROLL_SPEED_FACTOR = 8;
const daySize = 24;
const dayGap = 12;
const RANGE = 4096;
const yearsSequence = gsap.timeline({ paused: true });
const hijriYearsSequence = gsap.timeline({ paused: true });
const recycleContainer = useTemplateRef<IRecycleScroller>('recycle-container');
const dateInput = useTemplateRef<HTMLInputElement>('date-input');
const { mouseXRatio } = useMouse();
const { isPanActive } = usePanMouse();
const { inProgress, restart } = useGoToValue(handleScrollBy);
const { toggleTheme } = useTheme();

const recycleScroller = ref<HTMLDivElement | null>(null);
const inputDate = ref('');
const currentYear = ref(new Date().getUTCFullYear())
const activeMonth = ref<string | null>(null);
const activeDate = ref<string | null>();
const isActiveDateHijri = ref<boolean>(false);
const showCopied = ref<boolean>(false);
const showTooltip = ref<boolean>(false);
const tooltipX = ref<number>(0);
const tooltipY = ref<number>(0);
const scrollLeft = ref<number>(0);
const years = reactive([currentYear.value - 1, currentYear.value, currentYear.value + 1]);
const activeYear = ref<number>(years[1]);
const activeHijriYear = ref<number>(years[1]);

const yearDaysWidth = computed(() => years.map(y => daysInYear(y) * (daySize + dayGap) - dayGap));
const scrollWidth = computed(() => days.value.length * (daySize + dayGap))

const days = computed<ICalendarDay[]>(() => {
  const yearDays: ICalendarDay[] = [];

  for (const y of years) {
    const currentYearDate = new Date(y, 0, 1);
    if (y > 0 && y < 100) currentYearDate.setFullYear(y);
    if (y <= 0) continue;
    for (let day = 1; day <= daysInYear(y); day++) {
      const miladyDay = createMiladyDay(currentYearDate);
      const hijriDay = createHijriDay(currentYearDate);
      if (miladyDay) {
        yearDays.push({
          id: miladyDay.short,
          miladyDay,
          hijriDay,
        });
      }
      currentYearDate.setDate(currentYearDate.getDate() + 1);
    }
  }

  return yearDays;
});

const tooltipPos = computed(() => ({
  left: `${tooltipX.value}px`,
  top: `${tooltipY.value + (isActiveDateHijri.value ? daySize + dayGap : 0)}px`,
}));

const scrollSpeed = computed(() => (mouseXRatio.value - 0.5) / 0.5);
const scrollSpeedMapped = computed(() => Math.exp(Math.abs(3 * scrollSpeed.value)) * scrollSpeed.value);
const scrollPercent = computed(() => {
  const lastMonthDays = 30 * (daySize + dayGap);
  const shiftedScroll = scrollLeft.value + lastMonthDays;
  const firstYearPercent = (shiftedScroll) / (yearDaysWidth.value[0]);
  const midYearPercent = (shiftedScroll - yearDaysWidth.value[0]) / (yearDaysWidth.value[1]);
  const lastYearPercent = (shiftedScroll - yearDaysWidth.value[0] - yearDaysWidth.value[1]) / (yearDaysWidth.value[2]);
  changeActiveYear(firstYearPercent, midYearPercent, lastYearPercent);
  return getActiveYear(firstYearPercent, midYearPercent, lastYearPercent);
});
const activeMiladyDate = computed(() => {
  const yearStart = new Date(activeYear.value, 0, 1);
  yearStart.setFullYear(activeYear.value);
  const yearEnd = new Date(activeYear.value, 11, 31);
  yearEnd.setFullYear(activeYear.value);
  const date = new Date(yearStart.getTime() + scrollPercent.value * (yearEnd.getTime() - yearStart.getTime()));
  date.setFullYear(activeYear.value);
  return date;
});
const hijriScrollPercent = computed(() => {
  const hijriDate = getHijriDateParts(activeMiladyDate.value);

  activeHijriYear.value = hijriDate.year;
  const fullCycles = Math.floor((hijriDate.month - 1) / 2);
  const remainingMonths = (hijriDate.month - 1) % 2;
  const daysPassed =
    (fullCycles * 59) +
    (remainingMonths * 30) +
    (hijriDate.day - 1);

  const percent = daysPassed / daysInYear(activeYear.value);
  if (percent > 0.97) return 1;
  return percent / 0.97;
})
const displayCurrentMildayDay = computed(() => miladyLocaleFormatterDefault.format(activeMiladyDate.value));
const displayCurrentHijriDay = computed(() => hijiriLocaleFormatterDefault.format(activeMiladyDate.value));

gsap.ticker.add(() => {
  scrollPercentSmooth += (scrollPercent.value - scrollPercentSmooth) * ((scrollPercent.value > 0.99 || scrollPercent.value < 0.01) ? 1 : SMOOTHNESS);
  hijriScrollPercentSmooth += (hijriScrollPercent.value - hijriScrollPercentSmooth) * ((hijriScrollPercent.value > 0.99 || hijriScrollPercent.value < 0.01) ? 1 : SMOOTHNESS);
  yearsSequence.totalProgress(scrollPercentSmooth, true);
  hijriYearsSequence.totalProgress(hijriScrollPercentSmooth, true);
});

onMounted(async () => {
  document.addEventListener("visibilitychange", handleVisiblity);
  document.addEventListener("focus", handleVisiblity);
  document.addEventListener("keydown", handleGoToDate);
  recycleScroller.value = document.querySelector('.vue-recycle-scroller') as HTMLDivElement;
  defineYearAnimation();
  await nextTick();
  await nextTick();
  scrollOneYear(years[0], false);
})

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisiblity);
  document.removeEventListener("focus", handleVisiblity);
  document.removeEventListener("keydown", handleGoToDate);
})

function onDayMouseEnter(isHijri: boolean, day: IDay, event: Event) {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(() => {
    if (!(event.target instanceof HTMLElement)) return;
    const rect = event.target.getBoundingClientRect();
    tooltipX.value = rect.x + rect.width / 2;
    tooltipY.value = rect.y - 4;
    activeMonth.value = day.month;
    activeDate.value = day.short;
    showTooltip.value = true;
    isActiveDateHijri.value = isHijri;
  }, 200)
}

function onDayMouseLeave() {
  showTooltip.value = false;
  activeMonth.value = null;
  if (hoverTimeout) clearTimeout(hoverTimeout);
}

async function onScroll() {
  if (!recycleContainer.value || !recycleScroller.value) return;
  scrollLeft.value = recycleScroller.value.scrollLeft;
  if (scrollLeft.value > scrollWidth.value - RANGE && scrollFlag) {
    scrollFlag = false;
    addOneYear();
    scrollFlag = true
  }
  if (scrollLeft.value < RANGE && scrollFlag) {
    scrollFlag = false;
    removeOneYear();
    scrollFlag = true
  }
}

function addOneYear() {
  const firstYear = years[0];
  years.shift();
  years.push(years[years.length - 1] + 1);
  scrollOneYear(firstYear, true);
}

function removeOneYear() {
  const lastYear = years[years.length - 1];
  if (years[0] <= 1) return;
  years.pop();
  years.unshift(years[0] - 1);
  scrollOneYear(lastYear, false);
}

function onDayClick(d: IDay) {
  navigator.clipboard.writeText(d.locale);
  showCopied.value = true;
  if (copiedTimeout) clearTimeout(copiedTimeout);
  copiedTimeout = setTimeout(() => {
    showCopied.value = false;
    copiedTimeout = null;
  }, 500);
}

function scrollOneYear(year: number, left: boolean) {
  if (!recycleContainer.value) return;
  const shift = (daysInYear(year) * (daySize + dayGap) - dayGap) * (left ? -1 : 1);
  recycleContainer.value.scrollToPosition(recycleContainer.value.$_lastUpdateScrollPosition + shift)
}

function daysInYear(year: number) {
  return ((year % 4 === 0 && year % 100 > 0) || year % 400 == 0) ? 366 : 365;
}

function defineYearAnimation() {
  yearsSequence.to(".milady-year",
    {
      x: "64px",
      opacity: 1,
      ease: "power1.inOut",
      duration: 0.1
    }
  ).to(".milady-year",
    {
      scale: 0,
      opacity: 0,
      ease: "power1.inOut",
      duration: 0.1
    },
    0.9
  );

  hijriYearsSequence.to(".hijri-year",
    {
      x: "64px",
      opacity: 1,
      ease: "power1.inOut",
      duration: 0.1
    }
  ).to(".hijri-year",
    {
      scale: 0,
      opacity: 0,
      ease: "power1.inOut",
      duration: 0.1
    },
    0.9
  );
}

function getActiveYear(firstYear: number, secondYear: number, thirdYear: number): number {
  if (0 <= firstYear && firstYear <= 1) return firstYear;
  if (0 <= secondYear && secondYear <= 1) return secondYear;
  return thirdYear;
}

function changeActiveYear(firstYear: number, secondYear: number, thirdYear: number) {
  let updatedActiveYear = years[2];
  if (0 <= firstYear && firstYear <= 1) {
    updatedActiveYear = years[0];
  }
  if (0 <= secondYear && secondYear <= 1) {
    updatedActiveYear = years[1];
  }
  activeYear.value = updatedActiveYear;
}

function handleAnimationFrame() {
  scrollElement();
  requestAnimationFrame(handleAnimationFrame);
}

function scrollElement() {
  if (!recycleScroller.value || !isPanActive.value || inProgress.value) return;
  recycleScroller.value.scrollBy({
    left: SCROLL_SPEED_FACTOR * scrollSpeedMapped.value,
  });
}

function handleVisiblity() {
  if (!document.hidden) dateInput.value?.focus();
}

function handleBlur(event: FocusEvent) {
  event.preventDefault();
  if (focusTimeout) return;
  focusTimeout = setTimeout(() => {
    dateInput.value?.focus();
    focusTimeout = null;
  }, 50);
}

function handleGoToDate(event: KeyboardEvent) {
  if (event.code === "Enter") {
    const goToDate = new Date(inputDate.value); 
    if (isNaN(goToDate.getTime())) return;
    const daysToGo = (goToDate.getTime() - activeMiladyDate.value.getTime())  / (1000 * 60 * 60 * 24);
    const distanceToTravel = daysToGo * (daySize + dayGap);
    restart(distanceToTravel);
    inputDate.value = '';
  }
}

function handleScrollBy(deltaValue: number) {
  if (!recycleScroller.value) return;
  recycleScroller.value.scrollBy({
    left: deltaValue,
  });
}

function handleDoubleTap(_event: HammerInput) {
  toggleTheme();
}

function handleSwipe(event: HammerInput) {
  restart(event.velocityX * event.distance * -1);
}

requestAnimationFrame(handleAnimationFrame);
useTouch(recycleScroller, handleDoubleTap, handleSwipe);


</script>

<template>
  <div class="body-wrapper">
    <div class="hint">
      <h2> Right Click To Pan </h2>
      <h2> Double Click To Switch Themes </h2>
      <h2> Type a Date and Enter to Traverse </h2>
    </div>
    <header>
      <p class="current-day-label"> {{ displayCurrentMildayDay }} </p>
      <h1 class="milady-year year"> {{ activeYear }} </h1>
    </header>
    <main class="main-container">
      <VTooltip :triggers="[]" :placement="isActiveDateHijri ? 'bottom' : 'top'" :shown="showTooltip" :autoHide="false"
        style="position: fixed;" :style="tooltipPos">
        <template #popper>
          {{ showCopied ? 'Copied!' : activeDate }}
        </template>
      </VTooltip>
      <RecycleScroller @scroll="onScroll" ref="recycle-container" class="days-container" itemClass="recycle-container"
        :pageMode="false" direction="horizontal" :items="days" :item-size="daySize + dayGap" v-slot="{ item }">
        <div class="date-container date-container-milady">
          <p class="month-title month-title-milady"
            :class="{ 'month-title-hover': activeMonth === item.miladyDay.month }" v-if="item.miladyDay.isStartOfMonth">
        {{ item.miladyDay.month }} </p>
          <div @click="onDayClick(item.miladyDay)" @mouseenter="onDayMouseEnter(false, item.miladyDay, $event)"
            @mouseleave="onDayMouseLeave()" class="day"
            :class="{ 'day-first-month': item.miladyDay.isStartOfMonth, 'day-normal': !item.miladyDay.isStartOfMonth, 'day-secret': SECRET_DATES.includes(item.miladyDay.locale) }">
          </div>
        </div>
        <div class="date-container" v-if="item.hijriDay">
          <p class="month-title month-title-hijri" :class="{ 'month-title-hover': activeMonth === item.hijriDay.month }"
            v-if="item.hijriDay.isStartOfMonth"> {{ item.hijriDay.month }} </p>
          <div @click="onDayClick(item.hijriDay)" @mouseenter="onDayMouseEnter(true, item.hijriDay, $event)"
            @mouseleave="onDayMouseLeave()" class="day"
            :class="{ 'day-first-month': item.hijriDay.isStartOfMonth, 'day-normal': !item.hijriDay.isStartOfMonth, 'day-secret': SECRET_DATES.includes(item.miladyDay.locale) }">
          </div>
        </div>
      </RecycleScroller>
    </main>
    <footer>
      <h1 class="hijri-year year"> {{ (activeHijriYear > 0) ? activeHijriYear : '-' }} </h1>
      <p class="current-day-label"> {{ (activeHijriYear > 0) ? displayCurrentHijriDay : '-' }} </p>
    </footer>
    <input class="date-input" ref="date-input" :maxlength="10" @blur="handleBlur" v-model="inputDate" autofocus/>
    <p class="go-to-date"> {{ inputDate }}</p>
  </div>
</template>
