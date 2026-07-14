variable "name" {
  description = "Name prefix"
  type        = string
}

variable "vpc_id" {
  description = "VPC to create the security group in"
  type        = string
}

variable "admin_cidrs" {
  description = "CIDRs allowed to SSH (office/VPN). Keep tight."
  type        = list(string)
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
