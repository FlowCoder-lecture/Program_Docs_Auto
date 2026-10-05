# Program_Docs_Auto

고객사의 정부지원사업 신청서·사업계획서, 인증 서류(벤처확인·메인비즈·녹색기술·기업개요표 등), 견적서를 만드는 작업 폴더. 입력은 기업 자료와 공고·양식, 산출물은 `outputs/<고객>_<프로그램>/` 아래 .md·.docx·.hwpx·.pdf. 원본은 Mini `~/AX/Program_Docs_Auto`(Syncthing 동기). git origin 은 `https://github.com/FlowCoder-lecture/Program_Docs_Auto` 이지만 마지막 커밋이 2025-12-30 이라 그 뒤 작업은 대부분 미커밋이다.

## 절대 규칙

- 사업계획서 작업에서 아래 파이프라인 단계를 임의로 생략하지 않는다. 생략은 사용자가 "~는 생략해"라고 명시했을 때만.
- 양식 파싱 없이 본문을 쓰지 않는다. 지원사업마다 섹션·필수 항목·분량이 달라 양식을 무시하면 감점·탈락이다.

## 사업계획서 파이프라인

| 단계 | 도구 | 산출물 (`outputs/<고객>_<프로그램>/`) |
|---|---|---|
| 1. 양식 파싱 (최우선) | `pdf-to-markdown` 스킬 또는 Read | `양식_converted.md` |
| 2. 시장조사 | `deep-research` 에이전트 | `시장조사_보고서.md` |
| 3. 작성 | `business-plan-writer` 에이전트 (파싱한 양식 구조 그대로) | `사업계획서.md` |
| 4. 이미지 | `image-generator` 에이전트 (Mermaid PNG + AI 이미지) | `images/mermaid_NN_*.png`, `images/NN_*.png` (NN 은 2자리) |
| 5. 변환 | `mark-docx` 스킬 (Word) / HWPX 는 아래 주의 참고 | `사업계획서.docx` |

- 기본 품질 기준: 섹션당 500~800자 이상, Mermaid 다이어그램 5개 이상(pie·flowchart·gantt·quadrantChart·graph TB), AI 이미지 2개 이상(2025-12 기준 — HWPX 건은 Mermaid 대신 HTML 픽토그램을 썼다, 메모리 lessons_hwpx_workflow.md). 완료 체크리스트·단계별 읽기 전략 전문은 archive(아래 참조).
- 에이전트는 `Agent` 도구로 부른다(옛 문서의 "Task 도구"와 같은 것).

## 실행 명령

```bash
mkdir -p outputs/<고객>_<프로그램>/images

# Mermaid → PNG (Word·HWPX 는 Mermaid 를 렌더하지 못한다)
mmdc -i diagram.mmd -o outputs/<고객>_<프로그램>/images/mermaid_01_설명.png -b white

# AI 이미지 — 기본 provider openrouter, 스크립트가 ~/.claude/.env → ./.env 순으로 직접 읽는다(source 불필요)
python3 .claude/skills/image-generator/scripts/generate_image.py \
  --prompt "장면 설명형 프롬프트(키워드 나열 X, 한글 문구는 따옴표)" \
  --output outputs/<고객>_<프로그램>/images/01_설명.png

# Markdown → Word (이미지 자동 임베딩)
node .claude/skills/mark-docx/scripts/md-to-docx.js <in.md> <out.docx> --images-dir=<images 폴더>

# Word 표 검증 — MERGED 가 나오면 연속 표가 병합된 것
python3 -c "import sys; from docx import Document; [print(('OK ' if len({len(r.cells) for r in t.rows})==1 else 'MERGED ')+f'표 {i+1}: {len(t.rows)}행') for i,t in enumerate(Document(sys.argv[1]).tables)]" <file.docx>
```

## 구조 (비자명한 것만)

- `SSOT_docs/<고객>/` — 고객사 기업정보 SSOT(기업정보_<고객>.md·과거 계획서·증명서). 작성 단계에서 필요한 섹션만 읽는다.
- `Company_docs/<고객>/` — 고객이 보낸 원자료(증명서·사진·보완요청서 등). SSOT 로 정리하기 전 원본.
- `Program_docs/<프로그램>/` — 공고문·양식(PDF·HWP·HWPX·DOCX)과 샘플.
- 루트의 `기업정보_빈템플릿.md`·`기업정보_예시.md` — 새 고객 SSOT 작성 템플릿(SSOT_docs 에서 루트로 옮겨졌고 미커밋).
- `tasks/` — 건별 작업 체크리스트(todo-<건>.md).
- `.claude/agents/` 4종은 같은 이름의 전역 `~/.claude/agents/` 보다 우선한다(Claude Code 문서 기준, 10-04 기준 4개 모두 내용이 다름). 고칠 때 어느 쪽인지 확인. `.claude/skills/` = pdf-to-markdown·image-generator·mark-docx·hwpx-editor.
- 벤처확인·연구소 인증 건의 작업 폴더는 `~/AX/venture`·`~/AX/RnD` 다. 진행 상황은 이 폴더의 메모리가 함께 관리한다.

