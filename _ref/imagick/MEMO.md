# MEMO

## Core Principles

- 프리셋과 캔버스는 직접 서로를 알지 않는다.
- 프리셋은 `PresetDocument` DSL만 정의한다.
- 앱은 프리셋을 바로 캔버스에 넘기지 않고 먼저 컴파일한다.
- 현재 기준 흐름:

```text
PresetDocument
  -> compilePreset
  -> RenderModel / EditorModel
  -> compileExportModel
  -> canvas renderer / editor UI
```

- 캔버스와 렌더러는 가능하면 DSL 명령 자체를 직접 해석하지 않는다.

## Current Architecture Notes

- 컴파일러 진입점:
  - `src/lib/preset-compiler/compiler.ts`
- 컴파일된 모델 타입:
  - `src/lib/preset-compiler/models.ts`
- 렌더 엔진:
  - `src/lib/preset-engine.ts`
- 편집 캔버스:
  - `src/components/PresetCanvas.tsx`

## Text Rules

- 텍스트 슬롯은 `appearanceScope`를 가진다.
- `appearanceScope = "preset"`
  - 프리셋이 정의한 스타일을 우선 유지한다.
  - 예: stroke, backgroundColor가 있는 경우
- `appearanceScope = "adaptive"`
  - 배경 샘플링을 통해 자동 대비 색상을 적용한다.

- `preset` 스코프 텍스트는 캔버스가 실제 표시를 담당한다.
- 직접 입력 필드는 편집을 위한 오버레이일 뿐이며, 평소에는 투명하게 두고 편집 중일 때만 캔버스 텍스트를 숨긴다.
- `Meme Bubble Classic` 헤드라인 같은 강한 스타일 텍스트는 이 규칙을 유지해야 한다.

## Placeholder / Contrast Notes

- 일반 텍스트 슬롯은 배경 밝기에 따라 글자색과 placeholder 색을 동적으로 바꾼다.
- placeholder도 일반 텍스트와 같은 대비 정책을 따라야 한다.
- 강한 프리셋 스타일 텍스트에는 adaptive contrast를 강제로 덮어쓰지 않는다.

## Overlay Rules

- 스티커, 배지, 말풍선, 리액션 이모지는 프리셋 종속 요소가 아니다.
- 오버레이는 공통 레이어로 관리한다.
- 프리셋을 바꿔도 오버레이 시스템 자체는 독립적으로 동작해야 한다.

- 오버레이 선택/이동 인터랙션은 이미지 교체 버튼이나 텍스트 입력 DOM보다 우선한다.
- 현재는 `PresetCanvas`의 interaction layer에서 capture 단계로 hit-test 하도록 구현되어 있다.
- 이 우선순위를 깨면 오버레이를 다시 선택하지 못하는 문제가 생길 수 있다.

## Image Slot UX

- 이미지 슬롯은 별도 확장 블러 레이어를 덮지 않는다.
- 슬롯 자체가 상태를 표현해야 한다.

- 빈 슬롯:
  - 실제 슬롯 경계와 일치하는 상태 표현
  - 우하단에 `Add ...` 칩 표시
- 이미지가 있는 슬롯:
  - 평소에는 원본 이미지를 그대로 보여준다
  - hover/focus 시에만 우하단 `Replace photo` 칩 표시

- 슬롯 표현은 실제 사진 영역과 어긋나지 않아야 한다.

## Image Input UX

- 이미지 입력 방식은 세 가지다.
  - 파일 선택
  - 카메라 캡처
  - 클립보드 읽기

- 이미지 슬롯 클릭 시 글라스모픽 오버레이가 열린다.
- 카메라는 실시간 프리뷰 후, 프리뷰 영역을 다시 클릭해서 캡처하는 방식이다.
- 클립보드는 브라우저 권한/지원 여부에 영향을 받으므로 항상 실패 메시지와 폴백 고려가 필요하다.

## Export Rules

- 저장은 전체 편집 캔버스를 그대로 내보내지 않는다.
- 실제 콘텐츠 bounds를 계산해서 crop한 뒤 export한다.
- 폴라로이드처럼 프리셋 카드만 저장되는 기대를 유지해야 한다.
- export bounds 계산은 `compileExportModel`에서 담당한다.

## UI Direction

- 메인 화면은 캔버스 중심이다.
- 우측 상단이 아니라 좌측 상단 햄버거 메뉴를 사용한다.
- 햄버거 아이콘은 CSS 막대가 아니라 SVG asset을 사용한다.
- 사이드 메뉴는 좌측에서 슬라이드된다.
- 텍스트는 별도 폼이 아니라 프레임 안에서 직접 수정한다.

## Known Fragile Areas

- 편집용 HTML 텍스트 입력과 캔버스 텍스트 렌더의 동기화
- 오버레이 hit-test와 이미지/텍스트 DOM의 이벤트 우선순위
- export 시 최종 결과와 편집 화면의 시각적 일치
- 클립보드 API와 카메라 권한 처리

## Good Next Steps

- compiler 단위 테스트 추가
- export/service 레이어를 더 명확히 분리
- 오버레이 리사이즈/회전 핸들 추가
- 텍스트 자동 높이 조절
- 실제 크롭 UI 도입
- JSON Schema 기반 검증 강화
