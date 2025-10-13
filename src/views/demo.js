import { first } from "lodash"

// 异步加法 =======================================
function asyncAdd(a,b,cb){
    setTimeout(() => {
      cb(null, a + b)
    }, Math.random() * 1000)
  }
  async function total(){
    const res1 = await sum(1,2,3,4,5,6,4)
    const res2 = await sum(1,2,3,4,5,6,4)
    return [res1, res2]
  }
  total()
  // 实现下 sum 函数。注意不能使用加法，在 sum 中借助 asyncAdd 完成加法。尽可能的优化这个方法的时间。
  //1
  async function sum(...rest){
    let result = 0
    let obj = {}
    obj.toString = ()=>result
    let promises = []
    for (let i = 0; i < rest.length; i++) {
        promises.push(
            new Promise((resolve)=>{
                asyncAdd(obj,rest[i],(_,pre)=>resolve(pre))
            }).then((res)=>{
                result = res
            })
        )
    }
    await Promise.all(promises)
    return result
  }

  //2
  async function sum2(...rest){
    if(rest?.length <= 1){
        return rest[0]
    }
    let promises = []
    for (let i = 0; i < rest.length; i+=2) {
        promises.push(new Promise((resolve)=>{
            if(rest[i + 1] === undefined){
                resolve(rest[0]) 
            }else{
                asyncAdd(rest[i],rest[i + 1],(_,pre)=>resolve(pre))
            }
        }))
    }
    let res = await Promise.all(promises)
    return await sum2(...res)
  }


  //https://www.cnblogs.com/echolun/p/15906939.html  =======================================
    // 假设请求API为
    function request(params) {
        return new Promise((resolve, reject) => {
        setTimeout(() => resolve(params), 1000);
        });
    }
    
    // 最多处理3个请求的调度器
    function Scheduler(limit=3){
        // ...
    };
    
    const createPromise = Scheduler();
    createPromise(1).then((res) => console.log(res));
    createPromise(2).then((res) => console.log(res));
    createPromise(3).then((res) => console.log(res));
    createPromise(4).then((res) => console.log(res));
    createPromise(5).then((res) => console.log(res));
  // 预期，等1秒后输出1 2 3 ，再等一秒输出4 5

  function Scheduler(limit = 3) {
    const pending = [];
    let count = 0;
  
    // 处理request以及limit判断的地方
    const run = () => {
      // 数组为空吗？超出limit限制了吗？
      if (!pending.length || count >= limit) return;
      // 依次取出之前存储的参数
      const [param, resolve, reject] = pending.shift();
      count++;
      request(param)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          count--;
          // 递归，继续判断能不能执行下一个request
          run();
        });
    };
    // 返回一个创建请求的方法
    return function (param) {
      //内部返回一个promise
      return new Promise((resolve, reject) => {
        // 存储数据
        pending.push([param, resolve, reject]);
        // 开始请求
        run();
      });
    };
  }
  class Scheduler2{
    constructor(){
        this.pending = []
        this.limit = 2
        this.count = 0
    }
    add(fn){
        this.pending.push(fn)
        this.run()
    }
    run(){
        if(!this.pending.length || this.count >= this.limit){
            return
        }
        this.count++
        this.pending.shift()().finally(()=>{
            this.count--
            this.run()
        })
    }
  }

//多维数组全排列 [[1, 2], [3, 4], [5, 6]]
// 输出：[[1 ,3 ,5] ,[1 ,3 ,6] ,[1 ,4 ,5] ,[1 ,4 ，6] ,[2 ，3 ，5] ,[2 ，3 ，6] ,[2 ，4 ，5],[2，4，6]]
  function aaa(arr){
    return arr.reduce((res,val)=>{
        return res.map(v=>val.map((item)=>[...v,item])).flat()
    },[[]])
  }



  // tree树结构转列表  =======================================
  function treetolist(tree){
    let res = []
    const tds = (data)=>{
        for (let i = 0; i < data.length; i++) {
            if(data[i].children && data[i].children.length){
                tds(data[i].children)
                delete data[i].children
            }else{
                res.push(data[i])
            }
        }
    }
    tds(tree)
    return res
  }

  function treetolist2(tree){
    return tree.reduce((res,cur,index)=>{
        return res.concat(cur,...( cur.children && cur.children.length ? treetolist2(cur.children) : [] ))
    },[])
  }

  // list 列表转树结构 =======================================
  function listtitree(arr){
    let list = []
    let hashmap = {}
    for (let i = 0; i < arr.length; i++) {
        let id = arr[i].id
        let pid = arr[i].pid
        if(!hashmap[id]){
            hashmap[id] = {children:[]}
        }
        hashmap[id] = {...arr[i], children: hashmap[id].children}
        if(pid === 0){
            list.push(hashmap[id])
        }else{
            if(!hashmap[pid]){
                hashmap[pid] = {
                    children:[]
                }
            }
            hashmap[pid].children.push(hashmap[id])
        }
    }
    return list
  }

  // promise.finally =======================================

  Promise.prototype.myfinally = function(cb){
    return this.then((res)=>{
        cb()
        return res
    },(e)=>{
        cb()
        throw e
    })
  }

  // promise.catch =======================================
  Promise.prototype.mycatch = function(cb){
    return this.then(null,cb)
  }

