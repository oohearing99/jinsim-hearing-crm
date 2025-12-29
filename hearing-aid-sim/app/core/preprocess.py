"""
데이터 전처리 모듈
입력 데이터의 정규화 및 변환
"""

from typing import Literal
from core.schema import UserInput


# 청력 손실 수준 분류 기준 (dB HL)
LOSS_LEVEL_THRESHOLDS = {
    "mild": (0, 40),
    "moderate": (40, 55),
    "severe": (55, 70),
    "profound": (70, 120)
}


def classify_loss_level(pta: float) -> Literal["mild", "moderate", "severe", "profound"]:
    """
    PTA 값을 기준으로 청력 손실 수준 분류

    Args:
        pta: 순음청력역치 평균 (dB HL)

    Returns:
        청력 손실 수준 (mild/moderate/severe/profound)
    """
    if pta < 40:
        return "mild"
    elif pta < 55:
        return "moderate"
    elif pta < 70:
        return "severe"
    else:
        return "profound"


def preprocess_inputs(user_input: UserInput) -> dict:
    """
    사용자 입력을 예측 엔진에 사용할 특징(feature)으로 변환

    Args:
        user_input: 검증된 사용자 입력 데이터

    Returns:
        dict: 전처리된 특징 딕셔너리
    """
    # 좌우 평균 PTA 계산
    pta_avg = (user_input.audiogram_left_pta + user_input.audiogram_right_pta) / 2

    # 좌우 어음명료도 평균 계산
    speech_score_avg = (user_input.speech_score_left + user_input.speech_score_right) / 2

    # 청력 손실 수준 분류
    loss_level = classify_loss_level(pta_avg)

    # 비대칭 값 (이미 UserInput에서 계산됨)
    asymmetry_db = user_input.asymmetry_db

    # 특징 딕셔너리 구성
    features = {
        # 청력 관련
        "pta_avg": pta_avg,
        "pta_left": user_input.audiogram_left_pta,
        "pta_right": user_input.audiogram_right_pta,
        "loss_level": loss_level,
        "asymmetry_db": asymmetry_db,
        "speech_score": speech_score_avg,
        "speech_score_left": user_input.speech_score_left,
        "speech_score_right": user_input.speech_score_right,

        # 주파수별 청력 데이터 (청력도 그래프용)
        "audiogram_left_250hz": user_input.audiogram_left_250hz,
        "audiogram_left_500hz": user_input.audiogram_left_500hz,
        "audiogram_left_1000hz": user_input.audiogram_left_1000hz,
        "audiogram_left_2000hz": user_input.audiogram_left_2000hz,
        "audiogram_left_4000hz": user_input.audiogram_left_4000hz,
        "audiogram_left_8000hz": user_input.audiogram_left_8000hz,
        "audiogram_right_250hz": user_input.audiogram_right_250hz,
        "audiogram_right_500hz": user_input.audiogram_right_500hz,
        "audiogram_right_1000hz": user_input.audiogram_right_1000hz,
        "audiogram_right_2000hz": user_input.audiogram_right_2000hz,
        "audiogram_right_4000hz": user_input.audiogram_right_4000hz,
        "audiogram_right_8000hz": user_input.audiogram_right_8000hz,

        # 플래그
        "tinnitus": user_input.tinnitus,
        "experience": user_input.experience,

        # 환경 및 선호도
        "lifestyle": user_input.lifestyle,
        "budget": user_input.budget,
        "desired_type": user_input.desired_type,
        "fitting_plan": user_input.fitting_plan,

        # 기타
        "age": user_input.age
    }

    return features


def get_loss_level_description(loss_level: str) -> str:
    """
    청력 손실 수준에 대한 한글 설명 반환

    Args:
        loss_level: 청력 손실 수준

    Returns:
        한글 설명
    """
    descriptions = {
        "mild": "경도 난청 (< 40 dB)",
        "moderate": "중등도 난청 (40~55 dB)",
        "severe": "고도 난청 (55~70 dB)",
        "profound": "심도 난청 (> 70 dB)"
    }
    return descriptions.get(loss_level, loss_level)


def get_feature_summary(features: dict) -> dict:
    """
    전처리된 특징의 요약 정보 생성 (화면 표시용)

    Args:
        features: 전처리된 특징 딕셔너리

    Returns:
        화면 표시용 요약 딕셔너리
    """
    fitting_plan_desc = {
        "bilateral": "양측 착용",
        "unilateral_left": "좌측 단측",
        "unilateral_right": "우측 단측"
    }

    return {
        "평균 PTA": f"{features['pta_avg']:.1f} dB HL",
        "청력 손실 수준": get_loss_level_description(features['loss_level']),
        "좌우 비대칭": f"{features['asymmetry_db']:.1f} dB",
        "평균 어음명료도": f"{features['speech_score']:.1f}%",
        "좌측 어음명료도": f"{features['speech_score_left']}%",
        "우측 어음명료도": f"{features['speech_score_right']}%",
        "연령": f"{features['age']}세",
        "생활 환경": features['lifestyle'],
        "보청기 경험": "있음" if features['experience'] else "없음",
        "이명 증상": "있음" if features['tinnitus'] else "없음",
        "희망 형태": features['desired_type'],
        "예산": features['budget'],
        "착용 계획": fitting_plan_desc.get(features['fitting_plan'], features['fitting_plan'])
    }