## 주의 (gotcha)

- 대용량 문서를 한 번에 읽지 않는다. PDF 는 Read `pages`("1-10", 한 번에 최대 20쪽), 공고문·양식 요약과 SSOT 추출은 서브에이전트에 맡기고 요약만 받는다. 중간 결과는 outputs 에 저장하고, 다음 단계는 원본 대신 그 파일(`양식_converted.md`·`시장조사_보고서.md`)을 본다. 양식 파싱 단계에서는 SSOT·공고문을 읽지 않는다.
- 연속 표는 Word 변환 때 병합된다. 모든 표 앞에 `### 제목` 이나 `**설명**` 줄을 두고, 빈 표는 `*해당 없음*` 으로 바꾼다(md-to-docx.js 는 열 수가 바뀔 때만 자동 분리). 표 안 이미지는 깨진다.
- Mermaid 코드 블록은 PNG 로 변환한 뒤 최종 .md 에서 이미지 참조로 교체한다.
- HWPX: 신규 작성은 md2hwpx(jkf87/hwpx-skill)+이미지 임베드, 양식 셀 채우기만 `hwpx-editor`. lxml 저장 시 XML 선언 수동 prepend·ZIP 엔트리 순서 보존, 텍스트를 바꾼 뒤 `linesegarray` 제거(메모리 lessons_hwpx_workflow.md·hwpx_integrity.md).
- 고객·평가기관에 나가는 문장: 수치는 1차 원문과 대조한 뒤 쓰고, 신청서 내용 인용은 제출본 화면 기준, 인명·생년은 공적 서류 기준. 선행특허·FTO 분석은 내부 메모로만 둔다(메모리 lessons.md).
- 리서치 서브에이전트를 병렬로 돌리면 WebSearch 세션 한도가 바닥난다. 수치 검증은 보고서에 달린 원문 URL 을 WebFetch 로 연다.
- 메일 발송·외부 제출은 실행 직전 사용자 확인.
- `.env`(GOOGLE_API_KEY·OPENROUTER_API_KEY·OPENAI_API_KEY 등, gitignore 대상) — 값은 출력하지 않는다. 키 이름은 `.env.example`·메모리 api_keys.md.
- **원격 `FlowCoder-lecture/Program_Docs_Auto` 는 PUBLIC 이다**(2026-10-04 `gh repo view` 확인). 작업 트리에 고객 개인정보(증명서·4대보험 명부·고객별 SSOT_docs/Company_docs/outputs)가 미커밋으로 쌓여 있다 — `git add -A` 금지, 고객 자료는 어떤 경우에도 커밋하지 않는다. 현재 추적 100파일에는 고객 자료 없음(템플릿·예시만). 하드 레이어(10-05): `.gitignore` 가 `Company_docs/`·`SSOT_docs/*/`·`Program_docs/*/`·`outputs/*/`(LearnAI 예시 제외)·`tasks/` 를 막는다 — 폴더 직속 공고 PDF·템플릿만 추적 대상. private 전환은 조직 admin 권한이라 flowcoder25 로는 불가.
- `/Volumes/포터블/AX/Program_Docs_Auto` 는 옛 사본이다(outputs 가 2026-05-07 에서 멈춤, 10-04 확인). 편집은 `~/AX/Program_Docs_Auto` 에서만.

## 참조

- 옛 CLAUDE.md 전문(단계별 읽기 전략·서브에이전트 프롬프트 예시·완료 체크리스트·표 규칙 예시): `docs/CLAUDE-archive-2026-10.md`
- 메모리(진행 중 고객 건·교훈): `~/.claude/projects/-Users-jerome-AX-Program-Docs-Auto/memory/MEMORY.md`
- Mermaid 변환·이미지 프롬프트 상세: `.claude/agents/image-generator.md` / 작성 규칙: `.claude/agents/business-plan-writer.md`
