output "public_ip" {
  description = "Elastic IP of the production box"
  value       = module.eip.public_ip
}

output "instance_id" {
  value = module.ec2.instance_id
}

output "backups_bucket" {
  value = module.backups.bucket_name
}

output "dns_records" {
  value = module.dns.record_names
}
