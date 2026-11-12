'use strict';
const CONNECTION_STEPS = [
  {
    "id": "vpc",
    "title": "VPC와 실행 설정",
    "subtitle": "먼저 모든 리소스가 들어갈 네트워크 공간을 만듭니다.",
    "code": "terraform {\n  required_version = \">= 1.11\"\n  required_providers {\n    aws = { source = \"hashicorp/aws\", version = \"~> 6.0\" }\n  }\n}\n\nprovider \"aws\" {\n  region = \"ap-northeast-2\"\n  default_tags {\n    tags = { Project = \"terraform-connect-lab\" }\n  }\n}\n\nvariable \"client_cidr\" {\n  type        = string\n  description = \"접속할 본인 공인 IPv4/32\"\n  validation {\n    condition     = can(cidrhost(var.client_cidr, 0)) && endswith(var.client_cidr, \"/32\")\n    error_message = \"본인 공인 IPv4 주소/32를 입력하세요.\"\n  }\n}\n\ndata \"aws_availability_zones\" \"available\" {\n  state = \"available\"\n}\n\nresource \"aws_vpc\" \"lab\" {\n  cidr_block           = \"10.30.0.0/16\"\n  enable_dns_support   = true\n  enable_dns_hostnames = true\n  tags                 = { Name = \"connect-lab-vpc\" }\n}",
    "needs": [
      "AWS 로그인·리전",
      "Terraform AWS provider"
    ],
    "gives": [
      "aws_vpc.lab.id",
      "사용 가능한 AZ 목록"
    ],
    "link": "provider는 AWS 접근 설정입니다. VPC의 id를 이후 서브넷·라우팅·보안 그룹이 참조합니다.",
    "checks": [
      "terraform init → validate → plan 순서로 확인",
      "client_cidr에 본인 공인 IPv4/32 입력"
    ],
    "trap": "실습은 이전 S3 프로젝트와 별도의 빈 폴더에서 시작합니다. provider·동일 이름 리소스를 기존 폴더에 중복 추가하지 않습니다.",
    "source": "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html"
  },
  {
    "id": "subnet",
    "title": "서브넷 두 개",
    "subtitle": "서로 다른 가용 영역에 ALB가 사용할 네트워크를 나눕니다.",
    "code": "resource \"aws_subnet\" \"public_a\" {\n  vpc_id                  = aws_vpc.lab.id\n  cidr_block              = \"10.30.1.0/24\"\n  availability_zone       = data.aws_availability_zones.available.names[0]\n  map_public_ip_on_launch = true\n}\n\nresource \"aws_subnet\" \"public_b\" {\n  vpc_id                  = aws_vpc.lab.id\n  cidr_block              = \"10.30.2.0/24\"\n  availability_zone       = data.aws_availability_zones.available.names[1]\n  map_public_ip_on_launch = true\n}",
    "needs": [
      "aws_vpc.lab.id",
      "AZ names[0] · names[1]"
    ],
    "gives": [
      "aws_subnet.public_a.id",
      "aws_subnet.public_b.id"
    ],
    "link": "vpc_id가 서브넷을 VPC에 연결합니다. 이름에 public이 있어도 아직 인터넷 경로는 없습니다.",
    "checks": [
      "VPC 콘솔에서 두 서브넷의 VPC와 AZ 확인",
      "ALB를 지원하는 서로 다른 두 AZ인지 확인"
    ],
    "trap": "이름이나 public IP 자동 할당만으로 퍼블릭 서브넷이 되지 않습니다. 다음 단계의 IGW 경로가 필요합니다.",
    "source": "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html"
  },
  {
    "id": "route",
    "title": "인터넷 경로 연결",
    "subtitle": "VPC에 IGW를 붙이고 두 서브넷의 기본 경로를 연결합니다.",
    "code": "resource \"aws_internet_gateway\" \"lab\" {\n  vpc_id = aws_vpc.lab.id\n}\n\nresource \"aws_route_table\" \"public\" {\n  vpc_id = aws_vpc.lab.id\n  route {\n    cidr_block = \"0.0.0.0/0\"\n    gateway_id = aws_internet_gateway.lab.id\n  }\n}\n\nresource \"aws_route_table_association\" \"public_a\" {\n  subnet_id      = aws_subnet.public_a.id\n  route_table_id = aws_route_table.public.id\n}\n\nresource \"aws_route_table_association\" \"public_b\" {\n  subnet_id      = aws_subnet.public_b.id\n  route_table_id = aws_route_table.public.id\n}",
    "needs": [
      "VPC id",
      "두 서브넷 id"
    ],
    "gives": [
      "IGW id",
      "두 서브넷의 인터넷 기본 경로"
    ],
    "link": "서브넷 → 연결된 라우팅 테이블 → 0.0.0.0/0 → IGW 순서로 경로를 읽습니다.",
    "checks": [
      "Route table associations에 두 서브넷 확인",
      "기본 경로 대상이 IGW이고 상태가 active인지 확인"
    ],
    "trap": "라우트는 경로만 제공합니다. 실제 통신에는 public IP·SG·NACL·애플리케이션도 맞아야 합니다. NAT Gateway는 이번 실습에서 만들지 않습니다.",
    "source": "https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html"
  },
  {
    "id": "sg",
    "title": "보안 그룹으로 통신 제한",
    "subtitle": "사용자는 ALB로, EC2는 ALB에서만 HTTP를 받게 합니다.",
    "code": "resource \"aws_security_group\" \"alb\" {\n  name_prefix = \"connect-alb-\"\n  description = \"ALB security group\"\n  vpc_id      = aws_vpc.lab.id\n}\n\nresource \"aws_security_group\" \"web\" {\n  name_prefix = \"connect-web-\"\n  description = \"Web instance security group\"\n  vpc_id      = aws_vpc.lab.id\n}\n\nresource \"aws_vpc_security_group_ingress_rule\" \"client_http\" {\n  security_group_id = aws_security_group.alb.id\n  cidr_ipv4         = var.client_cidr\n  ip_protocol       = \"tcp\"\n  from_port         = 80\n  to_port           = 80\n}\n\nresource \"aws_vpc_security_group_egress_rule\" \"alb_to_web\" {\n  security_group_id            = aws_security_group.alb.id\n  referenced_security_group_id = aws_security_group.web.id\n  ip_protocol                  = \"tcp\"\n  from_port                    = 80\n  to_port                      = 80\n}\n\nresource \"aws_vpc_security_group_ingress_rule\" \"web_from_alb\" {\n  security_group_id            = aws_security_group.web.id\n  referenced_security_group_id = aws_security_group.alb.id\n  ip_protocol                  = \"tcp\"\n  from_port                    = 80\n  to_port                      = 80\n}\n\nresource \"aws_vpc_security_group_egress_rule\" \"web_bootstrap\" {\n  for_each          = toset([\"80\", \"443\"])\n  security_group_id = aws_security_group.web.id\n  cidr_ipv4         = \"0.0.0.0/0\"\n  ip_protocol       = \"tcp\"\n  from_port         = tonumber(each.value)\n  to_port           = tonumber(each.value)\n}",
    "needs": [
      "VPC id",
      "var.client_cidr"
    ],
    "gives": [
      "aws_security_group.alb.id",
      "aws_security_group.web.id"
    ],
    "link": "EC2의 ingress는 IP 대신 ALB 보안 그룹을 참조합니다. standalone 규칙으로 SG 간 순환 참조도 피합니다.",
    "checks": [
      "ALB 수신은 본인 IPv4/32의 80만 허용",
      "EC2 수신은 ALB SG의 80만 허용; SSH 22 없음"
    ],
    "trap": "초기 패키지 설치를 위해 EC2의 외부 HTTP·HTTPS 송신을 허용합니다. 응답 트래픽은 SG의 상태 저장 특성으로 허용됩니다.",
    "source": "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html"
  },
  {
    "id": "ec2",
    "title": "EC2 시작 템플릿",
    "subtitle": "ASG가 어떤 서버를 만들지 AMI·보안 그룹·초기화 코드를 정의합니다.",
    "code": "data \"aws_ssm_parameter\" \"al2023\" {\n  name = \"/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64\"\n}\n\nresource \"aws_launch_template\" \"web\" {\n  name_prefix            = \"connect-web-\"\n  image_id               = data.aws_ssm_parameter.al2023.value\n  instance_type          = \"t3.micro\"\n  vpc_security_group_ids = [aws_security_group.web.id]\n\n  metadata_options {\n    http_endpoint = \"enabled\"\n    http_tokens   = \"required\"\n  }\n  credit_specification {\n    cpu_credits = \"standard\"\n  }\n  block_device_mappings {\n    device_name = \"/dev/xvda\"\n    ebs {\n      encrypted             = true\n      volume_size           = 20\n      volume_type           = \"gp3\"\n      delete_on_termination = true\n    }\n  }\n  user_data = base64encode(<<-SCRIPT\n    #!/bin/bash\n    set -euxo pipefail\n    dnf install -y nginx\n    printf '<h1>Terraform connection lab</h1>\\n' > /usr/share/nginx/html/index.html\n    systemctl enable --now nginx\n  SCRIPT\n  )\n}",
    "needs": [
      "Web SG id",
      "SSM의 최신 AL2023 AMI"
    ],
    "gives": [
      "aws_launch_template.web.id",
      "숫자 latest_version"
    ],
    "link": "템플릿은 서버 생성 규격입니다. 이 단계만으로 EC2가 실행되지 않고, 다음 ASG가 템플릿을 사용합니다.",
    "checks": [
      "IMDSv2 required·EBS encrypted 확인",
      "t3.micro의 리전·AZ 제공 여부 및 할당량 확인"
    ],
    "trap": "latest AMI는 시간이 지나면 plan을 바꿀 수 있습니다. 운영 배포는 검증한 AMI·버전을 고정하세요. SSH·SSM 접속 역할은 이 실습에 포함하지 않습니다.",
    "source": "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami-parameter-store.html"
  },
  {
    "id": "alb",
    "title": "ALB와 대상 그룹",
    "subtitle": "접속 입구·받을 포트·보낼 서버 집합을 연결합니다.",
    "code": "resource \"aws_lb\" \"web\" {\n  name_prefix        = \"tfweb-\"\n  internal           = false\n  load_balancer_type = \"application\"\n  security_groups    = [aws_security_group.alb.id]\n  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]\n  depends_on         = [aws_route_table_association.public_a, aws_route_table_association.public_b]\n}\n\nresource \"aws_lb_target_group\" \"web\" {\n  name_prefix = \"tfweb-\"\n  port        = 80\n  protocol    = \"HTTP\"\n  target_type = \"instance\"\n  vpc_id      = aws_vpc.lab.id\n  health_check {\n    path    = \"/\"\n    matcher = \"200\"\n  }\n}\n\nresource \"aws_lb_listener\" \"http\" {\n  load_balancer_arn = aws_lb.web.arn\n  port              = 80\n  protocol          = \"HTTP\"\n  default_action {\n    type             = \"forward\"\n    target_group_arn = aws_lb_target_group.web.arn\n  }\n}",
    "needs": [
      "ALB SG id",
      "서로 다른 AZ의 서브넷 2개",
      "VPC id"
    ],
    "gives": [
      "aws_lb.web.dns_name",
      "aws_lb_target_group.web.arn"
    ],
    "link": "ALB → HTTP listener → target group 순서로 전달합니다. 대상 서버 등록은 다음 ASG가 담당합니다.",
    "checks": [
      "ALB state가 active인지 확인",
      "Listener의 forward 대상이 web target group인지 확인"
    ],
    "trap": "이 단계에서는 아직 서버가 없어 HTTP 503이 날 수 있습니다. HTTP 연결 학습용이며 로그인·민감 데이터는 넣지 않습니다. 운영은 ACM HTTPS·보안 헤더·WAF를 설계하세요.",
    "source": "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-subnets.html"
  },
  {
    "id": "asg",
    "title": "Auto Scaling으로 서버 연결",
    "subtitle": "템플릿과 서브넷·대상 그룹을 묶어 서버를 생성·등록합니다.",
    "code": "resource \"aws_autoscaling_group\" \"web\" {\n  name_prefix               = \"connect-web-\"\n  min_size                  = 1\n  max_size                  = 2\n  desired_capacity          = 1\n  vpc_zone_identifier       = [aws_subnet.public_a.id, aws_subnet.public_b.id]\n  target_group_arns         = [aws_lb_target_group.web.arn]\n  health_check_type         = \"ELB\"\n  health_check_grace_period = 300\n  default_instance_warmup   = 300\n\n  launch_template {\n    id      = aws_launch_template.web.id\n    version = tostring(aws_launch_template.web.latest_version)\n  }\n  tag {\n    key                 = \"Project\"\n    value               = \"terraform-connect-lab\"\n    propagate_at_launch = true\n  }\n  depends_on = [\n    aws_lb_listener.http,\n    aws_route_table_association.public_a,\n    aws_route_table_association.public_b,\n    aws_vpc_security_group_ingress_rule.web_from_alb,\n    aws_vpc_security_group_egress_rule.web_bootstrap\n  ]\n}\n\nresource \"aws_autoscaling_policy\" \"cpu\" {\n  name                   = \"connect-cpu-target\"\n  autoscaling_group_name = aws_autoscaling_group.web.name\n  policy_type            = \"TargetTrackingScaling\"\n  target_tracking_configuration {\n    predefined_metric_specification {\n      predefined_metric_type = \"ASGAverageCPUUtilization\"\n    }\n    target_value = 50\n  }\n}",
    "needs": [
      "Launch template id·숫자 버전",
      "Subnet ids",
      "Target group ARN"
    ],
    "gives": [
      "ALB에 자동 등록되는 EC2",
      "ASG 상태·확장 정책"
    ],
    "link": "ASG가 target_group_arns로 서버 등록을 관리합니다. instance를 수동 target attachment로 중복 관리하지 않습니다.",
    "checks": [
      "ASG desired=1, InService 확인",
      "Target group의 인스턴스가 healthy인지 확인"
    ],
    "trap": "max_size=2만으로 자동 확장되지 않습니다. 여기서는 CPU target tracking 정책도 추가했습니다. 서버 1대 구성은 다중 AZ 고가용성이 아니며, 증설하면 비용도 늘어납니다.",
    "source": "https://docs.aws.amazon.com/autoscaling/ec2/userguide/attach-load-balancer-asg.html"
  },
  {
    "id": "verify",
    "title": "접속과 연결 검증",
    "subtitle": "출력 URL로 접속하고, 요청이 지나가는 순서대로 검증합니다.",
    "code": "output \"web_url\" {\n  value = \"http://${aws_lb.web.dns_name}\"\n}\n\noutput \"target_group_arn\" {\n  value = aws_lb_target_group.web.arn\n}\n\noutput \"autoscaling_group_name\" {\n  value = aws_autoscaling_group.web.name\n}",
    "needs": [
      "ALB DNS name",
      "Target group ARN",
      "ASG name"
    ],
    "gives": [
      "web_url",
      "CLI 확인용 ARN·이름"
    ],
    "link": "브라우저 → ALB SG → listener → target group → EC2 SG → Nginx 순서로 요청을 추적합니다.",
    "checks": [
      "본인 허용 IPv4에서 web_url 접속 → Terraform connection lab 표시",
      "timeout이면 IP·SG·경로, 503이면 targets 등록·healthy, 502면 앱 포트·응답 조사"
    ],
    "trap": "apply 완료와 애플리케이션 준비 완료는 다릅니다. Nginx 설치와 health check가 끝날 때까지 기다린 뒤 확인하세요. 실습을 마치면 별도 폴더에서 destroy합니다.",
    "source": "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html"
  }
];