// 红绿灯=======================================
function hld(){
    function red(){
        console.log('red')
    }
    function green(){
        console.log('green')
    }
    function yellow(){
        console.log('yellow')
    }

    let step = ( timer, type, cb )=>{
        setTimeout(()=>{
            if(type === 'red'){
                red()
            }else if(type === 'green'){
                green()
            }else{
                yellow()
            }
            cb()
        },timer)
    }

    step(3000,'red',()=>{
        step(2000,'green',()=>{
            step(1000,'yellow',()=>{
                hld()
            })
        })
    })
}
function hldp(){
    function red(){
        console.log('red')
    }
    function green(){
        console.log('green')
    }
    function yellow(){
        console.log('yellow')
    }
    let step = (timer,cb)=>{
        return new Promise((resolve)=>{
            setTimeout(()=>{
                cb()
                resolve()
            },timer)
        })
    }
    const run = ()=>{
        step(3000,red).then(()=>{
            step(2000,green).then(()=>{
                step(1000,yellow).then(()=>[
                    run()
                ])
            })
        })
    }
    run()
}
function hlda(){
    function red(){
        console.log('red')
    }
    function green(){
        console.log('green')
    }
    function yellow(){
        console.log('yellow')
    }
    let step = (timer,cb)=>{
        return new Promise((resolve)=>{
            setTimeout(()=>{
                cb()
                resolve()
            },timer)
        })
    }
    const run = async ()=>{
        await step(3000,red)
        await step(2000,green)
        await step(1000,yellow)
        run()
    }
    run()
}


// fetch 封装=======================================
async function asyncFetch(url,options){
    try {
        let response = await fetch(url,options)
        if(!response.ok){
            throw new Error('111')
        }
        return response
    } catch (error) {
        throw error
    }
}

//repeat(console.log, 5, 1000)=======================================
function repeat1(fn,count,wait){
    return function callback(...args){
        setTimeout(()=>{
            fn(...args)
            count--
            if(count > 0) callback(...args)
        },wait)
    }
}

//封装一个工具函数输入一个promiseA返回一个promiseB如果超过1s没返回则抛出异常如果正常则输出正确的值。=======================================
function funWait(promise){
    return Promise.race([
        promise,
        new Promise((_,reject)=>{
            setTimeout(()=>{
                reject('超时了')
            },1000)
        })
    ])
}

// sleep =======================================
function sleep1(delay){
    // let start = (new Date()).getTime()
    // while((new Date()).getTime() - start < delay){
    //     continue
    // }
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve()
        },delay)
    })
}

// js每隔一秒打印1,2,3,4,5  =======================================
const step =(count)=>{
    setTimeout(()=>{
        if(count > 0){
            console.log(count)
            count--
            step(count)
        }
    },1000)
}
step(5)



// for (let i = 1; i <= 5; i++){
//    setTimeout(()=>console.log(i),i*1000)
// }
function delayLog(str) {
    return new Promise((resolve, _) => {
        setTimeout(() => {
            console.log(str);
            resolve()
        }, 1000);
    })
}
async function time() {
    for (let i = 1; i <= 5; i++) {
        await delayLog(i)
    }
}
time();
//使用 setTimeout 实现 setInterval =======================================
function set(fn,timer,...args){
    let cancel = false
    const step = ()=>{
        setTimeout(()=>{
            if(!cancel){
                fn.apply(this,args)
                step()
            }
        },timer)
    }
    step()
    return ()=>{ cancel = true }
}
//反过来
function mySetTimeout(fn,delay,...args){
    let timer = setInterval(()=>{
        fn.apply(this,args)
        clearInterval(timer)
    },delay)
}


//使用Promise封装AJAX请求=======================================
function myajax(url, method) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.send(null);
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            resolve(xhr.response);
          } else {
            reject("error");
          }
        }
      };
    });
  }


//取消请求=======================================
let abort = false
function sendRequest() {
  return new Promise((resolve, reject) => {
    if (abort) {
      reject()
    }
    // 发送异步请求
    setTimeout(() => {
      resolve('result')
    }, 2000)
  })
}

setTimeout(() => {
  // 中断请求
  abort = true
}, 1000)



