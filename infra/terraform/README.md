# LawMitran — Terraform Infrastructure

Infrastructure-as-code for the LawMitran AWS environment. Terraform manages **infrastructure** (VPC, EC2, EIP, security groups, Route 53, IAM, backup buckets, CloudWatch). It does **not** manage the application stack — the app runs via Docker Compose on the instances (see [`docs/devops/`](../../docs/devops/README.md)).

## Structure

```
infra/terraform/
├── bootstrap/              # run ONCE — creates remote-state S3 bucket + DynamoDB lock table
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── versions.tf
├── modules/               # reusable building blocks
│   ├── vpc/
│   ├── security-group/
│   ├── ec2/
│   ├── eip/
│   ├── route53/
│   ├── iam/
│   ├── s3-backups/
│   └── cloudwatch/
└── environments/          # one root module per environment (own state)
    ├── shared/            # the Dev + QA EC2 box (two Docker Compose stacks on it)
    └── prod/              # the dedicated Production EC2 box
```

## Why this layout (vs. dev/qa/prod)

Your **Dev and QA share a single EC2 box** — they're isolated Docker Compose *projects*, not separate infrastructure. Terraform provisions the box once. So the infra environments are:

| Terraform env | Provisions | App stacks running on it |
|---|---|---|
| `shared` | Dev+QA EC2, its EIP, dev/qa DNS records | `lawmitran-dev`, `lawmitran-qa` |
| `prod` | Production EC2, its EIP, prod DNS records | `lawmitran-prod` |

If QA later moves to its own box, add an `environments/qa/` root module — the modules don't change.

## State management

Each environment keeps its **own** remote state (isolation between shared and prod). State lives in an S3 bucket with DynamoDB locking, created by `bootstrap/` first.

```
s3://lawmitran-tfstate/
├── shared/terraform.tfstate
└── prod/terraform.tfstate
```

Each env's `backend.tf` sets a distinct `key`.

## Usage

```bash
# 0. One-time: create the state backend
cd bootstrap
terraform init && terraform apply       # creates lawmitran-tfstate bucket + lock table

# 1. Shared (Dev + QA) environment
cd ../environments/shared
cp terraform.tfvars.example terraform.tfvars   # fill in values
terraform init
terraform plan
terraform apply

# 2. Production environment
cd ../prod
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

## Conventions

- Region: `ap-south-1`. Provider: `hashicorp/aws ~> 5.0`. Terraform `>= 1.6`.
- `terraform.tfvars` and `*.auto.tfvars` are git-ignored (they hold IPs, key names). Commit only `*.example`.
- Everything is tagged (`Project=LawMitran`, `Environment`, `ManagedBy=Terraform`).
- Secrets (DB/JWT/MinIO passwords) are **not** in Terraform — they live in the on-box `.env` ([env-vars doc](../../docs/devops/10-environment-variables.md)). Terraform only provisions infra.

## Future migration path

The module set is designed to grow into the managed-services architecture ([AWS infra doc](../../docs/devops/02-aws-infrastructure.md)). Add modules as you adopt them:

`rds/` · `elasticache/` · `alb/` · `ecs/` (or `eks/`) · `cloudfront/` · `autoscaling/`

Each slots into the existing environments without restructuring.
