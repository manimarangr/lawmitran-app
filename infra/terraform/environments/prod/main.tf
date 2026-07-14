# PRODUCTION environment: dedicated EC2 box running the lawmitran-prod stack.
# DNS covers the apex, www, and api — all pointing at this box's EIP.

locals {
  name = "lawmitran-prod"
}

module "vpc" {
  source             = "../../modules/vpc"
  name               = local.name
  cidr_block         = "10.20.0.0/16"
  availability_zones = ["ap-south-1a"]
}

module "security_group" {
  source      = "../../modules/security-group"
  name        = local.name
  vpc_id      = module.vpc.vpc_id
  admin_cidrs = var.admin_cidrs
}

module "backups" {
  source      = "../../modules/s3-backups"
  bucket_name = "lawmitran-backups-prod"
}

module "iam" {
  source             = "../../modules/iam"
  name               = local.name
  backups_bucket_arn = module.backups.bucket_arn
}

module "ec2" {
  source               = "../../modules/ec2"
  name                 = local.name
  instance_type        = var.instance_type
  subnet_id            = module.vpc.public_subnet_id
  security_group_id    = module.security_group.security_group_id
  key_name             = var.key_name
  iam_instance_profile = module.iam.instance_profile_name
  root_volume_size     = 50
  data_volume_size     = 100
}

module "eip" {
  source      = "../../modules/eip"
  name        = local.name
  instance_id = module.ec2.instance_id
}

module "dns" {
  source    = "../../modules/route53"
  zone_name = var.zone_name
  records = {
    "lawmitran.com"     = module.eip.public_ip
    "www.lawmitran.com" = module.eip.public_ip
    "api.lawmitran.com" = module.eip.public_ip
  }
}

module "cloudwatch" {
  source      = "../../modules/cloudwatch"
  name        = local.name
  instance_id = module.ec2.instance_id
  alert_email = var.alert_email
}
