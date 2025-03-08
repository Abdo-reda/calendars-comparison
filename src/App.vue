<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { gsap } from "gsap";
import { toHijri } from 'luxon-hijri';
import { formatHijriDate } from 'luxon-hijri';

//---- TODO
//- start of week color? start of week and month different.
//- tooltips when you hover over the day.

interface IDay {
  locale: string;
  short: string;
  month: string;
  isStartOfMonth: boolean;
  isStartOfWeek: boolean;
}

interface ICalendarDays {
  days: IDay[],
  hijriDays: IDay[]
}

// const dateFormatter = new Intl.DateTimeFormat('default', { month: 'long' });
const daySize = 24;
const dayGap = 12;
const range = 512;
const currentYear = ref(new Date().getUTCFullYear())
const yearsSequence = gsap.timeline({ paused: true });
const years = reactive([currentYear.value - 1, currentYear.value, currentYear.value + 1]);
const activeMonth = ref<string | null>(null);
const highlightWeek = ref<boolean>(false);
const mainContainer = useTemplateRef('main-container');

const hijriYears = computed(() => {
  return years.map(y => {
    const currentYearDate = new Date(y, 0, 1);
    return toHijri(currentYearDate)?.hy;
  })
})

const days = computed<ICalendarDays>(() => {
  const yearDays: IDay[] = [];
  const hijriYearDays: IDay[] = [];
  for (const y of years) {
    const currentYearDate = new Date(y, 0, 1);
    while (currentYearDate.getFullYear() === y) {
      const hijriDate = toHijri(currentYearDate);
      yearDays.push({
        locale: currentYearDate.toLocaleDateString(),
        short: currentYearDate.toISOString().split('T')[0],
        month: currentYearDate.toLocaleString('default', { month: 'long' }),
        isStartOfMonth: currentYearDate.getDate() === 1,
        isStartOfWeek: currentYearDate.getDay() === 0,
      });
      if (hijriDate) {
        hijriYearDays.push({
          locale: formatHijriDate(hijriDate, 'iYYYY-iMM-iDD'),
          short: formatHijriDate(hijriDate, 'iYYYY-iMM-iDD'),
          month: formatHijriDate(hijriDate, 'iMMMM'),
          isStartOfMonth: hijriDate.hd === 1,
          isStartOfWeek: currentYearDate.getDay() === 0,
        })
      }
      currentYearDate.setDate(currentYearDate.getDate() + 1);
    }
  }
  return {
    days: yearDays,
    hijriDays: hijriYearDays,
  }
})

onMounted(() => {
  scrollOneYearToRight(years[0]);
  defineYearAnimation();
})

let scrollFlag = true;


function handleScroll() {
  if (!mainContainer.value) return;
  if (mainContainer.value.scrollLeft + mainContainer.value.clientWidth >= mainContainer.value.scrollWidth - range && scrollFlag) {
    scrollFlag = false;
    addOneYear();
    scrollFlag = true
  }
}

function addOneYear() {
  scrollOneYearToLeft(years[2]);
  years.push(years[years.length - 1] + 1);
  years.shift();
  console.log('Scrolling ended near');
}

function onDayClick(d: IDay) {
  navigator.clipboard.writeText(d.locale);
}

function scrollOneYearToRight(year: number) {
  if (!mainContainer.value) return;
  mainContainer.value.scrollLeft += daysInYear(year) * (daySize + dayGap) - dayGap;
}

function scrollOneYearToLeft(year: number) {
  if (!mainContainer.value) return;
  mainContainer.value.scrollLeft -= daysInYear(year) * (daySize + dayGap) - dayGap;
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

</script>

<template>
  <div class="body-wrapper">
    <header>
      <h1> {{ years }} </h1>
      <button @click="addOneYear"> add one year </button>
      <div class="blah"> </div>
    </header>
    <main @scroll="handleScroll" ref="main-container" class="main-container">
      <div class="days-container" ref="days-container">
        <template v-for="d in days.days" :key="d.short">
          <div class="day-container">
            <p class="month-title month-title-milady" :class="{ 'month-title-hover': activeMonth === d.month }"
              v-if="d.isStartOfMonth"> {{
                d.month }} {{ d.short }} </p>
            <div @click="onDayClick(d)" @mouseenter="activeMonth = d.month" @mouseleave="activeMonth = null" class="day"
              :class="{ 'day-first-month': d.isStartOfMonth, 'day-normal': !d.isStartOfMonth }">
            </div>
          </div>
        </template>
      </div>
      <div class="days-container" ref="days-container">
        <!-- <template v-for="d in days.hijriDays" :key="d.short">
          <div class="day-container">
            <p class="month-title month-title-hijri" :class="{ 'month-title-hover': activeMonth === d.month }"
              v-if="d.isStartOfMonth"> {{
                d.month }} </p>
            <div @click="onDayClick(d)" @mouseenter="activeMonth = d.month" @mouseleave="activeMonth = null" class="day"
              :class="{ 'day-first-month': d.isStartOfMonth, 'day-normal': !d.isStartOfMonth }">
            </div>
          </div>
        </template> -->
      </div>
    </main>
    <footer>
      <h1> {{ hijriYears }} </h1>
    </footer>
  </div>

</template>
