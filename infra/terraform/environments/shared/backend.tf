# Remote state for the SHARED (Dev + QA) environment.
# Create the bucket/table first via ../../bootstrap.
terraform {
  backend "s3" {
    bucket         = "lawmitran-tfstate"
    key            = "shared/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "lawmitran-tf-locks"
    encrypt        = true
  }
}
