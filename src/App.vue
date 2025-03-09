<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { gsap } from "gsap";
import type { ICalendarDay, IDay } from './core/interfaces/dayInterface';
import type { IRecycleScroller } from './core/interfaces/recycleScrollerInterface';
import { createHijriDay, createMiladyDay, hijriPartsFormatter } from './core/utilities/dateUtil';
import { useMouse } from './core/composables/useMouse';

let scrollFlag = true;
const SCROLL_SPEED_FACTOR = 100;
const daySize = 24;
const dayGap = 12;
const RANGE = 4096;
const yearsSequence = gsap.timeline({ paused: true });
const recycleContainer = useTemplateRef<IRecycleScroller>('recycle-container');
const { mouseXRatio } = useMouse();

const currentYear = ref(new Date().getUTCFullYear())
const activeMonth = ref<string | null>(null);
const activeDate = ref<string | null>();
const showTooltip = ref<boolean>(false);
const tooltipX = ref<number>(0);
const tooltipY = ref<number>(0);

const years = reactive([currentYear.value - 1, currentYear.value, currentYear.value + 1]);

const scrollWidth = computed(() => days.value.length * (daySize + dayGap))
const hijriYears = computed(() => {
  return years.map(y => {
    const currentYearDate = new Date(y, 0, 1);
    return hijriPartsFormatter.formatToParts(currentYearDate).find(part => part.type === 'year')!.value;
  })
})

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

const tooltipPos = computed(() => {
  return {
    left: `${tooltipX.value}px`,
    top: `${tooltipY.value}px`,
  }
})

const scrollSpeed = computed(() => (mouseXRatio.value - 0.5) / 0.5)

onMounted(async () => {
  defineYearAnimation();
  await nextTick();
  await nextTick();
  scrollOneYear(years[0], false);
})

function onDayMouseEnter(day: IDay, event: Event) {
  if (!(event.target instanceof HTMLElement)) return;
  const rect = event.target.getBoundingClientRect();
  tooltipX.value = rect.x + rect.width/2;
  tooltipY.value = rect.y - 4;
  activeMonth.value = day.month; 
  activeDate.value = day.short; 
  showTooltip.value = true;
}

async function scrollElement() {
  if (recycleContainer.value) {
    // console.log('--- scroollll', recycleContainer.value.$_lastUpdateScrollPosition, SCROLL_SPEED_FACTOR*scrollSpeed.value)
    // console.log('--- value', recycleContainer.value.$_lastUpdateScrollPosition, SCROLL_SPEED_FACTOR*scrollSpeed.value)
    // recycleContainer.value.$_lastUpdateScrollPosition += SCROLL_SPEED_FACTOR*scrollSpeed.value;
    recycleContainer.value.scrollToPosition(recycleContainer.value.$_lastUpdateScrollPosition+SCROLL_SPEED_FACTOR*scrollSpeed.value);
    // await nextTick();
  }
  requestAnimationFrame(scrollElement);
}

function handleScroll() {
  if (!recycleContainer.value) return;
  const scrollLeft = recycleContainer.value.$_lastUpdateScrollPosition;
  // firstScroll = true;
  // getScroll
  // handleScroll
  // scrollToItem
  // scrollToPosition
  // console.log('---', scrollLeft)
  if (scrollLeft > scrollWidth.value - RANGE && scrollFlag) {
    scrollFlag = false;
    addOneYear();
    scrollFlag = true
  }
  if (scrollLeft < RANGE && scrollFlag) {
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
}

function scrollOneYear(year: number, left: boolean) {
  if (!recycleContainer.value) return;
  // console.log('--- scroll', recycleContainer.value.$_lastUpdateScrollPosition)
  const shift = daysInYear(year) * (daySize + dayGap) - dayGap;
  recycleContainer.value.scrollToPosition(left ? recycleContainer.value.$_lastUpdateScrollPosition - shift : recycleContainer.value.$_lastUpdateScrollPosition + shift)
}

function daysInYear(year: number) {
  return ((year % 4 === 0 && year % 100 > 0) || year % 400 == 0) ? 366 : 365;
}

function defineYearAnimation() {
  yearsSequence
    .fromTo(".box",
      { x: "100vw" },
      {
        x: "64px",
        ease: "power1.inOut"
      }
    ).to(".box",
      {
        scale: 0,
        opacity: 0,
        ease: "power1.inOut"
      },
      "+=1"
    );
}

function updateAnimation(t: number) {
  yearsSequence.totalProgress(t);
}

requestAnimationFrame(scrollElement);

</script>

<template>
  <div class="body-wrapper">
    <header>
      <h1> {{ years }} </h1>
      <button @click="scrollOneYear(2025, false)"> scroll to right </button>
      <button @click="addOneYear"> addOneYear </button>
      <div class="blah" > </div>
      <p style="color: white"> {{ scrollWidth }} {{ days.length }} {{ tooltipX }} {{ activeMonth }} {{ scrollSpeed }} </p>
    </header>
    <main class="main-container">
      <VTooltip :triggers="[]" :shown="showTooltip" :autoHide="false" style="position: fixed;" :style="tooltipPos">
        <template #popper>
          {{ activeDate }}
        </template>
      </VTooltip>
      <RecycleScroller @scroll="handleScroll" ref="recycle-container" class="days-container"
        itemClass="recycle-container" :pageMode="false" direction="horizontal" :items="days"
        :item-size="daySize + dayGap" v-slot="{ item }">
        <div class="date-container date-container-milady">
          <p class="month-title month-title-milady"
            :class="{ 'month-title-hover': activeMonth === item.miladyDay.month }" v-if="item.miladyDay.isStartOfMonth">
            {{ item.miladyDay.month }}  </p>
          <div @click="onDayClick(item.miladyDay)"
            @mouseenter="onDayMouseEnter(item.miladyDay, $event)"
            @mouseleave="activeMonth = null; showTooltip = false" class="day"
            :class="{ 'day-first-month': item.miladyDay.isStartOfMonth, 'day-normal': !item.miladyDay.isStartOfMonth }">
          </div>
        </div>
        <div class="date-container" v-if="item.hijriDay">
          <p class="month-title month-title-hijri" :class="{ 'month-title-hover': activeMonth === item.hijriDay.month }"
            v-if="item.hijriDay.isStartOfMonth"> {{ item.hijriDay.month }} </p>
          <div @click="onDayClick(item.hijriDay)"
            @mouseenter="onDayMouseEnter(item.hijriDay, $event)"
            @mouseleave="showTooltip = false; activeMonth = null; " class="day"
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
