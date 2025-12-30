# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ 필수: 에이전트 활용 지침

**사업계획서 작성 시 반드시 Task 도구를 사용하여 에이전트를 활용해야 합니다.**

### 에이전트 호출 방법

Claude Code의 `Task` 도구를 사용하여 다음 에이전트들을 호출하세요:

```
# 시장 조사 시
Task tool → subagent_type: "deep-research"

# 사업계획서 작성 시
Task tool → subagent_type: "business-plan-writer"

# 이미지 생성 시
Task tool → subagent_type: "image-generator"
```

### 필수 에이전트 활용 순서

1. **시장 조사**: `deep-research` 에이전트로 TAM/SAM/SOM, 경쟁사 분석 수행
2. **사업계획서 작성**: `business-plan-writer` 에이전트로 양식에 맞춘 문서 작성
3. **이미지 생성**: `image-generator` 에이전트로 Mermaid 변환 및 AI 이미지 생성

### 에이전트 미사용 시 문제점

- 시장 데이터 누락 또는 부정확
- 양식 요구사항 미충족
- 문서 품질 저하

**반드시 위 순서대로 에이전트를 활용하여 작업을 진행하세요.**

---

## 프로젝트 개요

사업계획서 및 신청서 등 공식 문서 자동화 프로젝트. PDF 양식을 파싱하여 마크다운으로 변환하고, AI 에이전트 파이프라인을 통해 고품질 문서를 생성한 뒤 최종 Word 문서로 출력한다.

## 디렉토리 구조

```
RAG_doc/
├── SSOT_docs/           # 사용자 기업 정보 및 사업 내용 (Single Source of Truth)
├── Program_docs/        # 지원사업 공고문 및 양식 파일 (PDF)
├── outputs/             # ⭐ 모든 결과물 저장소 (프로젝트별 폴더링)
│   └── [프로젝트명]_[프로그램명]/    # 예: LearnAI_예비창업패키지/
│       ├── 사업계획서.md            # 마크다운 원본
│       ├── 사업계획서.docx          # 최종 Word 문서
│       ├── 시장조사_보고서.md       # 시장 조사 결과
│       ├── 양식_converted.md       # PDF 양식 변환 결과
│       └── images/                 # 이미지 파일
│           ├── mermaid_01_*.png
│           └── 01_*.png
├── .claude/
│   ├── agents/          # AI 에이전트 정의
│   └── skills/          # 재사용 가능한 스킬
└── .env                 # API 키 (GOOGLE_API_KEY 등)
```

### 출력 경로 규칙 (필수)

모든 에이전트는 결과물을 `outputs/` 하위 프로젝트 폴더에 저장해야 합니다:

```bash
# 프로젝트 폴더 생성
mkdir -p outputs/[프로젝트명]_[프로그램명]/images/

# 예시
mkdir -p outputs/LearnAI_예비창업패키지/images/
```

## 문서 작성 워크플로우

사업계획서 작성 요청 시 다음 순서로 진행:

### 1. 정보 수집
- `@SSOT_docs`: 사용자 기업 정보 및 사업 내용 확인
- `@Program_docs`: 공고문과 양식 파일 확인

### 2. PDF 양식 변환 (필수 - PDF 양식이 있는 경우)

**⚠️ 이 단계는 선택이 아닌 필수입니다**

Program_docs에 PDF 신청서/양식이 있으면 반드시 변환:

```bash
# 1. PDF 파일 확인
ls Program_docs/*.pdf

# 2. pdf-to-markdown 스킬로 변환
# Read 도구로 PDF 읽기 → 구조화된 마크다운으로 변환

# 3. 출력 경로
outputs/[프로젝트명]_[프로그램명]/양식_converted.md
```

**변환 결과물 활용:**
- 변환된 양식의 섹션 구조를 그대로 따름
- `**[입력: ...]**` 표시된 필드에 SSOT 정보 채움
- 모든 필수 항목이 빠짐없이 작성되었는지 확인

### 3. 시장 조사
Deep Research Agent 실행하여 관련 조사 수행:
- 시장 규모 (TAM/SAM/SOM)
- 경쟁사 분석
- 산업 트렌드

### 4. 사업계획서 작성
Business Plan Agent가 양식에 맞춰 작성:
- 각 섹션 최소 500-800자 이상
- Mermaid 다이어그램 5개 이상 필수
- 이미지 생성 가이드라인 2개 이상 포함

### 5. 이미지 생성
Image Generator Agent로 모든 시각 자료 생성:

#### 5-1. Mermaid 다이어그램 → PNG 변환 (필수)
```bash
# Mermaid 코드 블록을 .mmd 파일로 추출 후 변환
mmdc -i diagram.mmd -o ./outputs/[프로젝트명]_[프로그램명]/images/mermaid_01_서비스플로우.png -b white

# Word에서는 Mermaid 문법이 렌더링되지 않으므로 반드시 이미지 변환 필요
```

#### 5-2. AI 이미지 생성 (인포그래픽 등)
```bash
# .env에서 GOOGLE_API_KEY 로드 필요
export GOOGLE_API_KEY="your-key"
python3 .claude/skills/image-generator/scripts/generate_image.py \
  --prompt "장면 설명형 프롬프트 (키워드 나열 X)" \
  --provider gemini \
  --output ./outputs/[프로젝트명]_[프로그램명]/images/01_이미지명.png
```

