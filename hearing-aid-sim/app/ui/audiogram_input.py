"""
청력도 입력을 위한 커스텀 컴포넌트
키보드 화살표 네비게이션 지원
"""

import streamlit as st
import streamlit.components.v1 as components


def render_audiogram_grid():
    """
    청력도 입력 그리드 렌더링 (키보드 화살표 네비게이션 지원)

    Returns:
        dict: 주파수별 청력 데이터
    """

    # HTML/JavaScript 커스텀 컴포넌트
    html_code = """
    <style>
        .audiogram-grid {
            width: 100%;
            margin: 20px 0;
        }
        .audiogram-row {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        .audiogram-label {
            font-weight: bold;
            min-width: 100px;
            padding: 8px;
            display: flex;
            align-items: center;
        }
        .audiogram-cell {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .freq-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .audiogram-input {
            width: 100%;
            padding: 8px;
            border: 2px solid #ddd;
            border-radius: 4px;
            text-align: center;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        .audiogram-input:focus {
            outline: none;
            border-color: #3b82f6;
            background-color: #f0f9ff;
        }
        .pta-info {
            margin-top: 15px;
            padding: 10px;
            background-color: #e0f2fe;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
        }
    </style>

    <div class="audiogram-grid">
        <div class="audiogram-row">
            <div class="audiogram-label">좌측 귀 (L)</div>
            <div class="audiogram-cell">
                <div class="freq-label">250Hz</div>
                <input type="number" class="audiogram-input" id="l250" min="0" max="120" step="5" value="30"
                       data-row="0" data-col="0" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <div class="freq-label">500Hz</div>
                <input type="number" class="audiogram-input" id="l500" min="0" max="120" step="5" value="35"
                       data-row="0" data-col="1" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <div class="freq-label">1kHz</div>
                <input type="number" class="audiogram-input" id="l1k" min="0" max="120" step="5" value="40"
                       data-row="0" data-col="2" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <div class="freq-label">2kHz</div>
                <input type="number" class="audiogram-input" id="l2k" min="0" max="120" step="5" value="45"
                       data-row="0" data-col="3" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <div class="freq-label">4kHz</div>
                <input type="number" class="audiogram-input" id="l4k" min="0" max="120" step="5" value="50"
                       data-row="0" data-col="4" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <div class="freq-label">8kHz</div>
                <input type="number" class="audiogram-input" id="l8k" min="0" max="120" step="5" value="55"
                       data-row="0" data-col="5" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
        </div>

        <div class="audiogram-row">
            <div class="audiogram-label">우측 귀 (R)</div>
            <div class="audiogram-cell">
                <input type="number" class="audiogram-input" id="r250" min="0" max="120" step="5" value="30"
                       data-row="1" data-col="0" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <input type="number" class="audiogram-input" id="r500" min="0" max="120" step="5" value="40"
                       data-row="1" data-col="1" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <input type="number" class="audiogram-input" id="r1k" min="0" max="120" step="5" value="45"
                       data-row="1" data-col="2" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <input type="number" class="audiogram-input" id="r2k" min="0" max="120" step="5" value="50"
                       data-row="1" data-col="3" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <input type="number" class="audiogram-input" id="r4k" min="0" max="120" step="5" value="55"
                       data-row="1" data-col="4" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
            <div class="audiogram-cell">
                <input type="number" class="audiogram-input" id="r8k" min="0" max="120" step="5" value="60"
                       data-row="1" data-col="5" onkeydown="handleKeyNav(event)" oninput="updatePTA()">
            </div>
        </div>

        <div class="pta-info" id="pta-info">
            자동 계산된 PTA - 좌측: <strong>42.5 dB HL</strong>, 우측: <strong>47.5 dB HL</strong>
        </div>
    </div>

    <script>
        // 키보드 네비게이션 처리
        function handleKeyNav(event) {
            const input = event.target;
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);

            let newRow = row;
            let newCol = col;

            // 화살표 키 처리
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                newCol = Math.min(col + 1, 5);
                input.value = '';  // 현재 칸 내용 삭제
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                newCol = Math.max(col - 1, 0);
                input.value = '';  // 현재 칸 내용 삭제
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                newRow = Math.min(row + 1, 1);
                input.value = '';  // 현재 칸 내용 삭제
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                newRow = Math.max(row - 1, 0);
                input.value = '';  // 현재 칸 내용 삭제
            } else if (event.key === 'Enter') {
                event.preventDefault();
                sendDataToStreamlit();
                return;
            }

            // 새로운 셀로 포커스 이동
            if (newRow !== row || newCol !== col) {
                const inputs = document.querySelectorAll('.audiogram-input');
                inputs.forEach(inp => {
                    if (parseInt(inp.dataset.row) === newRow && parseInt(inp.dataset.col) === newCol) {
                        inp.focus();
                        inp.select();
                    }
                });
            }
        }

        // PTA 자동 계산
        function updatePTA() {
            const l500 = parseFloat(document.getElementById('l500').value) || 0;
            const l1k = parseFloat(document.getElementById('l1k').value) || 0;
            const l2k = parseFloat(document.getElementById('l2k').value) || 0;
            const l4k = parseFloat(document.getElementById('l4k').value) || 0;

            const r500 = parseFloat(document.getElementById('r500').value) || 0;
            const r1k = parseFloat(document.getElementById('r1k').value) || 0;
            const r2k = parseFloat(document.getElementById('r2k').value) || 0;
            const r4k = parseFloat(document.getElementById('r4k').value) || 0;

            const leftPTA = (l500 + l1k + l2k + l4k) / 4;
            const rightPTA = (r500 + r1k + r2k + r4k) / 4;

            document.getElementById('pta-info').innerHTML =
                `자동 계산된 PTA - 좌측: <strong>${leftPTA.toFixed(1)} dB HL</strong>, 우측: <strong>${rightPTA.toFixed(1)} dB HL</strong>`;
        }

        // Streamlit에 데이터 전송
        function sendDataToStreamlit() {
            const data = {
                audiogram_left_250hz: parseFloat(document.getElementById('l250').value),
                audiogram_left_500hz: parseFloat(document.getElementById('l500').value),
                audiogram_left_1000hz: parseFloat(document.getElementById('l1k').value),
                audiogram_left_2000hz: parseFloat(document.getElementById('l2k').value),
                audiogram_left_4000hz: parseFloat(document.getElementById('l4k').value),
                audiogram_left_8000hz: parseFloat(document.getElementById('l8k').value),
                audiogram_right_250hz: parseFloat(document.getElementById('r250').value),
                audiogram_right_500hz: parseFloat(document.getElementById('r500').value),
                audiogram_right_1000hz: parseFloat(document.getElementById('r1k').value),
                audiogram_right_2000hz: parseFloat(document.getElementById('r2k').value),
                audiogram_right_4000hz: parseFloat(document.getElementById('r4k').value),
                audiogram_right_8000hz: parseFloat(document.getElementById('r8k').value)
            };

            window.parent.postMessage({type: 'streamlit:setComponentValue', value: data}, '*');
        }

        // 초기 PTA 계산
        updatePTA();
    </script>
    """

    # 커스텀 컴포넌트 렌더링
    result = components.html(html_code, height=250)

    return result
