# Atlassian provider reference

이 문서는 `oplog` 스킬이 Atlassian으로 게시할 때 참고하는 provider reference입니다.

현재 기준으로는 **Atlassian 전체를 포괄적으로 다루기보다, Confluence create-first MVP 게시 흐름**을 우선 설명합니다.

## 역할 경계

- 문서의 기준 저장소 선택 규칙은 부모 `oplog` skill에서 상속받습니다.
- 문서 구조 표준화와 민감정보 제거 규칙도 부모 `oplog` skill에서 상속받습니다.
- 이 reference는 주로 `site / space / title / content` 확정, MCP tool/schema discovery, 권한 확인, 그리고 Confluence page create 흐름을 다룹니다.

이 reference는 부모 `oplog`가 **현재 세션 기준으로 초안을 이미 준비했다는 전제**에서 사용합니다. 따라서 여기서는 source repository를 처음부터 다시 고르기보다, draft-ready 상태에서 Atlassian 대상 정보와 publish 가능성을 구체화하는 데 집중합니다. 또한 기존 페이지가 있다고 가정해 자동 update/upsert를 기본 동작으로 삼지 않습니다.

## 먼저 확인할 것

### 1. 기준 저장소
- `source_repo_name`
- `source_repo_path`
- `source_branch` (선택)

저장소 후보가 여러 개라면 사용자에게 물어봅니다. 다만 이는 현재 세션 기준 초안을 override해야 할 때만 다시 확인합니다.

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

이 단계는 draft가 이미 준비된 뒤 진행되며, 질문은 가능한 한 `site` → `space` → `title` → `publish 여부` 순으로 좁혀갑니다.

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

## MCP unavailable 예외 처리 규칙

Confluence 게시는 **문서 생성**과 **게시 검증**을 분리해서 다룹니다.

즉:
- 문서 초안 생성 성공
- Confluence 게시 성공

은 같은 상태가 아닙니다.

Atlassian MCP를 사용할 수 없거나, Confluence write에 필요한 capability가 없으면 **게시 성공으로 처리하지 않습니다.**
이 경우 기본 동작은 **draft-only fallback** 입니다.

### 1. usable MCP 판단 기준

아래를 모두 만족할 때만 “usable Confluence MCP”로 봅니다.

1. Atlassian MCP에 연결 가능하다
2. `tools/list` 등으로 Confluence 관련 write tool을 확인할 수 있다
3. 필요한 입력 schema를 확인할 수 있다
4. 현재 인증/권한으로 실제 write가 가능하다
5. 대상 site/space 접근이 가능하다

하나라도 만족하지 못하면, Confluence publish는 진행하지 않습니다.

### 2. 실패 유형 분류

#### A. capability absent
예:
- Atlassian MCP 자체가 없음
- MCP는 있지만 Confluence write tool이 없음
- tool discovery 자체가 불가능함

처리:
- publish 시도 중단
- 최종 문서만 생성
- 상태를 `Draft ready, not published` 로 반환
- 사용자가 원하면 나중에 다시 publish 시도

#### B. capability unusable
예:
- authentication failure
- insufficient permission
- admin policy restriction
- API token 비활성
- write scope 부족
- target space 접근 불가

처리:
- retry를 반복하지 않음
- 사용자 액션이 필요하다고 명확히 설명
- 최종 문서는 draft로 반환
- 상태를 `Blocked — needs access or configuration fix` 로 반환

#### C. transient failure
예:
- 일시적 연결 실패
- 세션 만료
- 일시적 MCP 응답 실패

처리:
- 안전한 사전 확인 단계에서는 제한적으로 1회 재시도 가능
- 그래도 실패하면 draft-only fallback으로 전환
- 상태를 `Draft ready, not published` 로 반환

#### D. ambiguous / unverified
예:
- create 호출 응답은 왔지만 page URL/ID 확인 실패
- write 성공 여부를 검증할 수 없음

처리:
- 성공으로 단정하지 않음
- 상태를 `Publish attempted but unverified` 로 반환
- 확인 가능한 식별자나 응답이 있으면 함께 제공
- 사용자에게 수동 확인을 요청

### 3. draft-only fallback 규칙

Confluence publish를 수행할 수 없으면 아래를 반드시 반환합니다.

- 최종 문서 본문
- 기준 저장소 정보
- 대상 site/space/title 초안
- publish가 수행되지 않은 이유
- 사용자가 다음에 할 수 있는 선택지

예시 상태 메시지:

- `Draft ready, not published`
- `Blocked — needs access or configuration fix`
- `Publish attempted but unverified`

### 4. 사용자 안내 문구 예시

#### MCP 자체가 없을 때
> Confluence 게시에 필요한 Atlassian MCP를 사용할 수 없어, 이번에는 게시를 수행하지 않았습니다. 대신 게시 가능한 문서 초안을 준비했습니다.

#### write tool이 없을 때
> 현재 연결된 Atlassian MCP에서 Confluence write tool을 확인할 수 없어 게시를 진행하지 않았습니다. 문서 초안은 준비되어 있으며, MCP 설정이 준비되면 다시 게시할 수 있습니다.

#### 권한/정책 문제일 때
> 문서는 준비되었지만 현재 계정 또는 조직 정책으로 Confluence write 권한을 사용할 수 없어 게시가 차단되었습니다. 권한 또는 설정이 해결되면 다시 시도할 수 있습니다.

#### 검증 실패일 때
> 게시 요청은 시도했지만 최종 생성 여부를 검증하지 못했습니다. 성공으로 단정하지 않고, 확인 가능한 정보만 반환합니다.

### 5. fallback 이후 다음 선택지

Confluence publish가 불가능할 때는 아래 중 하나를 제안합니다.

1. MCP/권한 설정 후 다시 시도
2. 다른 publish target 선택
3. draft만 복사해서 수동 게시
4. 이번에는 문서 초안만 저장

### 6. 하면 안 되는 것

- MCP가 없는데 게시 성공처럼 말하지 말 것
- write 권한이 불분명한데 create 성공을 전제하지 말 것
- transient가 아닌 실패를 반복 재시도하지 말 것
- draft-only fallback을 조용히 처리하지 말고, 반드시 게시 실패/미실행 상태를 명시할 것
