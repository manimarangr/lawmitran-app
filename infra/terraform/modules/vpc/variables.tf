variable "name" {
  description = "Name prefix for VPC resources"
  type        = string
}

variable "cidr_block" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AZs to create public subnets in"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
