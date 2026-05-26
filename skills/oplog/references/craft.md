# Craft provider reference

이 문서는 `oplog` 스킬이 Craft로 게시할 때 참고하는 provider reference입니다.

현재 기준으로는 Craft REST API가 아니라 **Craft MCP create-first 게시 흐름**을 우선 설명합니다.

## 역할 경계

- 문서의 기준 저장소 선택 규칙은 부모 `oplog` skill에서 상속받습니다.
- 문서 구조 표준화와 민감정보 제거 규칙도 부모 `oplog` skill에서 상속받습니다.
- 이 reference는 주로 `Craft MCP 연결 / tool schema discovery / space 또는 위치 선택 / title / content` 확정, 실제 Craft document create 흐름, 그리고 선택적인 daily note link 후처리를 다룹니다.

이 reference는 부모 `oplog`가 **현재 작업 맥락 기준으로 초안을 이미 준비했다는 전제**에서 사용합니다. 따라서 여기서는 source repository를 처음부터 다시 고르기보다, draft-ready 상태에서 Craft 대상 정보와 publish 가능성을 구체화하는 데 집중합니다. 또한 기존 문서가 있다고 가정해 자동 update/upsert를 기본 동작으로 삼지 않습니다.

## 먼저 확인할 것

### 1. 기준 저장소
- `source_repo_name`
- `source_repo_path`
- `source_branch` (선택)

저장소 후보가 여러 개라면 사용자에게 물어봅니다. 다만 이는 현재 작업 맥락 기준 초안을 override해야 할 때만 다시 확인합니다.

### 2. 게시 대상
필수 권장값:
- Craft MCP 연결 상태
- Craft MCP가 노출하는 write tool과 입력 schema
- `space` 또는 MCP가 요구하는 대상 식별 정보
- `title`
- `content`

선택값:
- `folder` 또는 parent location
- `documentId`
- `daily_note_link` (`true` / `false`)
- `daily_note_date` (`today` 또는 `YYYY-MM-DD`)
- `labels` 또는 tag와 동등한 메타데이터
- `update_if_exists`
- `dry_run`

여기서 `update_if_exists`는 **현재 기본 지원 동작을 의미하지 않습니다.**

- 현재 MVP의 기본 흐름은 **create-first** 입니다.
- update/upsert는 후속 확장 범위이며, 실제 가능 여부는 MCP의 tool/schema discovery와 권한 확인 결과에 따라 달라집니다.
- 따라서 사용자가 "기존 문서가 있으면 업데이트"를 기대하더라도, 이 값을 보고 자동 update를 약속하면 안 됩니다.
- 먼저 search/update 관련 tool이 실제로 노출되는지, 어떤 식별자나 검색 기준이 필요한지 확인한 뒤에만 update 가능 여부를 안내합니다.

기준 저장소와 Craft space는 별개입니다. 다만 기본 UX는 선택된 Craft space 안에 저장소별 folder 또는 parent location을 두고, 작업 문서를 그 아래에 생성하는 구조를 우선합니다.

이 단계는 draft가 이미 준비된 뒤 진행되며, 질문은 가능한 한 `space` → `folder/location` → `title` → `publish 여부` 순으로 좁혀갑니다.

## MVP 범위

우선 지원:
- Craft MCP를 통한 document create
- 가능한 경우 Markdown content를 그대로 전달하거나, MCP schema가 요구하는 block/content 형식으로 변환
- 생성된 문서의 URL, deep link, document ID 등 확인 가능한 결과 반환
- 사용자가 요청하거나 확인한 경우, 생성된 작업 문서 링크를 Craft daily note에 추가

후속 확장:
- 기존 Craft document update
- title/folder 기준 upsert
- 특정 기존 문서 append/prepend
- Craft REST API fallback

## 핵심 통합 규칙

Craft 쪽은 가능한 경우 **호스트가 제공하는 MCP tool discovery**를 우선합니다.

