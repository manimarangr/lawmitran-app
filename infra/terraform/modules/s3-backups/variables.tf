variable "bucket_name" {
  description = "Globally-unique backups bucket name"
  type        = string
}

variable "retention_days" {
  description = "Days to keep non-current backup versions"
  type        = number
  default     = 90
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
