# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🚨 절대 규칙: 워크플로우 생략 금지

**사용자의 명시적 요청이 없는 한, 워크플로우의 어떤 단계도 생략하지 않는다.**

| 규칙 | 설명 |
|------|------|
| ❌ 금지 | 임의로 단계 생략, 에이전트 미사용, 스킬 건너뛰기 |
| ✅ 허용 | 사용자가 "~는 생략해", "~는 안해도 돼"라고 명시한 경우만 |

**위반 시 문제점:**
- **PDF 양식 파싱 생략 → 양식 구조 무시, 필수 항목 누락, 심사 탈락**
- 시장조사 생략 → 데이터 근거 없는 허술한 계획서
- 이미지 생성 생략 → Word 문서에 빈 공간만 남음
- 에이전트 미사용 → 품질 저하, 양식 불일치

---

## 🧠 컨텍스트 효율화 규칙 (필수)

**대용량 문서는 한꺼번에 읽지 않는다. 단계별로 필요한 문서/섹션만 선택적으로 읽는다.**

### 단계별 문서 읽기 전략

| 단계 | 읽어야 할 문서 | 읽지 않는 문서 |
|------|---------------|---------------|
| 1. PDF 양식 파싱 | `Program_docs/양식*.pdf` (해당 양식만) | SSOT_docs 전체, 공고문 |
| 2. 시장 조사 | 없음 (웹 리서치 수행) | SSOT_docs, Program_docs |
| 3. 사업계획서 작성 | `SSOT_docs/` (필요 섹션만), `양식_converted.md` | 원본 PDF |
| 4. 이미지 생성 | 사업계획서.md (Mermaid 블록만) | SSOT_docs, Program_docs |
| 5. 문서 변환 | 없음 (명령어 실행만) | 모든 원본 문서 |

### 대용량 문서 처리 규칙

```
┌─────────────────────────────────────────────────────────┐
│  🚨 컨텍스트 제한 방지 규칙                               │
│                                                         │
│  1. 전체 읽기 금지: 50페이지 이상 PDF는 섹션 단위로 읽기   │
│  2. 순차적 처리: 한 단계 완료 후 다음 단계 문서 읽기       │
│  3. 중간 결과 저장: 각 단계 완료 시 outputs/에 저장       │
│  4. 이전 결과 참조: 원본 대신 변환된 마크다운 참조         │
└─────────────────────────────────────────────────────────┘
```

### PDF 선택적 읽기 방법

```bash
# ❌ 잘못된 방법: 전체 PDF 한번에 읽기
Read Program_docs/공고문.pdf  # 컨텍스트 폭발!

# ✅ 올바른 방법: 섹션/페이지 단위로 읽기
Read Program_docs/양식.pdf --offset 1 --limit 10   # 1-10페이지만
Read Program_docs/양식.pdf --offset 11 --limit 10  # 11-20페이지만
```

### SSOT 문서 선택적 읽기

```bash
# ❌ 잘못된 방법: SSOT 폴더 전체 읽기
# 모든 SSOT_docs/* 파일을 한번에 읽음

# ✅ 올바른 방법: 필요한 정보만 읽기
# 1. 먼저 파일 목록 확인
ls SSOT_docs/

# 2. 작성 중인 섹션에 필요한 파일만 읽기
# - "사업개요" 작성 시 → 기업정보_템플릿.md
# - "기술개발" 작성 시 → 기술설명서.md
# - "시장분석" 작성 시 → 시장조사_보고서.md (이미 생성된 것)
```

### 이미 생성된 결과물 활용

| 상황 | 원본 대신 참조할 문서 |
|------|---------------------|
| 양식 구조 필요 | `outputs/.../양식_converted.md` (원본 PDF 아님) |
| 시장 데이터 필요 | `outputs/.../시장조사_보고서.md` (웹 재검색 아님) |
| 이미지 목록 필요 | `outputs/.../images/` 폴더 목록 (마크다운 재파싱 아님) |

### 🚀 서브에이전트 위임 전략 (권장)

**대용량 문서는 서브에이전트가 읽고, 핵심 정보만 메인에 반환한다.**

```
┌─────────────────────────────────────────────────────────┐
│  💡 서브에이전트 위임의 장점                              │
│                                                         │
│  1. 메인 컨텍스트 절약: 원본 대신 요약 결과만 수신        │
│  2. 병렬 처리: 여러 문서를 동시에 읽고 처리 가능          │
│  3. 전문성: 각 에이전트가 특화된 작업 수행                │
└─────────────────────────────────────────────────────────┘
```

