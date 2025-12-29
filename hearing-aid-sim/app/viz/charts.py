"""
차트 시각화 모듈
Plotly를 사용한 게이지, 바 차트, 청력도 등
"""

import plotly.graph_objects as go
from typing import Optional


def create_gauge(score: int) -> go.Figure:
    """
    만족도 점수를 게이지 차트로 시각화

    Args:
        score: 만족도 점수 (0~100)

    Returns:
        Plotly Figure 객체
    """
    # 점수 구간별 색상 결정
    if score >= 85:
        bar_color = "#10b981"  # 녹색 (매우 높음)
    elif score >= 70:
        bar_color = "#3b82f6"  # 파란색 (높음)
    elif score >= 55:
        bar_color = "#f59e0b"  # 노란색 (보통)
    elif score >= 40:
        bar_color = "#f97316"  # 주황색 (낮음)
    else:
        bar_color = "#ef4444"  # 빨간색 (매우 낮음)

    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=score,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={
            'text': "예측 만족도",
            'font': {'size': 24, 'color': '#1f2937', 'family': 'Pretendard, sans-serif'}
        },
        number={
            'font': {'size': 60, 'color': '#1f2937', 'family': 'Pretendard, sans-serif'},
            'suffix': "점"
        },
        delta={
            'reference': 70,
            'increasing': {'color': "#10b981"},
            'decreasing': {'color': "#ef4444"}
        },
        gauge={
            'axis': {
                'range': [0, 100],
                'tickwidth': 2,
                'tickcolor': "#6b7280",
                'tickfont': {'size': 14, 'color': '#4b5563'}
            },
            'bar': {'color': bar_color, 'thickness': 0.75},
            'bgcolor': "white",
            'borderwidth': 2,
            'bordercolor': "#e5e7eb",
            'steps': [
                {'range': [0, 40], 'color': '#fee2e2'},    # 매우 낮음
                {'range': [40, 55], 'color': '#fed7aa'},   # 낮음
                {'range': [55, 70], 'color': '#fef3c7'},   # 보통
                {'range': [70, 85], 'color': '#dbeafe'},   # 높음
                {'range': [85, 100], 'color': '#d1fae5'},  # 매우 높음
            ],
            'threshold': {
                'line': {'color': "#1f2937", 'width': 4},
                'thickness': 0.75,
                'value': score
            }
        }
    ))

    fig.update_layout(
        height=400,
        margin=dict(l=20, r=20, t=80, b=20),
        paper_bgcolor='white',
        font={'family': 'Pretendard, -apple-system, sans-serif'}
    )

    return fig


def create_bar(score: int) -> go.Figure:
    """
    만족도 점수를 수평 바 차트로 시각화

    Args:
        score: 만족도 점수 (0~100)

    Returns:
        Plotly Figure 객체
    """
    # 점수 구간별 색상 결정
    if score >= 85:
        bar_color = "#10b981"  # 녹색
        level_text = "매우 높음 (85~100점)"
    elif score >= 70:
        bar_color = "#3b82f6"  # 파란색
        level_text = "높음 (70~84점)"
    elif score >= 55:
        bar_color = "#f59e0b"  # 노란색
        level_text = "보통 (55~69점)"
    elif score >= 40:
        bar_color = "#f97316"  # 주황색
        level_text = "낮음 (40~54점)"
    else:
        bar_color = "#ef4444"  # 빨간색
        level_text = "매우 낮음 (0~39점)"

    fig = go.Figure()

    # 배경 (전체 범위)
    fig.add_trace(go.Bar(
        x=[100],
        y=['만족도'],
        orientation='h',
        marker=dict(
            color='#f3f4f6',
            line=dict(color='#e5e7eb', width=2)
        ),
        showlegend=False,
        hoverinfo='skip'
    ))

    # 실제 점수 바
    fig.add_trace(go.Bar(
        x=[score],
        y=['만족도'],
        orientation='h',
        marker=dict(
            color=bar_color,
            line=dict(color=bar_color, width=0)
        ),
        text=[f"{score}점"],
        textposition='inside',
        textfont=dict(size=28, color='white', family='Pretendard, sans-serif'),
        showlegend=False,
        hovertemplate=f'<b>예측 만족도</b><br>{score}점 / 100점<br>{level_text}<extra></extra>'
    ))

    # 구간 표시선
    for threshold, label in [(40, '40'), (55, '55'), (70, '70'), (85, '85')]:
        fig.add_vline(
            x=threshold,
            line_dash="dot",
            line_color="#9ca3af",
            line_width=1,
            annotation_text=label,
            annotation_position="top",
            annotation_font_size=10,
            annotation_font_color="#6b7280"
        )

    fig.update_layout(
        title={
            'text': f"예측 만족도: {score}점 - {level_text}",
            'font': {'size': 20, 'color': '#1f2937', 'family': 'Pretendard, sans-serif'},
            'x': 0.5,
            'xanchor': 'center'
        },
        xaxis=dict(
            range=[0, 100],
            showgrid=False,
            zeroline=False,
            title=dict(
                text='점수',
                font=dict(size=14, color='#4b5563')
            )
        ),
        yaxis=dict(
            showgrid=False,
            showticklabels=True,
            title=None
        ),
        height=250,
        margin=dict(l=80, r=40, t=80, b=60),
        paper_bgcolor='white',
        plot_bgcolor='white',
        barmode='overlay',
        font={'family': 'Pretendard, -apple-system, sans-serif'}
    )

    return fig


