---
name: oplog
version: 0.3.0
description: "AI를 통해 수행한 작업과 컨텍스트를 한국어 문서로 정리하고, 대상 에디터에 게시할 수 있도록 준비합니다."
---

# oplog

AI를 통해 수행한 작업 내용을 한국어 문서로 요약하고, Obsidian이나 Atlassian 같은 대상 시스템에 게시할 수 있도록 준비하는 공통 스킬입니다.

이 스킬은 게시 자체보다 **기준 저장소 선택**, **문서 구조 표준화**, **민감정보 제거**, **대상별 provider reference를 참고한 게시 판단**을 담당합니다.

## 이 스킬의 역할 경계

이 스킬은 **공통 orchestration / 문서 준비 / 라우팅**을 담당합니다.

- 기준 저장소를 확정합니다.
- 문서 구조를 표준화합니다.
- 민감정보를 제거합니다.
- publish target이 명시되면 그에 맞는 provider reference를 참고해 게시 흐름을 진행합니다.

이 스킬 자체는 기본적으로 **외부 게시를 직접 수행하는 스킬이 아닙니다.**

즉, 사용자가 아직 publish target을 정하지 않았거나, source repository부터 먼저 확정해야 하는 상황이라면 이 스킬 단계에서는 **문서 초안 준비와 확인 질문**까지만 진행하는 것이 기본 동작입니다.

## 언제 사용하나요

다음과 같은 경우에 사용합니다.

- AI와 함께 진행한 작업 내용을 문서로 남기고 싶을 때
- 특정 작업의 배경, 결정사항, 결과물, 후속 액션을 정리하고 싶을 때
- 같은 형식의 작업 요약을 여러 게시 대상에 일관되게 보내고 싶을 때
- 여러 저장소 중 어떤 저장소를 기준으로 문서를 만들지 먼저 정해야 할 때

## 핵심 개념

이 스킬은 아래 두 가지를 분리해서 다룹니다.

### 1. 기준 저장소 (source repository)
문서를 만들 때 기준이 되는 저장소입니다.

예:
- `/Users/rainy/Repos/generate-oplog`

### 2. 게시 대상 (publish target)
완성된 문서를 어디에 저장하거나 게시할지에 대한 대상입니다.

예:
- Obsidian vault
- Confluence space

문서는 **source repository 기준으로 생성**되고, **publish target 기준으로 게시**됩니다.

## 가장 중요한 규칙: 기준 저장소 먼저 선택

문서를 만들기 전에 반드시 **기준 저장소(source repository)** 를 정해야 합니다.

여러 저장소가 관련되어 있거나, 어떤 저장소를 기준으로 요약해야 할지 불분명하면 반드시 사용자에게 확인합니다.

예시 질문:
- "어떤 저장소를 기준으로 작업 내용을 요약할까요?"
- "여러 저장소가 관련되어 있는데, source of truth로 볼 저장소를 하나 선택해주세요."

## 저장소 선택 규칙

문서 생성 전에 아래 정보를 확보하는 것을 권장합니다.

- `source_repo_name`
- `source_repo_path`
- `source_branch` (선택)
- `source_scope` (선택: 전체 저장소 / 특정 디렉터리 / 특정 변경 묶음)

저장소 후보가 둘 이상인데 사용자의 의도가 명확하지 않다면:
- 임의로 추정하지 않습니다
- 사용자에게 하나를 선택하게 합니다

## 기본 출력 구조

문서는 기본적으로 아래 Markdown 구조를 따릅니다.

```md
# {제목}

## 작업 요약
...

## 주요 결정사항
- ...

## 산출물
- ...

## 다음 단계
- ...
```

필요하면 frontmatter를 추가할 수 있습니다.

```yaml
---
title: ...
tags:
  - ai-worklog
source_repo_name: ...
source_repo_path: ...
source_branch: ...
date: ...
---
```

## 권장 필드

가능하면 아래 필드를 포함합니다.

- `title`
- `summary`
- `decisions`
- `artifacts`
- `next_steps`
- `tags`
- `source_context`
- `source_repo_name`
- `source_repo_path`
- `source_branch`
- `publish_provider`
- `publish_target`

## 각 섹션 작성 규칙

### 1. 작업 요약
3~8문장 정도로 아래를 설명합니다.

- 무엇을 했는지
- 왜 했는지
- 현재 상태가 어떤지
- 어떤 제약이나 트레이드오프가 있었는지

### 2. 주요 결정사항
오래 남겨야 할 결정만 적습니다.

좋은 예:
- MVP는 상위 skill + leaf skill 구조로 간다
- Obsidian은 exact path 기준으로 게시한다
- Atlassian은 Confluence create-first로 시작한다

좋지 않은 예:
- 중간에 시도했던 임시 생각
- 일회성 잡담
- 내부 추론 과정을 장황하게 옮긴 내용

### 3. 산출물
나중에 다시 찾아야 할 구체적인 결과물을 적습니다.

예:
- 관련 파일 경로
- 문서 경로
- 페이지 URL
- space 이름
- vault 경로
- 이슈/PR/태스크 ID

### 4. 다음 단계
실제로 행동 가능한 후속 작업만 적습니다.

### 5. Source Context
전체 대화 dump 대신, 아래 정도만 간결하게 포함합니다.

- 사용자 요청 요약
- 핵심 제약
- 관련 환경 정보
- 저장소 선택 근거

## 반드시 포함할 것

- 사용자 의도
- 기준 저장소 정보
- 작업의 현재 상태
- 중요한 결정사항
- 후속 작업
- 의미 있는 링크/ID/경로

## 포함하면 안 되는 것

- 비밀번호
- 토큰
- API 키
- 전체 raw transcript
- 민감한 내부 사고 과정
- 확인되지 않은 추측

## 민감정보 처리 규칙

문서를 만들기 전에 아래 정보는 제거하거나 마스킹합니다.

- API keys
- access tokens
- passwords
- private credentials
- 외부에 노출되면 안 되는 내부 URL
- 명시적으로 요청되지 않은 개인정보

## Obsidian 선택 규칙

Obsidian을 publish target으로 선택한 경우, 가능한 한 먼저 `obsidian vaults`로 vault 목록을 조회하고 사용자에게 선택하게 합니다.

vault가 하나뿐이면 기본 후보로 제안할 수 있지만, 여러 개라면 반드시 목록을 보여주고 사용자가 선택하게 합니다.

## dry-run 규칙

사용자가 실제 게시를 명시적으로 요청하지 않았다면:
- 최종 Markdown 문서를 먼저 생성합니다
- preview를 보여줍니다
- 외부 write 동작은 실행하지 않습니다

## provider reference 사용

최종 문서를 만든 뒤, 대상에 따라 아래 reference 문서를 참고합니다.

- [`references/obsidian.md`](./references/obsidian.md)
- [`references/atlassian.md`](./references/atlassian.md)

publish target이 아직 명시되지 않았다면, provider reference를 바로 적용하지 말고 먼저 source repository 또는 publish target을 확인합니다.

## 권장 실행 흐름

1. 관련 저장소 후보를 파악한다
2. 기준 저장소를 사용자에게 확인하거나 확정한다
3. 기준 저장소를 바탕으로 문서 초안을 만든다
4. 민감정보를 제거한다
5. publish 대상과 목적지를 확인한다
6. 필요하면 dry-run preview를 보여준다
7. provider reference를 참고해 게시 여부와 방식을 확정한다

> [!CAUTION]
> 외부 대상에 게시하는 것은 **write 작업**입니다. 사용자가 실제 게시를 원한다고 확인하기 전에는 create/update/append를 실행하지 마세요.
