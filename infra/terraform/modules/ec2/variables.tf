variable "name" {
  description = "Instance Name tag"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "subnet_id" {
  description = "Public subnet to launch in"
  type        = string
}

variable "security_group_id" {
  description = "Web security group id"
  type        = string
}

variable "key_name" {
  description = "EC2 key pair name for SSH"
  type        = string
}

variable "iam_instance_profile" {
  description = "IAM instance profile name (SSM, CloudWatch, backups)"
  type        = string
  default     = null
}

variable "user_data" {
  description = "Cloud-init user data (base packages, Docker)"
  type        = string
  default     = null
}

variable "root_volume_size" {
  description = "Root EBS size (GB)"
  type        = number
  default     = 40
}

variable "data_volume_size" {
  description = "Dedicated data volume size (GB). 0 disables it."
  type        = number
  default     = 50
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
