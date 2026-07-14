variable "name" {
  description = "Name prefix"
  type        = string
}

variable "instance_id" {
  description = "EC2 instance to alarm on"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention"
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email for SNS alarm notifications (null to skip)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
