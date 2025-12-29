"""
예측 결과 요약 모듈
예측 점수를 바탕으로 텍스트 요약 생성
"""


def generate_summary(score: int, features: dict, breakdown: dict) -> str:
    """
    만족도 예측 결과를 사용자 친화적인 텍스트로 요약

    Args:
        score: 예측 만족도 점수 (0~100)
        features: 전처리된 특징 딕셔너리
        breakdown: 점수 breakdown 딕셔너리

    Returns:
        요약 텍스트 (3~6문장)
    """
    sentences = []

    # 1. 기본 만족도 메시지
    if score >= 85:
        level_desc = "매우 높은"
        expectation = "보청기 사용에 큰 만족을 느끼실 것으로 예상됩니다"
    elif score >= 70:
        level_desc = "높은"
        expectation = "보청기 적응 과정이 비교적 순조로울 것으로 예상됩니다"
    elif score >= 55:
        level_desc = "보통 수준의"
        expectation = "꾸준한 착용과 조정을 통해 만족도를 높일 수 있습니다"
    elif score >= 40:
        level_desc = "다소 낮은"
        expectation = "초기 적응에 어려움이 있을 수 있으나, 전문가 상담과 조정으로 개선 가능합니다"
    else:
        level_desc = "낮은"
        expectation = "전문가와의 긴밀한 상담이 필요하며, 기대치 조정과 맞춤 상담을 권장드립니다"

    sentences.append(f"예상 만족도는 **{score}점**으로, {level_desc} 수준입니다. {expectation}.")

    # 2. 현실적인 목표 안내
    loss_level = features['loss_level']
    if loss_level in ['severe', 'profound']:
        sentences.append(
            "보청기는 완전한 정상 청력 회복이 아닌, **대화 이해도 개선과 의사소통 피로 감소**를 목표로 합니다."
        )
    else:
        sentences.append(
            "보청기 착용을 통해 **일상 대화의 명료도 향상과 사회적 참여 개선**을 기대할 수 있습니다."
        )

    # 3. 조건부 안내 - 생활 환경
    if features['lifestyle'] == 'noisy':
        sentences.append(
            "⚠️ 시끄러운 환경에서는 보청기만으로 완벽한 청취가 어려울 수 있습니다. "
            "추후 소음 프로그램 조정과 환경 최적화가 중요합니다."
        )
    elif features['lifestyle'] == 'quiet':
        sentences.append(
            "✅ 조용한 환경 위주로 생활하시기 때문에 보청기 효과를 더 잘 느끼실 수 있습니다."
        )

    # 4. 조건부 안내 - 어음명료도
    if features['speech_score'] < 50:
        sentences.append(
            "💡 어음 인지가 낮은 경우, 처음에는 소리가 '또렷하다'보다 '익숙해지는 과정'이 더 중요합니다. "
            "2~4주 적응 기간 동안 꾸준한 착용을 권장드립니다."
        )

    # 5. 조건부 안내 - 이명
    if features['tinnitus']:
        sentences.append(
            "🔔 이명 증상이 있으시므로, 이명 완화 기능(화이트노이즈 등)을 갖춘 보청기나 "
            "전문가 상담을 함께 고려하시면 좋습니다."
        )

    # 6. 조건부 안내 - 첫 사용자
    if not features['experience']:
        sentences.append(
            "📅 보청기를 처음 사용하시는 경우, **첫 2~4주 적응 기간이 장기 만족도를 크게 좌우**합니다. "
            "하루 착용 시간을 점진적으로 늘리고, 불편함이 있다면 즉시 조정 받으시길 권장합니다."
        )
    else:
        sentences.append(
            "✅ 보청기 사용 경험이 있으시므로 새 보청기 적응이 비교적 빠를 것으로 예상됩니다."
        )

    # 7. 조건부 안내 - 단측 착용
    fitting_plan = features.get('fitting_plan', 'bilateral')
    unilateral_detail = breakdown.get('unilateral_detail', {})
    is_unilateral = unilateral_detail.get('is_unilateral', False)

    if is_unilateral:
        sentences.append(
            "⚠️ **단측 착용을 선택하신 경우**, 양측 난청 상태에서는 방향감 저하, 소음 환경 청취력 감소 등으로 "
            "만족도가 낮아질 수 있습니다. 양측 착용으로 변경 시 개선 가능성이 있으므로 전문가 상담 후 결정하시길 권장합니다."
        )

    # 8. 조건부 안내 - 좌우 비대칭
    if features['asymmetry_db'] > 20:
        sentences.append(
            "⚖️ 좌우 청력 차이가 크므로, 양측 보청기 착용 시 균형 조정에 시간이 필요할 수 있습니다."
        )

    # 9. 조건부 안내 - 보청기 형태 적합성
    type_fit_score = breakdown.get('type_fit', 0)
    if type_fit_score < 0:
        desired_type_map = {
            'BTE': '귀걸이형',
            'RIC': '오픈형',
            'ITE': '귓속형',
            'CIC': '초소형'
        }
        type_name = desired_type_map.get(features['desired_type'], features['desired_type'])
        sentences.append(
            f"⚠️ 희망하신 {type_name} 보청기는 현재 청력 상태에 최적이 아닐 수 있습니다. "
            f"전문가와 상담하여 더 적합한 형태를 고려해보시길 권장합니다."
        )

    # 최대 6문장으로 제한
    return " ".join(sentences[:6])


