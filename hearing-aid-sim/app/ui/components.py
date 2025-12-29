"""
UI 컴포넌트 모듈
재사용 가능한 Streamlit 컴포넌트
"""

import streamlit as st
import pandas as pd
from typing import Optional
import plotly.graph_objects as go


def render_input_form() -> Optional[dict]:
    """
    사용자 입력 폼 렌더링

    Returns:
        dict: 사용자 입력 데이터 (버튼 클릭 시)
        None: 버튼 미클릭 시
    """
    st.header("환자 정보 입력")

    # 섹션 1: 청력 정보
    with st.expander("청력 검사 결과", expanded=True):
        # 입력 방식 선택
        input_mode = st.radio(
            "입력 방식",
            options=["frequency", "pta"],
            format_func=lambda x: "주파수별 입력 (권장)" if x == "frequency" else "PTA 직접 입력",
            index=0,
            help="주파수별로 청력을 입력하면 청력도 그래프를 볼 수 있습니다"
        )

        # PTA 계산용 변수 초기화
        left_pta_calc = None
        right_pta_calc = None

        if input_mode == "frequency":
            # 주파수별 입력 안내
            st.info("💡 팁: Tab 키를 사용하여 다음 칸으로 이동할 수 있습니다.")

            st.markdown("#### 좌측 귀 (왼쪽 귀)")
            left_cols = st.columns(6)
            frequencies = [250, 500, 1000, 2000, 4000, 8000]

            # 세션 상태에 기본값 저장
            if 'audiogram_left_250hz' not in st.session_state:
                st.session_state.audiogram_left_250hz = 30.0
            if 'audiogram_left_500hz' not in st.session_state:
                st.session_state.audiogram_left_500hz = 35.0
            if 'audiogram_left_1000hz' not in st.session_state:
                st.session_state.audiogram_left_1000hz = 40.0
            if 'audiogram_left_2000hz' not in st.session_state:
                st.session_state.audiogram_left_2000hz = 45.0
            if 'audiogram_left_4000hz' not in st.session_state:
                st.session_state.audiogram_left_4000hz = 50.0
            if 'audiogram_left_8000hz' not in st.session_state:
                st.session_state.audiogram_left_8000hz = 55.0

            audiogram_left_250hz = left_cols[0].number_input("250Hz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_left_250hz, step=5.0, key="l250")
            audiogram_left_500hz = left_cols[1].number_input("500Hz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_left_500hz, step=5.0, key="l500")
            audiogram_left_1000hz = left_cols[2].number_input("1kHz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_left_1000hz, step=5.0, key="l1k")
            audiogram_left_2000hz = left_cols[3].number_input("2kHz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_left_2000hz, step=5.0, key="l2k")
            audiogram_left_4000hz = left_cols[4].number_input("4kHz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_left_4000hz, step=5.0, key="l4k")
            audiogram_left_8000hz = left_cols[5].number_input("8kHz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_left_8000hz, step=5.0, key="l8k")

            st.markdown("#### 우측 귀 (오른쪽 귀)")
            right_cols = st.columns(6)

            # 세션 상태에 기본값 저장
            if 'audiogram_right_250hz' not in st.session_state:
                st.session_state.audiogram_right_250hz = 30.0
            if 'audiogram_right_500hz' not in st.session_state:
                st.session_state.audiogram_right_500hz = 40.0
            if 'audiogram_right_1000hz' not in st.session_state:
                st.session_state.audiogram_right_1000hz = 45.0
            if 'audiogram_right_2000hz' not in st.session_state:
                st.session_state.audiogram_right_2000hz = 50.0
            if 'audiogram_right_4000hz' not in st.session_state:
                st.session_state.audiogram_right_4000hz = 55.0
            if 'audiogram_right_8000hz' not in st.session_state:
                st.session_state.audiogram_right_8000hz = 60.0

            audiogram_right_250hz = right_cols[0].number_input("250Hz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_right_250hz, step=5.0, key="r250")
            audiogram_right_500hz = right_cols[1].number_input("500Hz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_right_500hz, step=5.0, key="r500")
            audiogram_right_1000hz = right_cols[2].number_input("1kHz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_right_1000hz, step=5.0, key="r1k")
            audiogram_right_2000hz = right_cols[3].number_input("2kHz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_right_2000hz, step=5.0, key="r2k")
            audiogram_right_4000hz = right_cols[4].number_input("4kHz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_right_4000hz, step=5.0, key="r4k")
            audiogram_right_8000hz = right_cols[5].number_input("8kHz", min_value=0.0, max_value=120.0, value=st.session_state.audiogram_right_8000hz, step=5.0, key="r8k")

            # PTA 자동 계산 표시
            left_pta_calc = (audiogram_left_500hz + audiogram_left_1000hz + audiogram_left_2000hz + audiogram_left_4000hz) / 4
            right_pta_calc = (audiogram_right_500hz + audiogram_right_1000hz + audiogram_right_2000hz + audiogram_right_4000hz) / 4

            st.info(f"자동 계산된 PTA - 좌측: **{left_pta_calc:.1f} dB HL**, 우측: **{right_pta_calc:.1f} dB HL**")

            audiogram_left_pta = None
            audiogram_right_pta = None

        else:  # PTA 직접 입력 모드
            audiogram_left_250hz = None
            audiogram_left_500hz = None
            audiogram_left_1000hz = None
            audiogram_left_2000hz = None
            audiogram_left_4000hz = None
            audiogram_left_8000hz = None
            audiogram_right_250hz = None
            audiogram_right_500hz = None
            audiogram_right_1000hz = None
            audiogram_right_2000hz = None
            audiogram_right_4000hz = None
            audiogram_right_8000hz = None

            col1, col2 = st.columns(2)

            with col1:
                audiogram_left_pta = st.number_input(
                    "좌측 순음청력역치 (PTA)",
                    min_value=0.0,
                    max_value=120.0,
                    value=40.0,
                    step=5.0,
                    help="좌측 귀의 평균 청력역치를 입력하세요 (0~120 dB HL)"
                )

            with col2:
                audiogram_right_pta = st.number_input(
                    "우측 순음청력역치 (PTA)",
                    min_value=0.0,
                    max_value=120.0,
                    value=45.0,
                    step=5.0,
                    help="우측 귀의 평균 청력역치를 입력하세요 (0~120 dB HL)"
                )

        # 비대칭 자동 계산 또는 수동 입력
        manual_asymmetry = st.checkbox(
            "좌우 비대칭 값 직접 입력",
            value=False,
            help="체크 해제 시 좌우 PTA 차이로 자동 계산됩니다"
        )

        # PTA 값 계산 (주파수별 입력 모드에서는 자동 계산된 값 사용)
        if audiogram_left_pta is None and audiogram_right_pta is None:
            # 주파수별 입력 모드인 경우
            if left_pta_calc is not None and right_pta_calc is not None:
                left_pta_for_calc = left_pta_calc
                right_pta_for_calc = right_pta_calc
            else:
                # 기본값 사용 (오류 방지)
                left_pta_for_calc = 40.0
                right_pta_for_calc = 45.0
        else:
            # PTA 직접 입력 모드인 경우
            left_pta_for_calc = audiogram_left_pta if audiogram_left_pta is not None else 40.0
            right_pta_for_calc = audiogram_right_pta if audiogram_right_pta is not None else 45.0

        if manual_asymmetry:
            asymmetry_db = st.number_input(
                "좌우 청력 비대칭 (dB)",
                min_value=0.0,
                max_value=120.0,
                value=abs(left_pta_for_calc - right_pta_for_calc),
                step=5.0,
                help="좌우 청력 차이를 직접 입력하세요"
            )
        else:
            asymmetry_db = abs(left_pta_for_calc - right_pta_for_calc)
            st.info(f"자동 계산된 좌우 비대칭: **{asymmetry_db:.1f} dB**")

        col3, col4 = st.columns(2)

        with col3:
            speech_score_left = st.slider(
                "좌측 어음명료도 (%)",
                min_value=0,
                max_value=100,
                value=75,
                step=5,
                help="좌측 귀의 어음인지 검사 결과 점수를 입력하세요"
            )

        with col4:
            speech_score_right = st.slider(
                "우측 어음명료도 (%)",
                min_value=0,
                max_value=100,
                value=75,
                step=5,
                help="우측 귀의 어음인지 검사 결과 점수를 입력하세요"
            )

    # 섹션 2: 기본 정보
    with st.expander("기본 정보", expanded=True):
        age = st.number_input(
            "연령 (세)",
            min_value=10,
            max_value=110,
            value=65,
            step=1,
            help="환자의 나이를 입력하세요 (10~110세)"
        )

        lifestyle = st.radio(
            "주 생활 환경",
            options=["quiet", "mixed", "noisy"],
            format_func=lambda x: {
                "quiet": "조용한 환경 (주로 집에서 생활)",
                "mixed": "혼합 환경 (실내외 균형)",
                "noisy": "시끄러운 환경 (사무실, 모임 등)"
            }[x],
            index=1,
            help="주로 생활하는 환경의 소음 수준을 선택하세요"
        )

    # 섹션 3: 임상 정보
    with st.expander("임상 정보", expanded=True):
        col1, col2 = st.columns(2)

        with col1:
            experience = st.checkbox(
                "보청기 사용 경험 있음",
                value=False,
                help="과거 보청기를 사용한 경험이 있는지 선택하세요"
            )

        with col2:
            tinnitus = st.checkbox(
                "이명 증상 있음",
                value=False,
                help="귀울림(이명) 증상이 있는지 선택하세요"
            )

    # 섹션 4: 선호도 및 예산
    with st.expander("선호도 및 예산", expanded=True):
        desired_type = st.selectbox(
            "희망 보청기 형태",
            options=["BTE", "RIC", "ITE", "CIC"],
            format_func=lambda x: {
                "BTE": "귀걸이형 (BTE) - 모든 난청에 적합",
                "RIC": "오픈형 (RIC) - 자연스러운 착용감",
                "ITE": "귓속형 (ITE) - 중등도 난청",
                "CIC": "초소형 (CIC) - 눈에 잘 안 보임"
            }[x],
            index=1,
            help="선호하는 보청기 형태를 선택하세요"
        )

        budget = st.selectbox(
            "예산 범위",
            options=["low", "mid", "high"],
            format_func=lambda x: {
                "low": "경제형 (100~200만원)",
                "mid": "중급형 (200~400만원)",
                "high": "고급형 (400만원 이상)"
            }[x],
            index=1,
            help="보청기 구매 예산 범위를 선택하세요"
        )

        fitting_plan = st.selectbox(
            "착용 계획",
            options=["bilateral", "unilateral_left", "unilateral_right"],
            format_func=lambda x: {
                "bilateral": "양측 착용 (권장)",
                "unilateral_left": "좌측 단측 착용",
                "unilateral_right": "우측 단측 착용"
            }[x],
            index=0,
            help="보청기 착용 계획을 선택하세요. 양측 난청의 경우 양측 착용을 권장합니다."
        )

    # 섹션 5: 추가 정보 (리포트용, 선택사항)
    with st.expander("추가 정보 (리포트용, 선택사항)", expanded=False):
        customer_name = st.text_input(
            "고객명 또는 고객번호",
            value="",
            help="Word 리포트에 표시될 고객명 또는 고객번호를 입력하세요 (선택사항)"
        )

        main_complaints = st.multiselect(
            "주요 불편 상황",
            options=[
                "조용한 곳에서도 대화가 잘 안 들림",
                "TV나 라디오 소리를 크게 틀게 됨",
                "전화 통화가 어려움",
                "여러 사람이 있는 곳에서 대화 이해 어려움",
                "가족이나 지인이 말을 반복해야 함",
                "모임이나 회의 참석이 부담스러움",
                "귀에서 울리는 소리(이명)가 있음",
                "한쪽 귀만 잘 안 들림"
            ],
            default=[],
            help="현재 겪고 계신 주요 불편 상황을 선택하세요 (복수 선택 가능)"
        )

        wearing_goal = st.selectbox(
            "착용 목표",
            options=[
                "선택 안 함",
                "가족과의 대화를 편하게 하고 싶음",
                "직장/사회 활동을 원활하게 하고 싶음",
                "TV 시청이나 전화 통화를 개선하고 싶음",
                "모임이나 회의 참석을 더 활발히 하고 싶음",
                "전반적인 삶의 질을 향상시키고 싶음",
                "청력 악화를 방지하고 싶음"
            ],
            index=0,
            help="보청기 착용을 통해 달성하고자 하는 목표를 선택하세요"
        )

    # 예측하기 버튼
    st.divider()
    predict_button = st.button(
        "만족도 예측 실행",
        type="primary",
        use_container_width=True
    )

    if predict_button:
        # 입력 데이터 수집
        input_data = {
            "audiogram_left_250hz": audiogram_left_250hz,
            "audiogram_left_500hz": audiogram_left_500hz,
            "audiogram_left_1000hz": audiogram_left_1000hz,
            "audiogram_left_2000hz": audiogram_left_2000hz,
            "audiogram_left_4000hz": audiogram_left_4000hz,
            "audiogram_left_8000hz": audiogram_left_8000hz,
            "audiogram_right_250hz": audiogram_right_250hz,
            "audiogram_right_500hz": audiogram_right_500hz,
            "audiogram_right_1000hz": audiogram_right_1000hz,
            "audiogram_right_2000hz": audiogram_right_2000hz,
            "audiogram_right_4000hz": audiogram_right_4000hz,
            "audiogram_right_8000hz": audiogram_right_8000hz,
            "audiogram_left_pta": audiogram_left_pta,
            "audiogram_right_pta": audiogram_right_pta,
            "speech_score_left": speech_score_left,
            "speech_score_right": speech_score_right,
            "age": age,
            "lifestyle": lifestyle,
            "experience": experience,
            "tinnitus": tinnitus,
            "asymmetry_db": asymmetry_db if manual_asymmetry else None,
            "desired_type": desired_type,
            "budget": budget,
            "fitting_plan": fitting_plan,
            "customer_name": customer_name if customer_name else None,
            "main_complaints": main_complaints if main_complaints else [],
            "wearing_goal": wearing_goal if wearing_goal != "선택 안 함" else None
        }
        return input_data

    return None


def render_validation_error(error: Exception):
    """
    Pydantic 검증 오류 표시

    Args:
        error: Pydantic ValidationError
    """
    st.error("입력 데이터 검증 실패")

    # Pydantic 2.x 오류 처리
    if hasattr(error, 'errors'):
        for err in error.errors():
            field = " → ".join(str(loc) for loc in err['loc'])
            message = err['msg']
            st.markdown(f"- **{field}**: {message}")
    else:
        st.markdown(f"- {str(error)}")

    st.info("입력 값을 확인하고 다시 시도해주세요.")


def render_input_summary(user_input):
    """
    입력 데이터 요약 표시

    Args:
        user_input: UserInput Pydantic 모델 인스턴스
    """
    st.success("입력 검증 성공")

    st.subheader("입력 데이터 요약")

    # 테이블 형식으로 표시
    display_data = user_input.get_display_dict()

    col1, col2 = st.columns(2)

    items = list(display_data.items())
    mid = len(items) // 2

    with col1:
        for key, value in items[:mid]:
            st.metric(label=key, value=value)

    with col2:
        for key, value in items[mid:]:
            st.metric(label=key, value=value)

    # 상세 정보 (JSON)
    with st.expander("원본 데이터 보기"):
        st.json(user_input.model_dump())


def render_prediction_result(
    score: int,
    breakdown: list[dict],
    satisfaction_level: str,
    summary_text: str,
    recommendations: list[str],
    chart_fig: go.Figure,
    breakdown_chart_fig: go.Figure = None,
    breakdown_detail: dict = None
):
    """
    예측 결과 표시 (Phase D 업데이트)

    Args:
        score: 예측된 만족도 점수 (0~100)
        breakdown: 점수 breakdown 리스트
        satisfaction_level: 만족도 등급
        summary_text: 요약 텍스트
        recommendations: 추천 사항 리스트
        chart_fig: 메인 차트 (게이지 또는 바)
        breakdown_chart_fig: breakdown 차트 (선택적)
        breakdown_detail: 상세 breakdown 정보
    """
    st.success("만족도 예측 완료")

    # 1. 큰 점수 표시
    st.markdown("## 예측 만족도")
    st.caption("현재 선택하신 착용 계획 기준 만족도입니다")

    col1, col2 = st.columns([3, 2])

    with col1:
        # Plotly 차트 표시
        st.plotly_chart(chart_fig, use_container_width=True)

    with col2:
        # 점수 및 등급 정보
        st.markdown(f"### **{score}점** / 100점")

        # 색상 인디케이터
        if score >= 85:
            status = "우수"
            color = "#10b981"
        elif score >= 70:
            status = "양호"
            color = "#3b82f6"
        elif score >= 55:
            status = "보통"
            color = "#f59e0b"
        elif score >= 40:
            status = "개선필요"
            color = "#f97316"
        else:
            status = "위험"
            color = "#ef4444"

        st.markdown(f"### **{satisfaction_level}**")
        st.markdown(f"<div style='background-color: {color}20; padding: 10px; border-radius: 10px; border-left: 4px solid {color};'>"
                   f"<strong>상태:</strong> {status}"
                   f"</div>", unsafe_allow_html=True)

        st.metric(label="만족도 등급", value=satisfaction_level, delta=None)

    # 단측 착용 안내 (있는 경우)
    if breakdown_detail and breakdown_detail.get('unilateral_detail', {}).get('is_unilateral', False):
        st.info(
            "💡 **단측 착용 시 참고사항**: 양측 난청 상태에서 단측 착용은 방향감 저하, 소음 환경 청취력 감소 등의 "
            "문제가 발생할 수 있습니다. 양측 착용으로 변경하면 개선 가능성이 있으니 상담 후 결정하시길 권장합니다.",
            icon="ℹ️"
        )

    st.divider()

    # 2. 요약 텍스트
    st.markdown("### 예측 결과 요약")
    st.info(summary_text)

    st.divider()

    # 3. 추천 사항
    if recommendations:
        st.markdown("### 추천 사항")
        for i, rec in enumerate(recommendations, 1):
            st.markdown(f"{i}. {rec}")

        st.divider()

    # 4. 점수 구성 요소 (자세히 보기)
    with st.expander("점수 구성 요소 자세히 보기"):
        # DataFrame 표시
        df = pd.DataFrame(breakdown)
        df['점수'] = df.apply(lambda row: f"{row['sign']}{row['score']}", axis=1)
        df_display = df[['factor', '점수']].rename(columns={'factor': '요소'})

        st.dataframe(
            df_display,
            use_container_width=True,
            hide_index=True
        )

        # breakdown 차트 (있는 경우)
        if breakdown_chart_fig:
            st.plotly_chart(breakdown_chart_fig, use_container_width=True)

        # 상세 분석
        st.markdown("#### 상세 분석")
        for item in breakdown:
            factor = item['factor']
            score_val = item['score']

            if score_val > 0:
                st.markdown(f"**{factor}**: +{score_val}점 (긍정적 영향)")
            elif score_val < 0:
                st.markdown(f"**{factor}**: {score_val}점 (부정적 영향)")
            else:
                st.markdown(f"**{factor}**: {score_val}점 (영향 없음)")
