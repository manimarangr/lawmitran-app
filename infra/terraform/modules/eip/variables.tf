variable "name" {
  description = "Name prefix"
  type        = string
}

variable "instance_id" {
  description = "Instance to associate the EIP with"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
