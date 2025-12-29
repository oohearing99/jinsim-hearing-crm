"""
만족도 예측 모듈
규칙 기반 예측 알고리즘
"""

import json
from pathlib import Path
from typing import Tuple


def load_weights(weights_path: str = None) -> dict:
    """
    가중치 설정 파일 로드

    Args:
        weights_path: 가중치 파일 경로 (None이면 기본 파일 사용)

    Returns:
        가중치 딕셔너리
    """
    if weights_path is None:
        # 기본 가중치 파일 경로
        current_dir = Path(__file__).parent
        weights_path = current_dir / ".." / "data" / "weights.default.json"

    with open(weights_path, "r", encoding="utf-8") as f:
        weights = json.load(f)

    return weights


def calculate_speech_score_weight(speech_score: int, weights: dict) -> int:
    """
    어음명료도 점수에 따른 가중치 계산

    Args:
        speech_score: 어음명료도 점수 (0~100)
        weights: 가중치 설정

    Returns:
        해당 구간의 가중치
    """
    ranges = weights["speech_score_weights"]["ranges"]

    for range_config in ranges:
        if range_config["min"] <= speech_score <= range_config["max"]:
            return range_config["weight"]

    return 0


def calculate_age_adjustment(age: int, weights: dict) -> int:
    """
    연령대별 가중치 계산

    Args:
        age: 연령
        weights: 가중치 설정

    Returns:
        해당 연령대의 가중치
    """
    ranges = weights["age_adjustment"]["ranges"]

    for range_config in ranges:
        if range_config["min"] <= age <= range_config["max"]:
            return range_config["weight"]

    return 0


def calculate_asymmetry_penalty(asymmetry_db: float, weights: dict) -> int:
    """
    좌우 청력 비대칭에 따른 페널티 계산

    Args:
        asymmetry_db: 좌우 청력 차이 (dB)
        weights: 가중치 설정

    Returns:
        페널티 점수 (음수)
    """
    config = weights["asymmetry_penalty"]
    threshold = config["threshold_db"]

    if asymmetry_db <= threshold:
        return 0

    # 임계값 초과분
    excess_db = asymmetry_db - threshold
    # 10dB당 페널티
    penalty = int((excess_db / 10) * config["penalty_per_10db"])
    # 최대 페널티 제한
    max_penalty = config["max_penalty"]

    return max(penalty, max_penalty)


def clamp(value: float, min_val: float, max_val: float) -> float:
    """값을 min_val과 max_val 사이로 클램핑"""
    return max(min_val, min(max_val, value))


def calculate_unilateral_penalty(features: dict, weights: dict) -> Tuple[int, dict]:
    """
    단측 착용 시 페널티 계산 (양측 난청인데 단측 착용하는 경우)

    Args:
        features: 전처리된 특징 딕셔너리
        weights: 가중치 설정

    Returns:
        (페널티 점수, 상세 breakdown)
    """
    fitting_plan = features.get("fitting_plan", "bilateral")

    # 양측 착용이면 페널티 없음
    if fitting_plan == "bilateral":
        return 0, {
            "is_unilateral": False,
            "penalty": 0
        }

    config = weights["binaural"]
    pta_left = features["pta_left"]
    pta_right = features["pta_right"]
    asymmetry_db = features["asymmetry_db"]
    lifestyle = features["lifestyle"]
    experience = features["experience"]
    budget = features["budget"]

    threshold = config["pta_need_threshold_db"]

    # 1. binaural_need 계산
    left_need = clamp((pta_left - threshold) / 40, 0, 1)
    right_need = clamp((pta_right - threshold) / 40, 0, 1)
    need = (left_need + right_need) / 2

    # lifestyle 보너스
    if lifestyle == "noisy":
        need += config["noisy_env_need_bonus"]
    elif lifestyle == "mixed":
        need += config["mixed_env_need_bonus"]

    # 첫 착용 보너스
    if not experience:
        need += config["first_time_need_bonus"]

    # 0~1 클램프
    need = clamp(need, 0, 1)

    # 2. asymmetry_relief 계산
    start_db = config["asymmetry_relief_start_db"]
    full_db = config["asymmetry_relief_full_db"]

    if asymmetry_db <= start_db:
        relief = 0
    elif asymmetry_db >= full_db:
        relief = 1
    else:
        relief = (asymmetry_db - start_db) / (full_db - start_db)

    # 3. budget_relief
    budget_relief = config["low_budget_penalty_relief"] if budget == "low" else 0

    # 4. penalty 계산
    base_penalty = config["base_unilateral_penalty"]
    penalty = base_penalty * need * (1 - 0.7 * relief) * (1 - budget_relief)

    # 최대 페널티 제한
    max_penalty = config["max_unilateral_penalty"]
    penalty = clamp(penalty, 0, max_penalty)

    # 음수로 변환 (감점)
    penalty = -int(penalty)

    return penalty, {
        "is_unilateral": True,
        "fitting_plan": fitting_plan,
        "need": round(need, 2),
        "asymmetry_relief": round(relief, 2),
        "budget_relief": budget_relief,
        "penalty": penalty
    }


