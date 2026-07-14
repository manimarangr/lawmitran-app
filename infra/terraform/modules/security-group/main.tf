# Web-tier security group: 80/443 public, 22 restricted.
# Database/cache/storage ports are intentionally NOT opened — they bind to the
# Docker network only. See docs/devops/05-security-groups.md.

resource "aws_security_group" "web" {
  name        = "${var.name}-web"
  description = "LawMitran web tier (${var.name})"
  vpc_id      = var.vpc_id
  tags        = merge(var.tags, { Name = "${var.name}-web" })

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description = "HTTP (redirect + ACME challenge)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description = "SSH (restricted to admin CIDRs)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.admin_cidrs
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}
