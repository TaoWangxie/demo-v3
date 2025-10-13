const { min } = require("lodash")
const { resolve } = require("path")

const promiseAll = (arr)=>{
    return new Promise((resolve,reject)=>{
        let result = new Array(arr.length).fill(null)
        let count = 0
        arr.map((fn,index)=>{
            Promise.resolve(fn).then((res)=>{
                result[index] = res
                count++
                if(count == arr.length){
                    resolve(result)
                }
            }).catch((e)=>{
                reject(e)
            })
        })
    })
}
 const promiseAllsettled = (arr)=>{
    return new Promise((resolve, reject)=>{
        let result = new Array(arr.length).fill(null)
        let count = 0
        arr.map((fn,index)=>{
            Promise.resolve(fn).then((res)=>{
                result[index] = {
                    status:'fulfilled',
                    value:res
                }
                count++
                if(count === arr.length){
                    resolve(result)
                }
            }).catch((e)=>{
                result[index] = {
                    status:'rejected',
                    value:e
                }
                count++
                if(count === arr.length){
                    resolve(result)
                }
            })
        })
    })
 }
 const promiseRace = (arr)=>{
    return new Promise((resolve,reject)=>{
        arr.map((fn)=>{
            Promise.resolve(fn).then((res)=>{
                resolve(res)
            }).catch((e)=>{
                reject(e)
            })
        })
    })
 }


 const fn = (num)=>{
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            num++
            resolve(num)
        },1000)
    })
 }

 function* gen(){
    let data = yield fn(1)
    let data2 = yield fn(data)
    return data2
 }

 const myAsync = (genF)=>{
    return new Promise((resolve,reject)=>{
        let gen = genF()
        const step = (fn)=>{
            let next
            try{
                next = fn()
            }catch(e){
                return reject(e)
            }
            if(next.done){
                resolve(next.value)
            }
            Promise.resolve(next.value).then((res)=>{
                step(()=> gen.next(res))
            }).catch((e)=>{
                step(()=> gen.throw(e))
            })
        }
        step(()=> gen.next())

    })
 }

 class EventBus {
    constructor() {
        this.eventBus = {}
    }

    on(name,cb){
        let task = this.eventBus[name]
        if(task){
            task.push(cb)
        }else{
            task = [cb]
        }
    }
    emit(name,data){
        let task = this.eventBus[name]
        if(task){
            task.map((cb)=>{
                cb && cb(data)
            })
        }
    }
    off(name,cb){
        let task = this.eventBus[name]
        if(task && task.indexOf(cb) !== -1){
            task.splice(task.indexOf(cb), 1)
        }
    }
    once(name, data){
        let task = this.eventBus[name]
        if(task){
            task.map((cb)=>{
                cb && cb(data)
            })
            delete task
        }
    }
 }

 Function.prototype.mycall = function (context){
    context = context === null || context === undefined ? window : Object(context)
    let args = [...arguments.slice(1)]
    let fn = Symbol('fn')
    context[fn] = this
    let res = context[fn](...args)
    delete context[fn]
    return res
 }

 Function.prototype.myapply = function (context, ...args){
    context = context === null || context === undefined ? window : Object(context)
    let fn = Symbol('fn')
    context[fn] = this
    let res = context[fn](...args)
    delete context[fn]
    return res
 }


 function multiRequest(urls, maxnum){
    let result = new Array(urls.length).fill(null)
    let pendingCount = 0
    let index = 0
    return new Promise((resolve,reject)=>{
        let next = ()=>{
            if(index >= url.length && pendingCount == 0){
                resolve(result)
                return
            }
            while(pendingCount < maxnum && index < urls.length){
                let currentIndex = index++
                pendingCount++
                fetch(urls[currentIndex]).then((res)=>{
                    result[currentIndex] = res
                }).catch((e)=>{
                    result[currentIndex] = e
                }).finally(()=>{
                    pendingCount--
                    next()
                })
            }
        }
        next()
    })
 }

 function intersection(arr1,arr2){
    let map = new Map()
    arr1.map((item)=>{
        map.set(item,true)
    })

    let res = []
    arr2.forEach(n => {
        if(map.get(n)){
            res.push(n)
            map.delete(n)
        }
    });
    return map
 }

 function singlenumber(nums){
    let res = 0
    nums.forEach((n)=>{
        res ^= n
    })
    return res
 }

 String.prototype.quchong = function(){
    let map = new Map()
    let str = ''
    this.forEach((n)=>{
        if(!map.get(n)){
            map.set(n,true)
            str+=n
        }
    })
    return str
 }

 String.prototype.huiwen = function(){
    len = this.length
    for(let i = 0; i<len/2; i++){
        if(this[i] !== this[len - 1 - i]){
            return false
        }
    }
    return true
 }

//删除有序数组重复项 
function quchong(nums){
    let slow = 0
    let fast = 1
    while( fast < nums.length){
        if(nums[slow] !== nums[fast]){
            nums[++slow] = nums[fast]
        }
        fast++
    }
    return nums.slice(0,slow+1)

}
 
