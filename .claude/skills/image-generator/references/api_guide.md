# AI Image Generation API Guide

## Google Gemini

### Overview
Google Gemini는 텍스트와 이미지를 함께 생성할 수 있는 멀티모달 AI 모델입니다. 무료 티어를 제공하며, 한국어 프롬프트도 잘 이해합니다.

### API Endpoint
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

### Available Models

| Model | Description | Use Case |
|-------|-------------|----------|
| `gemini-3-pro-image-preview` | 최신 Pro 모델 (기본값) | 고품질 이미지 생성, 최대 4K |
| `gemini-2.0-flash-preview-image-generation` | Flash 모델 | 빠른 이미지 생성 |

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contents` | array | Yes | 프롬프트 텍스트 |
| `generationConfig.responseModalities` | array | Yes | `["TEXT", "IMAGE"]` |

### Pricing
- **무료 티어**: 15 RPM, 1500 RPD
- **Pay-as-you-go**: 사용량 기반 과금

### Example Request
```python
import requests
import base64

api_key = "YOUR_GOOGLE_API_KEY"
model = "gemini-3-pro-image-preview"

response = requests.post(
    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    headers={
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    },
    json={
        "contents": [{
            "parts": [{"text": "A serene mountain landscape at sunrise"}]
        }],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"]
        }
    }
)

result = response.json()
for part in result["candidates"][0]["content"]["parts"]:
    if "inlineData" in part:
        image_data = base64.b64decode(part["inlineData"]["data"])
        with open("output.png", "wb") as f:
            f.write(image_data)
```

### 한국어 프롬프트 예시
```python
# Gemini는 한국어를 잘 이해합니다
prompts = [
    "해질녘 서울 도심의 스카이라인",
    "전통 한옥 마을의 봄 풍경",
    "미래형 AI 교육 플랫폼 인터페이스"
]
```

---

## OpenAI DALL-E 3

### Overview
DALL-E 3는 OpenAI의 최신 이미지 생성 모델로, 자연어 프롬프트를 정확하게 이해하고 고품질 이미지를 생성합니다.

### API Endpoint
```
POST https://api.openai.com/v1/images/generations
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | `dall-e-3` |
| `prompt` | string | Yes | 이미지 설명 (최대 4000자) |
| `n` | integer | No | 생성할 이미지 수 (1만 지원) |
| `size` | string | No | `1024x1024`, `1792x1024`, `1024x1792` |
| `quality` | string | No | `standard`, `hd` |
| `response_format` | string | No | `url`, `b64_json` |

### Pricing (2024 기준)
- Standard 1024x1024: $0.040/image
- Standard 1024x1792, 1792x1024: $0.080/image
- HD 1024x1024: $0.080/image
- HD 1024x1792, 1792x1024: $0.120/image

### Example Request
```python
import requests

response = requests.post(
    "https://api.openai.com/v1/images/generations",
    headers={
        "Authorization": "Bearer $OPENAI_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "model": "dall-e-3",
        "prompt": "A serene landscape with mountains",
        "size": "1024x1024",
        "quality": "hd"
    }
)
```

---

## Stability AI

### Overview
Stability AI의 Stable Diffusion 3는 오픈소스 기반의 강력한 이미지 생성 모델입니다.

### API Endpoints

**Stable Image Core:**
```
POST https://api.stability.ai/v2beta/stable-image/generate/core
```

**Stable Diffusion 3:**
```
POST https://api.stability.ai/v2beta/stable-image/generate/sd3
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | string | 이미지 설명 |
| `negative_prompt` | string | 제외할 요소 |
| `aspect_ratio` | string | `1:1`, `16:9`, `21:9`, `2:3`, `3:2`, `4:5`, `5:4`, `9:16`, `9:21` |
| `output_format` | string | `png`, `jpeg`, `webp` |

### Pricing
- Core: $0.03/image
- SD3 Large: $0.065/image
- SD3 Large Turbo: $0.04/image

### Example Request
```python
import requests

response = requests.post(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    headers={
        "Authorization": "Bearer $STABILITY_API_KEY",
        "Accept": "image/*"
    },
    files={"none": ""},
    data={
        "prompt": "A futuristic cityscape",
        "aspect_ratio": "16:9",
        "output_format": "png"
    }
)
```

---

## Replicate

### Overview
Replicate는 다양한 오픈소스 AI 모델을 API로 제공하는 플랫폼입니다.

### Popular Models

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| `flux-schnell` | Fast | Good | 빠른 프로토타이핑 |
| `flux-dev` | Medium | High | 고품질 이미지 |
| `sdxl` | Medium | High | 다양한 스타일 |
| `playground-v2.5` | Fast | Good | 일반 용도 |

### API Endpoint
```
POST https://api.replicate.com/v1/models/{model}/predictions
```

### Example Request
```python
import requests
import time

# Create prediction
response = requests.post(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
    headers={
        "Authorization": "Bearer $REPLICATE_API_TOKEN",
        "Content-Type": "application/json"
    },
    json={
        "input": {
            "prompt": "A beautiful sunset",
            "num_outputs": 1
        }
    }
)

prediction = response.json()

# Poll for result
while prediction["status"] not in ["succeeded", "failed"]:
    time.sleep(1)
    response = requests.get(
        prediction["urls"]["get"],
        headers={"Authorization": "Bearer $REPLICATE_API_TOKEN"}
    )
    prediction = response.json()

# Get image URL
image_url = prediction["output"][0]
```

### Pricing
- Pay per second of compute time
- Typical image: $0.003 - $0.05 depending on model

---

## Best Practices

### Prompt Engineering

**Good Prompts:**
```
"A photorealistic image of a modern tech startup office,
natural lighting, employees collaborating around a whiteboard,
4K resolution, professional photography style"
```

**Bad Prompts:**
```
"office"  # Too vague
```

### Prompt Structure
1. **Subject**: What is the main focus?
2. **Style**: Photorealistic, illustration, oil painting, etc.
3. **Lighting**: Natural, studio, dramatic, soft
4. **Composition**: Close-up, wide shot, bird's eye view
5. **Quality modifiers**: 4K, high detail, professional

### Rate Limits

| Provider | Rate Limit |
|----------|------------|
| Gemini | 15 RPM / 1500 RPD (free) |
| OpenAI | 7 images/min (tier 1) |
| Stability | 150 requests/10 sec |
| Replicate | Varies by model |

### Error Handling

```python
try:
    image = generate_image(prompt)
except requests.HTTPError as e:
    if e.response.status_code == 429:
        # Rate limit - wait and retry
        time.sleep(60)
        image = generate_image(prompt)
    elif e.response.status_code == 400:
        # Content policy violation
        print("Prompt violates content policy")
    else:
        raise
```

---

## Content Policies

All providers have content policies that prohibit:
- Violence and gore
- Adult/sexual content
- Hate speech or discrimination
- Real person likeness without consent
- Copyright infringement

Always review provider-specific policies before generating images.
