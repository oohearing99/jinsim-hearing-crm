"""
보청기 상담용 만족도 예측 시뮬레이터 MVP
Streamlit 메인 애플리케이션
"""

import streamlit as st
from pydantic import ValidationError
from datetime import datetime

from core.schema import UserInput
from core.preprocess import preprocess_inputs, get_feature_summary
from core.predictor import predict_satisfaction, get_satisfaction_level, get_breakdown_summary
from core.summarizer import generate_summary, generate_recommendations
from core.report import generate_text_report, generate_json_report
from report.word_report import build_report_docx
from viz.charts import create_gauge, create_bar, create_breakdown_chart, create_audiogram
from ui.components import (
    render_input_form,
    render_validation_error,
    render_input_summary,
    render_prediction_result
)

# 페이지 설정
st.set_page_config(
    page_title="보청기 만족도 예측 시뮬레이터",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)


def reset_session():
    """세션 상태 초기화"""
    keys_to_remove = [
        'validated_input',
        'features',
        'prediction_score',
        'breakdown',
        'summary',
        'recommendations',
        'input_data'
    ]
    for key in keys_to_remove:
        if key in st.session_state:
            del st.session_state[key]


def main():
    """메인 애플리케이션"""

    # 사이드바
    with st.sidebar:
        st.title("보청기 만족도 예측 시스템")
        st.markdown("---")

        # 바 차트 고정 (시각화 설정 숨김)
        chart_type = "bar"
        show_breakdown_chart = False

        # 입력값 초기화 버튼
        if st.button("입력값 초기화", use_container_width=True, type="secondary"):
            reset_session()
            st.rerun()

        st.markdown("---")
        st.info("모든 필드는 필수 입력입니다.")

    # 메인 화면
    st.title("보청기 만족도 예측 시뮬레이터")
    st.markdown("환자의 청력 정보와 선호도를 바탕으로 **보청기 사용 만족도**를 예측합니다.")

    st.divider()

    # 2-column 레이아웃
    col_input, col_result = st.columns([1, 1], gap="large")

    # 왼쪽: 입력 섹션
    with col_input:
        st.markdown("### 입력 섹션")
        input_data = render_input_form()

    # 오른쪽: 결과 섹션
    with col_result:
        st.markdown("### 결과 섹션")

        # 버튼 클릭 시 처리
        if input_data is not None:
            try:
                # 1. Pydantic 검증
                user_input = UserInput(**input_data)

                # 2. 입력 요약 표시
                render_input_summary(user_input)

                st.divider()

                # 2-1. 청력도 그래프 표시 (주파수별 데이터가 있는 경우)
                audiogram_chart = create_audiogram(user_input.model_dump())
                if audiogram_chart:
                    st.markdown("### 청력도 (Audiogram)")
                    st.plotly_chart(audiogram_chart, use_container_width=True)
                    st.divider()

                # 3. 전처리
                with st.spinner("데이터 전처리 중..."):
                    features = preprocess_inputs(user_input)

                # 전처리 결과 표시 (expander)
                with st.expander("전처리 결과"):
                    feature_summary = get_feature_summary(features)
                    cols = st.columns(2)
                    items = list(feature_summary.items())
                    mid = len(items) // 2

                    with cols[0]:
                        for key, value in items[:mid]:
                            st.text(f"{key}: {value}")

                    with cols[1]:
                        for key, value in items[mid:]:
                            st.text(f"{key}: {value}")

                st.divider()

                # 4. 만족도 예측
                with st.spinner("만족도 예측 중..."):
                    score, breakdown = predict_satisfaction(features)
                    satisfaction_level = get_satisfaction_level(score)
                    breakdown_summary = get_breakdown_summary(breakdown)

                # 5. 요약 텍스트 생성
                summary_text = generate_summary(score, features, breakdown)
                recommendations = generate_recommendations(score, features, breakdown)

                # 6. 차트 생성
                if chart_type == "gauge":
                    main_chart = create_gauge(score)
                else:
                    main_chart = create_bar(score)

                breakdown_chart = create_breakdown_chart(breakdown_summary) if show_breakdown_chart else None

                # 7. 예측 결과 표시
                render_prediction_result(
                    score=score,
                    breakdown=breakdown_summary,
                    satisfaction_level=satisfaction_level,
                    summary_text=summary_text,
                    recommendations=recommendations,
                    chart_fig=main_chart,
                    breakdown_chart_fig=breakdown_chart,
                    breakdown_detail=breakdown
                )

                # 8. 리포트 다운로드 버튼
                st.divider()
                st.markdown("### 리포트 다운로드")

                dl_col1, dl_col2, dl_col3 = st.columns(3)

                # Word 리포트 (고객용)
                with dl_col1:
                    try:
                        word_report = build_report_docx(
                            user_input_dict=user_input.model_dump(),
                            features=features,
                            score=score,
                            satisfaction_level=satisfaction_level,
                            summary_text=summary_text,
                            recommendations=recommendations,
                            breakdown=breakdown,
                            chart_fig=main_chart,
                            audiogram_fig=audiogram_chart
                        )

                        st.download_button(
                            label="Word 리포트 (.docx)",
                            data=word_report.getvalue(),
                            file_name=f"보청기_만족도_리포트_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx",
                            mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            use_container_width=True
                        )
                    except Exception as e:
                        st.error(f"Word 리포트 생성 오류: {str(e)}")

                # 텍스트 리포트
                with dl_col2:
                    text_report = generate_text_report(
                        user_input_dict=user_input.model_dump(),
                        features=features,
                        score=score,
                        satisfaction_level=satisfaction_level,
                        summary_text=summary_text,
                        recommendations=recommendations,
                        breakdown=breakdown
                    )

                    st.download_button(
                        label="텍스트 리포트 (.txt)",
                        data=text_report,
                        file_name=f"hearing_aid_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
                        mime="text/plain",
                        use_container_width=True
                    )

                # JSON 리포트
                with dl_col3:
                    json_report = generate_json_report(
                        user_input_dict=user_input.model_dump(),
                        features=features,
                        score=score,
                        satisfaction_level=satisfaction_level,
                        summary_text=summary_text,
                        recommendations=recommendations,
                        breakdown=breakdown
                    )

                    st.download_button(
                        label="JSON 리포트 (.json)",
                        data=json_report,
                        file_name=f"hearing_aid_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                        mime="application/json",
                        use_container_width=True
                    )

                # 세션 상태에 저장
                st.session_state['validated_input'] = user_input
                st.session_state['features'] = features
                st.session_state['prediction_score'] = score
                st.session_state['breakdown'] = breakdown
                st.session_state['summary'] = summary_text
                st.session_state['recommendations'] = recommendations

            except ValidationError as e:
                # 검증 실패
                render_validation_error(e)

            except FileNotFoundError as e:
                # 가중치 파일 없음
                st.error(f"가중치 파일을 찾을 수 없습니다: {str(e)}")
                st.info("`app/data/weights.default.json` 파일이 존재하는지 확인하세요.")

            except Exception as e:
                # 기타 오류
                st.error(f"예상치 못한 오류가 발생했습니다: {str(e)}")
                import traceback
                with st.expander("오류 상세 정보"):
                    st.code(traceback.format_exc())

        else:
            # 입력 대기 상태
            st.info("왼쪽 입력 섹션에서 환자 정보를 입력하고 '만족도 예측하기' 버튼을 클릭하세요.")


if __name__ == "__main__":
    main()
