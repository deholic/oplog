# Craft daily note provider reference

이 문서는 `oplog-daily-note` skill이 Craft daily note의 `작업 일지` 섹션에 작업 로그 entry를 남길 때 참고하는 provider reference입니다.

## 역할 경계

- 부모 `oplog-daily-note` skill의 입력, entry 형식, 실패 처리 원칙을 상속받습니다.
- 이 reference는 Craft MCP를 통한 daily note read/write, `작업 일지` 섹션 위치 결정, 중복 확인, read-back 검증을 다룹니다.
- Craft 작업 문서 생성이나 긴 본문 작성은 담당하지 않습니다.

## 필요한 capability

아래를 모두 만족할 때만 Craft daily note에 직접 기록합니다.

1. Craft MCP에 연결 가능하다
2. daily note를 읽을 수 있다
3. daily note에 block을 추가하거나 기존 block을 업데이트할 수 있다
4. write 이후 daily note를 다시 읽어 결과를 검증할 수 있다

하나라도 만족하지 못하면 쓰지 말고 entry 초안과 실패 상태를 반환합니다.

## 권장 command surface

실제 호출 전에는 현재 host에 노출된 MCP tool schema 또는 help를 확인합니다.

```bash
connection info
blocks get --date today --depth 2 --format json
blocks add --date today --position end --markdown "### 작업 일지\n\n- [작업 문서](craftdocs://open?...&blockId=...) — 작업 로그"
blocks add --siblingId <blockId> --position after --markdown "- [작업 문서](craftdocs://open?...&blockId=...) — 작업 로그"
blocks add --siblingId <nextHeadingId> --position before --markdown "- [작업 문서](craftdocs://open?...&blockId=...) — 작업 로그"
blocks update --id <blockId> --markdown "- [작업 문서](craftdocs://open?...&blockId=...) — 업데이트된 작업 로그"
```

## 날짜 확정

- 기본값은 Craft `connection info`의 requester timezone 기준 `today`입니다.
- 사용자가 날짜를 지정하면 `YYYY-MM-DD` 또는 MCP가 지원하는 상대 날짜로 확정합니다.
- 결과에는 가능한 한 Craft가 해석한 정확한 날짜를 함께 표시합니다.
- 날짜가 모호하면 쓰기 전에 사용자에게 확인합니다.

## Daily note 읽기

먼저 JSON 형태로 daily note를 읽습니다.

```bash
blocks get --date <date> --depth 2 --format json
```

읽기 결과에서:
- page id
- content block list
- heading block
- existing link/entry block

을 확인합니다.

## 중복 방지

쓰기 전에 daily note 전체에서 아래 중 하나가 이미 있는지 확인합니다.

- 같은 `document_id`
- 같은 `root_block_id`
- 같은 `craftdocs://` link
- MCP read 결과의 `block://{root_block_id}` link
- 같은 title과 같은 `source_repo_name`이 함께 포함된 작업 일지 항목

중복이면 새 heading이나 entry를 추가하지 않고 `Daily note entry already present` 상태를 반환합니다.

기존 entry가 같은 작업 문서를 가리키지만 요약만 오래된 경우, 사용자가 업데이트를 요청했다면 새 entry를 추가하지 말고 기존 block을 업데이트할 수 있습니다.

## `작업 일지` 섹션 위치

Craft에서는 structured block list를 사용해 `작업 일지` heading과 다음 heading을 찾습니다.

권장 순서:

1. heading marker를 제거한 텍스트가 `작업 일지`와 정확히 일치하는 heading block을 찾습니다.
2. heading이 있으면 그 heading 다음부터 다음 heading 전까지를 `작업 일지` 섹션으로 봅니다.
3. 같은 섹션에 기존 항목이 있으면 섹션의 마지막 항목 뒤에 추가합니다.
4. 다음 heading이 있으면 그 heading 바로 앞에 추가합니다.
5. heading이 없으면 daily note 끝에 `### 작업 일지`와 entry를 함께 추가합니다.

섹션 경계를 안전하게 계산할 수 없으면 heading 바로 아래에 추가합니다. 그래도 중복 여부는 먼저 확인해야 합니다.

## Entry 쓰기

### heading이 없을 때

```bash
blocks add --date <date> --position end --markdown "### 작업 일지\n\n- [작업 문서 제목](craftdocs://open?...&blockId=...) — {source_repo_name} 작업 로그: {summary}"
```

### heading이 있고 섹션 끝을 알 수 있을 때

```bash
blocks add --siblingId <lastWorklogEntryBlockId> --position after --markdown "- [작업 문서 제목](craftdocs://open?...&blockId=...) — {source_repo_name} 작업 로그: {summary}"
```

### 다음 heading 바로 앞에 넣어야 할 때

```bash
blocks add --siblingId <nextHeadingBlockId> --position before --markdown "- [작업 문서 제목](craftdocs://open?...&blockId=...) — {source_repo_name} 작업 로그: {summary}"
```

## 검증

write 이후 daily note를 다시 읽어 아래를 확인합니다.

- `작업 일지` heading 존재
- entry가 `작업 일지` 섹션 아래에 있음
- 같은 entry가 중복 생성되지 않음
- link 또는 plain entry가 기대한 title/summary를 포함함

검증할 수 없으면 성공으로 단정하지 않고 `Daily note entry attempted but unverified` 상태를 반환합니다.

## 하면 안 되는 것

- daily note에 작업 문서 본문 전체를 복제하지 말 것
- `작업 일지`가 아닌 다른 섹션에 조용히 추가하지 말 것
- 중복 확인 없이 같은 link를 여러 번 추가하지 말 것
- read-back 검증 없이 성공으로 단정하지 말 것
