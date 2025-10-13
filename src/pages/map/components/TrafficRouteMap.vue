<template>
  <div class="TrafficRouteMap" v-loading="loading">
    <div id="allmap" :style="{ height: mapheight || 'calc(100vh)' }"></div>
    <div class="actionBox">
      <div class="part">
        <img v-if="!isShowFilter" class="controls_img" src="@/assets/images/trafficMap/filter.png" alt="" @click="openFilter(true)">
        <img v-else class="controls_img" src="@/assets/images/trafficMap/filter_active.png" alt="" @click="openFilter(false)">
        <div v-show="isShowFilter" class="filterBox">
          <div class="filter_li">
            <div class="label">
              点位展示
            </div>
            <div class="value">
              <div>
                <el-checkbox :indeterminate="pointIsIndeterminate" v-model="pointCheckAll" @change="handlePointCheckAllChange">点位</el-checkbox>
              </div>
              <el-checkbox-group style="display: flex; flex-wrap: wrap;" v-model="checkList" @change="checkboxChange">
                <el-checkbox :label="0">停车</el-checkbox>
                <el-checkbox :label="5">加油</el-checkbox>
                <el-checkbox :label="9">维保到厂</el-checkbox>
                <el-checkbox :label="2">维保出厂</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
          <div class="filter_li">
            <div class="label"></div>
            <div class="value">
              <el-checkbox-group style="display: flex; flex-wrap: wrap; align-items: baseline;" v-model="checkPathList" @change="pathCheckboxChange">
                <el-checkbox :label="1">
                  <div class="colorInfo"><span style="background: #0062FF;"></span>办公用车</div>
                </el-checkbox>
                <el-checkbox :label="2">
                  <div class="colorInfo"><span style="background: #773ba7;"></span>紧急用车</div>
                </el-checkbox>
                <el-checkbox :label="3">
                  <div class="colorInfo"><span style="background: #FF9933;"></span>节假日用车</div>
                </el-checkbox>
                <el-checkbox :label="4">
                  <div class="colorInfo"><span style="background: #FF3363;"></span>围栏超速</div>
                </el-checkbox>
                <div class="colorInfo"><span style="background: #15CF8B;"></span>未下单</div>
              </el-checkbox-group>
            </div>
          </div>
          <div class="filter_li">
            <div class="label"></div>
            <div class="value tip">
              <img src="@/assets/images/trafficMap/tip.png" alt="">
              点击地图上的轨迹或点位可查看对应订单
            </div>
          </div>
        </div>
      </div>
      <div v-if="pathData.length" class="controls part">
        <div class="controls_img_box">
          <img class="controls_img" v-if="!isGo" src="@/assets/images/trafficMap/play.png" alt="" @click="startLushu">
          <img class="controls_img" v-else src="@/assets/images/trafficMap/pause.png" alt="" @click="pauseLushu">
        </div>
        <div class="slider">
          <el-slider
            v-model="processValue"
            :min="0"
            :max="maxProcess"
            style="flex: 1"
            @change="onProcessChange"
          />
        </div>
        <div class="controls_img_box">
          <img class="controls_img" src="@/assets/images/trafficMap/stop.png" alt="" @click="stopLushu">
        </div>
        <div class="speed">
          <el-dropdown trigger="click" @command="onSpeedChange">
            <span>
              倍速 {{ indexText }}<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(item, index) in dropdownArr"
                  :command="item"
                  :key="index"
                >{{ item.text }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div v-if="pathData.length" class="distance_box part">
        行驶总里程：{{ distance }}km
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage, ElCheckbox, ElCheckboxGroup, ElSlider, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import { TrafficRouteMap } from '@/utils/trafficRouteMap/TrafficRouteMap.js'
import trailStop from '@/assets/images/trafficMap/p.png'
import wbcc from '@/assets/images/trafficMap/wbcc.png'
import wbccActive from '@/assets/images/trafficMap/wbcc_active.png'
import jy from '@/assets/images/trafficMap/jy.png'
import jyActive from '@/assets/images/trafficMap/jy_active.png'
import car from '@/assets/images/trafficMap/car.png'
import driver from '@/assets/images/trafficMap/driver.png'
import carUser from '@/assets/images/trafficMap/carUser.png'
import startingPoint from '@/assets/images/trafficMap/startingPoint.png'
import keyPoint from '@/assets/images/trafficMap/keyPoint.png'
import trailStartUrl from "@/assets/images/trafficMap/start.png"
import trailEndUrl from "@/assets/images/trafficMap/end.png"

// Props
const props = defineProps({
  orderRecordList: {
    type: Array,
    default: () => [],
  },
  warnRecordList: {
    type: Array,
    default: () => [],
  },
  stopRecordList: {
    type: Array,
    default: () => [],
  },
  companyId: {
    type: [String, Number],
    default: '',
  },
  distance: {
    type: [String, Number],
    default: 0,
  },
  mapheight: {
    type: [String, Number],
    default: 0,
  },
  isNoCars: {
    type: Boolean,
    default: false,
  },
})

// Refs
const loading = ref(false)
const trafficMap = ref(null)
const allPathData = ref([])
const pathData = ref([])
const labelMarkers = ref([])
const stopMarkers = ref([])
const processValue = ref(0)
const maxProcess = ref(0)
const isGo = ref(false)
const isShowFilter = ref(true)
const pointCheckAll = ref(false)
const pointIsIndeterminate = ref(false)
const checkList = ref([0, 5, 9, 2])
const pathCheckAll = ref(false)
const pathIsIndeterminate = ref(false)
const checkPathList = ref([1, 2, 3, 4])
const loginType = ref(sessionStorage.getItem("loginType") || 1)

// 常量
const labelMap = ref([
  {
    key: 2,
    labelBg: wbcc,
    labelBgActive: wbccActive,
    labelText: '维保出厂',
    bgColor: '#0062FF',
  },
  {
    key: 5,
    labelBg: jy,
    labelBgActive: jyActive,
    labelText: '加油',
    bgColor: '#15CF8B',
  },
  {
    key: 9,
    labelBg: wbcc,
    labelBgActive: wbccActive,
    labelText: '维保到厂',
    bgColor: '#0062FF',
  },
])

const dropdownArr = ref([
  { text: "x0.5", speed: 500 },
  { text: "x0.75", speed: 750 },
  { text: "x1", speed: 1000 },
  { text: "x2", speed: 2000 },
  { text: "x3", speed: 3000 },
  { text: "x5", speed: 5000 },
])

const indexText = ref("x1")
const speedValue = ref(1000)

// 方法
const initMap = () => {
  trafficMap.value = new TrafficRouteMap("allmap", {
    zoomLevel: 16,
    labelMap: labelMap.value,
  })
}

const getTrack = (pathDataVal, labelMarkersVal, stopMarkersVal) => {
  if (trafficMap.value) {
    trafficMap.value.clearOverlays()
  }
  stopLushu()
  allPathData.value = pathDataVal || []
  labelMarkers.value = labelMarkersVal || []
  stopMarkers.value = stopMarkersVal || []
  
  if (allPathData.value.length >= 2) {
    pathCheckboxChange(checkPathList.value)
  } else {
    ElMessage.info('暂无轨迹数据')
    if (trafficMap.value) {
      trafficMap.value.clearLushu()
    }
  }
  checkboxChange(checkList.value)
}

const drawPathLushu = (pathDataVal) => {
  trafficMap.value.drawPath({
    pathData: pathDataVal,
    clickFn: (point, pointData) => { getPathPointDetail(point, pointData) },
    getColor: (pointData) => getPolylineColor(pointData),
    lngName: 'lngBaidu',
    latName: 'latBaidu',
  })
  
  trafficMap.value.initLushu(
    {carIconUrl: car, speed: speedValue.value, defaultContent: '1'},
    { 
      getContent: (i) => {   
        let speed = pathDataVal[i] ? pathDataVal[i].speed : ''
        let createDate = pathDataVal[i].createDate || '-'
        let content = `
        <div class="speed-box">
            <div><span>${speed}</span>km/h</div>
            <div>${createDate}</div>
        </div>`
        return content
      },
      sliderFn: (value) => { processValue.value = value },
      onEnd: () => { isGo.value = false }
    }
  )
  maxProcess.value = pathDataVal.length ? pathDataVal.length - 1 : 0
}

const drawLabel = (labelMarkersVal, stopMarkersVal) => {
  trafficMap.value.drawLabel({
    points: labelMarkersVal,
    clickFn: (point, labelData) => { getLabelDetail(point, labelData) },
  })
  
  trafficMap.value.drawMarkers({
    markers: stopMarkersVal,
    markerIconUrl: trailStop,
    clickFn: (point, labelData) => { getStopDetail(point, labelData) },
    lngName: 'lngBaidu',
    latName: 'latBaidu',
  })
}

const getPathPointDetail = (point, pointData) => {
  if(pointData.disabled){
    return
  }
  let isWarn = pointData.type === 'warn'
  let startDate = isWarn ? 'warnStartTime' : 'factStartDate'
  let endDate = isWarn ? 'warnEndTime' : 'factEndDate'
  let list = isWarn ? props.warnRecordList : props.orderRecordList
  let cardList = list.filter(item => IsTimeInRange(pointData.createDate, item[startDate], item[endDate]))
  
  if (!cardList.length) {
    let msg = isWarn ? '点击时段内没有危险驾驶记录' : '点击时段内没有用车订单'
    ElMessage.info(msg)
    trafficMap.value.infoWindow && trafficMap.value.infoWindow.close()
    return
  }
  
  const infoContent = cardList.length > 1 ? `
    <div class="card-container">
      <div class="card-list">
        ${cardList.map((item, index) => { return getPathContent(item, index, true, isWarn) }).join('')}
      </div>
    </div>` : `${cardList.map((item, index) => { return getPathContent(item, index, false, isWarn) }).join('')}`
    
  trafficMap.value.openInfoBox(point, infoContent, [-15, -15])
}

const getPathContent = (card, index, isMore, isWarn) => {
  const orderContent = `
    <div class="infobox-container">
        <div class="header">
            <div class="title">
                <div class="tag" style="background: ${card.orderType == 1 ? '#0062FF' : '#773ba7'}">${card.orderTypeStr}</div>
                <div class="time">${card.factStartDateStr || ""} - ${card.factEndDateStr || ''}</div>
            </div>
            ${(isMore && index == 0) || !isMore ? '<div class="close_infoWindow"></div>' : ''}
        </div>
        <div class="content">
            <div class="car-order-content">
                <div>
                    <img src="${driver}" alt="">
                    <span>${card.assignDriverName || ''}${card.assignDriverName && card.assignDriverPhone ? '/' : ''}${card.assignDriverPhone || ''}</span>
                </div>
                <div>
                    <img src="${carUser}" alt="">
                    <span>${card.bookingPassengerUserName || ''}${card.bookingPassengerUserName && card.bookingPassengerUserPhone ? '/' : ''}${card.bookingPassengerUserPhone || ''}</span>
                </div>
            </div>
              <div class="car-order-timeline">
                  <div class="timeline_li">
                      <img src="${startingPoint}" alt=""/>
                      ${card.factStartShortAddr || ''}
                  </div>
                  <div class="timeline_line"></div>
                  <div class="timeline_li">
                      <img src="${keyPoint}" alt=""/>
                      ${card.factEndShortAddr || ''}
                  </div>
              </div>
            <div class="car-order-total">
                <div class="car-order-total-item">
                    <div class="car-order-total-item-num-box">
                        <span class="car-order-total-item-num">${card.tripMileage}</span>
                        <span class="car-order-total-item-unit">${card.tripMileageUnit || ''}</span>
                    </div>
                    <div class="car-order-total-item-title">
                        里程
                    </div>
                </div>
                <div class="car-order-total-item">
                    <div class="car-order-total-item-num-box">
                        <span class="car-order-total-item-num">${card.durationHours}</span>
                        <span class="car-order-total-item-unit">${card.durationHoursUnit || ''}</span>
                    </div>
                    <div class="car-order-total-item-title">
                        时长
                    </div>
                </div>
            </div>
        </div>
    </div>`
    
  const warnContent = `
    <div class="infobox-container">
        <div class="header">
            <div class="title">
                <div class="tag" style="background: ${getWarnColor(card)}">${card.warnTypeStr || ''}</div>
                <div class="time">${card.warnStartTimeStr || ''} - ${card.warnEndTimeStr || ''}</div>
            </div>
            ${(isMore && index == 0) || !isMore ? '<div class="close_infoWindow"></div>' : ''}
        </div>
        <div class="content">
            <div class="car-order-content">
                <div>
                    <img src="${driver}" alt="">
                    <span>${card.driverName || ''}${card.driverName && card.driverMobile ? '/' : ''}${card.driverMobile || ''}</span>
                </div>
            </div>
            <div class="car-danger-content">
                <span class="car-danger-content-title">报警位置</span>
                <span class="car-danger-content-name">${card.warnPlace}</span>
            </div>
            ${card.totalMillage || card.actualSpeed || card.durationHours ? `<div class="car-order-total">
              ${card.totalMillage ? `<div class="car-order-total-item">
                  <div class="car-order-total-item-num-box">
                      <span class="car-order-total-item-num">${card.totalMillage}</span>
                      <span class="car-order-total-item-unit">${card.totalMillageUnit || ''}</span>
                  </div>
                  <div class="car-order-total-item-title">
                      里程
                  </div>
              </div>` : ''}
              ${card.durationHours ? `<div class="car-order-total-item">
                  <div class="car-order-total-item-num-box">
                      <span class="car-order-total-item-num">${card.durationHours}</span>
                      <span class="car-order-total-item-unit">${card.durationHoursUnit || ''}</span>
                  </div>
                  <div class="car-order-total-item-title">
                      时长
                  </div>
              </div>` : ''}
              ${card.actualSpeed && card.warnType == 1 ? `<div class="car-order-total-item">
                  <div class="car-order-total-item-num-box">
                      <span class="car-order-total-item-num">${card.actualSpeed}</span>
                      <span class="car-order-total-item-unit">${card.actualSpeedUnit || ''}</span>
                  </div>
                  ${card.warnType == 1 ? `<div class="car-order-total-item-title">平均时速</div>` : ''}
              </div>` : ''}
            </div>` : ''}
        </div>
    </div>`
    
  return isWarn ? warnContent : orderContent
}

const getLabelDetail = (point, pointData) => {
  let label = ''
  let eventAddressLabel = ''
  let eventDescLabel = ''
  if (pointData.eventType === 5) {
    eventAddressLabel = '加油站'
    eventDescLabel = '加油升数'
  } else if ([2, 9].includes(pointData.eventType)) {
    label = '送修人'
    eventAddressLabel = '维修厂'
    eventDescLabel = '维修金额'
  }
  
  const infoContent =
  `<div class="infobox-container">
      <div class="header">
          <div class="title">
              <div class="tag" style="background: ${pointData.bgColor}">${pointData.eventTypeStr}</div>
              <div class="time">${pointData.eventTime || ''}</div>
          </div>
          <div class="close_infoWindow"></div>
      </div>
      <div class="content">
          ${pointData.driverName ? `
          <div class="content_li">
              <div class="label">${label}</div>
              <div class="value">${pointData.driverName}</div>
          </div>
          ` : ''}
          <div class="content_li">
              <div class="label">${eventAddressLabel}</div>
              <div class="value">${pointData.eventAddress || ''}</div>
          </div>
          ${[2].includes(pointData.eventType)? `<div class="content_li">
              <div class="label">${eventDescLabel}</div>
              <div class="value">${pointData.eventDesc || ''}</div>
          </div>` : ''}
      </div>
  </div>`
  
  trafficMap.value.openInfoBox(point, infoContent, [-15, -15])
}

const getStopDetail = (point, pointData) => {
  let cardList = props.stopRecordList.filter(item => IsTimeInRange(pointData.createDate, item['stopStartTime'], item['stopEndTime']))
  if (cardList.length) {
    let data = cardList[0]
    const infoContent =
    `<div class="infobox-container">
        <div class="header">
            <div class="title">
                <div class="tag" style="background: #FF6133">停车</div>
                <div class="time">${data.stopStartTimeStr || ''} - ${data.stopEndTimeStr || ''}</div>
            </div>
            <div class="close_infoWindow"></div>
        </div>
        <div class="content">
            ${data.durationHours ? `
            <div class="content_li">
                <div class="label">停车时长</div>
                <div class="value">${data.durationHours} h</div>
            </div>
            ` : ''}
            <div class="content_li">
                <div class="label">停车地点</div>
                <div class="value">${data.stopAddress || ''}</div>
            </div>
        </div>
    </div>`
    trafficMap.value.openInfoBox(point, infoContent, [-15, -15])
  }
}

const startLushu = () => {
  if (trafficMap.value) {
    isGo.value = true
    trafficMap.value.startLushu()
  }
}

const pauseLushu = () => {
  if (trafficMap.value) {
    isGo.value = false
    trafficMap.value.pauseLushu()
  }
}

const stopLushu = () => {
  if (trafficMap.value) {
    isGo.value = false
    trafficMap.value.stopLushu()
    processValue.value = 0
  }
}

const onSpeedChange = (value) => {
  indexText.value = value.text
  speedValue.value = value.speed
  if (trafficMap.value && trafficMap.value.lushu) {
    trafficMap.value.lushu._opts.speed = speedValue.value
  }
}

const onProcessChange = (value) => {
  if (trafficMap.value && trafficMap.value.lushu) {
    if (!isGo.value) {
      processValue.value = trafficMap.value.lushu.i
    } else {
      trafficMap.value.lushu.i = value
    }
    if (value === maxProcess.value) {
      pauseLushu()
    }
  }
}

const openFilter = (flag) => {
  isShowFilter.value = flag
}

const handlePointCheckAllChange = (val) => {
  checkList.value = val ? [0, 5, 9, 2] : []
  pointIsIndeterminate.value = false
  checkboxChange(checkList.value)
}

const checkboxChange = (val) => {
  pointCheckAll.value = val.length === 4
  pointIsIndeterminate.value = val.length > 0 && val.length < 4
  let labelMarkersVal = labelMarkers.value.filter(item => val.includes(item.eventType))
  let stopMarkersVal = val.includes(0) ? stopMarkers.value : []
  drawLabel(labelMarkersVal, stopMarkersVal)
}

const handlePathCheckAllChange = (val) => {
  checkPathList.value = val ? [1, 2, 3, 4] : []
  pathIsIndeterminate.value = false
  pathCheckboxChange(checkPathList.value)
}

const pathCheckboxChange = (val) => {
  pathCheckAll.value = val.length === 4
  pathIsIndeterminate.value = val.length > 0 && val.length < 4
  if (allPathData.value.length >= 2) {
    pathData.value = allPathData.value.map(item => {
        if (item.isOverSpeed) return { ...item, _type: 4 }
        else if (item.isHolidayPoint) return { ...item, _type: 3 }
        else if (item.isEmergencyPoint) return { ...item, _type: 2 }
        else if (item.isOfficialPoint) return { ...item, _type: 1 }
        else return { ...item, _type: 0 }
    })
    
    pathData.value.forEach(item => {
      if (!val.includes(item._type)) {
        item.disabled = true
      } else {
        item.disabled = false
      }
    })
    
    trafficMap.value.clearBothMarkers()
    if(pathData.value.length >= 2){
      trafficMap.value.drawStartEndMarkers({
        markers: pathData.value,
        trailStartUrl: trailStartUrl,
        trailEndUrl: trailEndUrl,
        clickFn: (point) => {
          console.log(9999,locationName);
          
          locationName(point.lat, point.lng).then((res) => {
            console.log(666);
            
            const infoContent = `<div class="addressBox">${res}</div>`
            trafficMap.value.openInfoBox(point, infoContent)
          }).catch(() => {
            console.log(655555);
            
          })
        },
        lngName: 'lngBaidu',
        latName: 'latBaidu',
      })
    }
    drawPathLushu(pathData.value)
    stopLushu()
  } else {
    trafficMap.value.clearLushu()
  }
}

const locationName = (lat, lng) => {
  return new Promise((resolve, reject) => {
    let location_name = ""
    let new_point = new BMap.Point(lng, lat)
    let gc = new BMap.Geocoder()
    console.log(new_point);
    
    gc.getLocation(new_point, (rs) => {
      let addComp = rs.addressComponents,
        province = addComp.province,
        city = addComp.city,
        district = addComp.district,
        street = addComp.street,
        streetNumber = addComp.streetNumber ? addComp.streetNumber + "号" : ""
      location_name = province + city + district + street + streetNumber
      console.log(44, location_name);
      
      resolve(location_name)
    })
  })
}

const IsTimeInRange = (targetTimeStr, startTimeStr, endTimeStr) => {
  const targetStamp = new Date(targetTimeStr).getTime()
  const startStamp = new Date(startTimeStr).getTime()
  const endStamp = new Date(endTimeStr).getTime()
  return targetStamp >= startStamp && targetStamp <= endStamp
}

const getWarnColor = (data) => {
  if (data.warnType == 12) {
    return '#FF9933'
  } else {
    return '#FF3363'
  }
}

const getPolylineColor = (data) => {
  let colorMaps = [
    ['#0062FF', '#773ba7', '#FF9933', '#FF3363', '#15CF8B'],
    ['#B2D0FF', '#B9E6DE', '#FFD1C3', '#FFB2CC'],
  ]
  let [primaryColors, secondaryColors] = colorMaps
  if(data.disabled){
    let color = primaryColors[4]
    return {color, type: 'noOrder'}
  } else if (data.isOverSpeed) {
    let color = primaryColors[3]
    return {color, type: 'warn'}
  } else if (data.isHolidayPoint) {
    let color = primaryColors[2]
    return {color, type: 'warn'}
  } else if (data.isEmergencyPoint) {
    let color = primaryColors[1]
    return {color, type: 'order'}
  } else if (data.isOfficialPoint) {
    let color = primaryColors[0]
    return {color, type: 'order'}
  } else {
    let color = primaryColors[4]
    return {color, type: 'noOrder'}
  }
}

// 生命周期
onMounted(() => {
  nextTick(async() => {
    initMap()
    if (trafficMap.value && trafficMap.value.map) {
      trafficMap.value.map.addEventListener("moveend", function() {
        console.log(888888)
      })
    }
  })
})

onBeforeUnmount(() => {
  if (trafficMap.value && typeof trafficMap.value.destroy === 'function') {
    trafficMap.value.destroy()
  }
})


defineExpose({
  getTrack,
});
</script>

<style lang="scss" scoped>
.TrafficRouteMap {
  height: 100%;
  
  .actionBox{
    position: absolute;
    left: 16px;
    bottom: 18px;
    display: flex;
  }
  
  .part{
    position: relative;
    display: flex;
    align-items: center;
    height: 34px;
    background: rgba(255,255,255,0.9);
    padding: 2px 12px;
    border-radius: 5px;
    box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.3);
    margin-right: 16px;
  }
  
  .filterBox{
    position: absolute;
    bottom: 130%;
    width: 690px;
    left: 0px;
    padding: 24px 20px;
    border-radius: 5px;
    background: rgba(255,255,255,0.9);
    box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.3);
    
    .filter_li{
      display: flex;
      padding-bottom: 15px;
      
      &:last-child{
        padding-bottom: 0;
      }
      
      .label{
        display: flex;
        align-items: center;
        width: 70px;
        font-size: 12px;
        color: #333;
        font-weight: 400;
        flex-shrink: 0;
      }
      
      .value{
        display: flex;
        flex: 1;
        width: 0;
      }
      
      .colorInfo{
        display: flex;
        align-items: center;
        font-size: 12px;
        margin-right: 24px;
        color: #9A9A9A;
        
        span{
          display: inline-block;
          width: 16px;
          height: 6px;
          border-radius: 3px;
          margin-right: 6px;
        }
      }
      
      .tip{
        display: flex;
        align-items: center;
        font-weight: 400;
        font-size: 12px;
        color: #9A9A9A;
        
        img{
          display: inline-block;
          width: 16px;
          height: 16px;
          margin-right: 5px;
        }
      }
    }
  }
  
  .controls_img{
    display: inline-block;
    width: 20px;
    height: 20px;
    
    &:hover{
      cursor: pointer;
    }
  }
  
  .controls {
    .controls_img_box{
        display: flex;
        align-items: center;
    }
    .slider {
      display: flex;
      align-items: center;
      width: 200px;
      padding: 0 15px;
    }
    
    .speed{
      border-radius: 4px;
      border: 1px solid #2854C8;
      margin-left: 15px;
      
      &:hover{
        cursor: pointer;
      }
      
      span{
        font-size: 12px;
        color: #2854C8;
        line-height: 18px;
        padding: 0 8px;
      }
    }
  }
  
  .distance_box{
    font-weight: 400;
    font-size: 12px;
    color: #333;
  }
}
</style>

