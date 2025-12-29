# 보청기 상담용 만족도 예측 시뮬레이터 MVP

규칙 기반(Rule-based) 만족도 예측 시스템으로 시작하며, 향후 ML 모델로 확장 가능한 구조입니다.

## 로컬 실행 방법

### 1. 가상환경 생성
```bash
python -m venv .venv
```

### 2. 가상환경 활성화

**Windows:**
```bash
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

### 3. 패키지 설치
```bash
pip install -r requirements.txt
```

### 4. 애플리케이션 실행
```bash
streamlit run app/main.py
```

브라우저가 자동으로 열리며 `http://localhost:8501`에서 실행됩니다.

## 프로젝트 구조

```
hearing-aid-sim/
  README.md              # 프로젝트 설명 및 실행 가이드
  requirements.txt       # Python 패키지 의존성
  .gitignore            # Git 제외 파일 목록
  app/
    main.py             # Streamlit 메인 애플리케이션
    ui/
      components.py     # UI 컴포넌트
    core/
      schema.py         # 데이터 스키마 (Pydantic)
      preprocess.py     # 입력 데이터 전처리
      predictor.py      # 만족도 예측 로직
      summarizer.py     # 예측 결과 요약
    viz/
      charts.py         # 차트 시각화 (Plotly)
    data/
      weights.default.json  # 규칙 기반 가중치 설정
```

## 기술 스택

- **Streamlit**: 웹 UI 프레임워크
- **Pydantic**: 데이터 검증 및 스키마
- **Plotly**: 인터랙티브 차트