const S3_CONNECTION_STEPS = [
  {
    "id": "iam",
    "title": "AWS IAM",
    "subtitle": "인증 · 권한",
    "code": "resource \"aws_iam_role\" \"remediate\" {\n  name = \"cspm-lab-remediate-s3\"\n  assume_role_policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect = \"Allow\"\n      Action = \"sts:AssumeRole\"\n      Principal = { Service = \"lambda.amazonaws.com\" }\n    }]\n  })\n}\n\nresource \"aws_iam_role_policy\" \"s3_access\" {\n  role = aws_iam_role.remediate.id\n  policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect   = \"Allow\"\n      Action   = \"s3:PutBucketPublicAccessBlock\"\n      Resource = \"arn:aws:s3:::my-terraform-lab-12345\"\n    }]\n  })\n}",
    "needs": [
      "Lambda 서비스 principal"
    ],
    "gives": [
      "aws_iam_role.remediate.arn"
    ],
    "link": "실행 역할을 만들고 Lambda가 맡을 수 있게 합니다. 신뢰 정책과 S3·태그·로그 권한은 별도로 확인합니다.",
    "checks": [
      "AssumeRolePolicyDocument와 역할 ARN을 확인합니다. get-role은 신뢰 정책을 보여주며 연결된 모든 권한 정책까지 보여주는 명령은 아닙니다."
    ],
    "trap": "역할과 S3 권한의 연결만 보여주는 예제입니다. GetBucketTagging·CloudWatch Logs·실패 큐 권한은 포함하지 않아 프로젝트 전체 실행 역할로는 불충분합니다. 이미 같은 역할이 있으면 중복 생성하지 않습니다.",
    "source": "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html"
  },
  {
    "id": "s3",
    "title": "Amazon S3",
    "subtitle": "저장 · 보호 대상",
    "code": "resource \"aws_s3_bucket\" \"lab\" {\n  bucket = \"my-terraform-lab-12345\"\n}\n\nresource \"aws_s3_bucket_public_access_block\" \"security\" {\n  bucket = aws_s3_bucket.lab.id\n\n  block_public_acls       = true\n  ignore_public_acls      = true\n  block_public_policy     = true\n  restrict_public_buckets = true\n}",
    "needs": [
      "고유 버킷 이름"
    ],
    "gives": [
      "Bucket id·arn"
    ],
    "link": "탐지 대상 S3와 상태·Config 전달 버킷의 용도를 구분합니다. 상태·전달 버킷은 계속 비공개로 유지합니다.",
    "checks": [
      "PublicAccessBlockConfiguration의 네 값이 모두 true인지 확인합니다. 차단 설정만으로 기존 공개 정책 자체가 삭제되지는 않습니다."
    ],
    "trap": "기존 8단계와 같은 예제입니다. 버킷 이름은 실제 사용 시 본인만의 고유한 값으로 바꾸세요. 기본 학습 확인에서는 표시된 예제 값을 사용합니다.",
    "source": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html"
  },
  {
    "id": "config",
    "title": "AWS Config",
    "subtitle": "설정 기록 · 위반 평가",
    "code": "resource \"aws_config_config_rule\" \"s3_public\" {\n  name = \"s3-bucket-level-public-access-prohibited\"\n\n  source {\n    owner             = \"AWS\"\n    source_identifier = \"S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED\"\n  }\n\n  depends_on = [aws_config_configuration_recorder_status.main]\n}",
    "needs": [
      "S3 기록 대상",
      "Config 역할·전달 채널"
    ],
    "gives": [
      "Config 규칙 이름",
      "NON_COMPLIANT 이벤트"
    ],
    "link": "기록기 시작 → 규칙 평가 → 상태 전이입니다. 전달 버킷·역할·기록기가 생략된 발췌 예제입니다.",
    "checks": [
      "EvaluationResults의 규칙 이름과 ComplianceType을 확인합니다. NON_COMPLIANT는 평가 결과이며 Lambda가 실행됐다는 증거는 아닙니다."
    ],
    "trap": "기본 프로젝트의 기록기·전달 채널·기록 역할·전달 버킷과 aws_config_configuration_recorder_status.main이 먼저 필요합니다. 이 규칙 블록만으로 Config를 켤 수는 없습니다.",
    "source": "https://docs.aws.amazon.com/config/latest/developerguide/s3-bucket-level-public-access-prohibited.html"
  },
  {
    "id": "lambda",
    "title": "AWS Lambda",
    "subtitle": "코드 실행 · 자동 복구",
    "code": "resource \"aws_lambda_function\" \"remediate\" {\n  function_name = \"cspm-lab-remediate-s3\"\n  role          = aws_iam_role.remediate.arn\n  runtime       = \"python3.12\"\n  handler       = \"s3_block_public.handler\"\n\n  filename         = data.archive_file.remediate.output_path\n  source_code_hash = data.archive_file.remediate.output_base64sha256\n  timeout          = 30\n\n  environment {\n    variables = {\n      DRY_RUN = \"true\"\n    }\n  }\n}",
    "needs": [
      "실행 역할 ARN",
      "zip·handler·환경 변수"
    ],
    "gives": [
      "aws_lambda_function.remediate.arn"
    ],
    "link": "Lambda 실행 역할 ARN을 role에 연결합니다. 코드는 규칙·타입·버킷 범위를 검사하고 중복 처리에도 안전해야 합니다.",
    "checks": [
      "동일 버킷의 dry-run·remediated·오류 로그를 확인합니다. DRY_RUN=true는 실제 수정하지 않습니다. 비동기 StatusCode 202는 요청 접수만 뜻합니다."
    ],
    "trap": "기본 프로젝트의 IAM 실행 역할, archive provider, data.archive_file.remediate와 핸들러 코드가 필요합니다. 기존 코드가 CONFIG_RULE_NAME·BUCKET_PREFIX를 요구하면 환경 변수도 유지하세요. 이 예제는 구조 설명용 발췌이며 그대로 기존 함수를 덮어쓰지 않습니다.",
    "source": "https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html"
  },
  {
    "id": "eventbridge",
    "title": "Amazon EventBridge",
    "subtitle": "이벤트 필터 · 전달",
    "code": "resource \"aws_cloudwatch_event_rule\" \"noncompliant\" {\n  name = \"cspm-lab-s3-noncompliant\"\n  event_pattern = jsonencode({\n    source        = [\"aws.config\"]\n    \"detail-type\" = [\"Config Rules Compliance Change\"]\n    detail = {\n      configRuleName = [aws_config_config_rule.s3_public.name]\n      newEvaluationResult = {\n        complianceType = [\"NON_COMPLIANT\"]\n      }\n    }\n  })\n}\n\nresource \"aws_cloudwatch_event_target\" \"remediate\" {\n  rule = aws_cloudwatch_event_rule.noncompliant.name\n  arn  = aws_lambda_function.remediate.arn\n}\n\nresource \"aws_lambda_permission\" \"events\" {\n  statement_id  = \"AllowLabEventBridge\"\n  action        = \"lambda:InvokeFunction\"\n  function_name = aws_lambda_function.remediate.function_name\n  principal     = \"events.amazonaws.com\"\n  source_arn    = aws_cloudwatch_event_rule.noncompliant.arn\n}",
    "needs": [
      "Config 규칙 이름",
      "Lambda ARN"
    ],
    "gives": [
      "규칙에 한정한 함수 호출"
    ],
    "link": "규칙 패턴 → 대상 → Lambda 호출 허용을 모두 연결해야 합니다. 대상만 등록해서는 권한이 생기지 않습니다.",
    "checks": [
      "Targets에 기대한 Lambda ARN이 있는지 확인합니다. 대상이 존재해도 호출 허용이나 실행 성공을 보장하지 않습니다."
    ],
    "trap": "기본 프로젝트의 Config 규칙과 Lambda 함수가 있어야 합니다. 별도의 aws_lambda_permission으로 events.amazonaws.com에 해당 규칙 ARN의 함수 호출을 허용해야 합니다. 예제에는 DLQ·재시도 설정이 생략되어 있습니다.",
    "source": "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-dlq.html"
  },
  {
    "id": "sqs",
    "title": "Amazon SQS",
    "subtitle": "실패 보관 · 재처리",
    "code": "resource \"aws_sqs_queue\" \"execution_failures\" {\n  name                       = \"cspm-lab-execution-failures\"\n  message_retention_seconds  = 604800\n  visibility_timeout_seconds = 300\n  sqs_managed_sse_enabled     = true\n}\n\noutput \"execution_queue_url\" {\n  value = aws_sqs_queue.execution_failures.url\n}\n\nresource \"aws_iam_role_policy\" \"failure_queue\" {\n  role = aws_iam_role.remediate.id\n  policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect   = \"Allow\"\n      Action   = \"sqs:SendMessage\"\n      Resource = aws_sqs_queue.execution_failures.arn\n    }]\n  })\n}\n\nresource \"aws_lambda_function_event_invoke_config\" \"remediate\" {\n  function_name = aws_lambda_function.remediate.function_name\n  destination_config {\n    on_failure {\n      destination = aws_sqs_queue.execution_failures.arn\n    }\n  }\n  depends_on = [aws_iam_role_policy.failure_queue]\n}",
    "needs": [
      "Lambda ARN·실행 역할"
    ],
    "gives": [
      "실행 실패 invocation record"
    ],
    "link": "큐 생성 → 실행 역할 SendMessage → 비동기 on_failure destination 연결. EventBridge DLQ는 별도 큐·큐 정책으로 나눕니다.",
    "checks": [
      "실패 메시지가 있으면 Messages의 Body·ReceiptHandle을 확인합니다. Lambda 실패 destination은 Body.requestPayload를 꺼내야 원래 입력이 됩니다. EventBridge DLQ는 Body 자체가 원래 이벤트입니다."
    ],
    "trap": "큐를 만드는 예제입니다. Lambda on_failure destination 연결과 실행 역할의 sqs:SendMessage 권한은 별도로 필요합니다. 예제의 보존·가시성 시간은 학습용 선택값입니다.",
    "source": "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html"
  },
  {
    "id": "sns",
    "title": "Amazon SNS",
    "subtitle": "구독자에게 알림 전달",
    "code": "variable \"alert_email\" {\n  type = string\n}\n\nresource \"aws_sns_topic\" \"alerts\" {\n  name = \"cspm-lab-alerts\"\n}\n\nresource \"aws_sns_topic_subscription\" \"email\" {\n  topic_arn = aws_sns_topic.alerts.arn\n  protocol  = \"email\"\n  endpoint  = var.alert_email\n}",
    "needs": [
      "수신자 이메일"
    ],
    "gives": [
      "aws_sns_topic.alerts.arn"
    ],
    "link": "Standard 토픽 → 이메일 구독 → 메일의 확인 링크로 구독 확정까지 진행합니다.",
    "checks": [
      "Protocol·Endpoint·SubscriptionArn을 확인합니다. PendingConfirmation이면 수신 이메일에서 구독을 확정합니다. 조회 출력에는 이메일이 있으므로 공개 캡처 전에 가립니다."
    ],
    "trap": "실행 시 alert_email 입력 변수가 필요합니다. 웹에는 실제 이메일을 입력할 필요가 없습니다. 이 교육용 예제는 비민감 알람만 전송합니다. 기밀 알림용 저장 암호화는 KMS·게시 권한을 함께 설계하세요.",
    "source": "https://docs.aws.amazon.com/sns/latest/dg/sns-email-notifications.html"
  },
  {
    "id": "cloudwatch",
    "title": "Amazon CloudWatch",
    "subtitle": "로그 · 지표 · 알람",
    "code": "resource \"aws_cloudwatch_metric_alarm\" \"lambda_errors\" {\n  alarm_name          = \"cspm-lab-lambda-errors\"\n  namespace           = \"AWS/Lambda\"\n  metric_name         = \"Errors\"\n  statistic           = \"Sum\"\n  period              = 60\n  evaluation_periods  = 1\n  comparison_operator = \"GreaterThanOrEqualToThreshold\"\n  threshold           = 1\n  treat_missing_data  = \"notBreaching\"\n\n  dimensions = {\n    FunctionName = aws_lambda_function.remediate.function_name\n  }\n  alarm_actions = [aws_sns_topic.alerts.arn]\n}",
    "needs": [
      "Lambda FunctionName",
      "SNS 토픽 ARN"
    ],
    "gives": [
      "ALARM 상태·SNS 알림"
    ],
    "link": "Errors 지표의 FunctionName 차원과 alarm_actions의 SNS ARN을 연결합니다. 상태 변경·구독·실제 수신을 각각 확인합니다.",
    "checks": [
      "MetricAlarms의 StateValue와 StateReason을 읽습니다. Errors·Throttles·DestinationDeliveryFailures를 구분하고, Duration을 전체 복구 시간으로 해석하지 않습니다."
    ],
    "trap": "기본 프로젝트의 Lambda와 SNS 토픽이 필요합니다. 이 예제는 60초 구간에 오류 1회 이상을 기준으로 합니다. 실제 관측 기간·누락 데이터 처리는 서비스 특성에 맞게 정합니다.",
    "source": "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Alarms.html"
  }
];
