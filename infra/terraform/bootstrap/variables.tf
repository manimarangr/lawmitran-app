variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform remote state"
  type        = string
  default     = "lawmitran-tfstate"
}

variable "lock_table_name" {
  description = "DynamoDB table name for state locking"
  type        = string
  default     = "lawmitran-tf-locks"
}
