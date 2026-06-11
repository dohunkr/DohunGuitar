# 🎸 DohunGuitar — 공중 기타 연주 앱

웹캠으로 손 동작을 인식하여 공중에서 기타를 연주하는 인터랙티브 웹 앱입니다.

## 주요 기능

- **왼손 코드 선택** — 핀치(엄지+검지) 제스처로 코드 그리드에서 원하는 코드 선택
- **오른손 스트로크** — 위→아래 스와이프로 다운스트로크, 속도에 따라 세기 조절
- **15가지 코드** — C, D, E, F, G, A, Em, Dm, Am, G7, A7, E7, B7, C7, Fm
- **실시간 손 추적** — MediaPipe Hands 기반 skeleton 오버레이
- **Web Audio API** — 기타 화음 합성 (오실레이터 + 필터 엔벨로프)

## 기술 스택

- **빌드**: Vite
- **손 인식**: MediaPipe Hands (CDN)
- **오디오**: Web Audio API
- **렌더링**: Canvas API
- **스타일**: CSS Variables 디자인 토큰

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하면 카메라 권한 요청 후 앱이 시작됩니다.

## 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

## 배포 (Cloudflare Pages)

1. GitHub 레포지토리에 push
2. Cloudflare Pages에서 레포 연결
3. 빌드 설정:
   - **빌드 명령어**: `npm run build`
   - **빌드 출력 디렉토리**: `dist`
   - **Node 버전**: 18
4. `main` 브랜치 push 시 자동 배포

## 사용법

1. 앱을 열면 카메라 접근 권한을 허용합니다
2. **왼손**으로 엄지와 검지를 붙여(핀치) 코드를 선택합니다
3. **오른손**을 위에서 아래로 스와이프하여 스트로크합니다
4. 상단 슬라이더로 핀치 감도와 스트로크 세기를 조절할 수 있습니다
5. "손 바꾸기" 체크박스로 왼손/오른손 역할을 바꿀 수 있습니다

## 프로젝트 구조

```
src/
├── main.js                  # 앱 엔트리 포인트
├── components/
│   ├── AudioEngine.js       # Web Audio API 기타 합성
│   ├── ChordGrid.js         # 코드 선택 UI 그리드
│   ├── GestureDetector.js   # 핀치/스트로크 제스처 인식
│   ├── HandOverlay.js       # 손 skeleton 캔버스 오버레이
│   └── StatusBar.js         # 하단 상태 표시 바
├── styles/
│   └── main.css             # 전역 스타일 & 디자인 토큰
└── utils/
    └── handUtils.js         # MediaPipe 헬퍼 함수
```

## 라이선스

MIT