//设计一个简单的任务队列, 要求分别在 1,3,4 秒后打印出 "1", "2", "3"；=======================================
new Quene()
.task(1000, () => {
    console.log(1)
})
.task(2000, () => {
    console.log(2)
})
.task(1000, () => {
    console.log(3)
})
.start()
function Quene(){
    let quene = []
    function task(time,cb){
        let fn = function(){
            return new Promise((resolve)=>{
                setTimeout(()=>{
                    cb()
                    resolve()
                },time)
            })
        }
        quene.push(fn)
        return this
    }
    async function start(){
        for(let fn of quene){
            await fn()
        }
    }
    return {
        task:task,
        start:start
    }
}



/**
* 超时重新请求，并在重试一定次数依然失败时输出缓存内容=======================================
* @param {*} promiseFactory 一个返回 Promise 的函数，表示要执行的异步操作。
* @param {*} maxRetries 一个整数，表示最大的重试次数。
* @param {*} timeout 一个整数，表示每次重试的间隔时间（单位为毫秒）。
* @param {*} cache 一个可选的参数，表示缓存的内容，如果重试多次依然失败，则会返回该缓存内容。
* @returns promise
*/
function retry(fn,max,time,cache){
    return new Promise((resolve,reject)=>{
        let count = 0
        const next =()=>{
            fn().then((res)=>{
                resolve(res)
            }).catch((e)=>{
                count++
                if(count > max){
                    cache ? resolve(cache) : reject(e)
                }else{
                    setTimeout(next,time)
                }
            })
        }
        next()
    })
}

//使用递归完成 1 到 100 的累加 =======================================
function addd(n){
    if(n === 1){
        return 1
    }
    return addd(n-1) + n
}

//请实现一个模块 math，支持链式调用math.add(2,4).minus(3).times(2); =======================================
class math{
    constructor(value){
        this.value = value
    }
    add(...args){
        this.value = args.reduce((pre,next)=>pre+next, this.value)
        return this
    }
    minus(...args){
        this.value = this.value - args.reduce((pre,next)=>pre+next)
        return this
    }
    times(...args){
        this.value = this.value*args.reduce((pre,next)=>pre*next)
        return this
    }

    getVal(){
        return this.value
    }
}

//手写用 ES6proxy 如何实现 arr[-1] 的访问=======================================
let proxy = new Proxy(arr,{
    get(target,key){
        key = +key
        while(key < 0){
            key += arr.length
        }
        return target[key]
    }
})



// js ===================================================leecode===============================================================================
// 生成随机数组=======================================
function randomarr(len,min,max){
    if(max-min > len) return null
    let arr = []
    while(arr.length < len){
        let num = Math.floor(Math.random()*max)
        if(num < min) continue
        if(!arr.includes(num)){
            arr.push(num)
        }
    }
    return arr
}
/**
 * 获取数组中两数之和等于目标值的下标
 */
function twosum(nums,target){
    let map = new Map()
    for (let i = 0; i < nums.length; i++) {
        let neednum = target - nums[i]
        if(map.has(neednum)){
        return [i,map.get(neednum)]
        }
        map.set(nums[i],i)
    }
}

  // js全排列  =======================================
  //[1,2,3] =》 [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
  function getAllPermutation(arr){
    let result = []
    let path = []
    const stracking = (used)=>{
        if(path.length === arr.length){
            result.push([...path])
            return
        }
        for(let i=0;i<arr.length;i++){
            if(used[i]) continue
            if (i > 0 && arr[i] === arr[i - 1] && !used[i - 1]) continue;
            path.push(arr[i])
            used[i] = true
            stracking(used)
            path.pop()
            used[i] = false
        }
    }
    let used = new Array(arr.length).fill(false)
    stracking(used)
    return result
  }

//1-1000回文数=======================================
function huiwe(count){
    for (let i = 1; i <= count; i++) {
        let x = i.toString().split('').reverse().join('')
        if(x === i.toString()){
            console.log(i)
        }
    }
}


// 整数反转
function huu(num){
    let res = 0
    while(num){
        res = res * 10 + num % 10
        if(res > Math.pow(2,31) - 1 || res < Math.pow(-2,31)) return
        num = ~~(num/10)
    }
    return res
}

//回文数
function huuii(x){
    if(x < 0 || (x%10 === 0 && x!== 0)) return false
    let res = 0
    while(x > res){
        res = res * 10 + x % 10
        x = ~~(x/10)
    }
    return  res == x || x == ~~(res/10)
}


//有一堆整数，请把他们分成三份，确保每一份和尽量相等=======================================
function tothreearr(arr){
    let res = [{sum:0,arr:[]},{sum:0,arr:[]},{sum:0,arr:[]}]
    arr = arr.slice().sort((a,b)=> b-a )
    arr.map((item)=>{
        let min = res.sort((a,b)=> a.sum - b.sum)[0]
        min.sum += item
        min.arr.push(item)
    })
    return res
}


