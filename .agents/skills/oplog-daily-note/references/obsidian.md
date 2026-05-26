# Obsidian daily note provider reference

이 문서는 `oplog-daily-note` skill이 Obsidian daily note의 `작업 일지` 섹션에 작업 로그 entry를 남길 때 참고하는 provider reference입니다.

## 역할 경계

- 부모 `oplog-daily-note` skill의 입력, entry 형식, 실패 처리 원칙을 상속받습니다.
- 이 reference는 Obsidian daily note Markdown을 읽고, `작업 일지` 섹션에 entry를 삽입하고, read-back으로 검증하는 흐름을 다룹니다.
- 긴 작업 문서 생성이나 vault/path 설계는 Obsidian provider reference 또는 상위 `oplog` skill의 책임입니다.

## 필요한 capability

아래를 모두 만족할 때만 Obsidian daily note에 직접 기록합니다.

1. Obsidian CLI 또는 동등한 runtime command surface를 사용할 수 있다
2. 대상 vault를 안전하게 확정할 수 있다
3. daily note의 실제 path 또는 daily note read surface를 확인할 수 있다
4. daily note Markdown을 읽을 수 있다
5. daily note Markdown을 section-aware 방식으로 업데이트할 수 있다
6. write 이후 daily note를 다시 읽어 결과를 검증할 수 있다

단순 `daily:append`만 가능하고 daily note를 읽거나 섹션 위치를 검증할 수 없다면, 성공으로 처리하지 않습니다. 이 경우 Markdown entry 초안을 반환하고 `Draft ready, daily note not updated` 또는 `Daily note entry attempted but unverified` 상태를 사용합니다.

## Vault와 날짜 확정

- 가능한 경우 먼저 vault 목록을 조회하고 사용자가 선택한 vault를 사용합니다.
- 사용자가 날짜를 지정하지 않으면 Obsidian daily note 설정 또는 runtime timezone 기준 `today`를 사용합니다.
- 날짜가 모호하면 쓰기 전에 사용자에게 확인합니다.
- daily note path 형식은 vault/plugin 설정에 따라 달라질 수 있으므로 추정하지 않습니다.

## Daily note 읽기

Obsidian daily note의 Markdown 본문을 먼저 읽습니다.

읽기 결과에서:
- 전체 Markdown
- frontmatter 범위
- heading 목록
- `작업 일지` 섹션 범위
- 기존 link/entry

를 확인합니다.

frontmatter가 있으면 절대 그 안에 entry를 삽입하지 않습니다.

## 중복 방지

쓰기 전에 daily note 전체에서 아래 중 하나가 이미 있는지 확인합니다.

- 같은 Obsidian link 또는 URI
- 같은 작업 문서 path
- 같은 title과 같은 `source_repo_name`이 함께 포함된 작업 일지 항목

중복이면 새 heading이나 entry를 추가하지 않고 `Daily note entry already present` 상태를 반환합니다.

## `작업 일지` 섹션 위치

Markdown heading 기준으로 `작업 일지` 섹션을 찾습니다.

권장 순서:

1. frontmatter가 있다면 frontmatter 뒤 본문만 대상으로 섹션을 찾습니다.
2. heading marker(`#`, `##`, `###` 등)를 제거한 텍스트가 `작업 일지`와 정확히 일치하는 heading을 찾습니다.
3. heading이 있으면 그 heading 다음부터 같은 level 이상 다음 heading 전까지를 `작업 일지` 섹션으로 봅니다.
4. 같은 섹션에 기존 항목이 있으면 섹션의 마지막 항목 뒤에 추가합니다.
5. 다음 heading이 있으면 그 heading 바로 앞에 추가합니다.
6. heading이 없으면 파일 끝에 `### 작업 일지`와 entry를 함께 추가합니다.

기존 daily note가 다른 heading level을 쓰더라도 새 heading은 기본적으로 `### 작업 일지`를 사용합니다. 단, 사용자가 vault convention을 명시했거나 기존 daily note 구조가 명확하면 그 level을 따를 수 있습니다.

## Entry 쓰기

작업 문서 링크가 있으면 한 줄 bullet로 추가합니다.

```md
- [작업 문서 제목](obsidian://...) — {source_repo_name} 작업 로그: {summary}
```

Obsidian wiki link가 더 적절하고 대상 path를 안전하게 확정할 수 있으면 아래 형식도 사용할 수 있습니다.

```md
- [[작업 문서 제목]] — {source_repo_name} 작업 로그: {summary}
```

링크가 없으면 plain entry를 사용합니다.

```md
- {title} — {source_repo_name} 작업 로그: {summary}
```

## 검증

write 이후 daily note를 다시 읽어 아래를 확인합니다.

- `작업 일지` heading 존재
- entry가 `작업 일지` 섹션 아래에 있음
- frontmatter가 손상되지 않음
- 같은 entry가 중복 생성되지 않음
- link 또는 plain entry가 기대한 title/summary를 포함함

검증할 수 없으면 성공으로 단정하지 않고 `Daily note entry attempted but unverified` 상태를 반환합니다.

## 하면 안 되는 것

- daily note에 작업 문서 본문 전체를 복제하지 말 것
- frontmatter 안에 entry를 삽입하지 말 것
- `작업 일지`가 아닌 다른 섹션에 조용히 추가하지 말 것
- daily note path를 추정해서 임의 파일에 쓰지 말 것
- read-back 검증 없이 성공으로 단정하지 말 것