def predict_satisfaction(features: dict, weights: dict = None) -> Tuple[int, dict]:
    """
    규칙 기반 만족도 예측

    Args:
        features: 전처리된 특징 딕셔너리
        weights: 가중치 설정 (None이면 기본 파일 로드)

    Returns:
        (예측 점수 0~100, 점수 breakdown 딕셔너리)
    """
    if weights is None:
        weights = load_weights()

    # 점수 breakdown 초기화
    breakdown = {}

    # 1. 기본 점수
    score = weights["base_score"]
    breakdown["base"] = score

    # 2. 청력 손실 수준
    loss_level = features["loss_level"]
    loss_weight = weights["loss_level_weights"][loss_level]
    breakdown["loss_level"] = loss_weight
    score += loss_weight

    # 3. 어음명료도
    speech_weight = calculate_speech_score_weight(features["speech_score"], weights)
    breakdown["speech_score"] = speech_weight
    score += speech_weight

    # 4. 생활 환경
    lifestyle_weight = weights["lifestyle_weights"][features["lifestyle"]]
    breakdown["lifestyle"] = lifestyle_weight
    score += lifestyle_weight

    # 5. 보청기 사용 경험
    if features["experience"]:
        experience_weight = weights["experience_weight"]["has_experience"]
    else:
        experience_weight = weights["experience_weight"]["no_experience"]
    breakdown["experience"] = experience_weight
    score += experience_weight

    # 6. 이명 증상
    if features["tinnitus"]:
        tinnitus_weight = weights["tinnitus_weight"]["has_tinnitus"]
    else:
        tinnitus_weight = weights["tinnitus_weight"]["no_tinnitus"]
    breakdown["tinnitus"] = tinnitus_weight
    score += tinnitus_weight

    # 7. 좌우 비대칭 페널티
    asymmetry_penalty = calculate_asymmetry_penalty(features["asymmetry_db"], weights)
    breakdown["asymmetry_penalty"] = asymmetry_penalty
    score += asymmetry_penalty

    # 8. 예산
    budget_weight = weights["budget_weights"][features["budget"]]
    breakdown["budget"] = budget_weight
    score += budget_weight

    # 9. 보청기 형태 적합성
    type_weight = weights["type_mismatch_penalties"][loss_level][features["desired_type"]]
    breakdown["type_fit"] = type_weight
    score += type_weight

    # 10. 연령 조정
    age_weight = calculate_age_adjustment(features["age"], weights)
    breakdown["age_adjustment"] = age_weight
    score += age_weight

    # 11. 단측 착용 페널티 (양측 난청인데 단측 착용 시)
    unilateral_penalty, unilateral_detail = calculate_unilateral_penalty(features, weights)
    breakdown["unilateral_penalty"] = unilateral_penalty
    breakdown["unilateral_detail"] = unilateral_detail
    score += unilateral_penalty

    # 최종 점수 (0~100 범위로 클램핑)
    final_score = max(0, min(100, int(score)))
    breakdown["final_score"] = final_score

    return final_score, breakdown


def get_satisfaction_level(score: int) -> str:
    """
    만족도 점수를 등급으로 변환

    Args:
        score: 만족도 점수 (0~100)

    Returns:
        만족도 등급
    """
    if score >= 85:
        return "매우 높음"
    elif score >= 70:
        return "높음"
    elif score >= 55:
        return "보통"
    elif score >= 40:
        return "낮음"
    else:
        return "매우 낮음"


def get_breakdown_summary(breakdown: dict) -> list[dict]:
    """
    점수 breakdown을 화면 표시용 리스트로 변환

    Args:
        breakdown: 점수 breakdown 딕셔너리

    Returns:
        화면 표시용 리스트
    """
    # 항목명 한글 매핑
    labels = {
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
        "unilateral_penalty": "단측 착용 페널티",
        "final_score": "최종 점수"
    }

    summary = []
    for key, value in breakdown.items():
        if key in ["final_score", "unilateral_detail"]:
            continue  # 최종 점수와 상세 정보는 별도 표시

        label = labels.get(key, key)

        # 단측 착용 페널티는 숫자 타입인지 확인
        if isinstance(value, (int, float)):
            summary.append({
                "factor": label,
                "score": value,
                "sign": "+" if value > 0 else ""
            })

    return summary
