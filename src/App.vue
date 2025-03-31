<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef, customRef } from 'vue';
import { gsap } from "gsap";
import type { ICalendarDay, IDay } from './core/interfaces/dayInterface';
import type { IRecycleScroller } from './core/interfaces/recycleScrollerInterface';
import { createHijriDay, createMiladyDay, hijriPartsFormatter } from './core/utilities/dateUtil';
import { useMouse } from './core/composables/useMouse';

//TODO:
//- fix bug and glitching of the year.
//- 

// function debouncedRef<T>(value: T, delay = 50) {
//   let timeoutId: number|null = null;
//   return customRef((track, trigger) => ({
//     get() {
//       track();
//       return value;
//     },
//     set(newValue) {
//       if (newValue !== value) {
//         if (timeoutId) clearTimeout(timeoutId);
//         timeoutId = setTimeout(() => {
//           value = newValue; // Update the stabilized value
//           trigger(); // Notify Vue
//         }, delay);
//       }
//     }
//   }));
// }

let copiedTimeout: number | null = null;
let hoverTimeout: number | null = null;
let displayYearTimeout: number | null = null;
let scrollFlag = true;
let recycleScroller: HTMLDivElement | null = null;
const SMOOTHNESS = 0.05;
const SCROLL_SPEED_FACTOR = 8;
const daySize = 24;
const dayGap = 12;
const RANGE = 4096;
const yearsSequence = gsap.timeline({ paused: true });
const recycleContainer = useTemplateRef<IRecycleScroller>('recycle-container');
const { mouseXRatio } = useMouse();

const currentYear = ref(new Date().getUTCFullYear())
const activeMonth = ref<string | null>(null);
const activeDate = ref<string | null>();
const isActiveDateHijri = ref<boolean>(false);
const showCopied = ref<boolean>(false);
const showTooltip = ref<boolean>(false);
const tooltipX = ref<number>(0);
const tooltipY = ref<number>(0);
const scrollLeft = ref<number>(0);
const scrollPercentSmooth = ref<number>(0);
const years = reactive([currentYear.value - 1, currentYear.value, currentYear.value + 1]);
const displayedYear = ref<number>(years[1]);
const activeYear = ref<number>(years[1]);

const yearDaysWidth = computed(() => years.map(y => daysInYear(y) * (daySize + dayGap) - dayGap));
const scrollWidth = computed(() => days.value.length * (daySize + dayGap))
const hijriYears = computed(() => years.map(y => {
  const currentYearDate = new Date(y, 0, 1);
  return hijriPartsFormatter.formatToParts(currentYearDate).find(part => part.type === 'year')!.value;
}))

const days = computed<ICalendarDay[]>(() => {
  const yearDays: ICalendarDay[] = [];

  for (const y of years) {
    const currentYearDate = new Date(y, 0, 1);
    for (let day = 1; day <= daysInYear(y); day++) {
      const miladyDay = createMiladyDay(currentYearDate);
      const hijriDay = createHijriDay(currentYearDate); //createHijriDay(currentYearDate);

      yearDays.push({
        id: miladyDay.short,
        miladyDay,
        hijriDay,
      });
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
  const firstYearPercent = (scrollLeft.value) / (yearDaysWidth.value[0]);
  const midYearPercent = (scrollLeft.value - yearDaysWidth.value[0]) / (yearDaysWidth.value[1]);
  const lastYearPercent = (scrollLeft.value - yearDaysWidth.value[0] - yearDaysWidth.value[1]) / (yearDaysWidth.value[2]);
  changeActiveYear(firstYearPercent, midYearPercent, lastYearPercent);
  return getActiveYear(firstYearPercent, midYearPercent, lastYearPercent);
});

gsap.ticker.add(() => {
  scrollPercentSmooth.value += (scrollPercent.value - scrollPercentSmooth.value) * ((scrollPercent.value > 0.99 || scrollPercent.value < 0.01) ? 1 : SMOOTHNESS);
  yearsSequence.totalProgress(scrollPercentSmooth.value, true);
});

onMounted(async () => {
  defineYearAnimation();
  recycleScroller = document.getElementsByClassName('vue-recycle-scroller').item(0) as HTMLDivElement;
  await nextTick();
  await nextTick();
  scrollOneYear(years[0], false);
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


function onScroll() {
  if (!recycleContainer.value) return;
  scrollLeft.value = recycleContainer.value.$_lastUpdateScrollPosition;
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
  const shift = daysInYear(year) * (daySize + dayGap) - dayGap;
  recycleContainer.value.scrollToPosition(left ? recycleContainer.value.$_lastUpdateScrollPosition - shift : recycleContainer.value.$_lastUpdateScrollPosition + shift)
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
  )
    .to(".milady-year",
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
  if (updatedActiveYear !== activeYear.value) {
    if(displayYearTimeout) clearTimeout(displayYearTimeout);
    displayYearTimeout = setTimeout(() => displayedYear.value = updatedActiveYear, 100)
  }
  activeYear.value = updatedActiveYear;
}


function handleAnimationFrame() {
  scrollElement();
  requestAnimationFrame(handleAnimationFrame);
}

function scrollElement() {
  if (!recycleScroller) return;
  recycleScroller.scrollBy({
    left: SCROLL_SPEED_FACTOR * scrollSpeedMapped.value,
  });
}

requestAnimationFrame(handleAnimationFrame);

</script>

<template>
  <div class="body-wrapper">
    <header>
      <!-- <h1> {{ years[1] }} </h1> -->
      <h1 class="milady-year year"> {{ displayedYear }} </h1>
      <p style="color: white"> {{ scrollPercent }}% // {{ scrollPercentSmooth }}
      </p>
      <!-- // {{ scrollWidth }} // {{ scrollLeft }} // {{ daysInYear(years[0]) * (daySize + dayGap) - dayGap }} //{{ daysInYear(years[1]) * (daySize + dayGap) - dayGap }} -->
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
            :class="{ 'day-first-month': item.miladyDay.isStartOfMonth, 'day-normal': !item.miladyDay.isStartOfMonth }">
          </div>
        </div>
        <div class="date-container" v-if="item.hijriDay">
          <p class="month-title month-title-hijri" :class="{ 'month-title-hover': activeMonth === item.hijriDay.month }"
            v-if="item.hijriDay.isStartOfMonth"> {{ item.hijriDay.month }} </p>
          <div @click="onDayClick(item.hijriDay)" @mouseenter="onDayMouseEnter(true, item.hijriDay, $event)"
            @mouseleave="onDayMouseLeave()" class="day"
            :class="{ 'day-first-month': item.hijriDay.isStartOfMonth, 'day-normal': !item.hijriDay.isStartOfMonth }">
          </div>
        </div>
      </RecycleScroller>
    </main>
    <footer>
      <h1> {{ hijriYears }} </h1>
    </footer>
  </div>

</template>
