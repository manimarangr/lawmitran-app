# Elastic IP associated to an instance, so the public IP survives stop/start
# and DNS never breaks.

resource "aws_eip" "this" {
  domain   = "vpc"
  instance = var.instance_id
  tags     = merge(var.tags, { Name = "${var.name}-eip" })
}