//输入50a6we8y20x 输出50个a，6个we，8个y，20个x =======================================
function print(str){
    return str.replace(/(\d+)([a-zA-Z]+)/g,(_,num,string)=>{
        return string.repeat(parseInt(num))
    })
}

  // 最长回文字串 leecode.5   =======================================
  function huiwenchuan(s){
    if(s.length < 1) return ''
    let start = 0
    let maxLen = 1
    const expandAroundCenter = (left,right)=>{
        while(left >= 0 && right < s.length && s[left] === s[right]){
            left--
            right++
        }
        return right - left - 1
    }
    for(let i = 0; i<s.length; i++){
        let len1 = expandAroundCenter(i,i)
        let len2 = expandAroundCenter(i,i + 1)
        let curLen = Math.max(len1,len2)
        if(curLen > maxLen){
            maxLen = curLen
            start = i - Math.floor((maxLen-1)/2)
        }
    }
    return s.slice(start,start + maxLen)
  }

// 对输入的字符串：去除其中的字符'b'；去除相邻的'a'和'c' =======================================
function removwchars(str){
    let stack = []
    for (let i = 0; i < str.length; i++) {
        if(str[i] === 'b') continue
        if((str[i] === 'a' && stack[stack.length - 1] === 'c') || 
        (str[i] === "c" && stack[stack.length - 1] === "a")){
            stack.pop()
        }else{
            stack.push(str[i])
        }
    }
}

//给定一个排序数组和一个目标值，在数组中找到目标值，并返回其索引。如果目标值不存在于数组中，返回它将会被按顺序插入的位置。
var searchInsert = function(nums, target) {
    let l = -1
    let r = nums.length
    while(l + 1 != r){
        let mid = Math.floor((l + r)/2)
        if(nums[mid] < target){
            l = mid
        }else{
            r = mid
        }
    }
    return l + 1
};

//给定一个只包括 '('，')'，'{'，'}'，'['，']' 的字符串 s ，判断字符串是否有效。
var isValid = function(s) {
    let stack = []
    let map ={
        "(":")",
        "{":"}",
        "[":"]"
    }
    for(let x of s){
        if(x in map){
            stack.push(x)
        }else{
            if(map[stack.pop()] !== x) return false
        }
    }
    return !stack.length
}

//最长公共前缀
var longestCommonPrefix = function(strs) {
    if(strs.length ==0) return ''
    let ans = strs[0]
    for(let i = 1;i<strs.length;i++){
        let j = 0
        for(;j < ans.length && j < strs[i].length; j++){
            if(ans[j] !== strs[i][j]){
                break
            }
        }
        ans = ans.slice(0,j)
        if(ans === '') return ''
    }
    return ans
};

//合并两个有序链表
var mergeTwoLists = function(list1, list2) {
    if(list1 === null){
        return list2
    }else if(list2 === null){
        return list1
    }else if(list1.val < list2.val){
        list1.next = mergeTwoLists(list1.next,list2)
        return list1
    }else{
        list2.next = mergeTwoLists(list2.next,list1)
        return list2
    }
};

//27  给你一个数组 nums 和一个值 val，你需要 原地 移除所有数值等于 val 的元素，并返回移除后数组的新长度。
var removeElement = function(nums, val) {
    let l = 0
    for(i = 0; i < nums.length; i++){
        if(nums[i] !== val){
            nums[l] = nums[i]
            l++
        }
    }
    return l
};

//找出字符串中第一个匹配项的下标

var strStr = function(haystack, needle) {
    let l = 0
    let res = -1
    if(haystack === needle) return 0
    while(l + needle.length < haystack.length + 1){
        if(haystack.slice(l,l + needle.length) == needle){
            res = l
            break
        }
        l++
    }
    return res
};

//合并两个有序数组
var merge = function(nums1, m, nums2, n) {
    let p1 = m - 1, p2 = n - 1;
    let tail = m + n - 1;
    var cur;
    while (p1 >= 0 || p2 >= 0) {
        if (p1 === -1) {
            cur = nums2[p2--];
        } else if (p2 === -1) {
            cur = nums1[p1--];
        } else if (nums1[p1] > nums2[p2]) {
            cur = nums1[p1--];
        } else {
            cur = nums2[p2--];
        }
        nums1[tail--] = cur;
    }
};

// 二叉树的前序遍历
//递归法
var preorderTraversal = function(root) {
    let res = []
    const dfs = (root)=>{
        if(root === null) return
        res.push(root.val)
        dfs(root.left)
        dfs(root.right)
    }
    dfs(root)
    return res
};
// 迭代法
var preorderTraversal = function(root, res = []) {
    if(!root) return res
    let stack = [root]
    let node = null
    while(stack.length){
        node = stack.pop()
        res.push(node.val)
        node.right && stack.push(node.right)
        node.left && stack.push(node.left)
    }
    return res
};



