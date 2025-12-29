# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

사업계획서 및 신청서 등 공식 문서 자동화 프로젝트. PDF 양식을 파싱하여 마크다운으로 변환하고, AI 에이전트 파이프라인을 통해 고품질 문서를 생성한 뒤 최종 Word 문서로 출력한다.

## 디렉토리 구조

```
RAG_doc/
├── SSOT_docs/           # 사용자 기업 정보 및 사업 내용 (Single Source of Truth)
├── Program_docs/        # 지원사업 공고문 및 양식 파일 (PDF)
├── images/              # 생성된 이미지 저장소
│   └── [프로젝트명]/    # 프로젝트별 하위 폴더 (예: LearnAI_예비창업패키지/)
│       ├── 01_이미지명.png
│       ├── 02_이미지명.png
│       └── ...
├── .claude/
│   ├── agents/          # AI 에이전트 정의
│   └── skills/          # 재사용 가능한 스킬
└── .env                 # API 키 (GOOGLE_API_KEY 등)
```

## 문서 작성 워크플로우

사업계획서 작성 요청 시 다음 순서로 진행:

### 1. 정보 수집
- `@SSOT_docs`: 사용자 기업 정보 및 사업 내용 확인
- `@Program_docs`: 공고문과 양식 파일 확인

### 2. PDF 양식 변환 (양식이 PDF인 경우)
```bash
# pdf-to-markdown 스킬 사용
# Read 도구로 PDF 읽기 → 마크다운 구조로 변환
```
출력: `[파일명]_converted.md`

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
```bash
# .env에서 GOOGLE_API_KEY 로드 필요
python3 .claude/skills/image-generator/scripts/generate_image.py \
  --prompt "장면 설명형 프롬프트 (키워드 나열 X)" \
  --provider gemini \
  --output ./images/[프로젝트명]/01_이미지명.png
```

**⚠️ 이미지 저장 규칙 (필수)**:
- `images/` 하위에 프로젝트별 폴더 생성 (예: `images/LearnAI_예비창업패키지/`)
- 파일명은 순번_이미지명 형식: `01_organization.png`, `02_market_size.png`
- 순번은 2자리 숫자로 패딩: `01`, `02`, ... `10`, `11`

**프롬프트 핵심 원칙**:
- 장면을 설명하라, 키워드를 나열하지 마라
- 한글 텍스트는 따옴표로 명시: `'제목 텍스트'`
- 레이아웃 위치 구체적 지정

### 6. 최종 문서 생성
- 이미지 경로가 반영된 최종 `.md` 문서 작성
- docx 스킬로 Word 문서 변환

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
| `docx/` | 마크다운을 Word 문서로 변환 |

## 필수 명령어

### 이미지 생성
```bash
# 환경변수 로드 후 실행
source .env

# 프로젝트 폴더 생성 후 순번_이름 형식으로 저장
mkdir -p ./images/프로젝트명/
python3 .claude/skills/image-generator/scripts/generate_image.py \
  --prompt "프롬프트" \
  --provider gemini \
  --output ./images/프로젝트명/01_이미지명.png
```

### Word 문서 변환 (docx 스킬)
```bash
# docx-js 사용 (Node.js)
node .claude/skills/docx/scripts/create_docx.js input.md output.docx

# 또는 pandoc
pandoc input.md -o output.docx
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

## API 설정

`.env` 파일에 API 키 설정:
```bash
GOOGLE_API_KEY=your-key-here  # Gemini 이미지 생성용
```

## 품질 체크리스트

문서 완성 전 확인:
- [ ] 각 섹션 최소 분량 충족
- [ ] Mermaid 다이어그램 5개 이상
- [ ] 이미지 생성 가이드라인 2개 이상
- [ ] 모든 이미지 생성 완료
- [ ] 이미지 경로 최종 문서에 반영
- [ ] Word 문서 변환 완료
