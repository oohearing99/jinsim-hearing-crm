"""
데이터 스키마 정의
Pydantic을 사용한 입력/출력 데이터 검증
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class UserInput(BaseModel):
    """보청기 만족도 예측을 위한 사용자 입력 데이터"""

    # 청력도 - 주파수별 청력역치 (선택적, 입력 시 PTA 자동 계산)
    audiogram_left_250hz: Optional[float] = Field(None, ge=0, le=120, description="좌측 250Hz 청력역치 (dB HL)")
    audiogram_left_500hz: Optional[float] = Field(None, ge=0, le=120, description="좌측 500Hz 청력역치 (dB HL)")
    audiogram_left_1000hz: Optional[float] = Field(None, ge=0, le=120, description="좌측 1000Hz 청력역치 (dB HL)")
    audiogram_left_2000hz: Optional[float] = Field(None, ge=0, le=120, description="좌측 2000Hz 청력역치 (dB HL)")
    audiogram_left_4000hz: Optional[float] = Field(None, ge=0, le=120, description="좌측 4000Hz 청력역치 (dB HL)")
    audiogram_left_8000hz: Optional[float] = Field(None, ge=0, le=120, description="좌측 8000Hz 청력역치 (dB HL)")

    audiogram_right_250hz: Optional[float] = Field(None, ge=0, le=120, description="우측 250Hz 청력역치 (dB HL)")
    audiogram_right_500hz: Optional[float] = Field(None, ge=0, le=120, description="우측 500Hz 청력역치 (dB HL)")
    audiogram_right_1000hz: Optional[float] = Field(None, ge=0, le=120, description="우측 1000Hz 청력역치 (dB HL)")
    audiogram_right_2000hz: Optional[float] = Field(None, ge=0, le=120, description="우측 2000Hz 청력역치 (dB HL)")
    audiogram_right_4000hz: Optional[float] = Field(None, ge=0, le=120, description="우측 4000Hz 청력역치 (dB HL)")
    audiogram_right_8000hz: Optional[float] = Field(None, ge=0, le=120, description="우측 8000Hz 청력역치 (dB HL)")

    # 청력도 (PTA: Pure Tone Average) - 주파수별 입력 시 자동 계산됨
    audiogram_left_pta: Optional[float] = Field(
        None,
        ge=0,
        le=120,
        description="좌측 순음청력역치 평균 (dB HL)"
    )
    audiogram_right_pta: Optional[float] = Field(
        None,
        ge=0,
        le=120,
        description="우측 순음청력역치 평균 (dB HL)"
    )

    # 어음인지도
    speech_score_left: int = Field(
        ...,
        ge=0,
        le=100,
        description="좌측 어음명료도 점수 (%)"
    )
    speech_score_right: int = Field(
        ...,
        ge=0,
        le=100,
        description="우측 어음명료도 점수 (%)"
    )

    # 나이
    age: int = Field(
        ...,
        ge=0,
        le=110,
        description="연령 (세)"
    )

    # 생활 환경
    lifestyle: Literal["quiet", "mixed", "noisy"] = Field(
        ...,
        description="주 생활 환경 (조용함/혼합/시끄러움)"
    )

    # 보청기 사용 경험
    experience: bool = Field(
        ...,
        description="보청기 사용 경험 여부"
    )

    # 이명 증상
    tinnitus: bool = Field(
        ...,
        description="이명 증상 여부"
    )

    # 좌우 청력 비대칭
    asymmetry_db: Optional[float] = Field(
        None,
        ge=0,
        le=120,
        description="좌우 PTA 차이 (dB) - 자동 계산 가능"
    )

    # 희망 보청기 타입
    desired_type: Literal["BTE", "RIC", "ITE", "CIC"] = Field(
        ...,
        description="희망 보청기 형태"
    )

    # 예산 범위
    budget: Literal["low", "mid", "high"] = Field(
        ...,
        description="예산 범위 (저/중/고)"
    )

    # 착용 계획
    fitting_plan: Literal["bilateral", "unilateral_left", "unilateral_right"] = Field(
        ...,
        description="보청기 착용 계획 (양측/좌측단측/우측단측)"
    )

    # 추가 정보 (레포트용, 선택 사항)
    customer_name: Optional[str] = Field(
        None,
        description="고객명 또는 고객번호"
    )
    main_complaints: Optional[list[str]] = Field(
        default_factory=list,
        description="주요 불편 상황"
    )
    wearing_goal: Optional[str] = Field(
        None,
        description="착용 목표"
    )

    @field_validator('audiogram_left_pta', 'audiogram_right_pta')
    @classmethod
    def validate_pta(cls, v: Optional[float]) -> Optional[float]:
        """PTA 값 검증"""
        if v is None:
            return v
        if v < 0 or v > 120:
            raise ValueError("청력역치는 0~120 dB HL 범위여야 합니다.")
        return v

    @field_validator('speech_score_left', 'speech_score_right')
    @classmethod
    def validate_speech_score(cls, v: int) -> int:
        """어음인지도 검증"""
        if v < 0 or v > 100:
            raise ValueError("어음명료도는 0~100% 범위여야 합니다.")
        return v

    @field_validator('age')
    @classmethod
    def validate_age(cls, v: int) -> int:
        """나이 검증"""
        if v < 0 or v > 110:
            raise ValueError("나이는 0~110세 범위여야 합니다.")
        if v < 10:
            raise ValueError("10세 미만은 상담이 어렵습니다. 전문의 상담을 권장합니다.")
        return v

    @model_validator(mode='after')
    def calculate_pta_and_asymmetry(self) -> 'UserInput':
        """주파수별 데이터로부터 PTA 자동 계산 및 좌우 청력 비대칭 자동 계산"""
        # 좌측 PTA 계산 (500Hz, 1000Hz, 2000Hz, 4000Hz 평균)
        if self.audiogram_left_pta is None:
            left_freqs = [
                self.audiogram_left_500hz,
                self.audiogram_left_1000hz,
                self.audiogram_left_2000hz,
                self.audiogram_left_4000hz
            ]
            # 모든 주파수 데이터가 있는 경우에만 계산
            if all(f is not None for f in left_freqs):
                self.audiogram_left_pta = sum(left_freqs) / 4
            else:
                raise ValueError("좌측 청력 데이터가 부족합니다. 500Hz, 1000Hz, 2000Hz, 4000Hz 값을 모두 입력하거나 PTA 값을 직접 입력하세요.")

        # 우측 PTA 계산
        if self.audiogram_right_pta is None:
            right_freqs = [
                self.audiogram_right_500hz,
                self.audiogram_right_1000hz,
                self.audiogram_right_2000hz,
                self.audiogram_right_4000hz
            ]
            if all(f is not None for f in right_freqs):
                self.audiogram_right_pta = sum(right_freqs) / 4
            else:
                raise ValueError("우측 청력 데이터가 부족합니다. 500Hz, 1000Hz, 2000Hz, 4000Hz 값을 모두 입력하거나 PTA 값을 직접 입력하세요.")

        # 비대칭 계산
        if self.asymmetry_db is None:
            self.asymmetry_db = abs(self.audiogram_left_pta - self.audiogram_right_pta)

        return self

    def get_display_dict(self) -> dict:
        """화면 표시용 딕셔너리"""
        lifestyle_map = {
            "quiet": "조용한 환경",
            "mixed": "혼합 환경",
            "noisy": "시끄러운 환경"
        }
        type_map = {
            "BTE": "귀걸이형 (BTE)",
            "RIC": "오픈형 (RIC)",
            "ITE": "귓속형 (ITE)",
            "CIC": "초소형 (CIC)"
        }
        budget_map = {
            "low": "경제형 (100~200만원)",
            "mid": "중급형 (200~400만원)",
            "high": "고급형 (400만원 이상)"
        }
        fitting_plan_map = {
            "bilateral": "양측 착용",
            "unilateral_left": "좌측 단측 착용",
            "unilateral_right": "우측 단측 착용"
        }

        return {
            "좌측 청력 (PTA)": f"{self.audiogram_left_pta:.1f} dB HL",
            "우측 청력 (PTA)": f"{self.audiogram_right_pta:.1f} dB HL",
            "좌우 비대칭": f"{self.asymmetry_db:.1f} dB",
            "좌측 어음명료도": f"{self.speech_score_left}%",
            "우측 어음명료도": f"{self.speech_score_right}%",
            "연령": f"{self.age}세",
            "생활 환경": lifestyle_map.get(self.lifestyle, self.lifestyle),
            "사용 경험": "있음" if self.experience else "없음",
            "이명 증상": "있음" if self.tinnitus else "없음",
            "희망 형태": type_map.get(self.desired_type, self.desired_type),
            "예산 범위": budget_map.get(self.budget, self.budget),
            "착용 계획": fitting_plan_map.get(self.fitting_plan, self.fitting_plan)
        }


class PredictionOutput(BaseModel):
    """만족도 예측 결과 (Phase C에서 사용 예정)"""
    satisfaction_score: float = Field(
        ...,
        ge=0,
        le=100,
        description="예측 만족도 점수 (0~100%)"
    )
    confidence: float = Field(
        ...,
        ge=0,
        le=1,
        description="예측 신뢰도 (0~1)"
    )
    summary: str = Field(
        ...,
        description="예측 요약 텍스트"
    )
    recommendations: list[str] = Field(
        default_factory=list,
        description="추천 사항 목록"
    )