#### 서브에이전트 위임 패턴

| 작업 | 서브에이전트 | 프롬프트 예시 |
|------|-------------|--------------|
| PDF 양식 구조 추출 | `general-purpose` | "이 PDF의 섹션 구조와 필수 입력 항목만 마크다운으로 정리해줘" |
| 공고문 핵심 요약 | `general-purpose` | "이 공고문에서 지원자격, 평가기준, 제출서류만 추출해줘" |
| SSOT 정보 추출 | `general-purpose` | "기업정보 문서에서 사업개요 섹션 작성에 필요한 정보만 추출해줘" |
| 시장 조사 | `deep-research` | "AI 교육 시장의 TAM/SAM/SOM 데이터 조사해줘" |

#### 실제 사용 예시

```python
# ❌ 잘못된 방법: 메인에서 직접 대용량 PDF 읽기
Read("Program_docs/공고문_50페이지.pdf")  # 컨텍스트 50% 소모!

# ✅ 올바른 방법: 서브에이전트에게 위임
Task(
    subagent_type="general-purpose",
    prompt="""
    Program_docs/공고문.pdf를 읽고 다음 정보만 추출해서 반환해:
    1. 사업 개요 (100자 이내)
    2. 지원 자격 요건 (목록)
    3. 평가 기준 및 배점
    4. 제출 서류 목록
    5. 일정 (접수, 발표 등)

    원본 텍스트는 포함하지 말고, 구조화된 요약만 반환해.
    """,
    description="공고문 핵심 정보 추출"
)
# → 메인 컨텍스트에는 요약 결과만 수신 (컨텍스트 5% 소모)
```

#### 단계별 서브에이전트 활용

```yaml
1_양식_파싱:
  agent: general-purpose
  input: "Program_docs/양식.pdf"
  output: "섹션 구조 + 필수 항목 마크다운"
  결과저장: "outputs/.../양식_converted.md"

2_공고문_요약:
  agent: general-purpose
  input: "Program_docs/공고문.pdf"
  output: "지원자격, 평가기준 요약"
  결과저장: "outputs/.../공고문_요약.md"

3_시장조사:
  agent: deep-research
  input: "조사 주제 (SSOT에서 추출한 사업 분야)"
  output: "TAM/SAM/SOM + 경쟁사 분석"
  결과저장: "outputs/.../시장조사_보고서.md"

4_사업계획서_작성:
  agent: business-plan-writer
  input: "양식_converted.md + 시장조사_보고서.md + SSOT 핵심정보"
  output: "사업계획서.md"
  # 이 단계에서만 SSOT 읽기 (필요한 섹션만)
```

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

### 필수 작업 순서 (반드시 이 순서대로!)

1. **🔴 PDF 양식 파싱 (최우선)**: Program_docs의 신청서/양식 PDF → 마크다운 변환
   - `pdf-to-markdown` 스킬 또는 Read 도구로 PDF 구조 추출
   - 출력: `outputs/[프로젝트명]/양식_converted.md`
   - **이 단계 없이 사업계획서 작성 금지!**

2. **시장 조사**: `deep-research` 에이전트로 TAM/SAM/SOM, 경쟁사 분석 수행

3. **사업계획서 작성**: `business-plan-writer` 에이전트로 **파싱된 양식 구조에 맞춰** 문서 작성

4. **이미지 생성**: `image-generator` 에이전트로 Mermaid 변환 및 AI 이미지 생성

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

**🚨 모든 단계를 순서대로 완료해야 합니다. 임의 생략 금지!**

사업계획서 작성 요청 시 다음 순서로 진행:

### 1. 정보 수집 (선택적 읽기!)

**⚠️ 모든 문서를 한번에 읽지 않는다!**

```bash
# Step 1: 파일 목록만 먼저 확인
ls Program_docs/
ls SSOT_docs/

# Step 2: 양식 파싱 단계에서는 양식 PDF만 읽기
# (공고문, SSOT는 이 단계에서 읽지 않음)

# Step 3: 사업계획서 작성 단계에서 SSOT 필요 섹션만 읽기
```

### 2. 🔴 PDF 양식 파싱 (최우선 필수 단계)

