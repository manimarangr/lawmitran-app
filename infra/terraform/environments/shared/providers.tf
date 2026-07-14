provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "LawMitran"
      Environment = "shared"
      ManagedBy   = "Terraform"
    }
  }
}
