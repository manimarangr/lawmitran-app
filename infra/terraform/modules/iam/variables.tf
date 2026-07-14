variable "name" {
  description = "Name prefix"
  type        = string
}

variable "backups_bucket_arn" {
  description = "ARN of the backups bucket to grant access to (null to skip)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