즉:
1. Craft MCP 연결 여부 확인
2. 사용 가능한 tool 목록 확인
3. 입력 schema 확인
4. 실제 create/update 가능 여부 확인
5. 그 schema에 맞춰 호출

하드코딩된 tool 이름이나 인자 가정에 과하게 의존하지 않는 것이 좋습니다. Craft MCP가 노출하는 실제 tool/schema를 확인한 뒤에만 create 또는 update를 수행합니다.

## MCP 연결 규칙

Craft publish target이 선택되었고 Craft MCP를 사용할 수 없다면, REST API로 자동 우회하지 않습니다.

권장 판단 순서:

1. 현재 host에서 Craft MCP tool discovery가 가능한지 확인합니다.
2. Craft MCP가 연결되어 있지 않으면 사용자에게 Craft MCP 설정이 필요하다고 안내합니다.
3. 설정 안내가 필요하면 Craft의 Codex Desktop MCP guide를 참고하되, 이 skill 문서 안에 사용자 인증 정보나 secret을 저장하지 않습니다.
4. MCP 연결 후 다시 publish를 시도합니다.

Craft MCP 서버 URL 자체는 공개 설정값일 수 있지만, 인증 세션이나 토큰은 문서에 남기지 않습니다.

## 기본 저장 위치 규칙

Craft publish target이 선택되었고 사용자가 별도 위치를 지정하지 않았다면, 가능한 경우 MCP로 접근 가능한 space 또는 folder 후보를 조회합니다.

권장 조회 순서:

1. 접근 가능한 Craft space 또는 location 후보를 조회합니다.
2. 후보가 하나뿐이면 기본 후보로 제안합니다.
3. 후보가 여러 개면 사용자에게 목록을 보여주고 선택하게 합니다.
4. 저장소별 folder 또는 parent location을 확인할 수 있으면 `source_repo_name`과 같은 이름을 기본 후보로 사용합니다.
5. folder 존재 여부를 확인할 수 없거나 create 권한이 불분명하면, 자동으로 folder 생성을 약속하지 않습니다.

Craft에서 저장소별 문서를 묶는 구조는 아래를 권장합니다.

```text
Craft space
└── {source_repo_name}
    └── {작업 문서 title}
```

예:
- Craft space → `generate-oplog` → `[generate-oplog] 2026-04-23 작업 문맥 정리`
- Craft space → `my-service` → `[my-service] 배포 자동화 작업 요약`

## 권장 문서 제목 규칙

저장소 정보가 제목에 드러나는 편이 좋습니다.

예:
- `[generate-oplog] AI 작업 요약`
- `[generate-oplog] 스킬 설계 초안`
- `[generate-oplog] 2026-04-23 작업 문맥 정리`

## Daily note link 규칙

Craft daily note는 작업 문서 본문을 복제하는 곳이 아니라, 생성된 작업 문서를 나중에 다시 찾기 위한 짧은 링크를 남기는 곳으로 사용합니다.

`oplog-daily-note` leaf skill을 사용할 수 있는 host라면, daily note link 추가는 해당 skill의 절차를 우선 적용합니다. 이 reference의 daily note 규칙은 그 skill이 없거나 직접 Craft provider reference만 사용하는 환경을 위한 동일한 기준입니다.

### 적용 조건

아래를 모두 만족할 때만 daily note link를 추가합니다.

1. Craft document create와 content write가 성공했고, document URL, deep link, document ID, rootBlockId 중 하나 이상을 확인할 수 있다
2. 사용자가 daily note link를 명시적으로 요청했거나, publish 확인 단계에서 daily note link 추가를 함께 승인했다
3. Craft MCP가 daily note read/write를 지원한다
4. daily note 대상 날짜를 안전하게 확정할 수 있다
5. daily note에 같은 문서 링크가 이미 있는지 확인할 수 있다

이 작업은 Craft document publish와 별개의 추가 write입니다. 따라서 Craft 문서 게시를 승인했다고 해서 daily note link까지 자동으로 추가하지 않습니다.

### 대상 날짜

