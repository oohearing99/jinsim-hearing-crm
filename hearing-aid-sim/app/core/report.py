"""
리포트 생성 모듈
예측 결과를 다운로드 가능한 형식으로 변환
"""

import json
from datetime import datetime
from typing import Dict, Any


def generate_text_report(
    user_input_dict: dict,
    features: dict,
    score: int,
    satisfaction_level: str,
    summary_text: str,
    recommendations: list[str],
    breakdown: dict
) -> str:
    """
    텍스트 형식 리포트 생성

    Args:
        user_input_dict: 사용자 입력 데이터
        features: 전처리된 특징
        score: 만족도 점수
        satisfaction_level: 만족도 등급
        summary_text: 요약 텍스트
        recommendations: 추천 사항
        breakdown: 점수 breakdown

    Returns:
        텍스트 리포트
    """
    report_lines = []

    # 헤더
    report_lines.append("=" * 60)
    report_lines.append("보청기 만족도 예측 리포트")
    report_lines.append("=" * 60)
    report_lines.append(f"생성 일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("")

    # 섹션 1: 입력 정보
    report_lines.append("-" * 60)
    report_lines.append("1. 환자 정보")
    report_lines.append("-" * 60)
    report_lines.append(f"좌측 청력 (PTA): {user_input_dict.get('audiogram_left_pta', 'N/A')} dB HL")
    report_lines.append(f"우측 청력 (PTA): {user_input_dict.get('audiogram_right_pta', 'N/A')} dB HL")
    report_lines.append(f"평균 청력 (PTA): {features.get('pta_avg', 'N/A'):.1f} dB HL")
    report_lines.append(f"청력 손실 수준: {features.get('loss_level', 'N/A')}")
    report_lines.append(f"좌우 비대칭: {features.get('asymmetry_db', 'N/A'):.1f} dB")
    report_lines.append(f"어음명료도: {user_input_dict.get('speech_score', 'N/A')}%")
    report_lines.append(f"연령: {user_input_dict.get('age', 'N/A')}세")
    report_lines.append(f"생활 환경: {user_input_dict.get('lifestyle', 'N/A')}")
    report_lines.append(f"보청기 경험: {'있음' if user_input_dict.get('experience') else '없음'}")
    report_lines.append(f"이명 증상: {'있음' if user_input_dict.get('tinnitus') else '없음'}")
    report_lines.append(f"희망 형태: {user_input_dict.get('desired_type', 'N/A')}")
    report_lines.append(f"예산 범위: {user_input_dict.get('budget', 'N/A')}")
    report_lines.append("")

    # 섹션 2: 예측 결과
    report_lines.append("-" * 60)
    report_lines.append("2. 만족도 예측 결과")
    report_lines.append("-" * 60)
    report_lines.append(f"예측 점수: {score}점 / 100점")
    report_lines.append(f"만족도 등급: {satisfaction_level}")
    report_lines.append("")

    # 섹션 3: 요약
    report_lines.append("-" * 60)
    report_lines.append("3. 예측 요약")
    report_lines.append("-" * 60)
    report_lines.append(summary_text)
    report_lines.append("")

    # 섹션 4: 추천 사항
    if recommendations:
        report_lines.append("-" * 60)
        report_lines.append("4. 추천 사항")
        report_lines.append("-" * 60)
        for i, rec in enumerate(recommendations, 1):
            report_lines.append(f"{i}. {rec}")
        report_lines.append("")

    # 섹션 5: 점수 구성 요소
    report_lines.append("-" * 60)
    report_lines.append("5. 점수 구성 요소")
    report_lines.append("-" * 60)
    for key, value in breakdown.items():
        if key in ["final_score", "unilateral_detail"]:
            continue
        # 숫자가 아닌 값은 건너뛰기
        if not isinstance(value, (int, float)):
            continue
        label = {
            "base": "기본 점수",
            "loss_level": "청력 손실 수준",
            "speech_score": "어음명료도",
            "lifestyle": "생활 환경",
            "experience": "보청기 경험",
            "tinnitus": "이명 증상",
            "asymmetry_penalty": "좌우 비대칭 페널티",
            "budget": "예산 범위",
            "type_fit": "보청기 형태 적합성",
            "age_adjustment": "연령 조정",
            "unilateral_penalty": "단측 착용 페널티"
        }.get(key, key)
        sign = "+" if value > 0 else ""
        report_lines.append(f"  {label}: {sign}{value}점")
    report_lines.append("")

    # 푸터
    report_lines.append("=" * 60)
    report_lines.append("본 리포트는 규칙 기반 예측 모델로 생성되었습니다.")
    report_lines.append("실제 만족도는 개인차가 있을 수 있으며,")
    report_lines.append("전문가와의 상담을 권장드립니다.")
    report_lines.append("=" * 60)

    return "\n".join(report_lines)


def generate_json_report(
    user_input_dict: dict,
    features: dict,
    score: int,
    satisfaction_level: str,
    summary_text: str,
    recommendations: list[str],
    breakdown: dict
) -> str:
    """
    JSON 형식 리포트 생성

    Args:
        user_input_dict: 사용자 입력 데이터
        features: 전처리된 특징
        score: 만족도 점수
        satisfaction_level: 만족도 등급
        summary_text: 요약 텍스트
        recommendations: 추천 사항
        breakdown: 점수 breakdown

    Returns:
        JSON 문자열
    """
    report_data = {
        "report_metadata": {
            "generated_at": datetime.now().isoformat(),
            "version": "1.0.0",
            "model_type": "rule-based"
        },
        "patient_info": {
            "audiogram_left_pta": user_input_dict.get('audiogram_left_pta'),
            "audiogram_right_pta": user_input_dict.get('audiogram_right_pta'),
            "pta_avg": features.get('pta_avg'),
            "loss_level": features.get('loss_level'),
            "asymmetry_db": features.get('asymmetry_db'),
            "speech_score": user_input_dict.get('speech_score'),
            "age": user_input_dict.get('age'),
            "lifestyle": user_input_dict.get('lifestyle'),
            "experience": user_input_dict.get('experience'),
            "tinnitus": user_input_dict.get('tinnitus'),
            "desired_type": user_input_dict.get('desired_type'),
            "budget": user_input_dict.get('budget')
        },
        "prediction": {
            "score": score,
            "satisfaction_level": satisfaction_level,
            "summary": summary_text,
            "recommendations": recommendations,
            "breakdown": breakdown
        }
    }

    return json.dumps(report_data, ensure_ascii=False, indent=2)
