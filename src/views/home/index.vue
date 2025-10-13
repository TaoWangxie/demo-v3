<template>
  <div class="container">
    <div class="ul">
      <div
        v-for="(item, index) in list"
        :key="index"
        class="li"
        @click="addFn(item)"
      >
        {{ item.name }} ({{ item.time }})
      </div>
    </div>
    <div class="btn" @click="submit">提交</div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";

const list = ref([
  {
    name: "11133314444",
    time: 1000,
    fn: "fn1",
  },
  {
    name: "2",
    time: 2000,
    fn: "fn2",
  },
  {
    name: "3",
    time: 1000,
    fn: "fn3",
  },
  {
    name: "4",
    time: 3000,
    fn: "fn4",
  },
  {
    name: "err1",
    time: 1000,
    fn: "err",
  },
]);
// 事件集合
const fnObj = ref({
  fn1: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log("p1");
        resolve(1);
      }, 1000);
    }),
  fn2: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log("p2");
        resolve(2);
      }, 2000);
    }),
  fn3: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log("p3");
        resolve(3);
      }, 1000);
    }),
  fn4: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        console.log("p4");
        resolve(4);
      }, 3000);
    }),
  err: () => Promise.reject("err4"),
});

// 事件栈
const fnLists = ref([]);

const addFn = (val: any) => {
  fnLists.value.push(fnObj.value[val.fn]);
  console.log("fnLists:", fnLists.value);
};

const submit = async () => {
  Promise.all(fnLists.value.map((fn) => fn()))
    .then(console.log)
    .catch(console.log);
};

// const p2 = new Promise((resolve) => {
//   setTimeout(() => {
//     // console.log("p2");
//     resolve(2);
//   }, 1000);
// });

// const p3 = new Promise((resolve) => {
//   setTimeout(() => {
//     // console.log("p3");
//     resolve(3);
//   }, 2000);
// });
// const p4 = Promise.reject("err4");
// const p5 = Promise.reject("err5");
// // 1. 所有的Promise都成功了
// const p11 = Promise.all([p3, p2, p4])
//   .then(console.log) // [ 1, 2, 3 ]
//   .catch(console.log);
</script>
<style lang="scss">
.container {
  width: 100%;
  height: 100vh;
}
.ul {
  width: 100%;
  padding: 0 10px;
  box-sizing: border-box;
  height: calc(100vh - 60px);
  .li {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 50px;
    margin-top: 10px;
    box-sizing: border-box;
    font-size: 20px;
    background-color: #eee;
  }
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 60px;
  background-color: #ccc;
  color: #fff;
  font-size: 22px;
  font-weight: 500;
}
</style>