function maopao(arr){
    for(let i = 0; i< arr.length; i++){
        for(let j = 0; j < arr.length - i; j++){
            if(arr[j] > arr[j + 1]){
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
            }
        }
    }
}

function xuanzepai(arr){
    for(let i = 0; i<arr.length; i++){
        let minindex = i
        for(let j = i+1; j<arr.length; j++){
            if(arr[minindex] > arr[j]){
                minindex = j
            }
        }
        [arr[i],arr[minindex]] = [arr[minindex],arr[i]]
    }
}
function charu(arr){
    for(let i = 0; i<arr.lenth; i++){
        for(let j = 0; j < i; j++){
            if(arr[j > arr[i]]){
                [arr[j],arr[i]] = [arr[i],arr[j]]
            }
        }
    }
}

function kuaipai(arr){
    let point = arr[arr.length - 1];
    let left = arr.filter((item, i)=>item < point && i !== arr.length - 1)
    let right = arr.filter((item)=>item > point)
    return [...kuaipai(left), point, ...kuaipai(right)]
}

function flat(arr,depth = 1){
    return depth > 0 ? arr.reduce((res,item)=>{
     res.concat(Array.isArray(item) ? flat(item,depth - 1) : item)
    },[]) : arr.slice()
}

Array.prototype.fanzhuan = function(){
    let len = this.length
    for(let i =0; i<len/2; i++){
        [this[i],this[len - 1 - i]] = [this[len - 1 - i],this[i]]
    }
    return this
}

function fanzhuan(arr){
    let l = 0
    let r = arr.length - 1
    while(l<r){
        [arr[l],arr[r]] = [arr[r],arr[l]]
        l++
        r--
    }
    return arr
}

function sss(arr){
    let len = arr.length
    return new Proxy(arr,{
        get(target,key){
            key = +key
            while(key<0){
                key += len
            }
            return target[key]
        }
    })
}

function findNestedValue(obj, field) {
    if(obj == null || typeof obj !== 'object'){
        return null
    }
    if(obj.hasOwnProperty(field)){
        return obj[field]
    } 
    for(let key in obj){
        if(typeof obj[key] === 'object'){
            let res = findNestedValue(obj[key],field)
            if(res !== null){
                return res
            }
        }
    }
    return null
}

function shufflearray(arr){
    for(let i = arr.length - 1; i >=0; i--){
        let randomindex= Math.floor(Math.random() * 1)
        [arr[i],arr[randomindex]] = [arr[randomindex],arr[i]]
    }
    return arr
}

function getAllParams() {
    let query = window.location.search.substring(1)
    let obj = {}
    query.split('&').forEach((item)=>{
        let key = item.split('=')[0]
        let val = item.split('=')[1]
        if(key){
            obj[encodeURIComponent(key)] = decodeURIComponent(val)
        }
    })
    return obj
}

function formatNumber(str){
    return str.split('').reverse().reduce((prev,next,index)=>{
        return (index%3 ? next : next + ',') + prev
    })
}


function merge(arr1,arr2){
    let res = []
    while(arr1.length && arr2.length){
        if(arr1[0] < arr2[0]){
            res.push(arr1.shift())
        }else{
            res.push(arr2.shift())
        }
    }
    return res.concat(arr1).concat(arr2)
}
function mergesort(arr){
    if(arr.length === 1){
        return arr
    }
    while(arr.length > 1){
        let arr1 = arr.shift()
        let arr2 = arr.shift()
        let newarr = merge(arr1,arr2)
        arr.push(newarr)
    }
    return arr[0]
}


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

  async function sum(...args){
    let result = 0
    let obj = {}
    obj.toString = ()=>result
    let promises = []
    args.forEach((item)=>{
        promises.push(new Promise((resolve)=>{
            asyncAdd(obj,item,(_,pre)=>resolve(pre))
        }).then((res)=>{
            result = res
        }))
    })
    await Promise.all(promises)
    return result
  }


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
    let pendding = []
    let count = 0
    let run = ()=>{
        if(!pendding.length || count >= limit) return
        let [params,resolve,reject] = pendding.shift()
        count++
        request(params).then((res)=>{
            resolve(res)
        }).catch((err)=>{
            reject(err)
        }).finally(()=>{
            count--
            run()
        })
    }
    return function(params){
        return new Promise((resolve,reject)=>{
            pendding.push([params,resolve,reject])
            run()
        })
    }
  }

  //多维数组全排列 [[1, 2], [3, 4], [5, 6]]
// 输出：[[1 ,3 ,5] ,[1 ,3 ,6] ,[1 ,4 ,5] ,[1 ,4 ，6] ,[2 ，3 ，5] ,[2 ，3 ，6] ,[2 ，4 ，5],[2，4，6]]
function aaa(arr){
    return arr.reduce((res,v)=>{
        return res.map((item)=>v.map((val)=>[...item,val])).flat()
    },[[]])

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
    const run = step(3000,red).then(()=>{
        step(2000,green).then(()=>{
            step(1000,yellow).then(()=>{
                run()
            })
        })
    })
    run()
}

