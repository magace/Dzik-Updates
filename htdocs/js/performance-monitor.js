/**
 * AJAX PERFORMANCE DEBUGGER
 * Add this to track exactly what's slow
 * Replace your performance-monitor-v3.js temporarily with this enhanced version
 */

(function() {
    'use strict';
    
    var PerformanceMonitor = {
        startTime: performance.now(),
        metrics: {},
        ajaxLog: [],
        
        init: function() {
            this.trackPageLoad();
            this.trackAjaxCalls();
            this.trackTableRender();
            this.createMonitorUI();
            this.trackMemoryUsage();
        },
        
        trackPageLoad: function() {
            var self = this;
            window.addEventListener('load', function() {
                var loadTime = performance.now() - self.startTime;
                self.metrics.pageLoad = loadTime;
                
                if (performance.timing) {
                    var perfData = performance.timing;
                    self.metrics.domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart;
                    self.metrics.fullLoad = perfData.loadEventEnd - perfData.navigationStart;
                }
                
                self.updateDisplay();
            });
        },
        
        trackAjaxCalls: function() {
            var self = this;
            
            if (typeof jQuery !== 'undefined') {
                var ajaxCount = 0;
                var ajaxTimes = [];
                
                $(document).ajaxSend(function(event, xhr, settings) {
                    xhr._ajaxStartTime = performance.now();
                    xhr._ajaxUrl = settings.url;
                    xhr._ajaxData = settings.data;
                });
                
                $(document).ajaxComplete(function(event, xhr, settings) {
                    if (xhr._ajaxStartTime) {
                        var duration = performance.now() - xhr._ajaxStartTime;
                        ajaxCount++;
                        ajaxTimes.push(duration);
                        
                        // Store detailed log
                        var logEntry = {
                            url: xhr._ajaxUrl,
                            duration: duration,
                            timestamp: new Date().toLocaleTimeString(),
                            data: xhr._ajaxData
                        };
                        
                        self.ajaxLog.push(logEntry);
                        
                        // Keep only last 20 entries
                        if (self.ajaxLog.length > 20) {
                            self.ajaxLog.shift();
                        }
                        
                        self.metrics.ajaxCount = ajaxCount;
                        self.metrics.lastAjax = duration;
                        self.metrics.avgAjax = ajaxTimes.reduce((a, b) => a + b, 0) / ajaxTimes.length;
                        self.metrics.slowestAjax = Math.max(...ajaxTimes);
                        
                        self.updateDisplay();
                        self.logAjaxCall(xhr._ajaxUrl, duration, xhr._ajaxData);
                    }
                });
            }
        },
        
        trackTableRender: function() {
            var self = this;
            
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && mutation.target.id === 'items-body') {
                        var renderStart = performance.now();
                        requestAnimationFrame(function() {
                            var renderTime = performance.now() - renderStart;
                            self.metrics.lastRender = renderTime;
                            self.metrics.rowCount = document.querySelectorAll('#items-body tr').length;
                            self.updateDisplay();
                        });
                    }
                });
            });
            
            var tableBody = document.getElementById('items-body');
            if (tableBody) {
                observer.observe(tableBody, { childList: true });
            }
        },
        
        trackMemoryUsage: function() {
            var self = this;
            
            if (performance.memory) {
                setInterval(function() {
                    self.metrics.memoryUsed = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
                    self.metrics.memoryTotal = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
                    self.updateDisplay();
                }, 2000);
            }
        },
        
        createMonitorUI: function() {
            var html = `
                <div id="perf-monitor" style="
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.95);
                    color: #0f0;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    padding: 10px;
                    border-radius: 5px;
                    z-index: 99999;
                    min-width: 350px;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    line-height: 1.4;
                    user-select: text;
                ">
                    <div id="perf-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                        border-bottom: 1px solid #0f0;
                        padding-bottom: 5px;
                        cursor: move;
                        user-select: none;
                    ">
                        <strong style="color: #0ff;">⚡ PERFORMANCE DEBUGGER</strong>
                        <div>
                            <button id="perf-details" style="
                                background: none;
                                border: 1px solid #ff0;
                                color: #ff0;
                                cursor: pointer;
                                padding: 2px 6px;
                                margin-right: 5px;
                                font-size: 10px;
                            " title="Show detailed log">📋 DETAILS</button>
                            <button id="perf-close" style="
                                background: none;
                                border: 1px solid #f00;
                                color: #f00;
                                cursor: pointer;
                                padding: 2px 6px;
                                font-size: 10px;
                            ">×</button>
                        </div>
                    </div>
                    <div id="perf-content" style="user-select: text;">
                        <div id="perf-data"></div>
                        <div id="perf-log" style="
                            margin-top: 10px;
                            padding-top: 10px;
                            border-top: 1px solid #333;
                            display: none;
                        ">
                            <div style="color: #ff0; font-weight: bold; margin-bottom: 5px;">Recent AJAX Calls:</div>
                            <div id="perf-log-entries" style="
                                max-height: 300px;
                                overflow-y: auto;
                                font-size: 10px;
                            "></div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', html);
            
            var monitor = document.getElementById('perf-monitor');
            var content = document.getElementById('perf-content');
            var header = document.getElementById('perf-header');
            var closeBtn = document.getElementById('perf-close');
            var detailsBtn = document.getElementById('perf-details');
            var logDiv = document.getElementById('perf-log');
            
            var self = this;
            
            detailsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (logDiv.style.display === 'none') {
                    logDiv.style.display = 'block';
                    detailsBtn.textContent = '📋 HIDE';
                    self.updateLogDisplay();
                } else {
                    logDiv.style.display = 'none';
                    detailsBtn.textContent = '📋 DETAILS';
                }
            });
            
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                monitor.style.display = 'none';
            });
            
            this.makeDraggable(monitor, header);
        },
        
        updateLogDisplay: function() {
            var logEntries = document.getElementById('perf-log-entries');
            if (!logEntries) return;
            
            var html = '';
            
            // Sort by duration (slowest first)
            var sorted = this.ajaxLog.slice().sort((a, b) => b.duration - a.duration);
            
            sorted.forEach(function(entry) {
                var color = entry.duration < 500 ? '#0f0' : (entry.duration < 2000 ? '#ff0' : '#f00');
                var isSlow = entry.duration > 5000;
                
                html += `
                    <div style="
                        margin: 5px 0;
                        padding: 5px;
                        background: ${isSlow ? 'rgba(255,0,0,0.2)' : 'rgba(0,0,0,0.3)'};
                        border-left: 3px solid ${color};
                    ">
                        <div style="color: ${color}; font-weight: bold;">
                            ${entry.duration.toFixed(0)}ms - ${entry.url}
                        </div>
                        <div style="color: #888; font-size: 9px;">
                            ${entry.timestamp}
                        </div>
                `;
                
                if (entry.data) {
                    var dataStr = typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data);
                    if (dataStr.length > 100) dataStr = dataStr.substring(0, 100) + '...';
                    html += `<div style="color: #666; font-size: 9px; margin-top: 2px;">Data: ${dataStr}</div>`;
                }
                
                if (isSlow) {
                    html += `<div style="color: #f00; font-weight: bold; margin-top: 3px;">🔴 VERY SLOW!</div>`;
                }
                
                html += `</div>`;
            });
            
            if (html === '') {
                html = '<div style="color: #888;">No AJAX calls logged yet...</div>';
            }
            
            logEntries.innerHTML = html;
        },
        
        updateDisplay: function() {
            var dataDiv = document.getElementById('perf-data');
            if (!dataDiv) return;
            
            var m = this.metrics;
            var html = '';
            
            if (m.domReady) {
                html += this.formatMetric('DOM Ready', m.domReady, 'ms', 1000, 3000);
            }
            
            if (m.ajaxCount) {
                html += '<div style="margin-top: 6px; color: #0ff; user-select: none;">── AJAX ──</div>';
                html += this.formatMetric('Total Calls', m.ajaxCount, '', 10, 50);
                html += this.formatMetric('Last Call', m.lastAjax, 'ms', 500, 2000);
                html += this.formatMetric('Average', m.avgAjax, 'ms', 500, 2000);
                html += this.formatMetric('Slowest', m.slowestAjax, 'ms', 5000, 10000);
                
                if (m.slowestAjax > 5000) {
                    html += '<div style="color: #f00; margin-top: 5px; font-weight: bold;">⚠️ SLOW CALL DETECTED!</div>';
                    html += '<div style="color: #ff0; font-size: 10px;">Click DETAILS button to see what\'s slow</div>';
                }
            }
            
            if (m.rowCount !== undefined) {
                html += '<div style="margin-top: 6px; color: #0ff; user-select: none;">── RENDER ──</div>';
                html += this.formatMetric('Rows Shown', m.rowCount, '', 50, 200);
                if (m.lastRender) {
                    html += this.formatMetric('Render Time', m.lastRender, 'ms', 100, 500);
                }
            }
            
            if (m.memoryUsed) {
                html += '<div style="margin-top: 6px; color: #0ff; user-select: none;">── MEMORY ──</div>';
                html += this.formatMetric('Used', m.memoryUsed, 'MB', 50, 100);
            }
            
            dataDiv.innerHTML = html;
        },
        
        formatMetric: function(label, value, unit, warningThreshold, dangerThreshold) {
            var color = '#0f0';
            var numValue = parseFloat(value);
            
            if (numValue > dangerThreshold) {
                color = '#f00';
            } else if (numValue > warningThreshold) {
                color = '#ff0';
            }
            
            var displayValue = typeof value === 'number' ? value.toFixed(0) : value;
            
            return `
                <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                    <span style="color: #888;">${label}:</span>
                    <span style="color: ${color}; font-weight: bold;">${displayValue}${unit}</span>
                </div>
            `;
        },
        
        logAjaxCall: function(url, duration, data) {
            var color = duration < 500 ? '#0f0' : (duration < 2000 ? '#ff0' : '#f00');
            
            var dataStr = '';
            if (data) {
                if (typeof data === 'string') {
                    dataStr = data.length > 50 ? data.substring(0, 50) + '...' : data;
                } else if (typeof data === 'object') {
                    dataStr = JSON.stringify(data).substring(0, 50) + '...';
                }
            }
            
            console.log(
                '%c⚡ AJAX %c' + url + '%c ' + duration.toFixed(0) + 'ms' + (dataStr ? ' %c' + dataStr : ''),
                'color: #0ff; font-weight: bold;',
                'color: #888;',
                'color: ' + color + '; font-weight: bold;',
                'color: #666;'
            );
            
            if (duration > 5000) {
                console.warn('🔴 VERY SLOW AJAX CALL:', {
                    url: url,
                    duration: duration + 'ms',
                    data: data
                });
            }
        },
        
        makeDraggable: function(element, handle) {
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            handle.onmousedown = dragMouseDown;
            
            function dragMouseDown(e) {
                e = e || window.event;
                if (e.target.tagName === 'BUTTON') return;
                
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }
            
            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                element.style.bottom = 'auto';
                element.style.right = 'auto';
                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
            }
            
            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            PerformanceMonitor.init();
        });
    } else {
        PerformanceMonitor.init();
    }
    
    window.PerformanceMonitor = PerformanceMonitor;
    
    console.log('%c🔍 Performance DEBUGGER Loaded', 'color: #ff0; font-size: 14px; font-weight: bold;');
})();