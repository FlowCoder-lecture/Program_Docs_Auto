#!/usr/bin/env python3
"""
AI Image Generator Script
Supports: OpenAI DALL-E 3, Google Gemini, Stability AI, Replicate

Usage:
    python generate_image.py --prompt "A sunset over mountains" --output ./image.png
"""

import os
import sys
import argparse
import base64
import requests
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


# Gemini model options
GEMINI_MODELS = {
    "flash": "gemini-2.0-flash-preview-image-generation",
    "pro": "gemini-3-pro-image-preview",
}


def generate_gemini(
    prompt: str,
    model: str = "gemini-3-pro-image-preview",
    aspect_ratio: str = None
) -> bytes:
    """Generate image using Google Gemini API"""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")

    # Resolve model shorthand
    if model in GEMINI_MODELS:
        model = GEMINI_MODELS[model]

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    # Build generation config
    generation_config = {
        "responseModalities": ["TEXT", "IMAGE"]
    }

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": generation_config
    }

    response = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        },
        json=payload
    )
    response.raise_for_status()
    result = response.json()

    # Extract image from response
    candidates = result.get("candidates", [])
    if not candidates:
        raise RuntimeError("No image generated")

    for part in candidates[0].get("content", {}).get("parts", []):
        if "inlineData" in part:
            image_data = part["inlineData"]["data"]
            return base64.b64decode(image_data)

    raise RuntimeError("No image data in response")


def generate_openai(prompt: str, size: str = "1024x1024", quality: str = "standard") -> bytes:
    """Generate image using OpenAI DALL-E 3"""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    response = requests.post(
        "https://api.openai.com/v1/images/generations",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": size,
            "quality": quality,
            "response_format": "b64_json"
        }
    )
    response.raise_for_status()
    return base64.b64decode(response.json()["data"][0]["b64_json"])


def generate_stability(prompt: str, size: str = "1024x1024") -> bytes:
    """Generate image using Stability AI"""
    api_key = os.environ.get("STABILITY_API_KEY")
    if not api_key:
        raise ValueError("STABILITY_API_KEY environment variable not set")

    width, height = map(int, size.split("x"))

    response = requests.post(
        "https://api.stability.ai/v2beta/stable-image/generate/core",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "image/*"
        },
        files={"none": ""},
        data={
            "prompt": prompt,
            "output_format": "png",
            "width": width,
            "height": height
        }
    )
    response.raise_for_status()
    return response.content


def generate_replicate(prompt: str, model: str = "black-forest-labs/flux-schnell") -> bytes:
    """Generate image using Replicate"""
    api_token = os.environ.get("REPLICATE_API_TOKEN")
    if not api_token:
        raise ValueError("REPLICATE_API_TOKEN environment variable not set")

    # Create prediction
    response = requests.post(
        f"https://api.replicate.com/v1/models/{model}/predictions",
        headers={
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        },
        json={"input": {"prompt": prompt}}
    )
    response.raise_for_status()
    prediction = response.json()

    # Poll for completion
    import time
    while prediction["status"] not in ["succeeded", "failed", "canceled"]:
        time.sleep(1)
        response = requests.get(
            prediction["urls"]["get"],
            headers={"Authorization": f"Bearer {api_token}"}
        )
        prediction = response.json()

    if prediction["status"] != "succeeded":
        raise RuntimeError(f"Generation failed: {prediction.get('error')}")

    # Download image
    image_url = prediction["output"]
    if isinstance(image_url, list):
        image_url = image_url[0]

    img_response = requests.get(image_url)
    img_response.raise_for_status()
    return img_response.content


def generate_image(
    prompt: str,
    output: str = "./generated_image.png",
    size: str = "1024x1024",
    quality: str = "standard",
    provider: str = "openai",
    model: str = None
) -> str:
    """
    Generate an image from a text prompt.

    Args:
        prompt: Text description of the image
        output: Output file path
        size: Image dimensions (e.g., "1024x1024")
        quality: Image quality ("standard" or "hd")
        provider: API provider ("openai", "stability", "replicate")
        model: Specific model to use (optional)

    Returns:
        Path to the generated image
    """
    print(f"Generating image with {provider}...")
    print(f"Prompt: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")

    if provider == "openai":
        image_data = generate_openai(prompt, size, quality)
    elif provider == "gemini":
        image_data = generate_gemini(prompt, model or "gemini-3-pro-image-preview")
    elif provider == "stability":
        image_data = generate_stability(prompt, size)
    elif provider == "replicate":
        image_data = generate_replicate(prompt, model or "black-forest-labs/flux-schnell")
    else:
        raise ValueError(f"Unknown provider: {provider}")

    # Save image
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(image_data)

    print(f"Image saved to: {output_path.absolute()}")
    return str(output_path.absolute())


def main():
    parser = argparse.ArgumentParser(description="Generate images using AI")
    parser.add_argument("--prompt", "-p", required=True, help="Image description")
    parser.add_argument("--output", "-o", default="./generated_image.png", help="Output path")
    parser.add_argument("--size", "-s", default="1024x1024", help="Image size")
    parser.add_argument("--quality", "-q", default="standard", choices=["standard", "hd"])
    parser.add_argument("--provider", default="openai", choices=["openai", "gemini", "stability", "replicate"])
    parser.add_argument("--model", "-m", help="Specific model (for Replicate)")

    args = parser.parse_args()

    try:
        generate_image(
            prompt=args.prompt,
            output=args.output,
            size=args.size,
            quality=args.quality,
            provider=args.provider,
            model=args.model
        )
    except requests.HTTPError as e:
        print(f"API Error: {e.response.status_code} - {e.response.text}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