function funWait(promise){
    return Promise.race([promise,new Promise((_,reject)=>{
        setTimeout(()=>{
            reject('超时了')
        },1000)
    })])
}

const sleep = (count)=>{
    return new Promise((resolve)=>{
        setTimeout(()=>{
            console.log(count)
            resolve()
        },1000)
    })
}
const run = async (count)=>{
    for(let i = count; i > 0; i--){
        await sleep(i)
    }
}
run(5)


function mySetInerval(fn,timer,...args){
    let cancel = false
    let step = ()=>{
        setTimeout(()=>{
            if(cancel) return
            fn.apply(this,args)
            step()
        },timer)
    }
    step()
    return ()=> { cancel = true }
}

function mySetTimeout(fn,timer,...args){
    let aa = setInterval(()=>{
        fn.apply(this,args)
        clearInterval(aa)
    }, timer)
}

function queneFn(){
    let quene = []
    let task = (timer,cb)=>{
        let fn = new Promise((resolve)=>{
            setTimeout(()=>{
                cb()
                resolve()
            },timer)
        })
        quene.push(fn)
        return this
    }
    let start = async ()=>{
        for(let fn of quene){
            await fn()
        }
    }
    return {
        task,
        start
    }
}

function retry(fn,max,time,cache){
    return new Promise((reslove,reject)=>{
        let conut = 0
        let step =()=>{
            fn().then((res)=>{
                resolve(res)
            }).catch((e)=>{
                conut++
                if(count > max){
                    cache ? resolve(cache) : reject(e)
                }
                setTimeout(()=>{
                    step()
                },time)
            })
        }
        step()
    })
}


function randomarr(len,min,max){
    if(max-min > len) return null
    let arr = []
    while(arr.length < len){
        let num = Math<floor(Math.random() * max)
        if(num < min) continue
        if(!arr.includes(num)){
            arr.push(num)
        }
    }
    return arr
}

function twosum(nums,target){
    let map = new Map()
    for(let i = 0; i < nums.length; i++){
        let aa = target - nums[i]
        if(map.has(aa)){
            return map.get(aa)
        }
        map.set(nums[i],i)
    }
}

function getAllPermutation(arr){
    let result = []
    let path = []
    const stracking = (used)=>{
        if(path.length == arr.length){
            result.push([...path])
            return
        }
        for(let i = 0; i<arr.length; i++){
            if(used[i]) continue
            if(i>0 && arr[i] == arr[i-1] && !used[i-1]) continue
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

function huiwe(count){
    for(let i = 0; i<count; i++){
        let str = i.toString().split('').reverse().join('')
        if(str == i.toString()){
            console.log(i)
        }
    }
}

function huu(num){
    let res = 0
    while(num){
        res = res * 10 + num % 10
        if(res > Math.pow(2,31) - 1 || res < Math.pow(-2,31)) return 0
        num = ~~(num/10)
    }
    return res
}

function huuii(x){
    if(x < 0 || (x %10 === 0 && x != 0)) return
    let res = 0
    while(x>res){
        res = res * 10 + x % 10
        x = ~~(x/10)
    }
    return res == x || x == ~~(res/10)
}

function tothreearr(arr){
    let res = [{sum:0,arr:[]},{sum:0,arr:[]},{sum:0,arr:[]}]
    let arr = arr.slice().sort((a,b)=> b-a )
    arr.forEach((item)=>{
        let min = res.sort((a,b)=> a.sum - b.sum)[0]
        min.sum += item
        min.arr.push(item)
    })
    return res
}

function huiwenchuan(s){
    if(s.length < 1) return ''
    let start = 0
    let maxLen = 1
    const expandAroundCenter = (left,right)=>{
        while(left >=0 && right < s.length && s[left] === s[right]){
            left--
            right++
        }
        return right - left - 1
    }
    for(let i = 0; i<s.length; i++){
        let len1 = expandAroundCenter(i,i)
        let len2 = expandAroundCenter(i,i + 1)
        let curlen = Math.max(len1,len2)
        if(curlen > maxLen){
            maxLen = curlen
            start = i - Math.floor((maxLen-1)/2)
        }
    }
    return s.slice(start, start+maxLen)
}

function removwchars(str){
    let stack = []
    for(let i = 0; i < str.length; i++){
        if(str[i] === 'b') continue
        if((str[i] === 'a' && stack[stack.length - 1] === 'c') ||
        (str[i] === 'c' && stack[stack.length - 1] === 'a')){
            stack.pop()
        }else{
            stack.push(str[i])
        }
    }
    return stack.join('')
}
var searchInsert = function(nums, target) {
    let l = -1
    let r = nums.length
    while(l+1 != r){
        let mid = Math.floor((l+r)/2)
        if(num[mid] < target){
            l = mid
        }else{
            r = mid
        }
    }
    return l + 1
}