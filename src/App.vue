<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue';
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
const currentYear = new Date().getUTCFullYear()
const yearsSequence = gsap.timeline({ paused: true });
const years = ref([currentYear - 1, currentYear, currentYear + 1]);
const activeMonth = ref<string | null>(null);
const highlightWeek = ref<boolean>(false);
const mainContainer = useTemplateRef('main-container');

const hijriYears = computed(() => {
  return years.value.map(y => {
    const currentYearDate = new Date(y, 0, 1);
    return toHijri(currentYearDate)?.hy;
  })
})

const days = computed<ICalendarDays>(() => {
  const yearDays: IDay[] = [];
  const hijriYearDays: IDay[] = [];
  for (const y of years.value) {
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

//-------> each one will have a set animation, a sequence of tweens, and once a sequence completes, we should only need to keep track of two sequences (prev year, next year), only one year can be visible at a time.
//--> building that sequence might be a pain in the ass ... hmm .... is there a better way to deal with it?

// Variable to control the animation progress

// Function to update the animation progress


const VIEWPORT_CENTER = window.innerWidth / 2;
const YEAR_RANGE = 1;
const CENTER_RANGE = 300;
// const activeYear = ref(currentYear.value);
// const years = computed(() => Array.from({ length: YEAR_RANGE * 2 + 1 }, (_, i) => currentYear.value + i - YEAR_RANGE))
// const list = reactive(Array.from({ length: 5000 }, (_, index) => {
//   return {
//     id: index,
//     name: `e ${index}`
//   }
// }));

// const yearContainer = useTemplateRef('yearContainer');
// const yearRefs = useTemplateRef('yearHeading')

// function bufferedScroll() {
//   debounce(handleScroll, 200);
// }

// const tempBlah = debounce(handleScroll, 100);

// async function handleScroll() {
//   let activeYear = currentYear.value;
//   yearRefs.value?.forEach((heading, index) => {
//     const rect = heading.getBoundingClientRect();
//     const headingPos = Math.abs(rect.left); //+ rect.width / 2; // Center of the section
//     // const distance = Math.abs(headingPos - VIEWPORT_CENTER); 
//     // console.log('====', heading.textContent, headingPos)
//     if (headingPos < CENTER_RANGE) activeYear = Number(heading.innerText);
//   });
//   changeActiveYear(activeYear)
//   if (yearContainer.value) {
//     const maxScrollLeft = yearContainer.value.scrollWidth - yearContainer.value.clientWidth;
//     updateAnimation(yearContainer.value?.scrollLeft / maxScrollLeft)
//   }
//   listLeft.value = yearRefs.value?.map(h => h.getBoundingClientRect().left)
//   // this.activeSection = closestSectionIndex;
// }

// function changeActiveYear(year: number) {
//   if (!yearContainer.value) return;
//   // console.log('--- how', year, currentYear.value)
//   if (year === currentYear.value) return;
//   // console.log('--- it should happen', year, currentYear.value)
//   // if (year > currentYear.value) yearContainer.value.scrollLeft -= 2000;
//   // if (year < currentYear.value) yearContainer.value.scrollLeft += 2000;
//   // currentYear.value = year;
//   // await nextTick();
// }

onMounted(() => {
  scrollToMiddleYear();
  defineYearAnimation();
})

function onDayClick(d: IDay) {
  navigator.clipboard.writeText(d.locale);
}

function scrollToMiddleYear() {
  console.log("--- hello?")
  if (!mainContainer.value) return;
  mainContainer.value.scrollLeft = daysInYear(years.value[0]) * (daySize + dayGap) - dayGap;
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
    </header>
    <main ref="main-container" class="main-container">
      <div class="days-container" ref="days-container">
        <template v-for="d in days.days" :key="d.short">
          <div class="day-container">
            <p class="month-title month-title-milady" :class="{ 'month-title-hover': activeMonth === d.month }"
              v-if="d.isStartOfMonth"> {{
                d.month }} </p>
            <div @click="onDayClick(d)" @mouseenter="activeMonth = d.month" @mouseleave="activeMonth = null" class="day"
              :class="{ 'day-first-month': d.isStartOfMonth, 'day-normal': !d.isStartOfMonth }">
            </div>
          </div>
        </template>
      </div>
      <div class="days-container" ref="days-container">
        <template v-for="d in days.hijriDays" :key="d.short">
          <div class="day-container">
            <p class="month-title month-title-hijri" :class="{ 'month-title-hover': activeMonth === d.month }"
              v-if="d.isStartOfMonth"> {{
                d.month }} </p>
            <div @click="onDayClick(d)" @mouseenter="activeMonth = d.month" @mouseleave="activeMonth = null" class="day"
              :class="{ 'day-first-month': d.isStartOfMonth, 'day-normal': !d.isStartOfMonth }">
            </div>
          </div>
        </template>
      </div>
    </main>

    <footer>
      <h1> {{ hijriYears }} </h1>
    </footer>
  </div>

</template>
