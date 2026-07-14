variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "admin_cidrs" {
  description = "CIDRs allowed to SSH (office/VPN)"
  type        = list(string)
}

variable "key_name" {
  description = "EC2 key pair name"
  type        = string
}

variable "instance_type" {
  description = "Shared box size (hosts dev + qa stacks)"
  type        = string
  default     = "t3.medium"
}

variable "zone_name" {
  type    = string
  default = "lawmitran.com"
}

variable "alert_email" {
  description = "Email for CloudWatch alarms"
  type        = string
  default     = null
}