- 기본값은 Craft connection/requester timezone 기준 `today`입니다.
- 사용자가 특정 날짜를 지정하면 `YYYY-MM-DD`로 확정한 뒤 사용합니다.
- "어제", "내일" 같은 상대 날짜는 Craft MCP가 지원하면 그대로 사용할 수 있지만, 최종 결과에는 정확한 날짜를 함께 표시합니다.
- 날짜가 모호하면 daily note에 쓰지 말고 사용자에게 날짜를 확인합니다.

### Daily note 섹션 위치

daily note link는 daily note의 `작업 일지` 머리글 아래에 추가합니다.

권장 순서:

1. daily note를 먼저 읽습니다.
2. `작업 일지`와 정확히 일치하는 heading block을 찾습니다.
3. `작업 일지` heading이 있으면, 그 heading 아래의 같은 섹션에 link block을 추가합니다.
4. `작업 일지` heading이 없으면, daily note 끝에 `### 작업 일지` heading을 먼저 만든 뒤 그 아래에 link block을 추가합니다.
5. 이미 같은 문서 링크가 daily note 어디에든 있으면 새 heading이나 link block을 추가하지 않습니다.

섹션 경계를 확인할 수 있으면 `작업 일지` heading 다음부터 다음 heading 전까지를 같은 섹션으로 봅니다. 기존 작업 일지 항목이 있다면 그 섹션의 마지막 항목 뒤에 추가합니다.

섹션 경계를 안전하게 확인할 수 없으면, `작업 일지` heading 바로 아래에 추가합니다. 단, 이 경우에도 먼저 중복 여부를 확인합니다.

### Link block 형식

daily note에는 한 줄짜리 bullet을 기본으로 추가합니다.

권장 형식:

```md
- [작업 문서 제목](craftdocs://open?spaceId=...&documentId=...) — {source_repo_name} 작업 로그
```

Craft app link를 사용할 수 없으면 MCP가 반환한 다른 확인 가능한 URL 또는 deep link를 사용합니다. 확인 가능한 링크가 전혀 없으면 daily note link를 추가하지 않습니다.

### 중복 방지

daily note에 링크를 추가하기 전에 가능한 경우 daily note를 읽고 아래 중 하나가 이미 있는지 확인합니다.

- document ID
- Craft app link 또는 deep link
- 같은 title과 같은 source repository가 함께 적힌 link block

이미 같은 작업 문서 링크가 있으면 새 블록을 추가하지 않고 `Daily note link already present` 상태로 반환합니다.

daily note를 읽을 수 없거나 중복 여부를 확인할 수 없으면 기본적으로 링크 추가를 보류합니다. 사용자가 중복 가능성을 감수하고 추가하겠다고 명시한 경우에만 진행합니다.

### 실패 처리

daily note link 실패는 Craft document publish 실패와 분리합니다.

- 작업 문서 생성과 본문 추가가 성공했다면 publish status는 유지합니다.
- daily note link만 실패한 경우 `Published, daily note link not added` 로 반환합니다.
- daily note link 요청은 성공했지만 반영 여부를 확인할 수 없으면 `Published, daily note link attempted but unverified` 로 반환합니다.
- daily note link가 이미 있으면 `Published, daily note link already present` 로 반환합니다.

### 하면 안 되는 것

- daily note에 작업 문서 본문 전체를 복제하지 말 것
- 작업 문서 생성이 실패했는데 daily note link만 추가하지 말 것
- 사용자가 요청하거나 확인하지 않았는데 daily note에 자동으로 쓰지 말 것
- 중복 여부를 확인하지 못했는데 조용히 같은 링크를 여러 번 추가하지 말 것
- daily note link 실패를 전체 Craft publish 실패처럼 보고하지 말 것

## Content 변환 규칙

부모 `oplog` skill이 만든 최종 Markdown 문서를 canonical content로 취급합니다.

