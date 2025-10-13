
/**
 * ===============1===============
 * promise
 */
class myPromise {
    constructor(executor) {
      this.status = "pending";
      this.result = "";
      this.resolvefns = [];
      this.rejectfns = [];
      let resolve = (value) => {
        this.result = value;
        this.status = "fulfilled";
        this.resolvefns.forEach((fn) => fn());
      };
      let reject = (value) => {
        this.result = value;
        this.status = "rejected";
        this.rejectfns.forEach((fn) => fn());
      };
      try {
        executor(resolve, reject);
      } catch (e) {
        reject(e);
      }
    }
    then(onFulfilled, onRejected) {
      onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (v) => v;
      onRejected =
        typeof onRejected === "function"
          ? onRejected
          : (v) => {
              throw v;
            };
      return new myPromise((resolve, reject) => {
        let resolvePromise = (cb) => {
          setTimeout(() => {
            try {
              let x = cb(this.result);
              if (x === myPromise) {
                throw new Error("myPromise can not be chained");
              } else if (x instanceof myPromise) {
                x.then(resolve, reject);
              } else {
                resolve(x);
              }
            } catch (error) {
              reject(error);
              throw error;
            }
          });
        };
        if (this.status === "pending") {
          this.resolvefns.push(() => resolvePromise(onFulfilled));
          this.rejectfns.push(() => resolvePromise(onRejected));
        } else if (this.status === "fulfilled") {
          resolvePromise(onFulfilled);
        } else if (this.status === "rejected") {
          resolvePromise(onRejected);
        }
      });
    }
  }
  
  
  // 测试
  let p1 = new myPromise((resolve, reject) => {
    setTimeout(() => {
      console.log("11");
      resolve(1);
    }, 1000);
  })
    .then((res) => {
      return res * 2;
    })
    .then((res) => {
      console.log(res * 2);
    });
  
  /**
   * ===============2===============
   * promise.all.race.allsettled
   */
  
  
  const promiseAll = (arr) => {
    return new Promise((resolve, reject) => {
      let result = new Array(arr.length).fill(null);
      let count = 0;
      arr.map((fn, index) => {
        Promise.resolve(fn)
          .then((res) => {
            result[index] = res;
            count++;
            if (count === arr.length) {
              resolve(result);
            }
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
  };
  const promiseAllsettled = (arr) => {
    return new Promise((resolve, reject) => {
      let result = new Array(arr.length).fill(null);
      let count = 0;
      arr.map((fn, index) => {
        Promise.resolve(fn)
          .then((res) => {
            result[index] = {
              status: "fulfilled",
              value: res,
            };
            count++;
            if (count === arr.length) {
              resolve(result);
            }
          })
          .catch((err) => {
            result[index] = {
              status: "rejected",
              value: err,
            };
            count++;
            if (count === arr.length) {
              resolve(result);
            }
          });
      });
    });
  };
  const promiseRace = (arr) => {
    return new Promise((resolve, reject) => {
      arr.map((fn, index) => {
        Promise.resolve(fn)
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      });
    });
  };
  
  /**
   * ===============3===============
   * async/await
   */
  
  const fn = (num) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        num++;
        resolve(num);
      }, 1000);
    });
  };
  function* gen() {
    let data = yield fn(1);
    let data2 = yield fn(data);
    return data2;
  }
  const myAsync = (genF) => {
    return new Promise((resolve, reject) => {
      let gen = genF();
      const step = (fn) => {
        let next;
        try {
          next = fn();
        } catch (error) {
          return reject(error);
        }
        if (next.done) {
          return resolve(next.value);
        }
        Promise.resolve(next.value).then(
          (res) => {
            step(() => gen.next(res));
          },
          (e) => {
            step(() => gen.throw(e));
          }
        );
      };
      step(() => gen.next());
    });
  };
  
  
  
  
  /**
   * ===============4===============
   * EventBus
   */
  
  class EventBus {
    constructor() {
      this.eventBus = {};
    }
  
    on(eventName, cb) {
      let task = this.eventsBus[eventName];
      if (task) {
        task.push(cb);
      } else {
        task = [cb];
      }
    }
  
    emit(eventName, data) {
      let task = this.eventsBus[eventName];
      if (task) {
        task.map((cb) => {
          cb && cb(data);
        });
      }
    }
  
    off(eventName, cb) {
      let task = this.eventsBus[eventName];
      if (task && task.indexOf(cb) !== -1) {
        task.splice(task.indexOf(cb), 1);
      }
    }
    once(eventName, data) {
      let task = this.eventsBus[eventName];
      if (task) {
        task.map((cb) => {
          cb && cb(data);
        });
        delete task;
      }
    }
  }
  
  
  
  
  /**
   * ===============5===============
   * call-apply-bind
   */
  
  Function.prototype.mycall = function (context) {
    context =
      context === null || context === undefined ? window : Object(context);
    let args = [...arguments.slice(1)];
    let fn = Symbol("fn");
    context[fn] = this;
    let res = context[fn](...args);
    delete context[fn];
    return res;
  };
  
  Function.prototype.myapply = function (context, ...args) {
    context =
      context === null || context === undefined ? window : Object(context);
    let fn = Symbol("fn");
    context[fn] = this;
    let res = context[fn](...args);
    delete context[fn];
    return res;
  };
  
  Function.prototype.mybind = function (context) {
    let fn = this;
    let args = [...arguments].slice(1);
    let newFunction = () => {
      let newargs = args.concat(...arguments);
      if (this instanceof newFunction) {
        fn.apply(this, newargs);
      } else {
        fn.apply(context, newargs);
      }
    }
    newFunction.prototype = Object.create(fn.prototype);
    return newFunction;
  };

  
  
  
  /**
   * ===============6===============
   * 深拷贝
   */
  
  function deepClone(target, weakMap = new WeakMap()) {
    if (weakMap.has(target)) {
      return weakMap.get(target);
    }
    if (typeof target === "object") {
      let cloneTarget;
      if (target instanceof Date) {
        cloneTarget = new Date(target);
      } else if (target instanceof Array) {
        cloneTarget = [];
        for(let i = 0; i < target.length; i++){
          cloneTarget.push(deepClone(target[i], weakMap))
        }
      } else if (target instanceof RegExp) {
        cloneTarget = new RegExp(target.source, target.flags);
      } else {
        cloneTarget = {};
        weakMap.set(target, cloneTarget);
        for (let key in target) {
          if (target.hasOwnProperty(key)) {
            cloneTarget = deepClone(target[key], weakMap);
          }
        }
      }
      return cloneTarget;
    } else {
      return target;
    }
  }


  
  
  
  /**
   * ===============7===============
   * 防抖节流
   */
  const debounce = (fn, daley) => {
    let timer = null;
    return function () {
      timer && clearTimeout(timer);
      timer = setTimeout(() => {
        fn.call(this, arguments);
      }, daley);
    };
  };
  
  const throttle = (fn, daley) => {
    let flag = true;
    return function () {
      if (!flag) return;
      flag = false;
      setTimeout(() => {
        fn.call(this, arguments);
        flag = true;
      }, daley);
    };
  };

  
  
  /**
   * ===============8===============
   * instanceof
   */
  
  //  function instanceof(obj,fun){
  //   let proto = obj.__proto__
  //   let prototype = fun.prototype
  //   while(true){
  //     if(proto == null) return false
  //     if(proto === prototype) return true
  //     proto = proto.__proto__
  //   }
  //  }
  
  function myinstanceof(obj,fun){
    let proto = obj.__proto__
    let prototype = fun.prototype
    while(true){
      if(proto == null) return false
      if(proto === prototype) return true
      proto = proto.__proto__
    }
  }

  
  
  /**
   * ===============9===============
   * new
   */
  function _new(fn,...args){
    let obj = {}
    obj.__proto__ = fn.prototype
    let res = fn.apply(obj,args)
    if(res instanceof Object){
      return res
    }
    return obj
  }

  
  
  /**
   * ===============10===============
   * ajax
   */
  const ajax = {
      get(url,fn){
          const xhr = XMLHttpRequest()
          xhr.open('GET',url,true)
          xhr.onreadystatechange = function(){
              if(xhr.readyState === 4){
                  fn(xhr.responeText)
              }
          }
          xhr.send()
      },
      post(url,data,fn){
          const xhr = XMLHttpRequest()
          xhr.open('POST',url,true)
          xhr.setResquestHeader('Content-type','application/x-www-form-urlencoded')
          xhr.onreadystatechange = function(){
              if(chr.readyState === 4){
                  fn(xhr.responeText)
              }
          }
          xhr.send(data)
      }
  }
  
  /**
   * promise并发限制
   */
  
  function multiRequest(urls, maxNum) {
    const results = new Array(urls.length).fill(null); // 保持结果顺序
    let pendingCount = 0; // 当前进行中的请求数
    let index = 0;       // 当前待处理URL的索引
  
    return new Promise((resolve) => {
      // 递归启动请求（核心控制逻辑）
      const next = () => {
        // 所有URL处理完成且无进行中请求时，返回结果
        if (index >= urls.length && pendingCount === 0) {
          resolve(results);
          return;
        }
  
        // 动态补充请求（保持最大并发）
        while (pendingCount < maxNum && index < urls.length) {
          const currentIndex = index++; // 锁定当前索引
          pendingCount++;
          
          fetch(urls[currentIndex])
            .then(res => res.json())
            .then(data => {
              results[currentIndex] = data; // 按原始顺序存储结果
            })
            .catch(error => {
              results[currentIndex] = error; // 错误也按顺序存储
            })
            .finally(() => {
              pendingCount--;
              next(); // 当前请求完成后触发下一个
            });
        }
      };
  
      next(); // 启动初始任务
    });
  }

  
    /**
    * 斐波那契数列
    */
  
    function fff(n){
      n = n && parseInt(n)
      if(n === 1 || n === 2){
        return 1
      }
      let n1 = 1
      let n2 = 1
      for (let i = 2; i < n; i++) {
        [n1,n2] = [n2,n1+n2]
      }
      return n2
    }
  
   /**
    * 数组交集
    */
  
   function intersection(arr1,arr2){
    let map = new Map()
    arr1.map((n)=>{
      map.set(n,true)
    })
  
    let res = []
    arr2.map((n)=>{
      if(map.get(n)){
        res.push(n)
        map.delete(n)
      }
    })
    return res
   }
  
    /**
     * 数组中只出现一次的数字
     */
  
     function singlenumber(nums){
      let result = 0
      nums.map((item)=>{
        result ^= item
      })
      return result
     }
  
      //字符串去重
      String.prototype.quchong = function(){
        let map = new Map()
        let str = ''
        for (let i = 0; i < this.length; i++) {
          if(!map.get(this[i])){
            map.set(this[i],true)
            str += this[i]
          }
        }
        return str
      }
  
      //是否回文字符串
      String.prototype.huiwen = function(){
        if(Object.prototype.toString.call(this) !== '[object,String]'){
          return false
        }
        let len = this.length
        for (let i = 0; i < len/2; i++) {
          if(this[i] !== this[len - 1 - i]){
            return false
          }
        }
        return true
      }
    //   function huiwen(str){
    //     let l = 0
    //     let r = str.length-1
    //     while(l<r){
    //         if(str[l] !== str[r]) return false
    //         l++
    //         r--
    //     }
    //     return true
    //   }
  
  
  
      //字符串反转
      function fazhuanstr(str){
        return str.split('').reverse().join('')
      }
      function fanzhuanstr2(str){
        let res = ''
        for (let i = str.length -1; i >=0; i--) {
          res += str[i]
        }
        return res
      }
      function reverseString(str) {
        return str === '' ? '' : reverseString(str.substr(1)) + str.charAt(0);
      }
  
  
  
    /**
     * 数组去重 
     */
      function quchong2(arr){
        return [...new Set(arr)]
      }
      function quchong3(arr){
        let result = {}
        return arr.filter((item)=>{
          if(!result[item]){
            result[item] = true
            return true
          }
        })
      }
      function quchong4(arr){
        let result = []
        arr.map((item)=>{
          if(!result.includes(item)){
            result.push(item)
          }
        })
        return result
      }
      //删除有序数组重复项 
      function quchong1(nums){
        let slow = 0
        let fast = 1
        if(nums.length === 0) return 0
        while(fast < nums.length){
          if(nums[slow] !== nums[fast]){
            nums[++slow] = nums[fast]
          }
          fast++
        }
        return slow+1
        return nums.slice(0,slow+1)
      }

      //冒泡排序
      function maopao(arr){
        for (var i = 0; i < arr.length; i++) {
          for (var j = 0; j < arr.length-i; j++) {
            if(arr[j] > arr[j+1]){
              let temp = arr[j]
              arr[j] = arr[j+1]
              arr[j+1] = temp
            }
          }
        }
      }
      //选择排序
      function xuanzepai(arr){
        let minindex = 0
        for (let i = 0; i < arr.length; i++) {
          minindex = i
          for (let j = i + 1; j < arr.length; j++) {
            if(arr[minindex] > arr[j]){
              minindex = j
            }
          }
          [arr[i],arr[minindex]] = [arr[minindex],arr[i]]
        }
      }
  
  
      // 插入排序
      function charup(arr){ //[1,4,2,3,6,5]
        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < i; j++) {
            if(arr[j] > arr[i]){
              [arr[j],arr[i]] = [arr[i],arr[j]]
            }
          }
          
        }
      }
      //快排
      function quicksort(arr){
        let point = arr[arr.length - 1]
        let left = arr.filter((item,i)=>item <=point && i !== arr.length -1)
        let right =  arr.filter((item)=>item > point)
        return [...quicksort(left),point,...quicksort(right)]
      }
  
      //数组扁平化
      function flat(arr,depth = 1){
        return depth > 0 ? 
        arr.reduce((res,item)=>{
          res.concat( Array.isArray(item) ? flat(item,depth -1) : item )
        },[]) : arr.slice()
      }

  
      //数组反转
      Array.prototype.fanzhuan = function(){
        let len = this.length
        for (let i = 0; i < len/2; i++) {
          let temp = this[i]
          this[i] = this[len - 1 - i]
          this[len - 1 - i] = temp
        }
        return this
      }
      function fanzhuan(arr){
        let l = 0
        let r = arr.length - 1
        while(l < r){
            [arr[l],arr[r]] = [arr[r],arr[l]]
            l++
            r--
        }
        return arr
      }
  
      //filter
      Array.prototype.filter2 = function(fun,obj){
        let arr = []
        let _this = arguments[1] || window
        let len = this.length
        for (let i = 0; i < len; i++) {
          fun.call(_this,this[i],i,this) && arr.push(this[i])
        }
        return arr
      }
  
      // arr[-1]
      function sss(arr){
        let len = arr.length
        return new Proxy(arr,{
            get(target,key){
                key = +key
                while(key < 0){
                    key+=len
                }
                return target[key]
            }
        })
      }

      //取高度嵌套的对象里的指定属性
      function findNestedValue(obj, field) {
        // 处理无效输入
        if (obj === null || typeof obj !== 'object') return null;
        // 当前层级匹配字段
        if (obj.hasOwnProperty(field)) {
            return obj[field];
        }
        // 递归搜索子对象
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
                const result = findNestedValue(obj[key], field);
                if (result !== null) return result; // 找到即返回
            }
        }
        return null; // 未找到
      }
  
      // 打乱数组
      function shufflearray(arr){
        for (let i = arr.length-1; i >= 0; i--) {
          let randomindex = Math.floor(Math.random() * i);
          [arr[i],arr[randomindex]] = [arr[randomindex],arr[i]];
        }
      }

  
      //获取地址参数
      //https://www.baidu.com/s?wd=js%E5%88%A4%E6%96%AD%E5%AD%97%E7%AC%A6%E4%B8%B2%E6%98%AF%E6%95%B0%E5%AD%97%E8%BF%98%E6%98%AF%E5%AD%97%E6%AF%8D&rsv_spt=1&rsv_iqid=0xa0092c8500095a51&issp=1&f=3&rsv_bp=1&rsv_idx=2&ie=utf-8&rqlang=cn&tn=baiduhome_pg&rsv_dl=ts_0&rsv_enter=1&oq=js&rsv_btype=t&inputT=14334&rsv_t=a40fmtm0SEl8MmdEYF8Eq%2F5fBzZdi%2Fqim4f8idb1CARO9lYwbPAU3avVj5qo%2FZVJiziC&rsv_sug3=34&rsv_sug1=30&rsv_sug7=100&rsv_pq=a978275c00060f1c&rsv_sug2=1&rsv_sug4=14455
      function getAllParams() {
        const query = window.location.search.substring(1);
        const params = {};
        query.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
          }
        });
        return params;
      }
      


      //获取类型
      function getType(value){
        if(value === null){
          return value + ''
        }
        if(typeof value === 'object'){
          let valueclass = Object.prototype.toString.call(value)
          let type = valueclass.split(' ')[1].split('')
          type.pop()
          return type.join('').toLowerCase()
        }else{
          return typeof value
        }
      }
  
      // 千分位
      function formatNumber(str){
        return str.split('').reverse().reduce((prev,next,index)=>{
          return ((index%3) ? next : next + ',') + prev
        })
      }


      // 合并二维有序数组成一维有序数组，归并排序的思路
    function merge(left, right) {
        let result = []
        while (left.length > 0 && right.length > 0) {
            if (left[0] < right[0]) {
                result.push(left.shift())
            } else {
                result.push(right.shift())
            }
        }
        return result.concat(left).concat(right)
    }
    function mergeSort(arr) {
        if (arr.length === 1) {
            return arr
        }
        while (arr.length > 1) {
            let arrayItem1 = arr.shift();
            let arrayItem2 = arr.shift();
            let mergeArr = merge(arrayItem1, arrayItem2);
            arr.push(mergeArr);
        }
        return arr[0]
    }
    let arr1 = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 2, 3], [4, 5, 6]];
    let arr2 = [[1, 4, 6], [7, 8, 10], [2, 6, 9], [3, 7, 13], [1, 5, 12]];
    console.log(mergeSort(arr1))
    console.log(mergeSort(arr2))

    
    //jsonp=======================================
function jsonp(url,callback,success){
    let script = document.createElement('script')
    script.url = url
    script.async = true

    window[callback] = function(data){
        success && success(data)
    }

    document.appendChild(script)
}

//懒加载=======================================
const images = document.querySelectorAll("image");
let observer = new IntersectionObserver((items,observe)=>{
    items.forEach(item => {
        if(item.isIntersecting){
            item.target.src = item.target.dataset.src
            observe.unobserve(item.target)
        }
    });
})

images.map((img)=>{
    observer.observe(img)
})

//curry柯里化=======================================
function mycurry(fn){
    return function temp(...args){
        if(args.length >= fn.length){
            return fn(...args)
        }else{
            return function(...args2){
                return temp(...args,...args2)
            }
        }
    }
}


      setTimeout(()=>{
        console.log(2)
      },0)
      new Promise((resolve)=>{
        console.log(3)
        for(let i = 0;i<10000; i++){
            i === 9999 && resolve()
        }
        console.log(4)
      }).then(()=>{
        console.log(5)
      })
      console.log(6)

      34652