```
┌─────────────────────────────────────────────────────────┐
│  🚨 경고: 이 단계를 건너뛰면 안 됩니다!                    │
│                                                         │
│  PDF 양식 파싱 없이 사업계획서 작성 = 양식 불일치 = 탈락   │
└─────────────────────────────────────────────────────────┘
```

**왜 필수인가?**
- 지원사업마다 양식 구조가 다름
- 필수 항목, 섹션 순서, 분량 요구사항이 PDF에 명시됨
- 양식 무시하면 심사에서 불이익

**실행 방법:**

```bash
# 1. Program_docs에서 양식 PDF 확인
ls Program_docs/*.pdf

# 2. PDF 읽고 구조 추출
# Read 도구로 PDF 읽기 → 섹션별 구조화

# 3. 마크다운으로 변환하여 저장
outputs/[프로젝트명]_[프로그램명]/양식_converted.md
```

**변환 결과물 예시:**
```markdown
## 1. 사업개요
**[입력: 사업명, 대표자, 사업기간...]**

## 2. 기술개발 내용
**[입력: 개발 목표, 추진 전략...]**
(최소 800자 이상 작성)
```

**다음 단계 연결:**
- 변환된 `양식_converted.md`의 구조를 그대로 따라 사업계획서 작성
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

## 워크플로우 완료 체크리스트 (필수)

**🚨 아래 모든 항목을 완료해야 작업 종료. 사용자 명시적 생략 요청 없이는 스킵 금지!**

### 에이전트/스킬 사용 체크 (순서대로!)
- [ ] **🔴 1순위: PDF 양식 파싱** → `양식_converted.md` 생성
- [ ] 2순위: `deep-research` 에이전트 → 시장조사 완료
- [ ] 3순위: `business-plan-writer` 에이전트 → 사업계획서 초안 작성
- [ ] 4순위: `image-generator` 에이전트 → 이미지 생성 완료
- [ ] 5순위: `mark-docx` 스킬 → Word 문서 변환

### 산출물 체크
- [ ] **🔴 양식 변환 결과 (`양식_converted.md`)** ← 이게 없으면 다음 단계 진행 금지!
- [ ] 시장조사 보고서 (`시장조사_보고서.md`)
- [ ] 사업계획서 마크다운 (`사업계획서.md`)
- [ ] Mermaid 다이어그램 PNG 변환 (5개 이상)
- [ ] AI 생성 이미지 (2개 이상)
- [ ] 최종 Word 문서 (`사업계획서.docx`)

### 품질 체크
- [ ] 각 섹션 최소 분량 충족 (500-800자)
- [ ] **⚠️ 표 안에 이미지 없음 확인** (표 안 이미지는 깨짐)
- [ ] **⚠️ 연속 표 분리 확인** (아래 규칙 참조)
- [ ] 이미지 경로 최종 문서에 반영
- [ ] 마크다운에서 Mermaid 코드 블록 → 이미지 참조로 교체

---

## ⚠️ 표 병합 방지 규칙 (CRITICAL)

**연속 배치된 표는 Word 변환 시 병합됩니다.** 반드시 표 사이에 제목/설명을 추가하세요.

### ✅ 올바른 패턴

```markdown
### 첫 번째 표 제목

| A | B |
|---|---|
| 1 | 2 |

### 두 번째 표 제목

| X | Y | Z |
|---|---|---|
| a | b | c |
```

### ❌ 잘못된 패턴 (표가 병합됨)

```markdown
| A | B |
|---|---|
| 1 | 2 |

| X | Y | Z |
|---|---|---|
| a | b | c |
```

### 표 구분 규칙 요약

| 규칙 | 설명 |
|------|------|
| 제목 필수 | 모든 표 앞에 `### 제목` 또는 `**설명**` 추가 |
| 빈 표 제거 | 데이터 없는 표는 `*해당 없음*` 텍스트로 대체 |
| 자동 분리 | `md-to-docx.js`가 컬럼 수 변경 감지 시 자동 분리 |

### Word 문서 표 검증 명령어

```bash
python3 -c "
from docx import Document
doc = Document('사업계획서.docx')
for i, t in enumerate(doc.tables):
    cols = [len(r.cells) for r in t.rows]
    print(f\"{'✅' if len(set(cols))==1 else '❌'} 표 {i+1}: {len(t.rows)}×{cols[0]}열\")
"
```
