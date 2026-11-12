'use strict';
const KUBE_LESSONS = [
  {
    "id": "namespace",
    "title": "실습 공간부터 만들기",
    "short": "Namespace",
    "tag": "시작",
    "desc": "네임스페이스로 실습 리소스를 묶습니다. 이름·권한·네트워크 격리를 혼동하지 마세요.",
    "code": "apiVersion: v1\nkind: Namespace\nmetadata:\n  name: k8s-lab",
    "concept": "이후 리소스의 metadata.namespace: k8s-lab이 같은 공간을 가리킵니다. Namespace 자체는 클러스터 범위의 리소스이며 namespace 필드를 넣지 않습니다.",
    "hints": [
      "apiVersion은 v1, kind는 Namespace입니다.",
      "metadata 아래 두 칸 들여쓰기로 name: k8s-lab을 씁니다."
    ],
    "cmd": "kubectl get namespace k8s-lab",
    "output": "NAME      STATUS   AGE\nk8s-lab   Active   10s",
    "question": "Namespace만 만들면 네트워크 접근도 자동 차단될까요?",
    "options": [
      "네, 모든 트래픽을 차단합니다",
      "아니요. NetworkPolicy·RBAC 등은 별도 설정입니다",
      "네, 외부 접속만 차단합니다"
    ],
    "answer": 1,
    "explain": "Namespace는 범위 구분입니다. 네트워크·권한 정책을 자동으로 완성하지 않습니다.",
    "source": "https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/",
    "pre": "사용할 클러스터의 context를 먼저 확인하세요. 웹에서는 클러스터가 필요 없습니다.",
    "file": "namespace.yaml",
    "lang": "yaml"
  },
  {
    "id": "pod",
    "title": "컨테이너를 담는 Pod",
    "short": "Pod",
    "tag": "실행 단위",
    "desc": "하나의 Pod에 웹 컨테이너를 선언합니다. containerPort를 적는 것과 외부에 공개하는 것은 다릅니다.",
    "code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: hello\n  namespace: k8s-lab\n  labels:\n    app: hello\nspec:\n  automountServiceAccountToken: false\n  containers:\n    - name: web\n      image: nginx:1.28-alpine\n      ports:\n        - containerPort: 80",
    "concept": "Pod는 배포 가능한 기본 단위입니다. 단독 Pod는 Deployment처럼 원하는 개수 유지를 책임지는 상위 컨트롤러가 없습니다.",
    "hints": [
      "kind는 Pod이며 containers는 목록(-)입니다.",
      "labels.app은 hello, 컨테이너 이름은 web입니다."
    ],
    "cmd": "kubectl -n k8s-lab get pod hello",
    "output": "NAME    READY   STATUS    RESTARTS\nhello   1/1     Running   0",
    "question": "containerPort: 80을 쓰면 외부에 자동 공개될까요?",
    "options": [
      "아니요. Service·Ingress·port-forward 등 별도 경로가 필요합니다",
      "네, 노드의 80번 포트가 열립니다",
      "네, LoadBalancer가 생성됩니다"
    ],
    "answer": 0,
    "explain": "containerPort는 컨테이너 포트를 선언합니다. 자동 외부 노출 기능이 아닙니다.",
    "source": "https://kubernetes.io/docs/concepts/workloads/pods/",
    "pre": "k8s-lab 네임스페이스가 먼저 있어야 합니다.",
    "file": "pod.yaml",
    "lang": "yaml"
  },
  {
    "id": "deployment",
    "title": "원하는 개수를 유지하기",
    "short": "Deployment",
    "tag": "컨트롤러",
    "desc": "Deployment가 ReplicaSet을 통해 Pod 수와 업데이트를 관리합니다. selector와 template의 label을 맞춰 보세요.",
    "code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\n  namespace: k8s-lab\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: web\n  template:\n    metadata:\n      labels:\n        app: web\n    spec:\n      automountServiceAccountToken: false\n      containers:\n        - name: web\n          image: nginx:1.28-alpine\n          ports:\n            - name: http\n              containerPort: 80",
    "concept": "spec.selector.matchLabels와 spec.template.metadata.labels가 일치해야 합니다. Deployment 이름과 Service 이름이 같아야 연결되는 것은 아닙니다.",
    "hints": [
      "apiVersion은 apps/v1입니다.",
      "selector의 app: web과 template.labels의 app: web을 맞추세요."
    ],
    "cmd": "kubectl -n k8s-lab rollout status deployment/web",
    "output": "deployment \"web\" successfully rolled out",
    "question": "replicas: 2의 의미는 무엇일까요?",
    "options": [
      "컨테이너 이미지를 두 번 빌드합니다",
      "원하는 Pod 개수를 2개로 유지합니다",
      "노드 2개를 생성합니다"
    ],
    "answer": 1,
    "explain": "Pod 수를 관리하는 설정입니다. 노드나 클러스터의 수를 뜻하지 않습니다.",
    "source": "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
    "pre": "k8s-lab 네임스페이스가 먼저 있어야 합니다.",
    "file": "deployment.yaml",
    "lang": "yaml"
  },
  {
    "id": "service",
    "title": "label로 Pod와 연결하기",
    "short": "Service",
    "tag": "연결",
    "desc": "Pod IP가 바뀌어도 같은 서비스 이름으로 접근하도록 연결합니다. selector → label, targetPort → 컨테이너 포트를 읽어보세요.",
    "code": "apiVersion: v1\nkind: Service\nmetadata:\n  name: web\n  namespace: k8s-lab\nspec:\n  type: ClusterIP\n  selector:\n    app: web\n  ports:\n    - name: http\n      port: 80\n      targetPort: http",
    "concept": "selector.app: web인 Ready Pod가 대상입니다. targetPort: http는 컨테이너의 name: http 포트를 가리킵니다. 이 예제는 ClusterIP라 외부 로드 밸런서를 만들지 않습니다.",
    "hints": [
      "kind는 Service, type은 ClusterIP입니다.",
      "port: 80은 Service 포트이고 targetPort: http는 컨테이너의 포트 이름입니다."
    ],
    "cmd": "kubectl -n k8s-lab get endpointslices -l kubernetes.io/service-name=web",
    "output": "NAME        ADDRESSTYPE   PORTS   ENDPOINTS\nweb-xxxxx   IPv4          80      10.x.x.x,10.x.x.y",
    "question": "Service가 어떤 Pod를 고르는 기준은?",
    "options": [
      "Pod 이름이 web인 것만 고릅니다",
      "Service와 이미지 이름이 같은 것을 고릅니다",
      "selector와 Pod label이 맞는 것을 고릅니다"
    ],
    "answer": 2,
    "explain": "이름이 아니라 selector·label로 연결합니다. Ready 상태와 EndpointSlice도 함께 확인합니다.",
    "source": "https://kubernetes.io/docs/concepts/services-networking/service/",
    "pre": "이름이 http인 포트와 app: web label을 가진 Deployment가 필요합니다.",
    "file": "service.yaml",
    "lang": "yaml"
  },
  {
    "id": "configmap",
    "title": "설정을 이미지와 분리하기",
    "short": "ConfigMap",
    "tag": "설정",
    "desc": "HTML 파일을 ConfigMap으로 저장하고 나중에 Pod에 마운트합니다. 선언만으로 애플리케이션이 읽는 것은 아닙니다.",
    "code": "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: web-content\n  namespace: k8s-lab\ndata:\n  index.html: |\n    <h1>Hello Kubernetes</h1>\n    <p>ConfigMap connected.</p>",
    "concept": "data.index.html은 키이고 값은 여러 줄 문자열입니다. Deployment의 configMap.name과 volumeMounts를 연결해야 파일로 보입니다. 비밀 값은 넣지 않습니다.",
    "hints": [
      "data 아래 index.html: |를 쓰세요.",
      "HTML 내용은 키보다 두 칸 더 들여씁니다."
    ],
    "cmd": "kubectl -n k8s-lab get configmap web-content",
    "output": "NAME          DATA   AGE\nweb-content   1      10s",
    "question": "ConfigMap 생성만으로 Nginx 웹 페이지가 바뀔까요?",
    "options": [
      "네, 같은 네임스페이스면 자동 변경됩니다",
      "아니요. 볼륨·환경 변수 등으로 연결해야 합니다",
      "네, Deployment 이름이 같으면 됩니다"
    ],
    "answer": 1,
    "explain": "사용하는 Pod가 명시적으로 연결해야 합니다. 연결 실습에서는 볼륨으로 HTML 경로에 마운트합니다.",
    "source": "https://kubernetes.io/docs/concepts/configuration/configmap/",
    "pre": "k8s-lab 네임스페이스가 먼저 있어야 합니다.",
    "file": "configmap.yaml",
    "lang": "yaml"
  },
  {
    "id": "secret",
    "title": "민감 설정을 참조하기",
    "short": "Secret",
    "tag": "설정",
    "desc": "가짜 토큰으로 Secret 참조를 연습합니다. 실제 비밀번호·토큰을 이 웹이나 저장소에 넣지 마세요.",
    "code": "apiVersion: v1\nkind: Secret\nmetadata:\n  name: web-secret\n  namespace: k8s-lab\ntype: Opaque\nstringData:\n  API_TOKEN: demo-only-not-a-real-secret",
    "concept": "stringData는 작성한 문자열을 Secret 데이터로 전달합니다. base64는 암호화가 아닙니다. RBAC와 저장 암호화·외부 비밀 저장소 관리는 별도입니다.",
    "hints": [
      "type은 Opaque입니다.",
      "stringData의 API_TOKEN에는 표시된 가짜 값만 입력하세요."
    ],
    "cmd": "kubectl -n k8s-lab describe secret web-secret",
    "output": "Name: web-secret\nType: Opaque\nData\n====\nAPI_TOKEN: ... bytes",
    "question": "Secret의 base64 표현을 암호화로 봐도 될까요?",
    "options": [
      "네, base64라 복호화할 수 없습니다",
      "네, Secret이면 자동으로 완전 보호됩니다",
      "아니요. 권한·저장 암호화는 별도로 확인합니다"
    ],
    "answer": 2,
    "explain": "Secret 접근 권한을 최소화해야 합니다. describe로 키 정보를 확인하고 실제 값은 로그나 공개 화면에 출력하지 않습니다.",
    "source": "https://kubernetes.io/docs/concepts/configuration/secret/",
    "pre": "k8s-lab 네임스페이스가 먼저 있어야 합니다.",
    "file": "secret.yaml",
    "lang": "yaml"
  },
  {
    "id": "probes",
    "title": "준비 상태와 생존 상태 구분",
    "short": "Probe · Resources",
    "tag": "운영",
    "desc": "받을 준비가 됐는지와 재시작이 필요한지를 구분합니다. CPU·메모리 requests와 limits도 함께 읽습니다.",
    "code": "readinessProbe:\n  httpGet:\n    path: /\n    port: http\n  initialDelaySeconds: 3\n  periodSeconds: 5\nlivenessProbe:\n  httpGet:\n    path: /\n    port: http\n  initialDelaySeconds: 10\n  periodSeconds: 10\nresources:\n  requests:\n    cpu: 100m\n    memory: 64Mi\n  limits:\n    cpu: 250m\n    memory: 128Mi",
    "concept": "이 코드는 독립 리소스가 아니라 containers의 한 항목 내부에 넣는 발췌입니다. readiness 실패는 서비스 대상에서 빠지게 하고, liveness 연속 실패는 컨테이너 재시작으로 이어질 수 있습니다.",
    "hints": [
      "readinessProbe와 livenessProbe는 같은 깊이에 있습니다.",
      "resources.requests와 limits 아래 cpu·memory를 넣습니다."
    ],
    "cmd": "kubectl -n k8s-lab describe pod REPLACE_POD_NAME",
    "output": "Conditions:\n  Ready: True\nContainers:\n  Requests: cpu 100m / memory 64Mi\n  Limits: cpu 250m / memory 128Mi",
    "question": "readinessProbe가 실패하면 곧바로 컨테이너를 재시작할까요?",
    "options": [
      "아니요. 일반적으로 Ready 상태와 서비스 전달 대상에 영향을 줍니다",
      "네, readiness는 재시작용입니다",
      "네, 노드가 종료됩니다"
    ],
    "answer": 0,
    "explain": "재시작 판단은 liveness 등과 구분합니다. 느린 시작에는 startupProbe도 고려합니다.",
    "source": "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
    "pre": "containers[].ports에 http라는 이름이 있어야 합니다. 단독 YAML 파일로 apply하지 않는 발췌입니다.",
    "file": "probes.yaml",
    "lang": "yaml"
  },
  {
    "id": "ingress",
    "title": "호스트와 경로로 요청 보내기",
    "short": "Ingress",
    "tag": "외부 경로",
    "desc": "호스트 web.local의 / 요청을 web Service의 80번 포트로 연결합니다. 규칙과 실제 처리 컨트롤러는 다릅니다.",
    "code": "apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: web\n  namespace: k8s-lab\nspec:\n  ingressClassName: lab-controller\n  rules:\n    - host: web.local\n      http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend:\n              service:\n                name: web\n                port:\n                  number: 80",
    "concept": "lab-controller는 학습용 이름입니다. 실제 IngressClass와 호환되는 관리 중인 컨트롤러가 필요합니다. Ingress 객체만 생성해서 외부 연결이 되지는 않습니다.",
    "hints": [
      "backend.service.name: web과 port.number: 80을 연결합니다.",
      "pathType: Prefix를 빠뜨리지 마세요."
    ],
    "cmd": "kubectl -n k8s-lab describe ingress web",
    "output": "Rules:\n  Host       Path   Backends\n  web.local  /      web:80 (...)",
    "question": "Ingress만 apply하면 항상 외부 접속이 될까요?",
    "options": [
      "네, LoadBalancer가 자동 생성됩니다",
      "아니요. 컨트롤러·Class·접속 경로·호스트 설정이 필요합니다",
      "네, Service가 있으면 충분합니다"
    ],
    "answer": 1,
    "explain": "컨트롤러 구현과 네트워크 환경에 따라 외부 경로가 달라집니다. 신규 설계는 Gateway API도 검토하세요.",
    "source": "https://kubernetes.io/docs/concepts/services-networking/ingress/",
    "pre": "web Service가 필요합니다. 실제 사용 전 lab-controller를 설치된 IngressClass로 바꿉니다. 은퇴한 ingress-nginx 신규 설치를 안내하지 않습니다.",
    "file": "ingress.yaml",
    "lang": "yaml"
  },
  {
    "id": "hpa",
    "title": "부하에 맞춰 Pod 수 조정",
    "short": "HPA",
    "tag": "확장",
    "desc": "CPU 사용량을 기준으로 Deployment의 Pod 수를 조정합니다. metrics와 CPU requests가 왜 필요한지 알아봅니다.",
    "code": "apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata:\n  name: web\n  namespace: k8s-lab\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: web\n  minReplicas: 2\n  maxReplicas: 4\n  metrics:\n    - type: Resource\n      resource:\n        name: cpu\n        target:\n          type: Utilization\n          averageUtilization: 60",
    "concept": "averageUtilization은 CPU requests 대비 사용률입니다. 이 예제는 2~4개로 web Deployment를 조정합니다. 노드 자체를 늘리는 기능과 다릅니다.",
    "hints": [
      "scaleTargetRef는 apps/v1 Deployment web입니다.",
      "autoscaling/v2의 metrics.resource.target 아래 averageUtilization을 씁니다."
    ],
    "cmd": "kubectl -n k8s-lab get hpa web",
    "output": "NAME   REFERENCE        TARGETS   MINPODS   MAXPODS\nweb    Deployment/web   10%/60%   2         4",
    "question": "TARGETS가 <unknown>이면 먼저 무엇을 볼까요?",
    "options": [
      "이미지 이름을 바꿉니다",
      "Ingress 주소를 바꿉니다",
      "Metrics API와 컨테이너 CPU requests를 확인합니다"
    ],
    "answer": 2,
    "explain": "Metrics Server 등 지표 제공 경로와 CPU requests가 필요합니다. HPA는 노드 부족 문제를 자동으로 모두 해결하지 않습니다.",
    "source": "https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/",
    "pre": "web Deployment, CPU requests, Metrics API가 필요합니다. HPA 사용 중 replicas를 계속 수동 관리하면 충돌할 수 있습니다.",
    "file": "hpa.yaml",
    "lang": "yaml"
  },
  {
    "id": "pvc",
    "title": "Pod와 저장 수명 분리",
    "short": "PVC",
    "tag": "저장",
    "desc": "필요한 저장 공간을 PVC로 요청합니다. Pod 삭제와 실제 볼륨 삭제를 같은 것으로 보지 마세요.",
    "code": "apiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: web-data\n  namespace: k8s-lab\nspec:\n  accessModes:\n    - ReadWriteOnce\n  resources:\n    requests:\n      storage: 1Gi",
    "concept": "이 예제는 기본 StorageClass를 사용합니다. 동적 프로비저너가 없으면 Pending일 수 있습니다. PVC를 Pod의 volume으로 마운트해야 애플리케이션이 사용합니다.",
    "hints": [
      "accessModes는 목록이며 ReadWriteOnce입니다.",
      "resources.requests.storage: 1Gi를 씁니다."
    ],
    "cmd": "kubectl -n k8s-lab get pvc web-data",
    "output": "NAME       STATUS   VOLUME     CAPACITY   ACCESS MODES\nweb-data   Bound    pvc-...    1Gi        RWO",
    "question": "PVC를 삭제하면 데이터는 언제나 안전하게 남을까요?",
    "options": [
      "네, PVC는 설정일 뿐입니다",
      "아니요. PV reclaimPolicy·스토리지 구현을 확인해야 합니다",
      "네, Pod가 Running이면 남습니다"
    ],
    "answer": 1,
    "explain": "볼륨 정리 정책에 따라 실제 데이터가 삭제될 수 있습니다. 실습 종료 전에 데이터 보관 필요성을 먼저 판단합니다.",
    "source": "https://kubernetes.io/docs/concepts/storage/persistent-volumes/",
    "pre": "기본 StorageClass 또는 직접 준비한 PV가 필요합니다. 기본 연결 앱은 PVC를 만들지 않습니다.",
    "file": "pvc.yaml",
    "lang": "yaml"
  }
];
const KUBE_CONNECTIONS = [
  {
    "id": "namespace",
    "title": "Namespace",
    "code": "apiVersion: v1\nkind: Namespace\nmetadata:\n  name: k8s-lab",
    "needs": [
      "사용할 context"
    ],
    "gives": [
      "k8s-lab"
    ],
    "link": "나머지 리소스는 모두 metadata.namespace: k8s-lab을 사용합니다.",
    "check": "kubectl get namespace k8s-lab → Active",
    "trap": "다른 실습 리소스가 없는 전용 네임스페이스인지 확인합니다.",
    "lang": "yaml",
    "file": "namespace.yaml"
  },
  {
    "id": "configmap",
    "title": "ConfigMap",
    "code": "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: web-content\n  namespace: k8s-lab\ndata:\n  index.html: |\n    <h1>Hello Kubernetes</h1>\n    <p>ConfigMap connected.</p>",
    "needs": [
      "k8s-lab"
    ],
    "gives": [
      "web-content / index.html"
    ],
    "link": "Deployment의 volumes[].configMap.name이 web-content를 참조합니다.",
    "check": "kubectl -n k8s-lab get cm web-content → DATA 1",
    "trap": "이 파일의 내용을 바꾸면 페이지가 바뀝니다. 민감 값은 넣지 않습니다.",
    "lang": "yaml",
    "file": "configmap.yaml"
  },
  {
    "id": "secret",
    "title": "Secret",
    "code": "apiVersion: v1\nkind: Secret\nmetadata:\n  name: web-secret\n  namespace: k8s-lab\ntype: Opaque\nstringData:\n  API_TOKEN: demo-only-not-a-real-secret",
    "needs": [
      "k8s-lab"
    ],
    "gives": [
      "web-secret / API_TOKEN"
    ],
    "link": "Deployment의 secretKeyRef.name·key로 가짜 토큰을 주입합니다.",
    "check": "kubectl -n k8s-lab describe secret web-secret → 키 이름 확인",
    "trap": "토큰 주입은 학습용입니다. Nginx가 API_TOKEN으로 인증을 수행하지 않으며 실제 자격 증명은 사용하지 않습니다.",
    "lang": "yaml",
    "file": "secret.yaml"
  },
  {
    "id": "deployment",
    "title": "Deployment + Probe",
    "code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\n  namespace: k8s-lab\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: web\n  template:\n    metadata:\n      labels:\n        app: web\n    spec:\n      automountServiceAccountToken: false\n      containers:\n        - name: web\n          image: nginx:1.28-alpine\n          ports:\n            - name: http\n              containerPort: 80\n          env:\n            - name: API_TOKEN\n              valueFrom:\n                secretKeyRef:\n                  name: web-secret\n                  key: API_TOKEN\n          volumeMounts:\n            - name: content\n              mountPath: /usr/share/nginx/html\n              readOnly: true\n          readinessProbe:\n            httpGet:\n              path: /\n              port: http\n            initialDelaySeconds: 3\n            periodSeconds: 5\n          livenessProbe:\n            httpGet:\n              path: /\n              port: http\n            initialDelaySeconds: 10\n            periodSeconds: 10\n          resources:\n            requests:\n              cpu: 100m\n              memory: 64Mi\n            limits:\n              cpu: 250m\n              memory: 128Mi\n      volumes:\n        - name: content\n          configMap:\n            name: web-content",
    "needs": [
      "ConfigMap: web-content",
      "Secret: web-secret"
    ],
    "gives": [
      "label app=web인 Pod 2개",
      "http라는 이름의 80번 포트"
    ],
    "link": "ConfigMap → volume → mountPath, Secret → env, label → Service의 연결을 한 번에 읽습니다.",
    "check": "kubectl -n k8s-lab rollout status deployment/web → rollout 성공",
    "trap": "ConfigMap·Secret이 같은 네임스페이스에 있어야 합니다. 이 기본 학습용 Nginx 예제는 운영 보안 강화를 별도 설계해야 합니다.",
    "lang": "yaml",
    "file": "deployment.yaml"
  },
  {
    "id": "service",
    "title": "Service",
    "code": "apiVersion: v1\nkind: Service\nmetadata:\n  name: web\n  namespace: k8s-lab\nspec:\n  type: ClusterIP\n  selector:\n    app: web\n  ports:\n    - name: http\n      port: 80\n      targetPort: http",
    "needs": [
      "Pod label: app=web",
      "container port name: http"
    ],
    "gives": [
      "Service web:80",
      "Ready 대상 EndpointSlice"
    ],
    "link": "selector.app: web → Pod label, targetPort: http → containerPort: 80을 연결합니다.",
    "check": "kubectl -n k8s-lab get endpointslices -l kubernetes.io/service-name=web",
    "trap": "이름이 같아서 연결되는 것이 아닙니다. label과 named port가 핵심입니다.",
    "lang": "yaml",
    "file": "service.yaml"
  },
  {
    "id": "access",
    "title": "localhost로 접속",
    "code": "kubectl -n k8s-lab port-forward service/web 8080:80",
    "needs": [
      "Service web:80",
      "Ready Pod"
    ],
    "gives": [
      "http://127.0.0.1:8080"
    ],
    "link": "로컬 8080 → 선택된 Pod의 서비스 대상 포트로 port-forward합니다. 클러스터 외부 경로 없이 페이지부터 검증합니다.",
    "check": "터미널을 켜 둔 채 127.0.0.1:8080 접속 → Hello Kubernetes",
    "trap": "port-forward는 Service의 모든 네트워크 경로를 검증하지 않습니다. 해당 Pod가 교체되면 연결을 다시 실행해야 할 수 있습니다.",
    "lang": "shell",
    "file": "access.sh"
  },
  {
    "id": "ingress",
    "title": "Ingress는 선택 확장",
    "code": "apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: web\n  namespace: k8s-lab\nspec:\n  ingressClassName: lab-controller\n  rules:\n    - host: web.local\n      http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend:\n              service:\n                name: web\n                port:\n                  number: 80",
    "needs": [
      "Service web:80",
      "설치된 controller / IngressClass"
    ],
    "gives": [
      "web.local / → web:80"
    ],
    "link": "HTTP 요청은 외부 controller → Ingress 규칙 → Service → Ready Pod 순서로 연결됩니다.",
    "check": "kubectl get ingressclass → 실제 class 확인 후 규칙 적용",
    "trap": "lab-controller는 예시 이름입니다. controller 설치·DNS/hosts·접속 경로는 별도이며 기본 앱 파일에 Ingress를 포함하지 않습니다.",
    "lang": "yaml",
    "file": "ingress.yaml"
  },
  {
    "id": "operations",
    "title": "상태·변경·복구 확인",
    "code": "kubectl -n k8s-lab get pods -l app=web\nkubectl -n k8s-lab rollout status deployment/web\nkubectl -n k8s-lab logs deployment/web --tail=30",
    "needs": [
      "배포한 web Deployment"
    ],
    "gives": [
      "Pod 상태",
      "rollout 결과",
      "애플리케이션 로그"
    ],
    "link": "get → describe/events → logs → selector/EndpointSlice 순서로 증거를 좁힙니다.",
    "check": "Running·READY·restart 수와 실제 응답을 따로 확인",
    "trap": "Running이 곧 Ready는 아닙니다. rollout undo는 ConfigMap·Secret 등 모든 리소스를 함께 되돌리지 않습니다.",
    "lang": "shell",
    "file": "operations.sh"
  }
];
const KUBE_CASES = [
  {
    "id": "selector",
    "title": "Service에 대상이 없어요",
    "symptom": "Deployment는 Ready인데 Service의 EndpointSlice에 대상이 없습니다.",
    "command": "kubectl -n k8s-lab get pods --show-labels",
    "alternatives": [
      "kubectl -n k8s-lab get pods -l app=web --show-labels"
    ],
    "output": "NAME            READY   STATUS    LABELS\nweb-abc-123     1/1     Running   app=web",
    "options": [
      "Service의 selector와 Pod label을 비교한다",
      "Pod 이름을 Service 이름으로 바꾼다",
      "Ingress부터 삭제한다"
    ],
    "answer": 0,
    "explain": "Service selector, Pod label, Ready 상태와 EndpointSlice를 순서대로 봅니다."
  },
  {
    "id": "image",
    "title": "ImagePullBackOff",
    "symptom": "새 Pod가 ImagePullBackOff로 멈췄습니다. 구체적인 pull 실패 이벤트를 확인하려고 합니다.",
    "command": "kubectl -n k8s-lab describe pod web-demo",
    "output": "Events:\nWarning  Failed  Failed to pull image \"nginx:bad-tag\"\nWarning  Failed  Error: ImagePullBackOff",
    "options": [
      "Service port를 바꾼다",
      "이미지 이름·태그·레지스트리 접근과 인증을 확인한다",
      "replicas를 무조건 늘린다"
    ],
    "answer": 1,
    "explain": "Events의 실제 오류를 확인합니다. 이미지 오타, 인증, 네트워크, 플랫폼 등을 구분하세요. web-demo는 이 사례의 가상 Pod 이름입니다."
  },
  {
    "id": "crash",
    "title": "CrashLoopBackOff",
    "symptom": "컨테이너가 반복 재시작합니다. 직전 종료된 컨테이너의 로그를 보려고 합니다.",
    "command": "kubectl -n k8s-lab logs web-demo --previous",
    "output": "nginx: [emerg] invalid configuration\ncontainer terminated, restarting...",
    "options": [
      "PV를 삭제한다",
      "Secret 내용을 공개 로그에 출력한다",
      "이전 로그와 종료 원인·설정을 확인한다"
    ],
    "answer": 2,
    "explain": "--previous는 직전 컨테이너 인스턴스 로그를 확인합니다. describe의 종료 상태·exit code도 함께 봅니다."
  },
  {
    "id": "pending",
    "title": "Pod가 Pending이에요",
    "symptom": "스케줄되지 않는 Pod의 이벤트에서 원인을 찾으려고 합니다.",
    "command": "kubectl -n k8s-lab describe pod web-demo",
    "output": "Events:\nWarning  FailedScheduling  0/1 nodes are available:\n1 Insufficient cpu.",
    "options": [
      "requests와 노드 가용 자원을 확인한다",
      "IngressClass만 바꾼다",
      "livenessProbe를 제거한다"
    ],
    "answer": 0,
    "explain": "Pending은 CPU 부족 외에도 taint, affinity, PVC 등 원인이 다양합니다. 이벤트의 이유를 먼저 확인합니다."
  },
  {
    "id": "hpa",
    "title": "HPA TARGETS가 unknown",
    "symptom": "HPA에 CPU 값이 나타나지 않습니다. 먼저 Pod 지표를 조회합니다.",
    "command": "kubectl -n k8s-lab top pods",
    "output": "error: Metrics API not available",
    "options": [
      "replicas를 100으로 설정한다",
      "Metrics API 제공 상태와 CPU requests를 확인한다",
      "Secret을 다시 만든다"
    ],
    "answer": 1,
    "explain": "Metrics Server 등 지표 제공 경로와 컨테이너 CPU requests가 필요합니다. minikube의 metrics-server addon은 선택 확장입니다."
  },
  {
    "id": "rollout",
    "title": "새 버전 배포가 완료되지 않아요",
    "symptom": "Deployment의 롤아웃 진행 상태를 확인하려고 합니다.",
    "command": "kubectl -n k8s-lab rollout status deployment/web",
    "output": "Waiting for deployment \"web\" rollout to finish:\n1 out of 2 new replicas have been updated...",
    "options": [
      "기다리면 언제나 성공하므로 조사하지 않는다",
      "네임스페이스를 바로 삭제한다",
      "새 Pod의 이벤트·Readiness·로그를 확인한다"
    ],
    "answer": 2,
    "explain": "롤아웃 지연은 새 Pod 상태를 조사합니다. 이전 revision이 있는 경우 검토 후 undo할 수 있으나 외부 설정까지 자동 복구되지 않습니다."
  }
];
const KUBE_APP = "apiVersion: v1\nkind: Namespace\nmetadata:\n  name: k8s-lab\n---\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: web-content\n  namespace: k8s-lab\ndata:\n  index.html: |\n    <h1>Hello Kubernetes</h1>\n    <p>ConfigMap connected.</p>\n---\napiVersion: v1\nkind: Secret\nmetadata:\n  name: web-secret\n  namespace: k8s-lab\ntype: Opaque\nstringData:\n  API_TOKEN: demo-only-not-a-real-secret\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\n  namespace: k8s-lab\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: web\n  template:\n    metadata:\n      labels:\n        app: web\n    spec:\n      automountServiceAccountToken: false\n      containers:\n        - name: web\n          image: nginx:1.28-alpine\n          ports:\n            - name: http\n              containerPort: 80\n          env:\n            - name: API_TOKEN\n              valueFrom:\n                secretKeyRef:\n                  name: web-secret\n                  key: API_TOKEN\n          volumeMounts:\n            - name: content\n              mountPath: /usr/share/nginx/html\n              readOnly: true\n          readinessProbe:\n            httpGet:\n              path: /\n              port: http\n            initialDelaySeconds: 3\n            periodSeconds: 5\n          livenessProbe:\n            httpGet:\n              path: /\n              port: http\n            initialDelaySeconds: 10\n            periodSeconds: 10\n          resources:\n            requests:\n              cpu: 100m\n              memory: 64Mi\n            limits:\n              cpu: 250m\n              memory: 128Mi\n      volumes:\n        - name: content\n          configMap:\n            name: web-content\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: web\n  namespace: k8s-lab\nspec:\n  type: ClusterIP\n  selector:\n    app: web\n  ports:\n    - name: http\n      port: 80\n      targetPort: http\n";