def create_breakdown_chart(breakdown: list[dict]) -> go.Figure:
    """
    점수 구성 요소를 워터폴 차트로 시각화 (선택적 사용)

    Args:
        breakdown: 점수 breakdown 리스트

    Returns:
        Plotly Figure 객체
    """
    # 기본 점수 제외 (이미 시작점)
    items = [item for item in breakdown if item['factor'] != '기본 점수']

    factors = [item['factor'] for item in items]
    scores = [item['score'] for item in items]

    # 색상 결정 (긍정/부정)
    colors = ['#10b981' if s > 0 else '#ef4444' if s < 0 else '#9ca3af' for s in scores]

    fig = go.Figure(go.Bar(
        x=factors,
        y=scores,
        marker=dict(color=colors),
        text=[f"{s:+d}" if s != 0 else "0" for s in scores],
        textposition='outside',
        textfont=dict(size=12, color='#1f2937'),
        hovertemplate='<b>%{x}</b><br>%{y:+d}점<extra></extra>'
    ))

    fig.update_layout(
        title={
            'text': "점수 구성 요소",
            'font': {'size': 18, 'color': '#1f2937', 'family': 'Pretendard, sans-serif'}
        },
        xaxis=dict(
            title=None,
            tickangle=-45,
            tickfont=dict(size=11)
        ),
        yaxis=dict(
            title='점수 기여도',
            zeroline=True,
            zerolinewidth=2,
            zerolinecolor='#9ca3af'
        ),
        height=400,
        margin=dict(l=60, r=40, t=60, b=120),
        paper_bgcolor='white',
        plot_bgcolor='white',
        font={'family': 'Pretendard, -apple-system, sans-serif'}
    )

    return fig


def create_audiogram(user_input_dict: dict) -> Optional[go.Figure]:
    """
    청력도(audiogram) 그래프 생성

    Args:
        user_input_dict: 사용자 입력 딕셔너리 (주파수별 청력 데이터 포함)

    Returns:
        Plotly Figure 객체 또는 None (데이터 없을 시)
    """
    # 주파수 리스트
    frequencies = [250, 500, 1000, 2000, 4000, 8000]

    # 좌측 데이터 수집
    left_data = []
    for freq in frequencies:
        key = f'audiogram_left_{freq}hz'
        value = user_input_dict.get(key)
        left_data.append(value)

    # 우측 데이터 수집
    right_data = []
    for freq in frequencies:
        key = f'audiogram_right_{freq}hz'
        value = user_input_dict.get(key)
        right_data.append(value)

    # 데이터가 하나도 없으면 None 반환
    if all(v is None for v in left_data) and all(v is None for v in right_data):
        return None

    # 그래프 생성
    fig = go.Figure()

    # 좌측 귀 (파란색 X 마커)
    if not all(v is None for v in left_data):
        fig.add_trace(go.Scatter(
            x=frequencies,
            y=left_data,
            mode='lines+markers',
            name='좌측 (L)',
            line=dict(color='#3b82f6', width=2),
            marker=dict(
                symbol='x',
                size=12,
                color='#3b82f6',
                line=dict(width=2)
            ),
            hovertemplate='<b>좌측</b><br>주파수: %{x} Hz<br>역치: %{y} dB HL<extra></extra>'
        ))

    # 우측 귀 (빨간색 O 마커)
    if not all(v is None for v in right_data):
        fig.add_trace(go.Scatter(
            x=frequencies,
            y=right_data,
            mode='lines+markers',
            name='우측 (R)',
            line=dict(color='#ef4444', width=2),
            marker=dict(
                symbol='circle',
                size=10,
                color='#ef4444',
                line=dict(width=2)
            ),
            hovertemplate='<b>우측</b><br>주파수: %{x} Hz<br>역치: %{y} dB HL<extra></extra>'
        ))

    # 청력 손실 수준 배경색
    fig.add_hrect(y0=0, y1=20, fillcolor='#d1fae5', opacity=0.3, line_width=0, annotation_text="정상", annotation_position="right")
    fig.add_hrect(y0=20, y1=40, fillcolor='#fef3c7', opacity=0.3, line_width=0, annotation_text="경도", annotation_position="right")
    fig.add_hrect(y0=40, y1=60, fillcolor='#fed7aa', opacity=0.3, line_width=0, annotation_text="중등도", annotation_position="right")
    fig.add_hrect(y0=60, y1=80, fillcolor='#fecaca', opacity=0.3, line_width=0, annotation_text="고도", annotation_position="right")
    fig.add_hrect(y0=80, y1=120, fillcolor='#fee2e2', opacity=0.3, line_width=0, annotation_text="심도", annotation_position="right")

    # 레이아웃 설정
    fig.update_layout(
        title=dict(
            text='청력도 (Audiogram)',
            font=dict(size=20, color='#1f2937', family='Pretendard, sans-serif'),
            x=0.5,
            xanchor='center'
        ),
        xaxis=dict(
            title=dict(
                text='주파수 (Hz)',
                font=dict(size=14, color='#4b5563')
            ),
            type='log',
            tickvals=frequencies,
            ticktext=[str(f) for f in frequencies],
            showgrid=True,
            gridcolor='#e5e7eb',
            gridwidth=1
        ),
        yaxis=dict(
            title=dict(
                text='청력역치 (dB HL)',
                font=dict(size=14, color='#4b5563')
            ),
            range=[120, -10],
            showgrid=True,
            gridcolor='#e5e7eb',
            gridwidth=1,
            zeroline=False
        ),
        height=500,
        margin=dict(l=80, r=100, t=80, b=80),
        paper_bgcolor='white',
        plot_bgcolor='white',
        font=dict(family='Pretendard, -apple-system, sans-serif'),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        ),
        hovermode='closest'
    )

    return fig
