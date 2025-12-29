---
name: image-generator
description: This skill should be used when generating images from text prompts using AI image generation APIs. Supports Google Gemini, OpenAI DALL-E 3, Stability AI, and Replicate. API keys are stored securely in environment variables and excluded from distribution.
---

# Image Generator

AI 이미지 생성 스킬. 텍스트 프롬프트로부터 이미지를 생성합니다.

## Supported Providers

| Provider | Model | Environment Variable |
|----------|-------|---------------------|
| **Google Gemini** | gemini-3-pro-image-preview | `GOOGLE_API_KEY` |
| OpenAI | DALL-E 3 | `OPENAI_API_KEY` |
| Stability AI | Stable Diffusion 3 | `STABILITY_API_KEY` |
| Replicate | FLUX, SDXL 등 | `REPLICATE_API_TOKEN` |

## Prerequisites

API 키를 환경 변수로 설정:

```bash
# .env 파일 사용 (프로젝트 루트에 생성, .gitignore에 추가)
GOOGLE_API_KEY=your-google-api-key-here
OPENAI_API_KEY=sk-your-key-here
STABILITY_API_KEY=sk-your-key-here
REPLICATE_API_TOKEN=r8_your-token-here
```

또는 직접 export:
```bash
export GOOGLE_API_KEY="your-google-api-key-here"
```

## Usage

### Basic Generation

```bash
# Google Gemini (추천 - 무료 티어 제공)
python scripts/generate_image.py \
  --prompt "A futuristic city skyline at sunset" \
  --provider gemini \
  --output ./output.png

# OpenAI DALL-E 3
python scripts/generate_image.py \
  --prompt "A futuristic city skyline at sunset" \
  --provider openai \
  --output ./output.png

# Stability AI
python scripts/generate_image.py \
  --prompt "Oil painting of a coastal village" \
  --provider stability \
  --output painting.png

# Replicate (FLUX)
python scripts/generate_image.py \
  --prompt "Minimalist logo design" \
  --provider replicate \
  --model "black-forest-labs/flux-schnell" \
  --output logo.png
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--prompt` | 이미지 설명 텍스트 | Required |
| `--output` | 출력 파일 경로 | `./generated_image.png` |
| `--size` | 이미지 크기 | `1024x1024` |
| `--quality` | 품질 (standard, hd) | `standard` |
| `--provider` | API 제공자 | `openai` |
| `--model` | 특정 모델 지정 | provider 기본값 |

### Size Options by Provider

**Google Gemini:**
- 자동 크기 조정 (프롬프트 기반)

**OpenAI DALL-E 3:**
- `1024x1024` (정사각형)
- `1792x1024` (가로형)
- `1024x1792` (세로형)

**Stability AI:**
- `1024x1024`, `1152x896`, `896x1152` 등

## Workflow Examples

### 사업계획서용 이미지 생성

```bash
# 서비스 개념도
python scripts/generate_image.py \
  --prompt "Educational AI platform interface, modern UI, clean design" \
  --size 1792x1024 \
  --quality hd \
  --output ./images/service_concept.png

# 시장 성장 시각화
python scripts/generate_image.py \
  --prompt "Growth chart visualization, upward trend, professional infographic style" \
  --output ./images/market_growth.png
```

### 배치 생성

```python
# Python에서 직접 사용
from scripts.generate_image import generate_image

prompts = [
    "Modern office workspace with AI technology",
    "Team collaboration in tech startup",
    "Mobile app interface mockup"
]

for i, prompt in enumerate(prompts):
    generate_image(prompt, output=f"./images/batch_{i}.png")
```

## Security

- API 키는 환경 변수에서만 로드
- `.env` 파일은 스킬 패키징에서 제외
- `.env.example`만 배포하여 사용자가 직접 키 설정

## Error Handling

| Error | Solution |
|-------|----------|
| `API key not found` | 환경 변수 설정 확인 |
| `Rate limit exceeded` | 잠시 후 재시도 |
| `Content policy violation` | 프롬프트 수정 |
| `Invalid size` | 지원되는 크기 옵션 사용 |

## References

상세 API 문서: `references/api_guide.md`
