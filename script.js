let tasks = [];
let draggedTask = null;
let dragStartX = 0;
let dragStartLeft = 0;
let selectedColor = '#667eea,#764ba2'; // 預設顏色
let editingTaskId = null; // 正在編輯的任務ID

// 從 LocalStorage 載入任務資料
function loadTasksFromStorage() {
    try {
        const storedTasks = localStorage.getItem('ganttTasks');
        if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
            tasks = parsedTasks.map(task => ({
                ...task,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate)
            }));
            console.log(`已從瀏覽器載入 ${tasks.length} 個任務`);
        }
    } catch (error) {
        console.error('載入任務資料失敗:', error);
    }
}

// 將任務資料保存到 LocalStorage
function saveTasksToStorage() {
    try {
        const tasksToStore = tasks.map(task => ({
            id: task.id,
            name: task.name,
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
            color: task.color
        }));
        localStorage.setItem('ganttTasks', JSON.stringify(tasksToStore));
        console.log(`已保存 ${tasks.length} 個任務到瀏覽器`);
    } catch (error) {
        console.error('保存任務資料失敗:', error);
    }
}

// 初始化：載入資料
loadTasksFromStorage();

// 初始化今天的日期
document.getElementById('startDate').valueAsDate = new Date();

// 顏色選擇
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedColor = this.dataset.color;
    });
});

// 快速選擇時長
document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const startDate = document.getElementById('startDate').value;
        if (startDate) {
            const days = parseInt(this.dataset.days);
            const start = new Date(startDate);
            const end = new Date(start);
            end.setDate(end.getDate() + days);
            document.getElementById('endDate').valueAsDate = end;
        }
    });
});

// 開始日期變更時，如果有選擇時長，自動更新結束日期
document.getElementById('startDate').addEventListener('change', function() {
    const activeBtn = document.querySelector('.duration-btn.active');
    if (activeBtn) {
        const days = parseInt(activeBtn.dataset.days);
        const start = new Date(this.value);
        const end = new Date(start);
        end.setDate(end.getDate() + days);
        document.getElementById('endDate').valueAsDate = end;
    }
});

function addTask() {
    const name = document.getElementById('taskName').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!name || !startDate || !endDate) {
        alert('請填寫完整的任務資訊');
        return;
    }

    if (new Date(endDate) < new Date(startDate)) {
        alert('結束日期不能早於開始日期');
        return;
    }

    if (editingTaskId !== null) {
        // 編輯模式：更新現有任務
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.name = name;
            task.startDate = new Date(startDate);
            task.endDate = new Date(endDate);
            task.color = selectedColor;
        }
        editingTaskId = null;
        updateButtonState();
    } else {
        // 新增模式：創建新任務
        tasks.push({
            id: Date.now(),
            name,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            color: selectedColor
        });
    }

    // 清空輸入
    clearForm();
    renderGantt();
    saveTasksToStorage(); // 保存到瀏覽器
}

function clearForm() {
    document.getElementById('taskName').value = '';
    document.getElementById('startDate').valueAsDate = new Date();
    document.getElementById('endDate').value = '';
    document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
    
    // 重置顏色選擇到預設
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.color-btn').classList.add('active');
    selectedColor = '#667eea,#764ba2';
    
    editingTaskId = null;
    updateButtonState();
}

function updateButtonState() {
    const btn = document.querySelector('.btn-primary');
    const cancelBtn = document.querySelector('.btn-cancel');
    
    if (editingTaskId !== null) {
        btn.textContent = '✓ 確認更新';
        btn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        cancelBtn.style.display = 'block';
    } else {
        btn.textContent = '➕ 新增任務';
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        cancelBtn.style.display = 'none';
    }
}

