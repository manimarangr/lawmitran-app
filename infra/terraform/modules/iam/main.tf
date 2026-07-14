# EC2 instance role + profile granting: SSM (keyless access), CloudWatch agent,
# and read/write to the backups bucket. Least-privilege starting point.

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "this" {
  name               = "${var.name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = var.tags
}

# SSM Session Manager (keyless SSH alternative)
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch agent (metrics + logs)
resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Scoped access to the backups bucket
data "aws_iam_policy_document" "backups" {
  count = var.backups_bucket_arn != null ? 1 : 0
  statement {
    actions   = ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"]
    resources = [var.backups_bucket_arn, "${var.backups_bucket_arn}/*"]
  }
}

resource "aws_iam_role_policy" "backups" {
  count  = var.backups_bucket_arn != null ? 1 : 0
  name   = "${var.name}-backups"
  role   = aws_iam_role.this.id
  policy = data.aws_iam_policy_document.backups[0].json
}

resource "aws_iam_instance_profile" "this" {
  name = "${var.name}-ec2-profile"
  role = aws_iam_role.this.name
}
