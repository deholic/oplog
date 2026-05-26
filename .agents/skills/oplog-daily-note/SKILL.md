---
name: oplog-daily-note
version: 0.4.0
description: "Craft나 Obsidian daily note의 작업 일지 섹션에 AI 작업 로그 링크나 짧은 작업 기록을 남깁니다."
---
<!-- Generated from canonical/oplog-daily-note. Do not edit target copies by hand. -->

# oplog-daily-note

Craft나 Obsidian daily note의 `작업 일지` 섹션에 AI 작업 로그 링크나 짧은 작업 기록을 남기는 leaf skill입니다.

## 역할 경계

이 skill은 daily note에 작업 일지 항목을 남기는 것만 담당합니다.

- 작업 문서를 새로 만들거나 본문을 길게 작성하지 않습니다.
- 작업 문서가 이미 생성되어 있으면 그 링크를 daily note에 남깁니다.
- 작업 문서 링크가 없고 사용자가 daily note 기록만 요청했다면, 짧은 plain entry를 남길 수 있습니다.
- daily note 전체 본문을 복제하거나 기존 섹션을 재정렬하지 않습니다.

상위 `oplog` skill에서 publish 후 daily note link 후처리가 필요할 때 이 skill을 사용할 수 있습니다.

## 입력으로 확보할 값

가능하면 아래 값을 확보합니다.

- `provider` (`craft` / `obsidian`)
- `date` (`today` 또는 `YYYY-MM-DD`, 기본값은 provider timezone 기준 `today`)
- `title`
- `source_repo_name` (선택)
- `summary` (짧은 한 줄 설명)
- `target_link` 또는 `document_id` 또는 `root_block_id` (선택)
- provider target: Craft `space/location`, Obsidian `vault` 또는 daily note path/rule

provider가 명시되지 않았고 둘 이상 가능하면 사용자에게 선택하게 합니다.

## 실행 흐름

1. provider를 확정합니다.
2. provider의 daily note read/write capability를 확인합니다.
3. daily note를 읽습니다.
4. daily note 전체에서 중복 항목이 있는지 확인합니다.
5. `작업 일지` heading을 찾습니다.
6. heading이 없으면 daily note 끝에 `### 작업 일지`를 추가합니다.
7. link entry 또는 plain entry를 `작업 일지` 섹션 아래에 추가합니다.
8. daily note를 다시 읽어 반영 여부를 검증합니다.
9. 결과에는 provider, date, entry, link 여부, write/verify status를 포함합니다.

## Daily note 대상 날짜

- 사용자가 날짜를 지정하지 않으면 `today`를 사용합니다.
- provider connection info에서 timezone을 확인할 수 있으면 정확한 날짜를 결과에 함께 표시합니다.
- 날짜가 모호하면 쓰기 전에 사용자에게 확인합니다.

## Entry 형식

작업 문서 링크가 있으면 한 줄 bullet을 기본으로 사용합니다.

```md
- [작업 문서 제목](target-link) — {source_repo_name} 작업 로그: {summary}
```

작업 문서 링크가 없으면 plain entry를 사용합니다.

```md
- {title} — {source_repo_name} 작업 로그: {summary}
```

entry는 짧게 유지합니다. 상세 내용은 작업 문서에 남기고, daily note에는 찾아가기 위한 앵커만 남깁니다.

## `작업 일지` 섹션 규칙

daily note에는 반드시 `작업 일지` heading 아래에 entry를 추가합니다.

1. daily note를 가능한 한 구조화된 형식으로 읽습니다.
2. heading marker를 제거한 텍스트가 `작업 일지`와 정확히 일치하는 heading block 또는 Markdown heading을 찾습니다.
3. heading이 있으면, 그 heading 다음부터 다음 heading 전까지를 `작업 일지` 섹션으로 봅니다.
4. 같은 섹션에 기존 항목이 있으면 섹션의 마지막 항목 뒤에 추가합니다.
5. 다음 heading이 있으면 그 heading 바로 앞에 추가합니다.
6. heading이 없으면 daily note 끝에 `### 작업 일지`와 entry를 함께 추가합니다.

섹션 경계를 안전하게 계산할 수 없으면 heading 바로 아래에 추가합니다. 그래도 중복 여부는 먼저 확인해야 합니다.

## 중복 방지

쓰기 전에 daily note 전체에서 아래 중 하나가 이미 있는지 확인합니다.

- 같은 `document_id`
- 같은 `root_block_id`
- 같은 Craft/Obsidian link
- 같은 title과 같은 `source_repo_name`이 함께 포함된 작업 일지 항목

중복이면 새 heading이나 entry를 추가하지 않고 `Daily note entry already present` 상태를 반환합니다.

daily note를 읽을 수 없거나 중복 여부를 확인할 수 없으면 기본적으로 쓰기를 보류합니다.

## Craft adapter

Craft MCP가 사용 가능할 때 적용합니다.

권장 command surface:

```bash
connection info
blocks get --date today --depth 2 --format json
blocks add --date today --position end --markdown "### 작업 일지\n\n- [작업 문서](craftdocs://open?...&blockId=...) — 작업 로그"
blocks add --siblingId <blockId> --position after --markdown "- [작업 문서](craftdocs://open?...&blockId=...) — 작업 로그"
blocks add --siblingId <nextHeadingId> --position before --markdown "- [작업 문서](craftdocs://open?...&blockId=...) — 작업 로그"
```

Craft에서는 structured block list를 사용해 `작업 일지` heading과 다음 heading을 찾습니다.

## Obsidian adapter

Obsidian CLI 또는 동등한 runtime command surface가 사용 가능할 때 적용합니다.

필요 capability:

- vault discovery 또는 명시된 vault 확인
- daily note content read
- daily note content update 또는 section-aware append
- write 결과 검증을 위한 read-back

권장 흐름:

1. vault를 확정합니다.
2. Obsidian daily note의 실제 path 또는 daily note read surface를 확인합니다.
3. daily note Markdown을 읽습니다.
4. Markdown heading 기준으로 `작업 일지` 섹션을 찾습니다.
5. heading이 없으면 파일 끝에 `### 작업 일지`와 entry를 추가합니다.
6. heading이 있으면 다음 heading 전 또는 섹션 마지막에 entry를 삽입합니다.
7. 저장 후 다시 읽어 중복 없이 반영됐는지 확인합니다.

`daily:append` 같은 단순 append만 가능하고 daily note를 읽거나 섹션 위치를 검증할 수 없다면, 성공으로 처리하지 않습니다. 이 경우 Markdown entry 초안을 반환하고 `Draft ready, daily note not updated` 또는 `Daily note entry attempted but unverified` 상태를 사용합니다.

## 실패 처리

- Provider unavailable: `Draft ready, daily note not updated`
- Daily note read failed: `Blocked — cannot verify daily note`
- Duplicate found: `Daily note entry already present`
- Heading create failed: `Daily note entry not added`
- Entry add failed: `Daily note entry not added`
- Verify failed: `Daily note entry attempted but unverified`

작업 문서 publish와 daily note 기록은 별도 상태로 보고합니다. daily note 기록 실패를 작업 문서 게시 실패처럼 말하지 않습니다.

## 하면 안 되는 것

- daily note에 작업 문서 본문 전체를 복제하지 말 것
- `작업 일지`가 아닌 임의 섹션에 기록하지 말 것
- 중복 확인 없이 같은 링크를 여러 번 추가하지 말 것
- heading이 없는데 조용히 다른 빈 bullet 아래에 끼워 넣지 말 것
- provider runtime이 없는데 성공처럼 말하지 말 것
