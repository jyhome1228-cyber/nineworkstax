# NINEWORKS TAX

세금계산서 파일 하나를 기준으로 거래처, 거래, 누적 거래액, 거래명세서와 견적서 초안을 연결해 관리하는 NINEWORKS 내부 재무 운영 시스템입니다.

## Core Flow

1. 세금계산서 업로드 (PDF / XML / JPG / PNG)
2. 문서 내용 분석
3. 거래처 자동 매칭
4. 사용자 검수
5. 거래 생성
6. 누적 거래액 반영
7. 거래명세서 / 견적서 초안 생성

## Stack

- Next.js 15
- React 19
- TypeScript
- Supabase PostgreSQL / Auth / Storage
- Vercel

## Design Foundation

UI는 12-column grid, spacing token, 명확한 typography hierarchy, 제한된 radius와 button hierarchy를 기준으로 구성합니다.

컬러는 제공된 HomeTax 화면을 참고해 NINEWORKS TAX용으로 재정의했습니다.

- Primary: `#395EDF`
- Deep Blue: `#294A94`
- Secondary: `#488090`
- Primary Soft: `#F6F8FE`
- Background: `#F7F9FC`
- Surface: `#FFFFFF`

특정 서비스 UI를 복제하지 않으며 구조와 사용성을 우선합니다.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Supabase 프로젝트 생성 후 `.env.local`에 URL / anon key를 입력하고 `supabase/schema.sql`을 실행합니다.

## MVP

- Dashboard
- Tax invoice upload
- Extraction review
- Clients
- Transactions
- Automatic cumulative amount
- Statement generation
- Quote draft generation
- Payment / receivable status

## Security

실제 사업자 정보, 세금계산서, 거래처 및 금액 데이터가 저장되므로 운영 저장소와 배포 환경은 비공개 접근을 전제로 합니다.
