'use strict';
const SERVICES = [
  {
    "id": "s3",
    "name": "Amazon S3",
    "role": "저장 · 보호 대상",
    "desc": "파일을 객체로 저장하는 서비스입니다. 이번 프로젝트에서는 공개 설정을 점검할 대상과 Terraform 상태 저장소로 사용합니다.",
    "terms": [
      [
        "버킷",
        "객체를 담는 저장 공간. 이름은 전 세계에서 고유해야 합니다."
      ],
      [
        "객체",
        "버킷 안의 파일과 메타데이터."
      ],
      [
        "공개 액세스 차단",
        "공개 ACL·정책을 통한 접근을 제한하는 네 가지 설정."
      ]
    ],
    "steps": [
      "S3 콘솔에서 실습용 버킷을 선택하고 리전을 확인합니다.",
      "Permissions에서 Block public access 네 설정을 확인합니다.",
      "Terraform의 공개 차단 리소스가 같은 버킷의 id를 참조하게 합니다.",
      "계정·조직 수준 설정도 함께 확인합니다. 더 엄격한 차단이 적용됩니다."
    ],
    "code": "resource \"aws_s3_bucket\" \"lab\" {\n  bucket = \"my-terraform-lab-12345\"\n}\n\nresource \"aws_s3_bucket_public_access_block\" \"security\" {\n  bucket = aws_s3_bucket.lab.id\n\n  block_public_acls       = true\n  ignore_public_acls      = true\n  block_public_policy     = true\n  restrict_public_buckets = true\n}",
    "prereq": "기존 8단계와 같은 예제입니다. 버킷 이름은 실제 사용 시 본인만의 고유한 값으로 바꾸세요. 기본 학습 확인에서는 표시된 예제 값을 사용합니다.",
    "cli": "aws s3api get-public-access-block \\\n  --bucket REPLACE_BUCKET \\\n  --region ap-northeast-2",
    "expected": "PublicAccessBlockConfiguration의 네 값이 모두 true인지 확인합니다. 차단 설정만으로 기존 공개 정책 자체가 삭제되지는 않습니다.",
    "errors": [
      [
        "BucketAlreadyExists",
        "전 세계에서 이미 쓰는 이름일 수 있습니다. 고유한 이름을 사용합니다."
      ],
      [
        "AccessDenied",
        "IAM 권한과 계정·조직 정책을 확인합니다. 차단을 무조건 해제하지 않습니다."
      ]
    ],
    "cost": "저장량·요청·전송 등에 비용이 발생할 수 있습니다. 버전 관리 버킷은 모든 버전과 삭제 마커까지 정리합니다.",
    "source": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html",
    "takeaway": "bucket = aws_s3_bucket.lab.id는 보호 대상을 연결하는 참조입니다."
  },
  {
    "id": "iam",
    "name": "AWS IAM",
    "role": "인증 · 권한",
    "desc": "누가 어떤 AWS 작업을 할 수 있는지 정합니다. Lambda는 실행 역할을 맡아 S3를 수정하고 로그를 기록합니다.",
    "terms": [
      [
        "신뢰 정책",
        "이 역할을 누가 맡을 수 있는지 정합니다."
      ],
      [
        "권한 정책",
        "역할을 맡은 뒤 어떤 리소스에 어떤 작업을 할 수 있는지 정합니다."
      ],
      [
        "최소 권한",
        "필요한 작업과 대상만 허용합니다."
      ]
    ],
    "steps": [
      "IAM 콘솔 → Roles에서 Lambda용 실행 역할을 확인합니다.",
      "Trust relationships에서 lambda.amazonaws.com의 AssumeRole을 확인합니다.",
      "Permissions에서 S3 수정 권한의 Action과 Resource를 확인합니다.",
      "로그 권한과 실패 큐 SendMessage 권한은 해당 기능을 사용할 때 별도로 추가합니다."
    ],
    "code": "resource \"aws_iam_role\" \"remediate\" {\n  name = \"cspm-lab-remediate-s3\"\n  assume_role_policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect = \"Allow\"\n      Action = \"sts:AssumeRole\"\n      Principal = { Service = \"lambda.amazonaws.com\" }\n    }]\n  })\n}\n\nresource \"aws_iam_role_policy\" \"s3_access\" {\n  role = aws_iam_role.remediate.id\n  policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect   = \"Allow\"\n      Action   = \"s3:PutBucketPublicAccessBlock\"\n      Resource = \"arn:aws:s3:::my-terraform-lab-12345\"\n    }]\n  })\n}",
    "prereq": "역할과 S3 권한의 연결만 보여주는 예제입니다. GetBucketTagging·CloudWatch Logs·실패 큐 권한은 포함하지 않아 프로젝트 전체 실행 역할로는 불충분합니다. 이미 같은 역할이 있으면 중복 생성하지 않습니다.",
    "cli": "aws iam get-role \\\n  --role-name cspm-lab-remediate-s3",
    "expected": "AssumeRolePolicyDocument와 역할 ARN을 확인합니다. get-role은 신뢰 정책을 보여주며 연결된 모든 권한 정책까지 보여주는 명령은 아닙니다.",
    "errors": [
      [
        "함수 생성 시 역할을 맡지 못함",
        "신뢰 정책의 Principal과 역할 ARN, IAM 반영 지연을 확인합니다."
      ],
      [
        "S3 작업에서 AccessDenied",
        "실행 역할의 Action·Resource와 명시적 Deny, SCP를 확인합니다. 관리자 정책을 붙여 해결한 것으로 처리하지 않습니다."
      ]
    ],
    "cost": "이 예제의 IAM 역할·정책에 별도 사용료는 없지만, 허용한 서비스 작업에는 해당 서비스 비용이 발생할 수 있습니다.",
    "source": "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html",
    "takeaway": "신뢰 정책은 누가, 권한 정책은 무엇을 할 수 있는지를 정합니다."
  },
  {
    "id": "config",
    "name": "AWS Config",
    "role": "설정 기록 · 위반 평가",
    "desc": "리소스 설정 이력과 규칙 준수 여부를 평가합니다. S3 공개 설정 위반을 NON_COMPLIANT로 표시하는 탐지 담당입니다.",
    "terms": [
      [
        "기록기",
        "어떤 리소스 설정을 기록할지 지정합니다."
      ],
      [
        "전달 채널",
        "기록·스냅샷을 저장할 S3 목적지를 정합니다."
      ],
      [
        "관리형 규칙",
        "AWS가 제공하는 평가 로직. 평가와 복구는 별개입니다."
      ]
    ],
    "steps": [
      "Config를 사용할 리전과 기존 기록기 유무를 확인합니다.",
      "기록 대상을 AWS::S3::Bucket으로 제한하고 기록 역할과 전달 버킷을 구성합니다.",
      "전달 채널을 준비한 뒤 기록기를 시작합니다.",
      "관리형 규칙을 추가하고 리소스별 평가 결과를 확인합니다. 평가는 비동기라 시간이 걸릴 수 있습니다."
    ],
    "code": "resource \"aws_config_config_rule\" \"s3_public\" {\n  name = \"s3-bucket-level-public-access-prohibited\"\n\n  source {\n    owner             = \"AWS\"\n    source_identifier = \"S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED\"\n  }\n\n  depends_on = [aws_config_configuration_recorder_status.main]\n}",
    "prereq": "기본 프로젝트의 기록기·전달 채널·기록 역할·전달 버킷과 aws_config_configuration_recorder_status.main이 먼저 필요합니다. 이 규칙 블록만으로 Config를 켤 수는 없습니다.",
    "cli": "aws configservice get-compliance-details-by-resource \\\n  --resource-type AWS::S3::Bucket \\\n  --resource-id REPLACE_BUCKET \\\n  --region ap-northeast-2",
    "expected": "EvaluationResults의 규칙 이름과 ComplianceType을 확인합니다. NON_COMPLIANT는 평가 결과이며 Lambda가 실행됐다는 증거는 아닙니다.",
    "errors": [
      [
        "결과가 비어 있음",
        "리전, 기록 대상, 기록기 시작 상태와 평가 지연을 확인합니다."
      ],
      [
        "전달 채널 오류",
        "Config 역할의 전달 버킷 권한과 목적지 이름을 확인합니다."
      ]
    ],
    "cost": "기록과 규칙 평가 등에 과금됩니다. 실습 뒤 규칙·기록기·전달 채널을 삭제하고 전달 버킷도 정리합니다.",
    "source": "https://docs.aws.amazon.com/config/latest/developerguide/s3-bucket-level-public-access-prohibited.html",
    "takeaway": "NON_COMPLIANT는 탐지 결과입니다. 실제 조치는 다른 서비스가 수행합니다."
  },
  {
    "id": "eventbridge",
    "name": "Amazon EventBridge",
    "role": "이벤트 필터 · 전달",
    "desc": "서비스 이벤트 중 필요한 것만 골라 대상으로 전달합니다. 이번 프로젝트에서는 Config 위반 전이를 Lambda 호출로 연결합니다.",
    "terms": [
      [
        "이벤트 버스",
        "이벤트가 들어오는 통로. 이 실습은 기본 버스를 사용합니다."
      ],
      [
        "규칙 패턴",
        "어떤 이벤트를 통과시킬지 정하는 JSON 조건."
      ],
      [
        "대상",
        "규칙에 맞는 이벤트를 전달받는 Lambda 등."
      ]
    ],
    "steps": [
      "기본 이벤트 버스에 규칙을 만들고 source와 detail-type을 지정합니다.",
      "규칙 이름과 NON_COMPLIANT 조건을 detail에서 필터링합니다.",
      "대상 Lambda를 연결하고 함수의 리소스 정책에 해당 규칙 호출을 허용합니다.",
      "전달 실패 DLQ는 별도로 연결하고 큐의 SendMessage 정책도 구성합니다."
    ],
    "code": "resource \"aws_cloudwatch_event_rule\" \"noncompliant\" {\n  name = \"cspm-lab-s3-noncompliant\"\n  event_pattern = jsonencode({\n    source        = [\"aws.config\"]\n    \"detail-type\" = [\"Config Rules Compliance Change\"]\n    detail = {\n      configRuleName = [aws_config_config_rule.s3_public.name]\n      newEvaluationResult = {\n        complianceType = [\"NON_COMPLIANT\"]\n      }\n    }\n  })\n}\n\nresource \"aws_cloudwatch_event_target\" \"remediate\" {\n  rule = aws_cloudwatch_event_rule.noncompliant.name\n  arn  = aws_lambda_function.remediate.arn\n}",
    "prereq": "기본 프로젝트의 Config 규칙과 Lambda 함수가 있어야 합니다. 별도의 aws_lambda_permission으로 events.amazonaws.com에 해당 규칙 ARN의 함수 호출을 허용해야 합니다. 예제에는 DLQ·재시도 설정이 생략되어 있습니다.",
    "cli": "aws events list-targets-by-rule \\\n  --rule cspm-lab-s3-noncompliant \\\n  --region ap-northeast-2",
    "expected": "Targets에 기대한 Lambda ARN이 있는지 확인합니다. 대상이 존재해도 호출 허용이나 실행 성공을 보장하지 않습니다.",
    "errors": [
      [
        "Lambda 로그가 없음",
        "이벤트 패턴, 대상, 함수 리소스 정책, Config 상태 전이를 확인합니다."
      ],
      [
        "함수는 호출됐지만 복구 실패",
        "Lambda 내부 오류입니다. EventBridge 전달 성공과 함수 실행 성공을 나눠 조사합니다."
      ]
    ],
    "cost": "이벤트 유형·전달 기능 등에 따라 요금이 달라집니다. 연결한 Lambda·DLQ·로그 비용도 확인하고 규칙·대상을 함께 정리합니다.",
    "source": "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-dlq.html",
    "takeaway": "Terraform 이름에 cloudwatch_event가 들어가도 이 리소스는 EventBridge 규칙·대상입니다."
  },
  {
    "id": "lambda",
    "name": "AWS Lambda",
    "role": "코드 실행 · 자동 복구",
    "desc": "서버를 직접 관리하지 않고 함수를 실행합니다. 이 실습에서는 이벤트의 버킷을 확인하고 공개 액세스 차단을 켭니다.",
    "terms": [
      [
        "핸들러",
        "실행을 시작할 파일과 함수. 파일명.함수명 형식입니다."
      ],
      [
        "실행 역할",
        "함수가 AWS API를 호출할 때 쓰는 권한."
      ],
      [
        "비동기 호출",
        "접수와 실행 결과가 분리됩니다. 접수 성공은 처리 성공이 아닙니다."
      ]
    ],
    "steps": [
      "검증한 Python 코드를 zip으로 준비하고 핸들러를 지정합니다.",
      "실행 역할, 시간 제한, 로그와 환경 변수를 확인합니다.",
      "기본 프로젝트의 검증된 실습 버킷 이벤트로 함수를 호출합니다.",
      "로그·반환값·S3 설정을 함께 확인합니다. 비동기 실패는 destination으로 보관합니다."
    ],
    "code": "resource \"aws_lambda_function\" \"remediate\" {\n  function_name = \"cspm-lab-remediate-s3\"\n  role          = aws_iam_role.remediate.arn\n  runtime       = \"python3.12\"\n  handler       = \"s3_block_public.handler\"\n\n  filename         = data.archive_file.remediate.output_path\n  source_code_hash = data.archive_file.remediate.output_base64sha256\n  timeout          = 30\n\n  environment {\n    variables = {\n      DRY_RUN = \"true\"\n    }\n  }\n}",
    "prereq": "기본 프로젝트의 IAM 실행 역할, archive provider, data.archive_file.remediate와 핸들러 코드가 필요합니다. 기존 코드가 CONFIG_RULE_NAME·BUCKET_PREFIX를 요구하면 환경 변수도 유지하세요. 이 예제는 구조 설명용 발췌이며 그대로 기존 함수를 덮어쓰지 않습니다.",
    "cli": "aws logs tail /aws/lambda/cspm-lab-remediate-s3 \\\n  --since 15m \\\n  --region ap-northeast-2",
    "expected": "동일 버킷의 dry-run·remediated·오류 로그를 확인합니다. DRY_RUN=true는 실제 수정하지 않습니다. 비동기 StatusCode 202는 요청 접수만 뜻합니다.",
    "errors": [
      [
        "Runtime.ImportModuleError",
        "zip 최상위 파일과 핸들러 이름을 확인합니다."
      ],
      [
        "AccessDenied 또는 로그 없음",
        "실행 역할의 작업 권한·로그 권한과 호출 경로를 구분해 확인합니다."
      ]
    ],
    "cost": "호출·실행 시간과 로그 등에 비용이 생길 수 있습니다. 함수를 지워도 자동 생성 로그 그룹은 남을 수 있습니다.",
    "source": "https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html",
    "takeaway": "함수의 호출 허용 정책과 실행 역할은 다른 권한입니다."
  },
  {
    "id": "sqs",
    "name": "Amazon SQS",
    "role": "실패 보관 · 재처리",
    "desc": "처리할 메시지를 보관하는 큐입니다. 이번 실습은 EventBridge 전달 실패와 Lambda 실행 실패를 서로 다른 큐에 보관합니다.",
    "terms": [
      [
        "Visibility timeout",
        "수신한 메시지를 잠시 다른 소비자에게 숨기는 시간."
      ],
      [
        "ReceiptHandle",
        "수신한 메시지를 삭제할 때 쓰는 핸들. 최신 수신 값을 사용합니다."
      ],
      [
        "DLQ / 실패 destination",
        "실패 경로에 따라 원래 이벤트 또는 invocation record가 들어옵니다."
      ]
    ],
    "steps": [
      "Standard 큐를 만들고 저장 암호화와 보존 기간을 정합니다.",
      "이벤트를 보낼 서비스의 SendMessage 권한을 구성합니다.",
      "메시지를 수신하고 실패 원인을 확인한 뒤 올바른 입력만 재처리합니다.",
      "복구 결과를 확인하고 해당 메시지를 삭제합니다. 수신만으로 삭제되지 않습니다."
    ],
    "code": "resource \"aws_sqs_queue\" \"execution_failures\" {\n  name                       = \"cspm-lab-execution-failures\"\n  message_retention_seconds  = 604800\n  visibility_timeout_seconds = 300\n  sqs_managed_sse_enabled     = true\n}\n\noutput \"execution_queue_url\" {\n  value = aws_sqs_queue.execution_failures.url\n}",
    "prereq": "큐를 만드는 예제입니다. Lambda on_failure destination 연결과 실행 역할의 sqs:SendMessage 권한은 별도로 필요합니다. 예제의 보존·가시성 시간은 학습용 선택값입니다.",
    "cli": "aws sqs receive-message \\\n  --queue-url REPLACE_QUEUE_URL \\\n  --max-number-of-messages 1 \\\n  --wait-time-seconds 10 \\\n  --visibility-timeout 300 \\\n  --region ap-northeast-2",
    "expected": "실패 메시지가 있으면 Messages의 Body·ReceiptHandle을 확인합니다. Lambda 실패 destination은 Body.requestPayload를 꺼내야 원래 입력이 됩니다. EventBridge DLQ는 Body 자체가 원래 이벤트입니다.",
    "errors": [
      [
        "수신 결과가 비어 있음",
        "메시지 없음, 가시성 시간, 큐 URL·리전, 재시도 종료 여부를 확인합니다."
      ],
      [
        "재처리 후 같은 메시지가 반복됨",
        "성공 확인 후 삭제했는지, visibility timeout과 중복 전달을 고려했는지 확인합니다."
      ]
    ],
    "cost": "요청과 관련 데이터 전송 등에 과금될 수 있습니다. 증거를 저장한 후 메시지·큐를 정리합니다.",
    "source": "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html",
    "takeaway": "메시지 수신과 삭제는 별개입니다. 성공 증거를 확인한 후 삭제합니다."
  },
  {
    "id": "cloudwatch",
    "name": "Amazon CloudWatch",
    "role": "로그 · 지표 · 알람",
    "desc": "실행 기록을 찾고 실패를 수치로 감시합니다. Lambda의 Errors와 SQS 적체를 확인해 장애를 알아챕니다.",
    "terms": [
      [
        "Logs",
        "함수의 출력과 오류 상세를 찾는 기록."
      ],
      [
        "Metrics",
        "Errors·Duration 등 시간별 수치."
      ],
      [
        "Alarm",
        "지표가 기준을 넘을 때 상태를 바꾸고 SNS 등에 알리는 설정."
      ]
    ],
    "steps": [
      "Lambda 로그 그룹에서 시간 범위와 오류를 확인합니다.",
      "Metrics의 AWS/Lambda에서 FunctionName 차원을 선택합니다.",
      "Errors의 Sum을 기준으로 알람을 만들고 SNS를 연결합니다.",
      "알람 상태·실제 지표·메일 수신을 함께 검증합니다. 로그와 지표는 자동으로 같은 의미가 되지 않습니다."
    ],
    "code": "resource \"aws_cloudwatch_metric_alarm\" \"lambda_errors\" {\n  alarm_name          = \"cspm-lab-lambda-errors\"\n  namespace           = \"AWS/Lambda\"\n  metric_name         = \"Errors\"\n  statistic           = \"Sum\"\n  period              = 60\n  evaluation_periods  = 1\n  comparison_operator = \"GreaterThanOrEqualToThreshold\"\n  threshold           = 1\n  treat_missing_data  = \"notBreaching\"\n\n  dimensions = {\n    FunctionName = aws_lambda_function.remediate.function_name\n  }\n  alarm_actions = [aws_sns_topic.alerts.arn]\n}",
    "prereq": "기본 프로젝트의 Lambda와 SNS 토픽이 필요합니다. 이 예제는 60초 구간에 오류 1회 이상을 기준으로 합니다. 실제 관측 기간·누락 데이터 처리는 서비스 특성에 맞게 정합니다.",
    "cli": "aws cloudwatch describe-alarms \\\n  --alarm-names cspm-lab-lambda-errors \\\n  --region ap-northeast-2",
    "expected": "MetricAlarms의 StateValue와 StateReason을 읽습니다. Errors·Throttles·DestinationDeliveryFailures를 구분하고, Duration을 전체 복구 시간으로 해석하지 않습니다.",
    "errors": [
      [
        "데이터가 없거나 알람이 울리지 않음",
        "namespace·지표·차원·리전·시간 범위와 데이터 반영을 확인합니다."
      ],
      [
        "ALARM인데 메일이 없음",
        "alarm_actions의 토픽 ARN과 SNS 구독 확정을 확인합니다."
      ]
    ],
    "cost": "로그 저장·조회, 지표·알람 등에 과금될 수 있습니다. 로그 보존 기간을 정하고 실습 뒤 알람과 로그를 정리합니다.",
    "source": "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Alarms.html",
    "takeaway": "로그는 왜 실패했는지, 지표·알람은 실패가 발생했는지를 파악하는 데 씁니다."
  },
  {
    "id": "sns",
    "name": "Amazon SNS",
    "role": "구독자에게 알림 전달",
    "desc": "토픽에 게시한 알림을 구독자에게 전달합니다. 이 실습에서는 CloudWatch 알람을 이메일로 받는 역할입니다.",
    "terms": [
      [
        "토픽",
        "알림을 게시할 대상. 직접 이메일 구독은 Standard 토픽을 사용합니다."
      ],
      [
        "구독",
        "이메일 등 알림을 받을 목적지."
      ],
      [
        "구독 확정",
        "이메일의 확인 링크를 눌러야 실제 수신할 수 있습니다."
      ]
    ],
    "steps": [
      "SNS 콘솔에서 Standard 토픽을 확인하거나 생성합니다.",
      "이메일 구독을 추가하고 받은 메일의 확인 링크를 누릅니다.",
      "구독 상태가 PendingConfirmation이 아닌지 확인합니다.",
      "CloudWatch 알람의 작업에 이 토픽 ARN을 연결하고 실제 알람으로 검증합니다."
    ],
    "code": "variable \"alert_email\" {\n  type = string\n}\n\nresource \"aws_sns_topic\" \"alerts\" {\n  name = \"cspm-lab-alerts\"\n}\n\nresource \"aws_sns_topic_subscription\" \"email\" {\n  topic_arn = aws_sns_topic.alerts.arn\n  protocol  = \"email\"\n  endpoint  = var.alert_email\n}",
    "prereq": "실행 시 alert_email 입력 변수가 필요합니다. 웹에는 실제 이메일을 입력할 필요가 없습니다. 이 교육용 예제는 비민감 알람만 전송합니다. 기밀 알림용 저장 암호화는 KMS·게시 권한을 함께 설계하세요.",
    "cli": "aws sns list-subscriptions-by-topic \\\n  --topic-arn REPLACE_TOPIC_ARN \\\n  --region ap-northeast-2",
    "expected": "Protocol·Endpoint·SubscriptionArn을 확인합니다. PendingConfirmation이면 수신 이메일에서 구독을 확정합니다. 조회 출력에는 이메일이 있으므로 공개 캡처 전에 가립니다.",
    "errors": [
      [
        "확인 메일 또는 알람이 안 옴",
        "스팸함, 올바른 이메일, 구독 확정, 토픽·알람 연결을 확인합니다."
      ],
      [
        "같은 메시지가 여러 번 옴",
        "중복 구독과 반복 알람 상태 전이를 확인합니다."
      ]
    ],
    "cost": "게시·전달 등에 과금될 수 있습니다. 실습 뒤 구독과 토픽을 정리합니다. 토픽을 삭제하기 전에 사용하는 알람을 확인합니다.",
    "source": "https://docs.aws.amazon.com/sns/latest/dg/sns-email-notifications.html",
    "takeaway": "토픽 생성만으로 이메일이 오지 않습니다. 구독 추가와 확정이 필요합니다."
  },
  {
    "id": "vpc",
    "name": "Amazon VPC",
    "role": "네트워크 경계",
    "desc": "먼저 모든 리소스가 들어갈 네트워크 공간을 만듭니다.",
    "terms": [
      [
        "받는 값",
        "AWS 로그인·리전 · Terraform AWS provider"
      ],
      [
        "다음으로 넘기는 값",
        "aws_vpc.lab.id · 사용 가능한 AZ 목록"
      ],
      [
        "연결 포인트",
        "provider는 AWS 접근 설정입니다. VPC의 id를 이후 서브넷·라우팅·보안 그룹이 참조합니다."
      ]
    ],
    "steps": [
      "먼저 모든 리소스가 들어갈 네트워크 공간을 만듭니다.",
      "provider는 AWS 접근 설정입니다. VPC의 id를 이후 서브넷·라우팅·보안 그룹이 참조합니다.",
      "terraform init → validate → plan 순서로 확인",
      "client_cidr에 본인 공인 IPv4/32 입력"
    ],
    "code": "terraform {\n  required_version = \">= 1.11\"\n  required_providers {\n    aws = { source = \"hashicorp/aws\", version = \"~> 6.0\" }\n  }\n}\n\nprovider \"aws\" {\n  region = \"ap-northeast-2\"\n  default_tags {\n    tags = { Project = \"terraform-connect-lab\" }\n  }\n}\n\nvariable \"client_cidr\" {\n  type        = string\n  description = \"접속할 본인 공인 IPv4/32\"\n  validation {\n    condition     = can(cidrhost(var.client_cidr, 0)) && endswith(var.client_cidr, \"/32\")\n    error_message = \"본인 공인 IPv4 주소/32를 입력하세요.\"\n  }\n}\n\ndata \"aws_availability_zones\" \"available\" {\n  state = \"available\"\n}\n\nresource \"aws_vpc\" \"lab\" {\n  cidr_block           = \"10.30.0.0/16\"\n  enable_dns_support   = true\n  enable_dns_hostnames = true\n  tags                 = { Name = \"connect-lab-vpc\" }\n}",
    "prereq": "연결 실습 탭의 앞 단계와 함께 사용하는 코드입니다. 이 블록만으로 전체 배포되지는 않습니다. 실습은 이전 S3 프로젝트와 별도의 빈 폴더에서 시작합니다. provider·동일 이름 리소스를 기존 폴더에 중복 추가하지 않습니다.",
    "cli": "aws ec2 describe-vpcs --region ap-northeast-2",
    "expected": "terraform init → validate → plan 순서로 확인 · client_cidr에 본인 공인 IPv4/32 입력",
    "errors": [
      [
        "연결이 안 될 때",
        "provider는 AWS 접근 설정입니다. VPC의 id를 이후 서브넷·라우팅·보안 그룹이 참조합니다."
      ],
      [
        "추가 확인",
        "실습은 이전 S3 프로젝트와 별도의 빈 폴더에서 시작합니다. provider·동일 이름 리소스를 기존 폴더에 중복 추가하지 않습니다."
      ]
    ],
    "cost": "실제 생성 시 EC2·EBS·ALB·public IPv4·트래픽 등에 비용이 발생할 수 있습니다. 연결 실습은 NAT Gateway를 만들지 않지만 무료 구성을 의미하지 않습니다. 전체 실습 폴더에서 destroy한 뒤 잔여 리소스를 확인합니다.",
    "source": "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html",
    "takeaway": "provider는 AWS 접근 설정입니다. VPC의 id를 이후 서브넷·라우팅·보안 그룹이 참조합니다."
  },
  {
    "id": "subnet",
    "name": "서브넷 · AZ",
    "role": "가용 영역별 네트워크",
    "desc": "서로 다른 가용 영역에 ALB가 사용할 네트워크를 나눕니다.",
    "terms": [
      [
        "받는 값",
        "aws_vpc.lab.id · AZ names[0] · names[1]"
      ],
      [
        "다음으로 넘기는 값",
        "aws_subnet.public_a.id · aws_subnet.public_b.id"
      ],
      [
        "연결 포인트",
        "vpc_id가 서브넷을 VPC에 연결합니다. 이름에 public이 있어도 아직 인터넷 경로는 없습니다."
      ]
    ],
    "steps": [
      "서로 다른 가용 영역에 ALB가 사용할 네트워크를 나눕니다.",
      "vpc_id가 서브넷을 VPC에 연결합니다. 이름에 public이 있어도 아직 인터넷 경로는 없습니다.",
      "VPC 콘솔에서 두 서브넷의 VPC와 AZ 확인",
      "ALB를 지원하는 서로 다른 두 AZ인지 확인"
    ],
    "code": "resource \"aws_subnet\" \"public_a\" {\n  vpc_id                  = aws_vpc.lab.id\n  cidr_block              = \"10.30.1.0/24\"\n  availability_zone       = data.aws_availability_zones.available.names[0]\n  map_public_ip_on_launch = true\n}\n\nresource \"aws_subnet\" \"public_b\" {\n  vpc_id                  = aws_vpc.lab.id\n  cidr_block              = \"10.30.2.0/24\"\n  availability_zone       = data.aws_availability_zones.available.names[1]\n  map_public_ip_on_launch = true\n}",
    "prereq": "연결 실습 탭의 앞 단계와 함께 사용하는 코드입니다. 이 블록만으로 전체 배포되지는 않습니다. 이름이나 public IP 자동 할당만으로 퍼블릭 서브넷이 되지 않습니다. 다음 단계의 IGW 경로가 필요합니다.",
    "cli": "aws ec2 describe-subnets --filters Name=vpc-id,Values=REPLACE_VPC_ID --region ap-northeast-2",
    "expected": "VPC 콘솔에서 두 서브넷의 VPC와 AZ 확인 · ALB를 지원하는 서로 다른 두 AZ인지 확인",
    "errors": [
      [
        "연결이 안 될 때",
        "vpc_id가 서브넷을 VPC에 연결합니다. 이름에 public이 있어도 아직 인터넷 경로는 없습니다."
      ],
      [
        "추가 확인",
        "이름이나 public IP 자동 할당만으로 퍼블릭 서브넷이 되지 않습니다. 다음 단계의 IGW 경로가 필요합니다."
      ]
    ],
    "cost": "실제 생성 시 EC2·EBS·ALB·public IPv4·트래픽 등에 비용이 발생할 수 있습니다. 연결 실습은 NAT Gateway를 만들지 않지만 무료 구성을 의미하지 않습니다. 전체 실습 폴더에서 destroy한 뒤 잔여 리소스를 확인합니다.",
    "source": "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html",
    "takeaway": "vpc_id가 서브넷을 VPC에 연결합니다. 이름에 public이 있어도 아직 인터넷 경로는 없습니다."
  },
  {
    "id": "route",
    "name": "IGW · 라우팅",
    "role": "인터넷 경로 · IGW",
    "desc": "VPC에 IGW를 붙이고 두 서브넷의 기본 경로를 연결합니다.",
    "terms": [
      [
        "받는 값",
        "VPC id · 두 서브넷 id"
      ],
      [
        "다음으로 넘기는 값",
        "IGW id · 두 서브넷의 인터넷 기본 경로"
      ],
      [
        "연결 포인트",
        "서브넷 → 연결된 라우팅 테이블 → 0.0.0.0/0 → IGW 순서로 경로를 읽습니다."
      ]
    ],
    "steps": [
      "VPC에 IGW를 붙이고 두 서브넷의 기본 경로를 연결합니다.",
      "서브넷 → 연결된 라우팅 테이블 → 0.0.0.0/0 → IGW 순서로 경로를 읽습니다.",
      "Route table associations에 두 서브넷 확인",
      "기본 경로 대상이 IGW이고 상태가 active인지 확인"
    ],
    "code": "resource \"aws_internet_gateway\" \"lab\" {\n  vpc_id = aws_vpc.lab.id\n}\n\nresource \"aws_route_table\" \"public\" {\n  vpc_id = aws_vpc.lab.id\n  route {\n    cidr_block = \"0.0.0.0/0\"\n    gateway_id = aws_internet_gateway.lab.id\n  }\n}\n\nresource \"aws_route_table_association\" \"public_a\" {\n  subnet_id      = aws_subnet.public_a.id\n  route_table_id = aws_route_table.public.id\n}\n\nresource \"aws_route_table_association\" \"public_b\" {\n  subnet_id      = aws_subnet.public_b.id\n  route_table_id = aws_route_table.public.id\n}",
    "prereq": "연결 실습 탭의 앞 단계와 함께 사용하는 코드입니다. 이 블록만으로 전체 배포되지는 않습니다. 라우트는 경로만 제공합니다. 실제 통신에는 public IP·SG·NACL·애플리케이션도 맞아야 합니다. NAT Gateway는 이번 실습에서 만들지 않습니다.",
    "cli": "aws ec2 describe-route-tables --filters Name=vpc-id,Values=REPLACE_VPC_ID --region ap-northeast-2",
    "expected": "Route table associations에 두 서브넷 확인 · 기본 경로 대상이 IGW이고 상태가 active인지 확인",
    "errors": [
      [
        "연결이 안 될 때",
        "서브넷 → 연결된 라우팅 테이블 → 0.0.0.0/0 → IGW 순서로 경로를 읽습니다."
      ],
      [
        "추가 확인",
        "라우트는 경로만 제공합니다. 실제 통신에는 public IP·SG·NACL·애플리케이션도 맞아야 합니다. NAT Gateway는 이번 실습에서 만들지 않습니다."
      ]
    ],
    "cost": "실제 생성 시 EC2·EBS·ALB·public IPv4·트래픽 등에 비용이 발생할 수 있습니다. 연결 실습은 NAT Gateway를 만들지 않지만 무료 구성을 의미하지 않습니다. 전체 실습 폴더에서 destroy한 뒤 잔여 리소스를 확인합니다.",
    "source": "https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html",
    "takeaway": "서브넷 → 연결된 라우팅 테이블 → 0.0.0.0/0 → IGW 순서로 경로를 읽습니다."
  },
  {
    "id": "sg",
    "name": "보안 그룹",
    "role": "트래픽 허용 규칙",
    "desc": "사용자는 ALB로, EC2는 ALB에서만 HTTP를 받게 합니다.",
    "terms": [
      [
        "받는 값",
        "VPC id · var.client_cidr"
      ],
      [
        "다음으로 넘기는 값",
        "aws_security_group.alb.id · aws_security_group.web.id"
      ],
      [
        "연결 포인트",
        "EC2의 ingress는 IP 대신 ALB 보안 그룹을 참조합니다. standalone 규칙으로 SG 간 순환 참조도 피합니다."
      ]
    ],
    "steps": [
      "사용자는 ALB로, EC2는 ALB에서만 HTTP를 받게 합니다.",
      "EC2의 ingress는 IP 대신 ALB 보안 그룹을 참조합니다. standalone 규칙으로 SG 간 순환 참조도 피합니다.",
      "ALB 수신은 본인 IPv4/32의 80만 허용",
      "EC2 수신은 ALB SG의 80만 허용; SSH 22 없음"
    ],
    "code": "resource \"aws_security_group\" \"alb\" {\n  name_prefix = \"connect-alb-\"\n  description = \"ALB security group\"\n  vpc_id      = aws_vpc.lab.id\n}\n\nresource \"aws_security_group\" \"web\" {\n  name_prefix = \"connect-web-\"\n  description = \"Web instance security group\"\n  vpc_id      = aws_vpc.lab.id\n}\n\nresource \"aws_vpc_security_group_ingress_rule\" \"client_http\" {\n  security_group_id = aws_security_group.alb.id\n  cidr_ipv4         = var.client_cidr\n  ip_protocol       = \"tcp\"\n  from_port         = 80\n  to_port           = 80\n}\n\nresource \"aws_vpc_security_group_egress_rule\" \"alb_to_web\" {\n  security_group_id            = aws_security_group.alb.id\n  referenced_security_group_id = aws_security_group.web.id\n  ip_protocol                  = \"tcp\"\n  from_port                    = 80\n  to_port                      = 80\n}\n\nresource \"aws_vpc_security_group_ingress_rule\" \"web_from_alb\" {\n  security_group_id            = aws_security_group.web.id\n  referenced_security_group_id = aws_security_group.alb.id\n  ip_protocol                  = \"tcp\"\n  from_port                    = 80\n  to_port                      = 80\n}\n\nresource \"aws_vpc_security_group_egress_rule\" \"web_bootstrap\" {\n  for_each          = toset([\"80\", \"443\"])\n  security_group_id = aws_security_group.web.id\n  cidr_ipv4         = \"0.0.0.0/0\"\n  ip_protocol       = \"tcp\"\n  from_port         = tonumber(each.value)\n  to_port           = tonumber(each.value)\n}",
    "prereq": "연결 실습 탭의 앞 단계와 함께 사용하는 코드입니다. 이 블록만으로 전체 배포되지는 않습니다. 초기 패키지 설치를 위해 EC2의 외부 HTTP·HTTPS 송신을 허용합니다. 응답 트래픽은 SG의 상태 저장 특성으로 허용됩니다.",
    "cli": "aws ec2 describe-security-groups --group-ids REPLACE_GROUP_ID --region ap-northeast-2",
    "expected": "ALB 수신은 본인 IPv4/32의 80만 허용 · EC2 수신은 ALB SG의 80만 허용; SSH 22 없음",
    "errors": [
      [
        "연결이 안 될 때",
        "EC2의 ingress는 IP 대신 ALB 보안 그룹을 참조합니다. standalone 규칙으로 SG 간 순환 참조도 피합니다."
      ],
      [
        "추가 확인",
        "초기 패키지 설치를 위해 EC2의 외부 HTTP·HTTPS 송신을 허용합니다. 응답 트래픽은 SG의 상태 저장 특성으로 허용됩니다."
      ]
    ],
    "cost": "실제 생성 시 EC2·EBS·ALB·public IPv4·트래픽 등에 비용이 발생할 수 있습니다. 연결 실습은 NAT Gateway를 만들지 않지만 무료 구성을 의미하지 않습니다. 전체 실습 폴더에서 destroy한 뒤 잔여 리소스를 확인합니다.",
    "source": "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html",
    "takeaway": "EC2의 ingress는 IP 대신 ALB 보안 그룹을 참조합니다. standalone 규칙으로 SG 간 순환 참조도 피합니다."
  },
  {
    "id": "ec2",
    "name": "Amazon EC2",
    "role": "서버 · 시작 템플릿",
    "desc": "ASG가 어떤 서버를 만들지 AMI·보안 그룹·초기화 코드를 정의합니다.",
    "terms": [
      [
        "받는 값",
        "Web SG id · SSM의 최신 AL2023 AMI"
      ],
      [
        "다음으로 넘기는 값",
        "aws_launch_template.web.id · 숫자 latest_version"
      ],
      [
        "연결 포인트",
        "템플릿은 서버 생성 규격입니다. 이 단계만으로 EC2가 실행되지 않고, 다음 ASG가 템플릿을 사용합니다."
      ]
    ],
    "steps": [
      "ASG가 어떤 서버를 만들지 AMI·보안 그룹·초기화 코드를 정의합니다.",
      "템플릿은 서버 생성 규격입니다. 이 단계만으로 EC2가 실행되지 않고, 다음 ASG가 템플릿을 사용합니다.",
      "IMDSv2 required·EBS encrypted 확인",
      "t3.micro의 리전·AZ 제공 여부 및 할당량 확인"
    ],
    "code": "data \"aws_ssm_parameter\" \"al2023\" {\n  name = \"/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64\"\n}\n\nresource \"aws_launch_template\" \"web\" {\n  name_prefix            = \"connect-web-\"\n  image_id               = data.aws_ssm_parameter.al2023.value\n  instance_type          = \"t3.micro\"\n  vpc_security_group_ids = [aws_security_group.web.id]\n\n  metadata_options {\n    http_endpoint = \"enabled\"\n    http_tokens   = \"required\"\n  }\n  credit_specification {\n    cpu_credits = \"standard\"\n  }\n  block_device_mappings {\n    device_name = \"/dev/xvda\"\n    ebs {\n      encrypted             = true\n      volume_size           = 20\n      volume_type           = \"gp3\"\n      delete_on_termination = true\n    }\n  }\n  user_data = base64encode(<<-SCRIPT\n    #!/bin/bash\n    set -euxo pipefail\n    dnf install -y nginx\n    printf '<h1>Terraform connection lab</h1>\\n' > /usr/share/nginx/html/index.html\n    systemctl enable --now nginx\n  SCRIPT\n  )\n}",
    "prereq": "연결 실습 탭의 앞 단계와 함께 사용하는 코드입니다. 이 블록만으로 전체 배포되지는 않습니다. latest AMI는 시간이 지나면 plan을 바꿀 수 있습니다. 운영 배포는 검증한 AMI·버전을 고정하세요. SSH·SSM 접속 역할은 이 실습에 포함하지 않습니다.",
    "cli": "aws ec2 describe-launch-template-versions --launch-template-id REPLACE_TEMPLATE_ID --versions '$Latest' --region ap-northeast-2",
    "expected": "IMDSv2 required·EBS encrypted 확인 · t3.micro의 리전·AZ 제공 여부 및 할당량 확인",
    "errors": [
      [
        "연결이 안 될 때",
        "템플릿은 서버 생성 규격입니다. 이 단계만으로 EC2가 실행되지 않고, 다음 ASG가 템플릿을 사용합니다."
      ],
      [
        "추가 확인",
        "latest AMI는 시간이 지나면 plan을 바꿀 수 있습니다. 운영 배포는 검증한 AMI·버전을 고정하세요. SSH·SSM 접속 역할은 이 실습에 포함하지 않습니다."
      ]
    ],
    "cost": "실제 생성 시 EC2·EBS·ALB·public IPv4·트래픽 등에 비용이 발생할 수 있습니다. 연결 실습은 NAT Gateway를 만들지 않지만 무료 구성을 의미하지 않습니다. 전체 실습 폴더에서 destroy한 뒤 잔여 리소스를 확인합니다.",
    "source": "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami-parameter-store.html",
    "takeaway": "템플릿은 서버 생성 규격입니다. 이 단계만으로 EC2가 실행되지 않고, 다음 ASG가 템플릿을 사용합니다."
  },
  {
    "id": "alb",
    "name": "Application Load Balancer",
    "role": "HTTP 요청 분산",
    "desc": "접속 입구·받을 포트·보낼 서버 집합을 연결합니다.",
    "terms": [
      [
        "받는 값",
        "ALB SG id · 서로 다른 AZ의 서브넷 2개 · VPC id"
      ],
      [
        "다음으로 넘기는 값",
        "aws_lb.web.dns_name · aws_lb_target_group.web.arn"
      ],
      [
        "연결 포인트",
        "ALB → HTTP listener → target group 순서로 전달합니다. 대상 서버 등록은 다음 ASG가 담당합니다."
      ]
    ],
    "steps": [
      "접속 입구·받을 포트·보낼 서버 집합을 연결합니다.",
      "ALB → HTTP listener → target group 순서로 전달합니다. 대상 서버 등록은 다음 ASG가 담당합니다.",
      "ALB state가 active인지 확인",
      "Listener의 forward 대상이 web target group인지 확인"
    ],
    "code": "resource \"aws_lb\" \"web\" {\n  name_prefix        = \"tfweb-\"\n  internal           = false\n  load_balancer_type = \"application\"\n  security_groups    = [aws_security_group.alb.id]\n  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]\n  depends_on         = [aws_route_table_association.public_a, aws_route_table_association.public_b]\n}\n\nresource \"aws_lb_target_group\" \"web\" {\n  name_prefix = \"tfweb-\"\n  port        = 80\n  protocol    = \"HTTP\"\n  target_type = \"instance\"\n  vpc_id      = aws_vpc.lab.id\n  health_check {\n    path    = \"/\"\n    matcher = \"200\"\n  }\n}\n\nresource \"aws_lb_listener\" \"http\" {\n  load_balancer_arn = aws_lb.web.arn\n  port              = 80\n  protocol          = \"HTTP\"\n  default_action {\n    type             = \"forward\"\n    target_group_arn = aws_lb_target_group.web.arn\n  }\n}",
    "prereq": "연결 실습 탭의 앞 단계와 함께 사용하는 코드입니다. 이 블록만으로 전체 배포되지는 않습니다. 이 단계에서는 아직 서버가 없어 HTTP 503이 날 수 있습니다. HTTP 연결 학습용이며 로그인·민감 데이터는 넣지 않습니다. 운영은 ACM HTTPS·보안 헤더·WAF를 설계하세요.",
    "cli": "aws elbv2 describe-target-health --target-group-arn REPLACE_TARGET_GROUP_ARN --region ap-northeast-2",
    "expected": "ALB state가 active인지 확인 · Listener의 forward 대상이 web target group인지 확인",
    "errors": [
      [
        "연결이 안 될 때",
        "ALB → HTTP listener → target group 순서로 전달합니다. 대상 서버 등록은 다음 ASG가 담당합니다."
      ],
      [
        "추가 확인",
        "이 단계에서는 아직 서버가 없어 HTTP 503이 날 수 있습니다. HTTP 연결 학습용이며 로그인·민감 데이터는 넣지 않습니다. 운영은 ACM HTTPS·보안 헤더·WAF를 설계하세요."
      ]
    ],
    "cost": "실제 생성 시 EC2·EBS·ALB·public IPv4·트래픽 등에 비용이 발생할 수 있습니다. 연결 실습은 NAT Gateway를 만들지 않지만 무료 구성을 의미하지 않습니다. 전체 실습 폴더에서 destroy한 뒤 잔여 리소스를 확인합니다.",
    "source": "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-subnets.html",
    "takeaway": "ALB → HTTP listener → target group 순서로 전달합니다. 대상 서버 등록은 다음 ASG가 담당합니다."
  },
  {
    "id": "asg",
    "name": "EC2 Auto Scaling",
    "role": "서버 수 유지 · 확장",
    "desc": "템플릿과 서브넷·대상 그룹을 묶어 서버를 생성·등록합니다.",
    "terms": [
      [
        "받는 값",
        "Launch template id·숫자 버전 · Subnet ids · Target group ARN"
      ],
      [
        "다음으로 넘기는 값",
        "ALB에 자동 등록되는 EC2 · ASG 상태·확장 정책"
      ],
      [
        "연결 포인트",
        "ASG가 target_group_arns로 서버 등록을 관리합니다. instance를 수동 target attachment로 중복 관리하지 않습니다."
      ]
    ],
    "steps": [
      "템플릿과 서브넷·대상 그룹을 묶어 서버를 생성·등록합니다.",
      "ASG가 target_group_arns로 서버 등록을 관리합니다. instance를 수동 target attachment로 중복 관리하지 않습니다.",
      "ASG desired=1, InService 확인",
      "Target group의 인스턴스가 healthy인지 확인"
    ],
    "code": "resource \"aws_autoscaling_group\" \"web\" {\n  name_prefix               = \"connect-web-\"\n  min_size                  = 1\n  max_size                  = 2\n  desired_capacity          = 1\n  vpc_zone_identifier       = [aws_subnet.public_a.id, aws_subnet.public_b.id]\n  target_group_arns         = [aws_lb_target_group.web.arn]\n  health_check_type         = \"ELB\"\n  health_check_grace_period = 300\n  default_instance_warmup   = 300\n\n  launch_template {\n    id      = aws_launch_template.web.id\n    version = tostring(aws_launch_template.web.latest_version)\n  }\n  tag {\n    key                 = \"Project\"\n    value               = \"terraform-connect-lab\"\n    propagate_at_launch = true\n  }\n  depends_on = [\n    aws_lb_listener.http,\n    aws_route_table_association.public_a,\n    aws_route_table_association.public_b,\n    aws_vpc_security_group_ingress_rule.web_from_alb,\n    aws_vpc_security_group_egress_rule.web_bootstrap\n  ]\n}\n\nresource \"aws_autoscaling_policy\" \"cpu\" {\n  name                   = \"connect-cpu-target\"\n  autoscaling_group_name = aws_autoscaling_group.web.name\n  policy_type            = \"TargetTrackingScaling\"\n  target_tracking_configuration {\n    predefined_metric_specification {\n      predefined_metric_type = \"ASGAverageCPUUtilization\"\n    }\n    target_value = 50\n  }\n}",
    "prereq": "연결 실습 탭의 앞 단계와 함께 사용하는 코드입니다. 이 블록만으로 전체 배포되지는 않습니다. max_size=2만으로 자동 확장되지 않습니다. 여기서는 CPU target tracking 정책도 추가했습니다. 서버 1대 구성은 다중 AZ 고가용성이 아니며, 증설하면 비용도 늘어납니다.",
    "cli": "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names REPLACE_ASG_NAME --region ap-northeast-2",
    "expected": "ASG desired=1, InService 확인 · Target group의 인스턴스가 healthy인지 확인",
    "errors": [
      [
        "연결이 안 될 때",
        "ASG가 target_group_arns로 서버 등록을 관리합니다. instance를 수동 target attachment로 중복 관리하지 않습니다."
      ],
      [
        "추가 확인",
        "max_size=2만으로 자동 확장되지 않습니다. 여기서는 CPU target tracking 정책도 추가했습니다. 서버 1대 구성은 다중 AZ 고가용성이 아니며, 증설하면 비용도 늘어납니다."
      ]
    ],
    "cost": "실제 생성 시 EC2·EBS·ALB·public IPv4·트래픽 등에 비용이 발생할 수 있습니다. 연결 실습은 NAT Gateway를 만들지 않지만 무료 구성을 의미하지 않습니다. 전체 실습 폴더에서 destroy한 뒤 잔여 리소스를 확인합니다.",
    "source": "https://docs.aws.amazon.com/autoscaling/ec2/userguide/attach-load-balancer-asg.html",
    "takeaway": "ASG가 target_group_arns로 서버 등록을 관리합니다. instance를 수동 target attachment로 중복 관리하지 않습니다."
  }
];
