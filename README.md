# 클라우드 따라치기 실습실

설치 없이 링크를 눌러 Terraform과 Kubernetes를 연습하는 정적 웹입니다.

## 바로 실행

- **[실습실 선택 화면](https://p2terghks.github.io/infra-practice-labs/)**
- **[Terraform 실습 시작](https://p2terghks.github.io/infra-practice-labs/terraform/)**
- **[Kubernetes 실습 시작](https://p2terghks.github.io/infra-practice-labs/kubernetes/)**

웹 학습은 실제 AWS·Kubernetes API를 호출하지 않습니다. 예제 입력·퀴즈·진도는 브라우저에서 처리합니다.

| 실습실 | 내용 |
| --- | --- |
| Terraform | 따라치기 8단계, plan 읽기, AWS 서비스·구성 요소 15개, 웹·S3 연결 실습 |
| Kubernetes | YAML 10단계, 앱 연결 8단계, kubectl 장애 진단 6가지 |

## 독립 파일 다운로드

- [Terraform 독립 호스팅 ZIP](downloads/Terraform_독립호스팅_패키지.zip)
- [Kubernetes 독립 호스팅 ZIP](downloads/Kubernetes_독립호스팅_패키지.zip)

ZIP의 `offline.html`은 파일 하나로 실행할 수 있습니다. 각 패키지의 public 폴더를 원하는 서버에 올릴 수도 있습니다.

## 로컬 실행

저장소를 내려받은 폴더에서 Python 3로 실행합니다.

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

http://127.0.0.1:8080 에서 실습실을 선택합니다. Node.js·패키지 설치·API 키·별도 빌드는 필요 없습니다.

## GitHub Pages

Settings → Pages에서 `Deploy from a branch`, `main`, `/(root)`를 사용합니다. `.nojekyll`로 정적 파일을 그대로 제공합니다. 루트 index.html에서 상대 경로로 두 실습실을 연결합니다.

## 무료 범위와 데이터

- 로컬 파일의 학습 기능에는 서비스 구독료가 없습니다.
- GitHub Pages는 현재 공개 저장소와 GitHub Free에서 제공됩니다. 서비스 정책·사용 한도는 GitHub 문서를 따릅니다. 영구 무료·무제한 제공을 보장하는 뜻은 아닙니다.
- 실제 AWS 리소스·클라우드 Kubernetes·로드 밸런서·스토리지는 별도로 비용이 발생할 수 있습니다.
- 공개 사이트로 제공됩니다. 학습 파일에는 로그인 기능이 없습니다.
- 진도는 브라우저 localStorage에 저장되며 서버에 전송하지 않습니다. 도메인·브라우저가 바뀌면 자동 이전되지 않습니다.
- 예제 비교는 학습용 판정입니다. 실제 Terraform·kubectl·클러스터를 실행하거나 완전한 언어 검증을 수행하지 않습니다.
- 실제 토큰·Secret·kubeconfig·Terraform 상태 파일을 입력하거나 업로드하지 마세요.

검증: 로컬 정적 파일·주요 학습 동작 확인. 실제 AWS·Kubernetes 배포 및 Docker 실행은 미검증입니다.

[GitHub Pages 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
