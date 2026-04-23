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

## Obsidian unavailable 예외 처리 규칙

Obsidian 게시는 **문서 생성**과 **저장 검증**을 분리해서 다룹니다.

즉:
- 문서 초안 생성 성공
- Obsidian 저장 성공

은 같은 상태가 아닙니다.

`obsidian` CLI를 사용할 수 없거나, 앱 runtime이 준비되지 않았거나, vault/path를 안전하게 확정할 수 없으면 **저장 성공으로 처리하지 않습니다.**
이 경우 기본 동작은 **draft-only fallback** 입니다.

### 1. usable Obsidian CLI 판단 기준

아래를 모두 만족할 때만 “usable Obsidian publish path”로 봅니다.

1. `obsidian` CLI를 실행할 수 있다
2. 현재 publish mode(`create` / `append` / `prepend` / `daily:*`)가 지원 범위 안에 있다
3. 필요한 경우 앱 runtime 또는 CLI 연동이 실제로 사용 가능하다
4. 대상 vault를 안전하게 확정할 수 있다
5. 대상 path 또는 daily workflow 정보를 안전하게 확정할 수 있다
6. 실제 write 결과를 성공으로 해석할 최소 근거가 있다

하나라도 만족하지 못하면, 자동 저장은 진행하지 않습니다.

### 2. 실패 유형 분류

#### A. capability unavailable
예:
- `obsidian` CLI 자체가 없음
- CLI 등록이 안 되어 있음
- 현재 mode가 지원 범위 밖임

처리:
- 자동 저장 시도 중단
- 최종 문서만 생성
- 상태를 `Draft ready, not published` 로 반환
- 사용자가 원하면 CLI 설치/등록 후 다시 시도

#### B. runtime unavailable
예:
- Obsidian 앱이 실행 중이지 않음
- 앱은 있지만 CLI가 runtime에 접근하지 못함
- 앱 launch는 됐지만 저장 가능 상태를 확인할 수 없음

처리:
- 무한 재시도하지 않음
- 앱을 실행하거나 runtime 상태를 확인하라고 안내
- 그래도 해결되지 않으면 draft-only fallback으로 전환
- 상태를 `Blocked — app/runtime unavailable` 로 반환

#### C. target resolution failed
예:
- vault 목록 조회 실패
- vault가 미선택 상태임
- 여러 vault 중 어느 곳에 쓸지 모호함
- path가 미확정이거나 잘못됨
- 대상 vault/path에 접근할 수 없음

처리:
- vault/path를 추정하지 않음
- 필요한 최소 입력만 다시 요청
- 입력이 해결되기 전까지 실제 저장 시도 금지
- 상태를 `Blocked — needs target selection` 로 반환

#### D. publish failed
예:
- `create` / `append` / `prepend` 명령 실패
- 경로 충돌
- 파일 접근 실패
- write 권한 또는 runtime 에러

처리:
- success로 처리하지 않음
- 최종 문서는 draft로 반환
- 수동 저장 또는 다른 경로를 제안
- 상태를 `Draft ready, not published` 로 반환

#### E. ambiguous / unverified
예:
- CLI 응답은 있었지만 실제 반영 여부를 검증할 수 없음
- 앱 launch만 일어나고 저장 성공 여부는 불명확함

처리:
- 성공으로 단정하지 않음
- 상태를 `Publish attempted but unverified` 로 반환
- 확인 가능한 경로/응답이 있으면 함께 제공
- 사용자에게 수동 확인을 요청

### 3. draft-only fallback 규칙

Obsidian 저장을 수행할 수 없으면 아래를 반드시 반환합니다.

- 최종 문서 본문
- 기준 저장소 정보
- 대상 vault/path 또는 daily mode 초안
- 저장이 수행되지 않은 이유
- 사용자가 다음에 할 수 있는 선택지

예시 상태 메시지:

- `Draft ready, not published`
- `Blocked — app/runtime unavailable`
- `Blocked — needs target selection`
- `Publish attempted but unverified`

### 4. 사용자 안내 문구 예시

#### CLI가 없을 때
> Obsidian CLI를 사용할 수 없어 자동 저장을 수행하지 않았습니다. 대신 저장 가능한 Markdown 초안을 준비했습니다.

#### 앱 runtime이 준비되지 않았을 때
> Obsidian 앱 또는 CLI runtime에 접근할 수 없어 이번에는 자동 저장을 진행하지 않았습니다. 앱을 실행한 뒤 다시 시도하거나, 초안을 직접 저장할 수 있습니다.

#### vault/path가 확정되지 않았을 때
> 저장 대상 vault 또는 path를 안전하게 확정할 수 없어 자동 저장을 보류했습니다. 올바른 vault/path가 정해지면 다시 저장할 수 있습니다.

#### 저장 결과를 검증하지 못했을 때
> 저장 요청은 시도했지만 실제 반영 여부를 확인하지 못했습니다. 성공으로 단정하지 않고, 초안과 확인 가능한 정보만 반환합니다.

### 5. fallback 이후 다음 선택지

Obsidian 자동 저장이 불가능할 때는 아래 중 하나를 제안합니다.

1. CLI 설치/등록 후 다시 시도
2. Obsidian 앱 실행 후 다시 시도
3. vault/path를 다시 지정
4. `obsidian://choose-vault` 또는 앱 연동 경로 시도
5. Markdown 초안을 직접 복사/저장

### 6. 하면 안 되는 것

- CLI가 없는데 저장 성공처럼 말하지 말 것
- active vault, last-opened vault, 임의 path로 추정 저장하지 말 것
- 앱 launch만 됐다고 저장 성공으로 처리하지 말 것
- 실패를 여러 종류로 구분해야 하는데 한 버킷으로 뭉개지 말 것
- draft-only fallback을 조용히 처리하지 말고, 반드시 저장 실패/미실행 상태를 명시할 것

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