function deleteTask(id) {
    if (confirm('確定要刪除此任務嗎?')) {
        tasks = tasks.filter(t => t.id !== id);
        renderGantt();
        saveTasksToStorage(); // 保存到瀏覽器
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // 設定編輯模式
    editingTaskId = id;

    // 填入編輯資料
    document.getElementById('taskName').value = task.name;
    document.getElementById('startDate').valueAsDate = task.startDate;
    document.getElementById('endDate').valueAsDate = task.endDate;

    // 選中對應的顏色
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.color === task.color) {
            btn.classList.add('active');
        }
    });
    selectedColor = task.color;

    // 更新按鈕狀態
    updateButtonState();

    // 捲動到輸入區
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getDateRange() {
    if (tasks.length === 0) return { start: new Date(), end: new Date() };

    let minDate = new Date(Math.min(...tasks.map(t => t.startDate)));
    let maxDate = new Date(Math.max(...tasks.map(t => t.endDate)));

    // 前後各加一週緩衝
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return { start: minDate, end: maxDate };
}

function getDaysBetween(start, end) {
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function renderGantt() {
    const chart = document.getElementById('ganttChart');
    
    if (tasks.length === 0) {
        chart.innerHTML = `
            <div class="empty-state">
                <h3>尚無任務</h3>
                <p>請在上方新增第一個任務</p>
            </div>
        `;
        return;
    }

    // 依照開始日期排序任務（早到晚，上到下）
    tasks.sort((a, b) => a.startDate - b.startDate);

    const { start: rangeStart, end: rangeEnd } = getDateRange();
    const totalDays = getDaysBetween(rangeStart, rangeEnd);
    const dayWidth = 20; // 每天的寬度（縮小以使圖表更緊湊）

    // 生成日期陣列
    const dates = [];
    for (let i = 0; i < totalDays; i++) {
        const date = new Date(rangeStart);
        date.setDate(date.getDate() + i);
        dates.push(date);
    }

    // 生成年份標題
    let yearsHTML = '';
    let currentYear = null;
    let yearSpan = 0;
    dates.forEach((date, index) => {
        const year = date.getFullYear();
        if (year !== currentYear) {
            if (currentYear !== null) {
                yearsHTML += `<div class="year-cell" style="width: ${yearSpan * dayWidth}px">${currentYear}</div>`;
            }
            currentYear = year;
            yearSpan = 1;
        } else {
            yearSpan++;
        }
        if (index === dates.length - 1) {
            yearsHTML += `<div class="year-cell" style="width: ${yearSpan * dayWidth}px">${currentYear}</div>`;
        }
    });

    // 生成月份標題
    let monthsHTML = '';
    let currentMonth = null;
    let monthSpan = 0;
    dates.forEach((date, index) => {
        const month = `${date.getFullYear()}-${date.getMonth()}`;
        if (month !== currentMonth) {
            if (currentMonth !== null) {
                monthsHTML += `<div class="month-cell" style="width: ${monthSpan * dayWidth}px">${new Date(currentMonth.split('-')[0], currentMonth.split('-')[1]).toLocaleDateString('zh-TW', { month: 'long' })}</div>`;
            }
            currentMonth = month;
            monthSpan = 1;
        } else {
            monthSpan++;
        }
        if (index === dates.length - 1) {
            monthsHTML += `<div class="month-cell" style="width: ${monthSpan * dayWidth}px">${new Date(currentMonth.split('-')[0], currentMonth.split('-')[1]).toLocaleDateString('zh-TW', { month: 'long' })}</div>`;
        }
    });

    // 生成週別標題
    let weeksHTML = '';
    let currentWeek = null;
    let weekSpan = 0;
    dates.forEach((date, index) => {
        const week = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        if (week !== currentWeek) {
            if (currentWeek !== null) {
                weeksHTML += `<div class="week-cell" style="width: ${weekSpan * dayWidth}px">W${currentWeek.split('-W')[1]}</div>`;
            }
            currentWeek = week;
            weekSpan = 1;
        } else {
            weekSpan++;
        }
        if (index === dates.length - 1) {
            weeksHTML += `<div class="week-cell" style="width: ${weekSpan * dayWidth}px">W${currentWeek.split('-W')[1]}</div>`;
        }
    });

    // 生成日期標題
    const daysHTML = dates.map(date => {
        const day = date.getDate();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        return `<div class="day-cell ${isWeekend ? 'weekend' : ''}" style="width: ${dayWidth}px">${day}</div>`;
    }).join('');

    // 生成任務列
    const tasksHTML = tasks.map(task => {
        const taskStart = Math.max(0, getDaysBetween(rangeStart, task.startDate));
        const taskDuration = getDaysBetween(task.startDate, task.endDate) + 1;
        const left = taskStart * dayWidth;
        const width = taskDuration * dayWidth;
        
        // 解析顏色
        const colors = task.color.split(',');
        const gradient = `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;

        return `
            <div class="gantt-row">
                <div class="task-label">
                    <span>${task.name}</span>
                    <div class="task-actions">
                        <button class="edit-btn" data-task-id="${task.id}" data-action="edit">✎</button>
                        <button class="delete-btn" data-task-id="${task.id}" data-action="delete">✕</button>
                    </div>
                </div>
                <div class="task-timeline" style="width: ${totalDays * dayWidth}px;">
                    <div class="task-bar"
                         data-task-id="${task.id}"
                         style="left: ${left}px; width: ${width}px; background: ${gradient}"
                         onmousedown="startDrag(event, ${task.id})"
                         title="${task.startDate.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })} ~ ${task.endDate.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}">
                        <div class="date-adjust start">
                            <button class="date-adjust-btn plus" onclick="adjustDate(event, ${task.id}, 'start', -1)" title="延伸：開始日期提前一天">+</button>
                            <button class="date-adjust-btn minus" onclick="adjustDate(event, ${task.id}, 'start', 1)" title="縮短：開始日期延後一天">−</button>
                        </div>
                        <span class="task-bar-text">${task.name}</span>
                        <div class="date-adjust end">
                            <button class="date-adjust-btn minus" onclick="adjustDate(event, ${task.id}, 'end', -1)" title="結束日期提前一天">−</button>
                            <button class="date-adjust-btn plus" onclick="adjustDate(event, ${task.id}, 'end', 1)" title="結束日期延後一天">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    chart.innerHTML = `
        <div class="timeline-header">
            <div class="task-label-header">任務名稱</div>
            <div class="timeline-scale" style="width: ${totalDays * dayWidth}px;">
                <div class="year-row">${yearsHTML}</div>
                <div class="month-row">${monthsHTML}</div>
                <div class="week-row">${weeksHTML}</div>
                <div class="day-row">${daysHTML}</div>
            </div>
        </div>
        ${tasksHTML}
    `;

    // 使用事件委派處理按鈕點擊
    chart.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const taskId = parseInt(this.dataset.taskId);
            const action = this.dataset.action;
            
            if (action === 'delete') {
                deleteTask(taskId);
            } else if (action === 'edit') {
                editTask(taskId);
            }
        });
    });
}

