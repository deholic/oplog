# Atlassian provider reference

이 문서는 `oplog` 스킬이 Atlassian으로 게시할 때 참고하는 provider reference입니다.

현재 기준으로는 **Atlassian 전체를 포괄적으로 다루기보다, Confluence create-first MVP 게시 흐름**을 우선 설명합니다.

## 역할 경계

- 문서의 기준 저장소 선택 규칙은 부모 `oplog` skill에서 상속받습니다.
- 문서 구조 표준화와 민감정보 제거 규칙도 부모 `oplog` skill에서 상속받습니다.
- 이 reference는 주로 `site / space / title / content` 확정, MCP tool/schema discovery, 권한 확인, 그리고 Confluence page create 흐름을 다룹니다.

따라서 source repository나 게시 본문이 아직 준비되지 않았으면 먼저 그것을 확인해야 하며, 기존 페이지가 있다고 가정해 자동 update/upsert를 기본 동작으로 삼지 않습니다.

## 먼저 확인할 것

### 1. 기준 저장소
- `source_repo_name`
- `source_repo_path`
- `source_branch` (선택)

저장소 후보가 여러 개라면 사용자에게 물어봅니다.

### 2. 게시 대상
필수 권장값:
- `site` 또는 MCP가 요구하는 대상 식별 정보
- `space`
- `title`
- `content`

선택값:
- `parentPage`
- `labels`
- `update_if_exists`
- `dry_run`

여기서 `update_if_exists`는 **현재 기본 지원 동작을 의미하지 않습니다.**

- 현재 MVP의 기본 흐름은 **create-first** 입니다.
- update/upsert는 후속 확장 범위이며, 실제 가능 여부는 MCP의 tool/schema discovery와 권한 확인 결과에 따라 달라집니다.
- 따라서 사용자가 "기존 페이지가 있으면 업데이트"를 기대하더라도, 이 값을 보고 자동 update를 약속하면 안 됩니다.
- 먼저 create/update 관련 tool이 실제로 노출되는지, 어떤 식별자나 검색 기준이 필요한지 확인한 뒤에만 update 가능 여부를 안내합니다.

기준 저장소와 Confluence space는 별개입니다.

## MVP 범위

우선 지원:
- Confluence page create

후속 확장:
- Confluence page update
- title/parent 기준 upsert
- Jira issue/comment 생성

## 핵심 통합 규칙

Atlassian 쪽은 가능한 경우 **런타임 MCP tool discovery**를 우선합니다.

즉:
1. MCP 연결
2. 사용 가능한 tool 목록 확인
3. 입력 schema 확인
4. 실제 create/update 가능 여부 확인
5. 그 schema에 맞춰 호출

하드코딩된 인자 가정에 과하게 의존하지 않는 것이 좋습니다.

## 권장 페이지 제목 규칙

저장소 정보가 제목에 드러나는 편이 좋습니다.

예:
- `[generate-oplog] AI 작업 요약`
- `[generate-oplog] 스킬 설계 초안`
- `[generate-oplog] 2026-04-23 작업 문맥 정리`

## 권장 게시 흐름

### create-first MVP
1. 기준 저장소 확정
2. 최종 Markdown 문서 생성
3. Atlassian 대상 site/space 확인
4. MCP tool/schema 확인
5. Confluence page 생성
6. page URL / page ID / title을 결과로 반환

### update는 나중에
update/upsert는 create-first 흐름이 안정화된 뒤 추가합니다.

## 실패 처리 규칙

아래 실패 유형을 구분해서 설명합니다.

- authentication failure
- admin policy restriction
- insufficient permission
- target space not found
- create/update tool unavailable
- live schema mismatch
- ambiguous source repository

## dry-run 규칙

사용자가 실제 게시를 명시하지 않았다면:
- 제목
- 대상 site/space
- 기준 저장소 정보
- 문서 body preview

를 먼저 보여주고, 실제 MCP write는 하지 않습니다.
