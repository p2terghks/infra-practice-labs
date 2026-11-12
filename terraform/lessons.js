'use strict';
const LESSONS = [
{
 id:'resource',group:'01 · 리소스와 연결',title:'첫 번째 리소스 만들기',short:'리소스 선언',tag:'기초 문법',desc:'S3 버킷 하나를 코드로 표현해 보세요. 리소스 종류, 코드에서 부를 이름, 실제 이름을 구분하는 첫 연습입니다.',objectives:['resource 블록 구조','코드 이름과 실제 이름 구분'],file:'main.tf',
 code:`resource "aws_s3_bucket" "lab" {
  bucket = "my-terraform-lab-12345"
}`,
 concept:'aws_s3_bucket은 리소스 종류, lab은 Terraform 안의 이름입니다. 실제 AWS 버킷 이름은 bucket에 적은 문자열입니다. 버킷 이름은 전 세계에서 고유해야 합니다.',
 hints:['resource "종류" "코드에서_부를_이름" { ... } 구조로 작성하세요.','리소스 종류는 aws_s3_bucket, 코드 이름은 lab입니다.','bucket = "my-terraform-lab-12345"를 중괄호 안에 넣고 닫으세요.'],
 planIntro:'아직 버킷이 없는 상태에서 이 코드를 추가한다고 가정합니다. + 기호와 마지막 요약을 읽어보세요.',
 plan:`# aws_s3_bucket.lab will be created
+ resource "aws_s3_bucket" "lab" {
    + bucket = "my-terraform-lab-12345"
    + id     = (known after apply)
  }

Plan: 1 to add, 0 to change, 0 to destroy.`,
 question:'이 plan을 적용하면 무엇이 생길까요?',options:['이름이 lab인 S3 버킷','이름이 my-terraform-lab-12345인 S3 버킷','S3 버킷 두 개'],answer:1,explain:'lab은 코드 안의 이름입니다. 실제 AWS 버킷 이름은 bucket 속성에 적은 값입니다.'
},
{
 id:'reference',title:'리소스끼리 연결하기',short:'리소스 참조',tag:'리소스 참조',desc:'앞에서 만든 버킷에 공개 액세스 차단 설정을 연결합니다. 이름을 다시 적는 대신, 버킷 리소스의 id를 참조하세요.',objectives:['종류.이름.속성 읽기','자동 의존성 이해'],file:'security.tf',
 code:`resource "aws_s3_bucket_public_access_block" "security" {
  bucket = aws_s3_bucket.lab.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}`,
 concept:'aws_s3_bucket.lab.id는 lab 버킷의 ID를 가져옵니다. 이 참조로 Terraform은 버킷을 먼저 준비해야 한다는 의존성을 파악합니다. 참조 식에는 따옴표를 붙이지 않습니다.',
 hints:['bucket 오른쪽에는 문자열 대신 aws_s3_bucket.lab.id를 쓰세요.','네 가지 공개 차단 설정은 모두 true입니다.','참조 형식은 리소스종류.코드이름.속성입니다. 이 예제는 앞 단계의 lab 버킷을 전제로 합니다.'],
 planIntro:'앞 단계의 버킷과 이번 공개 차단 설정을 처음 함께 만든다고 가정합니다. Terraform 리소스 두 개는 버킷 두 개와 다릅니다.',
 plan:`# aws_s3_bucket.lab will be created
+ resource "aws_s3_bucket" "lab" { ... }

# aws_s3_bucket_public_access_block.security will be created
+ resource "aws_s3_bucket_public_access_block" "security" {
    + bucket = (known after apply)
  }

Plan: 2 to add, 0 to change, 0 to destroy.`,
 question:'2 to add는 무엇을 의미할까요?',options:['S3 버킷을 두 개 만든다','버킷과 공개 차단 설정을 각각 만든다','두 번 apply해야 한다'],answer:1,explain:'버킷 하나와 공개 차단 설정 하나입니다. 참조를 통해 필요한 생성 순서도 파악합니다.'
},
{
 id:'variable',title:'바뀌는 값은 변수로',short:'변수 사용',tag:'변수 참조',desc:'매번 코드의 버킷 이름을 찾아 바꾸지 않도록 변수로 분리합니다. var.이름으로 입력 변수를 가져올 수 있습니다.',objectives:['variable 선언','var.bucket_name 참조'],file:'main.tf',
 code:`variable "bucket_name" {
  type    = string
  default = "my-terraform-lab-12345"
}

resource "aws_s3_bucket" "lab" {
  bucket = var.bucket_name
}`,
 concept:'var.bucket_name은 입력 변수를 참조합니다. 변수 선언 자체가 AWS 리소스를 만들지는 않습니다. 이 예제에서는 기본값이 이전 실제 버킷 이름과 같습니다.',
 hints:['variable "bucket_name" 블록에서 type = string을 선언하세요.','default에는 기존 버킷 이름을 그대로 넣으세요.','bucket = var.bucket_name입니다. "var.bucket_name"처럼 문자열로 쓰지 마세요.'],
 planIntro:'기존 버킷 이름과 같은 값을 변수로 옮겼고, 다른 변경은 없다고 가정합니다. 코드 모양이 달라도 실제 목표 값이 같으면 변경이 없을 수 있습니다.',
 plan:`No changes. Your infrastructure matches the configuration.

# bucket의 목표 값은 이전과 동일합니다.
# "my-terraform-lab-12345"`,
 question:'코드를 변수로 바꿨는데 왜 No changes일까요?',options:['Terraform이 변수를 읽지 못해서','variable 블록은 항상 무시돼서','최종 버킷 이름 값이 기존과 같아서'],answer:2,explain:'Terraform은 최종 목표 값과 현재 상태를 비교합니다. 같은 문자열을 변수로 분리한 것만으로 버킷을 다시 만들지 않습니다.'
},
{
 id:'output',title:'만든 리소스의 값 꺼내기',short:'출력값과 ARN',tag:'속성 참조',desc:'버킷의 ARN을 출력으로 노출해 봅니다. 같은 리소스도 id, arn처럼 여러 속성을 가지고 있습니다.',objectives:['output 선언','id와 arn 구분'],file:'outputs.tf',
 code:`output "bucket_arn" {
  description = "실습 버킷의 ARN"
  value       = aws_s3_bucket.lab.arn
}`,
 concept:'id는 이 S3 리소스에서 버킷 이름이고 arn은 AWS 리소스 식별자입니다. output은 값을 보여주는 선언이며, 별도의 AWS 리소스를 만들지 않습니다. lab 버킷이 선언되어 있다는 전제입니다.',
 hints:['output "bucket_arn" { ... } 블록을 만드세요.','description 문자열은 "실습 버킷의 ARN"입니다.','value = aws_s3_bucket.lab.arn으로 ARN 속성을 참조하세요.'],
 planIntro:'기존 버킷은 그대로이고 output만 추가한다고 가정합니다. 리소스 변경과 출력 변경은 별개입니다.',
 plan:`Changes to Outputs:
  + bucket_arn = "arn:aws:s3:::my-terraform-lab-12345"

# AWS 리소스의 추가·수정·삭제는 없습니다.`,
 question:'output을 추가하면 AWS 리소스도 하나 더 만들어질까요?',options:['아니요. 기존 리소스의 값을 출력합니다','네. ARN 리소스가 생성됩니다','네. 버킷이 복제됩니다'],answer:0,explain:'output은 값의 출력 선언입니다. 리소스 생성 개수로 세지 않습니다.'
},
{
 id:'update',group:'02 · 변경 계획 읽기',title:'기존 리소스 수정하기',short:'수정 읽기 · ~',tag:'PLAN · 수정',desc:'기존 버킷에 관리용 태그를 추가합니다. ~ 표시와 현재 값에서 새 값으로 바뀌는 부분을 찾아보세요.',objectives:['updated in-place 의미','변경 전후 값 확인'],file:'main.tf',
 code:`resource "aws_s3_bucket" "lab" {
  bucket = "my-terraform-lab-12345"

  tags = {
    Environment = "lab"
    ManagedBy   = "terraform"
  }
}`,
 concept:'태그는 관리용 정보입니다. 이 예제에서는 기존 버킷을 교체하지 않고 태그만 수정합니다. plan의 ~와 updated in-place를 함께 읽으세요.',
 hints:['기존 bucket 값은 그대로 두세요.','tags = { ... } 안에 두 개의 키와 값을 넣습니다.','Environment = "lab", ManagedBy = "terraform"입니다. 키의 대소문자도 확인하세요.'],
 planIntro:'태그가 없던 기존 버킷에 두 개의 태그를 추가하는 상황입니다. 아래 출력은 핵심만 줄인 예시입니다.',
 plan:`# aws_s3_bucket.lab will be updated in-place
~ resource "aws_s3_bucket" "lab" {
    ~ tags = {
        + "Environment" = "lab"
        + "ManagedBy"   = "terraform"
      }
  }

Plan: 0 to add, 1 to change, 0 to destroy.`,
 question:'태그 앞의 +는 새 버킷이 생긴다는 뜻일까요?',options:['네. 태그마다 버킷이 만들어집니다','아니요. 기존 버킷의 태그 속성이 추가됩니다','아니요. 기존 버킷이 먼저 삭제됩니다'],answer:1,explain:'리소스의 ~는 기존 버킷 수정입니다. 속성 안의 +는 태그 값 추가이며 새 리소스 생성과 구분해야 합니다.'
},
{
 id:'replacement',title:'이름 변경은 교체일 수 있어요',short:'교체 읽기 · −/+',tag:'PLAN · 교체',desc:'버킷 이름을 바꾸는 변경 계획을 읽어봅니다. 단순한 문자열 수정처럼 보여도 실제로는 삭제와 생성이 필요할 수 있습니다.',objectives:['forces replacement 찾기','수정과 교체 구분'],file:'main.tf',
 code:`resource "aws_s3_bucket" "lab" {
  bucket = "my-terraform-lab-renamed-12345"
}`,
 concept:'이 단계는 이전 버킷의 이름만 바꾸는 별도 상황입니다. S3 버킷 이름 변경은 교체 계획을 만들 수 있습니다. Terraform이 기존 객체를 새 버킷으로 자동 이동하는 것은 아닙니다.',
 hints:['Terraform 코드 이름 lab은 그대로입니다.','bucket 값에 renamed가 들어갑니다.','정확한 문자열은 "my-terraform-lab-renamed-12345"입니다. 실제 배포는 하지 않습니다.'],
 planIntro:'기존 버킷 이름이 my-terraform-lab-12345이고 태그 등 다른 변경은 없다고 가정합니다. −/+와 forces replacement에 주목하세요.',
 plan:`# aws_s3_bucket.lab must be replaced
-/+ resource "aws_s3_bucket" "lab" {
    ~ bucket = "my-terraform-lab-12345"
            -> "my-terraform-lab-renamed-12345"
            # forces replacement
  }

Plan: 1 to add, 0 to change, 1 to destroy.`,
 question:'이 plan을 검토할 때 가장 먼저 확인할 것은?',options:['버킷 안의 데이터와 삭제·교체 영향','태그 이름의 길이','Terraform 파일의 줄 수'],answer:0,explain:'단순 수정이 아닌 교체입니다. 삭제 영향과 데이터 보존·이전 방법을 먼저 확인해야 합니다. 실제 객체가 있으면 삭제가 실패할 수도 있습니다.'
},
{
 id:'deletion',title:'없어진 코드, 삭제되는 설정',short:'삭제 읽기 · −',tag:'PLAN · 삭제',desc:'공개 차단 블록을 코드에서 지우면 어떤 계획이 생길까요? 남은 버킷 코드를 쓰고, 의도하지 않은 삭제를 찾아보세요.',objectives:['코드와 상태의 차이','보호 설정 삭제 발견'],file:'main.tf',
 code:`resource "aws_s3_bucket" "lab" {
  bucket = "my-terraform-lab-12345"
}`,
 concept:'기존 상태에는 버킷과 공개 차단 설정이 있었지만 코드에는 버킷만 남은 상황입니다. 공개 차단을 유지하려는 프로젝트라면 이 삭제는 취소하고 블록을 복원해야 합니다.',
 hints:['이 단계에서 작성할 목표 코드는 버킷 블록 하나입니다.','bucket 이름은 처음 사용한 my-terraform-lab-12345입니다.','연습은 삭제 계획을 알아보는 목적입니다. 실제로 공개 차단을 지우지 않습니다.'],
 planIntro:'Terraform 상태에 있던 공개 차단 리소스를 코드에서 제거했다고 가정합니다. 학습을 위한 상황이며 실행하지 않습니다.',
 plan:`# aws_s3_bucket_public_access_block.security will be destroyed
# (because it is not in configuration)
- resource "aws_s3_bucket_public_access_block" "security" {
    - block_public_policy = true -> null
    - restrict_public_buckets = true -> null
  }

Plan: 0 to add, 0 to change, 1 to destroy.`,
 question:'공개 차단을 유지하려는 의도라면 어떻게 해야 할까요?',options:['바로 apply한다','버킷 이름만 바꾼다','공개 차단 블록을 복원하고 plan을 다시 본다'],answer:2,explain:'설정 삭제를 의도하지 않았다면 apply하지 않습니다. 코드에 보호 설정을 복원하고 삭제 계획이 없어졌는지 다시 확인합니다.'
},
{
 id:'complete',group:'03 · 한 번에 연결하기',title:'변수 → 버킷 → 보호 → 출력',short:'종합 따라치기',tag:'종합 실습',desc:'지금까지 배운 참조를 하나의 코드로 연결합니다. 각 값이 어디에서 와서 어디로 들어가는지 생각하며 입력해 보세요.',objectives:['입력 변수와 리소스 연결','리소스 간 참조','출력값 확인'],file:'main.tf',
 code:`variable "bucket_name" {
  type    = string
  default = "my-terraform-lab-12345"
}

resource "aws_s3_bucket" "lab" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "security" {
  bucket = aws_s3_bucket.lab.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

output "bucket_arn" {
  value = aws_s3_bucket.lab.arn
}`,
 concept:'입력 변수 → 버킷 생성 → 버킷 ID로 공개 차단 연결 → 버킷 ARN 출력. variable과 output은 AWS 리소스가 아닙니다. 이 종합 코드는 provider·인증·리전 설정을 생략한 학습 예제입니다.',
 hints:['먼저 variable과 버킷 블록을 연결하세요. bucket = var.bucket_name입니다.','공개 차단의 bucket에는 aws_s3_bucket.lab.id를 넣습니다. 네 설정은 모두 true입니다.','마지막 output은 aws_s3_bucket.lab.arn을 참조합니다. 긴 예제이므로 중괄호도 확인하세요.'],
 planIntro:'기존 리소스가 전혀 없는 새 환경이라고 가정합니다. 선언한 블록 수와 실제 생성 리소스 수를 구분하세요.',
 plan:`# aws_s3_bucket.lab will be created
+ resource "aws_s3_bucket" "lab" { ... }

# aws_s3_bucket_public_access_block.security will be created
+ resource "aws_s3_bucket_public_access_block" "security" { ... }

Changes to Outputs:
  + bucket_arn = (known after apply)

Plan: 2 to add, 0 to change, 0 to destroy.`,
 question:'블록은 네 개인데 왜 2 to add일까요?',options:['variable과 output도 포함해서 실제로는 네 개다','AWS 리소스는 버킷과 공개 차단 설정 두 개다','output은 apply 후 자동 삭제되기 때문이다'],answer:1,explain:'variable은 입력, output은 출력입니다. AWS에 만드는 리소스는 resource로 선언한 두 개입니다. 이제 참조와 plan의 기본 흐름을 연결했습니다.'
}
];