def generate_recommendations(score: int, features: dict, breakdown: dict) -> list[str]:
    """
    만족도 점수와 특징을 기반으로 추천 사항 생성

    Args:
        score: 예측 만족도 점수 (0~100)
        features: 전처리된 특징 딕셔너리
        breakdown: 점수 breakdown 딕셔너리

    Returns:
        추천 사항 리스트
    """
    recommendations = []

    # 1. 점수 범위별 기본 추천
    if score >= 85:
        recommendations.append("현재 조건에서 보청기 만족도가 높을 것으로 예상됩니다. 정기 점검을 통해 최적 상태를 유지하세요.")
    elif score >= 70:
        recommendations.append("좋은 만족도가 예상됩니다. 초기 적응 기간 동안 불편함이 있다면 즉시 조정 받으세요.")
    elif score >= 55:
        recommendations.append("적응 기간을 충분히 가지고, 전문가와 정기적으로 상담하며 점진적으로 개선하세요.")
    else:
        recommendations.append("전문가와의 긴밀한 상담이 필요합니다. 기대치를 현실적으로 조정하고, 맞춤 상담을 받으세요.")

    # 2. 청력 손실 수준별
    loss_level = features['loss_level']
    if loss_level == 'profound':
        recommendations.append("심도 난청의 경우, 인공와우 등 다른 청각 재활 방법도 함께 고려해보시길 권장합니다.")
    elif loss_level == 'mild':
        recommendations.append("경도 난청의 경우, 일상 대화에서 큰 개선 효과를 느끼실 수 있습니다.")

    # 3. 어음명료도
    if features['speech_score'] < 40:
        recommendations.append("어음 인지가 낮은 경우, 청능 훈련(재활 프로그램)을 병행하면 효과를 높일 수 있습니다.")

    # 4. 생활 환경
    if features['lifestyle'] == 'noisy':
        recommendations.append("소음 환경에서는 지향성 마이크 기능이 있는 고급 모델을 고려하세요.")

    # 5. 첫 사용자
    if not features['experience']:
        recommendations.append("첫 2주간은 하루 2~4시간부터 시작해, 점진적으로 착용 시간을 늘리세요.")

    # 6. 예산
    if features['budget'] == 'low' and score < 60:
        recommendations.append("예산이 제한적이라면, 보조금 지원 프로그램을 먼저 확인해보세요.")

    # 7. 이명
    if features['tinnitus']:
        recommendations.append("이명 관리를 위해 이명 재훈련 치료(TRT)나 음향 치료를 병행하면 도움이 됩니다.")

    # 8. 단측 착용 관련
    unilateral_detail = breakdown.get('unilateral_detail', {})
    if unilateral_detail.get('is_unilateral', False):
        recommendations.append(
            "양측 난청에서 단측 착용은 방향감 상실, 소음 환경 청취력 저하 등의 문제가 발생할 수 있습니다. "
            "가능하다면 양측 착용을 재고해보시길 권장합니다."
        )

    return recommendations[:5]  # 최대 5개