function adjustDate(e, taskId, edge, delta) {
    e.stopPropagation();
    e.preventDefault();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (edge === 'start') {
        const newStart = new Date(task.startDate);
        newStart.setDate(newStart.getDate() + delta);
        // 不允許開始日期超過結束日期
        if (newStart <= task.endDate) {
            task.startDate = newStart;
        }
    } else {
        const newEnd = new Date(task.endDate);
        newEnd.setDate(newEnd.getDate() + delta);
        // 不允許結束日期早於開始日期
        if (newEnd >= task.startDate) {
            task.endDate = newEnd;
        }
    }
    renderGantt();
    saveTasksToStorage(); // 保存到瀏覽器
}

function startDrag(e, taskId) {
    e.preventDefault();
    draggedTask = tasks.find(t => t.id === taskId);
    dragStartX = e.clientX;
    
    const bar = e.target;
    dragStartLeft = parseInt(bar.style.left);
    bar.classList.add('dragging');

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    if (!draggedTask) return;

    const deltaX = e.clientX - dragStartX;
    const dayWidth = 20; // 與renderGantt中的值保持一致
    const daysDelta = Math.round(deltaX / dayWidth);

    if (daysDelta !== 0) {
        const duration = getDaysBetween(draggedTask.startDate, draggedTask.endDate);
        
        const newStart = new Date(draggedTask.startDate);
        newStart.setDate(newStart.getDate() + daysDelta);
        
        const newEnd = new Date(draggedTask.endDate);
        newEnd.setDate(newEnd.getDate() + daysDelta);

        draggedTask.startDate = newStart;
        draggedTask.endDate = newEnd;

        dragStartX = e.clientX;
        renderGantt();
    }
}

