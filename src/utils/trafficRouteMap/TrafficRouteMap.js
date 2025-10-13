import "./lushu.js";
export class TrafficRouteMap {
    /**
     * 交通路线地图管理器
     * @param {string} containerId - 地图容器ID
     * @param {Object} options - 配置选项
     * @param {BMap.Point} options.centerPoint - 地图中心点坐标
     * @param {number} options.zoomLevel - 初始缩放级别
     * @param {string} options.carIconUrl - 路书车辆图标路径
     * @param {string} options.markerIconUrl - 标注点图标路径
     */
    constructor(containerId, options = {}) {
        // 地图实例
        this.map = new BMap.Map(containerId, {
            minZoom: 5,
            maxZoom: 20,
        });
        // 配置参数
        this.options = Object.assign({
            centerPoint: new BMap.Point(116.404, 39.915),
            zoomLevel: 12,
            labelMap: [],
        }, options);

        this.polylines = []; // 用于存储当前绘制的所有折线对象
        this.lushu = null; // 路书实例
        this.labelInstances = []; // 存储所有label标签实例
        this.markers = []; // 存储所有marker点
        this.pois = []; // 存储路径点
        this.infoWindow = null; // 信息窗口实例
        this.markerClusterer = null; // 聚合点实例

        // 初始化地图
        this._initMap();
    }

    // ==================== 私有方法 ====================
    _initMap() {
        this.map.enableScrollWheelZoom();
        this.map.centerAndZoom(this.options.centerPoint, this.options.zoomLevel);
        this.map.addEventListener('click', (e) => {
            // 检查点击目标是否属于label或infoWindow
            if (!this.isLabelOrInfoWindow(e.domEvent.target)) {
                this.resetLabelsStyle();
            }
        });
    }
    // 检查点击目标是否属于label或infoWindow
    isLabelOrInfoWindow(target) {
        // 检查是否为label元素（包含.map-label类）
        if (target.closest('.labelBox')) return true;
        // 检查是否为infoWindow元素（包含.BMap_pop类）
        if (target.closest('.infobox-container')) return true;
        return false;
      }
    // ==================== 路径管理 ====================