- MCP tool이 Markdown 입력을 받으면 최종 Markdown을 그대로 전달합니다.
- MCP tool이 block/content 구조를 요구하면, 문서 구조를 유지하는 범위에서 변환합니다.
- 제목, 섹션 heading, bullet list, code block, link, footer는 가능한 한 보존합니다.
- 변환 과정에서 민감정보를 새로 추가하지 않습니다.
- 변환이 불완전하거나 일부 Markdown 기능이 손실될 수 있으면 publish 전에 사용자에게 알립니다.

## 권장 게시 흐름

### create-first MVP
1. 기준 저장소 확정
2. 최종 Markdown 문서 생성
3. Craft MCP 연결과 tool/schema 확인
4. Craft space 또는 대상 location 후보 확인
5. 저장소별 folder 또는 parent location 후보 확인
6. title 확정
7. document create 실행
8. 필요한 경우 content insert/set 실행
9. document URL / deep link / document ID / title / space 또는 location 확인
10. daily note link가 요청/승인된 경우, daily note 중복 확인 후 link block 추가
11. document publish status와 daily note link status를 분리해서 결과로 반환

### update는 나중에
update/upsert는 create-first 흐름이 안정화된 뒤 추가합니다.

## 실패 처리 규칙

아래 실패 유형을 구분해서 설명합니다.

- Craft MCP unavailable
- authentication failure
- insufficient permission
- target space or location not found
- create/update tool unavailable
- daily note read/write tool unavailable
- live schema mismatch
- ambiguous source repository
- publish result unverified

## dry-run 규칙

사용자가 실제 게시를 명시하지 않았다면:
- 제목
- 대상 Craft space/folder/location
- daily note link 추가 여부와 대상 날짜
- 기준 저장소 정보
- 문서 body preview

를 먼저 보여주고, 실제 MCP write는 하지 않습니다.

## MCP unavailable 예외 처리 규칙

Craft 게시는 **문서 생성**과 **게시 검증**을 분리해서 다룹니다.

즉:
- 문서 초안 생성 성공
- Craft 게시 성공

은 같은 상태가 아닙니다.

Craft MCP를 사용할 수 없거나, Craft write에 필요한 capability가 없으면 **게시 성공으로 처리하지 않습니다.**
이 경우 기본 동작은 **draft-only fallback** 입니다.

### 1. usable Craft MCP 판단 기준

아래를 모두 만족할 때만 “usable Craft MCP”로 봅니다.

1. Craft MCP에 연결 가능하다
2. `tools/list` 등으로 Craft 관련 write tool을 확인할 수 있다
3. 필요한 입력 schema를 확인할 수 있다
4. 현재 인증/권한으로 실제 write가 가능하다
5. 대상 space 또는 location 접근이 가능하다
6. 실제 write 결과를 성공으로 해석할 최소 근거가 있다

하나라도 만족하지 못하면, Craft publish는 진행하지 않습니다.

### 2. 실패 유형 분류

#### A. capability absent
예:
- Craft MCP 자체가 없음
- MCP는 있지만 Craft write tool이 없음
- tool discovery 자체가 불가능함

처리:
- publish 시도 중단
- 최종 문서만 생성
- 상태를 `Draft ready, not published` 로 반환
- 사용자가 원하면 Craft MCP 설정 후 다시 publish 시도

#### B. capability unusable
예:
- authentication failure
- insufficient permission
- write scope 부족
- target space 또는 location 접근 불가
- folder 또는 parent location 접근 불가

처리:
- retry를 반복하지 않음
- 사용자 액션이 필요하다고 명확히 설명
- 최종 문서는 draft로 반환
- 상태를 `Blocked — needs access or configuration fix` 로 반환

#### C. target resolution failed
예:
- space 또는 folder 목록 조회 실패
- 여러 후보 중 어느 곳에 쓸지 모호함
- title이 미확정이거나 충돌 처리 방식이 불명확함
- 대상 location에 접근할 수 없음

처리:
- target을 추정하지 않음
- 필요한 최소 입력만 다시 요청
- 입력이 해결되기 전까지 실제 게시 시도 금지
- 상태를 `Blocked — needs target selection` 로 반환