<style lang="scss">
.TrafficRouteMap {
  .el-checkbox{
    width: 85px;
  }
  .el-slider__button{
    width: 12px!important;
    height: 12px!important;
  }
  #allmap{
      width: 100%;
      // height: calc(100vh - 60px);
  }
  .card-container{
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      background-color: #F0F2F5;
      .infobox-container{
        width: 330px;
        margin-bottom: 10px;
        box-shadow: none;
        border-bottom: 1px solid #EBEEF5;
        &:last-child{
          margin-bottom: 0;
        }
      }
      .card-header{
        display: flex;
        align-items: center;
        padding: 5px 10px;
        border-bottom: 1px solid #EBEEF5;
        justify-content: end;
        background-color: #fff;
        .close_infoWindow{
            display: inline-block;
            cursor: pointer;
            width: 20px;
            height: 20px;
            background: #ccc;
        }
      }
      .card-list{
        max-height: 350px;
        overflow-y: auto;
        padding: 10px;
      }
  }
  // 自定义信息窗口样式
  .infobox-container {
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      padding: 10px 16px 15px 16px;
      width: 350px;
      background-color: #fff;
      .infobox-header{
        display: flex;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 1px solid #EBEEF5;
        justify-content: end;
        .close_infoWindow{
            display: inline-block;
            cursor: pointer;
            width: 20px;
            height: 20px;
            background: #ccc;
        }
      }
      .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #EBEEF5;
          .title{
              display: flex;
              align-items: center;
          }
          .tag{
              border-radius: 5px;
              font-size: 10px;
              color: #fff;
              padding: 5px 6px;
              margin-right: 10px;
          }
          .time{
              font-size: 12px;
              color: #9A9A9A;
          }
          .close_infoWindow{
            display: inline-block;
            cursor: pointer;
            width: 20px;
            height: 20px;
            background: #ccc;
          }
      }
      .content{
        .car-order-content {
            margin: 12px 0 16px 0;
            img {
                width: 16px;
                vertical-align: text-bottom;
            }
            div {
                width: 49%;
                display: inline-block;
                height: 18px;
                font-weight: 400;
                font-size: 12px;
                color: #333333;
                line-height: 18px;
            }
        }
        .car-order-timeline {
          margin-left: 3px;
          margin-bottom: 16px;
          .timeline_li{
            display: flex;
            align-items: center;
            font-size: 12px;
            color: #333333;
          }
          .timeline_line{
            height: 16px;
            border-left: 1px dashed #979797;
            margin-left: 4px;
          }
          img{
              width: 10px;
              margin-right: 5px;
          }
        }
        .car-order-total {
            display: flex;
            justify-content: center;
            margin: 10px 0;
            .car-order-total-item {
                flex: 1;
                text-align: center;
                display: inline-block;
                .car-order-total-item-num-box{
                  display: flex;
                  align-items: baseline;
                  justify-content: center;
                }
                .car-order-total-item-num {
                    margin: 0 4px 2px 0;
                    font-weight: bold;
                    font-size: 20px;
                    color: #9A9A9A;
                    line-height: 27px;
                }
                .car-order-total-item-unit {
                    font-weight: 500;
                    font-size: 12px;
                    color: #9A9A9A;
                    line-height: 18px;
                }
                .car-order-total-item-title {
                    font-weight: 400;
                    font-size: 12px;
                    color: #9A9A9A;
                    line-height: 18px;
                    font-style: normal;
                }
            }
        }
        .car-danger-content {
              margin: 12px 0 16px 0;
              .car-danger-content-title {
                  display: inline-block;
                  width: 52px;
                  font-weight: 400;
                  font-size: 12px;
                  color: #9A9A9A;
                  line-height: 18px;
                  text-align: left;
                  font-style: normal;
              }
              .car-danger-content-name {
                  font-weight: 400;
                  font-size: 12px;
                  color: #333333;
                  line-height: 18px;
                  text-align: left;
                  font-style: normal;
              }
          }
        .content_li{
            display: flex;
            align-items: center;
            font-size: 12px;
            margin-top: 16px;
            .label{
              width: 70px;
              color: #9a9a9a;
            }
           .value{
              flex: 1;
              color: #333333;
            }
        }
      }
  }
  .addressBox{
      width: 150px;
      font-size: 12px;
      color: #333333;
      padding: 8px 10px;
      background-color: #fff;
      border-radius: 5px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3)
  }
  // 自定义标注点样式
  .close_infoWindow{
      background: url("../../../../assets/images/close_bg.png") no-repeat center center !important;
      background-size: 90% 90% !important;
  }
  // 自定义信息窗口样式
  .labelBox{
    .text{
      padding: 20px 25px 24px 60px;
      font-size: 12px;
      font-weight: 500;
    }
    &:hover{
      cursor: pointer;
    }
  }

  .speed-box{
    display: flex;
    border-radius: 8px;
    padding: 6px;
    background-color: #fff;
    div:first-child{
      height: 18px;
      padding-right: 15px;
      margin-right: 15px;
      border-right: 1px solid #D9D9D9;
    }
    div:last-child{
      display: flex;
      align-items: center;
      font-size: 12px;
    }
    span{
      display: inline-flex;
      align-items: center;
      height: 100%;
      font-size: 18px;
      font-weight: bold;
    }
  }

  /* 隐藏所有装饰性元素 */
  .BMap_pop.TrafficRouteMap_infoWindow > div:nth-child(1),  /* 左上角 */
  .BMap_pop.TrafficRouteMap_infoWindow > div:nth-child(2),  /* 顶部边框 */
  .BMap_pop.TrafficRouteMap_infoWindow > div:nth-child(3),  /* 右上角 */
  .BMap_pop.TrafficRouteMap_infoWindow > div:nth-child(4),  /* 右侧边框 */
  .BMap_pop.TrafficRouteMap_infoWindow > div:nth-child(5),  /* 底部边框 */
  .BMap_pop.TrafficRouteMap_infoWindow > div:nth-child(6),  /* 左下角 */
  .BMap_pop.TrafficRouteMap_infoWindow > div:nth-child(7),
  .BMap_pop.TrafficRouteMap_infoWindow > div:nth-child(8) { /* 箭头容器 */
      display: none !important;
  }
  .BMap_pop.TrafficRouteMap_infoWindow > div:nth-child(9) {
      padding: 15px !important;
      width: auto!important;
      height: auto!important;
  }
  .TrafficRouteMap_infoWindow img[src*="iw_close"] {
      display: none !important;
  }
  /* 禁用按钮点击事件（防止残留区域响应） */
  .TrafficRouteMap_infoWindow .BMap_close {
      pointer-events: none !important;
  }

  //label上层div的层级
  div:has(> .BMapLabel) {
    z-index: 800 !important;
  }
  //infowindow上层div的层级
  div:has(> .TrafficRouteMap_infoWindow) {
    z-index: 801 !important;
  }
  .el-checkbox__input.is-checked+.el-checkbox__label {
      color: #3766F7;
  }
  .el-checkbox__input.is-checked .el-checkbox__inner, .el-checkbox__input.is-indeterminate .el-checkbox__inner {
      background-color: #3766F7;
      border-color: #3766F7;
  }
  .el-checkbox__inner::after {
    left: 5px !important;
    top: 3px !important;
    height: 6px !important;
  }
  .el-checkbox__inner {
    width: 16px !important;
    height: 16px !important;
    border-color: #3766F7;
  }
  .el-checkbox__inner:hover {
      border-color: #3766F7;
  }
  .el-checkbox {
    color: #3766F7;
  }
  .el-checkbox:last-of-type {
    margin-right: 30px;
  }
  .el-checkbox-group{
    align-items: center !important;
  }
}
</style>