# Obsidian provider reference

이 문서는 `oplog` 스킬이 Obsidian으로 게시할 때 참고하는 provider reference입니다.

## 역할 경계

이 reference는 **공통 skill에서 준비한 canonical Markdown 문서를 Obsidian에 게시하는 흐름**을 설명합니다.

- 문서의 기준 저장소 선택 규칙은 부모 `oplog` skill에서 상속받습니다.
- 문서 구조 표준화와 민감정보 제거 규칙도 부모 `oplog` skill에서 상속받습니다.
- 이 reference는 주로 `vault / path / mode` 확정과 실제 게시 흐름을 다룹니다.

따라서 source repository가 아직 확정되지 않았거나, 게시할 본문(content)이 준비되지 않았다면 먼저 그 정보를 확인해야 합니다.

## 먼저 확인할 것

### 1. 기준 저장소
- `source_repo_name`
- `source_repo_path`
- `source_branch` (선택)

여러 저장소 중 어떤 저장소를 기준으로 생성된 문서인지 불분명하면 먼저 사용자에게 확인합니다.

### 2. 게시 대상
- `vault`
- `path`
- `mode` (`create` / `append` / `prepend`)

기준 저장소와 Obsidian vault는 서로 다른 개념입니다.

## Vault 선택 규칙

Obsidian에 게시하기 전에 가능한 경우 **먼저 vault 목록을 조회**합니다.

권장 순서:

1. `obsidian vaults` 로 사용 가능한 vault 목록을 조회합니다.
2. vault가 하나뿐이면 그 값을 기본 후보로 제안합니다.
3. vault가 여러 개면 사용자에게 목록을 보여주고 선택하게 합니다.
4. vault 목록을 조회할 수 없는 경우에만 수동 입력을 받습니다.

예시:

```bash
obsidian vaults
obsidian vaults verbose
```

vault는 가능한 한 **사용자가 목록에서 선택한 값**을 그대로 사용해야 하며, 추정하지 않습니다.

## 게시 모드

### create
노트가 없을 때 새로 생성합니다.

### append
기존 노트의 아래에 새 내용을 추가합니다.

### prepend
기존 노트의 위쪽에 최신 업데이트를 배치합니다.
frontmatter가 있다면 이를 깨지 않도록 주의합니다.

권장 해석:
- frontmatter가 있는 노트라면, prepend 내용은 **frontmatter 뒤의 본문 시작부**에 추가합니다.
- frontmatter 자체를 수정하거나 덮어쓰는 방식으로 prepend하지 않습니다.
- 정확한 노트 식별(`vault`, `path`)이 확정되기 전에는 실제 prepend를 실행하지 않습니다.

### daily:append / daily:prepend
사용자가 daily note workflow를 명시적으로 원할 때만 사용합니다.

일반 `append` / `prepend`와의 차이:
- 일반 모드는 특정 `path`의 노트를 대상으로 합니다.
- `daily:append` / `daily:prepend`는 사용자가 "오늘 일지", "daily note"처럼 **일일 노트 workflow를 명시적으로 요청한 경우에만** 사용합니다.
- daily 모드라고 해서 vault 확인이 불필요한 것은 아니며, 가능한 경우 먼저 vault를 확정합니다.

## path 설계 권장사항

같은 vault 안에 여러 저장소 문서를 함께 저장할 수 있으므로, 저장소명이 path에 드러나는 구조를 권장합니다.

예:
- `Worklogs/generate-oplog/2026-04-23.md`
- `Projects/generate-oplog/skill-plan.md`

## 결정 규칙

- 먼저 `obsidian vaults`로 vault 후보를 조회합니다.
- vault가 하나면 제안하고, 여러 개면 선택하게 합니다.
- note가 없으면 `create`
- 하나의 파일에 이력을 누적하려면 `append`
- 최신 업데이트를 위쪽에 두고 싶으면 `prepend`
- daily workflow가 명시되면 `daily:*`를 검토합니다.

## fallback 규칙

`obsidian` CLI를 사용할 수 없거나 `vaults` 조회가 실패하면:
- 최종 Markdown을 먼저 보여줍니다.
- vault 목록 자동 조회가 불가능하다고 설명합니다.
- 그때만 vault 이름을 직접 입력받습니다.
- 필요하면 `obsidian://choose-vault` 또는 직접 파일 저장 흐름을 제안합니다.
- 실제 게시가 성공한 것처럼 처리하지 않습니다.

## dry-run 규칙

사용자가 실제 게시를 명시하지 않았다면:
- 최종 문서를 보여줍니다.
- 게시 대상 vault/path를 함께 확인합니다.
- 실제 write는 하지 않습니다.

## CLI 예시

### create
```bash
obsidian vault="MyVault" create path="Projects/generate-oplog/skill-plan.md" content="# 제목\n\n## 작업 요약\n..."
```

### append
```bash
obsidian vault="MyVault" append path="Projects/generate-oplog/skill-plan.md" content="\n\n## 후속 업데이트\n..."
```

### prepend
```bash
obsidian vault="MyVault" prepend path="Projects/generate-oplog/skill-plan.md" content="## 최신 업데이트\n...\n"
```
