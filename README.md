# Imagick

프리셋 DSL을 기반으로 단일 이미지를 생성하는 웹 편집기입니다.  
사용자는 프리셋을 선택하고, 프레임 안에서 사진과 텍스트를 직접 편집한 뒤, 스티커/배지/말풍선/이모지 같은 오버레이를 올려 최종 이미지를 저장할 수 있습니다.

현재 구현은 다음 원칙을 따릅니다.

- 프리셋은 선언형 DSL 문서로만 존재합니다.
- 캔버스는 프리셋 DSL을 직접 해석하지 않습니다.
- 프리셋은 먼저 `compiled model`로 변환된 뒤 렌더링과 편집에 사용됩니다.

## Features

- 프리셋 기반 이미지 편집
- 직접 프레임 위에서 텍스트 입력
- 이미지 슬롯 클릭 시 글라스모픽 입력 오버레이
- 이미지 입력 방식 3종
  - 파일 선택
  - 카메라 캡처
  - 클립보드 읽기
- 자유 오버레이 레이어
  - 스티커
  - 배지
  - 말풍선
  - 리액션 이모지
- 콘텐츠 영역만 잘라서 저장하는 export
- 텍스트 자동 대비 색상
- 프리셋 스타일 우선 텍스트 스코프 지원

## Tech Stack

- React 19
- TypeScript
- Vite
- HTML Canvas 2D

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

## Preset Flow

프로젝트의 핵심 흐름은 아래와 같습니다.

```text
preset.json
  -> validation
  -> preset compiler
  -> RenderModel / EditorModel / ExportModel
  -> canvas renderer + editor UI
```

### Why this matters

이 구조 덕분에:

- 새 프리셋 추가는 `preset.json` 추가로 처리할 수 있고
- 캔버스 UI는 프리셋 DSL 세부 구조를 몰라도 되며
- 렌더링과 편집 로직을 더 안전하게 분리할 수 있습니다

## Directory Overview

```text
src/
├─ assets/
├─ components/
├─ dsl-schema/
├─ lib/
│  ├─ preset-compiler/
│  ├─ overlay-editor.ts
│  ├─ preset-engine.ts
│  ├─ preset-library.ts
│  └─ preset-validation.ts
├─ presets/
├─ App.tsx
└─ main.tsx
```

## Key Modules

### `src/dsl-schema`

프리셋 DSL 타입 정의입니다.

- `types/commands.ts`: DSL 명령 타입
- `types/input.ts`: 입력 슬롯 타입
- `types/preset.ts`: 프리셋 문서 타입

### `src/lib/preset-library.ts`

로컬 프리셋 JSON을 로드하고 앱에서 사용할 수 있는 목록으로 제공합니다.

### `src/lib/preset-validation.ts`

프리셋 문서의 기본 런타임 검증을 담당합니다.

### `src/lib/preset-compiler/`

이 프로젝트의 핵심 중간 계층입니다.

- `compiler.ts`
  - `PresetDocument`를 컴파일해서 앱이 사용할 모델로 변환
- `models.ts`
  - `RenderModel`
  - `EditorModel`
  - `ExportModel`

현재 캔버스와 렌더러는 이 컴파일된 모델만 사용합니다.

### `src/lib/preset-engine.ts`

`RenderModel`을 실제 canvas에 렌더링합니다.  
이미지, 텍스트, 도형, 말풍선, 오버레이 렌더링과 export용 렌더링이 여기 있습니다.

### `src/lib/overlay-editor.ts`

프리셋과 독립적인 자유 오버레이 레이어 타입과 기본 라이브러리를 정의합니다.

### `src/components/PresetCanvas.tsx`

캔버스 렌더 결과 위에 편집 인터랙션을 제공합니다.

- 이미지 슬롯 클릭
- 텍스트 직접 입력
- 오버레이 선택 및 이동
- 저장

### `src/components/ImageSourceOverlay.tsx`

이미지 슬롯 클릭 시 열리는 글라스모픽 입력 오버레이입니다.

- 사진 선택
- 카메라 프리뷰 후 캡처
- 클립보드 읽기

## Presets

현재 포함된 샘플 프리셋:

- `polaroid`
- `four-cut`
- `photocard`
- `meme-bubble`

위치는 다음과 같습니다.

- [src/presets/polaroid/preset.json](/C:/Users/SSAFY/Codes/imagick/src/presets/polaroid/preset.json)
- [src/presets/four-cut/preset.json](/C:/Users/SSAFY/Codes/imagick/src/presets/four-cut/preset.json)
- [src/presets/photocard/preset.json](/C:/Users/SSAFY/Codes/imagick/src/presets/photocard/preset.json)
- [src/presets/meme-bubble/preset.json](/C:/Users/SSAFY/Codes/imagick/src/presets/meme-bubble/preset.json)

## Adding a New Preset

기본 절차는 아래와 같습니다.

1. `src/presets/<preset-name>/preset.json` 추가
2. DSL 타입에 맞게 `metadata`, `inputs`, `output`, `commands` 작성
3. `preset-library.ts`에 등록
4. 앱 실행 후 프리셋이 정상적으로 컴파일/렌더되는지 확인

## Current Constraints

현재는 MVP 성격의 구현이라 아래 항목은 이후 확장 여지가 있습니다.

- Cropper 기반 정교한 크롭 UI
- 프리셋 JSON의 정식 JSON Schema 검증 고도화
- 더 복잡한 마스크/path 편집 지원
- 오버레이 리사이즈 핸들 및 레이어 순서 편집
- 자동 테스트 추가

## Development Notes

- 텍스트는 `appearanceScope`에 따라 동작합니다.
  - `preset`: 프리셋이 정의한 스타일 우선
  - `adaptive`: 배경 샘플링 기반 자동 대비
- 저장은 전체 canvas가 아니라 콘텐츠 bounds 기준으로 crop됩니다.
- 오버레이는 프리셋과 독립적으로 관리됩니다.

## Scripts

- `npm run dev`: 개발 서버 실행
- `npm run build`: 타입체크 + 프로덕션 빌드
- `npm run preview`: 빌드 결과 미리보기
- `npm run lint`: ESLint 실행
