<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue';
import { gsap } from "gsap";

const tl = gsap.timeline({ paused: true }); // Pause the timeline initially

const years = ref([1, 2, 3]);

//-------> each one will have a set animation, a sequence of tweens, and once a sequence completes, we should only need to keep track of two sequences (prev year, next year), only one year can be visible at a time.
//--> building that sequence might be a pain in the ass ... hmm .... is there a better way to deal with it?

// Variable to control the animation progress

// Function to update the animation progress
function updateAnimation(t: number) {
  console.log('------ update animation', t)
  tl.totalProgress(t); // Set the timeline's progress based on `t`
}

const VIEWPORT_CENTER = window.innerWidth / 2;
const YEAR_RANGE = 1;
const CENTER_RANGE = 300;
const currentYear = ref<number>(new Date().getUTCFullYear())
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

//TODO:
//- fix styling
//- make the list computed (memory is user memory)
//- make it horizontal
//- see into vue transitions.

const listLeft = ref()

onMounted(() => {
  // if (yearContainer.value) {
  //   // yearContainer.value.scrollLeft = yearContainer.value.scrollWidth/2;
  //   yearContainer.value.scrollLeft = (yearContainer.value.scrollWidth - yearContainer.value.clientWidth) / 2;
  // }
  // handleScroll();
  defineYearAnimation();
})

function defineYearAnimation() {
  tl.fromTo(".box",
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

function onDayClick() {
  console.log('---- clickedo n day')
}

</script>

<template>
  <header class="year-container">
    <!-- <p style="color: white"> {{ currentYear }} {{ yearContainer?.scrollLeft }} </p>
    <p v-for="temp in listLeft" :key="temp" style="color: white"> {{ temp }} </p>
    <div class="year-container" ref="yearContainer" @scroll="handleScroll">
      <h1 class="year" v-for="y in years" :key="y" :class="{ 'sticky-year': y === currentYear }" ref="yearHeading"> {{ y
        }}</h1>
    </div> -->
    <div class="box"> </div>
    <!-- <RecycleScroller class="years-container" :pageMode="true" :items="years" :item-size="32" direction='horizontal'  v-slot="{ item }">
      <h1> {{ item.value }}</h1>
    </RecycleScroller> -->
  </header>

  <main>
    <button @click="tempYears.push(0)"> add year </button>
    <button @click="tempYears.pop()"> pop year </button>
    <button @click="tempYears.shift()"> shift year </button>
    <p style="color: white">{{ tempYears }} </p>
      <div class="days-container">
        <div @click="onDayClick" class="day" :class="{ 'day-first-month': i % 30 === 0, 'day-normal': i % 30 !== 0 }"
          v-for="i in 365*tempYears.length" :key="i">
        </div>
      </div>
    <!-- <RecycleScroller class="scroller" :pageMode="true" :items="list" :item-size="32" key-field="id" v-slot="{ item }">
      <div class="user">
        {{ item.name }}
      </div>
    </RecycleScroller> -->
  </main>
</template>