#### D. transient failure
예:
- 일시적 연결 실패
- 세션 만료
- 일시적 MCP 응답 실패

처리:
- 안전한 사전 확인 단계에서는 제한적으로 1회 재시도 가능
- 그래도 실패하면 draft-only fallback으로 전환
- 상태를 `Draft ready, not published` 로 반환

#### E. publish failed
예:
- create 명령 실패
- content insert/set 실패
- 경로 또는 title 충돌
- write 권한 또는 runtime 에러

처리:
- success로 처리하지 않음
- 최종 문서는 draft로 반환
- 수동 게시 또는 MCP 설정 확인을 제안
- 상태를 `Draft ready, not published` 로 반환

#### F. ambiguous / unverified
예:
- MCP 응답은 있었지만 실제 반영 여부를 검증할 수 없음
- document ID, URL, deep link 등 확인 가능한 결과가 없음

처리:
- 성공으로 단정하지 않음
- 상태를 `Publish attempted but unverified` 로 반환
- 확인 가능한 경로/응답이 있으면 함께 제공
- 사용자에게 수동 확인을 요청

### 3. draft-only fallback 규칙

Craft 게시를 수행할 수 없으면 아래를 반드시 반환합니다.

- 최종 문서 본문
- 기준 저장소 정보
- 대상 Craft space/folder/location 또는 title 초안
- 게시가 수행되지 않은 이유
- 사용자가 다음에 할 수 있는 선택지

예시 상태 메시지:

- `Draft ready, not published`
- `Blocked — needs access or configuration fix`
- `Blocked — needs target selection`
- `Publish attempted but unverified`

### 4. 사용자 안내 문구 예시

#### Craft MCP가 없을 때
> Craft MCP를 사용할 수 없어 자동 게시를 수행하지 않았습니다. 대신 게시 가능한 Markdown 초안을 준비했습니다.

#### 인증 또는 권한이 준비되지 않았을 때
> Craft MCP 인증 또는 write 권한을 확인할 수 없어 이번에는 자동 게시를 진행하지 않았습니다. MCP 설정과 권한을 확인한 뒤 다시 시도할 수 있습니다.

#### 대상 위치가 확정되지 않았을 때
> Craft 저장 대상 space 또는 location을 안전하게 확정할 수 없어 자동 게시를 보류했습니다. 올바른 대상이 정해지면 다시 게시할 수 있습니다.

#### 게시 결과를 검증하지 못했을 때
> 게시 요청은 시도했지만 실제 반영 여부를 확인하지 못했습니다. 성공으로 단정하지 않고, 초안과 확인 가능한 정보만 반환합니다.

### 5. fallback 이후 다음 선택지

Craft 자동 게시가 불가능할 때는 아래 중 하나를 제안합니다.

1. Craft MCP 설정 후 다시 시도
2. Craft 인증/권한 확인 후 다시 시도
3. space/folder/location을 다시 지정
4. daily note link만 다시 시도
5. Markdown 초안을 직접 Craft에 붙여넣기
6. API fallback이 정말 필요하면 별도 작업으로 명시적으로 요청

### 6. 하면 안 되는 것

- Craft MCP가 없는데 게시 성공처럼 말하지 말 것
- REST API connection URL이나 token을 문서에 저장하지 말 것
- 사용자가 명시하지 않았는데 REST API로 자동 우회하지 말 것
- active space, last-opened document, 임의 folder로 추정 저장하지 말 것
- 기존 문서를 자동 update/upsert하지 말 것
- daily note에 링크가 아니라 본문 전체를 자동 복제하지 말 것
- tool schema를 확인하지 않고 하드코딩된 MCP 인자를 가정하지 말 것
- document create만 됐고 content 반영이 실패했는데 전체 게시 성공으로 처리하지 말 것
- 실패를 여러 종류로 구분해야 하는데 한 버킷으로 뭉개지 말 것