function stopDrag(e) {
    if (draggedTask) {
        const bar = document.querySelector(`[data-task-id="${draggedTask.id}"]`);
        if (bar) bar.classList.remove('dragging');
        saveTasksToStorage(); // 拖曳完成後保存
    }
    
    draggedTask = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// 匯出資料為JSON
function exportData() {
    if (tasks.length === 0) {
        alert('目前沒有任務可以匯出');
        return;
    }

    // 詢問使用者檔案名稱
    const defaultName = `gantt_chart_${new Date().toISOString().split('T')[0]}`;
    const fileName = prompt('請輸入檔案名稱（不需要.json副檔名）:', defaultName);
    
    if (!fileName) {
        return; // 使用者取消
    }

    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        tasks: tasks.map(task => ({
            id: task.id,
            name: task.name,
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
            color: task.color
        }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 匯出甘特圖為圖片
async function exportImage() {
    if (tasks.length === 0) {
        alert('目前沒有任務可以匯出');
        return;
    }

    // 詢問使用者檔案名稱
    const defaultName = `gantt_chart_${new Date().toISOString().split('T')[0]}`;
    const fileName = prompt('請輸入圖片檔案名稱（不需要副檔名）:', defaultName);
    
    if (!fileName) {
        return; // 使用者取消
    }

    const chartElement = document.getElementById('ganttChart');
    
    // 顯示載入提示
    const originalHTML = chartElement.innerHTML;
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px 40px; border-radius: 10px; z-index: 9999; font-size: 18px;';
    loadingDiv.textContent = '正在生成圖片...';
    document.body.appendChild(loadingDiv);

    try {
        // 使用html2canvas截圖
        const canvas = await html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2, // 提高解析度
            logging: false,
            useCORS: true,
            scrollX: 0,
            scrollY: -window.scrollY,
            windowWidth: chartElement.scrollWidth,
            width: chartElement.scrollWidth,
            height: chartElement.scrollHeight
        });

        // 轉換為圖片並下載
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // 移除載入提示
            document.body.removeChild(loadingDiv);
        }, 'image/png');

    } catch (error) {
        console.error('匯出圖片失敗:', error);
        alert('匯出圖片失敗，請稍後再試');
        document.body.removeChild(loadingDiv);
    }
}

// 匯入JSON資料
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (!importData.tasks || !Array.isArray(importData.tasks)) {
                alert('無效的JSON格式');
                return;
            }

            // 確認是否要覆蓋現有資料
            if (tasks.length > 0) {
                if (!confirm('匯入資料將覆蓋目前的所有任務，確定要繼續嗎？')) {
                    event.target.value = ''; // 清空file input
                    return;
                }
            }

            // 載入任務
            tasks = importData.tasks.map(task => ({
                id: task.id,
                name: task.name,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate),
                color: task.color
            }));

            renderGantt();
            saveTasksToStorage(); // 保存匯入的資料
            alert(`成功匯入 ${tasks.length} 個任務`);
            
        } catch (error) {
            alert('匯入失敗：JSON格式錯誤');
            console.error(error);
        }
        
        // 清空file input以允許重複選擇同一檔案
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// 清除所有資料
function clearAllData() {
    if (tasks.length === 0) {
        alert('目前沒有任何任務資料');
        return;
    }
    
    if (confirm(`確定要清除所有 ${tasks.length} 個任務嗎？此操作無法復原！\n\n建議先匯出JSON備份後再清除。`)) {
        tasks = [];
        localStorage.removeItem('ganttTasks');
        renderGantt();
        alert('已清除所有任務資料');
    }
}

// 初始渲染
renderGantt();
