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

## Provider routing 규칙

provider별 daily note 조회, `작업 일지` 섹션 탐색, 쓰기 command, 검증 방식은 각 provider reference를 기준으로 판단합니다.

- Craft daily note에 기록하는 경우 [`references/craft.md`](./references/craft.md)를 사용합니다.
- Obsidian daily note에 기록하는 경우 [`references/obsidian.md`](./references/obsidian.md)를 사용합니다.

공통 원칙:
- daily note에는 작업 문서 본문 전체를 복제하지 않고 짧은 link entry 또는 plain entry만 남깁니다.
- entry는 반드시 `작업 일지` heading 아래에 둡니다.
- `작업 일지` heading이 없으면 provider reference의 방식으로 먼저 heading을 만든 뒤 그 아래에 둡니다.
- 같은 작업 문서 링크나 같은 작업 기록이 이미 있으면 중복으로 추가하지 않습니다.
- daily note 읽기, 중복 확인, 쓰기, read-back 검증 중 하나라도 안전하게 수행할 수 없으면 성공으로 단정하지 않습니다.

## 공통 실행 흐름

1. provider를 확정합니다.
2. provider의 daily note read/write capability를 확인합니다.
3. 해당 provider reference를 읽고 적용합니다.
4. daily note를 읽고 중복 항목이 있는지 확인합니다.
5. `작업 일지` 섹션에 link entry 또는 plain entry를 추가합니다.
6. daily note를 다시 읽어 반영 여부를 검증합니다.
7. 결과에는 provider, date, entry, link 여부, write/verify status를 포함합니다.

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