    /**
     * 绘制分段颜色路径
     * @param {Array} pathData - 路径数据数组
     * @param {Function} clickFn - 点击事件回调函数
     * @param {Function} getColor - 颜色获取函数
     * @param {string} lngName - 经度字段名
     * @param {string} latName - 纬度字段名
     */
    drawPath(options = {}) {
        const { pathData, clickFn, getColor, lngName = 'longitude', latName = 'latitude' } = options;
        if (!pathData.length) return this.clearPaths();
        // 2. 动态获取颜色（优先级：超速 > 订单点 > 疲劳点 > 默认）
        //辅助函数：查找最近数据点
        const findNearestDataPoint = (clickedPoint, segmentPoints) => {
            let minDistance = Infinity;
            let nearestPoint = null;
            segmentPoints.forEach(p => {
                const distance = this.map.getDistance(clickedPoint, p.point);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPoint = p;
                }
            });
            return nearestPoint;
        };
        // 3. 转换数据结构
        const points = pathData.map(item => ({
            point: new BMap.Point(item[lngName], item[latName]),
            color: getColor ? getColor(item).color : '',
            rawData: {...item, ...getColor(item)}, // 保留原始数据
        }));
        // 4. 颜色分段算法（核心：强制包含下一段的起点）
        const segments = [];
        let segmentStart = 0;
        for (let i = 1; i <= points.length; i++) {
            // 检测颜色变化或到达终点
            if (i === points.length || points[i].color !== points[i - 1].color) {
                segments.push({
                    points: points.slice(segmentStart, i),
                    color: points[segmentStart].color,
                });
                segmentStart = i;
            }
        }
        // 5. 清除旧路径
        this.clearPaths();
        // 6. 绘制分段路径（解决断开问题的关键）
        this.pois = [];
        segments.forEach((segment, segmentIndex) => {
            let segmentPoints = segment.points.map(p => p.point);
            this.pois.push(...segmentPoints);
            // 强制包含下一段的第一个点（确保连接）
            if (segmentIndex < segments.length - 1) {
                const nextFirstPoint = segments[segmentIndex + 1].points[0].point;
                segmentPoints.push(nextFirstPoint);
            }
            // 仅当分段点数≥2时绘制（避免单点）
            if (segmentPoints.length >= 2) {
                const polyline = new BMap.Polyline(segmentPoints, {
                    strokeColor: segment.color,
                    strokeWeight: 10,
                    strokeOpacity: 1,
                    enableClicking: true,
                });
                // 7. 事件绑定：智能匹配最近原始数据点
                polyline.addEventListener('click', (e) => {
                    // 智能获取最近数据点
                    const clickedPoint = findNearestDataPoint(e.point, segment.points);
                    clickFn && clickFn(e.point, clickedPoint.rawData);
                });
                this.map.addOverlay(polyline);
                this.polylines.push(polyline);
            }
        });
        // 8. 调整地图视野
        if (this.pois.length > 0) {
            this.map.setViewport(this.pois, {
                enableAnimation: true,
                margins: [30, 30, 30, 30], // 边界留白
            });
        }
    }
    clearPaths() {
        this.polylines.forEach(polyline => {
            this.map.removeOverlay(polyline);
        });
        this.polylines = [];
    }
    // ==================== 路书管理 ====================
    /**
     * 初始化路书轨迹
     * @param {Object} options - 路书配置
     * @param {Object} extraOptions - 额外配置
     */
    initLushu(options = {}, extraOptions = {}) {
        this.lushu && this.clearLushu();
        const defaultOptions = {
            defaultContent: "",
            icon: new BMap.Icon(
                options.carIconUrl,
                new BMap.Size(48, 48),
                { imageSize: new BMap.Size(48, 48) }
            ),
            autoView: false,
            speed: 5000,
            enableRotation: true,
            landmarkPois: [],
        };

        this.lushu = new BMapLib.LuShu(
            this.map,
            this.pois,
            Object.assign(defaultOptions, options)
        );
        // 重写路书移动方法（添加进度条支持）
        if (this.lushu) {
            const originalMove = BMapLib.LuShu.prototype._move;
            const sliderFn = extraOptions.sliderFn || null;
            const onEndFn = extraOptions.onEnd || null;
            const getContentFn = extraOptions.getContent || null;
            BMapLib.LuShu.prototype._move = function(initPos, targetPos, effect) {
                // 进度条更新逻辑
                sliderFn && typeof sliderFn === 'function' && sliderFn(this.i);
                originalMove.call(this, initPos, targetPos, effect);
            };
            const originalMoveNext = BMapLib.LuShu.prototype._moveNext;
            // 2. 重写原型链方法
            BMapLib.LuShu.prototype._moveNext = function(index) {
                // 调用原始方法（保留核心移动逻辑）
                originalMoveNext.call(this, index);
                // 判断是否为最后一个路径点（动画结束）
                if (index >= this._path.length - 1) {
                    // 触发自定义结束回调
                    onEndFn && typeof onEndFn === 'function' && onEndFn();
                }
            };
            BMapLib.LuShu.prototype._addMarker = function(callback) {
                var me = this;
                if (me._marker) {
                    me.stop();
                    me._map.removeOverlay(me._marker);
                    clearTimeout(me._timeoutFlag);
                }
                //移除之前的overlay
                me._overlay && me._map.removeOverlay(me._overlay);
                var marker = new BMap.Marker(me._path[0]);
                me._opts.icon && marker.setIcon(me._opts.icon);
                me._map.addOverlay(marker);
                // marker.setAnimation(BMAP_ANIMATION_DROP); 删除动画代码：注释或跳过原动画设置
                me._marker = marker;
            };
            BMapLib.LuShu.prototype._setInfoWin = function(pos) {
                //设置上方overlay的position
                var me = this;
                if (!me._overlay) {
                    return;
                }
                me._overlay.setPosition(pos, me._marker.getIcon().size);
                var index = me._troughPointIndex(pos);
                if (index != -1) {
                    clearInterval(me._intervalFlag);
                    me._overlay.setHtml(me._opts.landmarkPois[index].html);
                    me._overlay.setPosition(pos, me._marker.getIcon().size);
                    me._pauseForView(index);
                } else {
                    let content = getContentFn && typeof getContentFn === 'function' ? getContentFn(me.i) : options.defaultContent;
                    me._overlay.setHtml(content);
                }
            };
            //修复快速点击出现小车进度条抽搐问题
            BMapLib.LuShu.prototype.start = function() {
                // 操作锁：防止快速点击导致的并发问题
                if (this.isOperating) return;
                this.isOperating = true;
                var me = this;
                var len = me._path.length;
                // 边界检查：若索引越界则停止
                if (me.i >= len || me.i < 0) {
                    me.stop();
                    this.isOperating = false;
                    return;
                }
                // 情况1：非首次启动且未到终点（暂停后恢复）
                if (me.i > 0 && me.i < len - 1) {
                    if (!me._fromPause) {
                        this.isOperating = false;
                        return; // 非暂停状态不处理重复点击
                    }
                    // 修复：从当前索引继续移动，而非强制递增索引
                    me._moveNext(me.i);
                } 
                // 情况2：首次启动或停止后重启
                else {
                    me._addMarker();
                    me._timeoutFlag = setTimeout(function() {
                        me._addInfoWin();
                        if (me._opts.defaultContent === "") {
                            me.hideInfoWindow();
                        }
                        me._moveNext(me.i); // 从起点开始移动
                    }, 400);
                }
                // 重置状态标志
                me._fromPause = false;
                me._fromStop = false;
                // 操作完成后解锁（延时防止瞬时重复点击）
                setTimeout(() => { this.isOperating = false; }, 100);
            };
            BMapLib.LuShu.prototype.pause = function() {
                clearInterval(this._intervalFlag);
                //标识是否是按过pause按钮
                this._fromPause = true;
                this._clearTimeout();
            };
            BMapLib.LuShu.prototype.stop = function() {
                // 移除标记和信息窗口
                this._marker && this._map.removeOverlay(this._marker);
                this._overlay && this._map.removeOverlay(this._overlay);
                this.i = 0;
                this._fromStop = true;
                clearInterval(this._intervalFlag);
                this._clearTimeout();
                //重置landmark里边的poi为未显示状态
                for (var i = 0, t = this._opts.landmarkPois, len = t.length; i < len; i++) {
                    t[i].bShow = false;
                }
            };
            BMapLib.LuShu.prototype._clearTimeout = function() {
                clearTimeout(this._timeoutFlag);
                clearInterval(this._intervalFlag);
                this._timeoutFlag = null;
                this._intervalFlag = null;
            };
        }
    }
    // 路书控制方法
    startLushu() { this.lushu && this.lushu.start(); }
    pauseLushu() { this.lushu && this.lushu.pause(); }
    resumeLushu() { this.lushu && this.lushu.start(); }
    stopLushu() { this.lushu && this.lushu.stop(); }
    setLushuSpeed(speed) {
        if (this.lushu) this.lushu._opts.speed = speed;
    }
    // 清除路书
    clearLushu() {
        this.stopLushu();
        // 销毁旧路书实例
        this.map.removeOverlay(this.lushu);
        this.lushu = null;
    }
    // ==================== marker管理 ====================
    // 绘制起点和终点
    drawStartEndMarkers(options = {}) {
        const { markers, clickFn, lngName, latName, iconSize = [36, 36], anchorSize = [16, 36] } = options;
        const start = markers[0];
        const end = markers[markers.length - 1];
        const startPoi = new BMap.Point(start[lngName || 'longitude'], start[latName || 'latitude']);
        const endPoi = new BMap.Point(end[lngName || 'longitude'], end[latName || 'latitude']);
        const startIcon = new BMap.Icon(options.trailStartUrl, new BMap.Size(iconSize[0], iconSize[1]), {
            imageSize: new BMap.Size(iconSize[0], iconSize[1]), // 引用图片实际大小
            anchor: new BMap.Size(anchorSize[0], anchorSize[1]),
        });
        const endIcon = new BMap.Icon(options.trailEndUrl, new BMap.Size(iconSize[0], iconSize[1]), {
            imageSize: new BMap.Size(iconSize[0], iconSize[1]), // 引用图片实际大小
            anchor: new BMap.Size(anchorSize[0], anchorSize[1]),
        });
        const startMarker = new BMap.Marker(startPoi, {
            icon: startIcon,
        });
        const endMarker = new BMap.Marker(endPoi, {
            icon: endIcon,
        });
        //
        this.clearBothMarkers();
        this.startMarker = startMarker;
        this.endMarker = endMarker;

        startMarker.setTop(true);
        endMarker.setTop(true);
        startMarker.addEventListener("click", (e) => {
            clickFn && clickFn(startPoi);
        });
        endMarker.addEventListener("click", (e) => {
            clickFn && clickFn(endPoi);
        });
        this.map.addOverlay(startMarker);
        this.map.addOverlay(endMarker);
    }
    clearBothMarkers() {
        if (this.endMarker) {
            this.map.removeOverlay(this.endMarker);
            this.endMarker = null;
        }
        if (this.startMarker) {
            this.map.removeOverlay(this.startMarker);
            this.startMarker = null;
        }
    }
    // 绘制 marker 点
    drawMarkers(options = {}) {
        const { markers, markerIconUrl, clickFn, centerPoint, zoomLevel, lngName, latName, iconSize = [36, 36], anchorSize = [16, 36], direction = false, isClear = true } = options;
        if (isClear) this.clearAllMarkers();
        let curMarkers = [];
        markers.forEach(data => {
            let lng = data[lngName || 'longitude'];
            let lat = data[latName || 'latitude'];
            const point = new BMap.Point(lng, lat);
            const icon = new BMap.Icon(markerIconUrl, new BMap.Size(iconSize[0], iconSize[1]), {
                imageSize: new BMap.Size(iconSize[0], iconSize[1]), // 引用图片实际大小
                anchor: new BMap.Size(anchorSize[0], anchorSize[1]),
            });
            const marker = new BMap.Marker(point, { icon: icon });
            curMarkers.push(marker);
            marker.addEventListener("click", (e) => {
                clickFn && clickFn(point, data);
              });
            if (direction && (data.direction || data.direction === 0)) { marker.setRotation(data.direction); }
            this.map.addOverlay(marker);
            this.markers.push(marker);
            if (centerPoint) this.map.setCenter(new BMap.Point(centerPoint.lng || 116.404, centerPoint.lat || 39.915));
            if (zoomLevel) this.map.setZoom(zoomLevel || 12);
        });
        return curMarkers;
    }
    // 绘制聚合点
    drawMarkerClusterer(options = {}) {
        const { markers, markerIconUrl, clickFn, centerPoint, zoomLevel, lngName, latName } = options;
        if (!markers || markers.length === 0) return;
        let markersList = [];
        markers.forEach(data => {
            // const { lngBaidu: lng, latBaidu: lat } = data;
            let lng = data[lngName || 'longitude'];
            let lat = data[latName || 'latitude'];
            const point = new BMap.Point(lng, lat);
            const icon = new BMap.Icon(markerIconUrl, new BMap.Size(48, 48), {
                imageSize: new BMap.Size(48, 48), // 引用图片实际大小
                anchor: new BMap.Size(16, 48),
            });
            const marker = new BMap.Marker(point, { icon: icon });
            marker.addEventListener("click", (e) => {
                clickFn && clickFn(data);
            });
            markersList.push(marker);
        });
        //调用API聚合函数将标记数组显示在地图上
        this.markerClusterer = new BMapLib.MarkerClusterer(this.map, {markers: markersList});
        // const { lngBaidu: lng, latBaidu: lat } = markers[0];
        this.map.centerAndZoom(new BMap.Point(centerPoint.lng || 116.404, centerPoint.lat || 39.915), zoomLevel || 2);
    }
    /**
     * 清除所有点位
    */
    clearAllMarkers() {
        this.markers.forEach(marker => this.map.removeOverlay(marker));
        this.markers = [];
    }
    // ==================== label标注管理 ====================
    // 绘制label标注点
    drawLabel(options = {}) {
        const { points, clickFn, lngName, latName } = options;
        // 清除旧 label 避免内存泄漏
        this.clearAllLabels();
        // 筛选需要添加标注的点
        points.forEach(pointData => {
            // const { longitude: lng, latitude: lat } = pointData;
            let lng = pointData[lngName || 'longitude'];
            let lat = pointData[latName || 'latitude'];
            const point = new BMap.Point(lng, lat);
            let labelData = this.options.labelMap.find(item => item.key == pointData.eventType);
            if (!labelData) return;
            // 创建标签
            const customHTML =
            `<div class="labelBox">
                <div class="text">${labelData.labelText}</div>
            </div>`;
            const label = new BMap.Label(labelData.labelText, { position: point });
            label.setStyle({
                border: 'none',
                background: 'none',
                color: '#333',
                transform: 'translateX(-88%) translateY(-95%)',
                backgroundImage: `url(${labelData.labelBg})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right',
            });
            label.setContent(customHTML);
            // 存储原始样式
            label.originalBg = labelData.labelBg;
            label.originalColor = "#333";
            // 绑定点击事件
            label.addEventListener("click", (e) => {
                // 重置所有 label 样式
                this.resetLabelsStyle();
                // 单独设置当前点击 label 高亮
                label.setStyle({
                    backgroundImage: `url(${labelData.labelBgActive})`,
                    color: "#fff",
                });
                // 执行业务回调
                clickFn && clickFn(point, {...pointData, bgColor: labelData.bgColor, labelText: labelData.labelText});
                // this.openInfoBox(point, infoContent);
            });
            // 存储 label 实例
            this.labelInstances.push(label);
            this.map.addOverlay(label);
        });
    }
    /**
     * 重置标签样式
    */
    resetLabelsStyle() {
        // 1. 重置所有 label 到原始样式
        if (!this.labelInstances) return;
        this.labelInstances.forEach(l => {
            l.setStyle({
                backgroundImage: `url(${l.originalBg})`,
                color: l.originalColor,
            });
        });
    }
    // 清除所有 label
    clearAllLabels() {
        this.labelInstances.forEach(label => {
            this.map.removeOverlay(label);
        });
        this.labelInstances = [];
    }
    // ==================== 信息窗口管理 ====================
    /**
     * 打开信息窗口
     * @param {BMap.Point} position - 信息窗口位置
     * @param {string} content - HTML内容
     */
    openInfoBox(position, content, offset) {
        let [offset1, offset2] = offset || [0, 0];
        this.infoWindow = new BMap.InfoWindow(content, {
            offset: new BMap.Size(offset1, offset2),
        });
        this.infoWindow.addEventListener("open", () => {
            const pop = document.querySelector('.BMap_pop:last-child');
            pop && pop.classList.add('TrafficRouteMap_infoWindow');
            const shadowEl = document.querySelector('.BMap_shadow');
            if (shadowEl) shadowEl.style.display = 'none';
            const close = document.querySelector('.close_infoWindow');
            close && close.addEventListener('click', () => {
                this.map && this.map.closeInfoWindow();
                this.resetLabelsStyle();
            });
        });
        this.infoWindow.addEventListener("close", () => {
            const pop = document.querySelector('.BMap_pop:last-child');
            pop && pop.classList.remove('TrafficRouteMap_infoWindow');
        });
        // marker添加点击事件
        let point = new BMap.Point(position.lng, position.lat);
        this.map.openInfoWindow(this.infoWindow, point);
    }
    // ==================== 销毁方法 ====================
    clearOverlays() {
        this.map.clearOverlays();
    }
    destroy() {
        this.clearLushu();
        this.clearPaths();
        this.clearAllMarkers();
        this.clearAllLabels();
        this.map = null;
    }
}
