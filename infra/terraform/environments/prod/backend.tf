# Remote state for the PRODUCTION environment (separate key from shared).
# Create the bucket/table first via ../../bootstrap.
terraform {
  backend "s3" {
    bucket         = "lawmitran-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "lawmitran-tf-locks"
    encrypt        = true
  }
}