**⚠️ 이미지 저장 규칙 (필수)**:
- `outputs/[프로젝트명]_[프로그램명]/images/` 폴더에 저장
- 예: `outputs/LearnAI_예비창업패키지/images/`
- Mermaid 이미지: `mermaid_[순번]_[설명].png`
- AI 생성 이미지: `[순번]_[설명].png`
- 순번은 2자리 숫자로 패딩: `01`, `02`, ... `10`, `11`

**프롬프트 핵심 원칙**:
- 장면을 설명하라, 키워드를 나열하지 마라
- 한글 텍스트는 따옴표로 명시: `'제목 텍스트'`
- 레이아웃 위치 구체적 지정

### 6. 최종 문서 생성
- 이미지 경로가 반영된 최종 `.md` 문서 작성
- mark-docx 스킬로 Word 문서 변환 (이미지 자동 임베딩)

## 에이전트 (`.claude/agents/`)

| 에이전트 | 용도 |
|----------|------|
| `deep-research.md` | 심층 시장 조사, 병렬 리서치 실행 |
| `business-plan.md` | 사업계획서 작성, Mermaid 도식 생성 |
| `image-generator.md` | AI 이미지 생성 (Gemini API) |
| `research-agent.md` | 개별 리서치 태스크 수행 |

## 스킬 (`.claude/skills/`)

| 스킬 | 용도 |
|------|------|
| `pdf-to-markdown/` | PDF 양식을 마크다운으로 변환 |
| `image-generator/` | AI 이미지 생성 스크립트 |
| `mark-docx/` | 마크다운을 고품질 Word 문서로 변환 (docx-js 기반) |

## 필수 명령어

### 프로젝트 폴더 초기화
```bash
# 새 프로젝트 시작 시 먼저 출력 폴더 생성
mkdir -p ./outputs/[프로젝트명]_[프로그램명]/images/

# 예시
mkdir -p ./outputs/LearnAI_예비창업패키지/images/
```

### 이미지 생성
```bash
# 환경변수 로드 후 실행
source .env

# outputs 폴더 내 프로젝트 이미지 폴더에 저장
python3 .claude/skills/image-generator/scripts/generate_image.py \
  --prompt "프롬프트" \
  --provider gemini \
  --output ./outputs/[프로젝트명]_[프로그램명]/images/01_이미지명.png
```

### Word 문서 변환 (mark-docx 스킬)
```bash
# 고품질 마크다운 → DOCX 변환 (권장)
node .claude/skills/mark-docx/scripts/md-to-docx.js \
  ./outputs/[프로젝트명]_[프로그램명]/사업계획서.md \
  ./outputs/[프로젝트명]_[프로그램명]/사업계획서.docx \
  --images-dir=./outputs/[프로젝트명]_[프로그램명]/images

# 특징:
# - 한글 비즈니스 문서 최적화 (맑은 고딕)
# - 이미지 자동 임베딩
# - 테이블, 리스트, 체크박스 완벽 지원
# - 전문적인 스타일링 (헤더, 색상, 여백)
```

## Mermaid 다이어그램 필수 유형

사업계획서에 반드시 포함해야 하는 다이어그램:

| 유형 | 용도 |
|------|------|
| `pie` | 시장 규모 (TAM/SAM/SOM) |
| `flowchart` | 비즈니스 모델/서비스 플로우 |
| `gantt` | 개발 일정/마일스톤 |
| `quadrantChart` | 경쟁 포지셔닝 |
| `graph TB` | 조직 구조 |

## Mermaid 다이어그램 이미지 변환 (필수)

**⚠️ Word 문서 호환성**: Mermaid 문법은 Word에서 렌더링되지 않습니다. 최종 문서 생성 전 **반드시** PNG 이미지로 변환해야 합니다.

```bash
# 기본 변환 명령어
mmdc -i diagram.mmd -o ./outputs/[프로젝트명]_[프로그램명]/images/mermaid_01_설명.png -b white

# 모든 mmd 파일 일괄 변환
cd ./outputs/[프로젝트명]_[프로그램명]/images/
for f in *.mmd; do mmdc -i "$f" -o "${f%.mmd}.png" -b white; done
```

**상세 가이드**: `.claude/agents/image-generator.md` 참조

## API 설정

`.env` 파일에 API 키 설정:
```bash
GOOGLE_API_KEY=your-key-here  # Gemini 이미지 생성용
```

## 품질 체크리스트

문서 완성 전 확인:
- [ ] 각 섹션 최소 분량 충족
- [ ] Mermaid 다이어그램 5개 이상
- [ ] Mermaid 다이어그램 PNG 이미지 변환 완료 (Word 호환 필수)
- [ ] 이미지 생성 가이드라인 2개 이상
- [ ] AI 생성 이미지 완료 (인포그래픽 등)
- [ ] 마크다운에서 Mermaid 코드 블록 → 이미지 참조로 교체
- [ ] **⚠️ 표 안에 이미지 없음 확인** (표 안 이미지는 깨짐)
- [ ] 이미지 경로 최종 문서에 반영
- [ ] Word 문서 변환 완료
