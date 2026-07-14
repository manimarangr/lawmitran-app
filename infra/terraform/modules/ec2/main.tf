# EC2 instance running Ubuntu 24.04 LTS, with an optional dedicated data volume
# for Postgres/MinIO. Docker + app stack are provisioned via user_data / config
# management, not Terraform (Terraform owns infra only).

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "this" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  key_name               = var.key_name
  iam_instance_profile   = var.iam_instance_profile
  user_data              = var.user_data

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
    encrypted   = true
  }

  metadata_options {
    http_tokens = "required" # IMDSv2
  }

  tags = merge(var.tags, { Name = var.name })
}

# Optional dedicated data volume (Postgres + MinIO)
resource "aws_ebs_volume" "data" {
  count             = var.data_volume_size > 0 ? 1 : 0
  availability_zone = aws_instance.this.availability_zone
  size              = var.data_volume_size
  type              = "gp3"
  encrypted         = true
  tags              = merge(var.tags, { Name = "${var.name}-data" })
}

resource "aws_volume_attachment" "data" {
  count       = var.data_volume_size > 0 ? 1 : 0
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.data[0].id
  instance_id = aws_instance.this.id
}
