"""
예측 엔진 단위 테스트
"""

import pytest
from app.core.predictor import (
    predict_satisfaction,
    get_satisfaction_level,
    calculate_speech_score_weight,
    calculate_age_adjustment,
    calculate_asymmetry_penalty,
    load_weights
)


class TestPredictor:
    """예측 엔진 테스트"""

    def test_load_weights(self):
        """가중치 파일 로드 테스트"""
        weights = load_weights()
        assert weights is not None
        assert 'base_score' in weights
        assert weights['base_score'] == 50

    def test_predict_satisfaction_basic(self):
        """기본 예측 테스트"""
        features = {
            'pta_avg': 42.5,
            'pta_left': 40.0,
            'pta_right': 45.0,
            'loss_level': 'moderate',
            'asymmetry_db': 5.0,
            'speech_score': 75,
            'tinnitus': False,
            'experience': True,
            'lifestyle': 'mixed',
            'budget': 'mid',
            'desired_type': 'RIC',
            'age': 65
        }

        score, breakdown = predict_satisfaction(features)

        # 점수 범위 검증
        assert 0 <= score <= 100
        assert isinstance(breakdown, dict)
        assert 'final_score' in breakdown
        assert breakdown['final_score'] == score

    def test_predict_satisfaction_high_score(self):
        """높은 만족도 시나리오 테스트"""
        features = {
            'pta_avg': 35.0,
            'pta_left': 35.0,
            'pta_right': 35.0,
            'loss_level': 'mild',
            'asymmetry_db': 0.0,
            'speech_score': 90,
            'tinnitus': False,
            'experience': True,
            'lifestyle': 'quiet',
            'budget': 'high',
            'desired_type': 'RIC',
            'age': 60
        }

        score, breakdown = predict_satisfaction(features)

        # 높은 점수 예상
        assert score >= 80

    def test_predict_satisfaction_low_score(self):
        """낮은 만족도 시나리오 테스트"""
        features = {
            'pta_avg': 80.0,
            'pta_left': 75.0,
            'pta_right': 85.0,
            'loss_level': 'profound',
            'asymmetry_db': 10.0,
            'speech_score': 25,
            'tinnitus': True,
            'experience': False,
            'lifestyle': 'noisy',
            'budget': 'low',
            'desired_type': 'CIC',
            'age': 75
        }

        score, breakdown = predict_satisfaction(features)

        # 낮은 점수 예상
        assert score <= 60

    def test_get_satisfaction_level(self):
        """만족도 등급 변환 테스트"""
        assert get_satisfaction_level(90) == "매우 높음"
        assert get_satisfaction_level(75) == "높음"
        assert get_satisfaction_level(60) == "보통"
        assert get_satisfaction_level(45) == "낮음"
        assert get_satisfaction_level(30) == "매우 낮음"

    def test_calculate_speech_score_weight(self):
        """어음명료도 가중치 계산 테스트"""
        weights = load_weights()

        # 높은 점수 (86~100)
        weight_high = calculate_speech_score_weight(90, weights)
        assert weight_high == 15

        # 중간 점수 (51~70)
        weight_mid = calculate_speech_score_weight(60, weights)
        assert weight_mid == 5

        # 낮은 점수 (0~30)
        weight_low = calculate_speech_score_weight(20, weights)
        assert weight_low == -15

    def test_calculate_age_adjustment(self):
        """연령 조정 가중치 테스트"""
        weights = load_weights()

        # 61~75세 (가장 높은 가중치)
        weight_senior = calculate_age_adjustment(65, weights)
        assert weight_senior == 8

        # 10~40세
        weight_young = calculate_age_adjustment(30, weights)
        assert weight_young == 3

    def test_calculate_asymmetry_penalty(self):
        """비대칭 페널티 계산 테스트"""
        weights = load_weights()

        # 임계값 이하 (15dB)
        penalty_low = calculate_asymmetry_penalty(10.0, weights)
        assert penalty_low == 0

        # 임계값 초과
        penalty_high = calculate_asymmetry_penalty(25.0, weights)
        assert penalty_high < 0

        # 최대 페널티 제한
        penalty_max = calculate_asymmetry_penalty(100.0, weights)
        assert penalty_max >= -12

    def test_breakdown_completeness(self):
        """Breakdown 완전성 테스트"""
        features = {
            'pta_avg': 50.0,
            'pta_left': 50.0,
            'pta_right': 50.0,
            'loss_level': 'moderate',
            'asymmetry_db': 0.0,
            'speech_score': 70,
            'tinnitus': False,
            'experience': False,
            'lifestyle': 'mixed',
            'budget': 'mid',
            'desired_type': 'BTE',
            'age': 65
        }

        score, breakdown = predict_satisfaction(features)

        # 모든 요소가 breakdown에 포함되어야 함
        expected_keys = [
            'base',
            'loss_level',
            'speech_score',
            'lifestyle',
            'experience',
            'tinnitus',
            'asymmetry_penalty',
            'budget',
            'type_fit',
            'age_adjustment',
            'final_score'
        ]

        for key in expected_keys:
            assert key in breakdown, f"{key} not in breakdown"

    def test_score_clamping(self):
        """점수 클램핑 테스트 (0~100 범위)"""
        # 매우 긍정적인 시나리오
        features_positive = {
            'pta_avg': 30.0,
            'loss_level': 'mild',
            'asymmetry_db': 0.0,
            'speech_score': 95,
            'tinnitus': False,
            'experience': True,
            'lifestyle': 'quiet',
            'budget': 'high',
            'desired_type': 'RIC',
            'age': 65
        }

        score_positive, _ = predict_satisfaction(features_positive)
        assert 0 <= score_positive <= 100

        # 매우 부정적인 시나리오
        features_negative = {
            'pta_avg': 90.0,
            'loss_level': 'profound',
            'asymmetry_db': 40.0,
            'speech_score': 10,
            'tinnitus': True,
            'experience': False,
            'lifestyle': 'noisy',
            'budget': 'low',
            'desired_type': 'CIC',
            'age': 80
        }

        score_negative, _ = predict_satisfaction(features_negative)
        assert 0 <= score_negative <= 100


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
